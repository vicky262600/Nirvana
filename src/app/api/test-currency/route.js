import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { items, currency, shipping } = await req.json();
    
    console.log('Test endpoint received:', { items, currency, shipping });
    
    return NextResponse.json({ 
      message: "Currency test successful",
      received: { items, currency, shipping }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      message: "Test endpoint error", 
      error: error.message 
    }, { status: 500 });
  }
} 