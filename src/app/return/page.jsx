"use client";

import { useState } from "react";

export default function ReturnFormPage() {
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, reason }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Your return request has been submitted ✅");
        setOrderId("");
        setReason("");
      } else {
        setMessage(data.error || "Something went wrong ❌");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to submit request ❌");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-4">Return Request</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Order ID</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full border rounded-lg p-2"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-lg p-2"
            rows="4"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-black text-white p-2 rounded-lg hover:bg-gray-800 transition"
        >
          Submit Request
        </button>
      </form>

      {message && (
        <p className="mt-4 text-center text-sm font-medium text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}
