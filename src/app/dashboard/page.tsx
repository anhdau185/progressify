"use client";
import GoalCard from "@/components/GoalCard";
import NewGoalModal from "@/components/NewGoalModal";
import { type Goal } from "@/lib/auth";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { LogOut, Plus, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
}

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchGoals();
  }, [router]);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/goals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      } else {
        toast.error("Failed to fetch goals");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData: {
    title: string;
    description: string;
    totalSteps: number;
    color: string;
  }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(goalData),
      });

      if (response.ok) {
        const newGoal = await response.json();
        setGoals([...goals, newGoal]);
        toast.success("Goal created successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create goal");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setGoals((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Progressify
            </h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Goals
            </h2>
            <p className="text-gray-600">
              Track your progress with visual rings
            </p>
          </div>

          <button
            onClick={() => setShowNewGoalModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Goal</span>
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No goals yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first goal to start tracking progress
            </p>
            <button
              onClick={() => setShowNewGoalModal(true)}
              className="btn-primary"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={goals.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onClick={() => router.push(`/goals/${goal.id}`)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <NewGoalModal
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onSubmit={createGoal}
      />
    </div>
  );
}
