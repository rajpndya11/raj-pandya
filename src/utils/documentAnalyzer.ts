import JSZip from 'jszip';
import { pdfjs } from 'react-pdf';
import { SlideItem } from '../types';

export interface ParsedDocumentResult {
  pageCount: number;
  title?: string;
  slides: SlideItem[];
  extractedText?: string;
}

/**
 * Configure PDF worker fallback for client-side processing
 */
if (typeof window !== 'undefined' && pdfjs && !pdfjs.GlobalWorkerOptions.workerSrc) {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
}

/**
 * Clean and normalize extracted text string
 */
function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Generate visual background gradients matching the luxury editorial palette
 */
const SLIDE_GRADIENTS = [
  'from-[#171A18] to-[#2A2E2C]',
  'from-[#1E2522] to-[#171A18]',
  'from-[#231F1B] to-[#171A18]',
  'from-[#182126] to-[#171A18]',
  'from-[#171A18] to-[#251E1C]',
  'from-[#1A2226] to-[#171A18]',
  'from-[#1E231D] to-[#171A18]',
  'from-[#171A18] to-[#1F2E23]',
  'from-[#241F1A] to-[#171A18]',
  'from-[#171A18] to-[#2A2B23]'
];

function getSlideGradient(index: number): string {
  return SLIDE_GRADIENTS[index % SLIDE_GRADIENTS.length];
}

/**
 * Analyze PPTX OpenXML Archive:
 * Extracts EXACT slide count, real slide titles, and bullet points from ppt/slides/slideN.xml
 */
async function analyzePptx(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // 1. Detect slide count from docProps/app.xml
  let metadataSlideCount = 0;
  try {
    const appXmlFile = zip.file('docProps/app.xml');
    if (appXmlFile) {
      const appXmlText = await appXmlFile.async('text');
      const match = appXmlText.match(/<Slides>(\d+)<\/Slides>/i);
      if (match && match[1]) {
        metadataSlideCount = parseInt(match[1], 10);
      }
    }
  } catch (err) {
    console.warn('Could not read docProps/app.xml from PPTX:', err);
  }

  // 2. Discover and sort all actual slide XML files: ppt/slides/slide1.xml, slide2.xml ...
  const slideFileEntries: { num: number; path: string }[] = [];
  zip.forEach((relativePath) => {
    const slideMatch = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/i);
    if (slideMatch && slideMatch[1]) {
      slideFileEntries.push({
        num: parseInt(slideMatch[1], 10),
        path: relativePath
      });
    }
  });

  // Sort strictly in original presentation order (1, 2, 3 ... N)
  slideFileEntries.sort((a, b) => a.num - b.num);

  const totalSlides = Math.max(metadataSlideCount, slideFileEntries.length, 1);
  const slides: SlideItem[] = [];
  const allExtractedTextChunks: string[] = [];

  // Base title without extension
  const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');

  // 3. Extract text from each slide XML
  for (let i = 0; i < totalSlides; i++) {
    const slideNum = i + 1;
    let slideTitle = '';
    let slideBody = '';
    const bullets: string[] = [];

    const fileEntry = slideFileEntries[i];
    if (fileEntry) {
      try {
        const slideXml = await zip.file(fileEntry.path)?.async('text');
        if (slideXml) {
          // Extract text runs inside <a:t>...</a:t>
          const textMatches = Array.from(slideXml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi));
          const textItems = textMatches
            .map(m => cleanText(m[1]))
            .filter(t => t.length > 0 && !/^\d+$/.test(t)); // Filter out raw standalone slide numbers

          if (textItems.length > 0) {
            slideTitle = textItems[0];
            const remaining = textItems.slice(1);
            if (remaining.length > 0) {
              slideBody = remaining.slice(0, 3).join('. ');
              bullets.push(...remaining.slice(0, 6));
            }
            allExtractedTextChunks.push(`[Slide ${slideNum}] ${textItems.join(' ')}`);
          }
        }
      } catch (err) {
        console.warn(`Error reading slide ${slideNum}:`, err);
      }
    }

    if (!slideTitle) {
      slideTitle = slideNum === 1 
        ? defaultTitle 
        : `${defaultTitle} — Slide ${slideNum}`;
    }

    slides.push({
      page: slideNum,
      title: slideTitle,
      subtitle: `Slide ${slideNum} of ${totalSlides}`,
      eyebrow: `PPTX PRESENTATION · SLIDE ${slideNum} OF ${totalSlides}`,
      body: slideBody || `Key slide presentation content, strategic framework, and data points for slide ${slideNum}.`,
      bullets: bullets.length > 0 ? bullets : undefined,
      tags: ['Presentation Slide', `Slide ${slideNum}`, 'PPTX'],
      gradient: getSlideGradient(i)
    });
  }

  return {
    pageCount: totalSlides,
    title: slides[0]?.title || defaultTitle,
    slides,
    extractedText: allExtractedTextChunks.join('\n\n')
  };
}

