import React, { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, MessageCircle, UtensilsCrossed, Printer } from "lucide-react";
import { whatsAppLink } from "@/hooks/use-whatsapp";

function printDayBookings(dateLabel: string, bookings: Booking[]) {
  const sorted = [...bookings].sort((a, b) => {
    const order = ["Breakfast (8am-11am)", "Lunch (12pm-3pm)", "Dinner (7pm-10pm)"];
    return order.indexOf(a.time) - order.indexOf(b.time);
  });

  const rows = sorted.map((b) => `
    <div class="booking">
      <div class="booking-header">
        <div>
          <div class="guest-name">${b.name}</div>
          <div class="meta">${b.time}</div>
        </div>
        <span class="status status-${b.status.toLowerCase()}">${b.status}</span>
      </div>
      <div class="detail-row">
        <span>${b.guests} guest${b.guests > 1 ? "s" : ""}</span>
        <span class="dot">·</span>
        <span>${b.mealType}</span>
        <span class="dot">·</span>
        <span>+91 ${b.phone}</span>
        <span class="dot">·</span>
        <span>${b.email}</span>
      </div>
      ${b.specialRequests ? `<div class="special">"${b.specialRequests}"</div>` : ""}
    </div>
  `).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bookings – ${dateLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Georgia, serif; color: #1a1a1a; padding: 32px; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: bold; color: #7b2d2d; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
    .booking { border: 1px solid #e0d6cc; border-radius: 8px; padding: 16px; margin-bottom: 14px; }
    .booking-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .guest-name { font-size: 16px; font-weight: bold; }
    .meta { font-size: 12px; color: #666; margin-top: 2px; }
    .status { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 999px; border: 1px solid; }
    .status-pending   { background: #fffbeb; color: #92400e; border-color: #fcd34d; }
    .status-confirmed { background: #f0fdf4; color: #166534; border-color: #86efac; }
    .status-completed { background: #eff6ff; color: #1e40af; border-color: #93c5fd; }
    .status-cancelled { background: #fef2f2; color: #991b1b; border-color: #fca5a5; }
    .detail-row { font-size: 12px; color: #555; display: flex; flex-wrap: wrap; gap: 4px; }
    .dot { color: #bbb; }
    .special { font-size: 12px; color: #c2540a; font-style: italic; margin-top: 6px; }
    .footer { margin-top: 32px; border-top: 1px solid #e0d6cc; padding-top: 12px; font-size: 11px; color: #999; text-align: center; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>Reservations — ${dateLabel}</h1>
  <div class="subtitle">${bookings.length} reservation${bookings.length > 1 ? "s" : ""} · Home Kitchen</div>
  ${rows}
  <div class="footer">Printed from Home Kitchen Admin · ${new Date().toLocaleString()}</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

type Booking = {
  id: number;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  mealType: string;
  specialRequests?: string | null;
  status: "Pending" | "Confirmed" | "Cancelled" | "Completed";
  bookedAt: string;
};

const STATUS_COLORS: Record<string, { dot: string; badge: string; label: string }> = {
  Pending:   { dot: "bg-amber-400",   badge: "bg-amber-50 text-amber-700 border-amber-200",   label: "Pending" },
  Confirmed: { dot: "bg-green-500",   badge: "bg-green-50 text-green-700 border-green-200",   label: "Confirmed" },
  Completed: { dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border-blue-200",       label: "Completed" },
  Cancelled: { dot: "bg-red-400",     badge: "bg-red-50 text-red-600 border-red-200",          label: "Cancelled" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ bookings }: { bookings: Booking[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), "yyyy-MM-dd")
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  // Group bookings by date string
  const byDate: Record<string, Booking[]> = {};
  for (const b of bookings) {
    if (!byDate[b.date]) byDate[b.date] = [];
    byDate[b.date].push(b);
  }

  const selectedBookings = selectedDate ? (byDate[selectedDate] ?? []) : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1 min-w-0">
        {/* Month Nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <h2 className="font-serif text-xl font-bold text-secondary">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const dayBookings = byDate[dateStr] ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);
            const selected = selectedDate === dateStr;

            // Count by status (only show up to 3 dots)
            const statusCounts = dayBookings.reduce<Record<string, number>>((acc, b) => {
              acc[b.status] = (acc[b.status] ?? 0) + 1;
              return acc;
            }, {});
            const dots = Object.entries(statusCounts).slice(0, 4);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(selected ? null : dateStr)}
                className={[
                  "relative flex flex-col items-center rounded-xl p-1.5 min-h-[60px] transition-all border",
                  inMonth ? "cursor-pointer" : "opacity-30 cursor-default pointer-events-none",
                  selected
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : today
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-accent",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-1",
                    today && !selected ? "bg-primary text-primary-foreground" : "",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </span>

                {dayBookings.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {dots.map(([status, count]) => (
                      <span
                        key={status}
                        className={[
                          "w-1.5 h-1.5 rounded-full",
                          selected ? "bg-white/80" : STATUS_COLORS[status]?.dot ?? "bg-gray-400",
                        ].join(" ")}
                        title={`${count} ${status}`}
                      />
                    ))}
                    {dayBookings.length > 4 && (
                      <span className={[
                        "text-[9px] font-bold leading-none",
                        selected ? "text-white/80" : "text-muted-foreground",
                      ].join(" ")}>
                        +{dayBookings.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {dayBookings.length > 0 && !selected && (
                  <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-muted-foreground">
                    {dayBookings.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border">
          {Object.entries(STATUS_COLORS).map(([status, { dot, label }]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Panel */}
      <div className="lg:w-80 shrink-0">
        <div className="bg-card border border-border rounded-xl overflow-hidden h-full">
          <div className="px-5 py-4 border-b border-border bg-accent/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {selectedDate ? format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d") : "Select a date"}
                </p>
                {selectedDate && (
                  <p className="text-2xl font-serif font-bold text-secondary mt-0.5">
                    {selectedBookings.length === 0
                      ? "No bookings"
                      : `${selectedBookings.length} reservation${selectedBookings.length > 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              {selectedDate && selectedBookings.length > 0 && (
                <button
                  onClick={() =>
                    printDayBookings(
                      format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d, yyyy"),
                      selectedBookings
                    )
                  }
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors mt-1"
                  title="Print / Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground">
                <UtensilsCrossed className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">Click a day to see its bookings</p>
              </div>
            ) : selectedBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center text-muted-foreground">
                <UtensilsCrossed className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm">No bookings on this day</p>
              </div>
            ) : (
              selectedBookings
                .sort((a, b) => {
                  const order = ["Breakfast (8am-11am)", "Lunch (12pm-3pm)", "Dinner (7pm-10pm)"];
                  return order.indexOf(a.time) - order.indexOf(b.time);
                })
                .map((b) => {
                  const colors = STATUS_COLORS[b.status];
                  return (
                    <div key={b.id} className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{b.name}</p>
                          <p className="text-xs text-muted-foreground">{b.time}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors?.badge}`}>
                          {b.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{b.guests} guest{b.guests > 1 ? "s" : ""} · {b.mealType}</span>
                        <a
                          href={whatsAppLink(b.phone, `Hi ${b.name}, regarding your booking on ${b.date} (${b.time}) — `)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#25D366] font-semibold hover:underline"
                        >
                          <MessageCircle className="w-3 h-3" />
                          +91 {b.phone}
                        </a>
                      </div>
                      {b.specialRequests && (
                        <p className="mt-1.5 text-xs text-orange-600 italic">"{b.specialRequests}"</p>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
