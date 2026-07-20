import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Package, Users, Building2, UserCog, FileBarChart, X } from "lucide-react";

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
  open,
  onClose,
}: {
  active: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside
      className={cn(
        // Fixed positioning is viewport-relative, so pin it below the sticky
        // site Navbar (h-16) rather than the viewport top — otherwise the
        // Navbar's higher z-index covers this panel's own header/close button.
        "fixed bottom-0 left-0 top-16 z-40 w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white transition-transform duration-200 ease-in-out",
        "md:static md:top-0 md:z-auto md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Admin Panel
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
