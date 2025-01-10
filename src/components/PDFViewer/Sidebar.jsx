import { useState } from 'react';
import { Search, Mic, BookmarkIcon, X, Plus, ChevronRight, ChevronDown } from 'lucide-react';
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

const FileItem = ({ file, isExpanded, onToggle, isSelected, onSelect, onDelete }) => (
    <div
        className={`group p-2 rounded-lg cursor-pointer transition-colors
      ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
    >
        <div className="flex items-center">
            <button
                onClick={onToggle}
                className="p-1 hover:bg-gray-100 rounded-full"
            >
                {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
            </button>
            <span
                className="ml-2 flex-1 truncate text-sm"
                onClick={onSelect}
            >
                {file.name}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 rounded-full"
            >
                <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
            </button>
        </div>
    </div>
);

const Sidebar = ({
    files = [],
    activeTab,
    onTabChange,
    selectedFile,
    onFileSelect,
    onFileUpload,
    searchQuery = '',
    onSearch,
    isLoading = false,
    error = null,
    onErrorDismiss,
    searchResults = [],
    expandedFiles,
    onFileToggle,
    onFileDelete,
    bookmarks = [],
    onBookmarkDelete
}) => {
    const [isListening, setIsListening] = useState(false);

    const handleVoiceSearch = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onSearch(transcript);
            };

            recognition.start();
        }
    };

    return (
        <div className="w-80 bg-white border-r flex flex-col">
            {/* Upload Button */}
            <div className="p-4 border-b">
                <label className="flex items-center justify-center gap-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors">
                    <Plus className="h-5 w-5" />
                    <span className="text-sm font-medium">Upload PDFs</span>
                    <input
                        type="file"
                        onChange={onFileUpload}
                        accept="application/pdf"
                        multiple
                        className="hidden"
                    />
                </label>
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 border-b">
                    <div className="flex items-center justify-between text-red-600 text-sm">
                        <span>{error}</span>
                        <button
                            onClick={onErrorDismiss}
                            className="p-1 hover:bg-red-100 rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

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
                        placeholder="Search PDFs..."
                        className="w-full pl-10 pr-10 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <button
                        onClick={handleVoiceSearch}
                        className={`absolute right-3 top-2.5 p-1 rounded-full hover:bg-gray-100
              ${isListening ? 'text-red-500' : 'text-gray-400'}`}
                    >
                        <Mic className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                    </div>
                ) : activeTab === 'files' ? (
                    files.map((file) => (
                        <FileItem
                            key={file.timestamp}
                            file={file}
                            isExpanded={expandedFiles.has(file.timestamp)}
                            onToggle={() => onFileToggle(file.timestamp)}
                            onSelect={() => onFileSelect(file)}
                            onDelete={() => onFileDelete(file)}
                            isSelected={selectedFile?.timestamp === file.timestamp}
                        />
                    ))
                ) : activeTab === 'search' ? (
                    <SearchResults results={searchResults} onSelect={onFileSelect} />
                ) : (
                    <div className="space-y-2">
                        {bookmarks.map((bookmark) => (
                            <div
                                key={bookmark.timestamp}
                                className="bg-white rounded-lg p-3 shadow-sm hover:bg-gray-50 group"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <BookmarkIcon className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm">Page {bookmark.pageNumber}</span>
                                    </div>
                                    <button
                                        onClick={() => onBookmarkDelete?.(bookmark)}
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;