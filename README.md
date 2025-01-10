# PDF Helper

A modern React application for viewing, searching, and managing PDF files with bookmark functionality. Built with React, Vite, and TailwindCSS.

## Features

- 📄 PDF file viewing with smooth page navigation
- 🔍 Full-text search within PDFs
- 🎤 Voice search capability
- 📑 Bookmark management system
- 💾 Local file storage using IndexedDB
- 📱 Responsive design

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 16 or higher)
- npm (version 7 or higher)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/MilossGIT/PDF-Helper.git
cd PDF-Helper
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── PDFViewer/
│   │   ├── BookmarkDialog.jsx
│   │   ├── FileItem.jsx
│   │   ├── index.jsx
│   │   ├── PDFHeaders.jsx
│   │   ├── SearchResults.jsx
│   │   └── Sidebar.jsx
│   ├── Search/
│   │   └── index.jsx
│   └── ui/
│       ├── alert.jsx
│       ├── button.jsx
│       └── card.jsx
├── hooks/
│   ├── useLocalStorage.js
│   └── usePDFHeaders.js
├── lib/
│   ├── db.js
│   └── utils.js
└── styles/
    ├── globals.css
    └── pdf-viewer.css
```

## Usage

### File Management

- Upload PDFs using the upload button
- View file list in the sidebar
- Delete files as needed

### Search Functionality

- Use the search bar to find text within PDFs
- Voice search available via microphone button
- Results show page numbers and context

### Bookmarking

- Add bookmarks to specific pages
- Add notes to bookmarks
- Quick navigation via bookmark sidebar

## Dependencies

### Core

```json
{
  "dependencies": {
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "idb": "^8.0.0",
    "lucide-react": "^0.320.0",
    "pdfjs-dist": "^4.0.379",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-pdf": "^7.7.0"
  }
}
```

### Development

```json
{
  "devDependencies": {
    "@types/node": "^20.11.16",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.55.0",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "vite": "^5.0.8"
  }
}
```

## Configuration Files

### Vite Config

```javascript
// vite.config.js
export default {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};
```

### Tailwind Config

```javascript
// tailwind.config.cjs
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Issues

- Large PDFs (>50MB) may cause performance issues
- Voice search requires browser support for Web Speech API

## Future Improvements

- [ ] Add dark mode support
- [ ] Implement PDF annotation
- [ ] Add file categories/tags
- [ ] Enable PDF download
- [ ] Add search history
- [ ] Support for mobile devices

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- PDF.js for PDF rendering
- React-PDF for React integration
- TailwindCSS for styling
- Vite for build tooling

## Contact

Milos - [@MilossGIT](https://github.com/MilossGIT)

Project Link: [https://github.com/MilossGIT/PDF-Helper](https://github.com/MilossGIT/PDF-Helper)
