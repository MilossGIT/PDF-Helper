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
const MAX_PREVIEW_PAGES = 5;

const PDFViewer = () => {
    const [pdfs, setPdfs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPdf, setCurrentPdf] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [expandedFiles, setExpandedFiles] = useState(new Set());
    const [pdfContent, setPdfContent] = useState({});
    const [searchResults, setSearchResults] = useState([]);
    const [isListening, setIsListening] = useState(false);
    const [bookmarks, setBookmarks] = useState({});
    const [selectedPageNumber, setSelectedPageNumber] = useState(1);
    const [activeTab, setActiveTab] = useState('files');
    const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [error, setError] = useState(null);

    const cleanupUrls = useCallback((pdfList) => {
        pdfList.forEach(pdf => {
            if (pdf.url) {
                URL.revokeObjectURL(pdf.url);
            }
        });
    }, []);

    const loadPdfs = useCallback(async () => {
        try {
            const savedFiles = await getFiles();
            const pdfWithUrls = savedFiles.map(pdf => {
                const blob = new Blob([new Uint8Array(pdf.data)], { type: 'application/pdf' });
                return { ...pdf, url: URL.createObjectURL(blob) };
            });
            setPdfs(pdfWithUrls);
        } catch (err) {
            console.error('Error loading PDFs:', err);
            setError('Failed to load PDFs');
        }
    }, []);

    useEffect(() => {
        loadPdfs();
        return () => cleanupUrls(pdfs);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup URLs when pdfs change
    useEffect(() => {
        return () => cleanupUrls(pdfs);
    }, [pdfs, cleanupUrls]);

    const extractHeaders = async (pdf) => {
        try {
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            return textContent.items
                .filter(item => item.transform[3] > 12)
                .map(item => item.str)
                .slice(0, 20);
        } catch (err) {
            console.error('Error extracting headers:', err);
            return [];
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);

        for (const file of files) {
            try {
                if (file.size > MAX_FILE_SIZE) {
                    setError(`File ${file.name} is too large (max 50MB)`);
                    continue;
                }

                const arrayBuffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                const blob = new Blob([uint8Array], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const pdfDoc = await pdfjs.getDocument(uint8Array).promise;
                const headers = await extractHeaders(pdfDoc);

                // Extract content for search
                const content = {};
                for (let i = 1; i <= Math.min(pdfDoc.numPages, MAX_PREVIEW_PAGES); i++) {
                    const page = await pdfDoc.getPage(i);
                    const textContent = await page.getTextContent();
                    content[i] = textContent.items.map(item => item.str).join(' ');
                }

                const newPdf = {
                    name: file.name,
                    data: arrayBuffer,
                    headers,
                    timestamp: Date.now(),
                    url,
                    pageCount: pdfDoc.numPages
                };

                await saveFile(newPdf);
                setPdfs(prev => [...prev, newPdf]);
                setPdfContent(prev => ({
                    ...prev,
                    [newPdf.timestamp]: content
                }));

            } catch (err) {
                console.error(`Error processing ${file.name}:`, err);
                setError(`Failed to process ${file.name}`);
            }
        }
    };

    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
        if (!query || !currentPdf) {
            setSearchResults([]);
            return;
        }

        try {
            const results = [];
            const content = pdfContent[currentPdf.timestamp];

            if (content) {
                Object.entries(content).forEach(([pageNum, pageContent]) => {
                    const searchRegex = new RegExp(query, 'gi');
                    let match;

                    while ((match = searchRegex.exec(pageContent)) !== null) {
                        if (results.length >= 100) break;

                        const start = Math.max(0, match.index - 40);
                        const end = Math.min(pageContent.length, match.index + match[0].length + 40);

                        results.push({
                            pageNumber: parseInt(pageNum),
                            text: match[0],
                            context: pageContent.substring(start, end),
                            index: match.index
                        });
                    }
                });
            }

            setSearchResults(results);
            if (results.length > 0) {
                setActiveTab('search');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Search failed');
        }
    }, [currentPdf, pdfContent]);

    const handleVoiceSearch = useCallback(() => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleSearch(transcript);
            };

            recognition.start();
        } else {
            setError('Voice search is not supported in your browser');
        }
    }, [handleSearch]);

    const addBookmark = useCallback((bookmark) => {
        if (!currentPdf) return;
        setBookmarks(prev => ({
            ...prev,
            [currentPdf.timestamp]: [
                ...(prev[currentPdf.timestamp] || []),
                { ...bookmark, timestamp: Date.now() }
            ]
        }));
        setShowBookmarkDialog(false);
    }, [currentPdf]);

    const removeBookmark = useCallback((bookmarkToRemove) => {
        if (!currentPdf) return;
        setBookmarks(prev => ({
            ...prev,
            [currentPdf.timestamp]: prev[currentPdf.timestamp]?.filter(
                bookmark => bookmark.timestamp !== bookmarkToRemove.timestamp
            )
        }));
    }, [currentPdf]);

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
                activeTab={activeTab}
                onTabChange={setActiveTab}
                searchQuery={searchQuery}
                onSearch={handleSearch}
                isListening={isListening}
                onVoiceSearch={handleVoiceSearch}
                onFileUpload={handleFileUpload}
                files={pdfs}
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
                onFileSelect={setCurrentPdf}
                onFileDelete={async (pdf) => {
                    try {
                        await deleteFile(pdf.timestamp);
                        URL.revokeObjectURL(pdf.url);
                        setPdfs(prev => prev.filter(p => p.timestamp !== pdf.timestamp));
                        if (currentPdf?.timestamp === pdf.timestamp) {
                            setCurrentPdf(null);
                        }
                    } catch (err) {
                        setError('Failed to delete file');
                    }
                }}
                selectedFile={currentPdf}
                searchResults={searchResults}
                bookmarks={bookmarks[currentPdf?.timestamp] || []}
                onPageChange={setSelectedPageNumber}
                onAddBookmark={addBookmark}
                onDeleteBookmark={removeBookmark}
                error={error}
                onErrorDismiss={() => setError(null)}
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
                onSave={addBookmark}
                selectedText={selectedText}
                pageNumber={selectedPageNumber}
            />
        </div>
    );
};

export default PDFViewer;