# Asset Credits - MadsJeez Space Game Dashboard

## Overview

This document tracks all external assets used for the premium sci-fi game dashboard, including sources, licenses, and modifications.

## License Key

- **CC0**: Public Domain - Free for any use, no attribution required
- **CC-BY**: Creative Commons Attribution - Must credit author
- **Proprietary**: Custom license, see notes

---

## Base Model Sources (CC0)

### 1. Kenney Space Kit
- **Author**: Kenney (www.kenney.nl)
- **License**: CC0 (Public Domain)
- **URL**: https://www.kenney.nl/assets/space-kit
- **Download Date**: 2026-05-24
- **Format**: .blend, .fbx, .obj
- **Contents**: Space ships, buildings, props, terrain tiles
- **Usage**: Base meshes for mining structures, refineries
- **Modifications**: Retextured with sci-fi premium materials, re-rendered isometric

### 2. Kenney Space Station Kit
- **Author**: Kenney (www.kenney.nl)
- **License**: CC0 (Public Domain)
- **URL**: https://www.kenney.nl/assets/space-station-kit
- **Download Date**: 2026-05-24
- **Format**: .blend, .fbx, .obj
- **Contents**: Modular space station parts, corridors, hubs
- **Usage**: Base for control center, energy generator modules
- **Modifications**: Combined modules, added emissive lights, re-rendered

### 3. KayKit Space Base Bits
- **Author**: Kay Lousberg (kaylousberg.itch.io)
- **License**: CC0 (Public Domain)
- **URL**: https://kaylousberg.itch.io/space-base-bits
- **Download Date**: 2026-05-24
- **Format**: .blend, .fbx, .obj
- **Contents**: 48+ low poly space base models, gradient atlas texture
- **Usage**: Warehouse structures, platform bases
- **Modifications**: Retextured with PBR materials, added glow elements

### 4. Quaternius Ultimate Space Kit
- **Author**: Quaternius (quaternius.com)
- **License**: CC0 (Public Domain)
- **URL**: https://quaternius.com/packs/ultimatespacekit.html
- **Download Date**: 2026-05-24
- **Format**: .blend, .fbx, .obj, .gltf
- **Contents**: 90+ models: spaceships, characters, mechs, enemies, vegetation, planets
- **Usage**: Planet models, sci-fi props, base decorations
- **Modifications**: Planet shader customized, rendered with transparent background

### 5. Quaternius Ultimate Modular Sci-Fi Pack
- **Author**: Quaternius (quaternius.com)
- **License**: CC0 (Public Domain)
- **URL**: https://quaternius.com/packs/ultimatemodularscifi.html
- **Download Date**: 2026-05-24
- **Format**: .blend, .fbx, .obj, .gltf
- **Contents**: Modular sci-fi walls, floors, doors, props
- **Usage**: Building components for control center, hangar sections
- **Modifications**: Assembled into custom structures, added emissive accents

---

## Texture Sources

### Poly Haven (polyhaven.com)
All textures from Poly Haven are CC0.

| Name | Type | Usage | URL |
|------|------|-------|-----|
| (To be filled during production) | HDRI | Environment lighting | polyhaven.com/hdri |
| (To be filled during production) | PBR Metal | Hull materials | polyhaven.com/textures |

---

## Rendered Outputs

These files are derived works created by combining and modifying CC0 base assets.

### Buildings

| File | Base Asset Source | Modifications | Output Path |
|------|------------------|---------------|-------------|
| metal-mine.webp | Kenney Space Kit + KayKit | Combined drill + storage modules, added cyan glow | public/game/assets/buildings/ |
| plasma-refinery.webp | Kenney Space Kit + Quaternius Sci-Fi | Refinery towers, purple emissive accents | public/game/assets/buildings/ |
| warehouse.webp | KayKit Space Base Bits | Scaled storage modules, orange warning lights | public/game/assets/buildings/ |
| energy-generator.webp | Kenney Space Station Kit | Generator core, cyan plasma effect | public/game/assets/buildings/ |
| control-center.webp | Quaternius Modular Sci-Fi + Kenney Station | Command tower, multiple screen glows | public/game/assets/buildings/ |

### Planets

| File | Base Asset Source | Modifications | Output Path |
|------|------------------|---------------|-------------|
| main-planet.webp | Quaternius Ultimate Space Kit | Custom atmosphere shader, rendered transparent | public/game/assets/planets/ |

### UI Icons

| File | Base Asset Source | Modifications | Output Path |
|------|------------------|---------------|-------------|
| resource-metal.webp | Original design | 3D isometric ingot, metallic material | public/game/assets/ui/ |
| resource-plasma.webp | Original design | Energy sphere, purple glow | public/game/assets/ui/ |
| resource-credits.webp | Original design | Credit chip, gold/orange emissive | public/game/assets/ui/ |

---

## Verification Checklist

- [x] Kenney Space Kit - CC0 verified at kenney.nl
- [x] Kenney Space Station Kit - CC0 verified at kenney.nl
- [x] KayKit Space Base Bits - CC0 verified at itch.io page
- [x] Quaternius Ultimate Space Kit - CC0 verified at quaternius.com
- [x] Quaternius Ultimate Modular Sci-Fi - CC0 verified at quaternius.com
- [ ] All rendered outputs saved with source attribution
- [ ] No proprietary assets used without license
- [ ] No franchise IP present in any model

---

## Notes

All base assets are CC0 (Public Domain). The rendered outputs are derivative works that remain free to use. No attribution is legally required, but we document sources for internal tracking.

For questions about asset usage, refer to the specific license terms on each author's website.

Last updated: 2026-05-24
