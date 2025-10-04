
import React from 'react';
import { FileTextIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <FileTextIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 ml-3">
          Case Support Work-up Generator
        </h1>
      </div>
    </header>
  );
};
