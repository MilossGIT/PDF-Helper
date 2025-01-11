// src/components/PDFViewer/index.jsx
import { useState, useEffect, useCallback } from 'react';
import { FileText, Bookmark, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { saveFile, getFiles, deleteFile, updateBookmarks } from '../../lib/db';
import Sidebar from './Sidebar';
import BookmarkDialog from './BookmarkDialog';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const BookmarkStamp = ({ bookmark, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{
                left: `${bookmark.position.x}%`,
                top: `${bookmark.position.y}%`
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={onClick}
        >
            <Bookmark className="w-5 h-5 text-blue-500 hover:scale-110 transition-transform" fill="currentColor" />
            {showTooltip && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white p-2 rounded shadow-lg text-sm z-20">
                    <p className="font-medium truncate">{bookmark.text}</p>
                    {bookmark.note && (
                        <p className="text-gray-500 text-xs mt-1 truncate">{bookmark.note}</p>
                    )}
                </div>
            )}
        </div>
    );
};

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
    const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);
    const [selectedText, setSelectedText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [isDocumentLoaded, setIsDocumentLoaded] = useState(false);

    useEffect(() => {
        const loadPdfs = async () => {
            try {
                setLoading(true);
                const savedFiles = await getFiles();
                const pdfWithUrls = savedFiles.map(pdf => ({
                    ...pdf,
                    url: URL.createObjectURL(new Blob([pdf.data], { type: 'application/pdf' })),
                    bookmarks: pdf.bookmarks || []
                }));
                setPdfs(pdfWithUrls);
            } catch (err) {
                console.error('Error loading PDFs:', err);
                setError('Failed to load PDFs');
            } finally {
                setLoading(false);
            }
        };
        loadPdfs();
    }, []);

    useEffect(() => {
        return () => {
            pdfs.forEach(pdf => {
                if (pdf.url) URL.revokeObjectURL(pdf.url);
            });
        };
    }, [pdfs]);

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        setLoading(true);

        for (const file of files) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const newPdf = {
                    name: file.name,
                    data: arrayBuffer,
                    timestamp: Date.now(),
                    bookmarks: []
                };

                const success = await saveFile(newPdf);
                if (success) {
                    setPdfs(prev => [...prev, { ...newPdf, url }]);
                } else {
                    setError(`Failed to save ${file.name}`);
                }
            } catch (err) {
                console.error(`Error uploading ${file.name}:`, err);
                setError(`Failed to upload ${file.name}`);
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
            const pdfDoc = await pdfjs.getDocument(currentPdf.url).promise;
            const results = [];

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');

                const regex = new RegExp(query, 'gi');
                let match;
                let matchCount = 0;
                const matches = new Set();

                while ((match = regex.exec(pageText)) !== null) {
                    matchCount++;
                    const start = Math.max(0, match.index - 50);
                    const end = Math.min(pageText.length, match.index + match[0].length + 50);

                    let contextStart = pageText.lastIndexOf('.', start);
                    contextStart = contextStart === -1 ? start : contextStart + 1;
                    let contextEnd = pageText.indexOf('.', end);
                    contextEnd = contextEnd === -1 ? end : contextEnd + 1;

                    const contextText = pageText.substring(contextStart, contextEnd).trim();
                    if (!matches.has(contextText)) {
                        matches.add(contextText);
                    }
                }

                if (matchCount > 0) {
                    results.push({
                        pageNumber: pageNum,
                        matches: Array.from(matches),
                        matchCount,
                        matchText: query
                    });
                }
            }

            setSearchResults(results);
            if (results.length > 0) {
                setActiveTab('search');
            }
        } catch (err) {
            console.error('Search error:', err);
            setError('Search failed. Please try again.');
        }
    }, [currentPdf]);

    const handleTextSelection = useCallback((event, pageNumber) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const pageElement = event.currentTarget;
            const pageRect = pageElement.getBoundingClientRect();

            const position = {
                x: ((rect.left + rect.width / 2) - pageRect.left) / pageRect.width * 100,
                y: ((rect.top + rect.height / 2) - pageRect.top) / pageRect.height * 100
            };

            setSelectedText(text);
            setSelectedPosition(position);
            setCurrentPage(pageNumber);
            setShowBookmarkDialog(true);
        }
    }, []);

    const handleBookmark = useCallback(async (bookmark) => {
        if (!currentPdf || !selectedText || !selectedPosition) return;

        const newBookmark = {
            ...bookmark,
            text: selectedText,
            pageNumber: currentPage,
            position: selectedPosition,
            timestamp: Date.now()
        };

        const updatedBookmarks = [...(currentPdf.bookmarks || []), newBookmark];
        const success = await updateBookmarks(currentPdf.timestamp, updatedBookmarks);

        if (success) {
            setCurrentPdf(prev => ({
                ...prev,
                bookmarks: updatedBookmarks
            }));

            setPdfs(prev => prev.map(pdf =>
                pdf.timestamp === currentPdf.timestamp
                    ? { ...pdf, bookmarks: updatedBookmarks }
                    : pdf
            ));
        } else {
            setError('Failed to save bookmark');
        }

        setShowBookmarkDialog(false);
        setSelectedText('');
        setSelectedPosition(null);
    }, [currentPdf, selectedText, selectedPosition, currentPage]);

    const handleBookmarkDelete = useCallback(async (bookmark) => {
        if (!currentPdf) return;

        const updatedBookmarks = currentPdf.bookmarks.filter(
            b => b.timestamp !== bookmark.timestamp
        );

        const success = await updateBookmarks(currentPdf.timestamp, updatedBookmarks);

        if (success) {
            setCurrentPdf(prev => ({
                ...prev,
                bookmarks: updatedBookmarks
            }));

            setPdfs(prev => prev.map(pdf =>
                pdf.timestamp === currentPdf.timestamp
                    ? { ...pdf, bookmarks: updatedBookmarks }
                    : pdf
            ));
        } else {
            setError('Failed to delete bookmark');
        }
    }, [currentPdf]);

    const navigateToPage = useCallback((pageNumber) => {
        if (!currentPdf || !isDocumentLoaded) {
            console.warn('PDF not ready for navigation');
            return;
        }

        const targetPage = parseInt(pageNumber, 10);
        if (isNaN(targetPage) || targetPage < 1 || targetPage > numPages) {
            console.warn('Invalid page number:', pageNumber);
            return;
        }

        setCurrentPage(targetPage);

        requestAnimationFrame(() => {
            const pageElement = document.querySelector(`[data-page-number="${targetPage}"]`);
            if (pageElement) {
                pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                console.warn('Page element not found:', targetPage);
            }
        });
    }, [currentPdf, isDocumentLoaded, numPages]);

    const handleSearchResultClick = useCallback((result) => {
        if (!currentPdf || !isDocumentLoaded) return;
        const pageNumber = typeof result === 'object' ? result.pageNumber : result;
        navigateToPage(pageNumber);
    }, [currentPdf, isDocumentLoaded, navigateToPage]);

    const handleBookmarkClick = useCallback((pageNumber) => {
        if (!currentPdf || !isDocumentLoaded) return;
        navigateToPage(pageNumber);
    }, [currentPdf, isDocumentLoaded, navigateToPage]);

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
                onSearch={handleSearch}
                isLoading={loading}
                error={error}
                onErrorDismiss={() => setError(null)}
                searchResults={searchResults}
                expandedFiles={expandedFiles}
                onFileToggle={(timestamp) => {
                    setExpandedFiles(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(timestamp)) newSet.delete(timestamp);
                        else newSet.add(timestamp);
                        return newSet;
                    });
                }}
                onSearchResultClick={handleSearchResultClick}
                onFileDelete={async (pdf) => {
                    try {
                        const success = await deleteFile(pdf.timestamp);
                        if (success) {
                            URL.revokeObjectURL(pdf.url);
                            setPdfs(prev => prev.filter(p => p.timestamp !== pdf.timestamp));
                            if (currentPdf?.timestamp === pdf.timestamp) {
                                setCurrentPdf(null);
                            }
                        } else {
                            setError('Failed to delete file');
                        }
                    } catch (err) {
                        setError('Failed to delete file');
                    }
                }}
                bookmarks={currentPdf?.bookmarks || []}
                onBookmarkClick={handleBookmarkClick}
                onBookmarkDelete={handleBookmarkDelete}
            />

            <div className="flex-1 bg-gray-50 overflow-auto relative flex flex-col items-center">
                <div className="sticky top-4 right-4 flex items-center gap-2 bg-white p-2 rounded-lg shadow-md z-20 self-end mr-4">
                    <button
                        onClick={() => setScale(prev => Math.max(prev - 0.1, 0.5))}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setScale(1.0)}
                        className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button
                        onClick={() => setScale(prev => Math.min(prev + 0.1, 2.0))}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                </div>

                {currentPdf ? (
                    <Document
                        file={currentPdf.url}
                        onLoadSuccess={({ numPages }) => {
                            setNumPages(numPages);
                            setIsDocumentLoaded(true);
                        }}
                        onLoadError={(error) => {
                            console.error('Error loading PDF:', error);
                            setError('Failed to load PDF');
                            setIsDocumentLoaded(false);
                        }}
                        className="flex flex-col items-center p-4 w-full"
                        loading={
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        }
                    >
                        <div className="max-w-5xl mx-auto w-full">
                            {Array.from(new Array(numPages), (el, index) => (
                                <div
                                    key={`page_container_${index + 1}`}
                                    className="relative mb-4 flex justify-center"
                                    onMouseUp={(e) => handleTextSelection(e, index + 1)}
                                    data-page-number={index + 1}
                                >
                                    <div className="relative">
                                        <Page
                                            pageNumber={index + 1}
                                            scale={scale}
                                            className="shadow-lg rounded-lg bg-white"
                                            data-page-number={index + 1}
                                        />
                                        {currentPdf.bookmarks?.filter(b => b.pageNumber === index + 1)
                                            .map((bookmark) => (
                                                <BookmarkStamp
                                                    key={bookmark.timestamp}
                                                    bookmark={bookmark}
                                                    onClick={() => navigateToPage(bookmark.pageNumber)}
                                                />
                                            ))}
                                        <div className="absolute bottom-2 right-2 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-75">
                                            Page {index + 1} of {numPages}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                    setSelectedPosition(null);
                }}
                onSave={handleBookmark}
                selectedText={selectedText}
                pageNumber={currentPage}
            />
        </div>
    );
};

export default PDFViewer;