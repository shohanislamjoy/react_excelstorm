import { useState, useEffect } from 'react';
import '../styles/Modal.css';

/**
 * ============================================================================
 * EditRowModal Component - Modal for Adding/Editing Data Table Rows
 * ============================================================================
 * 
 * PURPOSE:
 * This is a popup modal dialog that allows users to add new rows or edit
 * existing rows in the data table. It dynamically creates form fields based
 * on the table headers and includes special handling for different field types.
 *
 * KEY FEATURES:
 * - Dynamic form fields generated from table headers
 * - Special input types for different fields:
 *   • NOTES: Textarea with 255 character limit
 *   • CHAN_AMT: Number input with decimal step
 *   • CHALL_DATE: Text input with YYYYMMDD format placeholder
 *   • Other fields: Standard text inputs
 * - Modal overlay that closes when clicking outside
 * - Save and Cancel buttons
 * - Supports both "Add New Row" and "Edit Existing Row" modes
 * - Form validation through HTML5 input attributes
 *
 * USAGE:
 * Parent passes these props:
 * - isOpen: Boolean to show/hide modal
 * - row: Object containing row data (null for new row)
 * - headers: Array of column names
 * - onSave: Callback function when user submits form
 * - onCancel: Callback function when user cancels/closes modal
 * - isNewRow: Boolean indicating if adding new or editing existing
 *
 * @component
 */
export const EditRowModal = ({ isOpen, row, headers, onSave, onCancel, isNewRow = false }) => {
  // Store the current form state as user types
  // Updates whenever row prop changes or modal opens
  const [formData, setFormData] = useState(row || {});

  /**
   * Sync form data whenever the row prop changes
   * This ensures the form shows the correct data when modal opens
   * or when switching between different rows
   */
  useEffect(() => {
    if (row) {
      setFormData(row);
    }
  }, [row, isOpen]);

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  /**
   * ====================================================================
   * handleChange - Updates a single field in the form
   * ====================================================================
   * 
   * PURPOSE:
   * Called whenever user types in any form field. Updates the formData
   * state with the new value for that field.
   * 
   * HOW IT WORKS:
   * 1. Takes the field name and new value
   * 2. Uses spread operator to keep all other fields unchanged
   * 3. Updates only the specific field that changed
   * 
   * EXAMPLE:
   * User types in CHALLAN_NO field → handleChange('CHALLAN_NO', 'CHK123')
   * 
   * @param {string} field - The name of the field being changed (e.g., 'CHALLAN_NO')
   * @param {string|number} value - The new value entered by the user
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * ====================================================================
   * handleSubmit - Submits the form and saves the row
   * ====================================================================
   * 
   * PURPOSE:
   * Called when user clicks "Save Changes" or "Add Row" button.
   * Validates form and passes data back to parent component.
   * 
   * HOW IT WORKS:
   * 1. Prevents default form submission behavior
   * 2. Passes the current formData to parent's onSave callback
   * 3. Parent decides if it's a new row (insert) or edit (update)
   * 4. Modal closes after submit (handled by parent)
   * 
   * VALIDATION:
   * HTML5 form attributes handle basic validation:
   * - maxLength for NOTES field (max 255)
   * - type="number" for CHAN_AMT field
   * 
   * @param {Event} e - The form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {/* Show different title based on whether adding or editing */}
          <h2>{isNewRow ? '➕ Add New Row' : '✏️ Edit Row'}</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Generate form fields dynamically based on headers */}
          <div className="form-grid">
            {headers.map((header) => (
              <div key={header} className="form-group">
                <label htmlFor={header} className="form-label">
                  {header}
                </label>
                
                {/* NOTES field: Textarea with character limit */}
                {header === 'NOTES' ? (
                  <textarea
                    id={header}
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-textarea"
                    maxLength={255}
                    placeholder={`Max 255 characters`}
                  />
                ) 
                /* CHAN_AMT field: Number input with decimal support */
                : header === 'CHAN_AMT' ? (
                  <input
                    id={header}
                    type="number"
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-input"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                ) 
                /* CHALL_DATE field: Date in YYYYMMDD format */
                : header === 'CHALL_DATE' ? (
                  <input
                    id={header}
                    type="text"
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-input"
                    placeholder="YYYYMMDD format"
                  />
                ) 
                /* All other fields: Standard text input */
                : (
                  <input
                    id={header}
                    type="text"
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-input"
                    placeholder={`Enter ${header}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Footer with Cancel and Save buttons */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isNewRow ? 'Add Row' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRowModal;
