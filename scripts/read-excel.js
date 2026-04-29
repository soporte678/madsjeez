const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('C:\\Users\\Mi Pc\\Desktop\\BBBB', 'PUBLICACIONES MAQJEEZ I.xlsx');
const wb = XLSX.readFile(filePath);

console.log('Sheet names:', wb.SheetNames);

// Read the Publicaciones sheet
const sheet = wb.Sheets['Publicaciones'];
const data = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });

console.log('Total rows (raw):', data.length);
console.log('\nFirst 10 rows:');
data.slice(0, 10).forEach((row, i) => {
  const vals = row.filter(v => v !== '' && v !== null && v !== undefined);
  if (vals.length > 0) console.log(`Row ${i}: ${JSON.stringify(row)}`);
});

console.log('\n--- Looking for header row ---');
for (let i = 0; i < Math.min(data.length, 20); i++) {
  const row = data[i];
  const str = row.join(' | ').trim();
  if (str.length > 5) console.log(`Row ${i}: ${str.substring(0, 200)}`);
}

console.log('\n--- All data rows after headers ---');
// Find header row (contains 'Título' or 'titulo' or 'ID')
let headerIdx = -1;
for (let i = 0; i < data.length; i++) {
  const rowStr = data[i].join(' ').toLowerCase();
  if (rowStr.includes('título') || rowStr.includes('titulo') || rowStr.includes('id de publicación') || rowStr.includes('precio')) {
    headerIdx = i;
    break;
  }
}

if (headerIdx >= 0) {
  const headers = data[headerIdx];
  console.log(`Header at row ${headerIdx}:`);
  headers.forEach((h, i) => {
    if (h !== '' && h !== null && h !== undefined) console.log(`  Col ${i}: "${h}"`);
  });
  const dataRows = data.slice(headerIdx + 1).filter(r => r.some(v => v !== '' && v !== null && v !== undefined));
  console.log(`\nTotal product rows: ${dataRows.length}`);
  
  // Show just first row mapped to headers
  if (dataRows.length > 0) {
    console.log('\nFirst row mapped:');
    headers.forEach((h, i) => {
      const v = dataRows[0][i];
      if (v !== '' && v !== null && v !== undefined && h !== '') console.log(`  ${h}: ${String(v).substring(0, 80)}`);
    });
  }
} else {
  console.log('No header row found');
}
