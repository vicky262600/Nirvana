import { verifyJWT } from "./auth";

export function withAuth(handler) {
  return async (req, res) => {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return new Response("Unauthorized", { status: 401 });

    try {
      const user = verifyJWT(token);
      req.user = user;
      return handler(req, res);
    } catch (err) {
      return new Response("Forbidden", { status: 403 });
    }
  };
}

export function withAdmin(handler) {
  return withAuth((req, res) => {
    if (!req.user?.isAdmin) {
      return new Response("Admin access only", { status: 403 });
    }
    return handler(req, res);
  });
}
