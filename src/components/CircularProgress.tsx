"use client";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  totalSteps: number;
  completedSteps: number;
  onStepToggle: (completedSteps: number) => void;
  color?: string;
  size?: number;
}

export default function CircularProgress({
  totalSteps,
  completedSteps,
  onStepToggle,
  color = "#3B82F6",
  size = 400,
}: CircularProgressProps) {
  const [checkedSteps, setCheckedSteps] = useState(new Set<number>());

  useEffect(() => {
    // Initialize checked steps based on completedSteps
    const initialChecked = new Set<number>();
    for (let i = 0; i < completedSteps; i++) {
      initialChecked.add(i);
    }
    setCheckedSteps(initialChecked);
  }, [completedSteps]);

  const handleCellClick = (index: number) => {
    const newCheckedSteps = new Set(checkedSteps);

    if (newCheckedSteps.has(index)) {
      newCheckedSteps.delete(index);
    } else {
      newCheckedSteps.add(index);
    }

    setCheckedSteps(newCheckedSteps);
    onStepToggle(newCheckedSteps.size);
  };

  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const angleStep = (2 * Math.PI) / totalSteps;

  const cells = [];
  for (let i = 0; i < totalSteps; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = radius * Math.cos(angle) + size / 2;
    const y = radius * Math.sin(angle) + size / 2;
    const isChecked = checkedSteps.has(i);

    cells.push(
      <g key={i}>
        <circle
          cx={x}
          cy={y}
          r="12"
          fill={isChecked ? color : "#E5E7EB"}
          stroke={isChecked ? color : "#D1D5DB"}
          strokeWidth="2"
          className="cursor-pointer transition-all duration-200 hover:scale-110"
          onClick={() => handleCellClick(i)}
        />
        {isChecked && (
          <text
            x={x}
            y={y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
            className="pointer-events-none"
          >
            ✓
          </text>
        )}
      </g>
    );
  }

  const progressPercentage = (checkedSteps.size / totalSteps) * 100;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="4"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={
              circumference - (progressPercentage / 100) * circumference
            }
            className="transition-all duration-500 ease-out"
            opacity="0.3"
          />

          {/* Individual cells */}
          {cells}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold" style={{ color }}>
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-gray-600 text-sm mt-1">
              {checkedSteps.size} / {totalSteps}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600">
          Click the cells around the circle to mark your progress
        </p>
      </div>
    </div>
  );
}
