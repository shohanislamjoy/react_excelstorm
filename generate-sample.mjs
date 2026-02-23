import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate sample data matching the Excel format
const sampleData = [];

// Generate 100 sample records
for (let i = 1; i <= 100; i++) {
  sampleData.push({
    'Challan Number': String(10000001000 + i).substring(0, 11),
    'Bank Code': `BANK${String(i % 5).padStart(2, '0')}`,
    'Branch Code': `BR${String(i % 10).padStart(2, '0')}`,
    'Challan Date': new Date(2025, Math.floor(i / 30), (i % 28) + 1),
    'Account Code': `ACC${String(i).padStart(6, '0')}`,
    'Amount': Math.random() * 100000,
    'Notes': `Sample transaction ${i} - This is a test note for record ${i}`,
  });
}

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Set column widths for better visibility
worksheet['!cols'] = [
  { wch: 15 },
  { wch: 12 },
  { wch: 12 },
  { wch: 15 },
  { wch: 12 },
  { wch: 12 },
  { wch: 35 },
];

XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

// Save the file
const filePath = join(__dirname, 'public', 'sample-data.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`✅ Sample Excel file created at: ${filePath}`);
