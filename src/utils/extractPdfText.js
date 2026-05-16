export async function extractPdfText(file) {
  const startTime = performance.now();
  console.log('PDF Extraction: Starting...');
  
  // Use high-speed CDN
  const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
  const WORKER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  
  try {
    console.log('PDF Extraction: Loading engine from CDN...');
    const pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN);
    pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_CDN;

    console.log('PDF Extraction: Engine loaded, parsing file...');
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    console.log(`PDF Extraction: Reading ${pdf.numPages} pages...`);
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`PDF Extraction: Completed in ${duration}s`);
    
    return fullText.trim();
  } catch (err) {
    console.error('PDF extraction failed:', err);
    throw new Error('The Bureau failed to read this PDF. Please try a different format.');
  }
}
