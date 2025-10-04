import React, { useState, useRef } from 'react';
import { WandIcon, FileIcon, XIcon } from './icons';

interface DocxInputFormProps {
  onSubmit: (file: File) => void;
  isLoading: boolean;
}

export const DocxInputForm: React.FC<DocxInputFormProps> = ({ onSubmit, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onSubmit(selectedFile);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <label htmlFor="docx-input" className="block text-lg font-semibold text-slate-700 mb-2">
        Criminal History Word Document
      </label>
      
      {!selectedFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative block w-full rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-slate-400 cursor-pointer"
        >
          <FileIcon className="mx-auto h-12 w-12 text-slate-400" />
          <span className="mt-2 block text-sm font-semibold text-slate-600">
            Select a DOCX file
          </span>
           <input
            ref={fileInputRef}
            id="docx-input"
            type="file"
            onChange={handleFileChange}
            accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            disabled={isLoading}
          />
        </div>
      ) : (
         <div className="flex items-center justify-between w-full rounded-lg border border-slate-300 bg-slate-50 p-3">
            <div className="flex items-center overflow-hidden">
                <FileIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <span className="ml-3 text-sm font-medium text-slate-800 truncate">{selectedFile.name}</span>
            </div>
            <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-4 p-1 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200"
                aria-label="Remove file"
                disabled={isLoading}
            >
                <XIcon className="h-5 w-5"/>
            </button>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !selectedFile}
          className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors duration-300"
        >
          <WandIcon className="h-5 w-5 mr-2" />
          {isLoading ? 'Processing...' : 'Process Document'}
        </button>
      </div>
    </form>
  );
};