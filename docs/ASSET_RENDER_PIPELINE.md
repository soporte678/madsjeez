# Asset Render Pipeline - MadsJeez Space Game Dashboard

## Overview

This document describes the complete pipeline for creating premium sci-fi building assets for the game dashboard using Blender.

**Input**: CC0 3D models (Kenney, KayKit, Quaternius)
**Output**: Optimized WebP images with transparent backgrounds

---

## Prerequisites

- Blender 4.0+ (https://www.blender.org/)
- Node.js + sharp (for WebP conversion)
- CC0 base assets downloaded to `assets/source/external/`

---

## 1. Project Setup

### Directory Structure

```
assets/
├── source/
│   ├── blender/           # .blend scene files
│   │   ├── scene_iso_base.blend
│   │   └── renders/
│   │       ├── metal-mine.png
│   │       ├── plasma-refinery.png
│   │       └── ...
│   └── external/          # Downloaded CC0 assets
│       ├── kenney-space-kit/
│       ├── kenney-space-station/
│       ├── kaykit-space-base/
│       ├── quaternius-space-kit/
│       └── quaternius-scifi-modular/
├── ASSET_CREDITS.md
└── renders-final/         # PNG outputs before WebP conversion

docs/
└── ASSET_RENDER_PIPELINE.md  # This file

public/game/assets/
├── buildings/             # Final WebP buildings
├── planets/               # Final WebP planets
└── ui/                    # Final WebP icons
```

---

## 2. Base Scene Setup (`scene_iso_base.blend`)

### Camera Configuration

1. **Add Camera**: `Shift+A > Camera`
2. **Position**: `X: 10, Y: -10, Z: 8`
3. **Rotation**: `X: 55°, Y: 0°, Z: 45°` (isometric angle)
4. **Camera Type**: `Orthographic`
5. **Orthographic Scale**: `6.0` (adjust to fit model)

### Render Settings

```
Output Properties:
  - Resolution X: 1024
  - Resolution Y: 1024
  - Resolution %: 100%

Render Properties:
  - Render Engine: Cycles
  - Device: GPU (CUDA/Metal/HIP)
  - Samples: 256 (preview) / 1024 (final)
  - Denoise: Enable (OptiX/OpenImageDenoise)

Film:
  - Transparent: CHECKED (critical for game UI)
  - Pixel Filter: Gaussian (1.5px)

Color Management:
  - View Transform: Standard (not Filmic, for UI assets)
  - Look: None
```

### Lighting Setup

```
Key Light (Sun):
  - Position: X: 5, Y: -5, Z: 10
  - Rotation: X: 45°, Y: 0°, Z: 45°
  - Energy: 5.0
  - Color: #E8F4FF (slightly blue-tinted white)
  - Angle: 15° (soft shadows)

Fill Light (Area):
  - Position: X: -5, Y: 3, Z: 5
  - Size: 4m x 4m
  - Energy: 2.0
  - Color: #00D4FF (cyan fill)

Rim Light (Spot):
  - Position: X: -3, Y: -8, Z: 4
  - Target: Model center
  - Energy: 8.0
  - Color: #0099FF (blue rim)
  - Angle: 30°

Ambient HDRI (optional):
  - Use Poly Haven space HDRI at 0.3 strength
```

---

## 3. Materials Library

Save these as node groups in Blender for reuse across all buildings.

### hull_white_matte

```
Principled BSDF:
  - Base Color: #E8EDF2 (slightly warm white)
  - Metallic: 0.0
  - Roughness: 0.7
  - Specular: 0.5
  - Normal: Add subtle noise for panel texture
```

### dark_gunmetal

```
Principled BSDF:
  - Base Color: #1A1F2E (dark blue-grey)
  - Metallic: 0.95
  - Roughness: 0.3
  - Anisotropic: 0.1
  - Clearcoat: 0.2
  - Clearcoat Roughness: 0.1
```

### cyan_emissive

```
Emission Shader:
  - Color: #00F0FF (bright cyan)
  - Strength: 15.0
  
Mix with Principled BSDF (Factor: 0.3):
  - Base Color: #001F2E
  - Metallic: 0.8
  - Roughness: 0.2
```

### purple_emissive

```
Emission Shader:
  - Color: #B829F7 (plasma purple)
  - Strength: 12.0
  
Mix with Principled BSDF (Factor: 0.2):
  - Base Color: #1A0F2E
  - Metallic: 0.7
  - Roughness: 0.3
```

### orange_warning

```
Emission Shader:
  - Color: #FF6B00 (warning orange)
  - Strength: 8.0
  
Mix with Principled BSDF (Factor: 0.1):
  - Base Color: #2A1A00
  - Metallic: 0.5
  - Roughness: 0.4
```

### glass_cyan

```
Principled BSDF:
  - Base Color: #00D4FF
  - Metallic: 0.0
  - Roughness: 0.05
  - Transmission: 1.0
  - IOR: 1.45
  - Alpha: 0.3 (thin glass)

Glossy BSDF (mixed 0.2):
  - Roughness: 0.02
```

---

## 4. Per-Asset Build Instructions

### metal-mine

**Base Models**:
- Kenney Space Kit: `drill_large`, `crate`, `pipe`
- KayKit: `platform_base`

**Assembly**:
1. Import `platform_base` as foundation
2. Place `drill_large` on top, angled 15° forward
3. Add `crate` x3 around base as storage
4. Add `pipe` connecting drill to crates

**Materials**:
- Platform: `dark_gunmetal`
- Drill: `dark_gunmetal` + `orange_warning` at drill tip
- Crates: `hull_white_matte` with `orange_warning` stripes
- Pipes: `dark_gunmetal`

**Details**:
- Add particle dust near drill tip
- Small `cyan_emissive` status lights on crates

---

### plasma-refinery

**Base Models**:
- Kenney Space Kit: `tower`, `tank`, `pipe`
- Quaternius Sci-Fi: `sci-fi_tower_base`

**Assembly**:
1. Import `sci-fi_tower_base` as main structure
2. Stack `tower` x2 on top
3. Place `tank` x2 on sides
4. Connect with `pipe`

**Materials**:
- Main tower: `dark_gunmetal`
- Core reactor: `purple_emissive` (glowing center)
- Tanks: `glass_cyan` with `purple_emissive` inside
- Pipes: `dark_gunmetal` with `cyan_emissive` strips

**Details**:
- Glowing plasma particles in central core
- Steam/smoke emission at top
- Warning stripes in `orange_warning`

---

### warehouse

**Base Models**:
- KayKit: `storage_unit`, `platform_large`
- Kenney Space Kit: `container`, `crane`

**Assembly**:
1. `platform_large` as base
2. `storage_unit` x3 in a row
3. `container` x4 stacked (2x2)
4. Small `crane` on side

**Materials**:
- Storage units: `hull_white_matte`
- Containers: `dark_gunmetal` + colored labels
- Crane: `dark_gunmetal`
- Floor markings: `orange_warning`

**Details**:
- Blue cargo lights (`cyan_emissive`)
- Forklift placeholder (simple block)

---

### energy-generator

**Base Models**:
- Kenney Space Station: `generator`, `solar_panel`, `battery`
- Quaternius: `sci-fi_pillar`

**Assembly**:
1. `generator` as central dome
2. `sci-fi_pillar` x4 around generator
3. `solar_panel` x2 angled on top
4. `battery` x2 at base

**Materials**:
- Generator dome: `glass_cyan` with `cyan_emissive` core
- Pillars: `dark_gunmetal`
- Solar panels: Dark blue with metallic grid
- Batteries: `dark_gunmetal` with `cyan_emissive` charge indicators

**Details**:
- Arc lightning effects between pillars (emission planes)
- Ground energy rings (decal)

---

### control-center

**Base Models**:
- Quaternius Sci-Fi: `command_desk`, `screen_large`, `antenna`
- Kenney Space Station: `dome`, `satellite_dish`

**Assembly**:
1. `command_desk` raised platform
2. `dome` structure overhead
3. `screen_large` x4 on walls
4. `satellite_dish` x2 on roof
5. `antenna` x3 behind structure

**Materials**:
- Structure: `dark_gunmetal` + `hull_white_matte` panels
- Screens: `cyan_emissive` with shader glow
- Antennas: `dark_gunmetal`
- Dome glass: `glass_cyan`

**Details**:
- Holographic display in center (`cyan_emissive` planes)
- Blinking status LEDs
- Red alert button (`orange_warning`)

---

### main-planet

**Base Model**:
- Quaternius Space Kit: `planet_01`

**Setup**:
1. Import planet sphere
2. Scale to fill frame
3. Position camera closer for detail

**Materials**:
- Ocean: Dark blue with subtle waves
- Land: `hull_white_matte` + green tint
- Atmosphere: `glass_cyan` shell
- Clouds: `hull_white_matte` alpha planes

**Details**:
- Ring system (torus with `dark_gunmetal`)
- Moon: Small sphere in background
- Stars: Particle system or HDRI

---

### UI Icons (resource-metal, resource-plasma, resource-credits)

**Style**: Simplified 3D isometric, 256x256px

**resource-metal**:
- Simple metallic ingot/block
- `dark_gunmetal` material
- 3 stacked with slight offset
- Tiny `cyan_emissive` highlight

**resource-plasma**:
- Floating energy sphere
- `purple_emissive` core
- `glass_cyan` outer shell
- Particle glow around it

**resource-credits**:
- Credit chip/card shape
- Gold metallic material
- `orange_warning` holographic number
- Edge glow in cyan

---

## 5. Render Workflow

### For Each Building:

1. **Open** `scene_iso_base.blend`
2. **Import** base models (File > Append from external .blend files)
3. **Assemble** according to per-asset instructions above
4. **Apply** materials from node groups
5. **Adjust** camera orthographic scale to fit (typically 4.0 - 8.0)
6. **Test render** (F12) with 128 samples
7. **Final render** with 1024 samples + denoise
8. **Save PNG** to `assets/source/blender/renders/`

### Output Naming:

```
assets/source/blender/renders/
  ├── metal-mine_1024.png
  ├── plasma-refinery_1024.png
  ├── warehouse_1024.png
  ├── energy-generator_1024.png
  ├── control-center_1024.png
  ├── main-planet_1024.png
  ├── resource-metal_256.png
  ├── resource-plasma_256.png
  └── resource-credits_256.png
```

---

## 6. PNG to WebP Conversion

### Using sharp (Node.js)

Install sharp if not already:
```bash
cd c:\Users\Mi Pc\.windsurf\madsjeez\madsjeez
npm install sharp
```

Create conversion script (`scripts/convert-assets.js`):

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'assets', 'source', 'blender', 'renders');
const outputDir = path.join(__dirname, '..', 'public', 'game', 'assets');

