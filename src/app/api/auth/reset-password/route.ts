import { authUtils } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email and new password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const user = authUtils.getUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await authUtils.updateUserPassword(user.id, newPassword);

    return new Response(
      JSON.stringify({ message: "Password reset successfully" }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
