import type { CategoryConfig, PassCategory } from "./types";

export const PASS_CATEGORIES: PassCategory[] = [
  "VIP Pass",
  "Media Pass",
  "Organiser Pass",
  "Finalist Pass",
  "Audience Pass",
];

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    name: "VIP Pass",
    authorizationLabel: "VIP authorization",
    description: "Assigned date + VIP authorization",
    color: "#C9A227",
    active: true,
  },
  {
    name: "Media Pass",
    authorizationLabel: "Media authorization",
    description: "Assigned date + Media authorization",
    color: "#3B82F6",
    active: true,
  },
  {
    name: "Organiser Pass",
    authorizationLabel: "Organiser authorization",
    description: "Assigned date + Organiser authorization",
    color: "#10B981",
    active: true,
  },
  {
    name: "Finalist Pass",
    authorizationLabel: "Finalist authorization",
    description: "Assigned date + Finalist authorization",
    color: "#F97316",
    active: true,
  },
  {
    name: "Audience Pass",
    authorizationLabel: "Audience authorization",
    description: "Assigned date + Audience authorization",
    color: "#64748B",
    active: true,
  },
];

export const CATEGORY_COLORS: Record<PassCategory, string> = {
  "VIP Pass": "#C9A227",
  "Media Pass": "#3B82F6",
  "Organiser Pass": "#10B981",
  "Finalist Pass": "#F97316",
  "Audience Pass": "#64748B",
};
