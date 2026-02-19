import { frappeCall, frappeGet, clearCsrfToken } from "./client";
import type { User } from "@/types/user";

export async function login(usr: string, pwd: string) {
  clearCsrfToken();
  const res = await frappeCall<{ message: string }>(
    "velora_verse.api.auth.login",
    { email: usr, password: pwd }
  );
  // Login changes the session — clear stale CSRF token so next request fetches a fresh one
  clearCsrfToken();
  return res;
}

export async function logout() {
  await frappeCall("logout");
  clearCsrfToken();
}

export async function register(data: { email: string; full_name: string; password: string; phone?: string }) {
  return frappeCall("velora_verse.api.auth.register", data);
}

export async function getUserProfile() {
  return frappeGet<User>("velora_verse.api.products.get_user_profile");
}

export async function updateProfile(data: Partial<User>) {
  return frappeCall<User>("velora_verse.api.auth.update_profile", data);
}

export async function changePassword(data: { old_password: string; new_password: string }) {
  return frappeCall("velora_verse.api.auth.change_password", data);
}

export async function forgotPassword(email: string) {
  return frappeCall("frappe.core.doctype.user.user.reset_password", { user: email });
}