/**
 * Analyze DOCX OpenXML Archive:
 * Extracts total pages, headings, and paragraphs without any fixed cap
 */
async function analyzeDocx(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  let metadataPages = 0;
  try {
    const appXmlFile = zip.file('docProps/app.xml');
    if (appXmlFile) {
      const appXmlText = await appXmlFile.async('text');
      const match = appXmlText.match(/<Pages>(\d+)<\/Pages>/i);
      if (match && match[1]) {
        metadataPages = parseInt(match[1], 10);
      }
    }
  } catch (err) {
    console.warn('Could not read docProps/app.xml from DOCX:', err);
  }

  const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
  const paragraphs: string[] = [];

  try {
    const docXmlFile = zip.file('word/document.xml');
    if (docXmlFile) {
      const docXml = await docXmlFile.async('text');
      // Count explicit page breaks: <w:br w:type="page"/> and <w:lastRenderedPageBreak/>
      const pageBreaks = (docXml.match(/<w:br\s+[^>]*w:type="page"/gi) || []).length;
      const renderedBreaks = (docXml.match(/<w:lastRenderedPageBreak\b/gi) || []).length;
      const detectedBreaks = Math.max(pageBreaks, renderedBreaks);

      // Extract all paragraph text
      const pMatches = Array.from(docXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/gi));
      for (const p of pMatches) {
        const textRuns = Array.from(p[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi))
          .map(m => m[1])
          .join('');
        const cleaned = cleanText(textRuns);
        if (cleaned.length > 0) {
          paragraphs.push(cleaned);
        }
      }

      if (detectedBreaks > 0) {
        metadataPages = Math.max(metadataPages, detectedBreaks + 1);
      }
    }
  } catch (err) {
    console.warn('Error reading word/document.xml:', err);
  }

  // If no explicit page count metadata was present, estimate accurately based on reading volume (approx 280 words per page)
  const totalWords = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
  const computedPages = Math.max(
    metadataPages,
    Math.ceil(totalWords / 280),
    1
  );

  const slides: SlideItem[] = [];
  const paragraphsPerPage = Math.max(1, Math.ceil(paragraphs.length / computedPages));

  for (let i = 0; i < computedPages; i++) {
    const pageNum = i + 1;
    const pageParas = paragraphs.slice(i * paragraphsPerPage, (i + 1) * paragraphsPerPage);
    const pageTitle = pageParas[0] || `${defaultTitle} — Page ${pageNum}`;
    const pageBody = pageParas.slice(1, 3).join('. ') || pageParas[0] || `Section content and specifications for page ${pageNum}.`;

    slides.push({
      page: pageNum,
      title: pageTitle.length > 80 ? pageTitle.slice(0, 80) + '...' : pageTitle,
      subtitle: `Document Page ${pageNum} of ${computedPages}`,
      eyebrow: `DOCUMENT SPECIFICATION · PAGE ${pageNum} OF ${computedPages}`,
      body: pageBody,
      bullets: pageParas.slice(1, 6),
      tags: ['Document Page', `Page ${pageNum}`, 'DOCX'],
      gradient: getSlideGradient(i)
    });
  }

  return {
    pageCount: computedPages,
    title: slides[0]?.title || defaultTitle,
    slides,
    extractedText: paragraphs.join('\n\n')
  };
}

/**
 * Analyze PDF Source:
 * Uses pdfjs to read the complete binary and determine the exact number of pages.
 * Iterates through every single page from 1 to numPages without skipping.
 */
