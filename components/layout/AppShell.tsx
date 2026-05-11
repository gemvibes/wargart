"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { APP_NAME, APP_TAGLINE, DATABASE_SPREADSHEET_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    shortLabel: "Beranda",
    icon: "dashboard",
    context: "Ringkasan administrasi RT."
  },
  {
    href: "/warga",
    label: "Data Warga",
    shortLabel: "Warga",
    icon: "warga",
    context: "Kelola data warga dan status keluarga."
  },
  {
    href: "/kegiatan",
    label: "Daftar Kegiatan",
    shortLabel: "Kegiatan",
    icon: "kegiatan",
    context: "Kelola kegiatan dan dokumentasi warga."
  },
  {
    href: "/rekap-kehadiran",
    label: "Rekap Kehadiran",
    shortLabel: "Rekap",
    icon: "rekap",
    context: "Pantau tingkat kehadiran warga."
  }
] as const;

function NavIcon({ icon }: { icon: "dashboard" | "warga" | "kegiatan" | "rekap" }) {
  switch (icon) {
    case "dashboard":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" fill="currentColor" />
        </svg>
      );
    case "warga":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20a7 7 0 1 1 14 0H5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "kegiatan":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path
            d="M7 3v2H5a2 2 0 0 0-2 2v2h18V7a2 2 0 0 0-2-2h-2V3h-2v2H9V3H7Zm14 8H3v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "rekap":
      return (
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path d="M5 19V9h3v10H5Zm5 0V5h4v14h-4Zm6 0v-7h3v7h-3Z" fill="currentColor" />
        </svg>
      );
  }
}

function DatabaseIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4c-4.418 0-8 1.343-8 3v10c0 1.657 3.582 3 8 3s8-1.343 8-3V7c0-1.657-3.582-3-8-3Zm0 2c3.866 0 6 .98 6 1s-2.134 1-6 1-6-.98-6-1 2.134-1 6-1Zm0 12c-3.866 0-6-.98-6-1v-1.711C7.282 15.74 9.463 16 12 16s4.718-.26 6-.711V17c0 .02-2.134 1-6 1Zm0-4c-3.866 0-6-.98-6-1v-1.711C7.282 11.74 9.463 12 12 12s4.718-.26 6-.711V13c0 .02-2.134 1-6 1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const roleLabel = user?.role === "superadmin" ? "Superadmin" : "Viewer";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <h1>{APP_NAME}</h1>
          <p>{APP_TAGLINE}</p>
          <span className="brand-eyebrow brand-chip">RT 03 • RW 03</span>
        </div>

        <nav className="nav-list">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              className={cn("nav-link", pathname.startsWith(item.href) && "active")}
              href={item.href}
            >
              <span className="nav-icon" aria-hidden="true">
                <NavIcon icon={item.icon} />
              </span>
              <span className="nav-label">
                <span className="nav-label-full">{item.label}</span>
                <span className="nav-label-short">{item.shortLabel}</span>
              </span>
            </Link>
          ))}
        </nav>

        {isSuperAdmin ? (
          <a
            className="sidebar-utility-link"
            href={DATABASE_SPREADSHEET_URL}
            rel="noreferrer"
            target="_blank"
          >
            <span className="nav-icon" aria-hidden="true">
              <DatabaseIcon />
            </span>
            <span className="nav-label">
              <span className="nav-label-full">Database</span>
              <span className="nav-label-short">DB</span>
            </span>
          </a>
        ) : null}

        <div className="sidebar-footer">
          <div className="sidebar-footer-copy">
            <strong>{user?.nama}</strong>
            <p className="helper-text sidebar-role">{roleLabel}</p>
          </div>
          <button className="button secondary sidebar-logout" onClick={logout} type="button">
            Keluar
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-body">{children}</div>
      </main>
    </div>
  );
}
