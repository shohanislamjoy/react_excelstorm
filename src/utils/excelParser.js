import * as XLSX from 'xlsx';

/**
 * Parse Excel file and transform data according to specification
 * @param {File} file - Excel file to parse
 * @returns {Promise<{headers: Array, data: Array, error: string | null}>}
 */
export const parseExcelFile = async (file) => {
  try {
    const reader = new FileReader();

    return new Promise((resolve) => {
      reader.onload = (event) => {
        try {
          const workbook = XLSX.read(event.target.result, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];

          // Get all data including headers
          const rawData = XLSX.utils.sheet_to_json(worksheet);

          // Transform data according to specification
          const transformedData = rawData.map((item, index) => {
            const sapModelDate = formatDateForSAP(item['Challan Date'] || new Date());
            
            return {
              id: Date.now() + index, // Unique ID for row management
              CHALLAN_NO: (item['Challan Number'] || '').toString().substring(0, 11),
              A_BANCD: item['Bank Code'] || '',
              A_BANKL: item['Branch Code'] || '',
              CHALL_DATE: sapModelDate,
              ACCOUNT_CODE: item['Account Code'] || '',
              CHAN_AMT: item['Amount'] || '0',
              NOTES: (item['Notes'] || '').toString().substring(0, 255),
              // Keep original data for reference
              _originalData: item,
            };
          });

          const headers = Object.keys(transformedData[0] || {}).filter(h => !h.startsWith('_') && h !== 'id');

          resolve({
            headers,
            data: transformedData,
            error: null,
            rowCount: transformedData.length,
          });
        } catch (error) {
          resolve({
            headers: [],
            data: [],
            error: `Error parsing Excel file: ${error.message}`,
          });
        }
      };

      reader.onerror = () => {
        resolve({
          headers: [],
          data: [],
          error: 'Error reading file',
        });
      };

      reader.readAsArrayBuffer(file);
    });
  } catch (error) {
    return {
      headers: [],
      data: [],
      error: `Error processing file: ${error.message}`,
    };
  }
};

/**
 * Format date for SAP model (YYYYMMDD format)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
const formatDateForSAP = (date) => {
  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  } catch {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  }
};

/**
 * Export parsed data as CSV
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for export
 */
export const exportDataAsCSV = (data, filename = 'excelstorm_export.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]).filter(h => !h.startsWith('_') && h !== 'id');
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Handle commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Export parsed data as Excel file
 * @param {Array} data - Data to export
 * @param {string} filename - Filename for export
 */
export const exportDataAsExcel = (data, filename = 'excelstorm_export.xlsx') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Prepare data for Excel, excluding internal fields
  const exportData = data.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_') && key !== 'id') {
        newRow[key] = row[key];
      }
    });
    return newRow;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  const columns = Object.keys(exportData[0] || {});
  worksheet['!cols'] = columns.map(col => ({
    wch: Math.max(
      col.length + 2,
      Math.max(...exportData.map(row => String(row[col] || '').length)) + 2
    ),
  }));

  // Add borders and formatting to header
  const headerRowCells = XLSX.utils.encode_col(0) + '1';
  for (let i = 0; i < columns.length; i++) {
    const cellAddress = XLSX.utils.encode_col(i) + '1';
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3b82f6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Parsed Data');
  XLSX.writeFile(workbook, filename);
};

/**
 * Create a new empty row with default values
 * @returns {Object} New row object
 */
export const createNewRow = () => {
  return {
    id: Date.now(),
    CHALLAN_NO: '',
    A_BANCD: '',
    A_BANKL: '',
    CHALL_DATE: formatDateForSAP(new Date()),
    ACCOUNT_CODE: '',
    CHAN_AMT: '0',
    NOTES: '',
  };
};
