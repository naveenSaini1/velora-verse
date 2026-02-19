"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { register } from "@/lib/api/auth";
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
interface FormErrors {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
}

function validateForm(data: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}): FormErrors {
  const errors: FormErrors = {};

  if (!data.full_name.trim()) {
    errors.full_name = "Full name is required";
  }

  if (!data.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (data.phone && !/^\+?[\d\s-]{7,15}$/.test(data.phone)) {
    errors.phone = "Please enter a valid phone number";
  }

  if (!data.password) {
    errors.password = "Password is required";
  } else if (data.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!data.confirm_password) {
    errors.confirm_password = "Please confirm your password";
  } else if (data.password !== data.confirm_password) {
    errors.confirm_password = "Passwords do not match";
  }

  return errors;
}

export default function RegisterPage() {
  const router = useRouter();
  useGuestOnly();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      full_name: fullName,
      email,
      phone,
      password,
      confirm_password: confirmPassword,
    };

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });

      toast.success(
        "Account created successfully! Please sign in to continue."
      );
      router.push(ROUTES.LOGIN);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border-border/60 shadow-lg shadow-primary/5">
      <CardHeader className="pb-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Join Velora Verse and start shopping
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.full_name)
                  setErrors((prev) => ({ ...prev, full_name: undefined }));
              }}
              autoComplete="name"
              required
              disabled={isSubmitting}
              className="rounded-xl"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="rounded-xl"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Phone (optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone)
                  setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              autoComplete="tel"
              disabled={isSubmitting}
              className="rounded-xl"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                autoComplete="new-password"
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
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirm_password)
                    setErrors((prev) => ({
                      ...prev,
                      confirm_password: undefined,
                    }));
                }}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                className="rounded-xl pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-destructive">
                {errors.confirm_password}
              </p>
            )}
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={ROUTES.LOGIN}
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
