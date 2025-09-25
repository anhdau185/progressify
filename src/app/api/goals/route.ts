import { goalUtils } from "@/lib/auth";
import { withAuth, withAuthOnly } from "@/lib/middleware";
import { ProtectedRouteHandler } from "@/types";
import { NextResponse } from "next/server";

/**
 * GET /api/goals.
 * Retrieve all goals for the authenticated user.
 * No CSRF protection needed for GET requests.
 */
const getGoalsHandler: ProtectedRouteHandler = async (request) => {
  try {
    const goals = goalUtils.getGoalsByUserId(request.user!.id);

    return new NextResponse(JSON.stringify(goals), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get goals error:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Failed to retrieve goals. Please try again.",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/goals.
 * Create a new goal for the authenticated user.
 * Requires CSRF protection for state-changing operation.
 */
const createGoalHandler: ProtectedRouteHandler = async (request) => {
  try {
    const goalData = await request.json();

    // Validate required fields
    if (!goalData.title || typeof goalData.title !== "string") {
      return new NextResponse(
        JSON.stringify({
          error: "Goal title is required and must be a string",
          code: "MISSING_TITLE",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!goalData.totalSteps || typeof goalData.totalSteps !== "number") {
      return new NextResponse(
        JSON.stringify({
          error: "Total steps is required and must be a number",
          code: "MISSING_TOTAL_STEPS",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate totalSteps range
    if (goalData.totalSteps < 1 || goalData.totalSteps > 365) {
      return new NextResponse(
        JSON.stringify({
          error: "Total steps must be between 1 and 365",
          code: "INVALID_TOTAL_STEPS",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize and validate title
    const sanitizedTitle = goalData.title.trim();
    if (sanitizedTitle.length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Goal title cannot be empty",
          code: "EMPTY_TITLE",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (sanitizedTitle.length > 100) {
      return new NextResponse(
        JSON.stringify({
          error: "Goal title cannot exceed 100 characters",
          code: "TITLE_TOO_LONG",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize description if provided
    let sanitizedDescription = "";
    if (goalData.description && typeof goalData.description === "string") {
      sanitizedDescription = goalData.description.trim();
      if (sanitizedDescription.length > 500) {
        return new NextResponse(
          JSON.stringify({
            error: "Goal description cannot exceed 500 characters",
            code: "DESCRIPTION_TOO_LONG",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Validate color if provided
    let sanitizedColor = "#3B82F6"; // Default blue
    if (goalData.color && typeof goalData.color === "string") {
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

      if (hexColorRegex.test(goalData.color)) {
        sanitizedColor = goalData.color;
      }
    }

    const goal = goalUtils.createGoal(request.user!.id, {
      title: sanitizedTitle,
      description: sanitizedDescription,
      totalSteps: goalData.totalSteps,
      color: sanitizedColor,
    });

    return new NextResponse(JSON.stringify(goal), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Create goal error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new NextResponse(
        JSON.stringify({
          error: "Invalid JSON in request body",
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
        error: "Failed to create goal. Please try again.",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET = withAuthOnly(getGoalsHandler);
export const POST = withAuth(createGoalHandler);
