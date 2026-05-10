import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL || "";

export type Booking = {
  id: number;
  name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  meal_type: string;
  special_requests?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  created_at: string;
};

export type BookingStats = {
  total: string; pending: string; confirmed: string;
  completed: string; cancelled: string; today: string;
};

// ── Fetch all bookings ──────────────────────────────────────────────────────
export function useBookings() {
  return useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: () => fetch(`${API}/api/bookings`).then((r) => r.json()),
    refetchInterval: 30_000,
  });
}

// ── Fetch stats ─────────────────────────────────────────────────────────────
export function useBookingStats() {
  return useQuery<BookingStats>({
    queryKey: ["bookings-stats"],
    queryFn: () => fetch(`${API}/api/bookings/stats`).then((r) => r.json()),
    refetchInterval: 30_000,
  });
}

// ── Create booking ──────────────────────────────────────────────────────────
export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Booking, "id" | "status" | "created_at" | "meal_type"> & { mealType: string }) =>
      fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

// ── Update status ───────────────────────────────────────────────────────────
export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`${API}/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["bookings-stats"] });
    },
  });
}
