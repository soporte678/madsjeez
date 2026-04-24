import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Si ya está logueado, redirigir
  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBEBEB] px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#333333] rounded-lg flex items-center justify-center">
              <span className="text-[#FEE500] font-bold text-xl">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Creá tu cuenta</CardTitle>
          <CardDescription>
            Completá tus datos para registrarte en MADSJEEZ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchParams.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {searchParams.error === "email_exists" 
                ? "El email ya está registrado" 
                : searchParams.error === "password_short"
                ? "La contraseña debe tener al menos 6 caracteres"
                : "Ocurrió un error. Intentá de nuevo."}
            </div>
          )}

          {searchParams.message === "check_email" && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
              Te enviamos un email de confirmación. Revisá tu bandeja de entrada.
            </div>
          )}

          <form action="/api/auth/register" method="POST" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Juan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-start gap-2">
              <Checkbox id="terms" name="terms" required />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-tight">
                Acepto los{" "}
                <Link href="/legal/terminos" className="text-[#3483FA] hover:underline" target="_blank">
                  Términos y Condiciones
                </Link>
                {" "}y la{" "}
                <Link href="/legal/privacidad" className="text-[#3483FA] hover:underline" target="_blank">
                  Política de Privacidad
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full bg-[#3483FA] hover:bg-[#2968C8]">
              Crear cuenta
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/api/auth/google">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/api/auth/facebook">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar con Facebook
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿Ya tenés cuenta?{" "}
            <Link href="/auth/login" className="text-[#3483FA] hover:underline font-medium">
              Ingresar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
