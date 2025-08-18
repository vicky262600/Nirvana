'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Success() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/payment/session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => setSession(data))
        .catch(err => {
          console.error(err);
          setError('Failed to fetch payment session.');
        });
    }
  }, [sessionId]);

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (!session) return <p className="text-center mt-10">Loading...</p>;

  const amount = (session.amount_total / 100).toFixed(2);
  const currency = session.currency?.toUpperCase() || 'USD';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-lg max-w-2xl w-full p-6">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-gray-700 mb-2">
          Thank you, <strong>{session.customer_email}</strong>
        </p>
        <p className="text-gray-700 mb-4">
          Amount Paid: <strong>{currency} {amount}</strong>
        </p>

        {session.line_items && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <h2 className="text-xl font-semibold mb-3">Order Details</h2>
            <ul className="divide-y divide-gray-200">
              {session.line_items.data.map(item => (
                <li key={item.id} className="py-2 flex justify-between">
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">
                    {currency} {(item.amount_total / 100).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-between space-x-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
          >
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
}
