# PowerShell script to create placeholder admin pages
$pages = @(
    @{name="compradores"; icon="Users"; title="Compradores"},
    @{name="fraude"; icon="ShieldAlert"; title="Control de Estafas"},
    @{name="kyc"; icon="UserCheck"; title="Nuevas Cuentas (KYC)"},
    @{name="siniestros"; icon="PackageX"; title="Siniestros"},
    @{name="devoluciones"; icon="RefreshCcw"; title="Devoluciones"},
    @{name="publicaciones"; icon="Package"; title="Publicaciones Activas"},
    @{name="imagenes"; icon="ImageOff"; title="Cola Imágenes Incorrectas"},
    @{name="consultas"; icon="Inbox"; title="Consultas Generales"},
    @{name="campanas"; icon="Zap"; title="Campañas Flash"},
    @{name="publicidad"; icon="Megaphone"; title="Publicidad (Ads)"},
    @{name="suscripciones"; icon="CreditCard"; title="Suscripciones"},
    @{name="logs"; icon="Activity"; title="Errores (Logs)"},
    @{name="config"; icon="Settings"; title="Configuración"},
    @{name="ordenes"; icon="ShoppingCart"; title="Órdenes"},
    @{name="search"; icon="Search"; title="Búsqueda"}
)

$basePath = "src/app/admin"

foreach ($page in $pages) {
    $dir = "$basePath/$($page.name)"
    $file = "$dir/page.tsx"
    
    # Create directory
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    
    # Create file content
    $content = @"
"use client"

import { $($page.icon), Construction } from "lucide-react"

export default function $($page.name -replace "^(", "(" -replace "es$", "")Page() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="bg-blue-50 p-8 rounded-xl border border-blue-200 text-center">
        <$($page.icon) className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">$($page.title)</h2>
        <p className="text-gray-600 mb-4">Módulo en desarrollo</p>
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-100 px-4 py-2 rounded-full">
          <Construction className="w-4 h-4" />
          Próximamente
        </div>
      </div>
    </div>
  )
}
"@
    
    Set-Content -Path $file -Value $content
    Write-Host "Created: $file"
}

Write-Host "All admin pages created successfully!"
