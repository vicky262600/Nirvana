'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/redux/userSlice';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { Button } from '@/components/ui/button';

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user._id}`);
        if (!res.ok) throw new Error('Failed to fetch orders');

        const data = await res.json();
        // Sort orders by creation date (most recent first)
        const sortedOrders = (data.orders || []).sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setOrders(sortedOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, router]);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/');
  };

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-12 min-h-[calc(100vh-160px)]">
        <h1 className="text-3xl font-bold mb-6">Account Overview</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-2">
            Welcome, {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-700">Email: {user.email}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Order History</h2>
          
          {/* Order Summary */}
          {orders.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Total Orders:</span>
                  <span className="px-2 py-1 bg-gray-200 rounded">{orders.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Currencies:</span>
                  <div className="flex gap-1">
                    {[...new Set(orders.map(order => order.currency || 'USD'))].map(currency => (
                      <span key={currency} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {currency}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-gray-600">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-600">No orders yet.</p>
          ) : (
            <div className="space-y-6">
              {/* Show message when collapsed */}
              {!showAllOrders && orders.length > 5 && (
                <div className="text-center text-sm text-gray-600 mb-4">
                  Showing last 5 orders of {orders.length} total orders
                </div>
              )}
              
              {(showAllOrders ? orders : orders.slice(0, 5)).map((order) => (
                <div
                  key={order._id}
                  className="border p-5 rounded-xl bg-gray-50 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  {/* Left side - Product images */}
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {order.items.map((item, idx) => (
                      <img
                        key={idx}
                        src={item.image || "/placeholder.png"}
                        alt={item.title || "Product"}
                        className="w-20 h-20 object-cover rounded-lg border flex-shrink-0"
                      />
                    ))}
                  </div>

                  {/* Titles & size */}
                  <div className="flex-1 flex flex-col md:ml-4 gap-1">
                    {order.items.map((item, idx) => (
                      <p key={idx} className="text-sm font-medium">
                        {item.title} - Size: {item.selectedSize} - Qty: {item.selectedQuantity}
                      </p>
                    ))}
                  </div>

                  {/* Right side - Order info & buttons */}
                  <div className="flex flex-col gap-2 md:ml-auto">
                    <p className="text-xs text-gray-600">Order ID: {order._id}</p>
                    <p className="text-xs text-gray-600">
                      Date: {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-600">
                      Tracking: {order.trackingNumber || "Not assigned yet"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Currency:</span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {order.currency || 'USD'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold">
                      {order.currency || 'USD'} {order.total.toFixed(2)}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/returns/${order._id}`)}
                      >
                        Request Return/Refund
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          order.trackingNumber
                            ? window.open(
                                `https://tracking.stallionexpress.ca/${order.trackingNumber}`,
                                "_blank"
                              )
                            : alert("Tracking number not available yet")
                        }
                      >
                        Track Order
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Toggle Button at the bottom */}
              {orders.length > 5 && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllOrders(!showAllOrders)}
                    className="text-sm"
                  >
                    {showAllOrders ? 'Show Last 5 Orders' : `Show All ${orders.length} Orders`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
