"use client";

import { useState } from "react";
import { Bell, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeStockNotification } from "@/lib/api/stock-notifications";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

interface StockNotificationButtonProps {
  itemName: string;
  variantName?: string;
}

export function StockNotificationButton({
  itemName,
  variantName,
}: StockNotificationButtonProps) {
  const { user, isLoggedIn } = useAuthStore();
  const [email, setEmail] = useState(user?.email ?? "");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await subscribeStockNotification({
        variant: variantName || itemName,
      });
      setSubscribed(true);
      toast.success("We'll notify you when this item is back in stock!");
    } catch {
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-sm text-primary font-medium animate-fade-in">
        <CheckCircle className="h-4 w-4" />
        We'll notify you when it's back!
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setShowForm(true)}
      >
        <Bell className="h-4 w-4" />
        Notify Me When Available
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll let you know when this item is back in stock.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="max-w-[240px]"
        />
        <Button onClick={handleSubscribe} disabled={loading || !email.trim()}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Notify Me"
          )}
        </Button>
      </div>
    </div>
  );
}
