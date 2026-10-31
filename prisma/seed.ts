import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const slot = await prisma.slot.create({
    data: {
      provider: "Dr. Smith",
      start: new Date("2026-11-02T09:00:00Z"),
      end: new Date("2026-11-02T09:30:00Z"),
    },
  });

  console.log("Created slot:", slot);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
