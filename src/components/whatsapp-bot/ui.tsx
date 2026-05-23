"use client";



import clsx from "clsx";

import { Loader2, X } from "lucide-react";

import { ReactNode, useEffect } from "react";



/* ——— Card ——— */



export function WaCard({

  children,

  className,

  padding = true,

}: {

  children: ReactNode;

  className?: string;

  padding?: boolean;

}) {

  return (

    <section className={clsx("wa-panel", padding && "wa-card-body", className)}>

      {children}

    </section>

  );

}



export function WaCardHeader({

  title,

  subtitle,

  icon,

  action,

}: {

  title: string;

  subtitle?: string;

  icon?: ReactNode;

  action?: ReactNode;

}) {

  return (

    <div className="wa-card-header">

      <div className="wa-card-header-text">

        <h2 className="wa-section-title">

          {icon}

          {title}

        </h2>

        {subtitle ? <p className="wa-card-sub">{subtitle}</p> : null}

      </div>

      {action}

    </div>

  );

}



/* ——— Chips ——— */



export function WaPill({

  children,

  tone = "blue",

}: {

  children: ReactNode;

  tone?: "blue" | "green" | "purple" | "orange" | "red" | "slate";

}) {

  const tones = {

    blue: "border-blue-400/25 bg-blue-500/10 text-blue-200",

    green: "border-green-400/25 bg-green-500/10 text-green-200",

    purple: "border-purple-400/25 bg-purple-500/10 text-purple-200",

    orange: "border-orange-400/25 bg-orange-500/10 text-orange-200",

    red: "border-red-400/25 bg-red-500/10 text-red-200",

    slate: "border-white/10 bg-white/[0.05] text-slate-200",

  } as const;

  return (

    <span

      className={clsx(

        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold",

        tones[tone]

      )}

    >

      {children}

    </span>

  );

}



/** Etiquetas de WhatsApp (verde) vs tags CRM (azul) — nunca mezclar visualmente. */

export function WaChip({

  label,

  kind,

}: {

  label: string;

  kind: "whatsapp" | "crm";

}) {

  return (

    <span className={clsx("wa-chip", kind === "whatsapp" ? "wa-chip--wa" : "wa-chip--crm")}>

      <span className="wa-chip-badge">{kind === "whatsapp" ? "WhatsApp" : "CRM"}</span>

      {label}

    </span>

  );

}



export function WaChipList({

  items,

  kind,

  empty,

}: {

  items: string[];

  kind: "whatsapp" | "crm";

  empty?: string;

}) {

  if (!items.length) {

    return empty ? <span className="text-xs text-slate-500">{empty}</span> : null;

  }

  return (

    <div className="wa-chip-list">

      {items.map((t) => (

        <WaChip key={`${kind}-${t}`} label={t} kind={kind} />

      ))}

    </div>

  );

}



/* ——— Avatar ——— */



export function WaAvatar({

  label,

  imageUrl,

  className,

  size = "md",

}: {

  label: string;

  imageUrl?: string | null;

  className?: string;

  size?: "sm" | "md" | "lg";

}) {

  const sizeClass =

    size === "sm" ? "wa-avatar--sm" : size === "lg" ? "wa-avatar--lg" : "wa-avatar--md";

  const initials =

    label

      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, " ")

      .trim()

      .split(/\s+/)

      .map((w) => w[0])

      .join("")

      .slice(0, 2)

      .toUpperCase() || "?";

  if (imageUrl) {

    return (

      // eslint-disable-next-line @next/next/no-img-element

      <img

        src={imageUrl}

        alt={label}

        className={clsx("wa-avatar wa-avatar-img", sizeClass, className)}

      />

    );

  }

  return (

    <div className={clsx("wa-avatar wa-avatar-fallback", sizeClass, className)}>

      {initials}

    </div>

  );

}



/* ——— Buttons ——— */



type WaButtonVariant = "primary" | "ghost" | "danger";



export function WaButton({

  children,

  onClick,

  type = "button",

  variant = "primary",

  loading = false,

  disabled,

  className,

  title,

}: {

  children: ReactNode;

  onClick?: () => void;

  type?: "button" | "submit";

  variant?: WaButtonVariant;

  loading?: boolean;

  disabled?: boolean;

  className?: string;

  title?: string;

}) {

  const base =

    variant === "primary"

      ? "wa-btn-primary"

      : variant === "danger"

        ? "wa-btn-ghost wa-btn-danger"

        : "wa-btn-ghost";

  return (

    <button

      type={type}

      className={clsx(base, className)}

      onClick={onClick}

      disabled={disabled || loading}

      title={title}

    >

      {loading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : null}

      {children}

    </button>

  );

}



