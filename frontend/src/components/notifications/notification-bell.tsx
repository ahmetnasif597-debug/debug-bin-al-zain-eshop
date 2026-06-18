import { useState, useRef, useEffect } from "react";
import { Bell, X, Flame, BadgePercent, AlertTriangle, CheckCheck } from "lucide-react";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  getGetNotificationsQueryKey,
} from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

const TYPE_CONFIG = {
  offer: {
    icon: <Flame className="w-4 h-4 text-orange-500" />,
    bg: "bg-orange-50 border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    label: "عرض",
  },
  discount: {
    icon: <BadgePercent className="w-4 h-4 text-green-600" />,
    bg: "bg-green-50 border-green-200",
    badge: "bg-green-100 text-green-700",
    label: "خصم",
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    bg: "bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    label: "تنبيه",
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "الآن";
  if (m < 60) return `منذ ${m} دقيقة`;
  if (h < 24) return `منذ ${h} ساعة`;
  return `منذ ${d} يوم`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: notifications } = useGetNotifications({
    query: {
      queryKey: getGetNotificationsQueryKey(),
      refetchInterval: 30000,
      refetchIntervalInBackground: false,
    },
  });

  const markAllRead = useMarkAllNotificationsRead();
  const markOneRead = useMarkNotificationRead();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => setOpen((v) => !v);

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () =>
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }),
    });
  };

  const handleMarkOne = (id: number) => {
    markOneRead.mutate(
      { id },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() }),
      }
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors active:scale-95"
        aria-label="الإشعارات"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white px-1 leading-none animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(320px,90vw)] z-[200] shadow-2xl rounded-2xl border border-border bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-black text-sm text-foreground">الإشعارات</span>
              {unreadCount > 0 && (
                <span className="bg-destructive text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-primary hover:text-primary/70 font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  قراءة الكل
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
            {!notifications || notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">لا توجد إشعارات</p>
              </div>
            ) : (
              (notifications ?? []).map((n) => {
                const cfg = TYPE_CONFIG[n.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.warning;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && handleMarkOne(n.id)}
                    className={`flex gap-3 p-4 cursor-pointer transition-colors ${
                      n.isRead
                        ? "bg-background hover:bg-muted/30"
                        : `${cfg.bg} hover:brightness-95`
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                        )}
                      </div>
                      <p className="font-bold text-sm text-foreground leading-snug">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
