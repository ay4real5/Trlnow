"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Package, LogOut, LayoutDashboard, User, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  const links = [
    { href: "/", label: "Home" },
    { href: "/track", label: "Track" },
  ];

  if (session) {
    links.push({ href: "/dashboard", label: "My Shipments" });
    if (isAdmin) links.push({ href: "/admin", label: "Admin" });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-brand-600">
          <Package className="h-6 w-6" />
          TrlNow
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-brand-600"
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium text-gray-600 hover:text-brand-600"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {session ? (
            <button
              onClick={() => signOut()}
              className="mt-2 flex w-full items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          ) : (
            <div className="mt-2 flex gap-3">
              <Link href="/login" className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700">
                Login
              </Link>
              <Link href="/register" className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
