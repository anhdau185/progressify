import { authHelpers, authUtils } from "@/lib/auth";
import { withRateLimit } from "@/lib/middleware";
import { RouteHandler } from "@/types";
import { NextResponse } from "next/server";

const RATE_LIMIT_SETTING = {
  MAX_REQUESTS: 5,
  WINDOW_MINS: 5,
};

/**
 * User login endpoint with secure cookie-based authentication.
 * Rate limited to prevent brute force attacks.
 */
const loginHandler: RouteHandler = async (request) => {
  try {
    const { email, password } = await request.json();

    // Validate input
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
    if (!emailRegex.test(email)) {
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

    // Check if user exists
    const user = authUtils.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify password
    const isPasswordValid = await authUtils.comparePassword(
      password,
      user.password
    );
    if (!isPasswordValid) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create authenticated response with secure cookies
    return authHelpers.createAuthResponse(user);
  } catch (error) {
    console.error("Login error:", error);

    // Avoid exposing internal errors to client
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred during login. Please try again.",
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
)(loginHandler);
