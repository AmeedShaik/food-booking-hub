import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, UtensilsCrossed, CheckCircle2 } from "lucide-react";

import { useCreateBooking } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
  date: z.date({
    required_error: "Please select a date.",
  }),
  time: z.string({
    required_error: "Please select a time slot.",
  }),
  guests: z.coerce.number().min(1).max(20),
  mealType: z.string({
    required_error: "Please select a meal type.",
  }),
  specialRequests: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function Home() {
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      guests: 2,
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
          setIsSuccess(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onError: () => {
          toast({
            title: "Booking failed",
            description: "There was an issue submitting your booking. Please try again.",
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
        <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Admin Portal
        </Link>
      </header>

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Left Side - Hero / Imagery */}
        <div className="hidden md:flex w-1/2 relative bg-secondary">
          <div className="absolute inset-0 bg-black/20 z-10" />
          <img 
            src="/hero.png" 
            alt="Cozy home cooked meal" 
            className="object-cover w-full h-full opacity-80"
          />
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 text-[#FFF9F2]">
              A seat at<br />our table.
            </h1>
            <p className="text-lg md:text-xl text-[#FFF9F2]/80 max-w-md font-sans">
              Experience the warmth of a home-cooked meal, prepared with love and shared with friends.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-center relative">
          {/* Mobile Header Text */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-serif text-4xl font-bold text-secondary mb-3">Book your table</h1>
            <p className="text-muted-foreground">Join us for a warm, intimate dining experience.</p>
          </div>

          <div className="max-w-md w-full mx-auto">
            {isSuccess ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-secondary mb-4">Request Received</h2>
                <p className="text-muted-foreground mb-8 font-sans text-lg">
                  Thank you for booking with Home Kitchen. We've received your request and will confirm your table shortly.
                </p>
                <Button 
                  onClick={() => {
                    setIsSuccess(false);
                    form.reset();
                  }}
                  className="w-full h-12 text-lg rounded-full"
                  variant="outline"
                >
                  Book Another Table
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden md:block mb-10">
                  <h2 className="font-serif text-3xl font-bold text-secondary mb-2">Reserve a spot</h2>
                  <p className="text-muted-foreground">Fill out the details below to request your booking.</p>
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
                              <Input placeholder="(555) 123-4567" className="h-12 bg-white" {...field} />
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
                            <FormLabel className="text-foreground/80 mb-1">Date</FormLabel>
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
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
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
                            <FormLabel className="text-foreground/80">Time Slot</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white">
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Breakfast (8am-11am)">Breakfast (8am - 11am)</SelectItem>
                                <SelectItem value="Lunch (12pm-3pm)">Lunch (12pm - 3pm)</SelectItem>
                                <SelectItem value="Dinner (7pm-10pm)">Dinner (7pm - 10pm)</SelectItem>
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
                        name="guests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Number of Guests</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={20} 
                                className="h-12 bg-white" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mealType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground/80">Meal Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 bg-white">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                                <SelectItem value="Non-Vegetarian">Non-Vegetarian</SelectItem>
                                <SelectItem value="Non-Vegetarian Special">Non-Vegetarian Special</SelectItem>
                              </SelectContent>
                            </Select>
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
                          <FormLabel className="text-foreground/80">Special Requests <span className="text-muted-foreground text-xs ml-1">(Optional)</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Allergies, celebrations, specific table preferences..." 
                              className="resize-none min-h-[100px] bg-white" 
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
                          Requesting Table...
                        </>
                      ) : (
                        "Request Table"
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      We will contact you shortly to confirm your reservation.
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
