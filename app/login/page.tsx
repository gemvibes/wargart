"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

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
      <div className="login-card">
        <section className="login-hero">
          <span className="brand-eyebrow">Modern Community Administration</span>
          <h1>{APP_NAME}</h1>
          <p>{APP_TAGLINE}</p>

          <div className="quick-list" style={{ marginTop: 24 }}>
            <div className="quick-list-item login-role-card">
              <strong>Superadmin</strong>
              <p className="helper-text">Kelola data warga, kegiatan, kehadiran, foto, dan export.</p>
            </div>
            <div className="quick-list-item login-role-card">
              <strong>Viewer</strong>
              <p className="helper-text">Lihat data warga, kegiatan, detail kegiatan, dan rekap kehadiran.</p>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-header">
            <h2 style={{ marginBottom: 6 }}>Masuk ke {APP_NAME}</h2>
            <p className="muted">Gunakan username dan password yang telah diberikan oleh admin.</p>
          </div>

          <form className="section-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                autoComplete="username"
                className="input"
                id="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Masukkan username"
                value={username}
              />
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <button
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  type="button"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
              <div className="password-field">
                <input
                  autoComplete="current-password"
                  className="input"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Masukkan password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                />
              </div>
            </div>

            {error ? <div className="error-state">{error}</div> : null}

            <button className="button primary" disabled={loading} type="submit">
              {loading ? "Memproses..." : "Login"}
            </button>

            <p className="login-support">Akun bermasalah? Hubungi admin RT.</p>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="login-screen"><div className="loading-state"><strong>Menyiapkan halaman login...</strong></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
