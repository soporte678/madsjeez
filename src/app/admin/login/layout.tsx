export const metadata = {
  title: "Login - MaqJeez ERP",
  description: "Acceso exclusivo para administradores",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-900">
      {children}
    </div>
  )
}
