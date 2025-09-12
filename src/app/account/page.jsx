'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '@/redux/userSlice';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { Button } from '@/components/ui/button';
import ReturnRequestForm from '@/components/ReturnRequestForm';

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.currentUser);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnRequests, setReturnRequests] = useState([]);

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
        
        console.log('Fetched orders:', sortedOrders.map(order => ({
          id: order._id,
          invoiceUrl: order.invoiceUrl,
          hasInvoice: !!order.invoiceUrl
        })));
        
        setOrders(sortedOrders);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReturnRequests = async () => {
      try {
        const res = await fetch(`/api/returns?userId=${user._id}`);
        if (res.ok) {
          const data = await res.json();
          setReturnRequests(data.requests || []);
        }
      } catch (err) {
        console.error('Failed to fetch return requests:', err);
      }
    };

    fetchOrders();
    fetchReturnRequests();
  }, [user, router]);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push('/');
  };

  const getReturnStatus = (orderId) => {
    const request = returnRequests.find(req => req.orderId === orderId);
    if (!request) return null;
    return request.status;
  };

  const getReturnStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Return Pending', className: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Return Approved', className: 'bg-blue-100 text-blue-800' },
      rejected: { text: 'Return Rejected', className: 'bg-red-100 text-red-800' },
      refunded: { text: 'Refunded', className: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const getReturnableItems = (order) => {
    const existingRequests = returnRequests.filter(req => {
      // Handle both populated objects and string IDs
      const requestOrderId = req.orderId._id || req.orderId;
      return requestOrderId === order._id;
    });
    
    // Create a set of already returned items using direct field comparison
    const alreadyReturnedItems = new Set();
    existingRequests.forEach(request => {
      request.items.forEach(item => {
        // Create a unique identifier using the core fields
        const itemKey = `${item.productId || item.title}-${item.selectedSize || ''}-${item.selectedColor || ''}`;
        alreadyReturnedItems.add(itemKey);
      });
    });
    
    // Filter out items that are already being returned
    const returnableItems = order.items.filter(item => {
      const itemKey = `${item.productId || item.title}-${item.selectedSize || ''}-${item.selectedColor || ''}`;
      return !alreadyReturnedItems.has(itemKey);
    });
    
    return returnableItems;
  };

  const hasReturnableItems = (order) => {
    const returnableItems = getReturnableItems(order);
    return returnableItems.length > 0;
  };

  const isItemRequestedForReturn = (order, item) => {
    const existingRequests = returnRequests.filter(req => {
      const requestOrderId = req.orderId._id || req.orderId;
      return requestOrderId === order._id;
    });
    
    for (const request of existingRequests) {
      const foundItem = request.items.find(requestItem => 
        requestItem.productId === item.productId && 
        requestItem.selectedSize === item.selectedSize && 
        requestItem.selectedColor === item.selectedColor
      );
      
      if (foundItem) {
        return request.status; // Return the actual status
      }
    }
    
    return null; // Item not found in any return request
  };

  const getRefundInfo = (order, item) => {
    const existingRequests = returnRequests.filter(req => {
      const requestOrderId = req.orderId._id || req.orderId;
      return requestOrderId === order._id;
    });

    for (const request of existingRequests) {
      const foundItem = request.items.find(requestItem => 
        requestItem.productId === item.productId && 
        requestItem.selectedSize === item.selectedSize && 
        requestItem.selectedColor === item.selectedColor
      );
      
      if (foundItem && request.refundPercentage && request.refundAmount) {
        return {
          percentage: request.refundPercentage,
          amount: request.refundAmount.toFixed(2)
        };
      }
    }
    
    return null;
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Order History</h2>
            <Button
              onClick={() => {
                setLoading(true);
                const fetchOrders = async () => {
                  try {
                    const res = await fetch(`/api/orders?userId=${user._id}`);
                    if (!res.ok) throw new Error('Failed to fetch orders');
                    const data = await res.json();
                    const sortedOrders = (data.orders || []).sort((a, b) => 
                      new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    
                    console.log('Refreshed orders:', sortedOrders.map(order => ({
                      id: order._id,
                      invoiceUrl: order.invoiceUrl,
                      hasInvoice: !!order.invoiceUrl,
                      createdAt: order.createdAt
                    })));
                    
                    setOrders(sortedOrders);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                };
                fetchOrders();
              }}
              variant="outline"
              size="sm"
            >
              🔄 Refresh Orders
            </Button>
          </div>
          
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
                          {isItemRequestedForReturn(order, item) && (
                            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                              isItemRequestedForReturn(order, item) === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              isItemRequestedForReturn(order, item) === 'approved' ? 'bg-blue-100 text-blue-800' :
                              isItemRequestedForReturn(order, item) === 'rejected' ? 'bg-red-100 text-red-800' :
                              isItemRequestedForReturn(order, item) === 'refunded' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Return Status: {isItemRequestedForReturn(order, item) === 'pending' ? 'Pending' :
                               isItemRequestedForReturn(order, item) === 'approved' ? 'Approved' :
                               isItemRequestedForReturn(order, item) === 'rejected' ? 'Rejected' :
                               isItemRequestedForReturn(order, item) === 'refunded' ? 'Refunded' :
                               'Unknown'}
                            </span>
                          )}
                          {isItemRequestedForReturn(order, item) && getRefundInfo(order, item) && (
                            <span className="ml-2 text-xs text-gray-600">
                              ({getRefundInfo(order, item).percentage}% refund - {order.currency || 'USD'} {getRefundInfo(order, item).amount})
                            </span>
                          )}
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
                      {/* Return Status Section */}
                      {getReturnStatus(order._id) && (
                        <div className="w-full mb-3">
                          <div className="flex items-center gap-2">
                            {getReturnStatusBadge(getReturnStatus(order._id))}
                            <span className="text-sm text-gray-600">
                              {getReturnStatus(order._id) === 'pending' && 'Return request submitted'}
                              {getReturnStatus(order._id) === 'approved' && 'Return approved, processing refund'}
                              {getReturnStatus(order._id) === 'rejected' && 'Return request rejected'}
                              {getReturnStatus(order._id) === 'refunded' && 'Refund processed'}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      {hasReturnableItems(order) ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowReturnForm(true);
                          }}
                          className="hover:bg-gray-50"
                        >
                          Request Return/Refund
                        </Button>
                      ) : (
                        // Show disabled button with better styling when no items can be returned
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-md border border-gray-200">
                          <span>✓</span>
                          <span>All items returned</span>
                        </div>
                      )}
                      
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
                      
                      {/* Invoice/Receipt Button */}
                      {order.invoiceUrl ? (
                        <div className="w-full">
                          <Button
                            variant="outline"
                            onClick={() => window.open(order.invoiceUrl, "_blank")}
                            size="sm"
                            className="w-full mb-2"
                          >
                            📄 View Receipt
                          </Button>
                          <p className="text-xs text-gray-600 text-center">
                            Click to view your payment receipt
                          </p>
                        </div>
                      ) : (
                        <div className="w-full">
                          <Button
                            variant="outline"
                            disabled
                            size="sm"
                            className="w-full mb-2 opacity-50"
                          >
                            📄 Receipt Not Available
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            Receipt will be available after payment
                          </p>
                        </div>
                      )}
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
      {showReturnForm && selectedOrder && (
        <ReturnRequestForm
          order={selectedOrder}
          userId={user._id}
          onClose={() => {
            setShowReturnForm(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            // Refresh orders and return requests to show updated status
            const refreshData = async () => {
              try {
                // Refresh orders
                const ordersRes = await fetch(`/api/orders?userId=${user._id}`);
                if (ordersRes.ok) {
                  const ordersData = await ordersRes.json();
                  const sortedOrders = (ordersData.orders || []).sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                  );
                  setOrders(sortedOrders);
                }

                // Refresh return requests
                const returnsRes = await fetch(`/api/returns?userId=${user._id}`);
                if (returnsRes.ok) {
                  const returnsData = await returnsRes.json();
                  setReturnRequests(returnsData.requests || []);
                }
              } catch (err) {
                console.error('Failed to refresh data:', err);
              }
            };
            refreshData();
          }}
        />
      )}
    </>
  );
}
