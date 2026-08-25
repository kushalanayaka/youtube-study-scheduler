import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const updated = await prisma.notification.updateMany({
    where: {
      status: "PENDING",
      scheduledAt: { lt: new Date() },
    },
    data: {
      status: "EXPIRED",
      errorLog: "Cleaned up old pending notification from test runs",
    },
  });

  console.log(`Cleaned up ${updated.count} old pending notifications.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
