import { authUtils } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const existingUser = authUtils.getUserByEmail(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await authUtils.createUser(email, password);
    const token = authUtils.generateToken(user.id);

    return new Response(
      JSON.stringify({
        token,
        user: { id: user.id, email: user.email },
      }),
      {
        status: 201,
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
