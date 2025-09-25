import { authHelpers, authUtils } from "@/lib/auth";
import { withRateLimit } from "@/lib/middleware";
import { RouteHandler } from "@/types";
import { NextResponse } from "next/server";

const RATE_LIMIT_SETTING = {
  MAX_REQUESTS: 3,
  WINDOW_MINS: 30,
};

/**
 * User registration endpoint with secure cookie-based authentication.
 * Rate limited to prevent spam account creation.
 */
const registerHandler: RouteHandler = async (request) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new NextResponse(
        JSON.stringify({
          error: "Email and password are required",
          code: "MISSING_CREDENTIALS",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(sanitizedEmail)) {
      return new NextResponse(
        JSON.stringify({
          error: "Please enter a valid email address",
          code: "INVALID_EMAIL_FORMAT",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate password strength
    if (typeof password !== "string") {
      return new NextResponse(
        JSON.stringify({
          error: "Password must be a string",
          code: "INVALID_PASSWORD_TYPE",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (password.length < 6) {
      return new NextResponse(
        JSON.stringify({
          error: "Password must be at least 6 characters long",
          code: "PASSWORD_TOO_SHORT",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (password.length > 128) {
      return new NextResponse(
        JSON.stringify({
          error: "Password cannot exceed 128 characters",
          code: "PASSWORD_TOO_LONG",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Basic password strength check
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    if (!hasLetter || !hasNumber) {
      return new NextResponse(
        JSON.stringify({
          error: "Password must contain at least one letter and one number",
          code: "PASSWORD_TOO_WEAK",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const existingUser = authUtils.getUserByEmail(sanitizedEmail);
    if (existingUser) {
      return new NextResponse(
        JSON.stringify({
          error: "An account with this email address already exists",
          code: "USER_EXISTS",
        }),
        {
          status: 409, // Conflict
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const user = await authUtils.createUser(sanitizedEmail, password);

    // Create authenticated response with secure cookies
    return authHelpers.createAuthResponse(user);
  } catch (error) {
    console.error("Registration error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid request format",
          code: "INVALID_JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        error: "An error occurred during registration. Please try again.",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST = withRateLimit(
  RATE_LIMIT_SETTING.MAX_REQUESTS,
  RATE_LIMIT_SETTING.WINDOW_MINS * 60 * 1000
)(registerHandler);
