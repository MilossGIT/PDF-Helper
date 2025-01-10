import { ChevronRight } from 'lucide-react';

const PDFHeaders = ({ headers, onHeaderClick }) => {
    if (!headers?.length) return null;

    return (
        <div className="mt-2 space-y-1">
            {headers.map((header, index) => (
                <button
                    key={index}
                    onClick={onHeaderClick}
                    className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded-md flex items-center gap-2"
                >
                    <ChevronRight size={16} className="text-gray-400" />
                    <span>{header}</span>
                </button>
            ))}
        </div>
    );
};

export default PDFHeaders;