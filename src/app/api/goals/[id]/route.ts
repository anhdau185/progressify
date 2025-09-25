import { goalUtils } from "@/lib/auth";
import { withAuth, withAuthOnly } from "@/lib/middleware";
import { ProtectedRouteHandler } from "@/types";
import { NextResponse } from "next/server";

/**
 * GET /api/goals/[id].
 * Retrieve a specific goal by ID.
 * No CSRF protection needed for GET requests.
 */
const getGoalHandler: ProtectedRouteHandler = async (request) => {
  try {
    const url = new URL(request.url);
    const goalId = url.pathname.split("/").pop();

    if (!goalId || goalId === "route.ts") {
      return new NextResponse(
        JSON.stringify({
          error: "Goal ID is required",
          code: "MISSING_GOAL_ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get goal from storage
    const goal = goalUtils.getGoalById(goalId);

    if (!goal) {
      return new NextResponse(
        JSON.stringify({
          error: "Goal not found",
          code: "GOAL_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify goal ownership
    if (goal.userId !== request.user!.id) {
      return new NextResponse(
        JSON.stringify({
          error: "Access denied. You can only view your own goals.",
          code: "ACCESS_DENIED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(JSON.stringify(goal), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Get goal error:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Failed to retrieve goal. Please try again.",
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
 * PUT /api/goals/[id].
 * Update a specific goal by ID.
 * Requires CSRF protection for state-changing operation.
 */
const updateGoalHandler: ProtectedRouteHandler = async (request) => {
  try {
    const url = new URL(request.url);
    const goalId = url.pathname.split("/").pop();

    if (!goalId || goalId === "route.ts") {
      return new NextResponse(
        JSON.stringify({
          error: "Goal ID is required",
          code: "MISSING_GOAL_ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const existingGoal = goalUtils.getGoalById(goalId);

    if (!existingGoal) {
      return new NextResponse(
        JSON.stringify({
          error: "Goal not found",
          code: "GOAL_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify goal ownership
    if (existingGoal.userId !== request.user!.id) {
      return new NextResponse(
        JSON.stringify({
          error: "Access denied. You can only update your own goals.",
          code: "ACCESS_DENIED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updates = await request.json();
    const sanitizedUpdates: Record<string, unknown> = {};

    // Validate and sanitize title if provided
    if (updates.title !== undefined) {
      if (typeof updates.title !== "string") {
        return new NextResponse(
          JSON.stringify({
            error: "Goal title must be a string",
            code: "INVALID_TITLE_TYPE",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const sanitizedTitle = updates.title.trim();
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

      sanitizedUpdates.title = sanitizedTitle;
    }

    // Validate and sanitize description if provided
    if (updates.description !== undefined) {
      if (typeof updates.description !== "string") {
        return new NextResponse(
          JSON.stringify({
            error: "Goal description must be a string",
            code: "INVALID_DESCRIPTION_TYPE",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const sanitizedDescription = updates.description.trim();
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

      sanitizedUpdates.description = sanitizedDescription;
    }

    // Validate completedSteps if provided
    if (updates.completedSteps !== undefined) {
      if (
        typeof updates.completedSteps !== "number" ||
        !Number.isInteger(updates.completedSteps)
      ) {
        return new NextResponse(
          JSON.stringify({
            error: "Completed steps must be a whole number",
            code: "INVALID_COMPLETED_STEPS",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (updates.completedSteps < 0) {
        return new NextResponse(
          JSON.stringify({
            error: "Completed steps cannot be negative",
            code: "NEGATIVE_COMPLETED_STEPS",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (updates.completedSteps > existingGoal.totalSteps) {
        return new NextResponse(
          JSON.stringify({
            error: `Completed steps cannot exceed total steps (${existingGoal.totalSteps})`,
            code: "COMPLETED_EXCEEDS_TOTAL",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      sanitizedUpdates.completedSteps = updates.completedSteps;
    }

    // Validate totalSteps if provided
    if (updates.totalSteps !== undefined) {
      if (
        typeof updates.totalSteps !== "number" ||
        !Number.isInteger(updates.totalSteps)
      ) {
        return new NextResponse(
          JSON.stringify({
            error: "Total steps must be a whole number",
            code: "INVALID_TOTAL_STEPS",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (updates.totalSteps < 1 || updates.totalSteps > 365) {
        return new NextResponse(
          JSON.stringify({
            error: "Total steps must be between 1 and 365",
            code: "TOTAL_STEPS_OUT_OF_RANGE",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // If reducing total steps, ensure completed steps don't exceed new total
      if (updates.totalSteps < existingGoal.completedSteps) {
        sanitizedUpdates.completedSteps = updates.totalSteps;
      }

      sanitizedUpdates.totalSteps = updates.totalSteps;
    }

    // Validate color if provided
    if (updates.color !== undefined) {
      if (typeof updates.color !== "string") {
        return new NextResponse(
          JSON.stringify({
            error: "Goal color must be a string",
            code: "INVALID_COLOR_TYPE",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(updates.color)) {
        return new NextResponse(
          JSON.stringify({
            error: "Goal color must be a valid hex color (e.g., #3B82F6)",
            code: "INVALID_COLOR_FORMAT",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      sanitizedUpdates.color = updates.color;
    }

    // Check if there are any valid updates
    if (Object.keys(sanitizedUpdates).length === 0) {
      return new NextResponse(
        JSON.stringify({
          error: "No valid updates provided",
          code: "NO_UPDATES",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const updatedGoal = goalUtils.updateGoal(goalId, sanitizedUpdates);

    if (!updatedGoal) {
      return new NextResponse(
        JSON.stringify({
          error: "Failed to update goal",
          code: "UPDATE_FAILED",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(JSON.stringify(updatedGoal), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update goal error:", error);

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
        error: "Failed to update goal. Please try again.",
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
 * DELETE /api/goals/[id].
 * Delete a specific goal by ID.
 * Requires CSRF protection for state-changing operation.
 */
const deleteGoalHandler: ProtectedRouteHandler = async (request) => {
  try {
    const url = new URL(request.url);
    const goalId = url.pathname.split("/").pop();

    if (!goalId || goalId === "route.ts") {
      return new NextResponse(
        JSON.stringify({
          error: "Goal ID is required",
          code: "MISSING_GOAL_ID",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const existingGoal = goalUtils.getGoalById(goalId);

    if (!existingGoal) {
      return new NextResponse(
        JSON.stringify({
          error: "Goal not found",
          code: "GOAL_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify goal ownership
    if (existingGoal.userId !== request.user!.id) {
      return new NextResponse(
        JSON.stringify({
          error: "Access denied. You can only delete your own goals.",
          code: "ACCESS_DENIED",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const deleted = goalUtils.deleteGoal(goalId);

    if (!deleted) {
      return new NextResponse(
        JSON.stringify({
          error: "Failed to delete goal",
          code: "DELETE_FAILED",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new NextResponse(
      JSON.stringify({
        message: "Goal deleted successfully",
        deletedGoalId: goalId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Delete goal error:", error);

    return new NextResponse(
      JSON.stringify({
        error: "Failed to delete goal. Please try again.",
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const GET = withAuthOnly(getGoalHandler);
export const PUT = withAuth(updateGoalHandler);
export const DELETE = withAuth(deleteGoalHandler);
