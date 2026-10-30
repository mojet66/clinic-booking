import { prisma } from "@/lib/prisma";

export async function GET() {
  const slots = await prisma.slot.findMany({
    orderBy: {
      start: "asc",
    },
  });

  return Response.json({
    slots,
  });
}
