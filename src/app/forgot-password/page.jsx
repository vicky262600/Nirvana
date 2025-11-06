'use client';

import { useState } from 'react';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage(data.message || 'A reset link will be sent to your email address in a few minutes. Please wait.');
    } catch (err) {
      setError(err.message);
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
          <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
          <p className="text-sm text-gray-600 mb-6 text-center">
            Enter your email address and we'll send you a password reset link.
          </p>

          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {message && <p className="text-green-600 text-sm mb-3">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-900 transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
