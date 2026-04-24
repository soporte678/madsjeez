import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  // Validar contraseña
  if (password.length < 6) {
    return NextResponse.redirect(
      new URL("/auth/register?error=password_short", request.url)
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.redirect(
      new URL("/auth/register?error=passwords_dont_match", request.url)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return NextResponse.redirect(
        new URL("/auth/register?error=email_exists", request.url)
      );
    }
    return NextResponse.redirect(
      new URL("/auth/register?error=unknown", request.url)
    );
  }

  return NextResponse.redirect(
    new URL("/auth/login?message=check_email", request.url)
  );
}
