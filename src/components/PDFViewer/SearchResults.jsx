// src/components/PDFViewer/SearchResults.jsx
import { BookmarkPlus } from 'lucide-react';

const SearchResults = ({ results, onPageChange, onAddBookmark, searchQuery }) => {
    if (!results || results.length === 0) return null;

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2">
                Search Results ({results.length})
            </h3>
            <div className="space-y-2">
                {results.map((result, index) => (
                    <div
                        key={index}
                        className="p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer group"
                        onClick={() => onPageChange(result.pageNumber)}
                    >
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Page {result.pageNumber}</span>
                            <button
                                className="p-1 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddBookmark({
                                        text: result.text,
                                        pageNumber: result.pageNumber,
                                        note: `Search result for: ${searchQuery}`
                                    });
                                }}
                                title="Add bookmark"
                            >
                                <BookmarkPlus size={14} className="text-blue-500" />
                            </button>
                        </div>
                        <div
                            className="text-sm text-gray-700"
                            dangerouslySetInnerHTML={{
                                __html: result.context.replace(
                                    new RegExp(searchQuery, 'gi'),
                                    match => `<mark class="bg-yellow-200 rounded px-1">${match}</mark>`
                                )
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchResults;