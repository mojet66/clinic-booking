import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookingId = Number(id);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return Response.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  return Response.json({
    id: booking.id,
    slot_id: booking.slotId,
    name: booking.name,
    email: booking.email,
    status: booking.status,
    created_at: booking.createdAt,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const bookingId = Number(id);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return Response.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return Response.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status === "cancelled") {
    return Response.json(
      { error: "Booking is already cancelled" },
      { status: 409 },
    );
  }

  const cancelledBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  });

  return Response.json({
    id: cancelledBooking.id,
    slot_id: cancelledBooking.slotId,
    name: cancelledBooking.name,
    email: cancelledBooking.email,
    status: cancelledBooking.status,
    created_at: cancelledBooking.createdAt,
  });
}
