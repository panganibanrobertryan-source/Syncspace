import { useEffect, RefObject } from 'react';

/**
 * Adds frame-rate-independent macOS-style inertia scrolling to a scrollable container
 * for mouse wheel interactions, while respecting native touch/trackpad momentum,
 * nested scrollable regions, scrollbar dragging, and prefers-reduced-motion.
 */
export function useSmoothScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let currentScroll = el.scrollTop;
    let targetScroll = el.scrollTop;
    let rafId: number | null = null;
    let isAnimating = false;
    let lastTime = 0;

    const hasScrollableParentBeforeRoot = (target: EventTarget | null): boolean => {
      let node = target as HTMLElement | null;
      while (node && node !== el) {
        const style = window.getComputedStyle(node);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll') &&
          node.scrollHeight > node.clientHeight + 1
        ) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const step = (now: number) => {
      const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 1 / 60;
      lastTime = now;

      const diff = targetScroll - currentScroll;
      if (Math.abs(diff) < 0.35) {
        currentScroll = targetScroll;
        el.scrollTop = targetScroll;
        isAnimating = false;
        rafId = null;
        lastTime = 0;
        return;
      }

      // Frame-rate-independent exponential smoothing (60Hz / 120Hz / 144Hz identical feel)
      const factor = 1 - Math.exp(-13 * dt);
      currentScroll += diff * factor;
      el.scrollTop = currentScroll;
      rafId = window.requestAnimationFrame(step);
    };

    const stopAnimation = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      isAnimating = false;
      lastTime = 0;
      currentScroll = el.scrollTop;
      targetScroll = el.scrollTop;
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (el.scrollHeight <= el.clientHeight + 1) return;

      if (hasScrollableParentBeforeRoot(e.target)) return;

      const isLineOrPageMode = e.deltaMode === 1 || e.deltaMode === 2;
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 36;
      else if (e.deltaMode === 2) delta *= el.clientHeight * 0.85;

      // Let high-precision trackpads use native compositor momentum
      if (!isLineOrPageMode && Math.abs(delta) < 12 && !isAnimating) {
        return;
      }

      e.preventDefault();

      if (!isAnimating) {
        currentScroll = el.scrollTop;
        targetScroll = el.scrollTop;
        lastTime = 0;
      }

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
      targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + delta));

      if (!isAnimating) {
        isAnimating = true;
        rafId = window.requestAnimationFrame(step);
      }
    };

    const handleNativeScroll = () => {
      if (!isAnimating) {
        currentScroll = el.scrollTop;
        targetScroll = el.scrollTop;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('scroll', handleNativeScroll, { passive: true });
    el.addEventListener('pointerdown', stopAnimation, { passive: true });
    el.addEventListener('touchstart', stopAnimation, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('scroll', handleNativeScroll);
      el.removeEventListener('pointerdown', stopAnimation);
      el.removeEventListener('touchstart', stopAnimation);
    };
  }, [ref]);
}
