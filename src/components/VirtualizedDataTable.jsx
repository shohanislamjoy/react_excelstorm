import { useState, useEffect, useRef, useCallback } from 'react';
import EditRowModal from './EditRowModal';
import { createNewRow } from '../utils/excelParser';
import '../styles/DataTable.css';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const ITEM_HEIGHT = 50;

/**
 * ============================================================================
 * VirtualizedDataTable Component - Main Data Display & Management Component
 * ============================================================================
 * 
 * PURPOSE:
 * This is the core component that displays parsed Excel data in an interactive,
 * performant table. It handles pagination (virtualization), searching, sorting,
 * row selection, and CRUD operations (Create, Read, Update, Delete).
 *
 * KEY FEATURES:
 * - Pagination with configurable rows per page (10, 25, 50, 100)
 * - Full-text search across all columns
 * - Sortable columns (ascending/descending toggle)
 * - Multi-row selection with select-all checkbox
 * - Add new rows with modal form
 * - Edit existing rows with modal form
 * - Delete rows (with confirmation)
 * - Delete multiple selected rows (bulk delete)
 * - Duplicate selected rows
 * - Displays row count and search result count
 * - Responsive layout with fixed headers
 *
 * PERFORMANCE OPTIMIZATION:
 * - Uses pagination to render only current page data (not all rows)
 * - useCallback hooks to prevent unnecessary re-renders
 * - Virtual scrolling through pagination reduces DOM elements
 *
 * STATE MANAGEMENT:
 * - searchTerm: Current search filter
 * - sortConfig: Current sort column and direction
 * - selectedRows: Set of row IDs that are checked
 * - currentPage: Current page number (1-based)
 * - itemsPerPage: Rows displayed per page
 * - editingRow: Row object currently being edited
 * - isModalOpen: Whether edit/add modal is visible
 * - isNewRow: Whether modal is for adding new or editing existing
 *
 * @component
 */
