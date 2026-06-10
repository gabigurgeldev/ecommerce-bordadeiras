"use client";

import { useEffect, useRef } from "react";
import { mergeGuestCart, syncCart } from "@/actions/cart";
import { useAppSession } from "@/components/providers/session-provider";
import {
  cartLinesEqual,
  cartLinesSignature,
} from "@/lib/data/cart-merge";
import { useCartStore } from "@/store/cart";

export function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppSession();
  const lines = useCartStore((s) => s.lines);
  const syncEpoch = useCartStore((s) => s.syncEpoch);
  const syncedUserId = useCartStore((s) => s.syncedUserId);
  const setLines = useCartStore((s) => s.setLines);
  const setSyncedUserId = useCartStore((s) => s.setSyncedUserId);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const merging = useRef(false);
  const lastSyncedSignature = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user?.id) {
      if (syncedUserId) setSyncedUserId(null);
      lastSyncedSignature.current = null;
      return;
    }

    if (syncedUserId === user.id || merging.current) return;

    merging.current = true;
    const guestLines = [...useCartStore.getState().lines];
    const epochAtMerge = useCartStore.getState().syncEpoch;

    void mergeGuestCart(guestLines)
      .then((merged) => {
        const state = useCartStore.getState();
        if (state.syncEpoch !== epochAtMerge) return;

        if (!cartLinesEqual(state.lines, merged)) {
          setLines(merged);
        }
        setSyncedUserId(user.id);
        lastSyncedSignature.current = cartLinesSignature(merged);
      })
      .finally(() => {
        merging.current = false;
      });
  }, [user?.id, loading, syncedUserId, setLines, setSyncedUserId]);

  useEffect(() => {
    if (!user?.id || loading || syncedUserId !== user.id) return;

    const signature = cartLinesSignature(lines);
    if (signature === lastSyncedSignature.current) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    const epochAtSchedule = syncEpoch;

    syncTimer.current = setTimeout(() => {
      const state = useCartStore.getState();
      if (state.syncEpoch !== epochAtSchedule) return;

      const currentLines = state.lines;
      const pushSignature = cartLinesSignature(currentLines);

      void syncCart(currentLines).then((updated) => {
        const latest = useCartStore.getState();
        if (latest.syncEpoch !== epochAtSchedule) return;

        const updatedSignature = cartLinesSignature(updated);
        lastSyncedSignature.current = updatedSignature;

        if (
          latest.lines.length === 0 &&
          updated.length > 0
        ) {
          return;
        }

        if (!cartLinesEqual(latest.lines, updated)) {
          setLines(updated);
        }
      });
    }, 500);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [lines, syncEpoch, user?.id, loading, syncedUserId, setLines]);

  useEffect(() => {
    if (lines.length === 0) {
      lastSyncedSignature.current = cartLinesSignature([]);
    }
  }, [lines.length, syncEpoch]);

  return <>{children}</>;
}
