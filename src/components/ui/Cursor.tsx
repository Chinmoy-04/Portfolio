"use client";

import { useEffect, useRef } from "react";

/*
  Custom cursor: a square dot that sits exactly on the pointer, and a square
  frame that trails it.

  States:
    default  small frame around the dot
    link     frame grows and turns amber over links and buttons
    field    large frame over [data-cursor="field"] (the hero visual)
    press    frame tightens while the button is held

  Only on devices with a fine pointer that can hover. Touch and keyboard users
  never see it, and the system cursor comes back over text inputs. Under
  reduced motion the frame snaps instead of trailing. Positions are written
  straight to the DOM every frame, never through React state.
*/
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dot = dotRef.current;
    const frame = frameRef.current;
    if (!dot || !frame) return;

    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    let x = -100;
    let y = -100;
    let fx = x;
    let fy = y;
    let visible = false;
    let raf = 0;

    const setState = (target: Element | null) => {
      const interactive = target?.closest("a, button, [role='button'], summary, label");
      const field = target?.closest("[data-cursor='field']");
      const text = target?.closest("input, textarea, select, [contenteditable='true']");
      frame.dataset.state = interactive ? "link" : field ? "field" : "default";
      root.classList.toggle("cursor-native", Boolean(text));
    };

    const show = (on: boolean) => {
      if (visible === on) return;
      visible = on;
      dot.style.opacity = on ? "1" : "0";
      frame.style.opacity = on ? "1" : "0";
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        fx = x;
        fy = y;
      }
      show(true);
      setState(e.target as Element);
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") frame.dataset.press = "true";
    };
    const onUp = () => delete frame.dataset.press;
    // A button released outside the window sends no pointerup here.
    const onLeave = () => {
      show(false);
      delete frame.dataset.press;
    };

    // Scrolling moves the page under a still pointer, so re-check what is
    // under it whenever the scroll position changes.
    let lastScroll = window.scrollY;

    const loop = () => {
      if (visible && window.scrollY !== lastScroll) {
        lastScroll = window.scrollY;
        setState(document.elementFromPoint(x, y));
      }
      const ease = reduce ? 1 : 0.22;
      fx += (x - fx) * ease;
      fy += (y - fy) * ease;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      root.classList.remove("has-custom-cursor", "cursor-native");
    };
  }, []);

  return (
    <div aria-hidden="true" className="cursor-layer">
      <div ref={frameRef} className="cursor-frame" data-state="default">
        <span />
      </div>
      <div ref={dotRef} className="cursor-dot">
        <span />
      </div>
    </div>
  );
}
