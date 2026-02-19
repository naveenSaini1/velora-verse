"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getUserProfile, updateProfile, changePassword } from "@/lib/api/auth";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ApiError } from "@/lib/api/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoading } from "@/components/shared/loading-spinner";

import type { User } from "@/types/user";

export default function ProfilePage() {
  const { isLoading: authLoading } = useRequireAuth();
  const setUser = useAuthStore((s) => s.setUser);

  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Password form
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetchProfile();
  }, [authLoading]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfile(data);
      setFullName(data.full_name || "");
      setPhone(data.phone || "");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setUser(updated);
      toast.success("Profile updated successfully");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!oldPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setIsChangingPassword(false);
    }
  }

  if (authLoading || loading) {
    return <PageLoading />;
  }

  if (!profile) {
    return null;
  }

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account details and preferences
        </p>
      </div>

      {/* Profile Info Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl">
              <AvatarImage
                src={profile.user_image || undefined}
                alt={profile.full_name}
              />
              <AvatarFallback className="rounded-2xl bg-primary/10 text-lg text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile.full_name}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                disabled={isSaving}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="rounded-xl bg-secondary/50"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                disabled={isSaving}
                className="rounded-xl"
              />
            </div>

            <Button type="submit" className="rounded-xl" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="old_password">Current Password</Label>
              <Input
                id="old_password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
                disabled={isChangingPassword}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                disabled={isChangingPassword}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                disabled={isChangingPassword}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              className="rounded-xl"
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
