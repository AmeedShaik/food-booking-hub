import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, startOfDay } from "date-fns";
import { CalendarIcon, Loader2, UtensilsCrossed, CheckCircle2 } from "lucide-react";

import { useCreateBooking, useListMenuItems } from "@workspace/api-client-react";
import { useWhatsAppNumber, whatsAppLink } from "@/hooks/use-whatsapp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_MENU_ITEMS = ["Chicken Biryani", "Mutton Biryani", "Chicken 65"];

const DEFAULT_PRICE_PER_PORTION = 200;

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number."),
  email: z.string().email("Please enter a valid email address."),
  date: z.date({
    required_error: "Please select a date.",
  }).refine((d) => {
    const tomorrow = startOfDay(addDays(new Date(), 1));
    return startOfDay(d) >= tomorrow;
  }, "Orders must be placed at least 1 day in advance.").refine((d) => {
    return d.getDay() === 0 || d.getDay() === 6;
  }, "We only accept orders for weekends (Saturday & Sunday)."),
  time: z.string({ required_error: "Please select a pickup slot." }),
  guests: z.coerce.number().min(1, "Minimum quantity is 1 portion (250g).").max(50),
  mealType: z.string({ required_error: "Please select an item." }),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

function isWeekend(date: Date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function isDisabledDate(date: Date) {
  const tomorrow = startOfDay(addDays(new Date(), 1));
  return startOfDay(date) < tomorrow || !isWeekend(date);
}

function buildPhonePeLink(amount: number, note: string) {
  const params = new URLSearchParams({
    pa: "9030921654-5@ybl",
    pn: "AMEED HUSSAIN SHAIK",
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `phonepe://pay?${params.toString()}`;
}

export default function Home() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<BookingFormValues | null>(null);
  const whatsappNumber = useWhatsAppNumber();

  // Fetch the menu from the API. If the request errors or returns no items
  // (e.g. before the admin seeds anything), fall back to a hardcoded list
  // so the customer flow keeps working.
  const { data: apiMenuItems } = useListMenuItems({ availableOnly: true });
  const menuOptions = (apiMenuItems && apiMenuItems.length > 0)
    ? apiMenuItems.map((m) => ({
        name: m.name,
        pricePerPortion: Math.round(m.pricePaise / 100),
      }))
    : FALLBACK_MENU_ITEMS.map((name) => ({
        name,
        pricePerPortion: DEFAULT_PRICE_PER_PORTION,
      }));

  const priceForItem = (name: string | undefined): number => {
    if (!name) return DEFAULT_PRICE_PER_PORTION;
    return menuOptions.find((m) => m.name === name)?.pricePerPortion
      ?? DEFAULT_PRICE_PER_PORTION;
  };

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      guests: 1,
      specialRequests: "",
    },
  });

  const createBooking = useCreateBooking();

  function onSubmit(data: BookingFormValues) {
    createBooking.mutate(
      {
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          date: format(data.date, "yyyy-MM-dd"),
          time: data.time,
          guests: data.guests,
          mealType: data.mealType,
          specialRequests: data.specialRequests || undefined,
        },
      },
      {
        onSuccess: () => {
          setSubmittedOrder(data);
          setIsSuccess(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
        onError: () => {
          toast({
            title: "Order failed",
            description: "There was an issue submitting your order. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <span className="font-serif text-2xl font-bold text-secondary">Home Kitchen</span>
        </div>
        <div className="flex items-center gap-4">
          {whatsappNumber && (
            <a
              href={whatsAppLink(whatsappNumber, "Hi! I'd like to place a weekend food order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
              </svg>
              Chat with us
            </a>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Side */}
        <div className="hidden md:flex w-1/2 relative bg-secondary">
          <div className="absolute inset-0 bg-black/20 z-10" />
          <img
            src="/hero.png"
            alt="Home cooked biryani"
            className="object-cover w-full h-full opacity-80"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 text-[#FFF9F2]">
              Home cooked,<br />made with love.
            </h1>
            <p className="text-lg md:text-xl text-[#FFF9F2]/80 max-w-md font-sans">
              Fresh biryani and snacks prepared every weekend. Pre-order by Friday and pick up on Saturday or Sunday.
            </p>
            <div className="mt-8 flex flex-col gap-2 text-[#FFF9F2]/90 text-sm font-medium">
              <span>Weekend orders only (Sat &amp; Sun)</span>
              <span>Order at least 1 day in advance</span>
              <span>Min. 250g per item (1 portion)</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-center relative">
          {/* Mobile Header */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-serif text-4xl font-bold text-secondary mb-2">Place your order</h1>
            <p className="text-muted-foreground text-sm">Weekend pickups only · Order 1 day in advance · Min. 250g</p>
          </div>

          <div className="max-w-md w-full mx-auto">
            {isSuccess && submittedOrder ? (
              (() => {
                const perPortion = priceForItem(submittedOrder.mealType);
                const total = submittedOrder.guests * perPortion;
                const advance = Math.ceil(total / 2);
                const payLink = buildPhonePeLink(
                  advance,
                  `Home Kitchen advance – ${submittedOrder.mealType} x${submittedOrder.guests}`
                );
                return (
                  <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg animate-in fade-in zoom-in duration-500 space-y-5">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="font-serif text-3xl font-bold text-secondary mb-2">Order Received</h2>
                      <p className="text-muted-foreground font-sans">
                        Thank you, {submittedOrder.name}! Pay the advance below to confirm your order.
                      </p>
                    </div>

                    {/* Order summary */}
                    <div className="border border-border rounded-xl overflow-hidden text-left">
                      <div className="bg-accent/40 px-4 py-2.5 flex justify-between text-sm">
                        <span className="text-muted-foreground">{submittedOrder.mealType} × {submittedOrder.guests} portion{submittedOrder.guests > 1 ? "s" : ""}</span>
                        <span className="font-semibold text-foreground">₹{total}</span>
                      </div>
                      <div className="px-4 py-3 flex justify-between items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Advance to pay now (50%)</p>
                          <p className="text-2xl font-serif font-bold text-secondary">₹{advance}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Remaining ₹{total - advance}</p>
                          <p>paid on pickup</p>
                        </div>
                      </div>
                    </div>

                    {/* PhonePe pay button */}
                    <a
                      href={payLink}
                      className="flex items-center justify-center gap-2.5 w-full h-14 rounded-full text-white font-bold text-base transition-opacity hover:opacity-90 active:scale-95"
                      style={{ background: "#5f259f" }}
                    >
                      <svg viewBox="0 0 40 40" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.2"/>
                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">Pe</text>
                      </svg>
                      Pay ₹{advance} via PhonePe
                    </a>
                    <p className="text-xs text-orange-600 font-medium -mt-2">
                      Pay half amount now to confirm your booking. Balance paid on pickup.
                    </p>

                    {/* WhatsApp after payment */}
                    {whatsappNumber && (
                      <a
                        href={whatsAppLink(whatsappNumber, `Hi! I placed an order for ${submittedOrder.mealType} x${submittedOrder.guests} and paid ₹${advance} advance via PhonePe. Please confirm my booking.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-[#25D366] text-white font-semibold text-base hover:bg-[#1ebe5d] transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                        </svg>
                        Confirm on WhatsApp after payment
                      </a>
                    )}

                    <Button
                      onClick={() => { setIsSuccess(false); setSubmittedOrder(null); form.reset(); }}
                      className="w-full h-12 text-base rounded-full"
                      variant="outline"
                    >
                      Place Another Order
                    </Button>
                  </div>
                );
              })()
            ) : (
              <>
                <div className="hidden md:block mb-10">
                  <h2 className="font-serif text-3xl font-bold text-secondary mb-2">Place your order</h2>
                  <p className="text-muted-foreground text-sm">Weekend pickups only · Order at least 1 day in advance · Min. 250g per item</p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Jane Doe" className="h-12 bg-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Phone Number</FormLabel>
                            <FormControl>
                              <div className="flex h-12">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium select-none">
                                  +91
                                </span>
                                <Input
                                  placeholder="98765 43210"
                                  className="h-12 bg-white rounded-l-none flex-1"
                                  {...field}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    field.onChange(val);
                                  }}
                                  maxLength={10}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="jane@example.com" type="email" className="h-12 bg-white" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col pt-2">
                            <FormLabel className="text-foreground/80 mb-1">Pickup Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full h-12 pl-3 text-left font-normal bg-white",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Sat or Sun only</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={isDisabledDate}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Pickup Slot</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white">
                                  <SelectValue placeholder="Select slot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Morning (9am-11am)">Morning (9am – 11am)</SelectItem>
                                <SelectItem value="Afternoon (12pm-2pm)">Afternoon (12pm – 2pm)</SelectItem>
                                <SelectItem value="Evening (4pm-6pm)">Evening (4pm – 6pm)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="mealType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Item</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white">
                                  <SelectValue placeholder="Select item" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {menuOptions.map((item) => (
                                  <SelectItem key={item.name} value={item.name}>
                                    {item.name}
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ₹{item.pricePerPortion}/portion
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={50}
                                className="h-12 bg-white"
                                {...field}
                              />
                            </FormControl>
                            <p className="text-[11px] text-muted-foreground mt-1">1 portion = 250g (serves 1)</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/80">Special Instructions <span className="text-muted-foreground text-xs ml-1">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Spice level, allergy info, delivery notes..."
                              className="resize-none min-h-[80px] bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-14 text-lg font-medium rounded-full mt-4"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        "Place Order"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      We will confirm your order and share payment details via WhatsApp.
                    </p>
                  </form>
                </Form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