/* ——— Tables ——— */



export function WaTableWrap({ children, className }: { children: ReactNode; className?: string }) {

  return (

    <div className={clsx("wa-table-wrap", className)}>

      <table className="wa-table">{children}</table>

    </div>

  );

}



export function WaTableHead({ children }: { children: ReactNode }) {

  return <thead className="wa-table-head">{children}</thead>;

}



export function WaTableBody({ children }: { children: ReactNode }) {

  return <tbody className="wa-table-body">{children}</tbody>;

}



export function WaTableRow({

  children,

  onClick,

}: {

  children: ReactNode;

  onClick?: () => void;

}) {

  if (onClick) {

    return (

      <tr className="wa-table-row wa-table-row--click" onClick={onClick} role="button" tabIndex={0}>

        {children}

      </tr>

    );

  }

  return <tr className="wa-table-row">{children}</tr>;

}



export function WaTh({

  children,

  align = "left",

  className,

}: {

  children?: ReactNode;

  align?: "left" | "center" | "right";

  className?: string;

}) {

  return (

    <th className={clsx("wa-th", `wa-th--${align}`, className)} scope="col">

      {children}

    </th>

  );

}



export function WaTd({

  children,

  align = "left",

  className,

  colSpan,

}: {

  children?: ReactNode;

  align?: "left" | "center" | "right";

  className?: string;

  colSpan?: number;

}) {

  return (

    <td className={clsx("wa-td", `wa-td--${align}`, className)} colSpan={colSpan}>

      {children}

    </td>

  );

}



/* ——— Modal ——— */



export function WaModal({

  open,

  onClose,

  title,

  children,

  footer,

  size = "md",

}: {

  open: boolean;

  onClose: () => void;

  title: string;

  children: ReactNode;

  footer?: ReactNode;

  size?: "sm" | "md" | "lg";

}) {

  useEffect(() => {

    if (!open) return;

    const onKey = (e: KeyboardEvent) => {

      if (e.key === "Escape") onClose();

    };

    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {

      document.removeEventListener("keydown", onKey);

      document.body.style.overflow = prev;

    };

  }, [open, onClose]);



  if (!open) return null;



  return (

    <div className="wa-modal-root" role="presentation" onClick={onClose}>

      <div

        className={clsx("wa-modal", size === "sm" && "wa-modal--sm", size === "lg" && "wa-modal--lg")}

        role="dialog"

        aria-modal="true"

        aria-labelledby="wa-modal-title"

        onClick={(e) => e.stopPropagation()}

      >

        <div className="wa-modal-header">

          <h3 id="wa-modal-title" className="wa-modal-title">

            {title}

          </h3>

          <button type="button" className="wa-modal-close" onClick={onClose} aria-label="Cerrar">

            <X className="h-4 w-4" />

          </button>

        </div>

        <div className="wa-modal-body">{children}</div>

        {footer ? <div className="wa-modal-footer">{footer}</div> : null}

      </div>

    </div>

  );

}



/* ——— Errors ——— */



export function WaErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {

  return (

    <div className="wa-error-banner" role="alert">

      <p>{message}</p>

      {onRetry ? (

        <button type="button" className="wa-btn-ghost text-xs mt-2" onClick={onRetry}>

          Reintentar

        </button>

      ) : null}

    </div>

  );

}



/* ——— Config tabs ——— */



export type WaConfigTabId = "conexion" | "ia" | "bot" | "sync" | "reglas" | "diag";



export function WaConfigTabs({

  active,

  onChange,

  tabs,

}: {

  active: WaConfigTabId;

  onChange: (id: WaConfigTabId) => void;

  tabs: readonly { id: WaConfigTabId; label: string }[];

}) {

  return (

    <nav className="wa-config-tabs" aria-label="Secciones de configuración">

      {tabs.map((t) => (

        <button

          key={t.id}

          type="button"

          role="tab"

          aria-selected={active === t.id}

          className={clsx("wa-config-tab", active === t.id && "wa-config-tab--active")}

          onClick={() => onChange(t.id)}

        >

          {t.label}

        </button>

      ))}

    </nav>

  );

}


