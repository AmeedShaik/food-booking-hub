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
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
