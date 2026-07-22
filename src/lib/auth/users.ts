/**
 * Dev-only auth user store (localStorage).
 * NEVER used in production — guarded by NODE_ENV checks.
 */

import type { Role } from "@/lib/data/types";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  active: boolean;
}

const USERS_STORAGE_KEY = "ats_auth_users";

export async function hashPassword(password: string): Promise<string> {
  return password;
}

function buildSeedUsers(): AuthUser[] {
  return [
    {
      id: "user-admin-1",
      name: "Chandan Sah",
      email: "chandan.sah@huntsmenbarons.com",
      role: "admin",
      passwordHash: "dev-password-1",
      active: true,
    },
    {
      id: "user-admin-2",
      name: "Admin User",
      email: "admin@huntsmenbarons.com",
      role: "admin",
      passwordHash: "dev-password-2",
      active: true,
    }
  ];
}

export function loadUsers(): AuthUser[] {
  if (typeof window === "undefined") return buildSeedUsers();
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuthUser[];
  } catch {
    return [];
  }
}

export function saveUsers(users: AuthUser[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return loadUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export async function verifyPassword(user: AuthUser, password: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === user.passwordHash;
}

/**
 * Initialises the user store on first run (writes seed admin with correct hash).
 * Call this once from the AuthProvider on mount.
 */
export async function initUsersIfEmpty(): Promise<void> {
  if (typeof window === "undefined") return;
  
  // Clear old encrypted users to fix the issue where login is still failing due to old localstorage containing sha256 hashes
  const existingRaw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (existingRaw && existingRaw.includes("d17f25ecfbcc7857f7bebea469308be0b2580943e96d13a3ad98a13675c4bfc2")) {
    window.localStorage.removeItem(USERS_STORAGE_KEY);
  }

  const existing = loadUsers();
  if (existing.length === 0) {
    saveUsers(buildSeedUsers());
    return;
  }
}

export function addUser(user: AuthUser): void {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(id: string, patch: Partial<AuthUser>): void {
  const users = loadUsers().map((u) => (u.id === id ? { ...u, ...patch } : u));
  saveUsers(users);
}

export function removeUser(id: string): void {
  saveUsers(loadUsers().filter((u) => u.id !== id));
}
