"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  Gift,
  Loader2,
  Package,
  Megaphone,
  MessageSquare,
  Star,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
} from "@/lib/api/notifications";
import { useRequireAuth } from "@/lib/hooks/use-auth";
import { ApiError } from "@/lib/api/client";
import { ROUTES } from "@/lib/utils/constants";
import { formatRelativeTime } from "@/lib/utils/format-date";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoading } from "@/components/shared/loading-spinner";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

import type { UserNotification, NotificationType } from "@/types/notification";

const NOTIFICATION_ICONS: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  Order: Package,
  Promotion: Megaphone,
  "Back in Stock": Bell,
  Review: MessageSquare,
  Loyalty: Star,
  "Gift Card": Gift,
  General: Bell,
};

function getNotificationRoute(notification: UserNotification): string | null {
  if (notification.action_url) return notification.action_url;

  if (
    notification.reference_doctype === "Order" &&
    notification.reference_name
  ) {
    return ROUTES.ORDER_DETAIL(notification.reference_name);
  }

  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchNotifications();
  }, [authLoading]);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const data = await getNotifications({ page: 1, page_size: 20 });
      setNotifications(data.items);
      setHasNext(data.has_next);
      setPage(1);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load notifications");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await getNotifications({ page: nextPage, page_size: 20 });
      setNotifications((prev) => [...prev, ...data.items]);
      setHasNext(data.has_next);
      setPage(nextPage);
    } catch {
      toast.error("Failed to load more notifications");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleClick(notification: UserNotification) {
    if (!notification.is_read) {
      try {
        await markAsRead(notification.name);
        setNotifications((prev) =>
          prev.map((n) =>
            n.name === notification.name ? { ...n, is_read: true } : n
          )
        );
      } catch {
        // Non-critical, don't block navigation
      }
    }

    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route);
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to mark all as read");
      }
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, name: string) {
    e.stopPropagation();
    setDeletingId(name);
    try {
      await deleteNotification(name);
      setNotifications((prev) => prev.filter((n) => n.name !== name));
      toast.success("Notification deleted");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to delete notification");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (authLoading || loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={handleMarkAllRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-1.5 h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<BellOff className="h-12 w-12" />}
          title="No notifications"
          description="You don't have any notifications yet. We'll notify you about orders, promotions, and more."
          actionLabel="Browse Products"
          actionHref={ROUTES.PRODUCTS}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon =
              NOTIFICATION_ICONS[notification.notification_type] || Bell;
            const route = getNotificationRoute(notification);

            return (
              <Card
                key={notification.name}
                className={cn(
                  "rounded-2xl border-border/60 shadow-sm transition-all duration-200",
                  !notification.is_read && "border-primary/20 bg-primary/[0.03]",
                  route && "cursor-pointer hover:shadow-md"
                )}
                onClick={() => handleClick(notification)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      notification.is_read
                        ? "bg-secondary"
                        : "bg-primary/10"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        notification.is_read
                          ? "text-muted-foreground"
                          : "text-primary"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm",
                          !notification.is_read && "font-semibold"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </div>

                    {notification.message && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.creation)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, notification.name)}
                    disabled={deletingId === notification.name}
                  >
                    {deletingId === notification.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}

          {/* Load more */}
          {hasNext && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
