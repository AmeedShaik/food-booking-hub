export function useWhatsAppNumber(): string {
  return import.meta.env.VITE_WHATSAPP_NUMBER || "";
}

export function whatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
