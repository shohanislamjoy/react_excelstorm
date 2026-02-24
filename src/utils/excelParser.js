import * as XLSX from 'xlsx';

/**
 * ============================================================================
 * parseExcelFile - Main Excel parsing and data transformation function
 * ============================================================================
 * 
 * PURPOSE:
 * Reads an Excel/CSV file uploaded by the user and transforms it into a 
 * standardized format that the data table can consume.
 *
 * HOW IT WORKS:
 * 1. Uses FileReader API to read the file as a binary array buffer
 * 2. Passes the buffer to XLSX library for parsing
 * 3. Reads the first sheet from the workbook
 * 4. Converts sheet data to JSON format
 * 5. Maps each row to a standardized object with SAP-compliant fields
 * 6. Returns headers and transformed data for display
 *
 * EXPECTED INPUT COLUMNS (from Excel):
 * - Date: Transaction date (will use this column for CHALL_DATE)
 * - Challan Number: Reference number (max 11 chars)
 * - Bank Code: Bank identifier
 * - Branch Code: Branch identifier
 * - Account Code: Account/GL account code
 * - Amount: Transaction amount
 * - Notes: Additional remarks (max 255 chars)
 *
 * OUTPUT FORMAT:
 * Returns Promise with object containing:
 * {
 *   headers: Array of field names to display in table
 *   data: Array of transformed row objects with IDs
 *   error: Error message if parsing failed, null if successful
 *   rowCount: Total number of rows parsed
 * }
 *
 * @param {File} file - Excel file to parse (XLSX, XLS, or CSV format)
 * @returns {Promise<{headers: Array, data: Array, error: string | null, rowCount: number}>}
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
            // Use "Date" column from Excel, fallback to current date if not available
            const sapModelDate = item['Date'] || new Date();

            return {
              id: Date.now() + index, // Unique ID for row management
              CHALLAN_NO: (item['Challan Number'] || '').toString().substring(0, 11),
              A_BANCD: item['Bank Code'] || '',
              A_BANKL: item['Branch Code'] || '',
              CHALL_DATE: item['Date'],
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
 * ============================================================================
 * exportDataAsCSV - Downloads parsed data as a CSV file
 * ============================================================================
 *
 * PURPOSE:
 * Allows users to export their parsed and modified data as a CSV file for use
 * in Excel, Google Sheets, or other applications.
 *
 * HOW IT WORKS:
 * 1. Validates that data exists before proceeding
 * 2. Extracts all column headers (excluding internal fields starting with _)
 * 3. Converts each row to CSV format (comma-separated values)
 * 4. Properly escapes values containing commas or quotes:
 *    - Wraps them in double quotes
 *    - Escapes internal quotes by doubling them
 * 5. Creates a Blob (binary data) from the CSV content
 * 6. Generates a download link and triggers file download
 * 7. Cleans up the temporary download URL
 *
 * CSV FORMATTING RULES:
 * - Values with commas: wrapped in quotes → "value, with comma"
 * - Values with quotes: quotes doubled → "say ""hello"""
 * - File defaults to: excelstorm_export.csv (unless filename provided)
 *
 * EXAMPLE OUTPUT:
 * CHALLAN_NO,A_BANCD,A_BANKL,CHALL_DATE,ACCOUNT_CODE,CHAN_AMT,NOTES
 * 123456,BNK123,BRA456,20260224,ACC001,5000,Standard challan
 *
 * @param {Array} data - Array of row objects to export
 * @param {string} filename - Output filename (default: 'excelstorm_export.csv')
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
 * ============================================================================
 * exportDataAsExcel - Downloads parsed data as a formatted Excel file
 * ============================================================================
 *
 * PURPOSE:
 * Exports parsed data as an Excel XLSX file with professional formatting,
 * including bold headers, colored backgrounds, and auto-sized columns.
 *
 * HOW IT WORKS:
 * 1. Validates that data exists before proceeding
 * 2. Removes internal fields (starting with _ or named 'id') from export
 * 3. Creates a new workbook and worksheet using XLSX library
 * 4. Converts data array to an Excel sheet
 * 5. Auto-calculates and sets column widths based on content:
 *    - Minimum width = column header length + 2
 *    - Adjusted for longest value in that column + 2
 * 6. Formats the header row with:
 *    - Bold white text (FFFFFF)
 *    - Blue background (3b82f6)
 *    - Centered alignment (horizontal & vertical)
 * 7. Saves the workbook to user's downloads folder
 * 8. Default filename: excelstorm_export.xlsx (can be customized)
 *
 * FORMATTING APPLIED:
 * Header Row: White (bold) on Blue background with centered text
 * Column Widths: Auto-sized to fit content
 * Data Rows: Standard Excel formatting
 *
 * @param {Array} data - Array of row objects to export
 * @param {string} filename - Output filename (default: 'excelstorm_export.xlsx')
 */
export const exportDataAsExcel = (data, filename = 'excelstorm_export.xlsx') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Prepare data for Excel, excluding internal fields and reformatting dates
  const exportData = data.map(row => {
    const newRow = {};
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_') && key !== 'id') {
        let value = row[key];
        // Check if the value is a date in dd/mm/yyyy format
        if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          const [day, month, year] = value.split('/');
          value = `${year}-${month}-${day}`; // Convert to YYYY-MM-DD format
        }
        newRow[key] = value;
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
 * ============================================================================
 * createNewRow - Generates a blank row with default SAP field structure
 * ============================================================================
 *
 * PURPOSE:
 * Creates a new empty row object with all required SAP fields initialized
 * with default values. Used when user clicks "Add Row" button to insert
 * a new record into the data table.
 *
 * HOW IT WORKS:
 * 1. Generates a unique ID based on current timestamp
 * 2. Initializes all SAP-compliant fields with empty/default values:
 *    - CHALLAN_NO: Challan/reference number (empty)
 *    - A_BANCD: Bank code (empty)
 *    - A_BANKL: Branch code (empty)
 *    - CHALL_DATE: Settlement date (today's date in YYYYMMDD format)
 *    - ACCOUNT_CODE: GL/Account code (empty)
 *    - CHAN_AMT: Amount (defaults to '0')
 *    - NOTES: Additional notes (empty)
 *
 * DEFAULT VALUES:
 * - All text fields start empty except CHALL_DATE and CHAN_AMT
 * - CHALL_DATE is set to today's date in YYYYMMDD format
 * - CHAN_AMT defaults to '0' (string, not number)
 *
 * RETURN EXAMPLE:
 * {
 *   id: 1708800000000,
 *   CHALLAN_NO: '',
 *   A_BANCD: '',
 *   A_BANKL: '',
 *   CHALL_DATE: '20260224',
 *   ACCOUNT_CODE: '',
 *   CHAN_AMT: '0',
 *   NOTES: '',
 * }
 *
 * @returns {Object} New row object with all SAP fields and empty values
 */
export const createNewRow = () => {
  return {
    id: Date.now(),
    CHALLAN_NO: '',
    A_BANCD: '',
    A_BANKL: '',
    CHALL_DATE: new Date().toLocaleDateString('en-GB'),
    ACCOUNT_CODE: '',
    CHAN_AMT: '0',
    NOTES: '',
  };
};