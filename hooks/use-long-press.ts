"use client";

import { useRef, useCallback } from "react";

const LONG_PRESS_MS = 400;

type LongPressHandlers = {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
};

/**
 * 長押しで onLongPress を発火。右クリックでも発火。
 */
export function useLongPress(
  onLongPress: (e: { clientX: number; clientY: number }) => void
): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const posRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    posRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      posRef.current = { clientX: t.clientX, clientY: t.clientY };
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const pos = posRef.current;
        if (pos) {
          onLongPress(pos);
          posRef.current = null;
        }
      }, LONG_PRESS_MS);
    },
    [onLongPress]
  );

  const onTouchEnd = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onTouchMove = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress({ clientX: e.clientX, clientY: e.clientY });
    },
    [onLongPress]
  );

  return { onTouchStart, onTouchEnd, onTouchMove, onContextMenu };
}
