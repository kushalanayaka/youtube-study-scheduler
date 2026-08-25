import { prisma } from "../src/lib/prisma";

async function viewDatabase() {
  const table = process.argv[2] || "all";

  console.log("===============================================");
  console.log("       YOUTUBE STUDY SCHEDULER DATABASE        ");
  console.log("===============================================\n");

  if (table === "all" || table === "users" || table === "User") {
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
    console.log(`📌 USERS (${users.length} records):`);
    console.table(users);
  }

  if (table === "all" || table === "courses" || table === "Course") {
    const courses = await prisma.course.findMany({
      include: { _count: { select: { studyTasks: true } } },
    });
    console.log(`\n📚 COURSES (${courses.length} records):`);
    console.table(
      courses.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        startDate: c.startDate.toISOString().split("T")[0],
        endDate: c.endDate.toISOString().split("T")[0],
        tasksCount: c._count.studyTasks,
      }))
    );
  }

  if (table === "all" || table === "tasks" || table === "StudyTask") {
    const tasks = await prisma.studyTask.findMany({
      take: 20,
    });
    console.log(`\n🎯 STUDY TASKS (${tasks.length} records shown):`);
    console.table(
      tasks.map((t) => ({
        id: t.id,
        subject: t.subject,
        topic: t.topic,
        scheduledDate: t.scheduledDate.toISOString().split("T")[0],
        scheduledTime: t.scheduledTime,
        status: t.status,
      }))
    );
  }

  if (table === "all" || table === "notifications" || table === "Notification") {
    const notifications = await prisma.notification.findMany({
      take: 20,
    });
    console.log(`\n🔔 NOTIFICATIONS (${notifications.length} records shown):`);
    console.table(
      notifications.map((n) => ({
        id: n.id,
        channel: n.channel,
        destination: n.destination,
        scheduledAt: n.scheduledAt.toISOString(),
        status: n.status,
        attempts: n.attempts,
        errorLog: n.errorLog,
      }))
    );
  }
}

viewDatabase()
  .catch((err) => console.error("Database view error:", err))
  .finally(() => prisma.$disconnect());
