"use client";

/**
 * Primitivas de movimiento reutilizables (Framer Motion / motion).
 * Todas respetan prefers-reduced-motion: degradan a estático/instantáneo.
 * GPU-only (transform/opacity). Easing ease-out (expo-ish) [0.16,1,0.3,1].
 */

import { motion, useReducedMotion, useInView, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { type ReactNode, type ElementType, useRef, useState, useEffect } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Aparece al entrar en viewport (una vez). Soporta stagger por `delay`. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  const M = motion[as as "div"] ?? motion.div;
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

/** Tilt 3D sutil siguiendo el puntero. Sin tilt bajo reduced-motion o touch. */
export function TiltCard({
  children,
  className,
  max = 7,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 220, damping: 22 });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse") return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function reset() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Contador que cuenta hacia arriba al entrar en viewport. Respeta reduced-motion. */
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  durationMs = 1200,
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration: durationMs / 1000,
      ease: EASE,
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {val.toLocaleString("es-AR")}
      {suffix}
    </span>
  );
}
