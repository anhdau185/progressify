import type {
  AuthenticatedRequest,
  ProtectedRouteHandler,
  RouteHandler,
} from "@/types";
import { type NextRequest, NextResponse } from "next/server";
import { authUtils } from "./auth";
import { csrfMiddleware } from "./csrf";

/**
 * Authentication middleware that validates JWT tokens from secure cookies
 */
export function withAuth(handler: ProtectedRouteHandler): RouteHandler {
  return async (request) => {
    try {
      // Get JWT token from secure httpOnly cookie
      const token = getTokenFromCookies(request);

      if (!token) {
        return createUnauthorizedResponse("No authentication token provided");
      }

      // Verify JWT token
      const decoded = authUtils.verifyToken(token);
      if (!decoded) {
        return createUnauthorizedResponse(
          "Invalid or expired authentication token"
        );
      }

      // Get user from database/storage
      const user = authUtils.getUserById(decoded.userId);
      if (!user) {
        return createUnauthorizedResponse("User not found");
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      // Validate CSRF for protected methods
      const csrfValidationResponse = csrfMiddleware.validate(request, user.id);
      if (csrfValidationResponse) {
        return csrfValidationResponse;
      }

      // Mark CSRF as validated for this request
      authenticatedRequest.isCSRFValidated = true;

      // Call the protected handler
      return handler(authenticatedRequest);
    } catch (error) {
      console.error("Auth middleware error:", error);
      return createServerErrorResponse();
    }
  };
}

/**
 * Lightweight auth middleware that only checks authentication (no CSRF validation)
 * Useful for GET requests or when CSRF is handled separately
 */
export function withAuthOnly(handler: ProtectedRouteHandler): RouteHandler {
  return async (request) => {
    try {
      // Get JWT token from secure httpOnly cookie
      const token = getTokenFromCookies(request);

      if (!token) {
        return createUnauthorizedResponse("No authentication token provided");
      }

      // Verify JWT token
      const decoded = authUtils.verifyToken(token);
      if (!decoded) {
        return createUnauthorizedResponse(
          "Invalid or expired authentication token"
        );
      }

      // Get user from database/storage
      const user = authUtils.getUserById(decoded.userId);
      if (!user) {
        return createUnauthorizedResponse("User not found");
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;

      // Call the protected handler (no CSRF validation)
      return handler(authenticatedRequest);
    } catch (error) {
      console.error("Auth-only middleware error:", error);
      return createServerErrorResponse();
    }
  };
}

/**
 * CSRF-only middleware for routes that need CSRF protection but handle auth separately
 */
export function withCSRF(
  userId: string
): (handler: RouteHandler) => RouteHandler {
  return (handler) => async (request) => {
    try {
      const csrfValidationResponse = csrfMiddleware.validate(request, userId);
      if (csrfValidationResponse) {
        return csrfValidationResponse;
      }

      return handler(request);
    } catch (error) {
      console.error("CSRF middleware error:", error);
      return createServerErrorResponse();
    }
  };
}

/**
 * Optional auth middleware - doesn't require authentication but attaches user if available
 * Useful for routes that work for both authenticated and non-authenticated users
 */
export function withOptionalAuth(handler: ProtectedRouteHandler): RouteHandler {
  return async (request) => {
    try {
      // Get JWT token from secure httpOnly cookie
      const token = getTokenFromCookies(request);
      const authenticatedRequest = request as AuthenticatedRequest;

      if (token) {
        // Verify JWT token if present
        const decoded = authUtils.verifyToken(token);
        if (decoded) {
          const user = authUtils.getUserById(decoded.userId);
          if (user) {
            authenticatedRequest.user = user;
          }
        }
      }

      // Call the handler regardless of auth status
      return handler(authenticatedRequest);
    } catch (error) {
      console.error("Optional auth middleware error:", error);

      // Continue without auth on error
      const authenticatedRequest = request as AuthenticatedRequest;
      return handler(authenticatedRequest);
    }
  };
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 * In production, use Redis or external rate limiting service
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): (handler: RouteHandler) => RouteHandler {
  return (handler) => async (request) => {
    const clientIP = getClientIP(request);
    const now = Date.now();

    // Clean up expired entries
    for (const [ip, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(ip);
      }
    }

    // Get or create counter for this IP
    const counter = requestCounts.get(clientIP) || {
      count: 0,
      resetTime: now + windowMs,
    };

    // Check if rate limit exceeded
    if (counter.count >= maxRequests && counter.resetTime > now) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((counter.resetTime - now) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil(
              (counter.resetTime - now) / 1000
            ).toString(),
            "X-RateLimit-Limit": maxRequests.toString(),
            "X-RateLimit-Remaining": Math.max(
              0,
              maxRequests - counter.count
            ).toString(),
            "X-RateLimit-Reset": counter.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    counter.count++;
    requestCounts.set(clientIP, counter);

    // Add rate limit headers to response
    const response = await handler(request);
    response.headers.set("X-RateLimit-Limit", maxRequests.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - counter.count).toString()
    );
    response.headers.set("X-RateLimit-Reset", counter.resetTime.toString());

    return response;
  };
}

/**
 * Combine multiple middlewares
 */
export function combineMiddleware(
  ...middlewares: Array<(handler: RouteHandler) => RouteHandler>
): (handler: ProtectedRouteHandler) => RouteHandler {
  return (handler) => {
    return middlewares.reduceRight(
      (wrappedHandler, middleware) => middleware(wrappedHandler),
      handler as RouteHandler
    );
  };
}

// Helper functions

/**
 * Extract JWT token from request cookies
 */
function getTokenFromCookies(request: NextRequest): string | undefined {
  return request.cookies.get("progressify-auth")?.value;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  // Fallback for development
  return "unknown";
}

/**
 * Create standardized unauthorized response
 */
function createUnauthorizedResponse(message: string): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: message,
      code: "UNAUTHORIZED",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Create standardized server error response
 */
function createServerErrorResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
