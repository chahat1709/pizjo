export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  sessionSecret: process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "",
  storefrontOrigin: process.env.STOREFRONT_ORIGIN ?? "https://pizjo.vercel.app",
  isProduction: process.env.NODE_ENV === "production",
};
