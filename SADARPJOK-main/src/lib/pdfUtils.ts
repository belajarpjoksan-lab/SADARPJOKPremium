import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Standar Ukuran Kertas F4 / Folio Indonesia (215mm x 330mm)
 */
export const F4_WIDTH_MM = 215;
export const F4_HEIGHT_MM = 330;

export interface F4DocumentSection {
  id: string;
  index: number;
  title: string;
  html: string;
  orientation: 'portrait' | 'landscape';
  selected: boolean;
  isFirstSection?: boolean;
}

interface AvoidInterval {
  top: number;
  bottom: number;
  isTableRow?: boolean;
  tableLeft?: number;
  tableRight?: number;
}

/**
 * Mencari titik potong vertikal (Y) yang paling aman pada canvas
 * agar teks, rumus, gambar, atau baris tabel tidak terpotong di tengah.
 */
function findSafeSliceY(
  canvas: HTMLCanvasElement,
  targetY: number,
  minY: number,
  avoidIntervals: AvoidInterval[] = []
): { sliceY: number; cutInsideTable?: AvoidInterval } {
  const ctx = canvas.getContext('2d');
  const maxSearch = Math.min(targetY, canvas.height);
  const minSearch = Math.max(minY, Math.floor(targetY - 360));

  if (maxSearch <= minSearch) {
    return { sliceY: targetY };
  }

  // 1. Prioritaskan memotong tepat di luar batas elemen atomic (baris tabel tr, soal-item, ttd)
  let adjustedTargetY = maxSearch;
  for (const interval of avoidIntervals) {
    const rowHeight = interval.bottom - interval.top;
    // Jika elemen atomic muat dalam < 60% halaman dan garis potong membelahnya, mundurkan ke atas elemen tersebut
    if (
      interval.top < adjustedTargetY &&
      interval.bottom > adjustedTargetY &&
      interval.top >= minSearch &&
      rowHeight < (targetY - minY) * 0.65
    ) {
      adjustedTargetY = Math.max(minSearch, Math.floor(interval.top) - 2);
    }
  }

  if (!ctx) return { sliceY: adjustedTargetY };

  const searchHeight = adjustedTargetY - minSearch;
  if (searchHeight <= 4) {
    const activeTable = avoidIntervals.find(
      (iv) => iv.isTableRow && iv.top < adjustedTargetY && iv.bottom > adjustedTargetY
    );
    return { sliceY: adjustedTargetY, cutInsideTable: activeTable };
  }

  try {
    const imageData = ctx.getImageData(0, minSearch, canvas.width, searchHeight);
    const data = imageData.data;
    const width = canvas.width;

    // 2. Cari baris piksel yang benar-benar putih bersih (celah antar elemen/paragraf)
    for (let y = searchHeight - 1; y >= 0; y--) {
      let nonWhitePixels = 0;
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x += 2) {
        const idx = rowOffset + x * 4;
        const alpha = data[idx + 3];
        if (alpha > 10) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          if (r < 245 || g < 245 || b < 245) {
            nonWhitePixels++;
            if (nonWhitePixels > 2) break;
          }
        }
      }
      if (nonWhitePixels === 0) {
        const candidateY = minSearch + y;
        const insideAvoid = avoidIntervals.some(
          (iv) =>
            candidateY > iv.top + 3 &&
            candidateY < iv.bottom - 3 &&
            iv.bottom - iv.top < (targetY - minY) * 0.55
        );
        if (!insideAvoid) {
          return { sliceY: candidateY };
        }
      }
    }

    // 3. Jika sedang berada di dalam tabel (ada garis border vertikal), cari baris yang hanya memiliki garis vertikal tipis
    let bestY = adjustedTargetY;
    let minInk = Infinity;
    for (let y = searchHeight - 1; y >= Math.floor(searchHeight * 0.12); y--) {
      let darkPixels = 0;
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x += 2) {
        const idx = rowOffset + x * 4;
        const alpha = data[idx + 3];
        if (alpha > 15) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          if (r < 235 || g < 235 || b < 235) {
            darkPixels++;
          }
        }
      }
      const candidateY = minSearch + y;
      const insideSmallAvoid = avoidIntervals.some(
        (iv) =>
          candidateY > iv.top + 4 &&
          candidateY < iv.bottom - 4 &&
          iv.bottom - iv.top < (targetY - minY) * 0.35
      );
      if (!insideSmallAvoid && darkPixels < minInk) {
        minInk = darkPixels;
        bestY = candidateY;
        if (darkPixels <= 14) break;
      }
    }

    const cutTable = avoidIntervals.find(
      (iv) => iv.isTableRow && iv.top < bestY && iv.bottom > bestY
    );
    return { sliceY: bestY, cutInsideTable: cutTable };
  } catch {
    return { sliceY: adjustedTargetY };
  }
}

/**
 * Mengumpulkan interval vertikal (dalam koordinat canvas) untuk elemen-elemen
 * yang sebisa mungkin tidak dipotong di tengah halaman.
 */
function collectAvoidIntervals(rootEl: HTMLElement, canvasScale: number): AvoidInterval[] {
  const rootRect = rootEl.getBoundingClientRect();
  const selectors = [
    'tr',
    '.soal-item',
    '.question-block',
    '.signature-block',
    '.signatures',
    '.ttd-container',
    '.avoid-break',
    'blockquote',
    'figure',
    'h1, h2, h3, h4',
    '.section-header',
    '.sub-header',
    'li',
    'p'
  ];

  const elements = rootEl.querySelectorAll(selectors.join(', '));
  const intervals: AvoidInterval[] = [];

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) return;
    const top = (rect.top - rootRect.top) * canvasScale;
    const bottom = (rect.bottom - rootRect.top) * canvasScale;
    const tagName = el.tagName.toLowerCase();
    const isTableRow = tagName === 'tr';

    let tableLeft: number | undefined;
    let tableRight: number | undefined;
    if (isTableRow) {
      const parentTable = el.closest('table');
      if (parentTable) {
        const tableRect = parentTable.getBoundingClientRect();
        tableLeft = Math.max(0, (tableRect.left - rootRect.left) * canvasScale);
        tableRight = (tableRect.right - rootRect.left) * canvasScale;
      }
    }

    intervals.push({ top, bottom, isTableRow, tableLeft, tableRight });

    if (
      /^h[1-4]$/i.test(el.tagName) ||
      el.classList.contains('section-header') ||
      el.classList.contains('sub-header')
    ) {
      intervals.push({ top, bottom: bottom + 50 * canvasScale });
    }
  });

  return intervals;
}

/**
 * CSS Standar F4 Siap Cetak untuk PDF & Print Per Bagian
 */
export function getF4PrintBaseCss(orientation: 'portrait' | 'landscape' = 'portrait'): string {
  const pageWidthMm = orientation === 'landscape' ? F4_HEIGHT_MM : F4_WIDTH_MM;
  const pageHeightMm = orientation === 'landscape' ? F4_WIDTH_MM : F4_HEIGHT_MM;

  return `
    @page {
      size: ${pageWidthMm}mm ${pageHeightMm}mm;
      margin: 12mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.42;
      width: 100%;
    }
    img, svg, canvas {
      max-width: 100% !important;
      height: auto !important;
    }
    table {
      width: 100% !important;
      max-width: 100% !important;
      border-collapse: collapse !important;
      table-layout: auto;
      margin-bottom: 10px;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group !important;
    }
    tfoot {
      display: table-footer-group !important;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    th, td {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      vertical-align: top;
      padding: 5px 7px;
    }
    h1, h2, h3, h4, .section-header, .section-title, .sub-header {
      page-break-after: avoid !important;
      break-after: avoid !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .soal-item, .question-block, .signature-block, .signatures, .ttd-container {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .f4-section-break {
      page-break-before: always !important;
      break-before: page !important;
    }
    .f4-doc-kop-repeat {
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #000;
    }
  `;
}

/**
 * Menormalkan elemen tabel dan kontainer di dalam DOM offscreen agar
 * tidak ada tabel yang melebar keluar kertas F4 dan semua border tampil tegas.
 */
function normalizeDomForF4Capture(root: HTMLElement, targetWidthPx: number): void {
  root.style.width = `${targetWidthPx}px`;
  root.style.maxWidth = `${targetWidthPx}px`;
  root.style.backgroundColor = '#ffffff';
  root.style.color = '#000000';
  root.style.boxSizing = 'border-box';
  root.style.overflowX = 'hidden';

  const allContainers = root.querySelectorAll<HTMLElement>('div, section, article, main, header, footer');
  allContainers.forEach((el) => {
    el.style.maxWidth = '100%';
    el.style.boxSizing = 'border-box';
  });

  const tables = root.querySelectorAll<HTMLTableElement>('table');
  tables.forEach((table) => {
    table.style.width = '100%';
    table.style.maxWidth = '100%';
    table.style.borderCollapse = 'collapse';

    // Hitung jumlah kolom maksimum pada tabel
    let maxCols = 0;
    Array.from(table.rows).forEach((row) => {
      let cols = 0;
      Array.from(row.cells).forEach((cell) => {
        cols += cell.colSpan || 1;
      });
      if (cols > maxCols) maxCols = cols;
    });

    // Jika tabel memiliki banyak kolom (misal Kisi-kisi 10-11 kolom, Prosem, Analisis Jam),
    // sesuaikan ukuran font dan padding secara proporsional agar 100% rapi di kertas F4
    if (maxCols >= 10) {
      table.style.fontSize = '8.5pt';
      table.style.tableLayout = 'fixed';
      Array.from(table.querySelectorAll<HTMLElement>('th, td')).forEach((cell) => {
        cell.style.padding = '3px 4px';
        cell.style.lineHeight = '1.25';
      });
    } else if (maxCols >= 7) {
      table.style.fontSize = '9.5pt';
      Array.from(table.querySelectorAll<HTMLElement>('th, td')).forEach((cell) => {
        cell.style.padding = '4px 5px';
        cell.style.lineHeight = '1.3';
      });
    }

    const isNoBorderTable =
      table.classList.contains('no-border') ||
      table.classList.contains('header-table') ||
      table.classList.contains('meta-table') ||
      table.classList.contains('id-table') ||
      table.classList.contains('identitas-table') ||
      table.classList.contains('signature-table') ||
      table.classList.contains('ttd') ||
      table.getAttribute('border') === '0' ||
      table.style.border === 'none';

    if (!isNoBorderTable) {
      const cells = table.querySelectorAll<HTMLElement>('th, td');
      cells.forEach((cell) => {
        const inlineStyle = (cell.getAttribute('style') || '').toLowerCase();
        const hasNoBorder =
          cell.classList.contains('no-border') ||
          inlineStyle.includes('border: none') ||
          inlineStyle.includes('border:none') ||
          inlineStyle.includes('border: 0');
        if (!hasNoBorder && !cell.style.border && !cell.style.borderBottom && !cell.style.borderTop) {
          cell.style.border = '1px solid #000000';
        }
      });
    }
  });
}

/**
 * Memecah tabel panjang di dalam container menjadi beberapa tabel per halaman F4
 * dengan mengkloning `<thead>` secara otomatis apabila seluruh baris tabel (`<tr>`)
 * memiliki tinggi normal (< 75% tinggi halaman F4).
 * Dengan demikian, setiap halaman baru pada tabel panjang (Kisi-kisi, Prota, Prosem, Soal, Kunci)
 * akan selalu memiliki Header Tabel (`<thead>`) dan garis penutup bawah yang rapi!
 */
function splitTallTablesWithRepeatingThead(root: HTMLElement, maxPageHeightPx: number): void {
  const tables = Array.from(root.querySelectorAll<HTMLTableElement>('table'));
  const rootRect = root.getBoundingClientRect();

  for (const table of tables) {
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    if (!thead || !tbody) continue;

    const rows = Array.from(tbody.rows);
    if (rows.length <= 2) continue;

    const tableRect = table.getBoundingClientRect();
    if (tableRect.height < maxPageHeightPx * 0.65) continue;

    // Pastikan tidak ada baris tunggal yang lebih tinggi dari 70% halaman
    const hasUltraTallRow = rows.some((r) => r.getBoundingClientRect().height > maxPageHeightPx * 0.7);
    if (hasUltraTallRow) continue;

    const theadHeight = thead.getBoundingClientRect().height || 42;
    const tableTopRelative = tableRect.top - rootRect.top;
    const currentPageIndex = Math.floor(tableTopRelative / maxPageHeightPx);
    let remainingHeightInPage = (currentPageIndex + 1) * maxPageHeightPx - tableTopRelative - 18;

    // Jika sisa ruang di halaman pertama terlalu sempit untuk header + 1 baris, dorong tabel ke halaman baru
    const firstRowHeight = rows[0].getBoundingClientRect().height || 30;
    if (remainingHeightInPage < theadHeight + firstRowHeight + 16) {
      remainingHeightInPage = maxPageHeightPx - 24;
    }

    const rowGroups: HTMLTableRowElement[][] = [];
    let currentGroup: HTMLTableRowElement[] = [];
    let usedHeight = theadHeight;

    for (const row of rows) {
      const rowH = row.getBoundingClientRect().height || 28;
      const limitH = rowGroups.length === 0 ? remainingHeightInPage : maxPageHeightPx - 28;

      if (currentGroup.length > 0 && usedHeight + rowH > limitH) {
        rowGroups.push(currentGroup);
        currentGroup = [row];
        usedHeight = theadHeight + rowH;
      } else {
        currentGroup.push(row);
        usedHeight += rowH;
      }
    }
    if (currentGroup.length > 0) {
      rowGroups.push(currentGroup);
    }

    if (rowGroups.length <= 1) continue;

    // Buat fragmen berisi potongan-potongan tabel per halaman dengan thead yang diulang
    const fragment = document.createDocumentFragment();
    rowGroups.forEach((group, groupIdx) => {
      const clonedTable = table.cloneNode(false) as HTMLTableElement;
      const colgroup = table.querySelector('colgroup');
      if (colgroup) {
        clonedTable.appendChild(colgroup.cloneNode(true));
      }
      clonedTable.appendChild(thead.cloneNode(true));
      const newTbody = document.createElement('tbody');
      group.forEach((tr) => {
        newTbody.appendChild(tr.cloneNode(true));
      });
      clonedTable.appendChild(newTbody);

      if (groupIdx > 0) {
        const spacer = document.createElement('div');
        spacer.setAttribute('data-f4-table-page-chunk', String(groupIdx + 1));
        spacer.style.paddingTop = '6px';
        spacer.style.marginTop = '4px';
        fragment.appendChild(spacer);
      }
      fragment.appendChild(clonedTable);
    });

    table.parentNode?.replaceChild(fragment, table);
  }
}

/**
 * Mengekstrak judul bagian yang bersih dari elemen HTML
 */
function extractSectionTitleFromNode(el: HTMLElement, fallbackIndex: number): string {
  const explicitAttr =
    el.getAttribute('data-f4-section') ||
    el.getAttribute('data-section-title') ||
    el.getAttribute('title');
  if (explicitAttr && explicitAttr.trim()) {
    return explicitAttr.trim();
  }

  // Cari heading di dalam elemen
  const headingSelectors = [
    '[data-f4-section]',
    'h1',
    'h2',
    'h3',
    'h4',
    '.section-header',
    '.section-title',
    '.sub-header',
    '.bab-title',
    'strong',
    'b'
  ];

  for (const sel of headingSelectors) {
    const found = el.matches(sel) ? el : el.querySelector<HTMLElement>(sel);
    if (found && found.textContent) {
      const clean = found.textContent.replace(/\s+/g, ' ').trim();
      if (clean.length >= 3 && clean.length <= 110) {
        return clean;
      }
    }
  }

  const rawText = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (rawText.length > 0) {
    return rawText.length > 65 ? `${rawText.slice(0, 62)}...` : rawText;
  }

  return `Bagian ${fallbackIndex}`;
}

/**
 * Mendeteksi apakah suatu bagian HTML sebaiknya dicetak Landscape F4 (330x215mm)
 * misalnya karena memuat tabel lebar (Kisi-kisi >= 9 kolom, Prosem, Jadwal, Analisis Jam).
 */
function detectBestSectionOrientation(
  sectionHtml: string,
  defaultOrientation: 'portrait' | 'landscape'
): 'portrait' | 'landscape' {
  const temp = document.createElement('div');
  temp.innerHTML = sectionHtml;

  const explicitEl = temp.querySelector('[data-f4-orientation]');
  const explicitVal =
    temp.firstElementChild?.getAttribute('data-f4-orientation') ||
    explicitEl?.getAttribute('data-f4-orientation');
  if (explicitVal === 'landscape' || explicitVal === 'portrait') {
    return explicitVal;
  }

  if (temp.querySelector('.landscape-section')) {
    return 'landscape';
  }

  // Cek jumlah kolom tabel
  const tables = Array.from(temp.querySelectorAll('table'));
  for (const table of tables) {
    let maxCols = 0;
    Array.from(table.rows).forEach((r) => {
      let c = 0;
      Array.from(r.cells).forEach((cell) => {
        c += cell.colSpan || 1;
      });
      if (c > maxCols) maxCols = c;
    });
    if (maxCols >= 10) {
      return 'landscape';
    }
  }

  return defaultOrientation;
}

/**
 * Mem-parsing HTML dokumen dari menu mana pun menjadi daftar Bagian (F4DocumentSection)
 * beserta CSS asli dan Kop/Identitas dokumen.
 */
export function parseDocumentSections(
  rawHtml: string,
  defaultTitle = 'Dokumen F4',
  defaultOrientation: 'portrait' | 'landscape' = 'portrait'
): {
  sections: F4DocumentSection[];
  styles: string;
  docHeaderHtml: string;
  documentTitle: string;
} {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  const styleNodes = Array.from(doc.querySelectorAll('style'));
  const styles = styleNodes.map((s) => s.textContent || '').join('\n');
  const parsedTitle = doc.querySelector('title')?.textContent?.trim() || defaultTitle;

  const body = doc.body;
  // Bersihkan script atau tombol non-cetak
  body.querySelectorAll('script, .no-print, button').forEach((el) => el.remove());

  // Jika body hanya membungkus 1 div utama (seperti <div class="container"> atau <div style="...">),
  // buka pembungkus tersebut agar anak-anaknya bisa dianalisis per bagian
  let workRoot: HTMLElement = body;
  while (
    workRoot.children.length === 1 &&
    workRoot.firstElementChild instanceof HTMLElement &&
    ['DIV', 'MAIN', 'ARTICLE', 'SECTION'].includes(workRoot.firstElementChild.tagName) &&
    !workRoot.firstElementChild.hasAttribute('data-f4-section') &&
    !workRoot.firstElementChild.classList.contains('slide-container')
  ) {
    workRoot = workRoot.firstElementChild;
  }

  // Ekstrak Kop / Identitas awal dokumen (untuk opsi "Sertakan Kop di Setiap Bagian")
  let docHeaderHtml = '';
  const kopEl =
    workRoot.querySelector<HTMLElement>('.header, .kop, .kop-surat, [data-f4-kop]') ||
    (workRoot.firstElementChild?.tagName === 'H1' || workRoot.firstElementChild?.tagName === 'H2'
      ? workRoot.firstElementChild
      : null);
  if (kopEl) {
    docHeaderHtml = kopEl.outerHTML;
  }

  const rawSections: { title: string; html: string; orientation?: 'portrait' | 'landscape' }[] = [];

  // 1. Prioritas Utama: Elemen dengan atribut eksplisit [data-f4-section]
  const explicitSectionNodes = Array.from(
    workRoot.querySelectorAll<HTMLElement>('[data-f4-section]')
  ).filter((el) => !el.parentElement?.closest('[data-f4-section]'));
  if (explicitSectionNodes.length > 0) {
    // Cek apakah ada elemen pengantar/Kop sebelum [data-f4-section] pertama
    const firstExplicit = explicitSectionNodes[0];
    const preNodes: string[] = [];
    for (const child of Array.from(workRoot.children)) {
      if (child === firstExplicit || child.contains(firstExplicit)) break;
      if (child.textContent?.trim() || child.querySelector('img, table')) {
        preNodes.push(child.outerHTML);
      }
    }
    const prefixHtml = preNodes.join('\n');
    if (prefixHtml && !docHeaderHtml) {
      docHeaderHtml = prefixHtml;
    }

    explicitSectionNodes.forEach((secEl, idx) => {
      const title = secEl.getAttribute('data-f4-section')?.trim() || extractSectionTitleFromNode(secEl, idx + 1);
      const orientAttr = secEl.getAttribute('data-f4-orientation') as 'portrait' | 'landscape' | null;
      const baseInner =
        secEl.tagName === 'DIV' || secEl.tagName === 'SECTION'
          ? secEl.innerHTML
          : secEl.outerHTML;
      const htmlContent =
        idx === 0 && prefixHtml && !baseInner.includes(prefixHtml)
          ? `${prefixHtml}\n${baseInner}`
          : baseInner;

      rawSections.push({
        title,
        html: htmlContent,
        orientation: orientAttr || undefined
      });
    });
  }

  // 2. Prioritas Kedua: Slide Presentasi (.slide-container)
  if (rawSections.length === 0) {
    const slides = Array.from(workRoot.querySelectorAll<HTMLElement>('.slide-container'));
    if (slides.length > 0) {
      slides.forEach((slide, idx) => {
        const title = extractSectionTitleFromNode(slide, idx + 1);
        rawSections.push({
          title: title.startsWith('Slide') ? title : `Slide ${idx + 1}: ${title}`,
          html: slide.outerHTML
        });
      });
    }
  }

  // 3. Prioritas Ketiga: Pemisah Halaman Eksplisit (.page-break, page-break-before: always, page-break-after: always)
  if (rawSections.length === 0) {
    const children = Array.from(workRoot.children) as HTMLElement[];
    const hasExplicitPageBreak = children.some((child) => {
      const style = (child.getAttribute('style') || '').toLowerCase();
      return (
        child.classList.contains('page-break') ||
        child.classList.contains('section-break') ||
        child.classList.contains('landscape-section') ||
        style.includes('page-break-before: always') ||
        style.includes('page-break-before:always') ||
        style.includes('page-break-after: always') ||
        style.includes('page-break-after:always') ||
        style.includes('break-before: page')
      );
    });

    if (hasExplicitPageBreak) {
      let currentChunk: HTMLElement[] = [];
      const flushChunk = () => {
        if (currentChunk.length === 0) return;
        const wrapper = document.createElement('div');
        currentChunk.forEach((node) => wrapper.appendChild(node.cloneNode(true)));
        if (wrapper.textContent?.trim() || wrapper.querySelector('img, table, svg')) {
          const title = extractSectionTitleFromNode(wrapper, rawSections.length + 1);
          rawSections.push({
            title,
            html: wrapper.innerHTML
          });
        }
        currentChunk = [];
      };

      for (const child of children) {
        const style = (child.getAttribute('style') || '').toLowerCase();
        const isEmptyPageBreakDiv =
          (child.classList.contains('page-break') ||
            style.includes('page-break-before') ||
            style.includes('page-break-after')) &&
          !child.textContent?.trim() &&
          !child.querySelector('table, img');

        const startsNewPage =
          child.classList.contains('landscape-section') ||
          style.includes('page-break-before: always') ||
          style.includes('page-break-before:always') ||
          style.includes('break-before: page');

        const endsCurrentPage =
          style.includes('page-break-after: always') ||
          style.includes('page-break-after:always') ||
          style.includes('break-after: page');

        if (isEmptyPageBreakDiv) {
          flushChunk();
          continue;
        }

        if (startsNewPage && currentChunk.length > 0) {
          flushChunk();
        }

        currentChunk.push(child);

        if (endsCurrentPage) {
          flushChunk();
        }
      }
      flushChunk();
    }
  }

  // 4. Prioritas Keempat: Deteksi Sub-Bagian / Heading Utama (H2, H3, .section-header, .section-title, Bagian A/B/C/I/II/III)
  if (rawSections.length <= 1) {
    const children = Array.from(workRoot.children) as HTMLElement[];
    const headingIndices: number[] = [];

    children.forEach((child, idx) => {
      const tag = child.tagName;
      const text = (child.textContent || '').replace(/\s+/g, ' ').trim();
      const isHeadingTag =
        tag === 'H2' ||
        tag === 'H3' ||
        child.classList.contains('section-header') ||
        child.classList.contains('section-title') ||
        child.classList.contains('sub-header');

      const isNumberedSectionTitle =
        (tag === 'P' || tag === 'DIV' || tag === 'H4') &&
        text.length > 3 &&
        text.length < 95 &&
        (/^(BAGIAN|LAMPIRAN|BAB)\s+[A-Z0-9IVX]+/i.test(text) ||
          /^[I|V|X]{1,4}\.\s+[A-Z]/i.test(text) ||
          /^[A-F]\.\s+[A-Z]/i.test(text));

      if (isHeadingTag || isNumberedSectionTitle) {
        headingIndices.push(idx);
      }
    });

    if (headingIndices.length >= 2) {
      rawSections.length = 0; // Reset jika sebelumnya hanya 1 bagian penuh
      const preHeaderNodes = children.slice(0, headingIndices[0]);
      const preWrapper = document.createElement('div');
      preHeaderNodes.forEach((n) => preWrapper.appendChild(n.cloneNode(true)));
      const preHtml = preWrapper.innerHTML.trim();
      if (preHtml && !docHeaderHtml) {
        docHeaderHtml = preHtml;
      }

      for (let i = 0; i < headingIndices.length; i++) {
        const startIdx = headingIndices[i];
        const endIdx = i + 1 < headingIndices.length ? headingIndices[i + 1] : children.length;
        const sliceNodes = children.slice(startIdx, endIdx);
        const wrapper = document.createElement('div');
        if (i === 0 && preHtml) {
          preHeaderNodes.forEach((n) => wrapper.appendChild(n.cloneNode(true)));
        }
        sliceNodes.forEach((n) => wrapper.appendChild(n.cloneNode(true)));

        const headingNode = children[startIdx];
        const title = extractSectionTitleFromNode(headingNode, i + 1);
        rawSections.push({
          title,
          html: wrapper.innerHTML
        });
      }
    }
  }

  // 5. Fallback: Jika dokumen merupakan 1 bagian utuh (misal 1 Tabel Prota/Jurnal/Absensi)
  if (rawSections.length === 0) {
    rawSections.push({
      title: parsedTitle || 'Dokumen Utama (F4)',
      html: workRoot.innerHTML
    });
  }

  const finalSections: F4DocumentSection[] = rawSections.map((sec, idx) => {
    const cleanTitle = sec.title.replace(/^\d+\.\s*\d+\.\s*/, '').trim() || `Bagian ${idx + 1}`;
    return {
      id: `f4-sec-${idx + 1}`,
      index: idx + 1,
      title: cleanTitle,
      html: sec.html,
      orientation: sec.orientation || detectBestSectionOrientation(sec.html, defaultOrientation),
      selected: true,
      isFirstSection: idx === 0
    };
  });

  return {
    sections: finalSections,
    styles,
    docHeaderHtml,
    documentTitle: parsedTitle
  };
}

/**
 * Merender daftar bagian F4 terpilih menjadi file PDF berformat F4 (215mm x 330mm)
 * di mana setiap bagian dimulai pada halaman F4 baru yang rapi.
 */
