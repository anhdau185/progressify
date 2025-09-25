"use client";
import { csrfClient } from "@/lib/csrf";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface AuthFormProps {
  mode?: "login" | "register" | "reset-password";
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  csrfToken: string;
}

interface ErrorResponse {
  error: string;
  code?: string;
}

const getTitle = (mode: AuthFormProps["mode"]): string => {
  switch (mode) {
    case "register":
      return "Create Account";
    case "reset-password":
      return "Reset Password";
    default:
      return "Sign In";
  }
};

const getButtonText = (
  mode: AuthFormProps["mode"],
  loading?: boolean
): string => {
  if (loading) return "Loading...";

  switch (mode) {
    case "register":
      return "Create Account";
    case "reset-password":
      return "Reset Password";
    default:
      return "Sign In";
  }
};

const getSubtitle = (mode: AuthFormProps["mode"]): string => {
  switch (mode) {
    case "register":
      return "Start tracking your progress today";
    case "reset-password":
      return "Enter your email and new password";
    default:
      return "Welcome back to your progress journey";
  }
};

export default function AuthForm({ mode = "login" }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthError = (errorData: ErrorResponse) => {
    switch (errorData.code) {
      case "MISSING_CREDENTIALS":
        toast.error("Please fill in all required fields");
        break;
      case "INVALID_EMAIL_FORMAT":
        toast.error("Please enter a valid email address");
        break;
      case "INVALID_CREDENTIALS":
        toast.error("Invalid email or password");
        break;
      case "RATE_LIMIT_EXCEEDED":
        toast.error("Too many attempts. Please wait before trying again.");
        break;
      case "USER_EXISTS":
        toast.error("An account with this email already exists");
        break;
      case "USER_NOT_FOUND":
        toast.error("No account found with this email address");
        break;
      default:
        toast.error(errorData.error || "Something went wrong");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const endpoint = `/api/auth/${mode}`;
      const body =
        mode === "reset-password"
          ? { email, newPassword: password }
          : { email, password };

      const response = await csrfClient.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        if (mode === "reset-password") {
          toast.success("Password reset successfully");
          router.push("/login");
        } else {
          toast.success(
            `${mode === "login" ? "Logged in" : "Account created"} successfully`
          );
          router.push("/dashboard");
        }
      } else {
        const errorData: ErrorResponse = await response.json();
        handleAuthError(errorData);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      toast.error("Email address is required");
      return false;
    }

    if (!password) {
      toast.error(
        `${mode === "reset-password" ? "New password" : "Password"} is required`
      );
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Password strength validation (except for login)
    if (mode !== "login" && password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    return true;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    handleSubmit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Progressify
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {getTitle(mode)}
          </h2>
          <p className="text-gray-600">{getSubtitle(mode)}</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
              disabled={loading}
              autoComplete={mode === "register" ? "email" : "username"}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {mode === "reset-password" ? "New Password" : "Password"}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              disabled={loading}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? undefined : 6}
            />
            {mode !== "login" && (
              <p className="text-sm text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {getButtonText(mode)}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === "login" && (
            <>
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  disabled={loading}
                >
                  Sign up
                </button>
              </p>
              <p className="text-sm text-gray-600">
                <button
                  onClick={() => router.push("/reset-password")}
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === "reset-password" && (
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                disabled={loading}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
