// lib/cors.js
export function setCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "http://localhost:5173");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");
}
