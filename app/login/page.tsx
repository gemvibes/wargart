"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const loginHighlights = [
  "Kelola data warga dengan rapi",
  "Catat kegiatan dan kehadiran",
  "Akses informasi administrasi dari satu tempat"
] as const;

const loginRoles = [
  {
    title: "Superadmin",
    description: "Mengelola data inti, aktivitas, dokumentasi, dan export."
  },
  {
    title: "Viewer",
    description: "Melihat informasi administrasi dengan akses yang terkontrol."
  }
] as const;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, user } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(searchParams.get("redirect") || "/dashboard");
    }
  }, [loading, router, searchParams, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    try {
      await login(username, password);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Login gagal. Silakan coba lagi."
      );
    }
  }

  return (
    <div className="login-screen">
      <div className="login-shell">
        <div className="login-card">
          <section className="login-hero">
            <div className="login-hero-copy">
              <h1>{APP_NAME}</h1>
              <p>{APP_TAGLINE}</p>
            </div>

            <div className="login-value-stack">
              <div className="login-value-list" aria-label="Keunggulan Titeni">
                {loginHighlights.map((item) => (
                  <div className="login-value-item" key={item}>
                    <span className="login-value-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <path d="M9.55 17.45 4.8 12.7l1.4-1.4 3.35 3.35 8.25-8.25 1.4 1.4-9.65 9.65Z" />
                      </svg>
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="login-role-grid">
                {loginRoles.map((role) => (
                  <article className="login-role-card" key={role.title}>
                    <span className="login-role-label">Access Role</span>
                    <strong>{role.title}</strong>
                    <p>{role.description}</p>
                  </article>
                ))}
              </div>

              <div className="login-hero-footer">
                <span className="login-hero-pill">Private access only</span>
                <span className="login-hero-note">Dibuat untuk alur administrasi RT yang rapi dan terpercaya.</span>
              </div>
            </div>
          </section>

          <section className="login-panel">
            <div className="login-panel-inner">
              <div className="login-panel-header">
                <span className="login-panel-eyebrow">RT 03/ RW 03 ONLY</span>
                <h2>Masuk ke {APP_NAME}</h2>
                <p className="muted">Gunakan username dan password yang telah diberikan oleh admin.</p>
              </div>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="field login-field">
                  <label htmlFor="username">Username</label>
                  <input
                    autoComplete="username"
                    className="input login-input"
                    id="username"
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Masukkan username"
                    value={username}
                  />
                </div>

                <div className="field login-field">
                  <div className="label-row">
                    <label htmlFor="password">Password</label>
                  </div>
                  <div className="password-field">
                    <input
                      autoComplete="current-password"
                      className="input login-input login-input-password"
                      id="password"
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Masukkan password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      aria-pressed={showPassword}
                      className="password-toggle login-password-toggle"
                      onClick={() => setShowPassword((prev) => !prev)}
                      type="button"
                    >
                      <span className="login-visually-hidden">
                        {showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      </span>
                      {showPassword ? (
                        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                          <path d="M3.53 2.47 2.47 3.53l3 3A12.94 12.94 0 0 0 1 12s3.6 6 11 6a11.9 11.9 0 0 0 4.24-.76l4.23 4.23 1.06-1.06ZM9.54 10.6l3.86 3.86A2.96 2.96 0 0 1 12 15a3 3 0 0 1-3-3c0-.5.13-.97.36-1.4Zm2.3-4.58A11.88 11.88 0 0 1 12 6c7.4 0 11 6 11 6a21.76 21.76 0 0 1-4.57 4.96l-2.17-2.17A4.95 4.95 0 0 0 12 7a4.9 4.9 0 0 0-1.74.32L7.39 4.45A12.7 12.7 0 0 1 11.84 6.02ZM12 9a3 3 0 0 1 3 3c0 .45-.1.88-.28 1.26l-3.98-3.98C11.12 9.1 11.55 9 12 9Z" />
                        </svg>
                      ) : (
                        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                          <path d="M12 5c7.4 0 11 7 11 7s-3.6 7-11 7S1 12 1 12s3.6-7 11-7Zm0 2C6.88 7 3.73 11.11 3.2 12 3.74 12.9 6.9 17 12 17s8.26-4.1 8.8-5C20.26 11.1 17.1 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm0 2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div aria-live="polite" className="error-state login-error-state" role="alert">
                    {error}
                  </div>
                ) : null}

                <button className="button primary login-submit" disabled={loading} type="submit">
                  {loading ? "Memproses..." : "Login"}
                </button>

                <p className="login-support">Akun bermasalah? Hubungi admin RT.</p>
              </form>

              <p className="login-credit">© 2026 Titeni by FSL.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="login-screen">
          <div className="login-shell">
            <div className="loading-state login-loading-state">
              <strong>Menyiapkan halaman login...</strong>
            </div>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
