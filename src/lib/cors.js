// lib/cors.js
export function setCorsHeaders(response) {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173", 
    "https://nirvana-five-nu.vercel.app",
    process.env.NEXT_PUBLIC_BASE_URL
  ].filter(Boolean);
  
  response.headers.set("Access-Control-Allow-Origin", allowedOrigins.join(", "));
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
