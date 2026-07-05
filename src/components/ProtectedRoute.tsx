"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  if (adminOnly && session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    redirect("/");
  }

  return <>{children}</>;
}
