import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileCode2, Image, FileText } from 'lucide-react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileDropzone({ onFilesSelected }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  } as any);

  return (
    <div
      id="upload-dropzone-container"
      {...getRootProps()}
      className={`relative p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
        isDragActive
          ? isDragReject
            ? 'border-red-400 bg-red-50/50'
            : 'border-slate-800 bg-slate-50/70'
          : 'border-slate-200 hover:border-slate-400 bg-white'
      }`}
    >
      <input {...getInputProps()} />
      
      {/* Centered Graphic Icons */}
      <div className="flex justify-center items-center gap-3.5 mb-4 text-slate-400">
        <FileText className="w-7 h-7 stroke-[1.5]" />
        <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-110">
          <Upload className="w-5 h-5 stroke-[2.5]" />
        </div>
        <FileCode2 className="w-7 h-7 stroke-[1.5]" />
      </div>

      {isDragActive ? (
        isDragReject ? (
          <p className="text-sm font-semibold text-red-600 font-sans">
            Some selected file types are not supported!
          </p>
        ) : (
          <p className="text-sm font-semibold text-slate-800 font-sans">
            Drop your invoice files here...
          </p>
        )
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-800 font-sans">
            Drag & drop invoice files, or <span className="text-blue-500 hover:underline">browse files</span>
          </p>
          <p className="text-xs text-slate-400 font-sans">
            Supports PDF, Excel (.xlsx, .xls, .csv), and Images (JPG, PNG, WEBP)
          </p>
        </div>
      )}
    </div>
  );
}
