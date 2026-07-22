import type { Role } from "./types";

export type Permission =
  | "view_all"
  | "edit_status"
  | "manage_users"
  | "manage_clients"
  | "manage_positions"
  | "change_permissions"
  | "delete_records";

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "view_all",
    "edit_status",
    "manage_users",
    "manage_clients",
    "manage_positions",
    "change_permissions",
    "delete_records",
  ],
  manager: ["view_all", "edit_status", "manage_users", "manage_clients"],
  recruiter: ["view_all", "edit_status"],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export function canEditRecords(role: Role) {
  return hasPermission(role, "edit_status");
}

