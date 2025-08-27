'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ReturnRequestForm = ({ order, userId, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    items: order.items.map(item => ({
      productId: item.productId,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      selectedQuantity: item.selectedQuantity,
      returnQuantity: item.selectedQuantity,
      title: item.title,
      price: item.price,
      return: false
    }))
  });
  const [loading, setLoading] = useState(false);

  // Filter out items that are already being returned
  const availableItems = formData.items.filter(item => {
    // This filtering will be done on the server side as well
    // but we can do basic filtering here for better UX
    return item.selectedQuantity > 0;
  });

  const handleItemToggle = (index) => {
    const newItems = [...formData.items];
    newItems[index].return = !newItems[index].return;
    newItems[index].returnQuantity = newItems[index].return ? newItems[index].selectedQuantity : 0;
    setFormData({ ...formData, items: newItems });
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...formData.items];
    newItems[index].returnQuantity = Math.min(Math.max(0, parseInt(value) || 0), newItems[index].selectedQuantity);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reason.trim()) {
      alert('Please select a reason for return');
      return;
    }

    const itemsToReturn = formData.items.filter(item => item.return && item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
      alert('Please select at least one item to return');
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        orderId: order._id,
        userId: userId,
        reason: formData.reason,
        description: formData.description,
        items: itemsToReturn
      };
      
      console.log('Sending return request:', requestBody);
      console.log('Request URL:', '/api/returns');
      
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      console.log('Response ok:', response.ok);
      console.log('Response type:', response.type);
      
      if (response.ok) {
        try {
          const data = await response.json();
          console.log('Return request successful:', data);
          
          // Call onSuccess first to refresh the data
          if (onSuccess) {
            console.log('Calling onSuccess callback');
            onSuccess(data);
          }
          
          // Then close the form
          if (onClose) {
            console.log('Calling onClose callback');
            onClose();
          }
          
          // Show success message after everything is done
          alert('Return request submitted successfully!');
        } catch (parseError) {
          console.error('Error parsing response JSON:', parseError);
          // Even if JSON parsing fails, the request was successful
          if (onSuccess) onSuccess({});
          if (onClose) onClose();
          alert('Return request submitted successfully!');
        }
      } else {
        try {
          const error = await response.json();
          console.error('Return request failed:', error);
          
          // Handle specific error cases
          if (error.error === "Some items have already been requested for return") {
            const duplicateItemsList = error.duplicateItems.join(', ');
            alert(`The following items have already been requested for return: ${duplicateItemsList}. Please remove these items from your return request.`);
          } else {
            alert(error.message || error.error || 'Failed to submit return request');
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          alert('Failed to submit return request');
        }
      }
    } catch (error) {
      console.error('Return request error:', error);
      alert('Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Request Return</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Reason for Return *</Label>
            <select
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Select a reason</option>
              <option value="damaged">Product arrived damaged</option>
              <option value="wrong_item">Wrong item received</option>
              <option value="not_as_described">Not as described</option>
              <option value="size_issue">Size doesn't fit</option>
              <option value="quality_issue">Quality issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <Label htmlFor="description">Additional Details</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows="3"
              placeholder="Please provide additional details about your return..."
            />
          </div>

          <div>
            <Label>Select Items to Return</Label>
            <div className="space-y-3 mt-2">
              {availableItems.map((item, index) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`item-${index}`}
                      checked={item.return}
                      onChange={() => handleItemToggle(index)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-gray-600">
                        Size: {item.selectedSize} | Color: {item.selectedColor} | 
                        Qty: {item.selectedQuantity}
                      </p>
                    </div>
                    {item.return && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`qty-${index}`} className="text-sm">Return Qty:</Label>
                        <Input
                          id={`qty-${index}`}
                          type="number"
                          min="1"
                          max={item.selectedQuantity}
                          value={item.returnQuantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-16 h-8 text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Refund Information</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Your return request will be reviewed by our team</p>
              <p>• Refund amount will be determined based on item condition</p>
              <p>• You'll receive a full or partial refund as appropriate</p>
              <p>• Refund will be processed to your original payment method</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestForm; 