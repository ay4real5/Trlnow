"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
  active,
}: {
  children: React.ReactNode;
  active: string;
}) {
  const { data: session, status } = useSession();

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
    <div className="flex h-[calc(100vh-4rem)]">
      <AdminSidebar active={active} />
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
