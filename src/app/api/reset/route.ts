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

    for (const slot of body.slots) {
      if (
        !Number.isInteger(slot.id) ||
        typeof slot.provider !== "string" ||
        !slot.provider ||
        typeof slot.start !== "string" ||
        typeof slot.end !== "string"
      ) {
        return Response.json({ error: "Invalid slot data" }, { status: 400 });
      }

      if (
        Number.isNaN(new Date(slot.start).getTime()) ||
        Number.isNaN(new Date(slot.end).getTime())
      ) {
        return Response.json({ error: "Invalid slot date" }, { status: 400 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.booking.deleteMany();
      await tx.slot.deleteMany();

      for (const slot of body.slots) {
        await tx.slot.create({
          data: {
            id: slot.id,
            provider: slot.provider,
            start: new Date(slot.start),
            end: new Date(slot.end),
          },
        });
      }
    });

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
