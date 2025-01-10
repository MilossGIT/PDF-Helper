import { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { saveFile, getFiles, deleteFile } from '../../lib/db';
import Sidebar from './Sidebar';
import BookmarkDialog from './BookmarkDialog';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const PDFViewer = () => {
    const [pdfs, setPdfs] = useState([]);
    const [currentPdf, setCurrentPdf] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('files');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [expandedFiles, setExpandedFiles] = useState(new Set());
    const [bookmarks, setBookmarks] = useState({});
    const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        setLoading(true);
        setError(null);

        for (const file of files) {
            try {
                // File validation
                if (!file.type.includes('pdf')) {
                    setError('Only PDF files are supported');
                    continue;
                }

                if (file.size > MAX_FILE_SIZE) {
                    setError(`${file.name} is too large. Maximum size is 50MB`);
                    continue;
                }

                // Read file
                const arrayBuffer = await file.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                // Process PDF
                const pdfDoc = await pdfjs.getDocument(new Uint8Array(arrayBuffer.slice(0))).promise;

                const newPdf = {
                    name: file.name,
                    data: arrayBuffer,
                    timestamp: Date.now(),
                    url,
                    pageCount: pdfDoc.numPages
                };

                // Save to IndexedDB
                const success = await saveFile(newPdf);
                if (success) {
                    setPdfs(prev => [...prev, newPdf]);
                    setError(null);
                } else {
                    throw new Error('Failed to save file');
                }

            } catch (err) {
                console.error('Error uploading file:', err);
                setError(`Failed to upload ${file.name}: ${err.message}`);
            }
        }

        setLoading(false);
    };

    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (!query || !currentPdf) {
            setSearchResults([]);
            return;
        }

        try {
            // Search current PDF
            const pdfDoc = await pdfjs.getDocument(currentPdf.url).promise;
            const results = [];

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');

                if (pageText.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        pageNumber: pageNum,
                        text: pageText
                    });
                }
            }

            setSearchResults(results);
            if (results.length > 0) {
                setActiveTab('search');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Failed to search PDF');
        }
    }, [currentPdf]);

    // Load saved PDFs on mount
    useEffect(() => {
        const loadSavedPdfs = async () => {
            try {
                setLoading(true);
                const savedFiles = await getFiles();
                const pdfWithUrls = savedFiles.map(pdf => {
                    const blob = new Blob([new Uint8Array(pdf.data)], { type: 'application/pdf' });
                    return { ...pdf, url: URL.createObjectURL(blob) };
                });
                setPdfs(pdfWithUrls);
            } catch (err) {
                console.error('Error loading PDFs:', err);
                setError('Failed to load saved PDFs');
            } finally {
                setLoading(false);
            }
        };

        loadSavedPdfs();

        // Cleanup function
        return () => {
            pdfs.forEach(pdf => {
                if (pdf.url) URL.revokeObjectURL(pdf.url);
            });
        };
    }, []);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        const selectedStr = selection.toString().trim();
        if (selectedStr) {
            setSelectedText(selectedStr);
            setShowBookmarkDialog(true);
        }
    };

    return (
        <div className="flex h-screen">
            <Sidebar
                files={pdfs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                selectedFile={currentPdf}
                onFileSelect={setCurrentPdf}
                onFileUpload={handleFileUpload}
                searchQuery={searchQuery}
                onSearch={setSearchQuery}
                isLoading={loading}
                error={error}
                onErrorDismiss={() => setError(null)}
                searchResults={searchResults}
                expandedFiles={expandedFiles}
                onFileToggle={(timestamp) => {
                    setExpandedFiles(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(timestamp)) {
                            newSet.delete(timestamp);
                        } else {
                            newSet.add(timestamp);
                        }
                        return newSet;
                    });
                }}
                onFileDelete={async (pdf) => {
                    try {
                        await deleteFile(pdf.timestamp);
                        URL.revokeObjectURL(pdf.url);
                        setPdfs(prev => prev.filter(p => p.timestamp !== pdf.timestamp));
                        if (currentPdf?.timestamp === pdf.timestamp) {
                            setCurrentPdf(null);
                        }
                    } catch (err) {
                        setError('Failed to delete PDF');
                    }
                }}
                bookmarks={bookmarks[currentPdf?.timestamp] || []}
            />

            <div
                className="flex-1 bg-gray-50 overflow-auto"
                onMouseUp={handleTextSelection}
            >
                {currentPdf ? (
                    <Document
                        file={currentPdf.url}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        className="flex flex-col items-center p-4"
                        loading={
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        }
                        error={
                            <div className="flex flex-col items-center justify-center h-full text-red-500">
                                <p>Error loading PDF</p>
                                <p className="text-sm">Please try another file</p>
                            </div>
                        }
                    >
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={window.innerWidth - 450}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="mb-4 shadow-lg rounded-lg bg-white"
                                onLoadSuccess={() => {
                                    if (index === 0) setCurrentPage(1);
                                }}
                            />
                        ))}
                    </Document>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <FileText size={48} className="mb-4 text-gray-300" />
                        <p>Select a PDF to view</p>
                    </div>
                )}
            </div>

            <BookmarkDialog
                isOpen={showBookmarkDialog}
                onClose={() => {
                    setShowBookmarkDialog(false);
                    setSelectedText('');
                }}
                onSave={(bookmark) => {
                    if (currentPdf) {
                        setBookmarks(prev => ({
                            ...prev,
                            [currentPdf.timestamp]: [
                                ...(prev[currentPdf.timestamp] || []),
                                { ...bookmark, pageNumber: currentPage }
                            ]
                        }));
                        setShowBookmarkDialog(false);
                        setSelectedText('');
                    }
                }}
                selectedText={selectedText}
                pageNumber={currentPage}
            />
        </div>
    );
};

export default PDFViewer;