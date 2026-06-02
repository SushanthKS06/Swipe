import React, { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
  value: string | number | null | undefined;
  isMissing?: boolean;
  fieldName: string;
  onSave: (value: any) => void;
  type?: 'text' | 'number' | 'date';
  currencyCode?: string;
}

export function EditableCell({
  value,
  isMissing,
  fieldName,
  onSave,
  type = 'text',
  currencyCode = 'USD',
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize draft when editing is triggered or value changes
  useEffect(() => {
    setDraft(value !== null && value !== undefined ? String(value) : '');
  }, [value, editing]);

  // Focus input when entry starts
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleSave = () => {
    let finalValue: string | number | null = draft.trim();
    if (finalValue === '') {
      finalValue = null;
    } else if (type === 'number') {
      const parsed = Number(finalValue);
      finalValue = isNaN(parsed) ? null : parsed;
    }
    
    onSave(finalValue);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <td id={`editable-cell-edit-${fieldName}`} className="px-3 py-1.5 align-middle border-b border-blue-400">
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </td>
    );
  }

  if (isMissing) {
    return (
      <td
        id={`editable-cell-missing-${fieldName}`}
        onClick={() => setEditing(true)}
        className="px-4 py-2.5 align-middle border-b border-slate-100 cursor-pointer bg-amber-50/50 hover:bg-amber-50 transition-colors group"
      >
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-700 text-xs font-medium font-sans animate-pulse">
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
          Missing {fieldName}
        </span>
      </td>
    );
  }

  // Display value nicely
  let displayValue = value !== null && value !== undefined ? String(value) : '-';
  if (type === 'number' && typeof value === 'number') {
    if (fieldName.toLowerCase().includes('percentage') || fieldName.toLowerCase().includes('tax%')) {
      displayValue = `${value.toFixed(1)}%`;
    } else if (
      fieldName.toLowerCase().includes('price') ||
      fieldName.toLowerCase().includes('amount') ||
      fieldName.toLowerCase().includes('discount') ||
      fieldName.toLowerCase().includes('net')
    ) {
      displayValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
      }).format(value);
    } else {
      displayValue = String(value);
    }
  }

  return (
    <td
      id={`editable-cell-view-${fieldName}`}
      onDoubleClick={() => setEditing(true)}
      className="px-4 py-3 align-middle border-b border-slate-100 text-slate-700 font-sans text-sm cursor-pointer hover:bg-slate-50/70 transition-colors group relative"
      title="Double click to edit cell"
    >
      <span className="group-hover:underline decoration-slate-300 decoration-dotted underline-offset-4">
        {displayValue}
      </span>
      <span className="absolute right-2 top-3.5 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 font-sans pointer-events-none transition-opacity">
        ✏️
      </span>
    </td>
  );
}
