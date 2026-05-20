import {
  BarChart3,
  ClipboardList,
  FileText,
  FilePlus2,
  LayoutDashboard,
  Scale,
  Building2,
  Eye,
  Landmark,
  RefreshCcw,
  SlidersHorizontal,
  SquarePen,
  XCircle,
  UserCheck,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export const expandedSidebarWidth = 260;
export const collapsedSidebarWidth = 64;

export type NavigationItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  items?: NavigationItem[];
};

export type NavigationGroup = {
  label: string;
  icon: LucideIcon;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: "Executive",
    icon: BarChart3,
    items: [{ href: "/propertyconnect/dashboard", label: "Executive Dashboard", icon: BarChart3 }],
  },
  {
    label: "Customer Management",
    icon: UsersRound,
    items: [
      { href: "/propertyconnect/customer-management/customer-dashboard", label: "Customer Dashboard", icon: UsersRound },
      { href: "/propertyconnect/customer-management/leads", label: "Lead", icon: UserPlus },
      { href: "/propertyconnect/customer-management/prospects", label: "Prospect", icon: UserCheck },
      { href: "/propertyconnect/customer-management/reservations", label: "Reservation", icon: ClipboardList },
    ],
  },
  {
    label: "Lease Management",
    icon: FileText,
    items: [
      { href: "/propertyconnect/lease-management/dashboard", label: "Lease Dashboard", icon: LayoutDashboard },
      { href: "/propertyconnect/lease-management/configuration", label: "Lease Configuration", icon: SlidersHorizontal },
      { href: "/propertyconnect/lease-management/contracts", label: "Lease Contract", icon: FileText },
      { href: "/propertyconnect/lease-management/new-lease", label: "New Lease", icon: FilePlus2 },
      { href: "/propertyconnect/lease-management/amendments", label: "Amendment", icon: SquarePen },
      { href: "/propertyconnect/lease-management/renewals", label: "Renewal", icon: RefreshCcw },
      { href: "/propertyconnect/lease-management/terminations", label: "Termination", icon: XCircle },
      { href: "/propertyconnect/lease-management/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Legal Management",
    icon: Scale,
    items: [
      { href: "/propertyconnect/legal-management/dashboard", label: "Legal Dashboard", icon: LayoutDashboard },
      { href: "/propertyconnect/legal-management/legal-card", label: "Legal Card", icon: FileText },
    ],
  },
  {
    label: "Property Management",
    icon: Building2,
    items: [
      { href: "/propertyconnect/property-management/property-master", label: "Property Master", icon: Landmark },
      { href: "/propertyconnect/property-management/property-view", label: "Property View", icon: Eye },
    ],
  },
];
