import { NextRequest } from "next/server";
import { authUtils, type User } from "./auth";

// Extend NextRequest to include user
interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<Response>
) {
  return async (request: NextRequest): Promise<Response> => {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "No token provided" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoded = authUtils.verifyToken(token);
    if (!decoded) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = authUtils.getUserById(decoded.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    return handler(authenticatedRequest);
  };
}
