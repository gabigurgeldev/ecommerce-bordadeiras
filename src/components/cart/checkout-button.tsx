"use client";

import { useAppSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export function CheckoutButton({
  onBeforeNavigate,
  ...props
}: ComponentProps<typeof Button> & { onBeforeNavigate?: () => void }) {
  const { user, loading } = useAppSession();
  const router = useRouter();

  function handleClick() {
    onBeforeNavigate?.();
    if (!user) {
      router.push("/login?callbackUrl=%2Fcheckout");
      return;
    }
    router.push("/checkout");
  }

  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      onClick={handleClick}
    />
  );
}
