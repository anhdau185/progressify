import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

interface CSRFPayload {
  token: string;
  userId: string;
  exp: number;
}

/**
 * Error classes for CSRF-related errors
 */
export class CSRFError extends Error {
  constructor(message: string = "CSRF token validation failed") {
    super(message);
    this.name = "CSRFError";
  }
}

export class CSRFMissingError extends CSRFError {
  constructor() {
    super("CSRF token is missing from request");
    this.name = "CSRFMissingError";
  }
}

export class CSRFInvalidError extends CSRFError {
  constructor() {
    super("CSRF token is invalid or expired");
    this.name = "CSRFInvalidError";
  }
}

const CSRF_SECRET = process.env.CSRF_SECRET;
const CSRF_COOKIE_NAME = "progressify-csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_COOKIE_OPTIONS = {
  httpOnly: false, // Must be false so frontend can read it
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 3 * 24 * 60 * 60, // 3 days in seconds
};

export const csrf = {
  /**
   * Generate a new CSRF token for a user
   */
  generateToken: (userId: string): string => {
    if (!CSRF_SECRET) {
      throw new Error("Server misconfigured");
    }

    const payload: CSRFPayload = {
      token: generateRandomToken(),
      userId,
      exp: Date.now() + 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
    };
    return jwt.sign(payload, CSRF_SECRET);
  },

  /**
   * Verify a CSRF token for a specific user
   */
  verifyToken: (token: string, userId: string): boolean => {
    if (!CSRF_SECRET) {
      throw new Error("Server misconfigured");
    }

    try {
      const decoded = jwt.verify(token, CSRF_SECRET) as CSRFPayload;
      return (
        decoded.userId === userId &&
        decoded.exp > Date.now() &&
        !!decoded.token &&
        decoded.token.length > 0
      );
    } catch {
      return false;
    }
  },

  /**
   * Get CSRF token from request headers
   */
  getTokenFromHeader: (request: NextRequest): string | null => {
    return request.headers.get(CSRF_HEADER_NAME) || null;
  },

  /**
   * Get CSRF token from cookies (server-side)
   */
  getTokenFromCookie: async (): Promise<string | null> => {
    try {
      const cookieStore = await cookies();
      return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
    } catch {
      return null;
    }
  },

  /**
   * Set CSRF token as a cookie in the response
   */
  setCookie: (response: NextResponse, csrfToken: string): void => {
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS);
  },

  /**
   * Clear CSRF token cookie
   */
  clearCookie: (response: NextResponse): void => {
    response.cookies.set(CSRF_COOKIE_NAME, "", {
      ...CSRF_COOKIE_OPTIONS,
      maxAge: 0,
    });
  },

  /**
   * Validate CSRF token from request against user
   */
  validateRequest: (request: NextRequest, userId: string): boolean => {
    const token = csrf.getTokenFromHeader(request);
    if (!token) {
      return false;
    }
    return csrf.verifyToken(token, userId);
  },

  /**
   * Check if request method requires CSRF protection
   */
  requiresCSRFProtection: (method: string): boolean => {
    const protectedMethods = ["POST", "PUT", "DELETE", "PATCH"];
    return protectedMethods.includes(method.toUpperCase());
  },

  /**
   * Middleware helper to validate CSRF for protected methods
   */
  validateOrSkip: (request: NextRequest, userId: string): boolean => {
    // Skip CSRF validation for safe methods (GET, HEAD, OPTIONS)
    if (!csrf.requiresCSRFProtection(request.method)) {
      return true;
    }

    // Validate CSRF token for unsafe methods
    return csrf.validateRequest(request, userId);
  },
};

/**
 * Client-side utilities (for use in React components)
 */
export const csrfClient = {
  /**
   * Get CSRF token from document cookies (client-side)
   */
  getToken: (): string | null => {
    if (typeof document === "undefined") return null;

    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === CSRF_COOKIE_NAME) {
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  /**
   * Get headers object with CSRF token for fetch requests
   */
  getHeaders: (): Record<string, string> => {
    const token = csrfClient.getToken();
    return token ? { [CSRF_HEADER_NAME]: token } : {};
  },

  /**
   * Enhanced fetch wrapper that automatically includes CSRF token
   */
  fetch: async (url: string, options: RequestInit = {}): Promise<Response> => {
    const csrfHeaders = csrfClient.getHeaders();

    const enhancedOptions: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...csrfHeaders,
        ...options.headers,
      },
    };

    return fetch(url, enhancedOptions);
  },
};

/**
 * CSRF validation middleware helper
 */
export const csrfMiddleware = {
  /**
   * Create CSRF validation response
   */
  createValidationResponse: (
    isValid: boolean,
    method: string
  ): NextResponse | null => {
    if (!csrf.requiresCSRFProtection(method)) {
      return null; // No validation needed
    }

    if (!isValid) {
      return new NextResponse(
        JSON.stringify({
          error: "CSRF token validation failed",
          code: "CSRF_INVALID",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return null; // Validation passed
  },

  /**
   * Validate CSRF and return error response if invalid
   */
  validate: (request: NextRequest, userId: string): NextResponse | null => {
    const isValid = csrf.validateOrSkip(request, userId);
    return csrfMiddleware.createValidationResponse(isValid, request.method);
  },
};

/**
 * Generate a cryptographically secure random token
 */
function generateRandomToken(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  // Generate 32-character random string
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export const CSRF_CONSTANTS = {
  COOKIE_NAME: CSRF_COOKIE_NAME,
  HEADER_NAME: CSRF_HEADER_NAME,
  PROTECTED_METHODS: ["POST", "PUT", "DELETE", "PATCH"],
};

export type { CSRFPayload };
