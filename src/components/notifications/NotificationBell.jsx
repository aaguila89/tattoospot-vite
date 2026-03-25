import { useState, useRef, useEffect } from "react";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotifications } from "../../hooks/useNotifications";

const TYPE_ICONS = {
  new_booking: "📅",
  accepted:    "✅",
  declined:    "❌",
  confirmed:   "💰",
};

export default function NotificationBell({ userId, onNavigate }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const { notifications, unreadCount, loading } = useNotifications(userId);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(notificationId) {
    await updateDoc(doc(db, "notifications", notificationId), { read: true });
  }

  async function markAllAsRead() {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "notifications", n.id), { read: true }));
    await batch.commit();
  }

  async function handleNotificationClick(notification) {
    if (!notification.read) await markAsRead(notification.id);
    if (notification.bookingId && onNavigate) onNavigate(notification.bookingId);
    setOpen(false);
  }

  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffMins = Math.floor((new Date() - date) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={panelRef}>

      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 6, position: "relative" }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#dc2626", color: "#fff",
            fontSize: 10, fontWeight: 700,
            minWidth: 16, height: 16, borderRadius: 99,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 340, background: "#fff",
          border: "1.5px solid #e2e8f0", borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 1000,
        }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#64748b" }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 420, overflowY: "auto" }}>
            {loading && <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>Loading…</p>}
            {!loading && notifications.length === 0 && (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: 32 }}>No notifications yet</p>
            )}
            {!loading && notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  display: "flex", gap: 12, width: "100%",
                  padding: "12px 16px", border: "none",
                  borderBottom: "1px solid #f1f5f9",
                  background: n.read ? "#fff" : "#eff6ff",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontSize: 20 }}>{TYPE_ICONS[n.type] || "🔔"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: n.read ? 400 : 600 }}>{n.title}</span>
                    {!n.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block", marginTop: 4 }} />}
                  </div>
                  <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 4px", lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{formatTime(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}