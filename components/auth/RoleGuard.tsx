"use client";

import { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Role } from "@/lib/types";

export function RoleGuard({
  allow,
  children,
  fallback = null
}: {
  allow: Role;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  if (user?.role !== allow) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

