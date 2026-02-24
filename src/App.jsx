/**
 * ============================================================================
 * MAIN APP COMPONENT - ExcelStorm Application
 * ============================================================================
 * 
 * PURPOSE:
 * This is the main root component of ExcelStorm, a React application that allows
 * users to upload Excel/CSV files, parse and transform the data, and perform
 * CRUD operations (Create, Read, Update, Delete) on rows with full export capabilities.
 *
 * KEY FEATURES:
 * - File upload for Excel/CSV files (XLSX, XLS, CSV formats)
 * - Real-time data transformation and parsing
 * - Interactive data table with sorting, searching, and pagination
 * - Add, edit, delete, and duplicate rows functionality
 * - Export data as CSV or Excel files
 * - Live statistics (row count, column count, file size)
 * - Error handling and validation
 *
 * STATE MANAGEMENT:
 * - data: Array of parsed/transformed row objects from Excel
 * - headers: Array of column names to display in the table
 * - loading: Boolean flag indicating if file is being processed
 * - error: String containing error message, null if no error
 * - fileName: String with the uploaded file's name for reference
 * - stats: Object containing stats like rowCount, columnCount, fileSize
 *
 * DATA FLOW:
 * User uploads file → parseExcelFile() transforms data → Display in table
 *                   → User edits rows → Update state → Pass to VirtualizedDataTable
 */

import { useState } from 'react';
import VirtualizedDataTable from './components/VirtualizedDataTable';
import { parseExcelFile, exportDataAsCSV, exportDataAsExcel } from './utils/excelParser';
import './App.css';

