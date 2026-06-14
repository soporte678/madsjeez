"use client";

/**
 * Pipeline del ciclo de venta. Los nodos se iluminan en secuencia al entrar en
 * viewport (stagger). Horizontal en desktop, vertical en mobile. reduced-motion:
 * aparece completo sin animación.
 */

import { motion, useReducedMotion } from "motion/react";
import { Package, Upload, Eye, ShoppingCart, Truck, Wallet, type LucideIcon } from "lucide-react";

const STAGES: { icon: LucideIcon; label: string }[] = [
  { icon: Package, label: "Producto" },
  { icon: Upload, label: "Publicación" },
  { icon: Eye, label: "Visita" },
  { icon: ShoppingCart, label: "Compra" },
  { icon: Truck, label: "Envío" },
  { icon: Wallet, label: "Cobro" },
];

export function AnimatedPipeline() {
  const reduce = useReducedMotion();
  return (
    <motion.ol
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: reduce ? 0 : 0.12 }}
    >
      {STAGES.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.li
            key={s.label}
            className="flex items-center gap-2 sm:flex-col sm:gap-2"
            variants={{
              hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            <div className="flex items-center gap-2 sm:flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-foreground sm:text-xs">{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <span aria-hidden className="hidden h-px w-6 flex-1 bg-gradient-to-r from-primary/60 to-primary/20 sm:block lg:w-10" />
            )}
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
