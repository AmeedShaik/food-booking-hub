import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  UtensilsCrossed,
  CalendarDays,
} from "lucide-react";

import {
  useListMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getListMenuItemsQueryKey,
  type MenuItem,
  type CreateMenuItemBody,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody as Body,
  TableCell as Cell,
  TableHead as Head,
  TableHeader as Header,
  TableRow as Row,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ---- Form schema ----

const menuItemFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  description: z.string().max(500).optional(),
  // Price is entered in rupees, converted to paise on submit.
  priceRupees: z.coerce
    .number({ invalid_type_error: "Enter a price in rupees" })
    .min(0, "Price cannot be negative")
    .max(100000),
  category: z.string().min(1, "Category is required").max(40),
  imageUrl: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .optional(),
  available: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

const COMMON_CATEGORIES = [
  "Biryani",
  "Starters",
  "Mains",
  "Sides",
  "Desserts",
  "Beverages",
];

function formatRupees(paise: number): string {
  return (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

// ---- Component ----

export default function MenuAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  const { data: items, isLoading } = useListMenuItems(undefined, {
    query: { queryKey: getListMenuItemsQueryKey() },
  });

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    items?.forEach((m) => set.add(m.category));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((m) => {
      if (filterCategory !== "all" && m.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          (m.description ?? "").toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, search, filterCategory]);

  const stats = useMemo(() => {
    const total = items?.length ?? 0;
    const available = items?.filter((m) => m.available).length ?? 0;
    const cats = categories.length;
    return { total, available, unavailable: total - available, categories: cats };
  }, [items, categories]);

  const handleToggleAvailable = (item: MenuItem) => {
    updateMutation.mutate(
      { id: item.id, data: { available: !item.available } },
      {
        onSuccess: () => {
          toast({
            title: `"${item.name}" is now ${!item.available ? "available" : "unavailable"}`,
          });
          invalidate();
        },
        onError: () => {
          toast({ title: "Failed to update item", variant: "destructive" });
        },
      },
    );
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    deleteMutation.mutate(
      { id: itemToDelete.id },
      {
        onSuccess: () => {
          toast({ title: `Deleted "${itemToDelete.name}"` });
          invalidate();
          setItemToDelete(null);
        },
        onError: () => {
          toast({ title: "Failed to delete item", variant: "destructive" });
          setItemToDelete(null);
        },
      },
    );
  };

  const handleSubmit = (values: MenuItemFormValues, item: MenuItem | null) => {
    const payload: CreateMenuItemBody = {
      name: values.name,
      description: values.description?.trim() || undefined,
      pricePaise: Math.round(values.priceRupees * 100),
      category: values.category.trim(),
      imageUrl: values.imageUrl?.trim() || undefined,
      available: values.available,
      sortOrder: values.sortOrder,
    };

    if (item) {
      updateMutation.mutate(
        { id: item.id, data: payload },
        {
          onSuccess: () => {
            toast({ title: `Updated "${payload.name}"` });
            invalidate();
            setEditingItem(null);
          },
          onError: () => toast({ title: "Update failed", variant: "destructive" }),
        },
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: `Created "${payload.name}"` });
            invalidate();
            setIsCreateOpen(false);
          },
          onError: () => toast({ title: "Create failed", variant: "destructive" }),
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-8 border-b border-border bg-card sticky top-0 z-40">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-secondary leading-none">
                Menu Management
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Create, edit and toggle items shown to customers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/kitchen-dash"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-accent/20 px-4 py-2 rounded-full"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden md:inline">Bookings</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-accent/20 px-4 py-2 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden md:inline">Site</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Items" value={stats.total} isLoading={isLoading} />
          <StatCard label="Available" value={stats.available} isLoading={isLoading} />
          <StatCard label="Unavailable" value={stats.unavailable} isLoading={isLoading} />
          <StatCard label="Categories" value={stats.categories} isLoading={isLoading} />
        </div>

        {/* Toolbar */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="font-serif text-2xl font-bold text-secondary">Menu Items</h2>
              <p className="text-sm text-muted-foreground">
                Manage what your customers can order.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add item
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <Header>
                <Row>
                  <Head className="w-16">Image</Head>
                  <Head>Name</Head>
                  <Head>Category</Head>
                  <Head>Price</Head>
                  <Head className="w-28">Available</Head>
                  <Head className="w-20">Order</Head>
                  <Head className="text-right">Actions</Head>
                </Row>
              </Header>
              <Body>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Row key={i}>
                      <Cell>
                        <Skeleton className="h-10 w-10 rounded-md" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-5 w-32" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-5 w-20" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-5 w-16" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-6 w-12 rounded-full" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-5 w-8" />
                      </Cell>
                      <Cell>
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </Cell>
                    </Row>
                  ))
                ) : filtered.length === 0 ? (
                  <Row>
                    <Cell colSpan={7} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 mb-2 opacity-20" />
                        <p>No menu items found.</p>
                        {!items?.length && (
                          <Button
                            variant="link"
                            onClick={() => setIsCreateOpen(true)}
                            className="mt-2"
                          >
                            Add your first item
                          </Button>
                        )}
                      </div>
                    </Cell>
                  </Row>
                ) : (
                  filtered.map((item) => (
                    <Row key={item.id}>
                      <Cell>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-md object-cover bg-muted"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                            <UtensilsCrossed className="w-4 h-4" />
                          </div>
                        )}
                      </Cell>
                      <Cell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{item.name}</span>
                          {item.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </Cell>
                      <Cell>
                        <Badge variant="outline">{item.category}</Badge>
                      </Cell>
                      <Cell className="font-medium">{formatRupees(item.pricePaise)}</Cell>
                      <Cell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.available}
                            onCheckedChange={() => handleToggleAvailable(item)}
                            aria-label="Toggle available"
                          />
                          {item.available ? (
                            <Eye className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </Cell>
                      <Cell className="text-muted-foreground text-sm">{item.sortOrder}</Cell>
                      <Cell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingItem(item)}
                            aria-label="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setItemToDelete(item)}
                            className="text-destructive hover:text-destructive"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Cell>
                    </Row>
                  ))
                )}
              </Body>
            </Table>
          </div>
        </div>
      </main>

      {/* Create dialog */}
      <MenuItemDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        item={null}
        onSubmit={(values) => handleSubmit(values, null)}
        isSubmitting={createMutation.isPending}
      />

      {/* Edit dialog */}
      <MenuItemDialog
        open={!!editingItem}
        onOpenChange={(o) => !o && setEditingItem(null)}
        item={editingItem}
        onSubmit={(values) => handleSubmit(values, editingItem)}
        isSubmitting={updateMutation.isPending}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(o) => !o && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              "{itemToDelete?.name}" will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Stat card ----

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-8 w-12 mt-2" />
        ) : (
          <p className="text-2xl font-serif font-bold text-foreground mt-1">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Create / edit dialog ----

function MenuItemDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  item: MenuItem | null;
  onSubmit: (values: MenuItemFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    values: {
      name: item?.name ?? "",
      description: item?.description ?? "",
      priceRupees: item ? item.pricePaise / 100 : 0,
      category: item?.category ?? "",
      imageUrl: item?.imageUrl ?? "",
      available: item?.available ?? true,
      sortOrder: item?.sortOrder ?? 0,
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            {item ? `Edit "${item.name}"` : "Add a new menu item"}
          </DialogTitle>
          <DialogDescription>
            {item
              ? "Update the details. Changes apply to the customer site immediately."
              : "Add a dish that customers can choose when booking."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Chicken Biryani" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional. Aromatic basmati rice, marinated chicken, slow-cooked..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceRupees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Per portion / 250g
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        list="menu-categories"
                        placeholder="e.g. Biryani"
                        {...field}
                      />
                    </FormControl>
                    <datalist id="menu-categories">
                      {COMMON_CATEGORIES.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://... (optional)"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 items-end">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input type="number" step="1" min="0" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Lower numbers appear first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="available"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Available</FormLabel>
                      <FormDescription className="text-xs">
                        Show on customer site
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : item ? "Save changes" : "Create item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
