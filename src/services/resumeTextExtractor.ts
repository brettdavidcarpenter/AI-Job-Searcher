
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        
        if (file.type === 'application/pdf') {
          // For PDF files, we'll extract basic text content
          // In a production app, you'd want to use a proper PDF parsing library
          const text = await extractTextFromPDF(arrayBuffer);
          resolve(text);
        } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          // For Word documents, extract basic text
          const text = await extractTextFromWord(arrayBuffer);
          resolve(text);
        } else {
          reject(new Error('Unsupported file type'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // Basic PDF text extraction - in production, use pdf-parse or similar
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
  let text = decoder.decode(uint8Array);
  
  // Basic cleanup for PDF content
  text = text.replace(/\0/g, ''); // Remove null characters
  text = text.replace(/[\x00-\x1F\x7F]/g, ' '); // Replace control characters with spaces
  text = text.replace(/\s+/g, ' '); // Normalize whitespace
  
  return text.trim();
};

const extractTextFromWord = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  // Basic Word document text extraction - in production, use mammoth.js or similar
  const uint8Array = new Uint8Array(arrayBuffer);
  const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
  let text = decoder.decode(uint8Array);
  
  // Basic cleanup for Word content
  text = text.replace(/[\x00-\x1F\x7F]/g, ' '); // Replace control characters with spaces
  text = text.replace(/\s+/g, ' '); // Normalize whitespace
  
  return text.trim();
};
