import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@shopify-manager.com" },
    update: {},
    create: {
      email: "admin@shopify-manager.com",
      name: "Admin User",
      password: hashedPassword,
    },
  });

  console.log("Seed user created:", user.email);
  console.log("Login password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
