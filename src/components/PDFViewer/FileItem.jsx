import { ChevronDown, ChevronRight, FileText, X } from 'lucide-react';

const FileItem = ({ pdf, isExpanded, onToggle, onSelect, onDelete, isSelected }) => {
    return (
        <div className={`group relative mb-2 rounded-lg transition-all ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
            }`}>
            <div className="flex items-center p-2 cursor-pointer" onClick={onToggle}>
                <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                >
                    {isExpanded ? (
                        <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                        <ChevronRight size={16} className="text-gray-500" />
                    )}
                </button>
                <FileText size={16} className="text-gray-500 ml-1" />
                <span
                    className="ml-2 text-sm truncate flex-1"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                >
                    {pdf.name}
                </span>
                <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                </div>
            </div>
            {isExpanded && pdf.headers && pdf.headers.length > 0 && (
                <div className="ml-8 pl-2 border-l border-gray-200 mb-2">
                    {pdf.headers.map((header, index) => (
                        <div
                            key={index}
                            className="py-1 px-2 text-sm text-gray-600 hover:bg-gray-50 rounded cursor-pointer truncate"
                            onClick={() => onSelect()}
                        >
                            {header}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileItem;