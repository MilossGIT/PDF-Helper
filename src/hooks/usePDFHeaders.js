import { useState, useEffect } from 'react';

export function usePDFHeaders(pdfDocument) {
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const extractHeaders = async () => {
      if (!pdfDocument) {
        setHeaders([]);
        setLoading(false);
        return;
      }

      try {
        const firstPage = await pdfDocument.getPage(1);
        const textContent = await firstPage.getTextContent();
        const extractedHeaders = textContent.items
          .filter((item) => item.transform[3] > 12)
          .map((item) => ({
            text: item.str,
            fontSize: item.transform[3],
          }));

        setHeaders(extractedHeaders);
        setError(null);
      } catch (err) {
        console.error('Error extracting headers:', err);
        setError('Failed to extract headers');
      } finally {
        setLoading(false);
      }
    };

    extractHeaders();
  }, [pdfDocument]);

  return { headers, loading, error };
}

export default usePDFHeaders;
