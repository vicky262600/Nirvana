'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminReturnsPage() {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/returns');
      if (response.ok) {
        const data = await response.json();
        setReturnRequests(data.requests || []);
      } else {
        console.error('Failed to fetch return requests');
      }
    } catch (error) {
      console.error('Error fetching return requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      setProcessing(prev => ({ ...prev, [requestId]: true }));
      
      const response = await fetch('/api/admin/returns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`${action} successful:`, result);
        
        // Refresh the list
        await fetchReturnRequests();
        
        // Show success message
        alert(`Return request ${action}d successfully!`);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} return request: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing return request:`, error);
      alert(`Error ${action}ing return request`);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', className: 'bg-blue-100 text-blue-800' },
      rejected: { text: 'Rejected', className: 'bg-red-100 text-red-800' },
      refunded: { text: 'Refunded', className: 'bg-green-100 text-green-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Return Requests Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Return Requests Management</h1>
      
      {returnRequests.length === 0 ? (
        <p className="text-gray-600">No return requests found.</p>
      ) : (
        <div className="space-y-6">
          {returnRequests.map((request) => (
            <div key={request._id} className="border rounded-lg p-6 bg-white shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Left side - Request details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">Return Request #{request._id.slice(-8)}</h3>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">
                        {request.userId?.firstName} {request.userId?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{request.userId?.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-medium">{request.orderId?._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">
                        Total: {request.orderId?.currency || 'USD'} {request.orderId?.total?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Reason</p>
                    <p className="font-medium capitalize">{request.reason.replace('_', ' ')}</p>
                  </div>

                  {request.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Description</p>
                      <p className="text-gray-800">{request.description}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Items to Return</p>
                    <div className="space-y-2">
                      {request.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.title}</p>
                            <p className="text-sm text-gray-600">
                              Size: {item.selectedSize} | Color: {item.selectedColor} | 
                              Qty: {item.returnQuantity} | Price: ${item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    Requested on: {new Date(request.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex flex-col gap-2 lg:ml-4">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleAction(request._id, 'approve')}
                        disabled={processing[request._id]}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processing[request._id] ? 'Processing...' : 'Approve & Refund'}
                      </Button>
                      <Button
                        onClick={() => handleAction(request._id, 'reject')}
                        disabled={processing[request._id]}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {processing[request._id] ? 'Processing...' : 'Reject'}
                      </Button>
                    </>
                  )}
                  
                  {request.status === 'approved' && (
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <p className="text-blue-800 font-medium">Approved</p>
                      <p className="text-sm text-blue-600">Waiting for refund processing</p>
                    </div>
                  )}
                  
                  {request.status === 'rejected' && (
                    <div className="text-center p-3 bg-red-50 rounded">
                      <p className="text-red-800 font-medium">Rejected</p>
                    </div>
                  )}
                  
                  {request.status === 'refunded' && (
                    <div className="text-center p-3 bg-green-50 rounded">
                      <p className="text-green-800 font-medium">Refunded</p>
                      <p className="text-sm text-green-600">Customer has been refunded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
