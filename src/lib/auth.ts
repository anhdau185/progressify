import { Goal, JWTPayload, User } from "@/types";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { csrf, CSRF_CONSTANTS } from "./csrf";

const JWT_SECRET = process.env.JWT_SECRET;

// Cookie configuration
export const AUTH_COOKIE_NAME = "progressify-auth";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "strict" as const,
  path: "/",
  maxAge: 3 * 24 * 60 * 60, // 3 days in seconds
};

// In a real app, this would be a database
const users: User[] = [
  {
    id: "1",
    email: "demo@example.com",
    password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // default password (without quotes): "password"
    createdAt: new Date().toISOString(),
  },
];

const goals: Goal[] = [
  {
    id: "1",
    userId: "1",
    title: "Read 30 Books This Year",
    description: "Complete 30 books to expand knowledge",
    totalSteps: 30,
    completedSteps: 8,
    color: "#3B82F6",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "1",
    title: "Daily Exercise",
    description: "100 days of consistent exercise",
    totalSteps: 100,
    completedSteps: 23,
    color: "#10B981",
    createdAt: new Date().toISOString(),
  },
];

export const authUtils = {
  hashPassword: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
  },

  comparePassword: async (
    password: string,
    hashedPassword: string
  ): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
  },

  generateToken: (userId: string): string => {
    if (!JWT_SECRET) {
      throw new Error("Server misconfigured");
    }

    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "3d" });
  },

  verifyToken: (token: string): JWTPayload | null => {
    if (!JWT_SECRET) {
      throw new Error("Server misconfigured");
    }

    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return null;
    }
  },

  getUserByEmail: (email: string): User | undefined => {
    return users.find((user) => user.email === email);
  },

  getUserById: (id: string): User | undefined => {
    return users.find((user) => user.id === id);
  },

  createUser: async (email: string, password: string): Promise<User> => {
    const hashedPassword = await authUtils.hashPassword(password);
    const newUser: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return newUser;
  },

  updateUserPassword: async (
    userId: string,
    newPassword: string
  ): Promise<boolean> => {
    const userIndex = users.findIndex((user) => user.id === userId);
    if (userIndex !== -1) {
      users[userIndex].password = await authUtils.hashPassword(newPassword);
      return true;
    }
    return false;
  },
};

export const cookieUtils = {
  setAuthCookie: (response: NextResponse, token: string): void => {
    response.cookies.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
  },

  getAuthToken: async (): Promise<string | undefined> => {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_COOKIE_NAME)?.value;
  },

  clearAuthCookies: (response: NextResponse): void => {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      ...COOKIE_OPTIONS,
      maxAge: 0,
    });
    response.cookies.set(CSRF_CONSTANTS.COOKIE_NAME, "", {
      ...COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: 0,
    });
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = await cookieUtils.getAuthToken();
    if (!token) return null;

    const decoded = authUtils.verifyToken(token);
    if (!decoded) return null;

    return authUtils.getUserById(decoded.userId) || null;
  },
};

// Authentication helpers for API routes
export const authHelpers = {
  createAuthResponse: (user: User): NextResponse => {
    const token = authUtils.generateToken(user.id);
    const csrfToken = csrf.generateToken(user.id);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email },
      csrfToken,
    });

    // Set secure cookies
    cookieUtils.setAuthCookie(response, token);
    csrf.setCookie(response, csrfToken);

    return response;
  },

  createLogoutResponse: (): NextResponse => {
    const response = NextResponse.json({ message: "Logged out successfully" });
    cookieUtils.clearAuthCookies(response);
    return response;
  },
};

export const goalUtils = {
  getGoalsByUserId: (userId: string): Goal[] => {
    return goals.filter((goal) => goal.userId === userId);
  },

  getGoalById: (id: string): Goal | undefined => {
    return goals.find((goal) => goal.id === id);
  },

  createGoal: (userId: string, goalData: Partial<Goal>): Goal => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      userId,
      title: goalData.title || "",
      description: goalData.description || "",
      totalSteps: goalData.totalSteps || 1,
      color: goalData.color || "#3B82F6",
      completedSteps: 0,
      createdAt: new Date().toISOString(),
    };
    goals.push(newGoal);
    return newGoal;
  },

  updateGoal: (goalId: string, updates: Partial<Goal>): Goal | null => {
    const goalIndex = goals.findIndex((goal) => goal.id === goalId);
    if (goalIndex !== -1) {
      goals[goalIndex] = { ...goals[goalIndex], ...updates };
      return goals[goalIndex];
    }
    return null;
  },

  deleteGoal: (goalId: string): boolean => {
    const goalIndex = goals.findIndex((goal) => goal.id === goalId);
    if (goalIndex !== -1) {
      goals.splice(goalIndex, 1);
      return true;
    }
    return false;
  },
};
