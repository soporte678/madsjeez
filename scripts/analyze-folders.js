const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/Mi Pc/Desktop/MERCADOLIBRE CUENTA NUEVA';

let count = 0;
const folders = [];

fs.readdirSync(dir, { withFileTypes: true }).forEach(d => {
  if (!d.isDirectory()) return;
  const fullPath = path.join(dir, d.name);
  const files = fs.readdirSync(fullPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  if (files.length > 0) {
    count++;
    folders.push({ name: d.name, images: files.length });
  }
});

console.log('Total carpetas con imagenes:', count);
