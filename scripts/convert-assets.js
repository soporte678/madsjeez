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
  console.log('🎮 MadsJeez Asset Converter\n');

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
        effort: 6,
      })
      .toFile(outputPath);

    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);

    console.log(`✅ ${conv.name}.webp (${savings}% smaller)`);
  }

  console.log('\n✨ Done! Assets saved to public/game/assets/');
}

convert().catch(console.error);
