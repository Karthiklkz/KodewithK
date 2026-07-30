import mammoth from 'mammoth';

export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 1. Text & Markdown Files
  if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileType.includes('text')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = (err) => reject(err);
      reader.readAsText(file);
    });
  }

  // 2. Word Documents (.docx / .doc)
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileType.includes('wordprocessingml') || fileType.includes('msword')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || '';
    } catch (err) {
      console.warn('Mammoth docx parsing fallback:', err);
    }
  }

  // 3. Image Files (.png, .jpg, .jpeg, .webp) -> OCR via Tesseract.js
  if (fileType.startsWith('image/') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp')) {
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const ret = await worker.recognize(file);
      await worker.terminate();
      return ret.data.text || '';
    } catch (err) {
      console.warn('Tesseract OCR error:', err);
    }
  }

  // 4. PDF Files (.pdf)
  if (fileName.endsWith('.pdf') || fileType.includes('pdf')) {
    try {
      // Lazy load pdfjs-dist
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      if (fullText.trim()) return fullText.trim();
    } catch (err) {
      console.warn('PDFjs parsing error, attempting raw text decoding:', err);
      const text = await file.text();
      // Remove PDF binary markers roughly if fallback
      const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
                          .replace(/\s+/g, ' ')
                          .trim();
      
      if (cleaned.startsWith('%PDF-') || cleaned.includes('/Root') || cleaned.includes('/Pages')) {
        throw new Error('PDF parsing failed: returned raw binary structure.');
      }
      
      if (cleaned.length > 50) return cleaned.slice(0, 8000);
      throw err;
    }
  }

  // Fallback: Read as raw text
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = (e.target?.result as string) || '';
      const cleaned = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      resolve(cleaned.slice(0, 8000));
    };
    reader.readAsText(file);
  });
}
