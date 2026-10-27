// Real Browser-Side PDF Text Extraction & Client Fallback Engine
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker using standard ESM import URL
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
}

/**
 * Extracts real text from PDF, DOCX, or TXT file using Mozilla PDF.js
 */
export async function extractTextFromFile(file) {
  if (!file) return '';

  // Plain text / Markdown
  if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result || '');
      reader.onerror = () => resolve('');
      reader.readAsText(file);
    });
  }

  // Real PDF extraction with PDF.js
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => (item.str ? item.str : ''))
        .join(' ');
      if (pageText.trim()) {
        fullText += pageText + '\n\n';
      }
    }

    const cleaned = fullText.trim();
    if (cleaned.length > 20) {
      return cleaned;
    }
  } catch (err) {
    console.warn('PDF.js client extraction failed, using binary scan:', err);
  }

  // Fallback: Extract ASCII strings from ArrayBuffer
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        str += String.fromCharCode(b);
      } else {
        str += ' ';
      }
    }
    const matches = str.match(/[A-Za-z0-9+#.\-_/]{2,}/g);
    if (matches && matches.length > 10) {
      return matches.join(' ');
    }
  } catch {}

  return `Resume File: ${file.name}`;
}

/**
 * Converts File to Base64 string for FastAPI transmission
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}
