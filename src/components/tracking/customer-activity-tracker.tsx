"use client";

import {
  configureActivityConsent,
  recordActivityClient,
} from "@/lib/tracking/record-activity-client";
import { CustomerActivityType } from "@/lib/types/database";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const DEBOUNCE_MS = 2000;
const IGNORED_PREFIXES = ["/admin", "/api", "/login", "/cadastro"];

function shouldTrackPath(path: string): boolean {
  return !IGNORED_PREFIXES.some((p) => path.startsWith(p));
}

export function CustomerActivityTracker({
  behavioralAnalyticsConsent,
}: {
  behavioralAnalyticsConsent: boolean;
}) {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  configureActivityConsent(behavioralAnalyticsConsent);

  useEffect(() => {
    if (!behavioralAnalyticsConsent) return;
    if (!pathname || !shouldTrackPath(pathname)) return;
    if (lastTracked.current === pathname) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastTracked.current = pathname;
      recordActivityClient({
        type: CustomerActivityType.PAGE_VIEW,
        path: pathname,
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [behavioralAnalyticsConsent, pathname]);

  return null;
}

export function ProductViewTracker({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    recordActivityClient({
      type: CustomerActivityType.PRODUCT_VIEW,
      path: `/produto/${productId}`,
      productId,
      productName,
    });
  }, [productId, productName]);

  return null;
}
