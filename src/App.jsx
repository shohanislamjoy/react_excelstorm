import { useState } from 'react';
import VirtualizedDataTable from './components/VirtualizedDataTable';
import { parseExcelFile, exportDataAsCSV, exportDataAsExcel } from './utils/excelParser';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [stats, setStats] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const result = await parseExcelFile(file);

      if (result.error) {
        setError(result.error);
        setData([]);
        setHeaders([]);
        setStats(null);
      } else {
        setHeaders(result.headers);
        setData(result.data);
        setFileName(file.name);
        setStats({
          rowCount: result.rowCount,
          columnCount: result.headers.length,
          fileSize: (file.size / 1024).toFixed(2),
        });
      }
    } catch (err) {
      setError(`Failed to process file: ${err.message}`);
      setData([]);
      setHeaders([]);
      setStats(null);
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const handleDataChange = (updatedData) => {
    setData(updatedData);
    setStats(prev => ({
      ...prev,
      rowCount: updatedData.length,
    }));
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    const exportFileName = fileName
      ? `${fileName.split('.')[0]}_parsed.csv`
      : 'excelstorm_export.csv';
    exportDataAsCSV(data, exportFileName);
  };

  const handleExportExcel = () => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }
    const exportFileName = fileName
      ? `${fileName.split('.')[0]}_parsed.xlsx`
      : 'excelstorm_export.xlsx';
    exportDataAsExcel(data, exportFileName);
  };

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
