import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, addDays, startOfDay } from "date-fns";
import { CalendarIcon, Loader2, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useWhatsAppNumber, whatsAppLink } from "@/hooks/use-whatsapp";
import { useToast } from "@/hooks/use-toast";

const MENU_ITEMS = ["Chicken Biryani", "Mutton Biryani", "Chicken 65"];
const PRICE_PER_PORTION = 200;
const UPI_ID = import.meta.env.VITE_UPI_ID || "9030921654-5@ybl";
const UPI_NAME = import.meta.env.VITE_UPI_NAME || "AMEED HUSSAIN SHAIK";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number."),
  email: z.string().email("Please enter a valid email address."),
  date: z.date({ required_error: "Please select a date." })
    .refine((d) => startOfDay(d) >= startOfDay(addDays(new Date(), 1)), "Orders must be placed at least 1 day in advance.")
    .refine((d) => d.getDay() === 0 || d.getDay() === 6, "We only accept orders for weekends (Saturday & Sunday)."),
  time: z.string({ required_error: "Please select a pickup slot." }),
  guests: z.coerce.number().min(1).max(50),
  mealType: z.string({ required_error: "Please select an item." }),
  specialRequests: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function isDisabledDate(date: Date) {
  const tomorrow = startOfDay(addDays(new Date(), 1));
  return startOfDay(date) < tomorrow || (date.getDay() !== 0 && date.getDay() !== 6);
}

function buildPhonePeLink(amount: number, note: string) {
  const params = new URLSearchParams({ pa: UPI_ID, pn: UPI_NAME, am: String(amount), cu: "INR", tn: note });
  return `phonepe://pay?${params.toString()}`;
}

// ── Tiny inline UI helpers (no shadcn needed) ────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input ref={ref} className={`w-full h-12 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring ${className}`} {...props} />
  )
);

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = "", ...props }, ref) => (
    <textarea ref={ref} className={`w-full px-3 py-2 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[80px] ${className}`} {...props} />
  )
);

