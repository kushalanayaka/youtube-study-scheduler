import { prisma } from '../src/lib/prisma';
import { processDueReminders } from '../src/lib/cron';

async function main() {
  const user = await prisma.user.findFirst();
  const course = await prisma.course.findFirst();

  if (!user || !course) {
    console.error('No user or course found!');
    return;
  }

  const now = new Date();
  const futureDate = new Date(now.getTime() + 10000); // 10 seconds in future

  console.log('Current time (UTC):', now.toISOString());
  console.log('Scheduling reminder for (UTC):', futureDate.toISOString());

  const task = await prisma.studyTask.create({
    data: {
      userId: user.id,
      courseId: course.id,
      subject: 'Live Test Subject',
      topic: 'Instant Live Telegram Reminder Alert',
      youtubeUrl: 'https://www.youtube.com/watch?v=kSU2MPeptpM',
      youtubeVideoId: 'kSU2MPeptpM',
      scheduledDate: futureDate,
      scheduledTime: futureDate.toTimeString().substring(0, 5),
      duration: 15,
      status: 'PENDING',
    },
  });

  const notification = await prisma.notification.create({
    data: {
      taskId: task.id,
      userId: user.id,
      channel: 'TELEGRAM',
      destination: user.telegramChatId || '',
      scheduledAt: futureDate,
      status: 'PENDING',
    },
  });

  console.log('Created Notification ID:', notification.id);
  console.log('Waiting 12 seconds for reminder to become due...');

  await new Promise((resolve) => setTimeout(resolve, 12000));

  console.log('Running processDueReminders()...');
  const result = await processDueReminders();
  console.log('Process Result:', JSON.stringify(result, null, 2));

  const updatedNotification = await prisma.notification.findUnique({
    where: { id: notification.id },
  });

  console.log('Updated Notification Status:', updatedNotification?.status);
  console.log('Updated Notification ErrorLog:', updatedNotification?.errorLog);

  // Clean up test records
  await prisma.notification.delete({ where: { id: notification.id } });
  await prisma.studyTask.delete({ where: { id: task.id } });
  console.log('Test cleanup completed!');
}

main().catch(console.error);
