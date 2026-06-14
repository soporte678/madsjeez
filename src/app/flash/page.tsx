import type { Metadata } from "next";
import Link from "next/link";
import { Bolt, PackageCheck, Bike, MapPinCheck, ShieldCheck, ChevronRight, Sparkles } from "lucide-react";
import { SITE_URL, SITE_NAME } from "@/lib/seo/site";
import { BreadcrumbJsonLd } from "@/components/seo";
import { Reveal, TiltCard } from "@/components/seller/premium/motion-primitives";
import { LogisticsCard } from "@/components/seller/premium/LogisticsCard";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Madsjeez Flash — Logística para tus ventas | Madsjeez",
  description:
    "Madsjeez Flash coordina el retiro y la entrega de tus ventas, según disponibilidad de zona. El comprador sigue su envío hasta recibirlo.",
  keywords: "Madsjeez Flash, logística marketplace, envíos vendedores, retiro y entrega",
  alternates: { canonical: "/flash" },
  openGraph: { type: "website", url: `${SITE_URL}/flash`, siteName: SITE_NAME, title: "Madsjeez Flash — Logística para tus ventas", description: "Coordinamos el retiro y la entrega de tus ventas, según disponibilidad de zona.", locale: "es_AR" },
};

const STEPS = [
  { icon: PackageCheck, title: "Vendés y preparás", desc: "Recibís la venta en tu panel y preparás el paquete." },
  { icon: Bike, title: "Lo retiramos", desc: "Si tu zona tiene cobertura, coordinamos el retiro con vos." },
  { icon: MapPinCheck, title: "Llega al comprador", desc: "Hacemos la entrega y el comprador sigue el estado del envío." },
];

const FOR_WHO = ["Ferreterías", "Repuesteras", "Emprendedores", "Tiendas online", "Comercios locales"];

export default function FlashPage() {
  const breadcrumb = [
    { name: "Inicio", url: SITE_URL },
    { name: "Madsjeez Flash", url: `${SITE_URL}/flash` },
  ];

  return (
    <main className="bg-background text-foreground">
      <BreadcrumbJsonLd items={breadcrumb} />

      <nav aria-label="Migas de pan" className="mx-auto max-w-6xl px-4 pt-6">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li><Link href="/" className="hover:text-foreground">Inicio</Link></li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
          <li className="font-medium text-foreground">Madsjeez Flash</li>
        </ol>
      </nav>

      {/* Hero dark premium */}
      <section className="relative mt-4 overflow-hidden bg-[#0a1226] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_18%_-5%,rgba(59,130,246,0.30),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 pb-14 pt-12 md:pb-16 md:pt-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> Logística para vendedores
            </span>
            <h1 className="mt-5 max-w-xl text-3xl font-black leading-[1.08] tracking-tight md:text-5xl">
              Madsjeez Flash: la logística de tus ventas
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 md:text-lg">
              Coordinamos el retiro y la entrega de tus ventas para que te enfoques en vender. Disponible según la zona.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/seller/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:opacity-90">
                Sumar Flash a mi cuenta <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/vender-en-madsjeez" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground transition hover:bg-muted">
                Ver cómo vender
              </Link>
            </div>
          </div>
          <div className="lg:pl-4">
            <Reveal><LogisticsCard /></Reveal>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Cómo funciona</h2>
          <p className="mt-2 text-sm text-muted-foreground">Tres pasos, sin complicarte la operación.</p>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} delay={i * 0.08} className="h-full">
                <TiltCard className="group h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{s.desc}</p>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Para quién + aclaración honesta */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 md:py-16 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Para quién es</h2>
            <p className="mt-3 max-w-md text-base leading-7 text-muted-foreground">
              Pensado para comercios y vendedores que quieren sacarse de encima la logística de sus ventas online.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {FOR_WHO.map((r) => (
                <span key={r} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground">{r}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.1} className="rounded-2xl border border-border bg-background p-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold text-foreground">Cobertura según la zona</p>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Flash está disponible donde hay cobertura. Si tu zona todavía no la tiene, podés coordinar el envío vos mismo desde tu panel: nunca te quedás sin opción para despachar.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 text-center md:p-12">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Bolt className="h-6 w-6" /></span>
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Empezá a vender y sumá Flash</h2>
          <p className="max-w-xl text-base text-muted-foreground">Creá tu cuenta de vendedor y, si tu zona tiene cobertura, activá Flash para tus ventas.</p>
          <Link href="/seller/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90">
            Crear cuenta de vendedor <ChevronRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
