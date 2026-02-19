"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/format-date";
import {
  Package,
  Tag,
  Bell,
  Star,
  Gift,
  ShoppingBag,
  X,
} from "lucide-react";
import type { UserNotification } from "@/types/notification";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Order: Package,
  Promotion: Tag,
  "Back in Stock": ShoppingBag,
  Review: Star,
  Loyalty: Star,
  "Gift Card": Gift,
  General: Bell,
};

interface NotificationItemProps {
  notification: UserNotification;
  onRead: (name: string) => void;
  onDelete: (name: string) => void;
}

export function NotificationItem({
  notification,
  onRead,
  onDelete,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.notification_type] || Bell;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={() => onRead(notification.name)}
    >
      <div className="mt-0.5 shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            !notification.is_read && "font-semibold"
          )}
        >
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.creation)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(notification.name);
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
