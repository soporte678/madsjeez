/**
 * Librería premium global de Madsjeez. Punto único de import para el sistema
 * visual reutilizable en todo el proyecto:
 *   import { Reveal, SpotlightCard, EmptyState } from "@/components/premium";
 *
 * Motion-primitives (Reveal/TiltCard/CountUp) se re-exportan desde su ubicación
 * original para no romper imports existentes.
 */

export { Reveal, TiltCard, CountUp } from "@/components/seller/premium/motion-primitives";
export { EmptyState, ErrorState, LoadingState } from "./states";
export { SpotlightCard, Magnetic } from "./interactive";
export { SectionWrapper, GlowBackground, BentoGrid } from "./layout";
