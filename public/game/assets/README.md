# Game Assets

Place optimized WebP images in the corresponding folders. The dashboard component (`PlanetDashboardPremium.tsx`) will attempt to load these images and fall back to inline SVG icons if they are missing.

## Folder Structure

### `/buildings/`
Expected WebP files for each building type:

- `metal-mine.webp`
- `plasma-refinery.webp`
- `warehouse.webp`
- `energy-generator.webp`
- `control-center.webp`
- `shipyard.webp`
- `research-lab.webp`
- `hangar.webp`
- `defense-turret.webp`
- `missile-silo.webp`
- `radar-tower.webp`
- `aerial-platform.webp`

### `/planets/`
Expected WebP files:

- `main-planet.webp`

### `/ui/`
Expected WebP files for resource and UI icons:

- `resource-metal.webp`
- `resource-plasma.webp`
- `resource-credits.webp`

## Conversion Pipeline

When exporting new assets, convert them to WebP before placing them here. You can use `sharp` or a bulk conversion script. Example:

```bash
npx sharp input.png -o output.webp
```

All images should be square or have transparent backgrounds where appropriate for best visual results in the sci-fi dashboard.
