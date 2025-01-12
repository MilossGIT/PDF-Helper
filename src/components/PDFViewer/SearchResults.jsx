import { Search } from 'lucide-react';

const SearchResults = ({ results = [], onSelect, searchQuery = '' }) => {
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
                        onClick={() => onSelect(result)}
                        className="bg-white rounded-lg p-3 shadow-sm hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-600">
                                Page {result.pageNumber}
                            </span>
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                {result.matches.length} {result.matches.length === 1 ? 'match' : 'matches'}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {result.matches.map((match, mIndex) => (
                                <div key={mIndex} className="text-sm text-gray-700">
                                    {match.text}
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