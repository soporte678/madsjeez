"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingCart, Menu, User, Heart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface HeaderProps {
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
    role?: "buyer" | "seller" | "admin";
  } | null;
}

export function Header({ user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FEE500] shadow-sm">
      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#333333] rounded-lg flex items-center justify-center">
                <span className="text-[#FEE500] font-bold text-xl">M</span>
              </div>
              <span className="hidden sm:block text-[#333333] font-bold text-2xl tracking-tight">
                MADSJEEZ
              </span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar productos, marcas y más..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-12 bg-white border-0 shadow-sm rounded-sm text-[#333333] placeholder:text-gray-400 focus-visible:ring-[#3483FA]"
              />
              <Button
                size="icon"
                className="absolute right-0 top-0 h-full px-3 bg-[#EEEEEE] hover:bg-[#DDDDDD] rounded-l-none rounded-r-sm"
              >
                <Search className="h-5 w-5 text-[#333333]" />
              </Button>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-[#333333] hover:bg-[#333333]/10"
            >
              <Bell className="h-5 w-5" />
            </Button>

            {/* Favorites */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex text-[#333333] hover:bg-[#333333]/10"
            >
              <Heart className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-[#333333] hover:bg-[#333333]/10"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#3483FA] text-white text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </Button>
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    className="hidden md:flex items-center gap-2 text-[#333333] hover:bg-[#333333]/10"
                  >
                    <div className="w-8 h-8 bg-[#333333] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                      </span>
                    </div>
                    <span className="max-w-[100px] truncate">
                      {user.full_name || user.email.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem>
                    <Link href="/profile">Mi Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/orders">Mis Compras</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/favorites">Favoritos</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(user.role === "seller" || user.role === "admin") && (
                    <>
                      <DropdownMenuItem>
                        <Link href="/dashboard">Panel de Vendedor</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link href="/products/new">Publicar Producto</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuItem>
                        <Link href="/admin">Panel de Admin</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Link href="/auth/logout">Cerrar Sesión</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button
                    variant="ghost"
                    className="text-[#333333] hover:bg-[#333333]/10"
                  >
                    Ingresar
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-[#3483FA] hover:bg-[#2968C8] text-white">
                    Crear Cuenta
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-[#333333] hover:bg-[#333333]/10"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-4 mt-8">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="w-12 h-12 bg-[#333333] rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-medium">
                            {user.full_name?.charAt(0) || user.email.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || user.email}</p>
                          <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <Link href="/profile" className="text-lg">Mi Perfil</Link>
                      <Link href="/orders" className="text-lg">Mis Compras</Link>
                      <Link href="/favorites" className="text-lg">Favoritos</Link>
                      {(user.role === "seller" || user.role === "admin") && (
                        <>
                          <Link href="/dashboard" className="text-lg">
                            Panel de Vendedor
                          </Link>
                          <Link href="/products/new" className="text-lg">
                            Publicar Producto
                          </Link>
                        </>
                      )}
                      <Link href="/auth/logout" className="text-lg text-red-600">
                        Cerrar Sesión
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login">
                        <Button className="w-full" variant="outline">
                          Ingresar
                        </Button>
                      </Link>
                      <Link href="/auth/register">
                        <Button className="w-full bg-[#3483FA]">Crear Cuenta</Button>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-6 py-2 overflow-x-auto">
            <Link
              href="/categories"
              className="flex items-center gap-1 text-sm font-medium text-[#333333] hover:text-[#3483FA] whitespace-nowrap"
            >
              <Menu className="h-4 w-4" />
              Categorías
            </Link>
            <Link
              href="/deals"
              className="text-sm font-medium text-[#333333] hover:text-[#3483FA] whitespace-nowrap"
            >
              Ofertas
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-[#333333] hover:text-[#3483FA] whitespace-nowrap"
            >
              Historial
            </Link>
            <Link
              href="/supermarket"
              className="text-sm font-medium text-[#333333] hover:text-[#3483FA] whitespace-nowrap"
            >
              Supermercado
            </Link>
            <Link
              href="/fashion"
              className="text-sm font-medium text-[#333333] hover:text-[#3483FA] whitespace-nowrap"
            >
              Moda
            </Link>
            <Link
              href="/sell"
              className="text-sm font-medium text-[#3483FA] hover:text-[#2968C8] whitespace-nowrap"
            >
              Vender
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-[#333333] hover:text-[#3483FA] whitespace-nowrap"
            >
              Ayuda
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
