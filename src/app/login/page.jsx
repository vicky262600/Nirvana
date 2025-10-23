'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/userSlice'; 
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/'; 
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowForgot(false); // reset on new attempt

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      dispatch(setUser(data.user));
      router.push(redirect);
    } catch (err) {
      setError(err.message);
      setShowForgot(true); // show forgot password if login fails
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-160px)] flex items-center justify-center bg-gray-50 px-4 py-12">
        <form
          onSubmit={handleSubmit}
          className="max-w-md w-full bg-white p-8 rounded-lg shadow-md"
        >
          <h1 className="text-3xl font-semibold mb-6 text-center">Login first, please</h1>

          <label className="block mb-4">
            <span className="block mb-1 font-medium">Email</span>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            className="w-full mb-2 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {showForgot && (
            <p className="text-sm text-right mb-4">
              <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </p>
          )}

          {error && (
            <p className="mb-4 text-red-600 text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-900 transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-6 text-center text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href={`/register?redirect=${redirect || '/checkout'}`} className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </main>
      <Footer />
    </>
  );
}
