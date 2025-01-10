// src/hooks/usePDFHeaders.js
import { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

export function usePDFHeaders(file) {
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const extractHeaders = async () => {
      try {
        if (!file) {
          setHeaders([]);
          setLoading(false);
          return;
        }

        const pdf = await pdfjs.getDocument(file).promise;
        const headers = [];

        // Extract headers from first 3 pages (or less if document is shorter)
        const numPages = Math.min(pdf.numPages, 3);

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Process text items to identify headers
          const pageHeaders = textContent.items
            .filter((item) => {
              // Filter criteria for headers:
              // 1. Text size larger than regular text (transform[3] is font size)
              // 2. Not too long (likely not a header if too long)
              // 3. Not just numbers or special characters
              const isBiggerText = item.transform[3] > 12;
              const isReasonableLength = item.str.length < 100;
              const hasLetters = /[a-zA-Z]/.test(item.str);
              const notJustNumbers = !/^\d+$/.test(item.str.trim());

              return (
                isBiggerText &&
                isReasonableLength &&
                hasLetters &&
                notJustNumbers
              );
            })
            .map((item) => ({
              text: item.str.trim(),
              fontSize: item.transform[3],
              pageNum: pageNum,
              // Approximate Y position on page for navigation
              position: item.transform[5],
            }));

          headers.push(...pageHeaders);
        }

        // Sort headers by page number and position
        const sortedHeaders = headers.sort((a, b) => {
          if (a.pageNum !== b.pageNum) {
            return a.pageNum - b.pageNum;
          }
          // If on same page, sort by vertical position (top to bottom)
          return b.position - a.position;
        });

        // Remove duplicates and format final header list
        const uniqueHeaders = Array.from(
          new Set(sortedHeaders.map((h) => h.text))
        ).map((text) => {
          const header = sortedHeaders.find((h) => h.text === text);
          return {
            text,
            pageNum: header.pageNum,
            position: header.position,
            level: calculateHeaderLevel(header.fontSize),
          };
        });

        setHeaders(uniqueHeaders);
        setError(null);
      } catch (err) {
        console.error('Error extracting headers:', err);
        setError('Failed to extract headers from PDF');
        setHeaders([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    extractHeaders();

    return () => {
      // Cleanup if needed
      setHeaders([]);
      setLoading(false);
      setError(null);
    };
  }, [file]);

  // Helper function to determine header level based on font size
  const calculateHeaderLevel = (fontSize) => {
    // These thresholds can be adjusted based on your needs
    if (fontSize >= 20) return 1;
    if (fontSize >= 16) return 2;
    if (fontSize >= 14) return 3;
    return 4;
  };

  // Function to jump to a specific header in the PDF
  const scrollToHeader = async (headerInfo) => {
    try {
      if (!file) return;

      const pdf = await pdfjs.getDocument(file).promise;
      const page = await pdf.getPage(headerInfo.pageNum);

      // Return scroll information for the PDF viewer
      return {
        pageNumber: headerInfo.pageNum,
        // Convert PDF coordinates to viewport coordinates
        position: headerInfo.position,
      };
    } catch (err) {
      console.error('Error scrolling to header:', err);
      return null;
    }
  };

  return {
    headers,
    loading,
    error,
    scrollToHeader,
  };
}