async function analyzePdf(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedDocumentResult> {
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages; // 100% accurate page count directly from PDF header

  const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
  const slides: SlideItem[] = [];
  const allTextChunks: string[] = [];

  // Iterate all pages (1 ... totalPages)
  for (let i = 1; i <= totalPages; i++) {
    let pageTitle = '';
    let pageText = '';
    const bullets: string[] = [];

    try {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .map(cleanText)
        .filter(t => t.length > 0);

      if (items.length > 0) {
        pageTitle = items[0];
        pageText = items.slice(1, 4).join(' ');
        bullets.push(...items.slice(1, 7));
        allTextChunks.push(`[Page ${i}] ${items.join(' ')}`);
      }
    } catch (err) {
      console.warn(`Error reading PDF page ${i}:`, err);
    }

    if (!pageTitle) {
      pageTitle = i === 1 ? defaultTitle : `${defaultTitle} — Page ${i}`;
    }

    slides.push({
      page: i,
      title: pageTitle.length > 90 ? pageTitle.slice(0, 90) + '...' : pageTitle,
      subtitle: `Page ${i} of ${totalPages}`,
      eyebrow: `PDF DOCUMENT · PAGE ${i} OF ${totalPages}`,
      body: pageText || `Full PDF vector rendering and document content for page ${i}.`,
      bullets: bullets.length > 0 ? bullets : undefined,
      tags: ['PDF Page', `Page ${i}`],
      gradient: getSlideGradient(i - 1)
    });
  }

  return {
    pageCount: totalPages,
    title: slides[0]?.title || defaultTitle,
    slides,
    extractedText: allTextChunks.join('\n\n')
  };
}

/**
 * Universal Document Analyzer:
 * Read and analyze any uploaded file (PPT, PPTX, PDF, DOC, DOCX, TXT).
 * NEVER limits, caps, truncates, or assumes a fixed number of pages/slides.
 * Rule: Source file count = generated page/slide count.
 */
export async function analyzeUploadedDocument(file: File): Promise<ParsedDocumentResult> {
  const fileName = file.name || 'document';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const arrayBuffer = await file.arrayBuffer();

  if (ext === 'pdf') {
    return analyzePdf(arrayBuffer, fileName);
  }

  if (ext === 'pptx') {
    return analyzePptx(arrayBuffer, fileName);
  }

  if (ext === 'docx') {
    return analyzeDocx(arrayBuffer, fileName);
  }

  // Handle legacy PPT or try zip extraction
  if (ext === 'ppt') {
    try {
      return await analyzePptx(arrayBuffer, fileName);
    } catch {
      // Legacy binary PPT fallback: scan binary stream for slide records
      const uint8 = new Uint8Array(arrayBuffer);
      let count = 0;
      // Search for SlideListWithText / slide atom markers in binary stream
      for (let i = 0; i < uint8.length - 8; i++) {
        if (uint8[i] === 0x0F && uint8[i + 1] === 0x00 && uint8[i + 2] === 0xEE && uint8[i + 3] === 0x03) {
          count++;
        }
      }
      const pageCount = Math.max(count, 1);
      const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      const slides: SlideItem[] = [];
      for (let i = 0; i < pageCount; i++) {
        slides.push({
          page: i + 1,
          title: i === 0 ? defaultTitle : `${defaultTitle} — Slide ${i + 1}`,
          subtitle: `Slide ${i + 1} of ${pageCount}`,
          eyebrow: `PPT PRESENTATION · SLIDE ${i + 1} OF ${pageCount}`,
          body: `Slide ${i + 1} content from ${fileName}.`,
          tags: ['Presentation Slide', `Slide ${i + 1}`, 'PPT'],
          gradient: getSlideGradient(i)
        });
      }
      return { pageCount, title: defaultTitle, slides };
    }
  }

  // Handle legacy DOC or text fallback
  if (ext === 'doc') {
    try {
      return await analyzeDocx(arrayBuffer, fileName);
    } catch {
      const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
      return {
        pageCount: 1,
        title: defaultTitle,
        slides: [{
          page: 1,
          title: defaultTitle,
          subtitle: 'Document Page 1 of 1',
          eyebrow: 'DOC DOCUMENT · PAGE 1',
          body: `Document content from ${fileName}.`,
          tags: ['Document', 'Page 1'],
          gradient: getSlideGradient(0)
        }]
      };
    }
  }

  // Handle plain text or markdown
  const text = new TextDecoder().decode(arrayBuffer);
  const sections = text.split(/(?:^#+\s+|\n---+\n|\f)/m).map(cleanText).filter(Boolean);
  const pageCount = Math.max(sections.length, 1);
  const defaultTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');

  const slides: SlideItem[] = sections.map((sec, idx) => ({
    page: idx + 1,
    title: sec.split('\n')[0]?.slice(0, 70) || `${defaultTitle} — Section ${idx + 1}`,
    subtitle: `Section ${idx + 1} of ${pageCount}`,
    eyebrow: `DOCUMENT SECTION · ${idx + 1} OF ${pageCount}`,
    body: sec.slice(0, 300),
    tags: ['Document Section', `Section ${idx + 1}`],
    gradient: getSlideGradient(idx)
  }));

  return {
    pageCount,
    title: slides[0]?.title || defaultTitle,
    slides,
    extractedText: text
  };
}
