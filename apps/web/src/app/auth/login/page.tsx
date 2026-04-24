import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string; error?: string };
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Si ya está logueado, redirigir
  if (session) {
    redirect(searchParams.redirect || "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBEBEB] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#333333] rounded-lg flex items-center justify-center">
              <span className="text-[#FEE500] font-bold text-xl">M</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Ingresá a tu cuenta</CardTitle>
          <CardDescription>
            Ingresá tus datos para acceder a MADSJEEZ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchParams.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {searchParams.error === "invalid_credentials" 
                ? "Email o contraseña incorrectos" 
                : "Ocurrió un error. Intentá de nuevo."}
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-4">
            <input type="hidden" name="redirect" value={searchParams.redirect || "/"} />
            
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
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="remember" className="rounded" />
                Recordarme
              </label>
              <Link href="/auth/forgot-password" className="text-[#3483FA] hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button type="submit" className="w-full bg-[#3483FA] hover:bg-[#2968C8]">
              Ingresar
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="space-y-3">
            <Link href="/api/auth/google">
              <Button variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </Button>
            </Link>

            <Link href="/api/auth/facebook">
              <Button variant="outline" className="w-full">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar con Facebook
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tenés cuenta?{" "}
            <Link href="/auth/register" className="text-[#3483FA] hover:underline font-medium">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
