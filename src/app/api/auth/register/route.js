import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';         // ✅ default import
import User from '@/models/User';         // ✅ default import
import { signJWT } from '@/lib/auth';     // ✅ named import

export async function POST(req) {
  await connectDB();

  const { firstName, lastName, email, password } = await req.json();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return NextResponse.json({ message: 'User already exists' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({ firstName, lastName, email, password: hashedPassword });

  const token = signJWT(user);  // ✅ fix name: signJWT not signToken

  const res = NextResponse.json({ message: 'User created successfully' });
  res.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return res;
}
