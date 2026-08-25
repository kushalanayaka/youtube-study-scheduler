import { processDueReminders } from "../src/lib/cron";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Triggering processDueReminders()...");
  const res = await processDueReminders();
  console.log("Result:", res);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
