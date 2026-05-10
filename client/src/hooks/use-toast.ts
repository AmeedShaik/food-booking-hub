import { useState } from "react";

type Toast = { id: string; title: string; description?: string; variant?: "default" | "destructive" };

let listeners: ((t: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function emit() { listeners.forEach((l) => l([...toasts])); }

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { ...t, id }];
  emit();
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== id); emit(); }, 4000);
}

export function useToast() {
  const [list, setList] = useState<Toast[]>(toasts);
  if (!listeners.includes(setList)) listeners.push(setList);
  return { toasts: list, toast };
}
