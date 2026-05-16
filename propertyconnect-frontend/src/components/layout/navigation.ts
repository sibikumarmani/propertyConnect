import {
  BadgeCheck,
  Banknote,
  BarChart3,
  ClipboardCheck,
  FileText,
  HandCoins,
  Home,
  ListChecks,
  MapPinned,
  Search,
  ShieldCheck,
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
      {
        label: "CRM Leasing",
        icon: Home,
        items: [
          { href: "/propertyconnect/crm-leasing/leads", label: "Lead List", icon: UsersRound },
          { href: "/propertyconnect/crm-leasing/lead-entry", label: "Lead Entry", icon: UserPlus },
          { href: "/propertyconnect/crm-leasing/qualification", label: "Lead Qualification", icon: BadgeCheck },
          { href: "/propertyconnect/crm-leasing/convert-prospect", label: "Convert Prospect", icon: UserCheck },
          { href: "/propertyconnect/crm-leasing/prospect-profile", label: "Prospect Profile", icon: UsersRound },
          { href: "/propertyconnect/crm-leasing/requirements", label: "Requirements", icon: ClipboardCheck },
          { href: "/propertyconnect/crm-leasing/unit-search", label: "Unit Search", icon: Search },
          { href: "/propertyconnect/crm-leasing/site-visit", label: "Site Visit", icon: MapPinned },
          { href: "/propertyconnect/crm-leasing/offers", label: "Offer", icon: FileText },
          { href: "/propertyconnect/crm-leasing/negotiation", label: "Negotiation", icon: HandCoins },
          { href: "/propertyconnect/crm-leasing/reservation-request", label: "Reservation Request", icon: Home },
          { href: "/propertyconnect/crm-leasing/reservation-approval", label: "Reservation Approval", icon: ShieldCheck },
          { href: "/propertyconnect/crm-leasing/reservation-payment", label: "Reservation Payment", icon: Banknote },
          { href: "/propertyconnect/crm-leasing/reservation-confirmation", label: "Reservation Confirmation", icon: ListChecks },
          { href: "/propertyconnect/crm-leasing/reports", label: "Reports", icon: BarChart3 },
        ],
      },
    ],
  },
];
