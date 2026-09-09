import { useEffect, useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"loading" | "login" | "setup">("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/setup-status", { credentials: "include" })
      .then(res => (res.ok ? res.json() : { setupRequired: false }))
      .then(data => setMode(data.setupRequired ? "setup" : "login"))
      .catch(() => setMode("login"));
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const endpoint = mode === "setup" ? "/api/auth/setup" : "/api/auth/login";
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name: name || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      try {
        if (data.token) sessionStorage.setItem("pizjo-session", `app_session_id=${data.token}`);
      } catch {}
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "loading") {
    return <div className="flex min-h-screen items-center justify-center">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border bg-white p-6 shadow">
        <h1 className="mb-1 text-2xl font-black">PIZJO Admin</h1>
        <p className="mb-4 text-sm text-stone-500">
          {mode === "setup" ? "Create the owner account to finish setup." : "Sign in to manage the restaurant."}
        </p>
        {mode === "setup" && (
          <label className="mb-3 block">
            <span className="text-sm font-semibold">Display name</span>
            <input className="mt-1 w-full rounded border px-3 py-2" value={name} onChange={e => setName(e.target.value)} placeholder="Owner" autoComplete="name" />
          </label>
        )}
        <label className="mb-3 block">
          <span className="text-sm font-semibold">Username</span>
          <input className="mt-1 w-full rounded border px-3 py-2" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
        </label>
        <label className="mb-4 block">
          <span className="text-sm font-semibold">Password {mode === "setup" && "(min 8 characters)"}</span>
          <input className="mt-1 w-full rounded border px-3 py-2" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === "setup" ? 8 : 1} autoComplete={mode === "setup" ? "new-password" : "current-password"} />
        </label>
        {error && <p role="alert" className="mb-3 text-sm font-semibold text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded bg-black px-4 py-2 font-bold text-white disabled:opacity-50">
          {busy ? "Please wait…" : mode === "setup" ? "Create owner account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