export async function renderSectionsToF4Pdf(
  sections: F4DocumentSection[],
  styles: string,
  filename: string,
  options: {
    docHeaderHtml?: string;
    includeHeaderOnEverySection?: boolean;
    showPageNumbers?: boolean;
    documentTitle?: string;
  } = {}
): Promise<void> {
  const activeSections = sections.filter((s) => s.selected);
  if (activeSections.length === 0) return;

  const firstOrientation = activeSections[0].orientation || 'portrait';
  const pdf = new jsPDF({
    orientation: firstOrientation,
    unit: 'mm',
    format: [F4_WIDTH_MM, F4_HEIGHT_MM],
    compress: true
  });

  let isVeryFirstPdfPage = true;
  let globalPageNumber = 0;

  // Hitung halaman per bagian terlebih dahulu dengan merender masing-masing bagian
  for (let sIdx = 0; sIdx < activeSections.length; sIdx++) {
    const section = activeSections[sIdx];
    const orientation = section.orientation || 'portrait';

    const pageWidthMm = orientation === 'landscape' ? F4_HEIGHT_MM : F4_WIDTH_MM;
    const pageHeightMm = orientation === 'landscape' ? F4_WIDTH_MM : F4_HEIGHT_MM;

    const marginTopMm = 12;
    const marginBottomMm = 14;
    const marginLeftMm = 14;
    const marginRightMm = 14;

    const contentWidthMm = pageWidthMm - marginLeftMm - marginRightMm;
    const contentHeightMm = pageHeightMm - marginTopMm - marginBottomMm;

    // Lebar virtual DOM yang ideal untuk kertas F4 (96 DPI equivalen)
    const targetWidthPx = orientation === 'landscape' ? 1140 : 794;
    const maxPageHeightDomPx = Math.floor((contentHeightMm / contentWidthMm) * targetWidthPx);

    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '-14000px';
    host.style.width = `${targetWidthPx}px`;
    host.style.backgroundColor = '#ffffff';
    host.style.color = '#000000';
    host.style.zIndex = '-9999';
    host.style.margin = '0';
    host.style.padding = '8px 10px';
    host.style.boxSizing = 'border-box';

    const shouldPrependHeader =
      options.includeHeaderOnEverySection &&
      !section.isFirstSection &&
      options.docHeaderHtml &&
      !section.html.includes(options.docHeaderHtml);

    host.innerHTML = `
      <style>
        ${styles}
        ${getF4PrintBaseCss(orientation)}
        .page-break, .section-break {
          display: none !important;
        }
      </style>
      <div class="f4-section-render-root">
        ${shouldPrependHeader ? `<div class="f4-doc-kop-repeat">${options.docHeaderHtml}</div>` : ''}
        ${section.html}
      </div>
    `;

    document.body.appendChild(host);

    try {
      await new Promise((r) => setTimeout(r, 150));

      const images = Array.from(host.querySelectorAll('img'));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
        })
      );

      normalizeDomForF4Capture(host, targetWidthPx);

      // Pecah tabel panjang menjadi potongan per halaman dengan pengulangan <thead> otomatis
      splitTallTablesWithRepeatingThead(host, maxPageHeightDomPx);

      await new Promise((r) => setTimeout(r, 60));

      const rawHostHeight = Math.max(host.scrollHeight, host.offsetHeight, 800);
      const canvasScale =
        rawHostHeight > 10000 ? 1.15 : rawHostHeight > 5000 ? 1.45 : 1.75;
      const avoidIntervals = collectAvoidIntervals(host, canvasScale);

      // Tambahkan interval proteksi untuk chunk tabel yang sudah dibagi per halaman
      const tableChunks = Array.from(host.querySelectorAll<HTMLElement>('table'));
      const hostRect = host.getBoundingClientRect();
      tableChunks.forEach((tbl) => {
        const rect = tbl.getBoundingClientRect();
        const h = rect.height * canvasScale;
        const pageH = maxPageHeightDomPx * canvasScale;
        if (h > 20 && h <= pageH * 0.96) {
          avoidIntervals.push({
            top: (rect.top - hostRect.top) * canvasScale,
            bottom: (rect.bottom - hostRect.top) * canvasScale,
            isTableRow: false
          });
        }
      });

      const canvas = await html2canvas(host, {
        scale: canvasScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: targetWidthPx,
        windowWidth: targetWidthPx
      });

      const pxPerMm = canvas.width / contentWidthMm;
      const pageHeightPx = Math.floor(contentHeightMm * pxPerMm);

      const slices: {
        startY: number;
        endY: number;
        cutInsideTable?: AvoidInterval;
        prevCutInsideTable?: AvoidInterval;
      }[] = [];

      let currentY = 0;
      let prevCutTable: AvoidInterval | undefined;

      while (currentY < canvas.height - 6) {
        const rawEndY = currentY + pageHeightPx;
        if (rawEndY >= canvas.height - 6) {
          slices.push({
            startY: currentY,
            endY: canvas.height,
            prevCutInsideTable: prevCutTable
          });
          break;
        }

        const { sliceY, cutInsideTable } = findSafeSliceY(
          canvas,
          rawEndY,
          currentY + Math.floor(pageHeightPx * 0.38),
          avoidIntervals
        );

        const safeEndY = sliceY > currentY + 50 ? sliceY : rawEndY;
        slices.push({
          startY: currentY,
          endY: safeEndY,
          cutInsideTable,
          prevCutInsideTable: prevCutTable
        });

        prevCutTable = cutInsideTable;
        currentY = safeEndY;
      }

      for (let pIdx = 0; pIdx < slices.length; pIdx++) {
        const slice = slices[pIdx];
        const sliceHeightPx = slice.endY - slice.startY;
        if (sliceHeightPx <= 4) continue;

        if (!isVeryFirstPdfPage) {
          pdf.addPage([F4_WIDTH_MM, F4_HEIGHT_MM], orientation);
        }
        isVeryFirstPdfPage = false;
        globalPageNumber++;

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const pageCtx = pageCanvas.getContext('2d');

        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            slice.startY,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );

          // Tutup garis tabel atas/bawah jika ada sel yang terpaksa terpotong karena tingginya > 1 halaman F4
          if (slice.prevCutInsideTable) {
            const leftX = slice.prevCutInsideTable.tableLeft ?? 0;
            const rightX = slice.prevCutInsideTable.tableRight ?? pageCanvas.width;
            pageCtx.strokeStyle = '#000000';
            pageCtx.lineWidth = 2;
            pageCtx.beginPath();
            pageCtx.moveTo(leftX, 1);
            pageCtx.lineTo(rightX, 1);
            pageCtx.stroke();
          }

          if (slice.cutInsideTable) {
            const leftX = slice.cutInsideTable.tableLeft ?? 0;
            const rightX = slice.cutInsideTable.tableRight ?? pageCanvas.width;
            pageCtx.strokeStyle = '#000000';
            pageCtx.lineWidth = 2;
            pageCtx.beginPath();
            pageCtx.moveTo(leftX, sliceHeightPx - 1);
            pageCtx.lineTo(rightX, sliceHeightPx - 1);
            pageCtx.stroke();
          }

          const imgData = pageCanvas.toDataURL('image/jpeg', 0.94);
          const sliceHeightMm = sliceHeightPx / pxPerMm;
          pdf.addImage(
            imgData,
            'JPEG',
            marginLeftMm,
            marginTopMm,
            contentWidthMm,
            sliceHeightMm,
            undefined,
            'FAST'
          );

          if (options.showPageNumbers !== false) {
            pdf.setFont('times', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(95, 95, 95);
            const cleanSecTitle =
              section.title.length > 55 ? `${section.title.slice(0, 52)}...` : section.title;
            pdf.text(
              `F4 (215 × 330 mm) — ${cleanSecTitle}`,
              marginLeftMm,
              pageHeightMm - 6
            );
            pdf.text(
              `Bagian ${sIdx + 1}/${activeSections.length} • Hal. ${pIdx + 1}/${slices.length} (Total Hal. ${globalPageNumber})`,
              pageWidthMm - marginRightMm,
              pageHeightMm - 6,
              { align: 'right' }
            );
          }
        }
        // Bebaskan memori canvas halaman segera
        pageCanvas.width = 0;
        pageCanvas.height = 0;
      }
      // Bebaskan memori canvas bagian segera agar tidak terjadi OOM pada browser
      canvas.width = 0;
      canvas.height = 0;
    } finally {
      if (document.body.contains(host)) {
        document.body.removeChild(host);
      }
    }
    await new Promise((r) => setTimeout(r, 25));
  }

  const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(safeFilename);
}

/**
 * Mencetak daftar bagian F4 terpilih menggunakan iframe terisolasi
 * di mana setiap bagian otomatis dimulai pada halaman kertas F4 baru (215mm x 330mm).
 */
