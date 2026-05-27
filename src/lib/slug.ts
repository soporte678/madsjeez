/**
 * Helper para generar slugs URL-friendly a partir de títulos de productos.
 * Elimina acentos, caracteres especiales, y limita la longitud.
 */

export function generateSlug(title: string, brand?: string): string {
  const base = brand ? `${brand}-${title}` : title;
  return base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos/diacríticos
    .replace(/[^a-z0-9]+/g, "-")     // Reemplaza no alfanuméricos por -
    .replace(/^-|-$/g, "")            // Elimina guiones al inicio/final
    .substring(0, 120);               // Limita a 120 caracteres
}

/**
 * Genera un slug único verificando contra la base de datos.
 * Si ya existe, agrega un sufijo numérico.
 */
export async function generateUniqueSlug(
  title: string,
  brand?: string,
  checkExists?: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = generateSlug(title, brand);

  // Si no hay función de verificación, devolvemos el slug base
  if (!checkExists) {
    return baseSlug;
  }

  // Verificar unicidad
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;

    // Safety limit
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
}

/**
 * Genera un slug a partir de un string cualquiera (para categorías, etc.)
 */
export function generateSlugFromString(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}
