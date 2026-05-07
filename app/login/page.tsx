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
          <h1>{APP_NAME}</h1>
          <p>{APP_TAGLINE}</p>

          <div className="quick-list" style={{ marginTop: 24 }}>
            <div className="quick-list-item">
              <strong>Superadmin</strong>
              <p className="helper-text">Kelola data warga, kegiatan, kehadiran, foto, dan export.</p>
            </div>
            <div className="quick-list-item">
              <strong>Viewer</strong>
              <p className="helper-text">Lihat data warga, kegiatan, detail kegiatan, dan rekap kehadiran.</p>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ marginBottom: 6 }}>Masuk ke {APP_NAME}</h2>
            <p className="muted">Gunakan akun yang sudah terdaftar di sheet `users`.</p>
          </div>

          <form className="section-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                className="input"
                id="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Masukkan username"
                value={username}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password"
                type="password"
                value={password}
              />
            </div>

            {error ? <div className="error-state">{error}</div> : null}

            <button className="button primary" disabled={loading} type="submit">
              {loading ? "Memproses..." : "Login"}
            </button>
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
