import type { Role } from "@/lib/session";

export type AppRole = Exclude<Role, "PLATFORM_ADMIN">;

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: keyof typeof import("lucide-react");
  roles: Role[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

/** Menu dikelompokkan per role kerja, supaya Owner juga rapih. */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "home",
    label: "",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        roles: ["OWNER", "FINANCE", "SALES", "PRODUKSI"],
      },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { href: "/pos", label: "POS", shortLabel: "POS", icon: "ShoppingCart", roles: ["OWNER", "SALES", "FINANCE"] },
      { href: "/b2b", label: "B2B", shortLabel: "B2B", icon: "Briefcase", roles: ["OWNER", "SALES", "FINANCE"] },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      {
        href: "/keuangan/utang-piutang",
        label: "Utang & Piutang",
        shortLabel: "Utang",
        icon: "Wallet",
        roles: ["OWNER", "FINANCE", "SALES"],
      },
      {
        href: "/keuangan/pembelian",
        label: "Pembelian",
        icon: "ShoppingBag",
        roles: ["OWNER", "FINANCE"],
      },
      { href: "/pengeluaran", label: "Pengeluaran", icon: "Receipt", roles: ["OWNER", "FINANCE"] },
      { href: "/finance", label: "Finance Room", shortLabel: "Finance", icon: "Landmark", roles: ["OWNER", "FINANCE"] },
      { href: "/report", label: "Report", icon: "FileBarChart", roles: ["OWNER", "FINANCE"] },
    ],
  },
  {
    id: "produksi",
    label: "Produksi",
    items: [
      {
        href: "/produksi",
        label: "Proses Produksi",
        shortLabel: "Produksi",
        icon: "Factory",
        roles: ["OWNER", "PRODUKSI"],
      },
      { href: "/inventory", label: "Inventory", icon: "Boxes", roles: ["OWNER", "FINANCE", "SALES", "PRODUKSI"] },
    ],
  },
  {
    id: "data",
    label: "Data",
    items: [
      { href: "/database", label: "Database", icon: "Database", roles: ["OWNER", "FINANCE", "SALES", "PRODUKSI"] },
    ],
  },
  {
    id: "owner",
    label: "Owner",
    items: [
      { href: "/owner-room", label: "Owner Room", icon: "Settings", roles: ["OWNER"] },
      { href: "/langganan", label: "Langganan", icon: "Sparkles", roles: ["OWNER"] },
    ],
  },
  {
    id: "bantuan",
    label: "Bantuan",
    items: [
      { href: "/panduan", label: "Panduan", icon: "BookOpen", roles: ["OWNER", "FINANCE", "SALES", "PRODUKSI"] },
    ],
  },
];

/** Shortcut bawah HP — max 4 + tombol Menu. */
export const BOTTOM_NAV_HREFS: Record<AppRole, string[]> = {
  OWNER: ["/dashboard", "/pos", "/produksi", "/finance"],
  FINANCE: ["/dashboard", "/keuangan/utang-piutang", "/finance", "/report"],
  SALES: ["/dashboard", "/pos", "/b2b", "/keuangan/utang-piutang"],
  PRODUKSI: ["/dashboard", "/produksi", "/inventory", "/database"],
};

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function findNavItem(href: string): NavItem | undefined {
  return ALL_ITEMS.find((i) => i.href === href);
}

export function navGroupsForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((i) => i.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

export function bottomNavForRole(role: Role): NavItem[] {
  if (role === "PLATFORM_ADMIN") return [];
  const hrefs = BOTTOM_NAV_HREFS[role];
  return hrefs
    .map((href) => findNavItem(href))
    .filter((item): item is NavItem => item != null && item.roles.includes(role));
}

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
