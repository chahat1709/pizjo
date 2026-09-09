export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Local credential login replaced Manus OAuth in the Vercel + Neon migration.
// Call this from an event handler or effect at the moment you want to
// navigate, e.g. `onClick={() => startLogin()}`. Do NOT call it during render.
export const startLogin = () => {
  window.location.href = "/login";
};
