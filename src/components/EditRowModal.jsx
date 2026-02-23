import { useState, useEffect } from 'react';
import '../styles/Modal.css';

/**
 * Modal component for editing/adding rows
 */
export const EditRowModal = ({ isOpen, row, headers, onSave, onCancel, isNewRow = false }) => {
  const [formData, setFormData] = useState(row || {});

  useEffect(() => {
    if (row) {
      setFormData(row);
    }
  }, [row, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNewRow ? '➕ Add New Row' : '✏️ Edit Row'}</h2>
          <button className="modal-close" onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {headers.map((header) => (
              <div key={header} className="form-group">
                <label htmlFor={header} className="form-label">
                  {header}
                </label>
                {header === 'NOTES' ? (
                  <textarea
                    id={header}
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-textarea"
                    maxLength={255}
                    placeholder={`Max 255 characters`}
                  />
                ) : header === 'CHAN_AMT' ? (
                  <input
                    id={header}
                    type="number"
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-input"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                ) : header === 'CHALL_DATE' ? (
                  <input
                    id={header}
                    type="text"
                    value={formData[header] || ''}
                    onChange={(e) => handleChange(header, e.target.value)}
                    className="form-input"
                    placeholder="YYYYMMDD format"
                  />
                ) : (
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
