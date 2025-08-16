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

  if (error) return <p>{error}</p>;
  if (!session) return <p>Loading...</p>;

  const amount = (session.amount_total / 100).toFixed(2);
  const currency = session.currency?.toUpperCase() || 'USD';

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
      <p>Thank you, <strong>{session.customer_email}</strong></p>
      <p>
        Amount Paid: <strong>{currency} {amount}</strong>
      </p>

      {session.line_items && (
        <div className="mt-4">
          <h2 className="font-semibold">Order Details:</h2>
          <ul className="list-disc pl-5">
            {session.line_items.data.map(item => (
              <li key={item.id}>
                {item.description} x {item.quantity} - {currency} {(item.amount_total / 100).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Continue Shopping Button */}
      <div className="mt-6">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
