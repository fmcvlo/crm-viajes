import type { Rol } from "@/lib/types";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FileText,
  DollarSign,
  Target,
  Mail,
  Bell,
  Settings,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Rol[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "agente"],
  },
  {
    href: "/leads",
    label: "Contactos",
    icon: Users,
    roles: ["admin", "agente"],
  },
  {
    href: "/reservas",
    label: "Reservas",
    icon: FileText,
    roles: ["admin", "agente"],
  },
  {
    href: "/proveedores",
    label: "Proveedores",
    icon: Building2,
    roles: ["admin", "agente"],
  },
  {
    href: "/comisiones",
    label: "Comisiones",
    icon: DollarSign,
    roles: ["admin", "agente"],
  },
  {
    href: "/objetivos",
    label: "Objetivos",
    icon: Target,
    roles: ["admin", "agente"],
  },
  {
    href: "/calendario",
    label: "Calendario",
    icon: CalendarDays,
    roles: ["admin", "agente"],
  },
  {
    href: "/automatizaciones",
    label: "Automatizaciones",
    icon: Mail,
    roles: ["admin"],
  },
  {
    href: "/notificaciones",
    label: "Notificaciones",
    icon: Bell,
    roles: ["admin", "agente"],
  },
  {
    href: "/configuracion",
    label: "Configuración",
    icon: Settings,
    roles: ["admin"],
  },
];
