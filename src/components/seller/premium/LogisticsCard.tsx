"use client";

/**
 * Tarjeta de logística (Madsjeez Flash). Muestra el recorrido Retirado -> En
 * camino -> Entregado con una línea de progreso que se anima al entrar en
 * viewport. Copy honesto: "según disponibilidad de la zona". reduced-motion:
 * estado final estático.
 */

import { motion, useReducedMotion } from "motion/react";
import { PackageCheck, Bike, MapPinCheck, Bolt } from "lucide-react";

const STEPS = [
  { icon: PackageCheck, label: "Retirado", desc: "Lo retiramos del vendedor" },
  { icon: Bike, label: "En camino", desc: "Rumbo al comprador" },
  { icon: MapPinCheck, label: "Entregado", desc: "Recibido y listo" },
];

export function LogisticsCard() {
  const reduce = useReducedMotion();
  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bolt className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-foreground">Madsjeez Flash</p>
          <p className="text-xs text-muted-foreground">Logística para tus ventas, según disponibilidad de la zona.</p>
        </div>
      </div>

      <div className="relative mt-8">
        {/* riel */}
        <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-border" />
        {/* progreso animado */}
        <motion.div
          className="absolute left-0 top-5 h-1 rounded-full bg-primary"
          initial={reduce ? { width: "100%" } : { width: "0%" }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <ol className="relative grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.li
                key={s.label}
                className="flex flex-col items-center text-center"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: reduce ? 0 : 0.4 + i * 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary bg-card text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-2 text-sm font-semibold text-foreground">{s.label}</span>
                <span className="text-xs text-muted-foreground">{s.desc}</span>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
