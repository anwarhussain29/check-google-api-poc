"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/tools/solar-leads/login/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => logout())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
