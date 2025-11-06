import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';
import connectDB from '@/lib/db';
import User from '@/models/User';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  await connectDB();

  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ message: 'Email is required' }, { status: 400 });
  }

  const user = await User.findOne({ email });

  if (!user) {
    // Return explicit email not found error
    return NextResponse.json(
      { message: 'Email not found. Please check and try again.' },
      { status: 404 }
    );
  }

  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex');

  // Expiry 1 hour from now
  const expiry = Date.now() + 3600000;

  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(expiry);

  await user.save();

  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.embrosoul.com/'}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'no-reply@embrosoul.com', // your verified sender
      to: user.email,
      subject: 'Your password reset link',
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    return NextResponse.json({ message: 'A reset link has been sent to your email address.' });
  } catch (error) {
    console.error('Resend email error:', error);
    return NextResponse.json({ message: 'Failed to send email.' }, { status: 500 });
  }
}
