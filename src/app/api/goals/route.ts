import { goalUtils } from "@/lib/auth";
import { withAuth } from "@/lib/middleware";
import { NextRequest } from "next/server";

export const GET = withAuth(async (request: NextRequest & { user?: any }) => {
  try {
    const goals = goalUtils.getGoalsByUserId(request.user.id);
    return new Response(JSON.stringify(goals), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

export const POST = withAuth(async (request: NextRequest & { user?: any }) => {
  try {
    const goalData = await request.json();

    if (!goalData.title || !goalData.totalSteps) {
      return new Response(
        JSON.stringify({ error: "Title and total steps are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const goal = goalUtils.createGoal(request.user.id, goalData);
    return new Response(JSON.stringify(goal), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
