import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Scale,
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
      { href: "/propertyconnect/customer-management/reports", label: "Reports", icon: BarChart3 },
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
];