function App() {
  // ========== STATE DECLARATIONS ==========
  // Stores all parsed/transformed row data from Excel file
  const [data, setData] = useState([]);
  
  // Stores all column headers/field names from the parsed data
  const [headers, setHeaders] = useState([]);
  
  // True while file is being processed, used to disable upload button and show loading state
  const [loading, setLoading] = useState(false);
  
  // Contains error message if something goes wrong, null if no error
  const [error, setError] = useState(null);
  
  // Stores the name of the uploaded file for display purposes
  const [fileName, setFileName] = useState(null);
  
  // Object storing statistics: rowCount (total rows), columnCount (total columns), fileSize (in KB)
  const [stats, setStats] = useState(null);

  /**
   * =========================================================================
   * handleFileUpload - Processes file upload and parses Excel data
   * =========================================================================
   * 
   * TRIGGERED BY: File input onChange event when user selects a file
   * 
   * PROCESS:
   * 1. Extracts the File object from input event
   * 2. Sets loading=true to disable controls and show processing message
   * 3. Clears any previous errors
   * 4. Calls parseExcelFile() utility to read and transform the Excel file
   * 5. If parsing succeeds:
   *    - Stores headers, data, and filename
   *    - Calculates and stores statistics (row count, column count, file size)
   * 6. If parsing fails:
   *    - Displays error message to user
   *    - Clears all data, headers, and stats
   * 7. Finally: Sets loading=false and clears file input value
   * 
   * ERROR HANDLING:
   * - Shows user-friendly error messages if file is invalid or unreadable
   * - Catches both parsing errors and unexpected exceptions
   * 
   * @param {Event} event - The file input change event containing the File object
   */
  const handleFileUpload = async (event) => {
    // Get the first file from the input (if user selected one)
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Parse the Excel file using the XLSX utility function
      const result = await parseExcelFile(file);

      // Check if parsing encountered an error
      if (result.error) {
        // Display error to user and clear all data
        setError(result.error);
        setData([]);
        setHeaders([]);
        setStats(null);
      } else {
        // Successfully parsed - store headers and data
        setHeaders(result.headers);
        setData(result.data);
        setFileName(file.name);

        console.table(result.data);
        
        // Calculate and store file statistics for display
        setStats({
          rowCount: result.rowCount,
          columnCount: result.headers.length,
          fileSize: (file.size / 1024).toFixed(2), // Convert bytes to KB
        });
      }
    } catch (err) {
      // Catch unexpected errors during processing
      setError(`Failed to process file: ${err.message}`);
      setData([]);
      setHeaders([]);
      setStats(null);
    } finally {
      // Always reset loading state and clear file input value
      setLoading(false);
      event.target.value = ''; // Clear input so same file can be uploaded again
    }
  };

  /**
   * =========================================================================
   * handleDataChange - Updates data state and recalculates statistics
   * =========================================================================
   * 
   * PURPOSE:
   * Receives updated data from child component (VirtualizedDataTable) when
   * user adds, edits, or deletes rows. Updates the parent state and recalculates
   * statistics like row count.
   * 
   * RECEIVES DATA FROM:
   * - VirtualizedDataTable component through onDataChange callback prop
   * - Called when: rows are added, edited, deleted, or duplicated
   * 
   * UPDATES:
   * - setData: stores the new array of rows
   * - setStats: recalculates rowCount to match new data length
   *           preserves other stats like columnCount and fileSize
   * 
   * IMPORTANCE:
   * This is the critical bridge between child and parent components.
   * It ensures the parent always knows the current state of data.
   * 
   * @param {Array} updatedData - The new array of row objects from child component
   */
  const handleDataChange = (updatedData) => {
    // Update main data array in parent state
    setData(updatedData);
    
    // Recalculate statistics - especially rowCount which changes
    // Spread existing stats to preserve other values like columnCount
    setStats(prev => ({
      ...prev,
      rowCount: updatedData.length, // Update row count to match new data
    }));
  };

  /**
   * =========================================================================
   * handleExportCSV - Exports current data as a CSV file
   * =========================================================================
   * 
   * PURPOSE:
   * Allows user to download the currently displayed/edited data as a CSV file
   * which can be opened in Excel, Google Sheets, or other spreadsheet apps.
   * 
   * PROCESS:
   * 1. Validates that data exists (prevents empty exports)
   * 2. Creates export filename:
   *    - If original file name exists: uses it with "_parsed.csv" suffix
   *    - Otherwise: uses default "excelstorm_export.csv"
   * 3. Calls exportDataAsCSV() utility function
   * 
   * EXAMPLE:
   * Original file: "sales.xlsx"
   * Export file: "sales_parsed.csv"
   * 
   * @returns {void}
   */
  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Generate export filename with original filename prefix if available
    const exportFileName = fileName
      ? `${fileName.split('.')[0]}_parsed.csv`
      : 'excelstorm_export.csv';
    
    // Call export utility function with data and filename
    exportDataAsCSV(data, exportFileName);
  };

  /**
   * =========================================================================
   * handleExportExcel - Exports current data as a formatted Excel file
   * =========================================================================
   * 
   * PURPOSE:
   * Allows user to download the currently displayed/edited data as an Excel
   * XLSX file with professional formatting (colored headers, auto-sized columns).
   * 
   * PROCESS:
   * 1. Validates that data exists (prevents empty exports)
   * 2. Creates export filename:
   *    - If original file name exists: uses it with "_parsed.xlsx" suffix
   *    - Otherwise: uses default "excelstorm_export.xlsx"
   * 3. Calls exportDataAsExcel() utility function
   * 
   * FORMATTING APPLIED:
   * - Headers: Bold white text on blue background
   * - Columns: Auto-sized to fit content
   * - Data: Standard Excel formatting
   * 
   * EXAMPLE:
   * Original file: "sales.xlsx"
   * Export file: "sales_parsed.xlsx"
   * 
   * @returns {void}
   */
  const handleExportExcel = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Generate export filename with original filename prefix if available
    const exportFileName = fileName
      ? `${fileName.split('.')[0]}_parsed.xlsx`
      : 'excelstorm_export.xlsx';
    
    // Call export utility function with data and filename
    exportDataAsExcel(data, exportFileName);
  };

  /**
   * =========================================================================
   * handleClear - Clears all data and resets application to initial state
   * =========================================================================
   * 
   * PURPOSE:
   * Resets the entire application when user clicks "Clear" button.
   * This allows the user to start fresh with a new file upload.
   * 
   * CLEARS:
   * - data: Empties the array of rows
   * - headers: Clears column headers
   * - error: Removes any error messages
   * - fileName: Clears the uploaded file name
   * - stats: Removes statistics display
   * 
   * UI EFFECT:
   * - Data table disappears
   * - File upload area appears (empty state)
   * - All statistics removed
   * - All error messages cleared
   * 
   * @returns {void}
   */
  const handleClear = () => {
    setData([]);
    setHeaders([]);
    setError(null);
    setFileName(null);
    setStats(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>⚡ ExcelStorm</h1>
          <p>Efficiently upload, parse, and render large Excel datasets with full row management</p>
        </div>
      </header>

      <main className="app-main">
        <section className="upload-section">
          <div className="upload-area">
            <input
              type="file"
              id="file-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {loading ? '📦 Processing...' : '📁 Click to upload Excel file'}
            </label>
            <p className="upload-hint">Supported formats: XLSX, XLS, CSV</p>
          </div>

          {fileName && (
            <div className="file-info">
              <div className="info-item">
                <span className="info-label">📄 File:</span>
                <span className="info-value">{fileName}</span>
              </div>
              {stats && (
                <>
                  <div className="info-item">
                    <span className="info-label">📊 Rows:</span>
                    <span className="info-value">{stats.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📋 Columns:</span>
                    <span className="info-value">{stats.columnCount}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">💾 Size:</span>
                    <span className="info-value">{stats.fileSize} KB</span>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {error && <div className="error-message">❌ {error}</div>}

        {data.length > 0 && (
          <>
            <section className="data-section">
              <div className="section-header">
                <h2>Parsed Data</h2>
                <div className="action-buttons">
                  <button onClick={handleExportExcel} className="btn btn-export-excel">
                    📊 Export Excel
                  </button>
                  <button onClick={handleExportCSV} className="btn btn-export">
                    💾 Export CSV
                  </button>
                  <button onClick={handleClear} className="btn btn-clear">
                    🗑️ Clear
                  </button>
                </div>
              </div>
              <VirtualizedDataTable headers={headers} data={data} onDataChange={handleDataChange} />
            </section>
          </>
        )}

        {!data.length && !error && (
          <section className="empty-state">
            <div className="empty-content">
              <h3>No data loaded yet</h3>
              <p>Upload an Excel file to get started with powerful data visualization, editing, and management</p>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>ExcelStorm © 2025 | React-based high-performance data processing platform with full row management</p>
      </footer>
    </div>
  );
}

export default App;
