import { Search, Mic, BookmarkIcon, X } from 'lucide-react';
import FileItem from './FileItem';
import SearchResults from './SearchResults';

const Tab = ({ isActive, onClick, children }) => (
    <button
        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors
      ${isActive
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
        onClick={onClick}
    >
        {children}
    </button>
);

const Sidebar = ({
    activeTab,
    onTabChange,
    searchQuery,
    onSearch,
    isListening,
    onVoiceSearch,
    files,
    expandedFiles,
    onFileToggle,
    onFileSelect,
    onFileDelete,
    selectedFile,
    searchResults,
    bookmarks,
    onBookmarkClick,
    onDeleteBookmark
}) => {
    const renderBookmarks = () => {
        if (!bookmarks?.length) {
            return (
                <div className="text-center text-gray-500 p-4">
                    No bookmarks yet. Select text or click the bookmark icon to add one.
                </div>
            );
        }

        return (
            <div className="space-y-2 p-4">
                {bookmarks.map((bookmark) => (
                    <div
                        key={bookmark.timestamp}
                        className="bg-white rounded-lg p-3 shadow-sm hover:bg-gray-50 group cursor-pointer"
                        onClick={() => onBookmarkClick(bookmark)}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <BookmarkIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Page {bookmark.pageNumber}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteBookmark(bookmark);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-full transition-opacity"
                            >
                                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                            </button>
                        </div>
                        {bookmark.text && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {bookmark.text}
                            </p>
                        )}
                        {bookmark.note && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                                {bookmark.note}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-80 bg-white border-r flex flex-col">
            {/* Tabs */}
            <div className="flex border-b">
                <Tab
                    isActive={activeTab === 'files'}
                    onClick={() => onTabChange('files')}
                >
                    Files
                </Tab>
                <Tab
                    isActive={activeTab === 'search'}
                    onClick={() => onTabChange('search')}
                >
                    Search
                </Tab>
                <Tab
                    isActive={activeTab === 'bookmarks'}
                    onClick={() => onTabChange('bookmarks')}
                >
                    Bookmarks
                </Tab>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <button
                        onClick={onVoiceSearch}
                        className={`absolute right-3 top-2.5 p-1 rounded-full hover:bg-gray-100
              ${isListening ? 'text-red-500' : 'text-gray-400'}`}
                    >
                        <Mic className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {activeTab === 'files' && (
                    <div className="space-y-1 p-4">
                        {files.map((file) => (
                            <FileItem
                                key={file.timestamp}
                                file={file}
                                isExpanded={expandedFiles.has(file.timestamp)}
                                onToggle={() => onFileToggle(file.timestamp)}
                                onSelect={() => onFileSelect(file)}
                                onDelete={() => onFileDelete(file)}
                                isSelected={selectedFile?.timestamp === file.timestamp}
                            />
                        ))}
                    </div>
                )}

                {activeTab === 'search' && (
                    <SearchResults
                        results={searchResults}
                        onResultClick={(result) => {
                            if (selectedFile) {
                                onBookmarkClick({ pageNumber: result.pageNumber });
                            }
                        }}
                    />
                )}

                {activeTab === 'bookmarks' && renderBookmarks()}
            </div>
        </div>
    );
};

export default Sidebar;