export const VirtualizedDataTable = ({ headers, data, onDataChange }) => {
  // ========== STATE DECLARATIONS ==========
  
  // Stores the current search filter text (case-insensitive)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stores current sort configuration: { key: columnName, direction: 'asc'|'desc' }
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Set of row IDs that are currently selected/checked by user
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // Current page number (1-based, not 0-based)
  const [currentPage, setCurrentPage] = useState(1);
  
  // Number of rows to display per page (10, 25, 50, or 100)
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // The row object currently being edited in the modal (null if modal closed)
  const [editingRow, setEditingRow] = useState(null);
  
  // Whether the edit modal is currently open
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // True if modal is for adding new row, false if editing existing
  const [isNewRow, setIsNewRow] = useState(false);
  
  // Reference to the table container for scroll-to-top on page change
  const tableContainerRef = useRef(null);

  /**
   * ====================================================================
   * filteredData - Filter data based on search term (memoized)
   * ====================================================================
   * 
   * PURPOSE:
   * Creates a filtered copy of data that matches the current search term.
   * Searches across ALL columns for case-insensitive matches.
   * Memoized with useCallback to prevent unnecessary recalculations.
   * 
   * SEARCH LOGIC:
   * - If no search term: return all data unchanged
   * - Otherwise: return only rows where ANY column matches the search term
   * - Search is case-insensitive
   * - Searches through string representations of all values
   * 
   * EXAMPLE:
   * Data: [{CHALLAN_NO: 'CHK001', A_BANCD: 'BANK123', ...}, ...]
   * Search term: 'chk'
   * Result: [{CHALLAN_NO: 'CHK001', ...}]
   * 
   * DEPENDENCIES:
   * - Recalculates when: data, headers, or searchTerm changes
   * - Returns memoized function to avoid recreating on every render
   */
  const filteredData = useCallback(() => {
    if (!searchTerm) return data;
    
    return data.filter((row) =>
      headers.some((header) =>
        String(row[header] || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, headers, searchTerm]);

  // Execute the filter function to get current filtered data
  const filtered = filteredData();

  /**
   * ====================================================================
   * sortedData - Sort filtered data by selected column (memoized)
   * ====================================================================
   * 
   * PURPOSE:
   * Applies sorting to the filtered data based on current sort configuration.
   * Handles both numeric and string comparisons intelligently.
   * Memoized with useCallback to prevent unnecessary recalculations.
   * 
   * SORT LOGIC:
   * - If no sort key selected: return data unchanged
   * - Numeric fields: sort by numeric value
   * - String fields: sort alphabetically (case-insensitive)
   * - Null/undefined values: pushed to end
   * - Direction: ascending or descending based on sortConfig
   * 
   * EXAMPLE SORT:
   * Column: CHAN_AMT, Direction: asc
   * Before: [500, 100, 1000, 50]
   * After: [50, 100, 500, 1000]
   * 
   * DEPENDENCIES:
   * - Recalculates when: filtered data or sortConfig changes
   */
  const sortedData = useCallback(() => {
    if (!sortConfig.key) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Push null values to end
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Numeric comparison for numeric values
      if (!isNaN(aValue) && !isNaN(bValue)) {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison for non-numeric values
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

  // Execute the sort function to get current sorted data
  const displayData = sortedData();

  // ========== PAGINATION CALCULATIONS ==========
  
  // Total number of pages based on filtered/sorted data
  const totalPages = Math.ceil(displayData.length / itemsPerPage);
  
  // Starting index for current page (0-based)
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Ending index for current page (exclusive)
  const endIndex = startIndex + itemsPerPage;
  
  // The actual rows to display on current page
  const paginatedData = displayData.slice(startIndex, endIndex);

  /**
   * ====================================================================
   * Effect: Reset to first page when search changes
   * ====================================================================
   * When user enters a search term, reset to page 1 to show filtered results
   */
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set()); // Also clear selection on search
  }, [searchTerm]);

  /**
   * ====================================================================
   * Effect: Validate current page doesn't exceed total pages
   * ====================================================================
   * If user deletes rows and current page exceeds total pages,
   * automatically go to the last available page
   */
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // ========== EVENT HANDLERS ==========

  /**
   * ====================================================================
   * handleSort - Toggle sort column and direction
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks on a column header to sort by that column.
   * 
   * BEHAVIOR:
   * - If clicking new column: sort by that column ascending
   * - If clicking same column again: toggle direction (asc ↔ desc)
   * - Resets page to 1 when sorting changes
   * 
   * @param {string} header - The column name to sort by
   */
  const handleSort = (header) => {
    setSortConfig((prev) => ({
      key: header,
      direction: prev.key === header && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  /**
   * ====================================================================
   * handleSelectRow - Toggle selection of a single row
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks checkbox for a row to select/deselect it.
   * Uses a Set data structure for O(1) lookup performance.
   * 
   * BEHAVIOR:
   * - If row already selected: remove from set
   * - If row not selected: add to set
   * 
   * @param {number|string} rowId - The unique ID of the row to toggle
   */
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

  /**
   * ====================================================================
   * handleSelectAll - Select or deselect all rows on current page
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks the "select all" checkbox in table header.
   * Only selects/deselects rows on the current page, not all rows.
   * 
   * BEHAVIOR:
   * - If checkbox checked: select all rows visible on current page
   * - If checkbox unchecked: deselect all rows
   * 
   * @param {boolean} checked - Whether the select-all checkbox is checked
   */
  const handleSelectAll = (checked) => {
    if (checked) {
      const allRowIds = new Set(paginatedData.map(row => row.id));
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows(new Set());
    }
  };

  /**
   * ====================================================================
   * handleAddRow - Open modal to add a new row
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks "➕ Add Row" button. Opens the edit modal
   * with an empty row template.
   * 
   * PROCESS:
   * 1. Create a new empty row with default values using createNewRow()
   * 2. Set it as the row being edited
   * 3. Mark isNewRow=true so modal shows "Add" instead of "Edit"
   * 4. Open the modal
   * 
   * @returns {void}
   */
  const handleAddRow = () => {
    const newRow = createNewRow();
    setEditingRow(newRow);
    setIsNewRow(true);
    setIsModalOpen(true);
  };

  /**
   * ====================================================================
   * handleEditRow - Open modal to edit an existing row
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks the ✏️ edit button on a row.
   * Opens the modal with the selected row's data for editing.
   * 
   * PROCESS:
   * 1. Store the row object being edited
   * 2. Mark isNewRow=false so modal shows "Edit" instead of "Add"
   * 3. Open the modal
   * 
   * @param {Object} row - The row object to edit
   */
  const handleEditRow = (row) => {
    setEditingRow(row);
    setIsNewRow(false);
    setIsModalOpen(true);
  };

  /**
   * ====================================================================
   * handleDeleteSelected - Delete all selected rows with confirmation
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks "🗑️ Delete" button in bulk actions.
   * Deletes all rows that are currently checked.
   * 
   * PROCESS:
   * 1. Validate that at least one row is selected
   * 2. Show confirmation dialog asking user to confirm deletion
   * 3. If confirmed: filter out selected rows from data
   * 4. Call onDataChange() to update parent component
   * 5. Clear selection
   * 
   * @returns {void}
   */
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

  /**
   * ====================================================================
   * handleDuplicateSelected - Create copies of selected rows
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks "📋 Duplicate" button in bulk actions.
   * Creates exact copies of selected rows with new unique IDs.
   * 
   * PROCESS:
   * 1. Validate that at least one row is selected
   * 2. Extract the selected rows from data
   * 3. Create duplicates with new IDs (using Date.now() + random)
   * 4. Prepend duplicates to the TOP of data
   * 5. Call onDataChange() to update parent component
   * 6. Clear selection
   * 
   * @returns {void}
   */
  const handleDuplicateSelected = () => {
    if (selectedRows.size === 0) {
      alert('Please select rows to duplicate');
      return;
    }
    // Extract selected rows
    const selected = data.filter((row) => selectedRows.has(row.id));
    // Create duplicates with new IDs
    const duplicates = selected.map((row) => ({
      ...row,
      id: Date.now() + Math.random(),
    }));
    // Prepend duplicates to the TOP of the table
    onDataChange([...duplicates, ...data]);
    setSelectedRows(new Set());
  };

  /**
   * ====================================================================
   * handleDeleteRow - Delete a single row with confirmation
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks the 🗑️ delete button on a row.
   * Deletes that specific row after asking for confirmation.
   * 
   * PROCESS:
   * 1. Show confirmation dialog
   * 2. If confirmed: filter out the row from data
   * 3. Call onDataChange() to update parent component
   * 
   * @param {number|string} rowId - The unique ID of the row to delete
   */
  const handleDeleteRow = (rowId) => {
    if (window.confirm('Delete this row?')) {
      const updatedData = data.filter(row => row.id !== rowId);
      onDataChange(updatedData);
    }
  };

  /**
   * ====================================================================
   * handleSaveRow - Save new or edited row
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user saves the modal form. Adds new row to the TOP of the table
   * or updates an existing row in place.
   * 
   * @param {Object} row - The row object to save
   */
  const handleSaveRow = (row) => {
    if (isNewRow) {
      // Add new row to the TOP of the table
      onDataChange([row, ...data]);
    } else {
      // Update existing row in place
      const updatedData = data.map((r) => (r.id === row.id ? row : r));
      onDataChange(updatedData);
    }
    setIsModalOpen(false);
    setEditingRow(null);
    setIsNewRow(false);
  };

  /**
   * ====================================================================
   * handleCancelEdit - Close modal without saving
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks "Cancel" button in modal or clicks outside modal.
   * Closes modal without saving any changes.
   * 
   * @returns {void}
   */
  const handleCancelEdit = () => {
    setIsModalOpen(false);
    setEditingRow(null);
  };

  /**
   * ====================================================================
   * handlePageChange - Navigate to a specific page
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks pagination buttons or enters a page number.
   * Ensures page number is within valid range and scrolls to table top.
   * 
   * VALIDATION:
   * - Minimum page: 1
   * - Maximum page: totalPages
   * - Invalid pages are clamped to valid range
   * 
   * @param {number} page - The page number to navigate to (1-based)
   */
  const handlePageChange = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    tableContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * ====================================================================
   * handleItemsPerPageChange - Change rows displayed per page
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user selects different option from "Rows per page" dropdown.
   * Updates pagination and resets to first page.
   * 
   * @param {number} newItemsPerPage - New rows per page (10, 25, 50, or 100)
   */
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to page 1 when changing items per page
  };

  /**
   * ====================================================================
   * isAllSelected - Determines if select-all checkbox should be checked
   * ====================================================================
   * 
   * True only if all rows on current page are selected
   * Updates select-all checkbox visually
   */
  const isAllSelected = paginatedData.length > 0 && 
    paginatedData.every(row => selectedRows.has(row.id));

  return (
    <div className="data-table-container">
      {/* =========================================================
          SEARCH AND TOP CONTROLS SECTION
          ========================================================= 
          Displays the search input and action buttons (Add Row, Duplicate, Delete)
          Also shows the total record count and filtered results count
      */}
      <div className="table-controls">
        <div className="controls-left">
          {/* Search input - filters data across all columns in real-time */}
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {/* Add Row Button - opens modal to create new row */}
          <button onClick={handleAddRow} className="btn btn-add">
            ➕ Add Row
          </button>
        </div>

        {/* Bulk Action Buttons - Show only when rows are selected */}
        {selectedRows.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{selectedRows.size} selected</span>
            {/* Duplicate selected rows button */}
            <button onClick={handleDuplicateSelected} className="btn btn-bulk-duplicate">
              📋 Duplicate
            </button>
            {/* Delete selected rows button */}
            <button onClick={handleDeleteSelected} className="btn btn-bulk-delete">
              🗑️ Delete
            </button>
          </div>
        )}

        {/* Record counter - shows total and filtered counts */}
        {selectedRows.size === 0 && (
          <span className="record-count">
            {displayData.length} records
            {searchTerm && ` (filtered from ${data.length})`}
          </span>
        )}
      </div>

      {/* =========================================================
          MAIN DATA TABLE SECTION
          ========================================================= 
          Displays the actual data in a table format with sortable headers,
          selectable rows, and action buttons (edit/delete per row)
      */}
      <div className="table-wrapper" ref={tableContainerRef}>
        <table className="data-table">
          <thead className="table-header-sticky">
            <tr>
              {/* Select All Checkbox - allows selecting/deselecting all rows on current page */}
              <th className="checkbox-header">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="select-all-checkbox"
                  title="Select all on this page"
                />
              </th>
              
              {/* Dynamic Column Headers - Click to sort, shows sort direction indicator */}
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className={`sortable ${sortConfig.key === header ? `sort-${sortConfig.direction}` : ''}`}
                >
                  {header}
                  {/* Sort Direction Indicator - Shows if column is sorted */}
                  {sortConfig.key === header && (
                    <span className="sort-indicator">
                      {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
              
              {/* Actions Column Header */}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {/* Render paginated rows - Only displays rows for current page */}
            {paginatedData.map((row, index) => (
              <tr key={row.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                {/* Checkbox for row selection */}
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => handleSelectRow(row.id)}
                    className="row-checkbox"
                  />
                </td>
                
                {/* Data Cells - Display each column's value for this row */}
                {headers.map((header) => (
                  <td key={`${row.id}-${header}`} title={row[header]}>
                    {row[header]}
                  </td>
                ))}
                
                {/* Action Buttons - Edit and Delete per row */}
                <td className="actions-cell">
                  <div className="action-buttons-row">
                    {/* Edit Button - Opens modal to edit this row */}
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEditRow(row)}
                      title="Edit row"
                    >
                      ✏️
                    </button>
                    
                    {/* Delete Button - Deletes this row with confirmation */}
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

            {/* No Data Message - Shows when no rows to display after filtering */}
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

      {/* =========================================================
          PAGINATION CONTROLS SECTION
          ========================================================= 
          Allows user to navigate between pages and set rows per page
      */}
      <div className="pagination-wrapper">
        {/* Rows Per Page Selector */}
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

        {/* Pagination Info - Shows which rows are currently displayed */}
        <div className="pagination-info">
          <span className="pagination-text">
            Showing {displayData.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, displayData.length)} of {displayData.length} rows
          </span>
        </div>

        {/* Pagination Buttons - Navigate between pages */}
        <div className="pagination-controls">
          {/* First Page Button */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="First page"
          >
            ⏮️
          </button>
          
          {/* Previous Page Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
            title="Previous page"
          >
            ◀️
          </button>

          {/* Page Number Input - Jump to specific page */}
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

          {/* Next Page Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            title="Next page"
          >
            ▶️
          </button>
          
          {/* Last Page Button */}
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

      {/* =========================================================
          EDIT/ADD ROW MODAL
          ========================================================= 
          Modal dialog for adding new rows or editing existing rows
          Shows form fields for all columns
     
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
