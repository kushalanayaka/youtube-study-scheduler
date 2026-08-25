import { prisma } from "../src/lib/prisma";

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      telegramLinked: true,
      telegramChatId: true,
      createdAt: true,
    },
  });

  console.log("Registered Users Count:", users.length);
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
