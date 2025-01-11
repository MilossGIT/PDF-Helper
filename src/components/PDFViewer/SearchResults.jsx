import { Search } from 'lucide-react';

const SearchResults = ({ results = [], onSelect, searchQuery = '' }) => {
    const handleResultClick = (result) => {
        if (onSelect) {
            onSelect({
                pageNumber: result.pageNumber,
                text: result.matches?.[0] || '',
                matches: result.matches
            });
        }
    };

    if (!results.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Search className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">
                    {searchQuery
                        ? 'No results found. Try a different search term.'
                        : 'Enter a search term to find content in your PDFs.'}
                </p>
            </div>
        );
    }

    const highlightText = (text, searchTerm) => {
        if (!searchTerm || !text) return text;
        try {
            const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const parts = text.split(new RegExp(`(${escapedSearchTerm})`, 'gi'));
            return (
                <span>
                    {parts.map((part, index) =>
                        part.toLowerCase() === searchTerm.toLowerCase()
                            ? <span key={index} className="bg-yellow-200 font-medium">{part}</span>
                            : part
                    )}
                </span>
            );
        } catch (e) {
            return text;
        }
    };

    return (
        <div className="space-y-2">
            <div className="sticky top-0 bg-white z-10 p-2 border-b shadow-sm">
                <div className="text-sm text-gray-500">
                    Found {results.length} {results.length === 1 ? 'result' : 'results'}
                </div>
            </div>
            <div className="space-y-3 p-2">
                {results.map((result, index) => (
                    <div
                        key={`${result.pageNumber}-${index}`}
                        onClick={() => handleResultClick(result)}
                        className="bg-white rounded-lg p-3 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-600">
                                Page {result.pageNumber}
                            </span>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-700">
                            {result.matches?.map((match, mIndex) => (
                                <div key={mIndex} className="mb-1 last:mb-0">
                                    {highlightText(match, searchQuery)}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchResults;