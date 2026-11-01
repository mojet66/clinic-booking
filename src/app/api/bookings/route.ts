import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";
import { createHash } from "crypto";

export async function POST(request: Request) {
  const authError = requireApiKey(request);

  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();

    const { slot_id, name, email } = body;

    // Rate limit booking attempts by email
    const rateLimitEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";

    if (rateLimitEmail) {
      const rateLimitResult = await prisma.$transaction(async (tx) => {
        // Serialize requests for the same email address
        await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtext(${rateLimitEmail})::bigint
      )
    `;

        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60_000);

        const recentAttempts = await tx.bookingAttempt.findMany({
          where: {
            email: rateLimitEmail,
            createdAt: {
              gte: oneMinuteAgo,
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 5,
        });

        if (recentAttempts.length >= 5) {
          const oldestAttempt = recentAttempts[0];

          const retryAfter = Math.max(
            1,
            Math.ceil(
              (oldestAttempt.createdAt.getTime() + 60_000 - now.getTime()) /
                1000,
            ),
          );

          return { limited: true, retryAfter };
        }

        await tx.bookingAttempt.create({
          data: {
            email: rateLimitEmail,
          },
        });

        return { limited: false, retryAfter: 0 };
      });

      if (rateLimitResult.limited) {
        return Response.json(
          { error: "Too many booking attempts. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateLimitResult.retryAfter),
            },
          },
        );
      }
    }

    const idempotencyKey = request.headers.get("Idempotency-Key");

    const requestHash = createHash("sha256")
      .update(JSON.stringify(body))
      .digest("hex");

    if (idempotencyKey) {
      const existing = await prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });

      if (existing) {
        if (existing.requestHash !== requestHash) {
          return Response.json(
            {
              error:
                "Idempotency-Key was already used with a different request body",
            },
            { status: 422 },
          );
        }

        return Response.json(existing.responseBody, {
          status: existing.statusCode,
        });
      }
    }

    if (
      !Number.isInteger(slot_id) ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return Response.json(
        { error: "slot_id, name and email are required" },
        { status: 400 },
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const booking = await prisma.$transaction(async (tx) => {
      // Lock this slot for the duration of this transaction.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${slot_id})`;

      const slot = await tx.slot.findUnique({
        where: { id: slot_id },
      });

      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      if (slot.start <= new Date()) {
        throw new Error("SLOT_STARTED");
      }

      const existingBooking = await tx.booking.findFirst({
        where: {
          slotId: slot_id,
          status: "confirmed",
        },
      });

      if (existingBooking) {
        throw new Error("SLOT_BOOKED");
      }

      return tx.booking.create({
        data: {
          slotId: slot_id,
          name: normalizedName,
          email: normalizedEmail,
          status: "confirmed",
        },
      });
    });

    const responseBody = {
      id: booking.id,
      slot_id: booking.slotId,
      name: booking.name,
      email: booking.email,
      status: booking.status,
      created_at: booking.createdAt,
    };

    if (idempotencyKey) {
      await prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          requestHash,
          statusCode: 201,
          responseBody,
        },
      });
    }

    return Response.json(responseBody, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SLOT_NOT_FOUND") {
        return Response.json({ error: "Slot not found" }, { status: 404 });
      }

      if (error.message === "SLOT_STARTED") {
        return Response.json(
          { error: "Cannot book a slot that has already started" },
          { status: 400 },
        );
      }

      if (error.message === "SLOT_BOOKED") {
        return Response.json(
          { error: "Slot is already booked" },
          { status: 409 },
        );
      }
    }

    console.error("Booking error:", error);

    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const authError = requireApiKey(request);

  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);

  const email = searchParams.get("email")?.trim();

  if (!email) {
    return Response.json({ error: "Email is required" }, { status: 400 });
  }

  const limitParam = searchParams.get("limit");
  const limit = limitParam === null ? 10 : Number(limitParam);

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return Response.json(
      { error: "Limit must be between 1 and 50" },
      { status: 400 },
    );
  }

  let cursor: { id: number; createdAt: string } | null = null;
  const cursorParam = searchParams.get("cursor");

  if (cursorParam) {
    try {
      cursor = JSON.parse(
        Buffer.from(cursorParam, "base64url").toString("utf8"),
      );

      if (
        !Number.isInteger(cursor?.id) ||
        typeof cursor?.createdAt !== "string" ||
        Number.isNaN(new Date(cursor.createdAt).getTime())
      ) {
        throw new Error("Invalid cursor");
      }
    } catch {
      return Response.json({ error: "Invalid cursor" }, { status: 400 });
    }
  }

  const bookings = await prisma.booking.findMany({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
      ...(cursor
        ? {
            OR: [
              {
                createdAt: {
                  gt: new Date(cursor.createdAt),
                },
              },
              {
                createdAt: new Date(cursor.createdAt),
                id: { gt: cursor.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
  });

  const hasMore = bookings.length > limit;
  const results = hasMore ? bookings.slice(0, limit) : bookings;

  const lastBooking = results[results.length - 1];

  const nextCursor =
    hasMore && lastBooking
      ? Buffer.from(
          JSON.stringify({
            id: lastBooking.id,
            createdAt: lastBooking.createdAt.toISOString(),
          }),
        ).toString("base64url")
      : null;

  return Response.json({
    bookings: results.map((booking) => ({
      id: booking.id,
      slot_id: booking.slotId,
      name: booking.name,
      email: booking.email,
      status: booking.status,
      created_at: booking.createdAt,
    })),
    next_cursor: nextCursor,
  });
}
