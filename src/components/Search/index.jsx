import React, { useState } from 'react';
import { Search, Mic } from 'lucide-react';
import { Button } from '../ui/button';

const VoiceSearch = ({ onSearch, value }) => {
    const [isListening, setIsListening] = useState(false);

    const toggleVoiceSearch = () => {
        if (!isListening && 'webkitSpeechRecognition' in window) {
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
        <div className="relative mb-4">
            <input
                type="text"
                value={value}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search PDFs and headers..."
                className="w-full p-2 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleVoiceSearch}
                    className={`p-2 rounded-full hover:bg-gray-100 ${isListening ? 'text-red-500' : 'text-gray-500'
                        }`}
                >
                    <Mic size={20} />
                </Button>
                <Search size={20} className="text-gray-500" />
            </div>
        </div>
    );
};

export default VoiceSearch;