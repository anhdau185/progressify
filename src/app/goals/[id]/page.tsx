"use client";
import CircularProgress from "@/components/CircularProgress";
import { type Goal } from "@/lib/auth";
import { ArrowLeft, Calendar, Edit2, Trash2, Trophy } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function GoalDetailPage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchGoal();
  }, [params.id, router]);

  const fetchGoal = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoal(data);
      } else {
        toast.error("Goal not found");
        router.push("/dashboard");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const updateGoalProgress = async (newCompletedSteps: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completedSteps: newCompletedSteps }),
      });

      if (response.ok) {
        const updatedGoal = await response.json();
        setGoal(updatedGoal);

        // Show celebration for completion
        if (
          goal &&
          newCompletedSteps === goal.totalSteps &&
          goal.completedSteps !== goal.totalSteps
        ) {
          toast.success("🎉 Congratulations! Goal completed!", {
            duration: 5000,
            style: {
              background: "#10B981",
              color: "white",
            },
          });
        }
      } else {
        toast.error("Failed to update progress");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const deleteGoal = async () => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/goals/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Goal deleted successfully");
        router.push("/dashboard");
      } else {
        toast.error("Failed to delete goal");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading goal...</p>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Goal not found</p>
        </div>
      </div>
    );
  }

  const progressPercentage = (goal.completedSteps / goal.totalSteps) * 100;
  const isCompleted = goal.completedSteps === goal.totalSteps;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={deleteGoal}
                className="p-2 text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-center">
            <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-800">
              Goal Completed! 🎉
            </h3>
            <p className="text-green-700">
              Congratulations on achieving your goal!
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
              <h1 className="text-3xl font-bold text-gray-900">{goal.title}</h1>
            </div>
            {goal.description && (
              <p className="text-gray-600 text-lg">{goal.description}</p>
            )}
          </div>

          <div className="flex justify-center mb-8">
            <CircularProgress
              totalSteps={goal.totalSteps}
              completedSteps={goal.completedSteps}
              onStepToggle={updateGoalProgress}
              color={goal.color}
              size={400}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {goal.completedSteps}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {goal.totalSteps - goal.completedSteps}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div
                className="text-2xl font-bold mb-1"
                style={{ color: goal.color }}
              >
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-gray-600">Complete</div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm mt-6">
            <Calendar className="w-4 h-4" />
            <span>Created {new Date(goal.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            How to Track Progress
          </h3>
          <p className="text-blue-700">
            Click on the circles around the ring to mark your progress. Each
            circle represents one step towards your goal. Watch as your progress
            ring fills up with each achievement!
          </p>
        </div>
      </main>
    </div>
  );
}