const conversions = [
  { file: 'metal-mine_1024.png', folder: 'buildings', name: 'metal-mine', quality: 85 },
  { file: 'plasma-refinery_1024.png', folder: 'buildings', name: 'plasma-refinery', quality: 85 },
  { file: 'warehouse_1024.png', folder: 'buildings', name: 'warehouse', quality: 85 },
  { file: 'energy-generator_1024.png', folder: 'buildings', name: 'energy-generator', quality: 85 },
  { file: 'control-center_1024.png', folder: 'buildings', name: 'control-center', quality: 85 },
  { file: 'main-planet_1024.png', folder: 'planets', name: 'main-planet', quality: 90 },
  { file: 'resource-metal_256.png', folder: 'ui', name: 'resource-metal', quality: 85 },
  { file: 'resource-plasma_256.png', folder: 'ui', name: 'resource-plasma', quality: 85 },
  { file: 'resource-credits_256.png', folder: 'ui', name: 'resource-credits', quality: 85 },
];

async function convert() {
  for (const conv of conversions) {
    const inputPath = path.join(sourceDir, conv.file);
    const outputFolder = path.join(outputDir, conv.folder);
    const outputPath = path.join(outputFolder, `${conv.name}.webp`);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping (not found): ${conv.file}`);
      continue;
    }

    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    await sharp(inputPath)
      .webp({ 
        quality: conv.quality, 
        lossless: false,
        effort: 6 
      })
      .toFile(outputPath);

    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    console.log(`✅ ${conv.name}.webp (${savings}% smaller)`);
  }
}

convert().catch(console.error);
```

Run:
```bash
node scripts/convert-assets.js
```

---

## 7. Quality Checklist

Before marking an asset as complete:

- [ ] Transparent background (alpha channel present)
- [ ] No rendering artifacts (fireflies, noise)
- [ ] Centered in frame with consistent padding
- [ ] Consistent lighting across all buildings
- [ ] Cyan glow elements visible
- [ ] Metallic surfaces have realistic reflections
- [ ] WebP file size under 200KB for buildings, 50KB for UI
- [ ] Image displays correctly in React component

---

## 8. Style Reference

Target look: AAA space strategy game (Stellaris, Endless Space, Dyson Sphere Program)

Key visual traits:
- Clean, readable silhouettes at 64x64px
- Cyan (#00D4FF) as primary accent color
- Purple (#B829F7) for plasma/energy
- Orange (#FF6B00) for warnings
- Dark metallic bases (#1A1F2E)
- White panel accents (#E8EDF2)
- Soft ambient occlusion shadows
- Subtle bloom on emissive parts

---

## 9. Troubleshooting

### Too dark
- Increase key light energy
- Add ambient light or increase HDRI strength
- Check "Transparent" is enabled (otherwise world background darkens everything)

### Glow too weak
- Increase emission shader strength (try 20-50)
- Enable Bloom in Compositing (if post-processing)
- Use `cyan_emissive` material, not just colored diffuse

### Shadows too hard
- Increase sun light angle (15-30°)
- Add area lights for soft fill
- Enable ambient occlusion

### File too large
- Reduce render resolution (512x512 for smaller buildings)
- Lower WebP quality to 75-80
- Check no unnecessary alpha complexity

---

## 10. Asset Inventory

| Asset | Status | PNG Render | WebP Conv | In Game |
|-------|--------|------------|-----------|---------|
| metal-mine | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| plasma-refinery | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| warehouse | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| energy-generator | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| control-center | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| main-planet | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| resource-metal | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| resource-plasma | ⬜ Pending | ⬜ | ⬜ | ⬜ |
| resource-credits | ⬜ Pending | ⬜ | ⬜ | ⬜ |

---

Last updated: 2026-05-24
