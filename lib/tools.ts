export type Tool = {
  id: string;
  name: string;
  description: string;
  href: string;
};

/** Contact email shown in the landing footer — replace with the real address. */
export const CONTACT_EMAIL = "hello@icheckenergy.com";

/**
 * Hub catalog. Replace placeholder absolute URLs with real tool links when ready.
 * Relative paths open in the same tab; absolute URLs open in a new tab.
 */
export const TOOLS: Tool[] = [
  {
    id: "solar-leads",
    name: "iCheck Solar Leads",
    description: "Import leads and review Google Solar building insights.",
    href: "/tools/solar-leads",
  },
  {
    id: "rec-manager",
    name: "iCheck REC Manager",
    description: "Sign in to manage your REC records.",
    href: "https://rec.godaylight.com/dashboard",
  },
  {
    id: "pvwatt-solar",
    name: "iCheck PVWatt Solar",
    description: "PVWatts-based solar production estimates.",
    href: "https://icheck-pvwatts-solar.vercel.app",
  },
  {
    id: "task-manager",
    name: "iCheck Task Manager",
    description: "Coordinate energy project tasks and workflows.",
    href: "https://icheck-task-manager.vercel.app/sign-in",
  },
];

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