function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium text-foreground/80 mb-1 ${className}`}>{children}</p>;
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-500 mt-1">{msg}</p> : null;
}

// ── Simple date picker (inline calendar) ────────────────────────────────────
function DatePicker({ value, onChange }: { value?: Date; onChange: (d: Date) => void }) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full h-12 px-3 rounded-lg border border-input bg-white text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-ring">
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? format(value, "PPP") : "Sat or Sun only"}
        </span>
        <CalendarIcon className="h-4 w-4 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-border rounded-xl shadow-lg p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="px-2 py-1 text-sm hover:bg-accent rounded">‹</button>
            <span className="font-semibold text-sm">{format(month, "MMMM yyyy")}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="px-2 py-1 text-sm hover:bg-accent rounded">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-1">
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array(firstDay).fill(null).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
              const disabled = isDisabledDate(d);
              const selected = value && format(value, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
              return (
                <button key={i} type="button" disabled={disabled}
                  onClick={() => { onChange(d); setOpen(false); }}
                  className={`h-8 w-full rounded-lg text-sm transition-colors
                    ${disabled ? "text-muted-foreground/40 cursor-not-allowed" : "hover:bg-accent cursor-pointer"}
                    ${selected ? "bg-primary text-white hover:bg-primary" : ""}
                  `}>{i + 1}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState<FormValues | null>(null);
  const whatsappNumber = useWhatsAppNumber();

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", guests: 1, specialRequests: "" },
  });

  const createBooking = useCreateBooking();

  function onSubmit(data: FormValues) {
    createBooking.mutate(
      { name: data.name, phone: data.phone, email: data.email, date: format(data.date, "yyyy-MM-dd"),
        time: data.time, guests: data.guests, mealType: data.mealType, specialRequests: data.specialRequests },
      {
        onSuccess: () => { setSubmittedOrder(data); setIsSuccess(true); window.scrollTo({ top: 0, behavior: "smooth" }); },
        onError: () => toast({ title: "Order failed", description: "Please try again.", variant: "destructive" }),
      }
    );
  }

  const watchDate = watch("date");
  const watchMeal = watch("mealType");
  const watchTime = watch("time");

  const SuccessScreen = () => {
    if (!submittedOrder) return null;
    const total = submittedOrder.guests * PRICE_PER_PORTION;
    const advance = Math.ceil(total / 2);
    const payLink = buildPhonePeLink(advance, `Home Kitchen advance – ${submittedOrder.mealType} x${submittedOrder.guests}`);
    return (
      <div className="bg-white border border-border rounded-2xl p-8 text-center shadow-lg animate-in space-y-5">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold text-secondary mb-2">Order Received</h2>
          <p className="text-muted-foreground">Thank you, {submittedOrder.name}! Pay the advance below to confirm your order.</p>
        </div>
        <div className="border border-border rounded-xl overflow-hidden text-left">
          <div className="bg-accent/40 px-4 py-2.5 flex justify-between text-sm">
            <span className="text-muted-foreground">{submittedOrder.mealType} × {submittedOrder.guests} portion{submittedOrder.guests > 1 ? "s" : ""}</span>
            <span className="font-semibold">₹{total}</span>
          </div>
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Advance to pay now (50%)</p>
              <p className="text-2xl font-serif font-bold text-secondary">₹{advance}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Remaining ₹{total - advance}</p><p>paid on pickup</p>
            </div>
          </div>
        </div>
        <a href={payLink}
          className="flex items-center justify-center gap-2.5 w-full h-14 rounded-full text-white font-bold text-base hover:opacity-90 active:scale-95 transition-all"
          style={{ background: "#5f259f" }}>
          Pay ₹{advance} via PhonePe
        </a>
        <p className="text-xs text-orange-600 font-medium">Pay half amount now to confirm. Balance paid on pickup.</p>
        {whatsappNumber && (
          <a href={whatsAppLink(whatsappNumber, `Hi! I placed an order for ${submittedOrder.mealType} x${submittedOrder.guests} and paid ₹${advance} advance via PhonePe. Please confirm my booking.`)}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#1ebe5d] transition-colors">
            ✅ Confirm on WhatsApp after payment
          </a>
        )}
        <button onClick={() => { setIsSuccess(false); setSubmittedOrder(null); reset(); }}
          className="w-full h-12 rounded-full border border-border text-sm font-medium hover:bg-accent transition-colors">
          Place Another Order
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full py-5 px-8 flex justify-between items-center border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-2xl font-bold text-secondary">Home Kitchen</span>
        </div>
        {whatsappNumber && (
          <a href={whatsAppLink(whatsappNumber, "Hi! I'd like to place a weekend food order.")}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1ebe5d] transition-colors">
            💬 Chat with us
          </a>
        )}
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Hero */}
        <div className="hidden md:flex w-1/2 relative bg-secondary">
          <div className="absolute inset-0 bg-black/20 z-10" />
          <img src="/hero.png" alt="Home cooked biryani" className="object-cover w-full h-full opacity-80" />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
            <h1 className="font-serif text-5xl lg:text-7xl font-bold leading-tight mb-4 text-[#FFF9F2]">
              Home cooked,<br />made with love.
            </h1>
            <p className="text-lg text-[#FFF9F2]/80 max-w-md">
              Fresh biryani and snacks prepared every weekend. Pre-order by Friday and pick up on Saturday or Sunday.
            </p>
            <div className="mt-8 flex flex-col gap-2 text-[#FFF9F2]/90 text-sm font-medium">
              <span>🗓 Weekend orders only (Sat &amp; Sun)</span>
              <span>⏰ Order at least 1 day in advance</span>
              <span>🍛 Min. 250g per item (1 portion)</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-center">
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-serif text-4xl font-bold text-secondary mb-2">Place your order</h1>
            <p className="text-muted-foreground text-sm">Weekend pickups only · Order 1 day in advance · Min. 250g</p>
          </div>
          <div className="max-w-md w-full mx-auto">
            {isSuccess ? <SuccessScreen /> : (
              <>
                <div className="hidden md:block mb-10">
                  <h2 className="font-serif text-3xl font-bold text-secondary mb-2">Place your order</h2>
                  <p className="text-muted-foreground text-sm">Weekend pickups only · Order at least 1 day in advance · Min. 250g</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Full Name</Label>
                      <Input placeholder="Jane Doe" {...register("name")} />
                      <FieldError msg={errors.name?.message} />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <div className="flex h-12">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-input bg-muted text-sm text-muted-foreground border-r-0 select-none">+91</span>
                        <input placeholder="98765 43210"
                          className="flex-1 px-3 rounded-r-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          {...register("phone")} maxLength={10}
                          onChange={(e) => setValue("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} />
                      </div>
                      <FieldError msg={errors.phone?.message} />
                    </div>
                  </div>

                  <div>
                    <Label>Email Address</Label>
                    <Input placeholder="jane@example.com" type="email" {...register("email")} />
                    <FieldError msg={errors.email?.message} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Pickup Date</Label>
                      <DatePicker value={watchDate} onChange={(d) => setValue("date", d, { shouldValidate: true })} />
                      <FieldError msg={errors.date?.message} />
                    </div>
                    <div>
                      <Label>Pickup Slot</Label>
                      <select value={watchTime || ""} onChange={(e) => setValue("time", e.target.value, { shouldValidate: true })}
                        className="w-full h-12 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select slot</option>
                        <option value="Morning (9am-11am)">Morning (9am – 11am)</option>
                        <option value="Afternoon (12pm-2pm)">Afternoon (12pm – 2pm)</option>
                        <option value="Evening (4pm-6pm)">Evening (4pm – 6pm)</option>
                      </select>
                      <FieldError msg={errors.time?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Item</Label>
                      <select value={watchMeal || ""} onChange={(e) => setValue("mealType", e.target.value, { shouldValidate: true })}
                        className="w-full h-12 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                        <option value="">Select item</option>
                        {MENU_ITEMS.map((item) => <option key={item} value={item}>{item}</option>)}
                      </select>
                      <FieldError msg={errors.mealType?.message} />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input type="number" min={1} max={50} {...register("guests")} />
                      <p className="text-[11px] text-muted-foreground mt-1">1 portion = 250g (serves 1) · ₹{PRICE_PER_PORTION}/portion</p>
                      <FieldError msg={errors.guests?.message} />
                    </div>
                  </div>

                  <div>
                    <Label>Special Instructions <span className="text-muted-foreground text-xs ml-1">(Optional)</span></Label>
                    <Textarea placeholder="Spice level, allergy info, delivery notes..." {...register("specialRequests")} />
                  </div>

                  <button type="submit" disabled={createBooking.isPending}
                    className="w-full h-14 rounded-full bg-primary text-white text-lg font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                    {createBooking.isPending ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing Order...</> : "Place Order"}
                  </button>
                  <p className="text-xs text-center text-muted-foreground">
                    We will confirm your order and share payment details via WhatsApp.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
