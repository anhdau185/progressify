"use client";
import { type Goal } from "@/lib/auth";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Target } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

export default function GoalCard({ goal, onClick }: GoalCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const progressPercentage = (goal.completedSteps / goal.totalSteps) * 100;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-6 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: goal.color }}
          />
          <Target className="w-5 h-5 text-gray-500" />
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{goal.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {goal.description}
      </p>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">
            {goal.completedSteps} / {goal.totalSteps}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: goal.color,
            }}
          />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold" style={{ color: goal.color }}>
            {Math.round(progressPercentage)}%
          </span>
          <span className="text-sm text-gray-500">
            {goal.totalSteps - goal.completedSteps} remaining
          </span>
        </div>
      </div>
    </div>
  );
}
