import React, { useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays, Clock, CheckCircle2, Users, UtensilsCrossed, XCircle,
  Search, List, Calendar, Copy, ChevronDown, ArrowLeft, Loader2,
} from "lucide-react";
import { useBookings, useBookingStats, useUpdateStatus, type Booking } from "@/hooks/use-bookings";
import { whatsAppLink } from "@/hooks/use-whatsapp";

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER || "";
const BASE_URL = window.location.origin;

type Status = "all" | "pending" | "confirmed" | "completed" | "cancelled";
type ViewMode = "list" | "calendar";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-orange-100 text-orange-700 border border-orange-200",
  confirmed: "bg-green-100 text-green-700 border border-green-200",
  completed: "bg-blue-100 text-blue-700 border border-blue-200",
  cancelled: "bg-red-100 text-red-700 border border-red-200",
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className={`w-4 h-4 ${color || ""}`} />
        {label}
      </div>
      <p className="text-3xl font-serif font-bold text-secondary">{value}</p>
    </div>
  );
}

function ActionMenu({ booking, onUpdate }: { booking: Booking; onUpdate: (id: number, status: string) => void }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: "Mark Confirmed", status: "confirmed", show: booking.status === "pending" },
    { label: "Mark Completed", status: "completed", show: booking.status === "confirmed" },
    { label: "Cancel", status: "cancelled", show: booking.status !== "cancelled" && booking.status !== "completed" },
    { label: "Restore to Pending", status: "pending", show: booking.status === "cancelled" },
  ].filter((a) => a.show);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 hover:bg-accent rounded text-muted-foreground">
        <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-border rounded-xl shadow-lg py-1 text-sm">
            {actions.map((a) => (
              <button key={a.status} onClick={() => { onUpdate(booking.id, a.status); setOpen(false); }}
                className={`w-full text-left px-4 py-2 hover:bg-accent transition-colors ${a.status === "cancelled" ? "text-red-600" : ""}`}>
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CalendarView({ bookings }: { bookings: Booking[] }) {
  const [month, setMonth] = useState(() => new Date());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  const byDate: Record<string, Booking[]> = {};
  bookings.forEach((b) => {
    const key = b.date.slice(0, 10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(b);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-accent">‹ Prev</button>
        <span className="font-semibold">{format(month, "MMMM yyyy")}</span>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="px-3 py-1 text-sm border border-border rounded-lg hover:bg-accent">Next ›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} className="py-1 font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={i} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const key = format(d, "yyyy-MM-dd");
          const dayBookings = byDate[key] || [];
          const isToday = key === format(new Date(), "yyyy-MM-dd");
          return (
            <div key={i} className={`min-h-[70px] p-1 rounded-lg border text-xs ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
              <p className={`font-semibold mb-1 ${isToday ? "text-primary" : "text-foreground/70"}`}>{i + 1}</p>
              {dayBookings.slice(0, 2).map((b) => (
                <div key={b.id} className={`text-[10px] rounded px-1 py-0.5 mb-0.5 truncate ${STATUS_COLORS[b.status]}`}>
                  {b.name} – {b.guests}×
                </div>
              ))}
              {dayBookings.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayBookings.length - 2} more</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function KitchenDash() {
  const navigate = useNavigate();
  const { data: bookings = [], isLoading } = useBookings();
  const { data: stats } = useBookingStats();
  const updateStatus = useUpdateStatus();

  const [tab, setTab] = useState<Status>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<"customer" | "admin" | null>(null);

  function copyLink(type: "customer" | "admin") {
    const url = type === "customer" ? `${BASE_URL}/` : `${BASE_URL}/kitchen-dash`;
    navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleUpdate(id: number, status: string) {
    updateStatus.mutate({ id, status });
  }

  const filtered = bookings.filter((b) => {
    const matchTab = tab === "all" || b.status === tab;
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase()) || b.phone.includes(search);
    return matchTab && matchSearch;
  });

  const TABS: { label: string; value: Status }[] = [
    { label: "All Bookings", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Confirmed", value: "confirmed" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl text-secondary">Kitchen Admin</h1>
            <p className="text-xs text-muted-foreground">Manage your home reservations</p>
          </div>
        </div>
        <button onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Site
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { type: "customer" as const, label: "CUSTOMER BOOKING LINK", url: `${BASE_URL}/` },
            { type: "admin" as const, label: "ADMIN PANEL LINK", url: `${BASE_URL}/kitchen-dash` },
          ].map(({ type, label, url }) => (
            <div key={type} className="bg-white border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-semibold tracking-wider mb-1">{label}</p>
                <p className="text-sm text-foreground/80 truncate max-w-xs">{url}</p>
              </div>
              <button onClick={() => copyLink(type)}
                className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-3 py-1.5 hover:bg-accent transition-colors whitespace-nowrap">
                <Copy className="w-3.5 h-3.5" />
                {copied === type ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={CalendarDays} label="Today's Orders" value={stats?.today || 0} color="text-primary" />
          <StatCard icon={Clock} label="Pending" value={stats?.pending || 0} color="text-orange-500" />
          <StatCard icon={CheckCircle2} label="Confirmed" value={stats?.confirmed || 0} color="text-green-500" />
          <StatCard icon={Users} label="Total Orders" value={stats?.total || 0} />
          <StatCard icon={UtensilsCrossed} label="Completed" value={stats?.completed || 0} color="text-blue-500" />
          <StatCard icon={XCircle} label="Cancelled" value={stats?.cancelled || 0} color="text-red-500" />
        </div>

        {/* Reservations */}
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-secondary">Reservations</h2>
              <p className="text-sm text-muted-foreground">View and manage all your table bookings.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === "list" ? "bg-secondary text-white border-secondary" : "border-border hover:bg-accent"}`}>
                <List className="w-4 h-4" /> List
              </button>
              <button onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${view === "calendar" ? "bg-secondary text-white border-secondary" : "border-border hover:bg-accent"}`}>
                <Calendar className="w-4 h-4" /> Calendar
              </button>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search guests..."
                  className="h-9 pl-9 pr-4 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring w-52" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4 flex gap-1 border-b border-border overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`px-4 py-2 text-sm rounded-t-lg whitespace-nowrap transition-colors ${tab === t.value ? "bg-accent text-foreground font-medium border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading bookings...
              </div>
            ) : view === "calendar" ? (
              <CalendarView bookings={filtered} />
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No bookings found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b border-border">
                      <th className="pb-3 pr-4 font-medium">Customer</th>
                      <th className="pb-3 pr-4 font-medium">Contact</th>
                      <th className="pb-3 pr-4 font-medium">Pickup Date & Slot</th>
                      <th className="pb-3 pr-4 font-medium">Order Details</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((b) => (
                      <tr key={b.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="py-4 pr-4">
                          <p className="font-semibold text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">ID: #{b.id}</p>
                        </td>
                        <td className="py-4 pr-4">
                          {WHATSAPP ? (
                            <a href={whatsAppLink(b.phone, `Hi ${b.name}!`)} target="_blank" rel="noopener noreferrer"
                              className="text-green-600 hover:underline flex items-center gap-1">
                              💬 +91 {b.phone}
                            </a>
                          ) : (
                            <span className="text-foreground">+91 {b.phone}</span>
                          )}
                          <p className="text-xs text-muted-foreground">{b.email}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="font-medium">{format(new Date(b.date), "MMM d, yyyy")}</p>
                          <p className="text-xs text-muted-foreground">{b.time}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <p>{b.guests} portion{b.guests > 1 ? "s" : ""} ({b.guests * 250}g)</p>
                          <p className="text-xs text-muted-foreground">{b.meal_type}</p>
                          {b.special_requests && (
                            <p className="text-xs text-orange-600 mt-0.5">* {b.special_requests}</p>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_COLORS[b.status]}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-4">
                          <ActionMenu booking={b} onUpdate={handleUpdate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
