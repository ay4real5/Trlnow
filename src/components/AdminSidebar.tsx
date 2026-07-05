import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, Users, Building2, UserCog, FileBarChart } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/shipments", label: "Shipments", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/branches", label: "Branches", icon: Building2 },
  { href: "/admin/staff", label: "Staff", icon: UserCog },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
];

export default function AdminSidebar({
  active,
}: {
  active: string;
}) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <div className="p-4">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Admin Panel
        </h2>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
