import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminRequest } from "@/lib/admin-api"

// All MercadoLibre Argentina categories with subcategories
const MELI_CATEGORIES = [
  {
    name: "Accesorios para Vehículos",
    slug: "accesorios-para-vehiculos",
    children: [
      "Acc. para Motos y Cuatriciclos", "Acc. para Camiones", "Audio para Vehículos",
      "Baterías y Cargadores", "Cubiertas, Llantas y Accesorios", "Estética y Cuidado",
      "GPS y Accesorios", "Herramientas para Vehículos", "Instalación de Accesorios",
      "Interior del Vehículo", "Luces y Faros", "Navegadores GPS",
      "Performance", "Porta Equipajes y Barras", "Repuestos Autos y Camionetas",
      "Repuestos Motos y Cuatriciclos", "Seguridad para Vehículos", "Tuning y Styling"
    ]
  },
  {
    name: "Agro",
    slug: "agro",
    children: [
      "Agricultura de Precisión", "Alambrados y Tranqueras", "Alimentos para Animales",
      "Bebederos y Comederos", "Corrales y Mangas", "Fertilizantes y Agroquímicos",
      "Herramientas Agrícolas", "Maquinaria Agrícola", "Riego",
      "Sanidad Animal", "Semillas y Bulbos", "Silos y Almacenaje"
    ]
  },
  {
    name: "Alimentos y Bebidas",
    slug: "alimentos-y-bebidas",
    children: [
      "Aceites y Vinagres", "Almacén", "Bebidas Alcohólicas",
      "Bebidas No Alcohólicas", "Cafetería e Infusiones", "Congelados",
      "Conservas", "Dietéticos y Suplementos", "Dulces y Chocolates",
      "Especias y Condimentos", "Harinas y Panificados", "Lácteos",
      "Pastas", "Snacks y Galletas", "Yerba Mate"
    ]
  },
  {
    name: "Animales y Mascotas",
    slug: "animales-y-mascotas",
    children: [
      "Aves", "Caballos", "Gatos",
      "Peces y Acuarios", "Perros", "Reptiles y Anfibios",
      "Roedores", "Transporte y Paseo", "Veterinaria"
    ]
  },
  {
    name: "Antigüedades y Colecciones",
    slug: "antiguedades-y-colecciones",
    children: [
      "Antigüedades", "Arte", "Coleccionismo",
      "Estampillas y Sellos", "Militaria", "Monedas y Billetes",
      "Revistas y Comics"
    ]
  },
  {
    name: "Arte, Librería y Mercería",
    slug: "arte-libreria-y-merceria",
    children: [
      "Artículos de Librería", "Artículos de Mercería", "Dibujo y Pintura",
      "Manualidades", "Papelería Comercial", "Scrapbooking"
    ]
  },
  {
    name: "Autos, Motos y Otros",
    slug: "autos-motos-y-otros",
    children: [
      "Autos", "Camiones", "Casas Rodantes y Motorhomes",
      "Colectivos y Micros", "Cuatriciclos y UTVs", "Grúas y Montacargas",
      "Maquinaria Pesada", "Motos", "Náutica", "Otros Vehículos",
      "Picks-Up y Utilitarios", "Trailers"
    ]
  },
  {
    name: "Bebés",
    slug: "bebes",
    children: [
      "Alimentación del Bebé", "Artículos de Bebé para Baño", "Artículos de Maternidad",
      "Chupetes y Mordillos", "Cuarto del Bebé", "Higiene y Cuidado del Bebé",
      "Juegos y Juguetes para Bebés", "Paseo del Bebé", "Ropa para Bebés",
      "Seguridad para Bebés", "Zapatos para Bebés"
    ]
  },
  {
    name: "Belleza y Cuidado Personal",
    slug: "belleza-y-cuidado-personal",
    children: [
      "Aromaterapia y Aceites", "Artículos de Peluquería", "Barbería",
      "Cuidado de la Piel", "Cuidado del Cabello", "Depilación",
      "Dermocosméticos", "Higiene Personal", "Maquillaje",
      "Perfumes y Fragancias", "Protección Solar", "Tratamientos de Belleza"
    ]
  },
  {
    name: "Cámaras y Accesorios",
    slug: "camaras-y-accesorios",
    children: [
      "Accesorios para Cámaras", "Binoculares y Telescopios", "Cámaras",
      "Cámaras de Video", "Drones y Accesorios", "Filmadoras",
      "Flashes y Accesorios", "Lentes y Filtros", "Memoria para Cámaras",
      "Trípodes y Soportes"
    ]
  },
  {
    name: "Celulares y Telefonía",
    slug: "celulares-y-telefonia",
    children: [
      "Accesorios para Celulares", "Celulares y Smartphones", "Fundas y Carcasas",
      "Lentes para Celulares", "Líneas Telefónicas", "Protectores de Pantalla",
      "Radios y Handies", "Repuestos de Celulares", "Smartwatches y Accesorios",
      "Telefonía Fija e Inalámbrica"
    ]
  },
  {
    name: "Computación",
    slug: "computacion",
    children: [
      "Almacenamiento", "Cables y Hubs USB", "Componentes de PC",
      "Conectividad y Redes", "Estabilizadores y UPS", "Impresoras y Accesorios",
      "Laptops y Accesorios", "Monitores y Accesorios", "PC de Escritorio",
      "Periféricos de PC", "Proyectores y Accesorios", "Software",
      "Tablets y Accesorios"
    ]
  },
  {
    name: "Consolas y Videojuegos",
    slug: "consolas-y-videojuegos",
    children: [
      "Accesorios para Consolas", "Consolas", "Flippers y Arcade",
      "Nintendo", "PC Gaming", "PlayStation",
      "Repuestos para Consolas", "Videojuegos", "Xbox"
    ]
  },
  {
    name: "Construcción",
    slug: "construccion",
    children: [
      "Aberturas", "Aislantes e Impermeabilizantes", "Baños",
      "Climatización", "Cocinas", "Electricidad",
      "Escaleras", "Griferías y Accesorios", "Herrajes",
      "Herramientas", "Iluminación", "Maderas",
      "Materiales de Construcción", "Pinturas y Accesorios", "Pisos y Revestimientos",
      "Plomería y Gas", "Sanitarios", "Techos y Chapas"
    ]
  },
  {
    name: "Deportes y Fitness",
    slug: "deportes-y-fitness",
    children: [
      "Artes Marciales y Boxeo", "Básquet", "Bicicletas y Ciclismo",
      "Camping, Caza y Pesca", "Equitación", "Escalada y Montañismo",
      "Fútbol", "Gimnasia y Fitness", "Golf",
      "Natación", "Outdoor", "Patín y Skate",
      "Pilates y Yoga", "Running", "Suplementos y Shakers",
      "Tenis y Padel", "Voley"
    ]
  },
  {
    name: "Electrodomésticos y Aires Ac.",
    slug: "electrodomesticos-y-aires",
    children: [
      "Aires Acondicionados", "Aspiradoras y Limpieza", "Calefacción",
      "Cocinas y Hornos", "Heladeras y Freezers", "Lavarropas y Secadoras",
      "Pequeños Electrodomésticos", "Purificadores y Filtros", "Ventilación"
    ]
  },
  {
    name: "Electrónica, Audio y Video",
    slug: "electronica-audio-y-video",
    children: [
      "Accesorios de Audio y Video", "Audio", "Cables",
      "Componentes Electrónicos", "Domotica", "Home Theater",
      "Media Streaming", "Pilas y Cargadores", "Televisores",
      "Video"
    ]
  },
  {
    name: "Entradas para Eventos",
    slug: "entradas-para-eventos",
    children: [
      "Conciertos y Shows", "Deportes", "Exposiciones y Ferias",
      "Festivales", "Teatro y Espectáculos"
    ]
  },
  {
    name: "Herramientas",
    slug: "herramientas",
    children: [
      "Herramientas de Mano", "Herramientas Eléctricas", "Herramientas Neumáticas",
      "Instrumentos de Medición", "Máquinas de Soldar", "Organizadores y Cajas"
    ]
  },
  {
    name: "Hogar, Muebles y Jardín",
    slug: "hogar-muebles-y-jardin",
    children: [
      "Adornos y Decoración", "Baño", "Cocina",
      "Colchones y Sommiers", "Cortinas y Persianas", "Dormitorio",
      "Jardín y Aire Libre", "Living y Comedor", "Mesas y Sillas",
      "Muebles de Cocina", "Muebles de Oficina", "Organización del Hogar",
      "Piletas y Accesorios", "Ropa de Cama", "Textiles del Hogar"
    ]
  },
  {
    name: "Industrias y Oficinas",
    slug: "industrias-y-oficinas",
    children: [
      "Artículos de Oficina", "Equipamiento Comercial", "Equipamiento Médico",
      "Impresión", "Insumos de Oficina", "Maquinaria Industrial",
      "Mobiliario de Oficina", "Seguridad Industrial"
    ]
  },
  {
    name: "Inmuebles",
    slug: "inmuebles",
    children: [
      "Casas", "Campos y Chacras", "Cocheras",
      "Departamentos", "Emprendimientos", "Fondos de Comercio",
      "Locales Comerciales", "Lotes y Terrenos", "Oficinas",
      "PH", "Quintas y Estancias"
    ]
  },
  {
    name: "Instrumentos Musicales",
    slug: "instrumentos-musicales",
    children: [
      "Baterías y Percusión", "Equipos de DJ", "Guitarras",
      "Instrumentos de Cuerdas", "Instrumentos de Viento", "Micrófonos y Accesorios",
      "Pianos y Teclados", "Pedales y Efectos", "Sonido en Vivo y Estudio"
    ]
  },
  {
    name: "Joyas y Relojes",
    slug: "joyas-y-relojes",
    children: [
      "Accesorios de Joyería", "Alianzas", "Anillos",
      "Aros y Aretes", "Cadenas y Collares", "Dijes y Medallas",
      "Joyas de Oro", "Joyas de Plata", "Pulseras",
      "Relojes de Pulsera"
    ]
  },
  {
    name: "Juegos y Juguetes",
    slug: "juegos-y-juguetes",
    children: [
      "Disfraces y Accesorios", "Figuras de Acción", "Juegos de Mesa y Cartas",
      "Juegos de Salón", "Juguetes", "Juguetes Didácticos",
      "Juguetes para Exterior", "Muñecos y Muñecas", "Nerf y Lanzadores",
      "Peluches", "Playmobil", "LEGO"
    ]
  },
  {
    name: "Libros, Revistas y Comics",
    slug: "libros-revistas-y-comics",
    children: [
      "Comics", "E-Books", "Libros de Texto",
      "Libros Físicos", "Manga", "Revistas"
    ]
  },
  {
    name: "Música, Películas y Series",
    slug: "musica-peliculas-y-series",
    children: [
      "Blu-Ray", "CDs de Música", "DVD",
      "Merchandising", "Streaming y Descargas", "Vinilos"
    ]
  },
  {
    name: "Ropa y Accesorios",
    slug: "ropa-y-accesorios",
    children: [
      "Accesorios de Moda", "Bermudas y Shorts", "Bikinis y Trajes de Baño",
      "Blazers y Sacos", "Calzado", "Camperas y Abrigos",
      "Camisas", "Carteras y Bolsos", "Cinturones",
      "Corbatas y Moños", "Gorras y Sombreros", "Jeans",
      "Lencería y Ropa Interior", "Pantalones", "Polleras y Faldas",
      "Remeras y Camisetas", "Ropa de Trabajo", "Ropa Deportiva",
      "Sweaters y Buzos", "Vestidos"
    ]
  },
  {
    name: "Salud y Equipamiento Médico",
    slug: "salud-y-equipamiento-medico",
    children: [
      "Botiquín y Primeros Auxilios", "Cuidado de la Salud", "Equipamiento Médico",
      "Insumos Médicos", "Movilidad y Rehabilitación", "Nutrición y Suplementos",
      "Óptica", "Ortopedia"
    ]
  },
  {
    name: "Servicios",
    slug: "servicios",
    children: [
      "Asesoramiento", "Clases y Cursos", "Diseño y Programación",
      "Instalaciones", "Reparaciones", "Seguros",
      "Servicios de Limpieza", "Servicios Profesionales", "Transporte y Mudanzas"
    ]
  },
  {
    name: "Souvenirs, Cotillón y Fiestas",
    slug: "souvenirs-cotillon-y-fiestas",
    children: [
      "Artículos de Fiesta", "Cotillón", "Decoración de Eventos",
      "Globos", "Piñatas", "Souvenirs"
    ]
  },
  {
    name: "Otros",
    slug: "otros",
    children: [
      "Otros"
    ]
  }
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminRequest(request)
  if (admin instanceof NextResponse) return admin

  try {
    let created = 0

    for (const cat of MELI_CATEGORIES) {
      // Upsert parent category
      const parent = await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: {
          name: cat.name,
          slug: cat.slug,
        }
      })
      created++

      // Upsert children
      for (const childName of cat.children) {
        const childSlug = `${cat.slug}-${slugify(childName)}`
        await prisma.category.upsert({
          where: { slug: childSlug },
          update: { name: childName, parentId: parent.id },
          create: {
            name: childName,
            slug: childSlug,
            parentId: parent.id,
          }
        })
        created++
      }
    }

    return NextResponse.json({ success: true, categoriesCreated: created })
  } catch (error) {
    console.error("Error seeding categories:", error)
    return NextResponse.json(
      { error: "Failed to seed categories", details: String(error) },
      { status: 500 }
    )
  }
}
