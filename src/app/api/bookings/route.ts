import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { slot_id, name, email } = body;

    // Basic validation
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

    const slot = await prisma.slot.findUnique({
      where: { id: slot_id },
    });

    if (!slot) {
      return Response.json({ error: "Slot not found" }, { status: 404 });
    }

    // Don't allow booking a slot that has already started
    if (slot.start <= new Date()) {
      return Response.json(
        { error: "Cannot book a slot that has already started" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.create({
      data: {
        slotId: slot_id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        status: "confirmed",
      },
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
    console.error("Booking error:", error);

    return Response.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
