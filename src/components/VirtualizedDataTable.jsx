import { useState, useEffect, useRef, useCallback } from 'react';
import EditRowModal from './EditRowModal';
import '../styles/DataTable.css';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const ITEM_HEIGHT = 50;

/**
 * VirtualizedDataTable component with pagination for better performance
 * Displays only current page data in DOM to reduce memory usage
 */
export const VirtualizedDataTable = ({ headers, data, onDataChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingRow, setEditingRow] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRow, setIsNewRow] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const tableContainerRef = useRef(null);

  // Filter data based on search term
  const filteredData = useCallback(() => {
    if (!searchTerm) return data;
    
    return data.filter((row) =>
      headers.some((header) =>
        String(row[header] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, headers, searchTerm]);

  const filtered = filteredData();

  // Sort data
  const sortedData = useCallback(() => {
    if (!sortConfig.key) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Numeric comparison
      if (!isNaN(aValue) && !isNaN(bValue)) {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison
      const strA = String(aValue).toLowerCase();
      const strB = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return strA.localeCompare(strB);
      } else {
        return strB.localeCompare(strA);
      }
    });

    return sorted;
  }, [filtered, sortConfig]);

  const displayData = sortedData();

  // Pagination calculations
  const totalPages = Math.ceil(displayData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = displayData.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set());
  }, [searchTerm]);

  // Clear page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (header) => {
    setSortConfig((prev) => ({
      key: header,
      direction: prev.key === header && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleSelectRow = (rowId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allRowIds = new Set(paginatedData.map(row => row.id));
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleAddRow = () => {
    const { createNewRow } = require('../utils/excelParser');
    setEditingRow(createNewRow());
    setIsNewRow(true);
    setIsModalOpen(true);
  };

  const handleEditRow = (row) => {
    setEditingRow(row);
    setIsNewRow(false);
    setIsModalOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size === 0) {
      alert('Please select rows to delete');
      return;
    }
    if (window.confirm(`Delete ${selectedRows.size} row(s)?`)) {
      const updatedData = data.filter(row => !selectedRows.has(row.id));
      onDataChange(updatedData);
      setSelectedRows(new Set());
    }
  };

  const handleDuplicateSelected = () => {
    if (selectedRows.size === 0) {
      alert('Please select rows to duplicate');
      return;
    }
    const rowsToDuplicate = data.filter(row => selectedRows.has(row.id));
    const duplicatedRows = rowsToDuplicate.map(row => ({
      ...row,
      id: Date.now() + Math.random(),
    }));
    const updatedData = [...data, ...duplicatedRows];
    onDataChange(updatedData);
    setSelectedRows(new Set());
  };

  const handleDeleteRow = (rowId) => {
    if (window.confirm('Delete this row?')) {
      const updatedData = data.filter(row => row.id !== rowId);
      onDataChange(updatedData);
    }
  };

  const handleSaveRow = (formData) => {
    let updatedData;
    
    if (isNewRow) {
      updatedData = [...data, formData];
    } else {
      updatedData = data.map(row => 
        row.id === formData.id ? formData : row
      );
    }
    
    onDataChange(updatedData);
    setIsModalOpen(false);
    setEditingRow(null);
  };

  const handleCancelEdit = () => {
    setIsModalOpen(false);
    setEditingRow(null);
  };

  const handlePageChange = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    tableContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(row => selectedRows.has(row.id));

  return (
    <div className="data-table-container">
      {/* Search and Top Controls */}
      <div className="table-controls">
        <div className="controls-left">
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={handleAddRow} className="btn btn-add">
            ➕ Add Row
          </button>
        </div>

        {/* Bulk Action Buttons */}
        {selectedRows.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{selectedRows.size} selected</span>
            <button onClick={handleDuplicateSelected} className="btn btn-bulk-duplicate">
              📋 Duplicate
            </button>
            <button onClick={handleDeleteSelected} className="btn btn-bulk-delete">
              🗑️ Delete
            </button>
          </div>
        )}

        {selectedRows.size === 0 && (
          <span className="record-count">
            {displayData.length} records
            {searchTerm && ` (filtered from ${data.length})`}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper" ref={tableContainerRef}>
        <table className="data-table">
          <thead className="table-header-sticky">
            <tr>
              <th className="checkbox-header">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="select-all-checkbox"
                  title="Select all on this page"
                />
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className={`sortable ${sortConfig.key === header ? `sort-${sortConfig.direction}` : ''}`}
                >
                  {header}
                  {sortConfig.key === header && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Render paginated rows */}
            {paginatedData.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    className="row-checkbox"
                  />
                </td>
                {headers.map((header) => (
                  <td key={`${row.id}-${header}`} title={row[header]}>
                    {row[header]}
                  </td>
                ))}
                <td className="actions-cell">
                  <div className="action-buttons-row">
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditRow(row)}
                      title="Edit row"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDeleteRow(row.id)}
                      title="Delete row"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={headers.length + 2} className="no-data">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-wrapper">
        <div className="pagination-section">
          <label htmlFor="items-per-page" className="items-per-page-label">
            Rows per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="items-per-page-select"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="pagination-info">
          <span className="pagination-text">
            Showing {displayData.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, displayData.length)} of {displayData.length} rows
          </span>
        </div>

        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="First page"
          >
            ⏮️
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Previous page"
          >
            ◀️
          </button>

          <div className="page-input-wrapper">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="page-input"
            />
            <span className="pagination-divider">/</span>
            <span className="total-pages">{totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Next page"
          >
            ▶️
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Last page"
          >
            ⏭️
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <EditRowModal
        isOpen={isModalOpen}
        row={editingRow}
        headers={headers}
        onSave={handleSaveRow}
        onCancel={handleCancelEdit}
        isNewRow={isNewRow}
      />
    </div>
  );
};

export default VirtualizedDataTable;
