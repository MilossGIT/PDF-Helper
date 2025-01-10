import { useState } from 'react';
import { X } from 'lucide-react';

const BookmarkDialog = ({ isOpen, onClose, onSave, selectedText, pageNumber }) => {
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({
            text: selectedText,
            note,
            pageNumber,
            timestamp: Date.now()
        });
        setNote('');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Add Bookmark</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Selected Text</div>
                    <div className="text-sm bg-gray-50 p-2 rounded">
                        {selectedText}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Page {pageNumber}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-sm text-gray-600 block mb-1">
                        Note (optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Add a note to this bookmark..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Save Bookmark
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookmarkDialog;