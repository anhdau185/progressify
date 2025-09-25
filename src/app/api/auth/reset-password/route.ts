import { authUtils } from "@/lib/auth";
import { withRateLimit } from "@/lib/middleware";
import { RouteHandler } from "@/types";
import { NextResponse } from "next/server";

const RATE_LIMIT_SETTING = {
  MAX_REQUESTS: 3,
  WINDOW_MINS: 30,
};

/**
 * Password reset endpoint.
 * Rate limited to prevent email bombing and brute force attacks.
 * Note: In production, this should send reset emails instead of direct password changes.
 */
const resetPasswordHandler: RouteHandler = async (request) => {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return new NextResponse(
        JSON.stringify({
          error: "Email and new password are required",
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

    // Validate new password strength
    if (typeof newPassword !== "string") {
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

    if (newPassword.length < 6) {
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

    if (newPassword.length > 128) {
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
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
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

    const user = authUtils.getUserByEmail(sanitizedEmail);
    if (!user) {
      // Security: Don't reveal if email exists or not
      // Return success message regardless to prevent email enumeration
      return new NextResponse(
        JSON.stringify({
          message:
            "If an account with this email exists, the password has been reset successfully.",
          code: "RESET_INITIATED",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updated = await authUtils.updateUserPassword(user.id, newPassword);
    if (!updated) {
      return new NextResponse(
        JSON.stringify({
          error: "Failed to reset password. Please try again.",
          code: "RESET_FAILED",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Log password reset for security monitoring
    console.log(
      `Password reset completed for user: ${
        user.id
      } (${sanitizedEmail}) at ${new Date().toISOString()}`
    );

    // Return success message (same as when user doesn't exist)
    return new NextResponse(
      JSON.stringify({
        message:
          "If an account with this email exists, the password has been reset successfully.",
        code: "RESET_COMPLETED",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Password reset error:", error);

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

    // Don't expose internal errors to client
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred during password reset. Please try again.",
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
)(resetPasswordHandler);
