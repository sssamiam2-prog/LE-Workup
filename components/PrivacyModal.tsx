import React from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4 p-6 relative"
        onClick={e => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <h2 id="privacy-modal-title" className="text-2xl font-bold text-slate-800 mb-4">
          How It Works & Data Privacy
        </h2>
        <div className="text-slate-600 space-y-3">
            <p className="font-semibold text-lg">Your data is 100% private and secure.</p>
            <p>This is how your data is handled when you use this application:</p>
            <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>
                    <strong>File Selection:</strong> When you select a Word document, it remains on your computer. It is NOT uploaded to a server.
                </li>
                <li>
                    <strong>Local Processing:</strong> All processing—reading the file, extracting the text and images, and parsing the information—happens entirely within your web browser on your own computer.
                </li>
                <li>
                    <strong>Local Document Creation:</strong> The final, editable Word document is also created locally in your browser before being downloaded.
                </li>
            </ol>
            <p className="font-bold pt-2 text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
                At no point is your document or its contents sent over the internet. Everything stays on your local machine, ensuring complete privacy and security.
            </p>
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
