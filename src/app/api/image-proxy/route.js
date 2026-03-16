import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "images.unsplash.com",
]);

async function fetchWithRetry(url, retries = 1) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          Accept: "image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        throw new Error(`Image fetch failed with ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

export async function GET(request) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ message: "Missing url query param" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return NextResponse.json({ message: "Invalid image URL" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ message: "Image host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetchWithRetry(parsed.toString(), 1);
    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Short cache helps smooth transient failures while keeping updates fresh.
        "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to load image", error: error.message },
      { status: 502 }
    );
  }
}
