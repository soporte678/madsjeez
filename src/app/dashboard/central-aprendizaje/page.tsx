import { GraduationCap, Search } from "lucide-react";

export default function CentralAprendizajePage() {
  return (
    <div className="flex-1 flex flex-col gap-8 w-full max-w-5xl">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-[26px] font-semibold text-foreground">Central de aprendizaje</h1>
        <p className="mt-2 text-sm text-muted-foreground">Recursos cortos y accionables para mejorar operación, catálogo, logística y conversión.</p>
        <div className="mt-4 relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Buscar guía, tema o nivel" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground outline-none focus:border-primary" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { title: "Optimizar publicaciones para vender más", category: "ventas", level: "base", summary: "Checklist para mejorar título, precio, fotos y conversión." },
          { title: "Campañas para mover stock lento", category: "marketing", level: "pro", summary: "Acciones comerciales para recuperar publicaciones con baja rotación." },
          { title: "Logística Flash: primeros pasos", category: "logística", level: "base", summary: "Cómo configurar envíos rápidos y mejorar la experiencia del comprador." },
          { title: "Respuestas automáticas con IA", category: "catálogo", level: "pro", summary: "Usá el bot de WhatsApp para responder preguntas frecuentes automáticamente." },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/15 text-primary text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">{item.category}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.level}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-foreground mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
