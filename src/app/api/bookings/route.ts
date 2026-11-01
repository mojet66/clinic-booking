import { prisma } from "@/lib/prisma";
import { requireApiKey } from "@/lib/auth";

export async function POST(request: Request) {
  const authError = requireApiKey(request);

  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();

    const { slot_id, name, email } = body;

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

    return Response.json(
      {
        id: booking.id,
        slot_id: booking.slotId,
        name: booking.name,
        email: booking.email,
        status: booking.status,
        created_at: booking.createdAt,
      },
      { status: 201 },
    );
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