export function executePrintF4Sections(
  sections: F4DocumentSection[],
  styles: string,
  title = 'Cetak Dokumen F4 (215 x 330 mm)',
  options: {
    docHeaderHtml?: string;
    includeHeaderOnEverySection?: boolean;
  } = {}
): void {
  const activeSections = sections.filter((s) => s.selected);
  if (activeSections.length === 0) return;

  const primaryOrientation = activeSections[0].orientation || 'portrait';

  const oldIframe = document.getElementById('f4-print-iframe') as HTMLIFrameElement | null;
  if (oldIframe && oldIframe.parentNode) {
    oldIframe.parentNode.removeChild(oldIframe);
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'f4-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) return;

  const sectionsHtml = activeSections
    .map((sec, idx) => {
      const shouldPrependHeader =
        options.includeHeaderOnEverySection &&
        !sec.isFirstSection &&
        options.docHeaderHtml &&
        !sec.html.includes(options.docHeaderHtml);

      const pageClass = idx > 0 ? 'f4-section-break' : '';
      const orientClass =
        sec.orientation === 'landscape' ? 'f4-orient-landscape' : 'f4-orient-portrait';

      return `
        <section class="f4-print-section ${pageClass} ${orientClass}" data-section-index="${idx + 1}">
          ${shouldPrependHeader ? `<div class="f4-doc-kop-repeat">${options.docHeaderHtml}</div>` : ''}
          ${sec.html}
        </section>
      `;
    })
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <title>${title}</title>
      <style>
        ${styles}
        ${getF4PrintBaseCss(primaryOrientation)}
        @page f4-portrait-page {
          size: 215mm 330mm;
          margin: 12mm 14mm 14mm 14mm;
        }
        @page f4-landscape-page {
          size: 330mm 215mm;
          margin: 12mm 14mm 14mm 14mm;
        }
        .f4-orient-portrait {
          page: f4-portrait-page;
        }
        .f4-orient-landscape {
          page: f4-landscape-page;
        }
        .f4-print-section {
          width: 100%;
          box-sizing: border-box;
        }
        .page-break, .section-break {
          display: none !important;
        }
      </style>
    </head>
    <body>
      ${sectionsHtml}
    </body>
    </html>
  `);
  iframeDoc.close();

  const triggerPrint = () => {
    try {
      if (iframeDoc.body) {
        const targetW = primaryOrientation === 'landscape' ? 1140 : 794;
        normalizeDomForF4Capture(iframeDoc.body, targetW);
        iframeDoc.body.style.width = '100%';
        iframeDoc.body.style.maxWidth = '100%';
      }
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Gagal mencetak dokumen F4:', err);
    }
  };

  setTimeout(triggerPrint, 450);
}

/**
 * Menyusun dokumen Microsoft Word (.doc) berformat Kertas F4 / Folio Indonesia (215mm x 330mm)
 * dari daftar bagian (F4DocumentSection) terpilih.
 * Mendukung orientasi campuran (Portrait F4 609.45pt x 935.43pt & Landscape F4 935.43pt x 609.45pt)
 * antar bagian menggunakan Microsoft Word Section Breaks, pengulangan header tabel (<thead>),
 * proteksi baris tabel agar tidak terpotong (cantSplit), dan pengulangan Kop dokumen.
 */
export function buildF4WordDocumentFromSections(
  sections: F4DocumentSection[],
  styles: string,
  documentTitle = 'Dokumen_Administrasi_Guru_F4',
  options: {
    docHeaderHtml?: string;
    includeHeaderOnEverySection?: boolean;
  } = {}
): string {
  const activeSections = sections.filter((s) => s.selected);
  const targetSections = activeSections.length > 0 ? activeSections : sections.slice(0, 1);

  const normalizeContainerForWordF4 = (
    container: HTMLElement,
    orientation: 'portrait' | 'landscape'
  ) => {
    container.querySelectorAll('script, .no-print, button').forEach((el) => el.remove());

    // Hilangkan batas lebar container agar mengisi penuh kertas F4
    container.querySelectorAll<HTMLElement>('div, section, article, main').forEach((el) => {
      const st = el.getAttribute('style') || '';
      if (/max-width\s*:/i.test(st)) {
        el.setAttribute('style', st.replace(/max-width\s*:\s*[^;]+;?/gi, 'width: 100%;'));
      }
    });

    // Ubah elemen .page-break internal menjadi page-break Word
    container.querySelectorAll('.page-break, .section-break').forEach((pb) => {
      const br = container.ownerDocument.createElement('br');
      br.setAttribute('clear', 'all');
      br.setAttribute('style', 'page-break-before:always; mso-special-character:line-break;');
      pb.replaceWith(br);
    });

    // Rapikan semua tabel agar garis, padding, dan lebar proporsional di Microsoft Word F4
    container.querySelectorAll<HTMLTableElement>('table').forEach((tbl) => {
      const inlineStyle = (tbl.getAttribute('style') || '').toLowerCase();
      const isNoBorderTable =
        tbl.classList.contains('no-border') ||
        tbl.classList.contains('info-grid') ||
        tbl.classList.contains('signature-grid') ||
        tbl.getAttribute('border') === '0' ||
        inlineStyle.includes('border: none') ||
        inlineStyle.includes('border:none');

      // Hitung jumlah kolom maksimum pada tabel
      let maxCols = 0;
      Array.from(tbl.rows).forEach((r) => {
        let c = 0;
        Array.from(r.cells).forEach((cell) => {
          c += cell.colSpan || 1;
        });
        if (c > maxCols) maxCols = c;
      });

      const isDenseTable = maxCols >= 10;
      const isMediumTable = maxCols >= 7 && maxCols < 10;
      const cellFontSize = isDenseTable
        ? '7.5pt'
        : isMediumTable || orientation === 'landscape'
        ? '8.5pt'
        : '9.5pt';
      const cellPadding = isDenseTable
        ? '2.5pt 3pt'
        : isMediumTable
        ? '3.5pt 4.5pt'
        : '4.5pt 6pt';

      tbl.setAttribute('width', '100%');
      if (!isNoBorderTable) {
        tbl.setAttribute('border', '1');
        tbl.setAttribute('cellspacing', '0');
        tbl.setAttribute('cellpadding', isDenseTable ? '2' : '4');
      }

      tbl.setAttribute(
        'style',
        `${tbl.getAttribute('style') || ''}; width: 100%; border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-padding-alt: ${cellPadding};`
      );

      const thead = tbl.querySelector('thead');
      if (thead) {
        thead.setAttribute(
          'style',
          `${thead.getAttribute('style') || ''}; display: table-header-group;`
        );
        Array.from(thead.rows).forEach((tr, rIdx) => {
          tr.setAttribute(
            'style',
            `${tr.getAttribute('style') || ''}; ${
              rIdx === 0 ? 'mso-yfti-irow: 0; mso-yfti-firstrow: yes;' : ''
            } page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;`
          );
        });
      }

      Array.from(tbl.rows).forEach((tr) => {
        const trStyle = tr.getAttribute('style') || '';
        if (!/mso-yfti-row-cant-split/i.test(trStyle)) {
          tr.setAttribute(
            'style',
            `${trStyle}; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;`
          );
        }
      });

      Array.from(tbl.querySelectorAll<HTMLTableCellElement>('th, td')).forEach((cell) => {
        const cStyle = cell.getAttribute('style') || '';
        const hasExplicitNone =
          /border\s*:\s*none|border\s*:\s*0/i.test(cStyle) ||
          cell.classList.contains('no-border');

        let borderAddon = '';
        if (!isNoBorderTable && !hasExplicitNone && !/border\s*:/i.test(cStyle)) {
          borderAddon =
            cell.tagName === 'TH'
              ? 'border: 1pt solid #334155; mso-border-alt: solid #334155 0.75pt;'
              : 'border: 1pt solid #64748b; mso-border-alt: solid #64748b 0.5pt;';
        } else if (isNoBorderTable && !/border\s*:/i.test(cStyle)) {
          borderAddon = 'border: none;';
        }

        const fontAddon = !/font-size\s*:/i.test(cStyle) ? `font-size: ${cellFontSize};` : '';
        const padAddon = !/padding\s*:/i.test(cStyle) ? `padding: ${cellPadding};` : '';
        const valignAddon = !/vertical-align\s*:/i.test(cStyle)
          ? `vertical-align: ${cell.tagName === 'TH' ? 'middle' : 'top'};`
          : '';

        cell.setAttribute(
          'style',
          `${cStyle}; ${borderAddon} ${fontAddon} ${padAddon} ${valignAddon} word-wrap: break-word;`
        );
      });
    });

    // Proteksi blok tanda tangan dan item soal agar tidak terbelah di tengah halaman F4
    container
      .querySelectorAll<HTMLElement>('.signature-grid, .signatures, .soal-item')
      .forEach((el) => {
        el.setAttribute(
          'style',
          `${el.getAttribute('style') || ''}; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;`
        );
      });
  };

  const sectionBlocks: string[] = [];
  let primaryOrientation: 'portrait' | 'landscape' =
    targetSections[0]?.orientation || 'portrait';

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();

    targetSections.forEach((sec, idx) => {
      const orient = sec.orientation || 'portrait';
      if (idx === 0) primaryOrientation = orient;

      const shouldPrependHeader =
        options.includeHeaderOnEverySection &&
        !sec.isFirstSection &&
        options.docHeaderHtml &&
        !sec.html.includes(options.docHeaderHtml);

      const rawSecHtml = `${
        shouldPrependHeader
          ? `<div class="f4-doc-kop-repeat" style="margin-bottom: 10pt;">${options.docHeaderHtml}</div>`
          : ''
      }${sec.html}`;

      const doc = parser.parseFromString(`<body>${rawSecHtml}</body>`, 'text/html');
      normalizeContainerForWordF4(doc.body, orient);

      const sectionClass = orient === 'landscape' ? 'SectionLandscape' : 'SectionPortrait';
      const safeTitle = (sec.title || `Bagian ${idx + 1}`).replace(/"/g, '&quot;');
      sectionBlocks.push(
        `<div class="${sectionClass}" data-f4-section="${safeTitle}" data-f4-orientation="${orient}">${doc.body.innerHTML}</div>`
      );
    });
  } else {
    targetSections.forEach((sec, idx) => {
      const orient = sec.orientation || 'portrait';
      const sectionClass = orient === 'landscape' ? 'SectionLandscape' : 'SectionPortrait';
      const safeTitle = (sec.title || `Bagian ${idx + 1}`).replace(/"/g, '&quot;');
      sectionBlocks.push(
        `<div class="${sectionClass}" data-f4-section="${safeTitle}" data-f4-orientation="${orient}">${sec.html}</div>`
      );
    });
  }

  const cleanedStyles = (styles || '')
    .replace(/@page\s*[^{]*\{[^}]*\}/gi, '')
    .replace(/div\.Section1\s*\{[^}]*\}/gi, '');

  const defaultCssPageSize =
    primaryOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm';
  const defaultCssMargin =
    primaryOrientation === 'landscape' ? '10mm 12mm 10mm 12mm' : '12mm 14mm 12mm 14mm';

  const joinedBodyHtml = sectionBlocks.join(
    '\n<br clear="all" style="page-break-before:always; mso-break-type:section-break" />\n'
  );

  return `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${documentTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:TrackMoves>false</w:TrackMoves>
      <w:TrackFormatting/>
      <w:ValidateAgainstSchemas/>
      <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
      <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
      <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: ${defaultCssPageSize};
      margin: ${defaultCssMargin};
    }
    @page SectionPortrait {
      size: 609.45pt 935.43pt; /* F4 / Folio Indonesia Portrait (215mm x 330mm) */
      margin: 34.0pt 39.7pt 34.0pt 39.7pt;
      mso-header-margin: 22.0pt;
      mso-footer-margin: 22.0pt;
      mso-page-orientation: portrait;
      mso-paper-source: 0;
    }
    div.SectionPortrait {
      page: SectionPortrait;
      width: 100%;
    }
    @page SectionLandscape {
      size: 935.43pt 609.45pt; /* F4 / Folio Indonesia Landscape (330mm x 215mm) */
      margin: 28.35pt 34.0pt 28.35pt 34.0pt;
      mso-header-margin: 18.0pt;
      mso-footer-margin: 18.0pt;
      mso-page-orientation: landscape;
      mso-paper-orientation: landscape;
      mso-paper-source: 0;
    }
    div.SectionLandscape {
      page: SectionLandscape;
      width: 100%;
    }
    body {
      font-family: "Times New Roman", "Arial", serif;
      font-size: 10.5pt;
      color: #0f172a;
      line-height: 1.42;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 13.5pt;
      color: #0f172a;
      margin-top: 6pt;
      margin-bottom: 4pt;
      text-transform: uppercase;
      text-align: center;
      font-weight: bold;
    }
    h2 {
      font-size: 11.5pt;
      color: #0f172a;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    h3 {
      font-size: 10.5pt;
      color: #1e293b;
      font-weight: bold;
      margin-top: 8pt;
      margin-bottom: 4pt;
    }
    p {
      margin-top: 0;
      margin-bottom: 4pt;
    }
    .info-box {
      background-color: #f8fafc;
      border: 1pt solid #cbd5e1;
      padding: 8pt;
      margin-bottom: 8pt;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6pt;
    }
    .info-grid td {
      border: none !important;
      padding: 2pt 4pt;
      font-size: 9.5pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4pt;
      margin-bottom: 8pt;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      mso-yfti-row-cant-split: cantSplit;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
      font-size: 9.5pt;
      border: 1pt solid #334155;
      padding: 4.5pt 6pt;
      text-align: left;
      vertical-align: middle;
    }
    td {
      border: 1pt solid #64748b;
      padding: 4.5pt 6pt;
      font-size: 9.5pt;
      color: #0f172a;
      vertical-align: top;
      word-wrap: break-word;
    }
    div.SectionLandscape table,
    div.SectionLandscape th,
    div.SectionLandscape td {
      font-size: 8.5pt;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 5pt;
      padding-left: 16pt;
    }
    li {
      margin-bottom: 2.5pt;
    }
    .signature-grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20pt;
      page-break-inside: avoid;
    }
    .signature-grid td {
      border: none !important;
      text-align: center;
      width: 50%;
      padding-top: 6pt;
    }
    .bg-row-alt {
      background-color: #f8fafc;
    }
    ${cleanedStyles}
  </style>
</head>
<body>
${joinedBodyHtml}
</body>
</html>`;
}

/**
 * Mengunduh string HTML Word (.doc) secara langsung ke browser.
 */
export function triggerWordDocBlobDownload(wordDocHtml: string, filename: string): void {
  const cleanBase = filename.replace(/\.(docx?|pdf)$/i, '');
  const finalFilename = /_F4$/i.test(cleanBase) ? `${cleanBase}.doc` : `${cleanBase}_F4.doc`;
  const blob = new Blob(['\ufeff' + wordDocHtml], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 30000);
}

/**
 * Menampilkan Modal Interaktif "Cetak, Download Word (.doc) & PDF Per Bagian — Format Kertas F4 (215 × 330 mm)"
 * sehingga pengguna di SEMUA menu dapat mencetak/mengunduh Word & PDF per bagian maupun keseluruhan
 * dengan pratinjau kertas F4 secara langsung.
 */
export function openF4SectionModal(params: {
  rawHtml: string;
  filename: string;
  title: string;
  defaultOrientation: 'portrait' | 'landscape';
  defaultMode: 'print' | 'pdf' | 'word';
}): Promise<void> {
  return new Promise((resolve) => {
    const existingModal = document.getElementById('f4-per-bagian-modal-backdrop');
    if (existingModal) {
      existingModal.remove();
    }

    const parsed = parseDocumentSections(
      params.rawHtml,
      params.title || params.filename.replace(/\.(pdf|docx?)$/i, ''),
      params.defaultOrientation
    );

    const sections = parsed.sections;
    const styles = parsed.styles;
    const docHeaderHtml = parsed.docHeaderHtml;
    const docTitle = parsed.documentTitle || params.title || 'Dokumen Administrasi Guru';

    let activePreviewId = sections[0]?.id || '';
    let includeHeaderOnEverySection = true;
    let showPageNumbers = true;
    let isBusy = false;
    let statusToast = '';

    const backdrop = document.createElement('div');
    backdrop.id = 'f4-per-bagian-modal-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      background: rgba(15, 23, 42, 0.74);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const closeModal = () => {
      if (isBusy) return;
      backdrop.remove();
      resolve();
    };

    const sanitizeFilePart = (str: string) =>
      str
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 48) || 'Bagian';

    const showQuickToast = (msg: string) => {
      statusToast = msg;
      renderModalContent();
      setTimeout(() => {
        if (statusToast === msg) {
          statusToast = '';
          if (document.body.contains(backdrop)) {
            renderModalContent();
          }
        }
      }, 3800);
    };

    const isWordPrimary = params.defaultMode === 'word';

    const renderModalContent = () => {
      const selectedCount = sections.filter((s) => s.selected).length;
      const previewSection = sections.find((s) => s.id === activePreviewId) || sections[0];
      const isLandscapePreview = previewSection?.orientation === 'landscape';

      backdrop.innerHTML = `
        <div style="
          background: #ffffff;
          width: 100%;
          max-width: 1220px;
          max-height: 93vh;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.38);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        ">
          <!-- Header Modal -->
          <div style="
            background: ${
              isWordPrimary
                ? 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            };
            color: #ffffff;
            padding: 15px 22px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          ">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span style="
                  background: #10b981;
                  color: #ffffff;
                  font-size: 11px;
                  font-weight: 700;
                  padding: 3px 9px;
                  border-radius: 6px;
                  letter-spacing: 0.04em;
                  text-transform: uppercase;
                ">KERTAS F4 / FOLIO (215 × 330 MM)</span>
                <span style="
                  background: #3b82f6;
                  color: #ffffff;
                  font-size: 11px;
                  font-weight: 700;
                  padding: 3px 9px;
                  border-radius: 6px;
                ">SIAP CETAK WORD (.DOC) & PDF PER BAGIAN</span>
                <span style="
                  background: rgba(255,255,255,0.16);
                  color: #e2e8f0;
                  font-size: 11px;
                  font-weight: 600;
                  padding: 3px 9px;
                  border-radius: 6px;
                ">${sections.length} Bagian Terdeteksi</span>
              </div>
              <h3 style="margin: 6px 0 2px 0; font-size: 17px; font-weight: 700; color: #ffffff;">
                ${
                  isWordPrimary
                    ? 'Cetak & Download Word (.doc) Per Bagian — Format F4 Rapi Siap Cetak'
                    : 'Cetak, Download Word (.doc) & PDF Per Bagian — Format F4 Rapi Siap Cetak'
                }
              </h3>
              <p style="margin: 0; font-size: 12px; color: #cbd5e1;">
                Unduh file Microsoft Word (.doc) atau PDF per bagian secara terpisah, maupun gabungan seluruh bagian dalam ukuran F4 (215 × 330 mm).
              </p>
            </div>
            <button id="f4-modal-close-btn" style="
              background: rgba(255,255,255,0.12);
              color: #ffffff;
              border: 1px solid rgba(255,255,255,0.24);
              border-radius: 8px;
              padding: 7px 13px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
            ">✕ Tutup</button>
          </div>

          <!-- Toolbar Pengaturan & Aksi Cepat -->
          <div style="
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 11px 22px;
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          ">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 12px; font-size: 12px; color: #334155;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: 700;">
                <input type="checkbox" id="f4-toggle-all-cb" ${selectedCount === sections.length ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #2563eb;" />
                Pilih Semua (${selectedCount}/${sections.length})
              </label>
              ${
                docHeaderHtml
                  ? `<label style="display: flex; align-items: center; gap: 6px; cursor: pointer;" title="Jika dicentang, saat mencetak/mengunduh bagian ke-2 dst., Kop/Identitas dokumen tetap disertakan di atasnya">
                      <input type="checkbox" id="f4-include-kop-cb" ${includeHeaderOnEverySection ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #2563eb;" />
                      Ulangi Kop/Identitas di Tiap Bagian
                    </label>`
                  : ''
              }
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="checkbox" id="f4-page-num-cb" ${showPageNumbers ? 'checked' : ''} style="width: 15px; height: 15px; accent-color: #2563eb;" />
                Nomor Halaman PDF F4
              </label>
              <div style="display: flex; align-items: center; gap: 4px; background: #e2e8f0; padding: 3px; border-radius: 7px;">
                <button id="f4-all-portrait-btn" style="border: none; background: #ffffff; color: #1e293b; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 5px; cursor: pointer;">Semua Portrait F4</button>
                <button id="f4-all-landscape-btn" style="border: none; background: #ffffff; color: #1e293b; font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 5px; cursor: pointer;">Semua Landscape F4</button>
              </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 7px;">
              <!-- Tombol Word Gabungan F4 -->
              <button id="f4-word-merged-btn" ${selectedCount === 0 || isBusy ? 'disabled' : ''} style="
                background: #1d4ed8;
                color: #ffffff;
                border: ${isWordPrimary ? '2px solid #93c5fd' : 'none'};
                border-radius: 8px;
                padding: 8px 13px;
                font-size: 12px;
                font-weight: 700;
                cursor: ${selectedCount === 0 || isBusy ? 'not-allowed' : 'pointer'};
                opacity: ${selectedCount === 0 || isBusy ? '0.6' : '1'};
                display: flex;
                align-items: center;
                gap: 5px;
                box-shadow: ${isWordPrimary ? '0 4px 12px rgba(29, 78, 216, 0.35)' : 'none'};
              " title="Unduh 1 file Microsoft Word (.doc) F4 berisi semua bagian yang dicentang (otomatis pisah halaman per bagian)">
                📝 Word Gabungan (${selectedCount} Bagian F4)
              </button>

              ${
                sections.length > 1
                  ? `<button id="f4-word-separate-btn" ${selectedCount === 0 || isBusy ? 'disabled' : ''} style="
                      background: #0284c7;
                      color: #ffffff;
                      border: none;
                      border-radius: 8px;
                      padding: 8px 12px;
                      font-size: 12px;
                      font-weight: 700;
                      cursor: ${selectedCount === 0 || isBusy ? 'not-allowed' : 'pointer'};
                      opacity: ${selectedCount === 0 || isBusy ? '0.6' : '1'};
                      display: flex;
                      align-items: center;
                      gap: 5px;
                    " title="Unduh file Microsoft Word (.doc) F4 terpisah untuk masing-masing bagian yang dicentang">
                      📂 Word Terpisah Per Bagian (.doc)
                    </button>`
                  : ''
              }

              <!-- Tombol Cetak F4 -->
              <button id="f4-print-selected-btn" ${selectedCount === 0 || isBusy ? 'disabled' : ''} style="
                background: #059669;
                color: #ffffff;
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 700;
                cursor: ${selectedCount === 0 || isBusy ? 'not-allowed' : 'pointer'};
                opacity: ${selectedCount === 0 || isBusy ? '0.6' : '1'};
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                🖨️ Cetak (${selectedCount} Bagian F4)
              </button>

              <!-- Tombol PDF Gabungan F4 -->
              <button id="f4-pdf-merged-btn" ${selectedCount === 0 || isBusy ? 'disabled' : ''} style="
                background: #4f46e5;
                color: #ffffff;
                border: none;
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 12px;
                font-weight: 700;
                cursor: ${selectedCount === 0 || isBusy ? 'not-allowed' : 'pointer'};
                opacity: ${selectedCount === 0 || isBusy ? '0.6' : '1'};
                display: flex;
                align-items: center;
                gap: 5px;
              ">
                📥 PDF Gabungan (${selectedCount} Bagian F4)
              </button>

              ${
                sections.length > 1
                  ? `<button id="f4-pdf-separate-btn" ${selectedCount === 0 || isBusy ? 'disabled' : ''} style="
                      background: #6366f1;
                      color: #ffffff;
                      border: none;
                      border-radius: 8px;
                      padding: 8px 11px;
                      font-size: 11.5px;
                      font-weight: 600;
                      cursor: ${selectedCount === 0 || isBusy ? 'not-allowed' : 'pointer'};
                      opacity: ${selectedCount === 0 || isBusy ? '0.6' : '1'};
                    " title="Mengunduh file PDF F4 terpisah untuk masing-masing bagian yang dicentang">
                      📂 PDF Terpisah
                    </button>`
                  : ''
              }
            </div>
          </div>

          <!-- Status Toast / Busy Banner -->
          ${
            statusToast
              ? `<div style="
                  background: #ecfdf5;
                  border-bottom: 1px solid #a7f3d0;
                  color: #065f46;
                  padding: 9px 22px;
                  font-size: 12.5px;
                  font-weight: 700;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span>✅ ${statusToast}</span>
                </div>`
              : ''
          }
          <div id="f4-busy-banner" style="
            display: ${isBusy ? 'flex' : 'none'};
            background: #eff6ff;
            border-bottom: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 10px 22px;
            font-size: 12.5px;
            font-weight: 600;
            align-items: center;
            gap: 8px;
          ">
            <span>⏳ Sedang menyusun halaman kertas F4 (215 × 330 mm) agar tabel & baris rapi tanpa terpotong... Mohon tunggu sebentar.</span>
          </div>

          <!-- Body: 2 Kolom (Daftar Bagian di Kiri & Pratinjau Kertas F4 di Kanan) -->
          <div style="
            display: grid;
            grid-template-columns: minmax(360px, 47%) 1fr;
            flex: 1;
            min-height: 0;
            overflow: hidden;
          ">
            <!-- Kolom Kiri: Daftar Bagian -->
            <div style="
              border-right: 1px solid #e2e8f0;
              overflow-y: auto;
              padding: 16px;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              gap: 10px;
            ">
              <div style="font-size: 11.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;">
                Daftar Bagian Dokumen — Klik "📝 Word Bagian Ini" atau "🖨️ Cetak / 📥 PDF" per Bagian
              </div>
              ${sections
                .map((sec, idx) => {
                  const isPreviewed = sec.id === previewSection?.id;
                  return `
                    <div data-sec-card="${sec.id}" style="
                      border: 2px solid ${isPreviewed ? '#2563eb' : sec.selected ? '#cbd5e1' : '#e2e8f0'};
                      background: ${isPreviewed ? '#eff6ff' : sec.selected ? '#ffffff' : '#f8fafc'};
                      border-radius: 10px;
                      padding: 11px 13px;
                      transition: all 0.15s ease;
                      display: flex;
                      flex-direction: column;
                      gap: 8px;
                    ">
                      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                        <label style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer; flex: 1;">
                          <input
                            type="checkbox"
                            data-sec-check="${sec.id}"
                            ${sec.selected ? 'checked' : ''}
                            style="width: 16px; height: 16px; margin-top: 2px; accent-color: #2563eb; flex-shrink: 0;"
                          />
                          <div>
                            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                              <span style="
                                background: #1e293b;
                                color: #ffffff;
                                font-size: 10px;
                                font-weight: 700;
                                padding: 2px 7px;
                                border-radius: 4px;
                              ">BAGIAN ${idx + 1}</span>
                              <span style="
                                background: ${sec.orientation === 'landscape' ? '#fef3c7' : '#dcfce7'};
                                color: ${sec.orientation === 'landscape' ? '#92400e' : '#166534'};
                                font-size: 10px;
                                font-weight: 700;
                                padding: 2px 7px;
                                border-radius: 4px;
                              ">${sec.orientation === 'landscape' ? 'F4 Landscape (330×215mm)' : 'F4 Portrait (215×330mm)'}</span>
                            </div>
                            <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 4px; line-height: 1.35;">
                              ${sec.title}
                            </div>
                          </div>
                        </label>
                      </div>

                      <!-- Tombol Aksi Per Bagian -->
                      <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                          <button data-sec-preview="${sec.id}" style="
                            border: 1px solid ${isPreviewed ? '#2563eb' : '#cbd5e1'};
                            background: ${isPreviewed ? '#dbeafe' : '#f8fafc'};
                            color: ${isPreviewed ? '#1d4ed8' : '#334155'};
                            font-size: 11px;
                            font-weight: 600;
                            padding: 4px 8px;
                            border-radius: 6px;
                            cursor: pointer;
                          ">👁️ Pratinjau</button>
                          <button data-sec-orient="${sec.id}" style="
                            border: 1px solid #cbd5e1;
                            background: #ffffff;
                            color: #475569;
                            font-size: 11px;
                            font-weight: 600;
                            padding: 4px 8px;
                            border-radius: 6px;
                            cursor: pointer;
                          " title="Ubah orientasi kertas F4 untuk bagian ini">
                            🔄 ${sec.orientation === 'landscape' ? 'Portrait' : 'Landscape'}
                          </button>
                        </div>

                        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 5px;">
                          <button data-sec-word-one="${sec.id}" ${isBusy ? 'disabled' : ''} style="
                            border: none;
                            background: #1d4ed8;
                            color: #ffffff;
                            font-size: 11px;
                            font-weight: 700;
                            padding: 5px 9px;
                            border-radius: 6px;
                            cursor: pointer;
                          " title="Unduh Microsoft Word (.doc) F4 hanya untuk Bagian ${idx + 1} ini">
                            📝 Word Bagian Ini
                          </button>
                          <button data-sec-print-one="${sec.id}" ${isBusy ? 'disabled' : ''} style="
                            border: none;
                            background: #059669;
                            color: #ffffff;
                            font-size: 11px;
                            font-weight: 700;
                            padding: 5px 9px;
                            border-radius: 6px;
                            cursor: pointer;
                          " title="Cetak hanya Bagian ${idx + 1} ini pada kertas F4">
                            🖨️ Cetak
                          </button>
                          <button data-sec-pdf-one="${sec.id}" ${isBusy ? 'disabled' : ''} style="
                            border: none;
                            background: #4f46e5;
                            color: #ffffff;
                            font-size: 11px;
                            font-weight: 700;
                            padding: 5px 9px;
                            border-radius: 6px;
                            cursor: pointer;
                          " title="Unduh PDF F4 hanya untuk Bagian ${idx + 1} ini">
                            📥 PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>

            <!-- Kolom Kanan: Pratinjau Lembar F4 -->
            <div style="
              background: #cbd5e1;
              overflow-y: auto;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
            ">
              <div style="
                width: 100%;
                max-width: ${isLandscapePreview ? '860px' : '620px'};
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 12px;
                color: #1e293b;
                font-weight: 700;
              ">
                <span>📄 Pratinjau Kertas F4: ${previewSection ? `Bagian ${previewSection.index} — ${previewSection.title}` : ''}</span>
                <span style="background: #0f172a; color: #fff; padding: 2px 8px; border-radius: 5px; font-size: 11px;">
                  ${isLandscapePreview ? '330 mm × 215 mm (Landscape F4)' : '215 mm × 330 mm (Portrait F4)'}
                </span>
              </div>

              <div id="f4-modal-preview-sheet" style="
                background: #ffffff;
                width: 100%;
                max-width: ${isLandscapePreview ? '860px' : '620px'};
                min-height: ${isLandscapePreview ? '560px' : '950px'};
                padding: 28px 32px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.22);
                border: 1px solid #94a3b8;
                box-sizing: border-box;
                overflow-x: auto;
                color: #000000;
              ">
                <style>
                  ${styles}
                  #f4-modal-preview-sheet {
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 10.5pt;
                    line-height: 1.4;
                    color: #000;
                  }
                  #f4-modal-preview-sheet table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 10px;
                  }
                  #f4-modal-preview-sheet th,
                  #f4-modal-preview-sheet td {
                    padding: 4px 6px;
                    vertical-align: top;
                    word-wrap: break-word;
                  }
                  #f4-modal-preview-sheet img {
                    max-width: 100% !important;
                    height: auto !important;
                  }
                </style>
                ${
                  includeHeaderOnEverySection &&
                  previewSection &&
                  !previewSection.isFirstSection &&
                  docHeaderHtml &&
                  !previewSection.html.includes(docHeaderHtml)
                    ? `<div class="f4-doc-kop-repeat" style="margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #000;">${docHeaderHtml}</div>`
                    : ''
                }
                ${previewSection ? previewSection.html : '<p>Pilih bagian untuk melihat pratinjau.</p>'}
              </div>
            </div>
          </div>
        </div>
      `;

      // Pasang Event Listeners
      backdrop.querySelector('#f4-modal-close-btn')?.addEventListener('click', closeModal);

      backdrop.querySelector('#f4-toggle-all-cb')?.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        sections.forEach((s) => {
          s.selected = checked;
        });
        renderModalContent();
      });

      backdrop.querySelector('#f4-include-kop-cb')?.addEventListener('change', (e) => {
        includeHeaderOnEverySection = (e.target as HTMLInputElement).checked;
        renderModalContent();
      });

      backdrop.querySelector('#f4-page-num-cb')?.addEventListener('change', (e) => {
        showPageNumbers = (e.target as HTMLInputElement).checked;
      });

      backdrop.querySelector('#f4-all-portrait-btn')?.addEventListener('click', () => {
        sections.forEach((s) => {
          s.orientation = 'portrait';
        });
        renderModalContent();
      });

      backdrop.querySelector('#f4-all-landscape-btn')?.addEventListener('click', () => {
        sections.forEach((s) => {
          s.orientation = 'landscape';
        });
        renderModalContent();
      });

      // Checkbox per bagian
      backdrop.querySelectorAll<HTMLInputElement>('[data-sec-check]').forEach((cb) => {
        cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-sec-check');
          const sec = sections.find((s) => s.id === id);
          if (sec) {
            sec.selected = cb.checked;
            renderModalContent();
          }
        });
      });

      // Pratinjau per bagian
      backdrop.querySelectorAll<HTMLButtonElement>('[data-sec-preview]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sec-preview');
          if (id) {
            activePreviewId = id;
            renderModalContent();
          }
        });
      });

      // Ubah orientasi per bagian
      backdrop.querySelectorAll<HTMLButtonElement>('[data-sec-orient]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sec-orient');
          const sec = sections.find((s) => s.id === id);
          if (sec) {
            sec.orientation = sec.orientation === 'landscape' ? 'portrait' : 'landscape';
            activePreviewId = sec.id;
            renderModalContent();
          }
        });
      });

      // Unduh Word (.doc) 1 Bagian Ini Saja (F4)
      backdrop.querySelectorAll<HTMLButtonElement>('[data-sec-word-one]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sec-word-one');
          const sec = sections.find((s) => s.id === id);
          if (!sec) return;
          const baseName = params.filename.replace(/\.(pdf|docx?)$/i, '');
          const partName = `${baseName}_Bagian_${sec.index}_${sanitizeFilePart(sec.title)}_F4.doc`;
          const wordHtml = buildF4WordDocumentFromSections(
            [{ ...sec, selected: true }],
            styles,
            `${docTitle} - Bagian ${sec.index}: ${sec.title}`,
            { docHeaderHtml, includeHeaderOnEverySection }
          );
          triggerWordDocBlobDownload(wordHtml, partName);
          showQuickToast(
            `File Word F4 untuk "Bagian ${sec.index}: ${sec.title}" berhasil diunduh!`
          );
        });
      });

      // Cetak 1 Bagian Ini Saja (F4)
      backdrop.querySelectorAll<HTMLButtonElement>('[data-sec-print-one]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sec-print-one');
          const sec = sections.find((s) => s.id === id);
          if (!sec) return;
          executePrintF4Sections(
            [{ ...sec, selected: true }],
            styles,
            `${docTitle} - Bagian ${sec.index}: ${sec.title}`,
            { docHeaderHtml, includeHeaderOnEverySection }
          );
        });
      });

      // Download PDF 1 Bagian Ini Saja (F4)
      backdrop.querySelectorAll<HTMLButtonElement>('[data-sec-pdf-one]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (isBusy) return;
          const id = btn.getAttribute('data-sec-pdf-one');
          const sec = sections.find((s) => s.id === id);
          if (!sec) return;

          isBusy = true;
          renderModalContent();
          try {
            const baseName = params.filename.replace(/\.(pdf|docx?)$/i, '');
            const partName = `${baseName}_Bagian_${sec.index}_${sanitizeFilePart(sec.title)}_F4.pdf`;
            await renderSectionsToF4Pdf([{ ...sec, selected: true }], styles, partName, {
              docHeaderHtml,
              includeHeaderOnEverySection,
              showPageNumbers,
              documentTitle: docTitle
            });
            showQuickToast(`PDF F4 untuk "Bagian ${sec.index}: ${sec.title}" berhasil diunduh!`);
          } finally {
            isBusy = false;
            renderModalContent();
          }
        });
      });

      // Unduh Word (.doc) Gabungan Semua Bagian Terpilih (F4)
      backdrop.querySelector('#f4-word-merged-btn')?.addEventListener('click', () => {
        const chosen = sections.filter((s) => s.selected);
        if (chosen.length === 0) return;
        const baseName = params.filename.replace(/\.(pdf|docx?)$/i, '');
        const wordHtml = buildF4WordDocumentFromSections(chosen, styles, docTitle, {
          docHeaderHtml,
          includeHeaderOnEverySection
        });
        triggerWordDocBlobDownload(wordHtml, `${baseName}_F4.doc`);
        showQuickToast(
          `File Word F4 Gabungan (${chosen.length} Bagian) berhasil diunduh dan siap dicetak!`
        );
      });

      // Unduh Word (.doc) Terpisah Per Bagian (F4)
      backdrop.querySelector('#f4-word-separate-btn')?.addEventListener('click', async () => {
        const chosen = sections.filter((s) => s.selected);
        if (chosen.length === 0) return;
        const baseName = params.filename.replace(/\.(pdf|docx?)$/i, '');
        for (let i = 0; i < chosen.length; i++) {
          const sec = chosen[i];
          const partName = `${baseName}_Bagian_${sec.index}_${sanitizeFilePart(sec.title)}_F4.doc`;
          const wordHtml = buildF4WordDocumentFromSections(
            [{ ...sec, selected: true }],
            styles,
            `${docTitle} - Bagian ${sec.index}: ${sec.title}`,
            { docHeaderHtml, includeHeaderOnEverySection }
          );
          triggerWordDocBlobDownload(wordHtml, partName);
          await new Promise((r) => setTimeout(r, 180));
        }
        showQuickToast(
          `${chosen.length} File Word (.doc) F4 terpisah per bagian berhasil diunduh!`
        );
      });

      // Cetak Semua Bagian Terpilih (F4)
      backdrop.querySelector('#f4-print-selected-btn')?.addEventListener('click', () => {
        executePrintF4Sections(sections, styles, docTitle, {
          docHeaderHtml,
          includeHeaderOnEverySection
        });
      });

      // Unduh PDF Gabungan Semua Bagian Terpilih (F4)
      backdrop.querySelector('#f4-pdf-merged-btn')?.addEventListener('click', async () => {
        if (isBusy) return;
        isBusy = true;
        renderModalContent();
        try {
          const baseName = params.filename.replace(/\.(pdf|docx?)$/i, '');
          await renderSectionsToF4Pdf(sections, styles, `${baseName}_F4.pdf`, {
            docHeaderHtml,
            includeHeaderOnEverySection,
            showPageNumbers,
            documentTitle: docTitle
          });
          showQuickToast('File PDF Gabungan F4 berhasil diunduh!');
        } finally {
          isBusy = false;
          renderModalContent();
        }
      });

      // Unduh PDF Terpisah Per Bagian (F4)
      backdrop.querySelector('#f4-pdf-separate-btn')?.addEventListener('click', async () => {
        if (isBusy) return;
        const chosen = sections.filter((s) => s.selected);
        if (chosen.length === 0) return;

        isBusy = true;
        renderModalContent();
        try {
          const baseName = params.filename.replace(/\.(pdf|docx?)$/i, '');
          for (const sec of chosen) {
            const partName = `${baseName}_Bagian_${sec.index}_${sanitizeFilePart(sec.title)}_F4.pdf`;
            await renderSectionsToF4Pdf([{ ...sec, selected: true }], styles, partName, {
              docHeaderHtml,
              includeHeaderOnEverySection,
              showPageNumbers,
              documentTitle: docTitle
            });
          }
          showQuickToast(`${chosen.length} File PDF F4 terpisah per bagian berhasil diunduh!`);
        } finally {
          isBusy = false;
          renderModalContent();
        }
      });

      // Normalkan tabel pada pratinjau agar tampak serapi hasil cetak
      const previewSheet = backdrop.querySelector<HTMLElement>('#f4-modal-preview-sheet');
      if (previewSheet) {
        normalizeDomForF4Capture(previewSheet, isLandscapePreview ? 820 : 580);
        previewSheet.style.width = '100%';
        previewSheet.style.maxWidth = isLandscapePreview ? '860px' : '620px';
      }
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    document.body.appendChild(backdrop);
    renderModalContent();
  });
}

