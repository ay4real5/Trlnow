"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Menu } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
  active,
}: {
  children: React.ReactNode;
  active: string;
}) {
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "STAFF")) {
    redirect("/login");
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col md:flex-row">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded p-1 text-gray-600 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-gray-900">{active}</span>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar active={active} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 overflow-auto p-4 sm:p-6">{children}</div>
    </div>
  );
}
