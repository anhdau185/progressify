import { NextRequest, NextResponse } from "next/server";

interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  totalSteps: number;
  completedSteps: number;
  color: string;
  createdAt: string;
}

interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends NextRequest {
  user?: User;
  isCSRFValidated?: boolean;
}

type RouteHandler = (request: NextRequest) => Promise<NextResponse>;

type ProtectedRouteHandler = (
  request: AuthenticatedRequest
) => Promise<NextResponse>;

export type {
  AuthenticatedRequest,
  Goal,
  JWTPayload,
  ProtectedRouteHandler,
  RouteHandler,
  User,
};