export interface F4ExportOptions {
  orientation?: 'portrait' | 'landscape';
  skipModal?: boolean;
  includeHeaderOnEverySection?: boolean;
  showPageNumbers?: boolean;
  defaultMode?: 'print' | 'pdf' | 'word';
  marginMm?: number;
  scale?: number;
  title?: string;
}

/**
 * Mengunduh string HTML sebagai file PDF berformat F4 (215mm x 330mm)
 * dengan Panel Cetak & Download PDF Per Bagian secara otomatis.
 * Mendukung urutan argumen (htmlContent, filename, ...) maupun (filename, htmlContent, ...).
 */
export async function downloadHtmlAsPdf(
  arg1: string,
  arg2: string,
  arg3: 'portrait' | 'landscape' | F4ExportOptions = 'portrait',
  arg4: F4ExportOptions = {}
): Promise<boolean> {
  const isArg1Html =
    arg1.trim().startsWith('<') ||
    arg1.includes('<div') ||
    arg1.includes('<table') ||
    arg1.includes('<html') ||
    arg1.includes('<p') ||
    arg1.length > 260;

  const htmlContent = isArg1Html ? arg1 : arg2;
  const filename = isArg1Html ? arg2 : arg1;

  const options: F4ExportOptions =
    typeof arg3 === 'string'
      ? { orientation: arg3, ...arg4 }
      : { ...arg3, ...arg4 };

  const orientation: 'portrait' | 'landscape' = options.orientation || 'portrait';

  if (options.skipModal) {
    const parsed = parseDocumentSections(htmlContent, options.title || filename, orientation);
    await renderSectionsToF4Pdf(parsed.sections, parsed.styles, filename, {
      docHeaderHtml: parsed.docHeaderHtml,
      includeHeaderOnEverySection: options.includeHeaderOnEverySection ?? true,
      showPageNumbers: options.showPageNumbers ?? true,
      documentTitle: parsed.documentTitle
    });
    return true;
  }

  await openF4SectionModal({
    rawHtml: htmlContent,
    filename,
    title: options.title || filename.replace(/\.pdf$/i, '').replace(/_/g, ' '),
    defaultOrientation: orientation,
    defaultMode: 'pdf'
  });
  return true;
}

