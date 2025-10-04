import React, { useState, useCallback } from 'react';
import mammoth from 'mammoth';
import { Header } from './components/Header';
import { DocxInputForm } from './components/PdfInputForm';
import { Spinner } from './components/Spinner';
import { parseDocxContent } from './services/docxParser';
import { generateWorkUpBlob } from './services/docxGenerator';
import { InfoIcon } from './components/icons';
import { PrivacyModal } from './components/PrivacyModal';
import { DocxPreview } from './components/DocxPreview';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [docxFilename, setDocxFilename] = useState<string>('');

  const handleProcessDocx = useCallback(async (file: File) => {
    setIsLoading(true);
    setIsComplete(false);
    setError(null);
    setDocxBlob(null);
    setDocxFilename('');

    try {
      setLoadingMessage('Reading Word document...');
      const arrayBuffer = await file.arrayBuffer();

      setLoadingMessage('Extracting content...');
      const mammothResult = await (mammoth as any).convertToHtml({ arrayBuffer });
      const html = mammothResult.value;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      if (!tempDiv.innerText.trim()) {
        throw new Error("The document appears to be empty. Please provide a document with content.");
      }

      setLoadingMessage('Parsing document structure...');
      const extractedData = await parseDocxContent(html);
      
      setLoadingMessage('Building your Word file...');
      const { blob, filename } = await generateWorkUpBlob(extractedData);
      
      setDocxBlob(blob);
      setDocxFilename(filename);
      setIsComplete(true);

    } catch (err) {
      console.error(err);
      let message = 'Failed to process the document. Please ensure it is a valid file and try again.';
       if (err instanceof Error) {
          message = `An error occurred during processing: ${err.message}. Please check that the document format matches the expected template.`;
      }
      setError(message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleReset = () => {
    setIsLoading(false);
    setIsComplete(false);
    setError(null);
    setDocxBlob(null);
    setDocxFilename('');
  };

  const handleDownload = () => {
    if (!docxBlob || !docxFilename) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docxFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          
          {!isComplete ? (
            <>
              <p className="mb-6 text-slate-600 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                This tool extracts information from a criminal history Word Document and generates an editable Word Document based on the "Case Support Work-up" template.
                <strong> All processing is done locally in your browser; no data is uploaded.</strong>
              </p>
              
              <div className="mb-4 text-sm text-slate-600 flex justify-center items-center">
                <button 
                  onClick={() => setIsPrivacyModalOpen(true)} 
                  className="flex items-center hover:text-blue-600 hover:underline"
                >
                  <InfoIcon className="h-4 w-4 mr-1.5" />
                  How this app works & data privacy
                </button>
              </div>

              <DocxInputForm
                onSubmit={handleProcessDocx}
                isLoading={isLoading}
              />
            </>
          ) : (
             <DocxPreview 
                blob={docxBlob!}
                onDownload={handleDownload}
                onReset={handleReset}
             />
          )}

          {isLoading && (
            <div className="mt-8 flex flex-col items-center justify-center">
              <Spinner />
              <p className="text-slate-500 mt-4 text-center">{loadingMessage}<br/>This should be very quick.</p>
            </div>
          )}

          {error && (
            <div className="mt-8 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
              <h3 className="font-bold">An Error Occurred</h3>
              <p>{error}</p>
               <button 
                    onClick={handleReset}
                    className="mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700"
                >
                    Try Again
                </button>
            </div>
          )}

        </div>
      </main>
      <PrivacyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />
    </div>
  );
};

export default App;