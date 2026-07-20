import { cookies } from "next/headers";
import { config } from "./config";

const COOKIE = "scout_admin";

export async function isAdmin() {
  return (await cookies()).get(COOKIE)?.value === "1";
}

export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("ADMIN_UNAUTHORIZED");
}

export function adminCookieName() {
  return COOKIE;
}

export function checkAdminPassword(password: string) {
  return password === config.adminPassword;
}
