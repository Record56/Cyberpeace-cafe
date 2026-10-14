export type UserRole = "admin" | "staff";

export type PassCategory =
  | "VIP Pass"
  | "Media Pass"
  | "Organiser Pass"
  | "Finalist Pass"
  | "Audience Pass";

export type EmailStatus = "pending" | "sent" | "failed" | "not_sent";

export type CheckInStatus = "registered" | "checked_in";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  allowedCategories?: PassCategory[];
}

export interface CategoryConfig {
  name: PassCategory;
  authorizationLabel: string;
  description: string;
  color: string;
  active: boolean;
}
