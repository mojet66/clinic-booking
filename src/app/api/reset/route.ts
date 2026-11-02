import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.slots)) {
      return Response.json(
        { error: "slots must be an array" },
        { status: 400 },
      );
    }

    // Validate all slots before changing the database
    for (const slot of body.slots) {
      if (
        !Number.isInteger(slot.id) ||
        typeof slot.provider !== "string" ||
        !slot.provider.trim() ||
        typeof slot.start !== "string" ||
        typeof slot.end !== "string" ||
        Number.isNaN(Date.parse(slot.start)) ||
        Number.isNaN(Date.parse(slot.end)) ||
        new Date(slot.end) <= new Date(slot.start)
      ) {
        return Response.json({ error: "Invalid slot data" }, { status: 400 });
      }
    }

    // Clear existing bookings first
    await prisma.booking.deleteMany();

    // Then clear existing slots
    await prisma.slot.deleteMany();

    // Recreate slots using supplied IDs
    for (const slot of body.slots) {
      await prisma.slot.create({
        data: {
          id: slot.id,
          provider: slot.provider.trim(),
          start: new Date(slot.start),
          end: new Date(slot.end),
        },
      });
    }

    const slots = await prisma.slot.findMany({
      orderBy: {
        start: "asc",
      },
    });

    return Response.json({ slots });
  } catch (error) {
    console.error("Reset error:", error);

    return Response.json({ error: "Failed to reset slots" }, { status: 500 });
  }
}
