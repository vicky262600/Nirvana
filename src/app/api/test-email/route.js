// /app/api/test-email/route.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const response = await resend.emails.send({
      from: 'Nirvana <onboarding@resend.dev>',
      to: 'your-email@example.com',  // your email here
      subject: 'Test Email from Resend',
      html: '<p>This is a test email.</p>',
    });
    return new Response(JSON.stringify({ success: true, response }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
