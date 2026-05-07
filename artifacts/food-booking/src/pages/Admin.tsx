import React, { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Check, 
  X, 
  Trash2, 
  MoreHorizontal, 
  UtensilsCrossed, 
  ChefHat, 
  Clock, 
  CalendarDays,
  Users,
  Search,
  ArrowLeft,
  MessageCircle,
  Copy,
  CheckCheck,
  Link2
} from "lucide-react";
import { whatsAppLink } from "@/hooks/use-whatsapp";

import { 
  useListBookings, 
  useGetBookingStats, 
  useUpdateBookingStatus, 
  useDeleteBooking,
  getListBookingsQueryKey,
  getGetBookingStatsQueryKey
} from "@workspace/api-client-react";
import type { BookingStatus } from "@workspace/api-client-react/src/generated/api.schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody as Body,
  TableCell as Cell,
  TableHead as Head,
  TableHeader as Header,
  TableRow as Row,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Confirmed":
      return "default"; // Primary color (Terracotta)
    case "Pending":
      return "secondary"; // Secondary color (Burgundy)
    case "Completed":
      return "outline"; // Uses border color
    case "Cancelled":
      return "destructive"; // Red
    default:
      return "outline";
  }
};

function useCopyLink() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  return { copied, copy };
}

export default function Admin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { copied, copy } = useCopyLink();

  const origin = window.location.origin;
  const customerLink = origin + "/";
  const adminLink = origin + "/admin";

  // For Delete Dialog
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  // Queries
  const { data: bookings, isLoading: isLoadingBookings } = useListBookings(
    filter !== "all" ? { status: filter as any } : undefined,
    { query: { queryKey: getListBookingsQueryKey(filter !== "all" ? { status: filter as any } : undefined) } }
  );

  const { data: stats, isLoading: isLoadingStats } = useGetBookingStats({
    query: { queryKey: getGetBookingStatsQueryKey() }
  });

  // Mutations
  const updateStatus = useUpdateBookingStatus();
  const deleteBooking = useDeleteBooking();

  const handleUpdateStatus = (id: number, status: BookingStatus) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Booking marked as ${status}` });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (!bookingToDelete) return;
    
    deleteBooking.mutate(
      { id: bookingToDelete },
      {
        onSuccess: () => {
          toast({ title: "Booking deleted successfully" });
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBookingStatsQueryKey() });
          setBookingToDelete(null);
        },
        onError: () => {
          toast({ title: "Failed to delete booking", variant: "destructive" });
          setBookingToDelete(null);
        }
      }
    );
  };

  const filteredBookings = bookings?.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search)
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="w-full py-4 px-6 md:px-8 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-secondary leading-none">Kitchen Admin</h1>
              <p className="text-xs text-muted-foreground mt-1">Manage your home reservations</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-accent/20 px-4 py-2 rounded-full">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Back to Site</span>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">

        {/* Shareable Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Link */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Customer Booking Link</p>
              <p className="text-sm font-medium text-foreground truncate">{customerLink}</p>
            </div>
            <button
              onClick={() => copy(customerLink, "customer")}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {copied === "customer" ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "customer" ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Admin Link */}
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
              <ChefHat className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Admin Panel Link</p>
              <p className="text-sm font-medium text-foreground truncate">{adminLink}</p>
            </div>
            <button
              onClick={() => copy(adminLink, "admin")}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors"
            >
              {copied === "admin" ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === "admin" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard title="Today's Tables" value={stats?.todayCount} icon={<CalendarDays className="w-4 h-4 text-primary" />} isLoading={isLoadingStats} />
          <StatCard title="Pending" value={stats?.pending} icon={<Clock className="w-4 h-4 text-orange-500" />} isLoading={isLoadingStats} />
          <StatCard title="Confirmed" value={stats?.confirmed} icon={<Check className="w-4 h-4 text-green-600" />} isLoading={isLoadingStats} />
          <StatCard title="Total Guests" value={stats?.total} icon={<Users className="w-4 h-4 text-blue-500" />} isLoading={isLoadingStats} />
          <StatCard title="Completed" value={stats?.completed} icon={<UtensilsCrossed className="w-4 h-4 text-secondary" />} isLoading={isLoadingStats} />
          <StatCard title="Cancelled" value={stats?.cancelled} icon={<X className="w-4 h-4 text-destructive" />} isLoading={isLoadingStats} />
        </div>

        {/* Bookings Section */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-secondary">Reservations</h2>
              <p className="text-sm text-muted-foreground">View and manage all your table bookings.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search guests..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
            </div>
          </div>

          <div className="px-6 pt-4">
            <Tabs defaultValue="all" value={filter} onValueChange={setFilter} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Bookings</TabsTrigger>
                <TabsTrigger value="Pending">Pending</TabsTrigger>
                <TabsTrigger value="Confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="Completed">Completed</TabsTrigger>
                <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <Header>
                <Row>
                  <Head>Guest</Head>
                  <Head>Contact</Head>
                  <Head>Date & Time</Head>
                  <Head>Details</Head>
                  <Head>Status</Head>
                  <Head className="text-right">Actions</Head>
                </Row>
              </Header>
              <Body>
                {isLoadingBookings ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Row key={i}>
                      <Cell><Skeleton className="h-5 w-32" /></Cell>
                      <Cell><Skeleton className="h-5 w-24" /></Cell>
                      <Cell><Skeleton className="h-5 w-28" /></Cell>
                      <Cell><Skeleton className="h-5 w-20" /></Cell>
                      <Cell><Skeleton className="h-6 w-20 rounded-full" /></Cell>
                      <Cell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></Cell>
                    </Row>
                  ))
                ) : filteredBookings.length === 0 ? (
                  <Row>
                    <Cell colSpan={6} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 mb-2 opacity-20" />
                        <p>No bookings found matching your criteria.</p>
                      </div>
                    </Cell>
                  </Row>
                ) : (
                  filteredBookings.map((booking) => (
                    <Row key={booking.id}>
                      <Cell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-foreground">{booking.name}</span>
                          <span className="text-xs text-muted-foreground">ID: #{booking.id}</span>
                        </div>
                      </Cell>
                      <Cell>
                        <div className="flex flex-col space-y-1">
                          <a
                            href={whatsAppLink(booking.phone, `Hi ${booking.name}, your booking on ${booking.date} (${booking.time}) is confirmed. We look forward to seeing you!`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#25D366] hover:underline w-fit"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {booking.phone}
                          </a>
                          <a href={`mailto:${booking.email}`} className="text-xs text-muted-foreground hover:underline w-fit">
                            {booking.email}
                          </a>
                        </div>
                      </Cell>
                      <Cell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{format(new Date(booking.date), "MMM d, yyyy")}</span>
                          <span className="text-xs text-muted-foreground">{booking.time}</span>
                        </div>
                      </Cell>
                      <Cell>
                        <div className="flex flex-col">
                          <span className="text-sm">{booking.guests} Guests</span>
                          <span className="text-xs text-muted-foreground">{booking.mealType}</span>
                          {booking.specialRequests && (
                            <span className="text-xs text-orange-600 mt-1 max-w-[150px] truncate" title={booking.specialRequests}>
                              * {booking.specialRequests}
                            </span>
                          )}
                        </div>
                      </Cell>
                      <Cell>
                        <Badge variant={getStatusBadgeVariant(booking.status) as any} className="whitespace-nowrap">
                          {booking.status}
                        </Badge>
                      </Cell>
                      <Cell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              disabled={booking.status === "Confirmed" || updateStatus.isPending}
                              onClick={() => handleUpdateStatus(booking.id, "Confirmed" as BookingStatus)}
                            >
                              <Check className="mr-2 h-4 w-4" /> Confirm
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              disabled={booking.status === "Completed" || updateStatus.isPending}
                              onClick={() => handleUpdateStatus(booking.id, "Completed" as BookingStatus)}
                            >
                              <UtensilsCrossed className="mr-2 h-4 w-4" /> Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              disabled={booking.status === "Cancelled" || updateStatus.isPending}
                              onClick={() => handleUpdateStatus(booking.id, "Cancelled" as BookingStatus)}
                            >
                              <X className="mr-2 h-4 w-4" /> Cancel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={() => setBookingToDelete(booking.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Cell>
                    </Row>
                  ))
                )}
              </Body>
            </Table>
          </div>
        </div>
      </main>

      <AlertDialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this booking record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? "Deleting..." : "Delete Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ title, value, icon, isLoading }: { title: string; value?: number; icon: React.ReactNode; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col items-start justify-center h-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-muted rounded-md">
            {icon}
          </div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <p className="text-2xl font-serif font-bold text-foreground">{value || 0}</p>
        )}
      </CardContent>
    </Card>
  );
}
