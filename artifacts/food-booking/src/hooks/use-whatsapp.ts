import { useQuery } from "@tanstack/react-query";

async function fetchConfig(): Promise<{ whatsappNumber: string }> {
  const res = await fetch("/api/config");
  if (!res.ok) return { whatsappNumber: "" };
  return res.json();
}

export function useWhatsAppNumber() {
  const { data } = useQuery({
    queryKey: ["config"],
    queryFn: fetchConfig,
    staleTime: Infinity,
  });
  return data?.whatsappNumber ?? "";
}

export function whatsAppLink(phone: string, message?: string) {
  let digits = phone.replace(/\D/g, "");
  // Auto-prepend India country code (+91) if the number is 10 digits
  if (digits.length === 10) {
    digits = "91" + digits;
  }
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
