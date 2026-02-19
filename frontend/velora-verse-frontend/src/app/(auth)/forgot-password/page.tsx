"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { forgotPassword } from "@/lib/api/auth";
import { useGuestOnly } from "@/lib/hooks/use-auth";
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
export default function ForgotPasswordPage() {
  useGuestOnly();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword(email.trim());
      setIsSubmitted(true);
      toast.success("Password reset instructions sent to your email");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-lg shadow-primary/5">
      {isSubmitted ? (
        <>
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <MailCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Check your email
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ve sent password reset instructions to{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Please check your inbox and follow the link to reset your
              password.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder, or{" "}
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setEmail("");
                }}
                className="font-medium text-primary hover:underline"
              >
                try again
              </button>
              .
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link href={ROUTES.LOGIN}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader className="pb-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Forgot password?
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you instructions to
              reset your password.
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  className="rounded-xl"
                />
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
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <Link
                href={ROUTES.LOGIN}
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Login
              </Link>
            </CardFooter>
          </form>
        </>
      )}
    </Card>
  );
}
