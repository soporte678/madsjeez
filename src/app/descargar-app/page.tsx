"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"

type Device = "android" | "ios" | "desktop" | null

const APK_URL = "/downloads/madsjeez.apk"

function useDevice(): Device {
  const [device, setDevice] = useState<Device>(null)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/android/.test(ua)) setDevice("android")
    else if (/iphone|ipad|ipod/.test(ua)) setDevice("ios")
    else setDevice("desktop")
  }, [])
  return device
}

function StepCircle({ n, label, detail }: { n: number; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/30">
        {n}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-lg md:text-xl font-bold text-gray-900">{label}</p>
        {detail && <p className="mt-1 text-gray-500 text-sm leading-relaxed">{detail}</p>}
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 py-4 text-left font-semibold text-gray-900 text-base hover:text-orange-600 transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        <svg className={`w-5 h-5 flex-shrink-0 text-orange-500 transition-transform ${open ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
      {open && <p className="pb-4 text-gray-600 text-sm leading-relaxed">{a}</p>}
    </div>
  )
}

const FAQS = [
  { q: "¿La web va a seguir funcionando?", a: "Sí. La web de Madsjeez sigue funcionando normalmente. La app es solo una opción adicional para entrar más rápido desde el celular." },
  { q: "¿Tengo que descargar la app sí o sí?", a: "No. Podés usar Madsjeez desde la web sin instalar nada. La app es una comodidad extra, no un requisito." },
  { q: "¿La app usa la misma cuenta?", a: "Sí. Usás la misma cuenta, el mismo carrito y los mismos datos que en la web." },
  { q: "¿Funciona en iPhone?", a: "La descarga de APK es solo para Android. En iPhone podés usar Madsjeez desde Safari y agregarlo a la pantalla de inicio para tener un acceso directo, igual que una app." },
  { q: "¿Es segura?", a: "Sí, siempre que la descargues desde el sitio oficial www.madsjeez.com.ar. No descargues archivos de Madsjeez desde páginas o links desconocidos." },
  { q: "¿Por qué Android me pide permiso para instalar?", a: "Porque estás descargando la app directamente desde la página oficial de Madsjeez, no desde Google Play. Tocá Permitir solo si estás en www.madsjeez.com.ar." },
  { q: "¿La app de Android está en Google Play?", a: "Todavía no, pero estamos trabajando para publicarla. Por ahora podés descargar el archivo directamente desde esta página." },
]

const FEATURES = [
  { icon: "🛒", label: "Comprar productos" },
  { icon: "🔍", label: "Buscar ofertas" },
  { icon: "🗂️", label: "Ver tu carrito" },
  { icon: "👤", label: "Entrar a tu cuenta" },
  { icon: "📦", label: "Vender productos" },
  { icon: "📊", label: "Panel vendedor" },
  { icon: "📋", label: "Ver tus publicaciones" },
  { icon: "💬", label: "Contactar soporte" },
]

export default function DescargarAppPage() {
  const device = useDevice()

  const isAndroidFirst = device === "android" || device === null
  const isIosFirst = device === "ios"

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* ── HERO ── */}
      <section className="bg-gray-950 text-white px-4 py-14 md:py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 text-sm text-orange-400 font-semibold mb-6">
            📱 App oficial de Madsjeez
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.08]">
            Descargá Madsjeez<br />en tu celular
          </h1>
          <p className="mt-5 text-gray-300 text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
            Instalá la app de Madsjeez para comprar y vender más cómodo desde tu teléfono.
          </p>
          <p className="mt-4 text-gray-500 text-sm max-w-md mx-auto">
            Tenés dos formas de usar Madsjeez: desde la web o desde la app. La web va a seguir funcionando siempre. La app es solo una opción más cómoda para entrar desde el celular.
          </p>
          <div className="mt-6">
            <Link href="/como-usar-la-app" className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors">
              Ver guía de uso de la app
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {/* Botón APK para Android y desktop */}
          {!isIosFirst && (
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/downloads/madsjeez.apk"
                download="madsjeez.apk"
                className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-orange-600 text-white font-black px-7 py-4 rounded-2xl transition-all text-base active:scale-95 shadow-lg shadow-orange-500/25"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Descargar APK para Android
                <span className="text-orange-200 text-sm font-normal">1.2 MB</span>
              </a>
              <Link href="#iphone" className="inline-flex items-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold px-6 py-4 rounded-2xl transition-all text-sm">
                Instalar en iPhone
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </div>
          )}
          {isIosFirst && (
            <div className="mt-8">
              <a href="#iphone" className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white font-bold px-7 py-4 rounded-2xl transition-all text-base">
                Ver pasos para iPhone →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── 3 OPCIONES ── */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-8 text-gray-900">¿Cómo querés usar Madsjeez?</h2>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 ${isIosFirst ? "md:[&>*:first-child]:order-2 md:[&>*:nth-child(2)]:order-3 md:[&>*:last-child]:order-1" : ""}`}>

            {/* Opción Web */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm text-center flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Usar desde la web</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">No necesitás instalar nada. Podés entrar desde cualquier navegador en cualquier celular.</p>
              <Link href="/" className="w-full inline-flex items-center justify-center gap-2 border border-blue-500 text-blue-600 hover:bg-blue-50 font-bold px-5 py-3 rounded-xl transition-all text-sm">
                Entrar a Madsjeez web
              </Link>
            </div>

            {/* Opción Android */}
            <div className={`bg-white border-2 rounded-2xl p-6 shadow-md text-center flex flex-col ${isAndroidFirst ? "border-orange-500 shadow-orange-100" : "border-gray-100"}`}>
              {isAndroidFirst && (
                <div className="bg-orange-500 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 mx-auto">Recomendado para vos</div>
              )}
              <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.341l-4.415-2.581A2 2 0 0 0 12 12.5a2 2 0 0 0-1.108.26L6.477 15.34A8 8 0 0 1 4 9h16a8 8 0 0 1-2.477 6.341zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Instalar en Android</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">Si tenés Android, abrí esta página en Chrome y agregá Madsjeez a tu pantalla de inicio como app.</p>
              <a href="#como-instalar" className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-xl transition-all text-sm active:scale-95">
                Ver cómo instalarlo
              </a>
            </div>

            {/* Opción iPhone */}
            <div className={`bg-white border-2 rounded-2xl p-6 shadow-md text-center flex flex-col ${isIosFirst ? "border-orange-500 shadow-orange-100" : "border-gray-100"}`}>
              {isIosFirst && (
                <div className="bg-orange-500 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 mx-auto">Recomendado para vos</div>
              )}
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Instalar en iPhone</h3>
              <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-5">Si tenés iPhone, no descargás ningún archivo. Seguí los pasos para agregarlo a tu pantalla de inicio.</p>
              <a href="#iphone" className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-500 text-gray-700 font-bold px-5 py-3 rounded-xl transition-all text-sm">
                Ver pasos para iPhone
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PASOS ANDROID ── */}
      <section id="como-instalar" className="px-4 py-14 bg-white">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.341l-4.415-2.581A2 2 0 0 0 12 12.5a2 2 0 0 0-1.108.26L6.477 15.34A8 8 0 0 1 4 9h16a8 8 0 0 1-2.477 6.341z"/></svg>
            </div>
            <span className="text-orange-500 font-bold text-sm uppercase tracking-wider">Para Android</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900">Cómo instalar en Android</h2>
          <p className="text-gray-500 mb-8">Dos métodos disponibles. Recomendamos la APK directa.</p>

          {/* Método 1: APK directa */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-orange-500 text-white text-xs font-black px-2.5 py-1 rounded-lg">Recomendado</span>
              <h3 className="font-black text-gray-900 text-lg">Instalar la APK directamente</h3>
            </div>

            <div className="space-y-5">
              <StepCircle n={1} label="Descargá la APK" detail="Tocá el botón naranja de arriba o el de acá abajo para descargar el archivo." />
              <StepCircle n={2} label="Abrí el archivo descargado" detail="Vas a ver la notificación de descarga en tu celular. Tocala para abrir el instalador." />
              <StepCircle n={3} label='Si aparece "Fuentes desconocidas", tocá Configuración' detail='Android puede pedirte permiso para instalar apps fuera de Google Play. Tocá "Configuración", activá el permiso para tu navegador, y volvé.' />
              <StepCircle n={4} label='Tocá "Instalar" → Abrir. ¡Listo!' detail="El ícono de Madsjeez aparece en tu celular. Tiene todas las funciones de la web." />
            </div>

            <a
              href="/downloads/madsjeez.apk"
              download="madsjeez.apk"
              className="mt-6 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-5 py-4 rounded-xl transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Descargar APK — 1.2 MB
            </a>

            <div className="mt-4 flex items-center gap-2 text-xs text-orange-700 bg-orange-100 rounded-xl px-4 py-2.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              Descargá solo desde <strong className="ml-1">www.madsjeez.com.ar</strong> — es la única fuente oficial
            </div>
          </div>

          {/* Método 2: Chrome PWA */}
          <details className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
            <summary className="px-6 py-4 cursor-pointer font-bold text-gray-800 flex items-center justify-between select-none hover:bg-gray-100 transition-colors">
              <span>Método alternativo: instalar desde Chrome (sin descargar archivo)</span>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </summary>
            <div className="px-6 pb-6 pt-2">
              <p className="text-gray-500 text-sm mb-6">Si preferís no descargar ningún archivo, podés usar Chrome para agregar Madsjeez a tu pantalla de inicio:</p>
              <div className="space-y-6">
                <StepCircle n={1} label="Abrí Chrome en tu celular Android." detail="Tiene que ser Google Chrome (el ícono de círculo de colores). No Firefox ni Samsung Internet." />
                <StepCircle n={2} label="Entrá a www.madsjeez.com.ar" detail="Escribilo en la barra de arriba de Chrome y apretá Enter." />
                <StepCircle n={3} label='Tocá los tres puntitos (⋮) arriba a la derecha.' detail='Se abre un menú. Buscá la opción "Agregar a pantalla de inicio" o "Instalar app".' />
                <StepCircle n={4} label='Tocá "Instalar" o "Agregar". ¡Listo!' detail="El ícono de Madsjeez aparece en tu pantalla de inicio." />
              </div>
              <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                <p className="font-bold mb-1">Chrome te mostró un banner automático?</p>
                <p>Si Chrome te muestra un cartel que dice "Instalar Madsjeez", tocalo directamente. Es la forma más fácil.</p>
              </div>
            </div>
          </details>

          {/* Google Play — Próximamente */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="flex-shrink-0 relative">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center opacity-50">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3.8C3 3 3.9 2.5 4.6 2.9L21 11.5C21.7 11.9 21.7 12.9 21 13.3L4.6 21.9C3.9 22.3 3 21.8 3 21V3.8Z" fill="url(#gplay-a)"/>
                  <path d="M3 3.8L13 12.4 4.6 2.9C3.9 2.5 3 3 3 3.8Z" fill="#ea4335"/>
                  <path d="M3 21L13 12.4 4.6 21.9C3.9 22.3 3 21.8 3 21Z" fill="#34a853"/>
                  <path d="M21 11.5L13 12.4 21 13.3C21.7 12.9 21.7 11.9 21 11.5Z" fill="#f9ab00"/>
                  <defs>
                    <linearGradient id="gplay-a" x1="3" y1="12.4" x2="21" y2="12.4" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#4285f4"/>
                      <stop offset="60%" stopColor="#34a853"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">Pronto</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-1">Próximamente en Google Play</p>
              <p className="text-gray-500 text-xs leading-relaxed">Estamos construyendo la versión de Madsjeez para Google Play Store. Cuando esté lista, podrás instalarla con actualizaciones automáticas. Por ahora, el método de arriba funciona igual de bien.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PASOS IPHONE ── */}
      <section id="iphone" className="px-4 py-14 bg-gray-50">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            </div>
            <span className="text-gray-700 font-bold text-sm uppercase tracking-wider">Para iPhone</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black mb-2 text-gray-900">Cómo instalar Madsjeez en iPhone</h2>
          <p className="text-gray-500 mb-8">Son pocos pasos y no necesitás descargar nada.</p>

          <div className="space-y-8">
            <StepCircle n={1} label="Abrí Safari en tu iPhone." detail="Es el navegador con el ícono de una brújula. Importante: tiene que ser Safari, no Chrome ni Firefox." />
            <StepCircle n={2} label="Entrá a www.madsjeez.com.ar" detail="Escribilo en la barra de arriba de Safari y apretá Ir." />
            <StepCircle n={3} label='Tocá el botón "Compartir".' detail='Es el ícono de una cajita con una flechita para arriba. Está en la barra de abajo de Safari, en el medio.' />
            <StepCircle n={4} label='Deslizá y elegí "Agregar a pantalla de inicio".' detail="Buscá esa opción entre las que aparecen. Si no la ves, deslizá la lista para abajo." />
            <StepCircle n={5} label='Tocá "Agregar".' detail="El ícono de Madsjeez va a aparecer en tu pantalla de inicio como si fuera una app." />
            <StepCircle n={6} label="¡Listo! Ya tenés Madsjeez en tu iPhone." detail="Tocá el ícono cuando quieras entrar a Madsjeez, igual que con cualquier otra app." />
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-sm text-blue-800">
            <p className="font-bold mb-1">ℹ️ En iPhone no se descarga APK</p>
            <p>La forma correcta para iPhone es agregar Madsjeez a la pantalla de inicio desde Safari. La web de Madsjeez sigue funcionando siempre. Esta opción solo crea un acceso más cómodo en tu celular.</p>
          </div>

          {/* App Store — Próximamente */}
          <div className="mt-4 bg-gray-100 border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="flex-shrink-0 relative">
              <div className="w-14 h-14 rounded-2xl bg-gray-200 flex items-center justify-center opacity-50">
                <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">Pronto</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-1">Próximamente en App Store</p>
              <p className="text-gray-500 text-xs leading-relaxed">Estamos construyendo la versión de Madsjeez para el App Store de Apple. Mientras tanto, el método de arriba (Safari + Agregar a pantalla de inicio) funciona exactamente igual que una app nativa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUÉ PODÉS HACER ── */}
      <section className="px-4 py-14 bg-white">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">La app tiene todo lo que tiene la web</h2>
            <p className="text-gray-500">Nada se pierde. Todas las funciones disponibles en tu celular.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Compradores */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </span>
                Para compradores
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {["Buscar productos y catálogos", "Ver fichas completas de productos", "Agregar al carrito y comprar", "Ver historial de pedidos", "Contactar vendedores", "Guardar favoritos", "Explorar por categorías", "Ver ofertas y descuentos"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Vendedores */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </span>
                Para vendedores
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {["Panel de ventas y estadísticas", "Publicar y editar productos", "Ver y gestionar stock", "Responder preguntas y consultas", "Ver pedidos y ventas", "Gestionar envíos", "Crear publicaciones", "Ver métricas en tiempo real"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cuenta */}
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                </span>
                Tu cuenta
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {["Iniciar y cerrar sesión", "Editar perfil y datos", "Ver historial completo", "Gestionar notificaciones", "Cambiar contraseña", "Configuración de cuenta"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* App features */}
            <div className="bg-orange-50 rounded-2xl border border-orange-100 p-5">
              <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
                </span>
                Funciones extra en la app
              </h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                {["Acceso rápido desde pantalla de inicio", "Ícono propio en el celular", "Notificaciones push nativas", "Sin barra de navegación del browser", "Pantalla completa (full screen)", "Funciona sin instalar Google Play"].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARA VENDEDORES ── */}
      <section className="px-4 py-12 bg-orange-500">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Vendé desde el celular</h2>
          <p className="text-orange-100 text-base leading-relaxed mb-6 max-w-md mx-auto">
            Si sos vendedor, la app te permite entrar más rápido a tu panel, revisar productos, ventas, consultas y envíos desde el teléfono.
          </p>
          <Link href="/vendedores" className="inline-flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-black px-8 py-4 rounded-2xl transition-all text-base shadow-lg">
            Quiero vender en Madsjeez
          </Link>
        </div>
      </section>

      {/* ── PARA QUIENES NO QUIEREN INSTALAR NADA ── */}
      <section className="px-4 py-12 bg-gray-50 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-3">También podés usar la web sin descargar nada</h2>
          <p className="text-gray-500 mb-6">Si no querés instalar la app, no hay problema. Podés seguir entrando a Madsjeez desde el navegador como siempre.</p>
          <Link href="/" className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-gray-500 text-gray-700 font-bold px-6 py-3 rounded-xl transition-all">
            Entrar a Madsjeez web
          </Link>
        </div>
      </section>

      {/* ── CONFIANZA ── */}
      <section className="px-4 py-8 bg-gray-950 text-center">
        <div className="mx-auto max-w-lg">
          <p className="text-orange-400 font-bold mb-1 text-sm uppercase tracking-wider">Seguridad</p>
          <p className="text-white font-semibold text-base">Esta es la app oficial de Madsjeez.</p>
          <p className="text-gray-400 text-sm mt-1">No descargues archivos enviados por desconocidos. Usá siempre el sitio oficial <strong className="text-gray-200">www.madsjeez.com.ar</strong>.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-4 py-14 bg-white">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl md:text-3xl font-black mb-8 text-gray-900">Preguntas frecuentes</h2>
          <div className="bg-gray-50 rounded-2xl border border-gray-100 px-5">
            {FAQS.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 py-14 bg-gray-950 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Instalá Madsjeez en tu celular ahora</h2>
          <p className="text-gray-400 text-sm mb-8">Android: desde Chrome, menú → "Agregar a pantalla de inicio". iPhone: desde Safari → Compartir → Agregar.</p>
          <a href="#como-instalar" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 text-lg shadow-lg shadow-orange-500/30 mb-4 w-full justify-center">
            Ver pasos para Android
          </a>
          <a href="#iphone" className="block text-sm text-gray-500 hover:text-orange-400 transition-colors">
            Tengo iPhone →
          </a>
        </div>
      </section>

      {/* JSON-LD FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </main>
  )
}
