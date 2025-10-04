import React, { useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { CheckCircleIcon, FileTextIcon, WandIcon } from './icons';

interface DocxPreviewProps {
    blob: Blob;
    onDownload: () => void;
    onReset: () => void;
}

export const DocxPreview: React.FC<DocxPreviewProps> = ({ blob, onDownload, onReset }) => {
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (blob && previewRef.current) {
            renderAsync(blob, previewRef.current, undefined, {
                 className: "docx-preview", 
                 inWrapper: true, 
                 ignoreWidth: false,
                 ignoreHeight: false,
                 ignoreFonts: false,
                 breakPages: true, 
                 experimental: true,
                 useMathMLPolyfill: true,
            })
            .then(() => console.log("Document preview rendered."))
            .catch(err => console.error("Error rendering document preview:", err));
        }
    }, [blob]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center text-center md:text-left">
                    <CheckCircleIcon className="h-12 w-12 text-green-500" />
                    <div className="ml-4">
                        <h2 className="text-2xl font-bold text-slate-800">Document Ready for Review</h2>
                        <p className="text-slate-600">Preview the generated document below.</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                     <button
                        onClick={onReset}
                        className="flex items-center px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 transition-colors"
                    >
                        <WandIcon className="h-5 w-5 mr-2" />
                        Create Another
                    </button>
                    <button
                        onClick={onDownload}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300"
                    >
                        <FileTextIcon className="h-5 w-5 mr-2" />
                        Download Document
                    </button>
                </div>
            </div>

            <div className="bg-slate-200 p-4 rounded-lg overflow-y-auto max-h-[70vh] border border-slate-300">
                <div ref={previewRef} className="bg-white shadow-lg mx-auto"></div>
            </div>
            
            <style>{`
                .docx-preview .docx-wrapper {
                    background-color: #fff;
                    padding: 2rem !important;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                }
                .docx-preview .docx-wrapper > section.docx {
                    margin-bottom: 2rem !important;
                }
            `}</style>
        </div>
    );
};