/**
 * Mengunduh elemen DOM secara langsung sebagai file PDF berformat F4 (215mm x 330mm)
 * dengan Panel Cetak & Download PDF Per Bagian.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  filename: string,
  arg3: 'portrait' | 'landscape' | F4ExportOptions = 'portrait',
  arg4: F4ExportOptions = {}
): Promise<boolean> {
  const options: F4ExportOptions =
    typeof arg3 === 'string'
      ? { orientation: arg3, ...arg4 }
      : { ...arg3, ...arg4 };

  const orientation: 'portrait' | 'landscape' = options.orientation || 'portrait';

  const clone = element.cloneNode(true) as HTMLElement;
  const noPrintEls = clone.querySelectorAll('.no-print, button');
  noPrintEls.forEach((el) => el.remove());

  const htmlString = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${options.title || filename.replace(/\.pdf$/i, '')}</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          color: #000000;
          line-height: 1.45;
          font-size: 11pt;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        th, td {
          border: 1px solid #000000;
          padding: 5px 7px;
          vertical-align: top;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      ${clone.innerHTML}
    </body>
    </html>
  `;

  return downloadHtmlAsPdf(htmlString, filename, orientation, options);
}

/**
 * Mencetak dokumen HTML dalam format kertas F4 (215mm x 330mm)
 * dengan membuka Panel Cetak & Download PDF Per Bagian sehingga pengguna
 * dapat mencetak per bagian atau seluruh bagian sekaligus.
 */
export function printHtmlDocument(
  htmlContent: string,
  title = 'Cetak Dokumen F4 (215 x 330 mm)',
  arg3: 'portrait' | 'landscape' | F4ExportOptions = 'portrait',
  arg4: F4ExportOptions = {}
): void {
  const options: F4ExportOptions =
    typeof arg3 === 'string'
      ? { orientation: arg3, ...arg4 }
      : { ...arg3, ...arg4 };

  const orientation: 'portrait' | 'landscape' = options.orientation || 'portrait';

  if (options.skipModal) {
    const parsed = parseDocumentSections(htmlContent, title, orientation);
    executePrintF4Sections(parsed.sections, parsed.styles, title, {
      docHeaderHtml: parsed.docHeaderHtml,
      includeHeaderOnEverySection: options.includeHeaderOnEverySection ?? true
    });
    return;
  }

  void openF4SectionModal({
    rawHtml: htmlContent,
    filename: `${title.replace(/[^a-zA-Z0-9_-]+/g, '_')}_F4.pdf`,
    title,
    defaultOrientation: orientation,
    defaultMode: 'print'
  });
}
