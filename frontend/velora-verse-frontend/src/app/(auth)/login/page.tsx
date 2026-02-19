"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { login } from "@/lib/api/auth";
import { useAuth, useGuestOnly } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || ROUTES.HOME;

  useGuestOnly();
  const { hydrate } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please enter your email and password");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      await hydrate();
      toast.success("Welcome back!");
      router.push(redirectTo);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-lg shadow-primary/5">
      <CardHeader className="pb-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account to continue
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {/* Email / Username / Phone */}
          <div className="space-y-2">
            <Label htmlFor="email">Email, Username or Phone</Label>
            <Input
              id="email"
              type="text"
              placeholder="Email, username or phone number"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              disabled={isSubmitting}
              className="rounded-xl"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isSubmitting}
                className="rounded-xl pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.REGISTER}
              className="font-medium text-primary hover:underline"
            >
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
