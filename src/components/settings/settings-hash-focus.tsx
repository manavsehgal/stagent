"use client";

import { useEffect } from "react";

const HASH_ALIASES: Record<string, string> = {
  "settings-providers-runtimes": "settings-providers",
};

function currentHashTarget() {
  const rawId = window.location.hash.slice(1);
  let decodedId: string;
  try {
    decodedId = decodeURIComponent(rawId);
  } catch {
    return;
  }
  const id = HASH_ALIASES[decodedId] ?? decodedId;
  if (!id) return;
  return document.getElementById(id);
}

function focusHashTarget({ focus = false } = {}) {
  const target = currentHashTarget();
  if (!target) return false;
  target.scrollIntoView({ block: "start" });
  if (focus) target.focus({ preventScroll: true });
  return true;
}

export function SettingsHashFocus() {
  useEffect(() => {
    function stabilizeHashTarget() {
      let cancelled = false;
      let animationFrame = 0;
      let lastTargetTop: number | null = null;
      let observer: ResizeObserver | null = null;
      let timeout = 0;
      const cancel = () => {
        if (cancelled) return;
        cancelled = true;
        observer?.disconnect();
        window.cancelAnimationFrame(animationFrame);
        window.clearTimeout(timeout);
      };
      timeout = window.setTimeout(cancel, 3_000);
      const onNavigationKey = (event: KeyboardEvent) => {
        if (
          ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]
            .includes(event.key)
        ) {
          cancel();
        }
      };
      const intentEvents = ["wheel", "touchstart", "pointerdown"] as const;
      for (const event of intentEvents) {
        window.addEventListener(event, cancel, { passive: true, once: true });
      }
      window.addEventListener("keydown", onNavigationKey);

      focusHashTarget({ focus: true });
      lastTargetTop = currentHashTarget()?.getBoundingClientRect().top ?? null;
      const watchTargetPosition = () => {
        if (cancelled) return;
        const targetTop = currentHashTarget()?.getBoundingClientRect().top ?? null;
        if (
          targetTop !== null &&
          lastTargetTop !== null &&
          Math.abs(targetTop - lastTargetTop) > 1
        ) {
          focusHashTarget();
        }
        lastTargetTop = currentHashTarget()?.getBoundingClientRect().top ?? null;
        animationFrame = window.requestAnimationFrame(watchTargetPosition);
      };
      animationFrame = window.requestAnimationFrame(watchTargetPosition);
      observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => {
              if (!cancelled) focusHashTarget();
            });
      observer?.observe(document.body);
      const main = document.querySelector("main");
      if (main) observer?.observe(main);
      const target = currentHashTarget();
      if (target) observer?.observe(target);

      return () => {
        cancel();
        for (const event of intentEvents) {
          window.removeEventListener(event, cancel);
        }
        window.removeEventListener("keydown", onNavigationKey);
      };
    }

    let cancelPending = stabilizeHashTarget();
    function handleHashChange() {
      cancelPending();
      cancelPending = stabilizeHashTarget();
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      cancelPending();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return null;
}
