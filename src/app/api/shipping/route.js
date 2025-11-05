// For Next.js 13 /app/api/shipping/route.js (edge or node environment)
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();

    // Extract destination & line_items from request
    const { destination, line_items } = body;

    // Calculate total weight and height based on quantity
    // Each sweatshirt weighs 680g and has height of 2.5 inches
    const sweatshirtWeightPerUnit = 680; // grams
    const sweatshirtHeightPerUnit = 2.5; // inches
    const totalQuantity = line_items.reduce((total, item) => total + item.quantity, 0);
    const totalWeight = totalQuantity * sweatshirtWeightPerUnit;
    const totalHeight = totalQuantity * sweatshirtHeightPerUnit;

    // Build Stallion Express API payload:
    const stallionPayload = {
      to_address: {
        name: destination.first_name + ' ' + destination.last_name,
        company: null,
        address1: destination.address,
        address2: destination.address2 || null,
        city: destination.city,
        province_code: destination.province_code,
        postal_code: destination.postal_code,
        country_code: destination.country_code,
        phone: null,
        email: null,
        is_residential: true,
      },
      is_return: false,
      weight_unit: "g",
      weight: totalWeight, // calculated weight based on quantity
      length: 16,
      width: 20,
      height: totalHeight, // calculated height based on quantity
      size_unit: "in",
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
      signature_confirmation: false,
      insured: true,
      tax_identifier: {
        tax_type: "IOSS",
        number: "IM1234567890",
        issuing_authority: "CA"
      }
    };

    // console.log('Stallion Payload:', JSON.stringify(stallionPayload, null, 2));

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
    
    // In /api/shipping/route.js
    if (data.success && data.rates && data.rates.length > 0) {
      console.log(data);
      return NextResponse.json({ rates: data.rates });
    }

    return NextResponse.json({ rates: [] });

  } catch (error) {
    console.error('Shipping API route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
