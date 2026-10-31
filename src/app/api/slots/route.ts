import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  const slots = await prisma.slot.findMany({
    where: provider ? { provider } : undefined,
    include: {
      bookings: {
        where: {
          status: "confirmed",
        },
      },
    },
    orderBy: {
      start: "asc",
    },
  });

  return Response.json({
    slots: slots.map(({ bookings, ...slot }) => ({
      ...slot,
      available: bookings.length === 0,
    })),
  });
}
