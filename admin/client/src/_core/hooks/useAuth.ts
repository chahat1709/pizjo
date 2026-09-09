import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // Login is started via startLogin() in the effect below, only when we actually
  // navigate — never during render. startLogin() mints a one-time nonce + writes
  // the state cookie, so calling it per render would overwrite the cookie and
  // desync it from an in-flight login's `state`.
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<unknown>(null);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (error: unknown) {
      setLogoutError(error);
    } finally {
      // Clear the mirrored session token used as a Bearer fallback on
      // browsers that block third-party cookies (Safari ITP / WebView).
      try {
        sessionStorage.removeItem("pizjo-session");
      } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      setLoggingOut(false);
    }
  }, [utils]);

  const state = useMemo(() => {
    try {
      localStorage.setItem(
        "pizjo-runtime-user-info",
        JSON.stringify(meQuery.data ?? null)
      );
    } catch {}
    return {
      user: meQuery.data ?? null,
      loading: meQuery.isLoading || loggingOut,
      error: meQuery.error ?? logoutError ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutError,
    loggingOut,
  ]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (meQuery.isLoading || loggingOut) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    // Navigate to the local login page at this moment only.
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      startLogin();
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loggingOut,
    meQuery.isLoading,
    state.user,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
