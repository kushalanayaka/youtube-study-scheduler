export interface SendEmailParams {
  toEmail: string;
  courseName: string;
  subject: string;
  topic: string;
  youtubeUrl: string;
  scheduledTime: string;
}

export async function sendEmailReminder(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Study Scheduler <reminders@resend.dev>",
          to: [params.toEmail],
          subject: `📚 Study Reminder: ${params.subject} - ${params.topic}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h2 style="color: #ef4444; margin-top: 0;">📚 ${params.courseName} Study Reminder</h2>
              <p>Your scheduled study session is starting now!</p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Subject:</strong> ${params.subject}</p>
                <p style="margin: 4px 0;"><strong>Topic:</strong> ${params.topic}</p>
                <p style="margin: 4px 0;"><strong>Time:</strong> ${params.scheduledTime}</p>
              </div>
              <p style="margin-top: 24px;">
                <a href="${params.youtubeUrl}" target="_blank" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  🎥 Watch on YouTube
                </a>
              </p>
            </div>
          `,
        }),
      });

      if (res.ok) {
        return { success: true };
      } else {
        const errorData = await res.json();
        return { success: false, error: JSON.stringify(errorData) };
      }
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  // Simulated fallback logger when no SMTP/Resend API key is configured
  console.log(`[Email Fallback Mock] Sent email to ${params.toEmail}: ${params.subject} - ${params.topic}`);
  return { success: true };
}

export async function sendPasswordResetEmail({
  toEmail,
  resetLink,
}: {
  toEmail: string;
  resetLink: string;
}): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Study Scheduler <support@resend.dev>",
          to: [toEmail],
          subject: "🔐 Reset Your Password - YouTube Study Scheduler",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #dc2626; margin-top: 0;">Reset Your Password</h2>
              <p style="color: #334155; font-size: 14px;">We received a request to reset your password for your <strong>YouTube Study Scheduler</strong> account (${toEmail}).</p>
              <p style="margin: 24px 0;">
                <a href="${resetLink}" target="_blank" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Reset Password Now
                </a>
              </p>
              <p style="color: #64748b; font-size: 12px;">This link is valid for 1 hour. If you did not request a password reset, please ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 11px;">Or copy and paste this URL into your browser:<br/><a href="${resetLink}" style="color: #dc2626;">${resetLink}</a></p>
            </div>
          `,
        }),
      });

      if (res.ok) {
        return { success: true };
      } else {
        const errorData = await res.json();
        return { success: false, error: JSON.stringify(errorData) };
      }
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  console.log(`[Email Reset Link Mock] Sent to ${toEmail}: ${resetLink}`);
  return { success: true };
}
