// For Next.js 13 /app/api/shipping/route.js (edge or node environment)
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    // Extract destination & line_items from request
    const { destination, line_items } = body;

    // Build Stallion Express API payload:
    const stallionPayload = {
      to_address: {
        name: destination.first_name + ' ' + destination.last_name,
        company: null,
        address1: destination.address,
        address2: null,
        city: destination.city,
        province_code: destination.province_code,
        postal_code: destination.postal_code,
        country_code: destination.country_code,
        phone: null,
        email: null,
        is_residential: true,
      },
      is_return: false,
      weight_unit: "lbs",
      weight: line_items.reduce((acc, item) => acc + item.quantity * 0.5, 0.6), // example weight calculation
      length: 9,
      width: 12,
      height: 1,
      size_unit: "cm",
      items: line_items.map(item => ({
        description: item.description,
        sku: "SKU123",
        quantity: item.quantity,
        value: parseFloat(item.value_amount),
        currency: item.currency_code.toUpperCase(),
        country_of_origin: "CA",
        hs_code: "123456",
        manufacturer_name: "Nirvana Clothing",
        manufacturer_address1: "123 Manufacturing Blvd",
        manufacturer_city: "Toronto",
        manufacturer_province_code: "ON",
        manufacturer_postal_code: "M5V 2H1",
        manufacturer_country_code: "CA",
      })),
      package_type: "Parcel",
      postage_types: [],
      signature_confirmation: true,
      insured: true,
      tax_identifier: {
        tax_type: "IOSS",
        number: "IM1234567890",
        issuing_authority: "GB"
      }
    };

    console.log('Stallion Payload:', JSON.stringify(stallionPayload, null, 2));

    // Call Stallion Express API:
    const response = await fetch('https://ship.stallionexpress.ca/api/v4/rates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STALLION_API_KEY}`,
      },
      body: JSON.stringify(stallionPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stallion API error response:', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();

    // Pick the cheapest rate or first rate from data.rates array
    if (data.success && data.rates && data.rates.length > 0) {
      // Example: cheapest rate total cost
      const cheapestRate = data.rates.reduce((prev, curr) => (prev.total < curr.total ? prev : curr));
      return NextResponse.json({ cost: cheapestRate.total, rates: data.rates });
    }

    return NextResponse.json({ cost: null, rates: [] });

  } catch (error) {
    console.error('Shipping API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
