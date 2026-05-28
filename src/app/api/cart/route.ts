import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client";;
import type { Decimal } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function isMissingColumnError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2022"
  );
}

// GET /api/cart - Obtener carrito del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: { select: { id: true, name: true } },
                images: { orderBy: { order: "asc" }, take: 1 },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Si no existe carrito, crear uno vacío
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  seller: { select: { id: true, name: true } },
                  images: { orderBy: { order: "asc" }, take: 1 },
                },
              },
            },
          },
        },
      });
    }

    // Totales alineados con checkout Mercado Pago (mismo vendedor / envío fijo si no hay free shipping)
    const subtotal = cart.items.reduce(
      (sum: number, item: { price: number | Decimal; quantity: number }) => sum + Number(item.price) * item.quantity,
      0
    );
    const shippingCost = cart.items.some(
      (item: { product: { freeShipping: boolean } }) => !item.product.freeShipping
    )
      ? 2500
      : 0;
    /** Cobro al comprador en checkout MP: subtotal + 50% envío (ver escrow-split). */
    const buyerShippingShare =
      shippingCost > 0 ? Math.round((shippingCost / 2) * 100) / 100 : 0;
    const sellerShippingShare =
      shippingCost > 0 ? Math.round((shippingCost - buyerShippingShare) * 100) / 100 : 0;
    const totalChargedToBuyer = Math.round((subtotal + buyerShippingShare) * 100) / 100;

    return NextResponse.json({
      cart,
      summary: {
        itemCount: cart.items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0),
        subtotal,
        shippingCost,
        buyerShippingShare,
        sellerShippingShare,
        tax: 0,
        /** Total que pagará el comprador al ir a Mercado Pago. */
        total: totalChargedToBuyer,
        /** Total subtotal + envío completo (solo referencia logística). */
        totalWithFullShipping: Math.round((subtotal + shippingCost) * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    // Mitigacion temporal: si faltan columnas por migraciones pendientes,
    // devolvemos carrito vacio para no romper la UX con 500.
    if (isMissingColumnError(error)) {
      return NextResponse.json({
        cart: { items: [] },
        summary: {
          itemCount: 0,
          subtotal: 0,
          shippingCost: 0,
          buyerShippingShare: 0,
          sellerShippingShare: 0,
          tax: 0,
          total: 0,
          totalWithFullShipping: 0,
        },
      });
    }
    return NextResponse.json(
      { error: "Error al obtener el carrito", cart: null, summary: null },
      { status: 500 }
    );
  }
}

// POST /api/cart - Agregar item al carrito
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID requerido" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, stock: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
    }

    // Obtener o crear carrito
    let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: session.user.id } });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
      }
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity, price: new Prisma.Decimal(product.price) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Error al agregar al carrito" }, { status: 500 });
  }
}

// PATCH /api/cart - Actualizar cantidad de un item
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, quantity } = body;

    if (!itemId || typeof quantity !== "number") {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: { items: { include: { product: { select: { stock: true } } } } },
    });

    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    const item = cart.items.find((i: { id: string }) => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Item no encontrado" }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      const stock = item.product?.stock ?? 0;
      if (quantity > stock) {
        return NextResponse.json({ error: "Stock insuficiente" }, { status: 400 });
      }
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Error al actualizar carrito" }, { status: 500 });
  }
}

// DELETE /api/cart - Eliminar item del carrito
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const clearAll = searchParams.get("clearAll") === "true";

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      return NextResponse.json({ error: "Carrito no encontrado" }, { status: 404 });
    }

    if (clearAll) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } else if (itemId) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, cartId: cart.id },
      });
    } else {
      return NextResponse.json({ error: "itemId o clearAll requerido" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cart item:", error);
    return NextResponse.json({ error: "Error al eliminar item" }, { status: 500 });
  }
}
