import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const start = performance.now();
  const user = await prisma.user.findFirst();
  const duration = (performance.now() - start).toFixed(2);

  console.log(`Query Success! Found user: ${user?.email} in ${duration}ms`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
