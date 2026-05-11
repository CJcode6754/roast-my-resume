import { useState } from 'react';

export function DropZone({ onFileSelect, disabled, error }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcess = (file) => {
    if (!file) return;
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      alert('Only PDF and TXT files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must not exceed 5MB.');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    validateAndProcess(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    validateAndProcess(file);
  };

  return (
    <div className="mb-6">
      <label className="block text-xs font-body text-ink-muted mb-2 tracking-wider">SECTION I – SUBJECT RESUME SUBMISSION</label>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed border-rule p-8 text-center cursor-pointer transition ${
          dragActive ? 'bg-paper-bg/30 border-ink' : 'hover:border-ink'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleChange}
          disabled={disabled}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          <div className="text-lg font-display text-ink mb-1">Attach Resume Document</div>
          <div className="text-xs font-body text-ink-muted">Accepted Formats: PDF, TXT | Maximum: 5MB</div>
        </label>
      </div>
      {error && <div className="mt-2 text-sm font-body text-ink-red">{error}</div>}
    </div>
  );
}