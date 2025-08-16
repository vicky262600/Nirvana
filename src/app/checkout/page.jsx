'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { Header } from '@/components/header/Header';
import { Footer } from '@/components/footer/Footer';
import { clearCart } from '@/redux/cartSlice';
import Script from 'next/script';


const Checkout = () => {
  const [shippingCost, setShippingCost] = useState(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);

  const items = useSelector((state) => state.cart.items);
  const { currency, rate } = useSelector((state) => state.currency);
  const dispatch = useDispatch();

  const total = items.reduce((acc, item) => acc + item.price * item.selectedQuantity, 0);
  const convertedTotal = total * rate;
  const tax = convertedTotal * 0.13;
  const shippingCostConverted = shippingCost ? shippingCost * rate : 0;
  const grandTotal = convertedTotal + tax + shippingCostConverted;
  const currencySymbols = { USD: "$", CAD: "C$" };

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });

  const addressInputRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && !initializedRef.current) {
        initAutocomplete();
        return;
      }

      if (document.querySelector('script[src*="maps.googleapis.com"]')) return;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initAutocomplete();
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!addressInputRef.current || initializedRef.current) return;
      initializedRef.current = true;

      const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['address'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const components = place.address_components || [];

        const getComponentLongName = (type) =>
          components.find((c) => c.types.includes(type))?.long_name || '';
        
        const getComponentShortName = (type) =>
          components.find((c) => c.types.includes(type))?.short_name || '';
        
        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address || '',
          city: getComponentLongName('locality') || getComponentLongName('sublocality') || '',
          state: getComponentShortName('administrative_area_level_1') || '',
          zipCode: getComponentLongName('postal_code') || '',
          country: getComponentShortName('country') || prev.country,
        }));
      });
    };

    loadGoogleMapsScript();
  }, [isClient]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  useEffect(() => {
    if (!formData.zipCode || !formData.city || !formData.state || items.length === 0) {
      setShippingCost(null);
      return;
    }

    const fetchShipping = async () => {
      setLoadingShipping(true);
      try {
        const line_items = items.map(item => ({
          quantity: item.selectedQuantity,
          description: item.title,
          value_amount: item.price.toFixed(2),
          currency_code: currency.toLowerCase(),
          origin_country: "ca",
        }));

        const res = await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: {
              address: formData.address,
              city: formData.city,
              province_code: formData.state,
              postal_code: formData.zipCode,
              country_code: formData.country,
              first_name: formData.firstName,
              last_name: formData.lastName,
            },
            line_items,
          }),
        });

        if (!res.ok) {
          setShippingCost(null);
          return;
        }

        const data = await res.json();
        if (data && Array.isArray(data.rates)) {
          setShippingRates(data.rates);
          if (data.rates.length > 0) {
            setSelectedRate(data.rates[0]);
            setShippingCost(data.rates[0].total);
          }
        } else {
          setShippingRates([]);
          setShippingCost(null);
        }

      } catch {
        setShippingCost(null);
      } finally {
        setLoadingShipping(false);
      }
    };

    const debouncedFetch = debounce(fetchShipping, 500);
    debouncedFetch();

    return () => {
      debouncedFetch.cancel && debouncedFetch.cancel();
    };

  }, [formData.zipCode, formData.city, formData.state, formData.country, items, currency]);

  const handleCheckout = async () => {
    try {
      const convertedItems = items.map(item => ({
        ...item,
        price: (item.price * rate).toFixed(2)  // convert CAD → selected currency
      }));

      const res = await fetch('/api/payment/stripe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: convertedItems,
        currency,
        shipping: { 
          ...formData, 
          shippingCost: shippingCostConverted, // converted shipping
          tax: tax // ✅ send tax
        }
      }),
    });

      const data = await res.json();
      if (data.url) {
        dispatch(clearCart()); // clear cart before redirect
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
    }
  };

  if (!isClient) return null;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add some items before checking out!</p>
          <Link href="/">
            <button className="bg-black text-white px-6 py-3 rounded">Continue Shopping</button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Info */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 rounded"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 px-4 py-2 rounded"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Address</label>
                <input
                  type="text"
                  ref={addressInputRef}
                  placeholder="Start typing your address..."
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">City</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Province / State</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Postal Code</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Country</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                />
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex justify-between items-start"
                >
                  <div>
                    <p className="font-medium">{item.title || item.name}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.selectedQuantity}
                      {item.selectedSize && ` • Size: ${item.selectedSize}`}
                      {item.selectedColor && ` • Color: ${item.selectedColor}`}
                    </p>
                  </div>
                  <p className="font-medium">
                    {currencySymbols[currency]}{(item.price * item.selectedQuantity * rate).toFixed(2)}
                  </p>
                </div>
              ))}

              <hr />

              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currencySymbols[currency]}{convertedTotal.toFixed(2)}</span>
              </div>
              {shippingRates.length > 0 && (
                <div className="mb-4">
                  <label className="block mb-1 font-medium">Select Shipping Method</label>
                  <select
                    className="w-full border border-gray-300 px-3 py-2 rounded"
                    value={selectedRate?.postage_type || ""}
                    onChange={(e) => {
                      const rate = shippingRates.find(r => r.postage_type === e.target.value);
                      setSelectedRate(rate);
                      setShippingCost(rate.total);
                    }}
                  >
                    {shippingRates.map((item, idx) => (
                      <option key={idx} value={item.postage_type}>
                        {item.postage_type} - {item.delivery_days} days - {currencySymbols[currency]}{(item.total * rate).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={`font-medium ${loadingShipping ? 'text-gray-400' : 'text-green-600'}`}>
                  {loadingShipping ? 'Calculating...' : shippingCost !== null ? `${currencySymbols[currency]}${shippingCostConverted.toFixed(2)}` : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between">
                <span>GST/HST (13%)</span>
                <span>{currencySymbols[currency]}{tax.toFixed(2)}</span>
              </div>

              <hr />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{currencySymbols[currency]}{grandTotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={
                  !formData.email ||
                  !formData.firstName ||
                  !formData.lastName ||
                  !formData.address ||
                  !formData.city ||
                  !formData.state ||
                  !formData.zipCode ||
                  loadingShipping
                }
                className="w-full bg-black text-white py-3 px-4 rounded hover:bg-gray-900 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Pay with Card
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
