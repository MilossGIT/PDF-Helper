import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BookmarkDialog = ({
    isOpen,
    onClose,
    onSave,
    selectedText,
    pageNumber
}) => {
    const [note, setNote] = useState('');
    const [title, setTitle] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNote('');
            setTitle('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            title: title.trim(),
            text: selectedText,
            note: note.trim(),
            pageNumber,
            timestamp: Date.now()
        });
        setNote('');
        setTitle('');
    };

    const handleClose = () => {
        setNote('');
        setTitle('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Add Bookmark</h3>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter a title for this bookmark..."
                        />
                    </div>

                    <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Selected Text</div>
                        <div className="text-sm bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                            {selectedText}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Page {pageNumber}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Note (optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Add a note to this bookmark..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Save Bookmark
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookmarkDialog;