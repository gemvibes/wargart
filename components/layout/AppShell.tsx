"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/warga", label: "Data Warga" },
  { href: "/kegiatan", label: "Daftar Kegiatan" },
  { href: "/rekap-kehadiran", label: "Rekap Kehadiran" }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>{APP_NAME}</h1>
          <p>Administrasi RT 03 / RW 03 Purwokerto Lor</p>
        </div>

        <nav className="nav-list">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              className={cn("nav-link", pathname.startsWith(item.href) && "active")}
              href={item.href}
            >
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>{user?.nama}</strong>
          <p className="helper-text">Role: {user?.role === "superadmin" ? "Superadmin" : "Viewer"}</p>
          <button className="button secondary" onClick={logout} type="button">
            Keluar
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

