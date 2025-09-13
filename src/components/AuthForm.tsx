"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface AuthFormProps {
  mode?: "login" | "register" | "reset-password";
}

export default function AuthForm({ mode = "login" }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = `/api/auth/${mode}`;
      const body =
        mode === "reset-password"
          ? { email, newPassword: password }
          : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (mode === "reset-password") {
          toast.success("Password reset successfully");
          router.push("/login");
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          toast.success(
            `${mode === "login" ? "Logged in" : "Account created"} successfully`
          );
          router.push("/dashboard");
        }
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = (): string => {
    switch (mode) {
      case "register":
        return "Create Account";
      case "reset-password":
        return "Reset Password";
      default:
        return "Sign In";
    }
  };

  const getButtonText = (): string => {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {getTitle()}
          </h2>
          <p className="text-gray-600">
            Transform your goals into visual progress
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {mode === "reset-password" ? "New Password" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {getButtonText()}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === "login" && (
            <>
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => router.push("/register")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Sign up
                </button>
              </p>
              <p className="text-sm text-gray-600">
                <button
                  onClick={() => router.push("/reset-password")}
                  className="text-blue-600 hover:text-blue-500 font-medium"
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
                className="text-blue-600 hover:text-blue-500 font-medium"
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
                className="text-blue-600 hover:text-blue-500 font-medium"
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
