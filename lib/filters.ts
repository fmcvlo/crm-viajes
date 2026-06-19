import type { Rol } from "@/lib/types";

interface HasAgenteId {
  agenteId: string;
}

interface HasUsuarioId {
  usuarioId: string;
}

export function filtrarPorRol<T extends HasAgenteId>(
  items: T[],
  rol: Rol,
  usuarioId: string
): T[] {
  if (rol === "admin") return items;
  return items.filter((item) => item.agenteId === usuarioId);
}

export function filtrarNotifPorUsuario<T extends HasUsuarioId>(
  items: T[],
  usuarioId: string
): T[] {
  return items.filter((item) => item.usuarioId === usuarioId);
}

export const USD_RATE = 1200;

export function toUSD(monto: number, moneda: string): number {
  return moneda === "ARS" ? monto / USD_RATE : monto;
}

export function formatMoneda(
  monto: number,
  moneda: "ARS" | "USD" = "USD",
  compact = false
): string {
  if (compact) {
    const abs = Math.abs(monto);
    const prefix = moneda === "USD" ? "USD " : "ARS ";
    if (abs >= 1_000_000) return prefix + (monto / 1_000_000).toFixed(1) + "M";
    if (abs >= 1_000) return prefix + (monto / 1_000).toFixed(0) + "k";
    return prefix + monto.toFixed(0);
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

export function calcularMontoReserva(
  items: { importe: number; moneda: string }[]
): { montoUSD: number } {
  const montoUSD = items.reduce((sum, i) => sum + toUSD(i.importe, i.moneda), 0);
  return { montoUSD };
}

export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}
