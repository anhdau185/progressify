import { goalUtils } from "@/lib/auth";
import { withAuth } from "@/lib/middleware";
import { NextRequest } from "next/server";

export const GET = withAuth(
  async (
    request: NextRequest & { user?: any },
    { params }: { params: { id: string } }
  ) => {
    try {
      const goal = goalUtils.getGoalById(params.id);

      if (!goal || goal.userId !== request.user.id) {
        return new Response(JSON.stringify({ error: "Goal not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(goal), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
);

export const PUT = withAuth(
  async (
    request: NextRequest & { user?: any },
    { params }: { params: { id: string } }
  ) => {
    try {
      const updates = await request.json();
      const goal = goalUtils.getGoalById(params.id);

      if (!goal || goal.userId !== request.user.id) {
        return new Response(JSON.stringify({ error: "Goal not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updatedGoal = goalUtils.updateGoal(params.id, updates);
      return new Response(JSON.stringify(updatedGoal), {
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
);

export const DELETE = withAuth(
  async (
    request: NextRequest & { user?: any },
    { params }: { params: { id: string } }
  ) => {
    try {
      const goal = goalUtils.getGoalById(params.id);

      if (!goal || goal.userId !== request.user.id) {
        return new Response(JSON.stringify({ error: "Goal not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      goalUtils.deleteGoal(params.id);
      return new Response(
        JSON.stringify({ message: "Goal deleted successfully" }),
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
);
