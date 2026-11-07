import { ModulAjar, JurnalMengajar, RubrikFisik, ClassData, Student, AtpResult, DeepLearningRPM, KktpData, RpeData, ProtaData, ProsemData, SlidePresentationData, InteractiveLkpdData, CpToTpResult } from '../types';
import { getPjokDiagramHtml, detectPjokVisualType } from '../components/PjokVisualDiagram';
import {
  openF4SectionModal,
  parseDocumentSections,
  buildF4WordDocumentFromSections,
  triggerWordDocBlobDownload,
  F4ExportOptions
} from './pdfUtils';

/**
 * Standardizes any HTML string (full document or partial fragment) into a print-ready
 * F4 Folio (215mm x 330mm / 609.45pt x 935.43pt) Microsoft Word (.doc) & Google Docs document.
 * Automatically handles multi-section [data-f4-section] documents with mixed Portrait & Landscape
 * orientations, repeats table headers across pages, prevents row splitting, and removes width constraints.
 */
export function formatHtmlForF4WordDoc(
  rawHtml: string,
  title: string = 'Dokumen_Administrasi_PJOK_F4',
  defaultOrientation?: 'portrait' | 'landscape'
): string {
  const detectMaxTableCols = (root: ParentNode): number => {
    let maxCols = 0;
    const tables = Array.from(root.querySelectorAll('table'));
    tables.forEach((tbl) => {
      const rows = Array.from(tbl.querySelectorAll('tr'));
      rows.forEach((tr) => {
        let cols = 0;
        Array.from(tr.children).forEach((cell) => {
          const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
          cols += isNaN(colspan) ? 1 : colspan;
        });
        if (cols > maxCols) maxCols = cols;
      });
    });
    return maxCols;
  };

  const normalizeNodesForWord = (container: HTMLElement) => {
    // Strip UI-only elements
    container.querySelectorAll('.no-print, button').forEach((el) => el.remove());

    // Remove constraining max-widths on wrapper divs so content fills F4 width
    container.querySelectorAll('div').forEach((div) => {
      const style = div.getAttribute('style') || '';
      if (/max-width\s*:/i.test(style)) {
        div.setAttribute(
          'style',
          style.replace(/max-width\s*:\s*[^;]+;?/gi, 'width: 100%;')
        );
      }
    });

    // Keep .page-break recognizable for section parsing while adding MSO page-break rules
    container.querySelectorAll('.page-break').forEach((pb) => {
      pb.setAttribute(
        'style',
        `${pb.getAttribute('style') || ''}; page-break-before:always; mso-special-character:line-break;`
      );
    });

    // Enhance tables for Microsoft Word F4 layout
    container.querySelectorAll('table').forEach((tbl) => {
      const existingStyle = tbl.getAttribute('style') || '';
      if (!/width\s*:/i.test(existingStyle)) {
        tbl.style.width = '100%';
      }
      tbl.style.borderCollapse = 'collapse';
      tbl.setAttribute(
        'style',
        `${tbl.getAttribute('style') || ''}; mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-padding-alt: 2pt 4pt 2pt 4pt;`
      );
    });

    container.querySelectorAll('thead').forEach((thead) => {
      thead.setAttribute('style', `${thead.getAttribute('style') || ''}; display: table-header-group;`);
      const firstRow = thead.querySelector('tr');
      if (firstRow) {
        firstRow.setAttribute(
          'style',
          `${firstRow.getAttribute('style') || ''}; mso-yfti-irow: 0; mso-yfti-firstrow: yes; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;`
        );
      }
    });

    container.querySelectorAll('tr').forEach((tr) => {
      const st = tr.getAttribute('style') || '';
      if (!/mso-yfti-row-cant-split/i.test(st)) {
        tr.setAttribute(
          'style',
          `${st}; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;`
        );
      }
    });
  };

  let extractedStyles = '';
  let bodySectionsHtml = '';
  let primaryOrientation: 'portrait' | 'landscape' = defaultOrientation || 'portrait';

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    const titleEl = doc.querySelector('title');
    if (titleEl && titleEl.textContent?.trim() && title === 'Dokumen_Administrasi_PJOK_F4') {
      title = titleEl.textContent.trim();
    }

    // Extract custom style rules while stripping conflicting @page rules
    doc.querySelectorAll('style').forEach((styleEl) => {
      const css = (styleEl.textContent || '')
        .replace(/@page\s*[^{]*\{[^}]*\}/gi, '')
        .replace(/div\.Section1\s*\{[^}]*\}/gi, '');
      extractedStyles += '\n' + css;
    });

    const hasLandscapeHint =
      defaultOrientation === 'landscape' ||
      /330mm\s+215mm|935\.43pt\s+609\.45pt|mso-paper-orientation\s*:\s*landscape|mso-page-orientation\s*:\s*landscape|size\s*:\s*landscape/i.test(
        rawHtml
      );

    // Unwrap legacy single div.Section1 or single outer wrapper div if present
    let workRoot: HTMLElement = doc.body;
    while (
      workRoot.children.length === 1 &&
      workRoot.firstElementChild instanceof HTMLElement &&
      ['DIV', 'MAIN', 'ARTICLE', 'SECTION'].includes(workRoot.firstElementChild.tagName) &&
      !workRoot.firstElementChild.hasAttribute('data-f4-section') &&
      !workRoot.firstElementChild.classList.contains('slide-container')
    ) {
      workRoot = workRoot.firstElementChild;
    }

    const f4Sections = Array.from(workRoot.querySelectorAll('[data-f4-section]')).filter(
      (el) => !el.parentElement?.closest('[data-f4-section]')
    );

    if (f4Sections.length > 0) {
      // Remove standalone .page-break or <br> siblings between [data-f4-section] blocks to avoid blank pages
      Array.from(workRoot.children).forEach((child) => {
        if (
          (child.classList.contains('page-break') || child.tagName === 'BR') &&
          !child.hasAttribute('data-f4-section')
        ) {
          child.remove();
        }
      });

      // Collect any leading nodes before the first [data-f4-section] (such as [data-f4-kop="true"])
      const firstSec = f4Sections[0];
      const secParent = firstSec.parentElement || workRoot;
      const leadingNodes: Node[] = [];
      let curr: ChildNode | null = secParent.firstChild;
      while (curr && curr !== firstSec && !curr.contains(firstSec)) {
        const next = curr.nextSibling;
        leadingNodes.push(curr);
        curr = next;
      }
      leadingNodes.reverse().forEach((node) => {
        if (!node.contains(firstSec)) {
          firstSec.insertBefore(node, firstSec.firstChild);
        }
      });

      // Collect any trailing nodes after the last [data-f4-section] (such as signature blocks)
      const lastSec = f4Sections[f4Sections.length - 1];
      let trailing: ChildNode | null = lastSec.nextSibling;
      while (trailing) {
        const next = trailing.nextSibling;
        if (
          !(trailing instanceof HTMLElement && trailing.hasAttribute('data-f4-section')) &&
          !trailing.contains(lastSec)
        ) {
          lastSec.appendChild(trailing);
        }
        trailing = next;
      }

      const sectionBlocks: string[] = [];
      f4Sections.forEach((sec, idx) => {
        const secEl = sec as HTMLElement;
        const rawSecTitle = (secEl.getAttribute('data-f4-section') || `Bagian ${idx + 1}`).trim();
        normalizeNodesForWord(secEl);
        const attrOrient = (secEl.getAttribute('data-f4-orientation') || '').toLowerCase();
        const maxCols = detectMaxTableCols(secEl);
        const secOrient: 'portrait' | 'landscape' =
          attrOrient === 'landscape'
            ? 'landscape'
            : attrOrient === 'portrait'
            ? 'portrait'
            : maxCols >= 8
            ? 'landscape'
            : hasLandscapeHint
            ? 'landscape'
            : 'portrait';

        if (idx === 0) {
          primaryOrientation = secOrient;
        }

        const sectionClass = secOrient === 'landscape' ? 'SectionLandscape' : 'SectionPortrait';
        const safeSecTitle = rawSecTitle.replace(/"/g, '&quot;');
        sectionBlocks.push(
          `<div class="${sectionClass}" data-f4-section="${safeSecTitle}" data-f4-orientation="${secOrient}">${secEl.innerHTML}</div>`
        );
      });

      bodySectionsHtml = sectionBlocks.join(
        '\n<br clear="all" style="page-break-before:always; mso-break-type:section-break" />\n'
      );
    } else {
      normalizeNodesForWord(doc.body);
      const maxCols = detectMaxTableCols(doc.body);
      primaryOrientation =
        defaultOrientation ||
        (hasLandscapeHint || maxCols >= 8 ? 'landscape' : 'portrait');
      const sectionClass = primaryOrientation === 'landscape' ? 'SectionLandscape' : 'SectionPortrait';
      bodySectionsHtml = `<div class="${sectionClass}">${doc.body.innerHTML}</div>`;
    }
  } else {
    primaryOrientation = defaultOrientation || 'portrait';
    const sectionClass = primaryOrientation === 'landscape' ? 'SectionLandscape' : 'SectionPortrait';
    bodySectionsHtml = `<div class="${sectionClass}">${rawHtml}</div>`;
  }

  const defaultCssPageSize =
    primaryOrientation === 'landscape' ? '330mm 215mm' : '215mm 330mm';
  const defaultCssMargin =
    primaryOrientation === 'landscape' ? '10mm 12mm 10mm 12mm' : '12mm 15mm 12mm 15mm';

  return `<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
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
      margin: 34.0pt 42.5pt 34.0pt 42.5pt;
      mso-header-margin: 24.0pt;
      mso-footer-margin: 24.0pt;
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
      mso-header-margin: 20.0pt;
      mso-footer-margin: 20.0pt;
      mso-page-orientation: landscape;
      mso-paper-orientation: landscape;
      mso-paper-source: 0;
    }
    div.SectionLandscape {
      page: SectionLandscape;
      width: 100%;
    }
    body {
      font-family: "Arial", "Times New Roman", sans-serif;
      font-size: 10.5pt;
      color: #0f172a;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-family: "Arial Black", "Arial", sans-serif;
      font-size: 14pt;
      color: #0f172a;
      margin-top: 10pt;
      margin-bottom: 5pt;
      text-transform: uppercase;
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 4px;
    }
    h2 {
      font-family: "Arial", sans-serif;
      font-size: 12pt;
      color: #0f172a;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 5pt;
      border-left: 4px solid #10b981;
      padding-left: 8px;
    }
    h3 {
      font-family: "Arial", sans-serif;
      font-size: 10.5pt;
      color: #1e293b;
      font-weight: bold;
      margin-top: 10pt;
      margin-bottom: 4pt;
    }
    p {
      margin-top: 0;
      margin-bottom: 5pt;
    }
    .info-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 10px;
      margin-bottom: 10pt;
      border-radius: 4px;
    }
    .info-grid {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8pt;
    }
    .info-grid td {
      border: none;
      padding: 3px 6px;
      font-size: 9.5pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6pt;
      margin-bottom: 10pt;
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
      border: 1px solid #64748b;
      padding: 5px 6px;
      text-align: left;
      vertical-align: middle;
    }
    td {
      border: 1px solid #94a3b8;
      padding: 5px 6px;
      font-size: 9.5pt;
      color: #1e293b;
      vertical-align: top;
      word-wrap: break-word;
    }
    div.SectionLandscape table {
      font-size: 8.5pt;
    }
    div.SectionLandscape th,
    div.SectionLandscape td {
      font-size: 8.5pt;
      padding: 4px 5px;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 6pt;
      padding-left: 18px;
    }
    li {
      margin-bottom: 3pt;
    }
    .badge {
      background-color: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      font-size: 8.5pt;
      font-weight: bold;
      border-radius: 4px;
    }
    .badge-success {
      background-color: #d1fae5;
      color: #065f46;
    }
    .badge-danger {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .badge-warning {
      background-color: #fef3c7;
      color: #92400e;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .font-bold {
      font-weight: bold;
    }
    .font-mono {
      font-family: "Courier New", Courier, monospace;
    }
    .signature-grid {
      width: 100%;
      border-collapse: collapse;
      margin-top: 28pt;
      page-break-inside: avoid;
    }
    .signature-grid td {
      border: none;
      text-align: center;
      width: 50%;
      padding-top: 8px;
    }
    .bg-row-alt {
      background-color: #f8fafc;
    }
    ${extractedStyles}
  </style>
</head>
<body>
${bodySectionsHtml}
</body>
</html>`;
}

/**
 * Utility to wrap HTML content into a Microsoft Word F4 Portrait (or auto-sectioned) HTML document format.
 */
export function wrapWithDocShell(
  title: string,
  contentHtml: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
): string {
  return formatHtmlForF4WordDoc(contentHtml, title, orientation);
}

/**
 * Opens the interactive F4 Per-Section Word (.doc) Cetak & Download Modal (215mm x 330mm)
 * across all menus so users can preview and download Word per section, combined F4 Word,
 * or separate F4 Word files per section.
 * Automatically detects if (filename, docContent) were passed in reverse order.
 */
export function downloadDocFile(
  filenameOrContent: string,
  contentOrFilename: string,
  orientation?: 'portrait' | 'landscape',
  options?: F4ExportOptions
): void {
  let filename = filenameOrContent;
  let docContent = contentOrFilename;

  const firstTrimmed = (filenameOrContent || '').trim();
  const secondTrimmed = (contentOrFilename || '').trim();
  if (firstTrimmed.startsWith('<') && !secondTrimmed.startsWith('<')) {
    docContent = filenameOrContent;
    filename = contentOrFilename;
  }

  const cleanBaseName = filename.replace(/\.docx?$/i, '');
  const hasLandscapeHint =
    orientation === 'landscape' ||
    options?.orientation === 'landscape' ||
    /SectionLandscape|330mm\s+215mm|935\.43pt\s+609\.45pt|mso-paper-orientation\s*:\s*landscape/i.test(
      docContent
    );
  const resolvedOrientation: 'portrait' | 'landscape' = hasLandscapeHint ? 'landscape' : 'portrait';

  const alreadyFormattedWord =
    docContent.includes('urn:schemas-microsoft-com:office:word') &&
    (docContent.includes('SectionPortrait') || docContent.includes('SectionLandscape'));

  const formattedF4Doc = alreadyFormattedWord
    ? docContent
    : formatHtmlForF4WordDoc(docContent, cleanBaseName, resolvedOrientation);
  const finalFilename = /_F4(\.doc|$)/i.test(cleanBaseName)
    ? `${cleanBaseName}.doc`
    : `${cleanBaseName}_F4.doc`;

  if (options?.skipModal) {
    const parsed = parseDocumentSections(formattedF4Doc, cleanBaseName, resolvedOrientation);
    const wordHtml = buildF4WordDocumentFromSections(
      parsed.sections,
      parsed.styles,
      parsed.documentTitle || cleanBaseName,
      {
        docHeaderHtml: parsed.docHeaderHtml,
        includeHeaderOnEverySection: false
      }
    );
    triggerWordDocBlobDownload(wordHtml, finalFilename);
    return;
  }

  void openF4SectionModal({
    rawHtml: formattedF4Doc,
    filename: finalFilename,
    title: options?.title || cleanBaseName.replace(/_/g, ' '),
    defaultOrientation: resolvedOrientation,
    defaultMode: 'word'
  });
}

/**
 * 1. Exports Modul Ajar (RPP) to Google Docs compatible Word Document
 */
export function exportModulToDoc(modul: ModulAjar): string {
  const tujuanItems = modul.tujuanPembelajaran.map(t => `<li style="margin-bottom: 4px;">🎯 ${t}</li>`).join('\n');
  const pendahuluanItems = modul.kegiatanPembelajaran.pendahuluan.map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('\n');
  const intiItems = modul.kegiatanPembelajaran.inti.map(i => `<li style="margin-bottom: 4px;">${i}</li>`).join('\n');
  const penutupItems = modul.kegiatanPembelajaran.penutup.map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('\n');
  const saranaItems = modul.saranaPrasarana.map(s => `<span style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 2px 6px; font-size: 9pt; border-radius: 4px; margin-right: 6px; display: inline-block;">${s}</span>`).join(' ');

  const content = `
    <div data-f4-kop="true">
      <h1>MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">KURIKULUM MERDEKA &bull; PENDIDIKAN JASMANI OLAHRAGA & KESEHATAN (PJOK)</p>
      
      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Materi Pokok:</strong> ${modul.materiPokok}</td>
            <td width="50%"><strong>Alokasi Waktu:</strong> ${modul.alokasiWaktu || '2 x 35 Menit'}</td>
          </tr>
          <tr>
            <td><strong>Jenjang/Kelas:</strong> Kelas ${modul.grade} SD</td>
            <td><strong>Dibuat Pada:</strong> ${new Date(modul.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
          </tr>
          <tr>
            <td><strong>Semester:</strong> Semester ${modul.semester === 1 ? 'I (Ganjil)' : 'II (Genap)'}</td>
            <td><strong>Metode:</strong> <span class="badge badge-success">Pembelajaran Fisik Aktif</span></td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Tujuan Pembelajaran & Sarana Prasarana">
      <h2>I. TUJUAN PEMBELAJARAN</h2>
      <ul>
        ${tujuanItems || '<li>Tidak ada tujuan spesifik yang didefinisikan.</li>'}
      </ul>

      <h2>II. SARANA & PRASARANA (ALAT)</h2>
      <p style="margin-top: 6px; margin-bottom: 12px;">
        ${saranaItems || '<span style="color: #64748b;">Menggunakan lapangan terbuka sekolah standar.</span>'}
      </p>
    </div>

    <div data-f4-section="Bagian 2: Langkah Pembelajaran, Asesmen & Pengesahan">
      <h2>III. LANGKAH-LANGKAH PEMBELAJARAN</h2>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px;">
        <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          A. Kegiatan Pendahuluan (10 - 15 Menit) - <i>Fisik Hangat</i>
        </h3>
        <ul>
          ${pendahuluanItems || '<li>Melakukan baris-berbaris, absensi kelas, berdoa, dan pemanasan statis/dinamis yang menyenangkan.</li>'}
        </ul>
      </div>

      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; margin-bottom: 10px; border-radius: 6px;">
        <h3 style="margin-top: 0; color: #14532d; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px;">
          B. Kegiatan Inti (45 - 50 Menit) - <i>Praktik Motorik</i>
        </h3>
        <ul>
          ${intiItems || '<li>Siswa menyimak demonstrasi guru tentang teknik gerak utama, lalu mempraktikkannya secara berulang berkelompok.</li>'}
        </ul>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 10px; border-radius: 6px;">
        <h3 style="margin-top: 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          C. Kegiatan Penutup (10 Menit) - <i>Pendinginan & Refleksi</i>
        </h3>
        <ul>
          ${penutupItems || '<li>Melakukan cooling down bersama, menarik kesimpulan esensi materi gerak, berdoa penutup, ganti baju kembali.</li>'}
        </ul>
      </div>

      <h2>IV. STRATEGI ASESMEN / PENILAIAN</h2>
      <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 6px; font-size: 10pt;">
        ${modul.rubrikPenilaian || 'Kombinasi Asesmen Formatif (Keaktifan Gerak & Sportivitas), dan Asesmen Sumatif melalui Tes Rubrik Kinerja Motorik yang telah divalidasi sistem.'}
      </div>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
            <p style="font-size: 9pt; color: #64748b;">NIP. _______________________</p>
          </td>
          <td>
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
            <p style="font-size: 9pt; color: #64748b;">NIP. _______________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell(modul.title || 'Modul_Ajar_PJOK', content);
}

/**
 * 2. Exports Capaian Pembelajaran (CP) to Google Docs compatible Word Document
 */
export function exportCpToDoc(
  faseName: string, 
  grades: string, 
  elements: any[],
  meta?: {
    capaianUmum?: string;
    skRegulasi?: string;
    rasionalFase?: string;
    namaSekolah?: string;
    namaGuru?: string;
    nipGuru?: string;
    jabatanGuru?: string;
    kepalaSekolah?: string;
    nipKepsek?: string;
    jabatanKepsek?: string;
    tahunAjaran?: string;
    tempatPenetapan?: string;
    tanggalPenetapan?: string;
    guruSignature?: string;
    kepsekSignature?: string;
    showPengawas?: boolean;
    namaPengawas?: string;
    nipPengawas?: string;
    jabatanPengawas?: string;
    pengawasSignature?: string;
    showStempel?: boolean;
    stempelImage?: string;
  }
): string {
  const skReg = meta?.skRegulasi || 'Keputusan Kepala BSKAP Nomor 046/H/KR/2025';
  const capaianUmum = meta?.capaianUmum || '';
  const rasional = meta?.rasionalFase || '';
  const sekolah = meta?.namaSekolah || 'SD NEGERI KALIMANTONG';
  const guru = meta?.namaGuru || 'Guru PJOK';
  const nipG = meta?.nipGuru || '-';
  const jabatanG = meta?.jabatanGuru || 'Guru Mata Pelajaran PJOK';
  const kepsek = meta?.kepalaSekolah || 'Kepala Sekolah';
  const nipK = meta?.nipKepsek || '-';
  const jabatanK = meta?.jabatanKepsek || 'Kepala Sekolah';
  const thnAjar = meta?.tahunAjaran || '2026/2027';
  const tglTepat = meta?.tanggalPenetapan || '13 Juli 2026';
  const tmptTepat = meta?.tempatPenetapan || 'Jakarta';

  const items = elements.map((el, idx) => {
    const lingkupMateriHtml = Array.isArray(el.lingkupMateri) && el.lingkupMateri.length > 0 
      ? `<div style="margin-top: 8pt; padding: 8px 10px; background-color: #f8fafc; border-left: 3px solid #059669; font-size: 9.5pt;">
          <strong style="color: #065f46;">Lingkup Materi Pokok:</strong>
          <ul style="margin: 4pt 0 0 16pt; padding: 0; color: #334155;">
            ${el.lingkupMateri.map((m: string) => `<li>${m}</li>`).join('')}
          </ul>
        </div>`
      : '';

    const contohTpHtml = Array.isArray(el.contohTp) && el.contohTp.length > 0
      ? `<div style="margin-top: 6pt; padding: 8px 10px; background-color: #f0fdf4; border-left: 3px solid #10b981; font-size: 9.5pt;">
          <strong style="color: #065f46;">Contoh Formulasi Tujuan Pembelajaran (TP) Turunan:</strong>
          <ol style="margin: 4pt 0 0 16pt; padding: 0; color: #1e293b;">
            ${el.contohTp.map((t: string) => `<li>${t}</li>`).join('')}
          </ol>
        </div>`
      : '';

    return `
      <div style="margin-bottom: 16pt; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; page-break-inside: avoid;">
        <div style="background-color: #f1f5f9; padding: 9px 14px; border-bottom: 1px solid #cbd5e1; font-weight: bold; font-size: 11pt; color: #0f172a; display: flex; justify-content: space-between;">
          <span>Elemen ${idx + 1}: ${el.name} ${el.alias ? `<span style="font-weight: normal; color: #64748b; font-size: 9.5pt;">(${el.alias})</span>` : ''}</span>
          ${el.isCustom ? '<span style="color: #059669; font-size: 8.5pt; font-weight: normal; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">Muatan Kustom Sekolah</span>' : ''}
        </div>
        <div style="padding: 12px 14px; font-size: 10pt; color: #334155; line-height: 1.6;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4pt;">Deskripsi Capaian Pembelajaran:</div>
          <p style="margin: 0; text-align: justify;">${el.description}</p>
          ${lingkupMateriHtml}
          ${contohTpHtml}
        </div>
      </div>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10pt; margin-bottom: 15pt;">
        <h2 style="margin: 0; font-size: 13pt; text-transform: uppercase; color: #0f172a;">${sekolah}</h2>
        <h1 style="margin: 4pt 0 0 0; font-size: 14pt; color: #0f172a;">CAPAIAN PEMBELAJARAN (CP) MATA PELAJARAN PJOK</h1>
        <p style="margin: 3pt 0 0 0; font-size: 9.5pt; font-weight: bold; color: #475569;">KURIKULUM MERDEKA &bull; TAHUN AJARAN ${thnAjar}</p>
        <p style="margin: 2pt 0 0 0; font-size: 8.5pt; color: #64748b; font-style: italic;">Dasar Hukum: ${skReg}</p>
      </div>

      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 12px 16px; border-radius: 6px; margin-bottom: 14pt;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <strong style="font-size: 12pt; color: #1e3a8a;">${faseName} &bull; ${grades}</strong><br>
              <span style="font-size: 9.5pt; color: #475569;">Mata Pelajaran: Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)</span>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span class="badge" style="background-color: #059669; color: #ffffff; padding: 4px 10px; font-size: 9pt; border-radius: 4px; font-weight: bold;">STANDAR NASIONAL LENGKAP</span>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Rasional & Capaian Pembelajaran Umum (${faseName})">
      ${rasional ? `
        <div style="margin-bottom: 14pt; padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <strong style="font-size: 10pt; color: #0f172a; display: block; margin-bottom: 3pt;">Rasional Pembelajaran ${faseName}:</strong>
          <p style="margin: 0; font-size: 9.5pt; color: #475569; line-height: 1.5; text-align: justify;">${rasional}</p>
        </div>
      ` : ''}

      ${capaianUmum ? `
        <div style="margin-bottom: 16pt; padding: 12px 14px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
          <strong style="font-size: 10.5pt; color: #065f46; display: block; margin-bottom: 4pt;">Capaian Pembelajaran Umum Akhir ${faseName}:</strong>
          <p style="margin: 0; font-size: 10pt; color: #064e3b; line-height: 1.6; text-align: justify; font-style: italic;">
            "${capaianUmum}"
          </p>
        </div>
      ` : ''}
    </div>

    <div data-f4-section="Bagian 2: Elemen Capaian Pembelajaran & Pengesahan">
      <div style="margin-top: 10pt;">
        <h3 style="font-size: 11pt; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 4pt; margin-bottom: 12pt;">
          ELEMEN DAN CAPAIAN PEMBELAJARAN
        </h3>
        ${items}
      </div>

      <div style="margin-top: 25pt; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              Mengetahui,<br>
              Kepala Sekolah<br><br><br><br>
              <strong style="text-decoration: underline;">${kepsek}</strong><br>
              NIP. ${nipK}
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              Ditetapkan di: Sekolah<br>
              Guru Mata Pelajaran PJOK<br><br><br><br>
              <strong style="text-decoration: underline;">${guru}</strong><br>
              NIP. ${nipG}
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;

  return wrapWithDocShell(`CP_PJOK_${faseName.replace(/\s+/g, '_')}`, content);
}

/**
 * 3. Exports Student Attendance List to Google Docs compatible Word Document
 */
export function exportAbsensiToDoc(activeClass: ClassData, date: string): string {
  const rows = activeClass.students.map((st, idx) => {
    const status = st.attendance[date] || 'Belum Diisi';
    let statusStyle = 'background-color: #f1f5f9; color: #475569;';
    if (status === 'H') statusStyle = 'background-color: #d1fae5; color: #065f46; font-weight: bold;';
    if (status === 'S') statusStyle = 'background-color: #dbeafe; color: #1e40af; font-weight: bold;';
    if (status === 'I') statusStyle = 'background-color: #fef3c7; color: #92400e; font-weight: bold;';
    if (status === 'A') statusStyle = 'background-color: #fee2e2; color: #991b1b; font-weight: bold;';

    let h = 0, s = 0, i = 0, a = 0;
    Object.values(st.attendance).forEach(v => {
      if (v === 'H') h++;
      if (v === 'S') s++;
      if (v === 'I') i++;
      if (v === 'A') a++;
    });

    const bgRow = idx % 2 === 1 ? 'class="bg-row-alt"' : '';

    return `
      <tr ${bgRow}>
        <td style="text-align: center; font-family: 'Courier New', monospace;">${idx + 1}</td>
        <td style="font-weight: bold;">
          <div>${st.name}</div>
          ${st.nisn ? `<div style="font-size: 8.5pt; font-weight: normal; color: #64748b; font-family: monospace;">NISN: ${st.nisn}</div>` : ''}
        </td>
        <td style="text-align: center; font-weight: bold;">${st.gender}</td>
        <td style="text-align: center;"><span style="padding: 2px 8px; border-radius: 4px; font-size: 9pt; ${statusStyle}">${status}</span></td>
        <td style="text-align: right; font-family: 'Courier New', monospace; font-size: 9pt; color: #475569;">${h} H &bull; ${s} S &bull; ${i} I &bull; ${a} A</td>
      </tr>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1>REKAP PRESENSI HARIAN SISWA</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">DOKUMEN ADMINISTRASI GURU PJOK SD</p>

      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Rombongan Belajar:</strong> ${activeClass.name}</td>
            <td width="50%" style="text-align: right;"><strong>Total Murid:</strong> ${activeClass.students.length} Siswa</td>
          </tr>
          <tr>
            <td><strong>Tanggal Presensi:</strong> ${date}</td>
            <td style="text-align: right;"><strong>Kelas:</strong> Kelas ${activeClass.grade} SD</td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Tabel Presensi Harian Siswa & Pengesahan">
      <table>
        <thead>
          <tr>
            <th width="8%" style="text-align: center;">No.</th>
            <th width="40%">Nama Siswa</th>
            <th width="12%" style="text-align: center;">L/P</th>
            <th width="20%" style="text-align: center;">Status Kehadiran</th>
            <th width="20%" style="text-align: right;">Akumulasi Semester</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
          <td>
            <p>Jakarta, ${date}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell(`Presensi_PJOK_${activeClass.name.replace(' ', '_')}`, content);
}

export interface RekapBulananMeta {
  bulan: number; // 1 - 12
  tahun: number; // e.g. 2026
  namaSekolah?: string;
  namaGuru?: string;
  nipGuru?: string;
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  kota?: string;
}

/**
 * 3b. Exports Monthly Attendance Recap (Rekap Absensi Bulanan) to Microsoft Word compatible format (Landscape)
 */
export function exportRekapBulananToDoc(activeClass: ClassData, meta: RekapBulananMeta): string {
  const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const HARI_INITIALS = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

  const bulanIdx = Math.max(1, Math.min(12, meta.bulan)) - 1;
  const namaBulan = BULAN_NAMES[bulanIdx];
  const daysInMonth = new Date(meta.tahun, meta.bulan, 0).getDate();
  const tahunAjaran = meta.bulan >= 7 
    ? `${meta.tahun}/${meta.tahun + 1}` 
    : `${meta.tahun - 1}/${meta.tahun}`;

  const namaSekolah = meta.namaSekolah || 'SD NEGERI KALIMANTONG';
  const namaGuru = meta.namaGuru || 'Ahmad Rafsanjani, S.Pd.';
  const nipGuru = meta.nipGuru || '19880512 201503 1 002';
  const namaKepalaSekolah = meta.namaKepalaSekolah || 'H. Muhammad Nur, M.Pd.';
  const nipKepalaSekolah = meta.nipKepalaSekolah || '19750814 199903 1 004';
  const kota = meta.kota || 'Kalimantong';
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const boysCount = (activeClass.students || []).filter(s => s.gender === 'L').length;
  const girlsCount = (activeClass.students || []).filter(s => s.gender === 'P').length;

  // Days metadata
  const daysMeta: { day: number; dateKey: string; isSunday: boolean; isSaturday: boolean; initial: string }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(meta.bulan).padStart(2, '0');
    const dateKey = `${meta.tahun}-${mStr}-${dStr}`;
    const dt = new Date(meta.tahun, bulanIdx, d);
    const dayOfWeek = dt.getDay();
    daysMeta.push({
      day: d,
      dateKey,
      isSunday: dayOfWeek === 0,
      isSaturday: dayOfWeek === 6,
      initial: HARI_INITIALS[dayOfWeek]
    });
  }

  // Count effective days in this month (non-Sundays)
  const effectiveDaysCount = daysMeta.filter(d => !d.isSunday).length;

  // Build Table Header Days
  const headerDaysHtml = daysMeta.map(dm => {
    const isWeekend = dm.isSunday;
    const isSat = dm.isSaturday;
    const bgStyle = isWeekend 
      ? 'background-color: #fee2e2; color: #b91c1c;' 
      : isSat 
        ? 'background-color: #f1f5f9; color: #475569;' 
        : 'background-color: #ffffff; color: #0f172a;';
    return `
      <th style="width: 17px; text-align: center; font-size: 6.5pt; padding: 2px 0; ${bgStyle} border: 1px solid #94a3b8;">
        <div>${dm.day}</div>
        <div style="font-size: 5.5pt; font-weight: normal;">${dm.initial}</div>
      </th>
    `;
  }).join('');

  // Daily Totals Accumulator
  const dailyH: number[] = new Array(daysInMonth).fill(0);
  const dailyS: number[] = new Array(daysInMonth).fill(0);
  const dailyI: number[] = new Array(daysInMonth).fill(0);
  const dailyA: number[] = new Array(daysInMonth).fill(0);

  let grandTotalH = 0;
  let grandTotalS = 0;
  let grandTotalI = 0;
  let grandTotalA = 0;

  // Build Student Rows
  const studentRows = (activeClass.students || []).map((student, sIdx) => {
    let studentH = 0;
    let studentS = 0;
    let studentI = 0;
    let studentA = 0;

    const daysCells = daysMeta.map((dm, dIdx) => {
      const status = student.attendance?.[dm.dateKey];
      if (dm.isSunday) {
        return `<td style="background-color: #fee2e2; text-align: center; font-size: 6.5pt; color: #dc2626; border: 1px solid #94a3b8;">L</td>`;
      }

      if (status === 'H') {
        studentH++;
        dailyH[dIdx]++;
        return `<td style="background-color: #f0fdf4; text-align: center; font-weight: bold; color: #166534; font-size: 7pt; border: 1px solid #94a3b8;">H</td>`;
      } else if (status === 'S') {
        studentS++;
        dailyS[dIdx]++;
        return `<td style="background-color: #eff6ff; text-align: center; font-weight: bold; color: #1d4ed8; font-size: 7pt; border: 1px solid #94a3b8;">S</td>`;
      } else if (status === 'I') {
        studentI++;
        dailyI[dIdx]++;
        return `<td style="background-color: #fefce8; text-align: center; font-weight: bold; color: #b45309; font-size: 7pt; border: 1px solid #94a3b8;">I</td>`;
      } else if (status === 'A') {
        studentA++;
        dailyA[dIdx]++;
        return `<td style="background-color: #fef2f2; text-align: center; font-weight: bold; color: #b91c1c; font-size: 7pt; border: 1px solid #94a3b8;">A</td>`;
      } else {
        return `<td style="text-align: center; color: #cbd5e1; font-size: 6pt; border: 1px solid #94a3b8;">.</td>`;
      }
    }).join('');

    grandTotalH += studentH;
    grandTotalS += studentS;
    grandTotalI += studentI;
    grandTotalA += studentA;

    // Total recorded interactions or against effective days
    const totalRecords = studentH + studentS + studentI + studentA;
    const baseDivider = totalRecords > 0 ? totalRecords : effectiveDaysCount;
    const percent = baseDivider > 0 ? Math.round((studentH / baseDivider) * 100) : 100;

    let percentStyle = 'color: #166534; font-weight: bold; background-color: #f0fdf4;';
    if (percent < 75) {
      percentStyle = 'color: #b91c1c; font-weight: bold; background-color: #fef2f2;';
    } else if (percent < 85) {
      percentStyle = 'color: #b45309; font-weight: bold; background-color: #fffbeb;';
    }

    const rowBg = sIdx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';

    return `
      <tr style="${rowBg}">
        <td style="text-align: center; font-size: 7.5pt; font-family: 'Courier New', monospace; border: 1px solid #94a3b8; padding: 2px;">${sIdx + 1}</td>
        <td style="font-size: 7.5pt; border: 1px solid #94a3b8; padding: 2px 4px; white-space: nowrap;">
          <strong>${student.name}</strong>
          ${student.nisn ? `<br><span style="font-size: 6pt; color: #64748b; font-family: monospace;">NISN: ${student.nisn}</span>` : ''}
        </td>
        <td style="text-align: center; font-size: 7pt; font-weight: bold; border: 1px solid #94a3b8; padding: 2px;">${student.gender}</td>
        ${daysCells}
        <td style="text-align: center; font-size: 7pt; font-weight: bold; color: #166534; background-color: #f0fdf4; border: 1px solid #94a3b8; padding: 2px;">${studentH}</td>
        <td style="text-align: center; font-size: 7pt; font-weight: bold; color: #1d4ed8; background-color: #eff6ff; border: 1px solid #94a3b8; padding: 2px;">${studentS}</td>
        <td style="text-align: center; font-size: 7pt; font-weight: bold; color: #b45309; background-color: #fefce8; border: 1px solid #94a3b8; padding: 2px;">${studentI}</td>
        <td style="text-align: center; font-size: 7pt; font-weight: bold; color: #b91c1c; background-color: #fef2f2; border: 1px solid #94a3b8; padding: 2px;">${studentA}</td>
        <td style="text-align: center; font-size: 7pt; ${percentStyle} border: 1px solid #94a3b8; padding: 2px;">${percent}%</td>
      </tr>
    `;
  }).join('');

  // Daily totals footer cells
  const footerDailyH = daysMeta.map((dm, idx) => {
    return `<td style="text-align: center; font-size: 6.5pt; font-weight: bold; color: #166534; background-color: #dcfce7; border: 1px solid #94a3b8; padding: 1px;">${dm.isSunday ? '-' : dailyH[idx]}</td>`;
  }).join('');

  const footerDailyS = daysMeta.map((dm, idx) => {
    return `<td style="text-align: center; font-size: 6.5pt; font-weight: bold; color: #1d4ed8; background-color: #dbeafe; border: 1px solid #94a3b8; padding: 1px;">${dm.isSunday ? '-' : dailyS[idx]}</td>`;
  }).join('');

  const footerDailyI = daysMeta.map((dm, idx) => {
    return `<td style="text-align: center; font-size: 6.5pt; font-weight: bold; color: #b45309; background-color: #fef3c7; border: 1px solid #94a3b8; padding: 1px;">${dm.isSunday ? '-' : dailyI[idx]}</td>`;
  }).join('');

  const footerDailyA = daysMeta.map((dm, idx) => {
    return `<td style="text-align: center; font-size: 6.5pt; font-weight: bold; color: #b91c1c; background-color: #fee2e2; border: 1px solid #94a3b8; padding: 1px;">${dm.isSunday ? '-' : dailyA[idx]}</td>`;
  }).join('');

  const totalPossible = (activeClass.students?.length || 1) * effectiveDaysCount;
  const classAvgPercent = totalPossible > 0 ? Math.round((grandTotalH / (grandTotalH + grandTotalS + grandTotalI + grandTotalA || totalPossible)) * 100) : 100;

  const content = `
    <div data-f4-kop="true">
      <!-- KOP RESMI DOKUMEN -->
      <div style="text-align: center; margin-bottom: 10pt; border-bottom: 2px solid #0f172a; padding-bottom: 6pt;">
        <h2 style="margin: 0; font-size: 13pt; text-transform: uppercase; color: #0f172a; border-left: none; padding-left: 0; font-weight: bold;">
          ${namaSekolah}
        </h2>
        <h1 style="margin: 3pt 0 3pt 0; font-size: 15pt; color: #0f172a; border-bottom: none; padding-bottom: 0; font-family: 'Arial Black', Arial, sans-serif;">
          REKAPITULASI PRESENSI / ABSENSI SISWA BULANAN
        </h1>
        <p style="margin: 0; font-size: 9.5pt; font-weight: bold; color: #334155;">
          BULAN: ${namaBulan.toUpperCase()} ${meta.tahun} &bull; TAHUN AJARAN ${tahunAjaran}
        </p>
      </div>

      <!-- IDENTITAS KELAS -->
      <table style="width: 100%; font-size: 8pt; margin-bottom: 8pt; border-collapse: collapse; border: none;">
        <tr>
          <td style="border: none; padding: 2px 0; width: 35%;"><strong>Rombongan Belajar:</strong> ${activeClass.name}</td>
          <td style="border: none; padding: 2px 0; width: 35%;"><strong>Mata Pelajaran:</strong> PJOK / Tematik Terpadu</td>
          <td style="border: none; padding: 2px 0; width: 30%; text-align: right;"><strong>Bulan / Tahun:</strong> ${namaBulan} ${meta.tahun}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;"><strong>Jenjang / Fase:</strong> Kelas ${activeClass.grade} SD (Fase ${activeClass.grade <= 2 ? 'A' : activeClass.grade <= 4 ? 'B' : 'C'})</td>
          <td style="border: none; padding: 2px 0;"><strong>Jumlah Siswa:</strong> ${activeClass.students.length} Orang (${boysCount} L / ${girlsCount} P)</td>
          <td style="border: none; padding: 2px 0; text-align: right;"><strong>Hari Efektif:</strong> ${effectiveDaysCount} Hari</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;"><strong>Guru / Pengampu:</strong> ${namaGuru}</td>
          <td style="border: none; padding: 2px 0;"><strong>Kepala Sekolah:</strong> ${namaKepalaSekolah}</td>
          <td style="border: none; padding: 2px 0; text-align: right;"><strong>Rerata Kehadiran Kelas:</strong> <span style="font-weight: bold; color: #166534;">${classAvgPercent}%</span></td>
        </tr>
      </table>
    </div>

    <div data-f4-section="Bagian 1: Tabel Matriks Presensi Bulanan (${namaBulan} ${meta.tahun}) & Pengesahan" data-f4-orientation="landscape">
      <!-- TABEL UTAMA REKAPITULASI PRESENSI BULANAN -->
      <table style="width: 100%; border-collapse: collapse; font-size: 7pt; margin-bottom: 10pt;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th rowspan="2" style="width: 24px; text-align: center; border: 1px solid #0f172a; padding: 4px 2px;">No.</th>
            <th rowspan="2" style="width: 130px; text-align: left; border: 1px solid #0f172a; padding: 4px 4px;">Nama Peserta Didik</th>
            <th rowspan="2" style="width: 24px; text-align: center; border: 1px solid #0f172a; padding: 4px 2px;">L/P</th>
            <th colspan="${daysInMonth}" style="text-align: center; border: 1px solid #0f172a; padding: 3px 2px; font-size: 7.5pt; letter-spacing: 0.5px;">
              TANGGAL BULAN ${namaBulan.toUpperCase()} ${meta.tahun}
            </th>
            <th colspan="4" style="text-align: center; border: 1px solid #0f172a; padding: 3px 2px; font-size: 7.5pt;">REKAPITULASI</th>
            <th rowspan="2" style="width: 32px; text-align: center; border: 1px solid #0f172a; padding: 4px 2px;">%</th>
          </tr>
          <tr style="background-color: #1e293b; color: #ffffff;">
            ${headerDaysHtml}
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #166534; color: #ffffff; border: 1px solid #94a3b8;">H</th>
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #1d4ed8; color: #ffffff; border: 1px solid #94a3b8;">S</th>
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #b45309; color: #ffffff; border: 1px solid #94a3b8;">I</th>
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #b91c1c; color: #ffffff; border: 1px solid #94a3b8;">A</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="3" style="text-align: right; font-size: 6.5pt; border: 1px solid #94a3b8; padding: 2px 4px;">Jumlah Hadir (H):</td>
            ${footerDailyH}
            <td style="text-align: center; font-size: 7pt; font-weight: bold; background-color: #bbf7d0; color: #14532d; border: 1px solid #94a3b8;">${grandTotalH}</td>
            <td colspan="3" style="background-color: #f1f5f9; border: 1px solid #94a3b8;"></td>
            <td rowspan="4" style="text-align: center; font-size: 8pt; font-weight: bold; background-color: #dcfce7; color: #166534; border: 1px solid #94a3b8;">${classAvgPercent}%</td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="3" style="text-align: right; font-size: 6.5pt; border: 1px solid #94a3b8; padding: 2px 4px;">Jumlah Sakit (S):</td>
            ${footerDailyS}
            <td style="background-color: #f1f5f9; border: 1px solid #94a3b8;"></td>
            <td style="text-align: center; font-size: 7pt; font-weight: bold; background-color: #bfdbfe; color: #1e3a8a; border: 1px solid #94a3b8;">${grandTotalS}</td>
            <td colspan="2" style="background-color: #f1f5f9; border: 1px solid #94a3b8;"></td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="3" style="text-align: right; font-size: 6.5pt; border: 1px solid #94a3b8; padding: 2px 4px;">Jumlah Izin (I):</td>
            ${footerDailyI}
            <td colspan="2" style="background-color: #f1f5f9; border: 1px solid #94a3b8;"></td>
            <td style="text-align: center; font-size: 7pt; font-weight: bold; background-color: #fef08a; color: #713f12; border: 1px solid #94a3b8;">${grandTotalI}</td>
            <td style="background-color: #f1f5f9; border: 1px solid #94a3b8;"></td>
          </tr>
          <tr style="background-color: #f8fafc; font-weight: bold;">
            <td colspan="3" style="text-align: right; font-size: 6.5pt; border: 1px solid #94a3b8; padding: 2px 4px;">Jumlah Alpa (A):</td>
            ${footerDailyA}
            <td colspan="3" style="background-color: #f1f5f9; border: 1px solid #94a3b8;"></td>
            <td style="text-align: center; font-size: 7pt; font-weight: bold; background-color: #fecaca; color: #7f1d1d; border: 1px solid #94a3b8;">${grandTotalA}</td>
          </tr>
        </tfoot>
      </table>

      <!-- KETERANGAN & STATISTIK REKAP -->
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 12pt; border: none;">
        <tr>
          <td style="border: none; width: 60%; vertical-align: top;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6pt; border-radius: 4px;">
              <strong>Keterangan Kode Kehadiran:</strong><br>
              <span style="display: inline-block; width: 85px;"><strong>H</strong> = Hadir</span>
              <span style="display: inline-block; width: 85px;"><strong>S</strong> = Sakit</span>
              <span style="display: inline-block; width: 85px;"><strong>I</strong> = Izin</span>
              <span style="display: inline-block; width: 140px;"><strong>A</strong> = Alpa (Tanpa Keterangan)</span>
              <span style="display: inline-block; width: 120px;"><strong>L</strong> = Libur / Akhir Pekan</span>
            </div>
          </td>
          <td style="border: none; width: 40%; vertical-align: top; padding-left: 10pt;">
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 6pt; border-radius: 4px;">
              <strong>Ringkasan Akumulasi Kelas:</strong><br>
              Total Hadir: <strong>${grandTotalH}</strong> &bull; Sakit: <strong>${grandTotalS}</strong> &bull; Izin: <strong>${grandTotalI}</strong> &bull; Alpa: <strong>${grandTotalA}</strong><br>
              Tingkat Partisipasi Kehadiran: <strong style="color: #166534; font-size: 9pt;">${classAvgPercent}%</strong>
            </div>
          </td>
        </tr>
      </table>

      <!-- LEMBAR PENGESAHAN DAN TANDA TANGAN RESMI -->
      <table style="width: 100%; border: none; font-size: 8pt; margin-top: 14pt; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
            <p style="margin: 0;">Mengetahui,</p>
            <p style="margin: 2pt 0 0 0; font-weight: bold;">Kepala Sekolah ${namaSekolah}</p>
            <br><br><br><br>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaKepalaSekolah}</p>
            <p style="margin: 2pt 0 0 0; color: #475569; font-size: 7.5pt;">NIP. ${nipKepalaSekolah}</p>
          </td>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
            <p style="margin: 0;">${kota}, ${dateStr}</p>
            <p style="margin: 2pt 0 0 0; font-weight: bold;">Guru Kelas / Wali Kelas / PJOK</p>
            <br><br><br><br>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaGuru}</p>
            <p style="margin: 2pt 0 0 0; color: #475569; font-size: 7.5pt;">NIP. ${nipGuru}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithLandscapeDocShell(`Rekap_Absensi_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${meta.tahun}`, content);
}

export interface PjokWeekMeeting {
  weekNum: number;
  date: string;
  topic: string;
  venue?: string;
  executionStatus?: 'Terlaksana' | 'Teori Kelas' | 'Ujian Praktik' | 'Libur';
}

export interface PjokStudentWeeklyRecord {
  status: 'H' | 'S' | 'I' | 'A';
  uniform: boolean; // Kaos + Celana Training + Sepatu
  physicalNote?: string; // e.g. "Bugar", "Dispensasi", "Asma", "Cedera"
}

export interface AbsensiMingguanPjokMeta {
  bulan: number; // 1 - 12
  tahun: number; // e.g. 2026
  namaSekolah?: string;
  namaGuru?: string;
  nipGuru?: string;
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  kota?: string;
  dayOfWeekName?: string; // e.g. "Selasa"
  meetings: PjokWeekMeeting[];
  weeklyRecords: {
    [studentId: string]: {
      [weekNum: number]: PjokStudentWeeklyRecord;
    };
  };
  studentNotes?: {
    [studentId: string]: string;
  };
}

/**
 * 3c. Exports Weekly PJOK Attendance (Presensi Mingguan Khusus Guru PJOK) to Microsoft Word format (Landscape)
 */
export function exportAbsensiMingguanPjokToDoc(activeClass: ClassData, meta: AbsensiMingguanPjokMeta): string {
  const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const bulanIdx = Math.max(1, Math.min(12, meta.bulan)) - 1;
  const namaBulan = BULAN_NAMES[bulanIdx];
  const tahunAjaran = meta.bulan >= 7 
    ? `${meta.tahun}/${meta.tahun + 1}` 
    : `${meta.tahun - 1}/${meta.tahun}`;

  const namaSekolah = meta.namaSekolah || 'SD NEGERI KALIMANTONG';
  const namaGuru = meta.namaGuru || 'Ahmad Rafsanjani, S.Pd.';
  const nipGuru = meta.nipGuru || '19880512 201503 1 002';
  const namaKepalaSekolah = meta.namaKepalaSekolah || 'H. Muhammad Nur, M.Pd.';
  const nipKepalaSekolah = meta.nipKepalaSekolah || '19750814 199903 1 004';
  const kota = meta.kota || 'Jakarta';

  const boysCount = (activeClass.students || []).filter(s => s.gender === 'L').length;
  const girlsCount = (activeClass.students || []).filter(s => s.gender === 'P').length;

  const meetings = meta.meetings || [];
  const meetingCount = meetings.length;

  let grandTotalH = 0;
  let grandTotalS = 0;
  let grandTotalI = 0;
  let grandTotalA = 0;
  let grandTotalUniform = 0;
  let totalOpportunities = 0;

  // Build Table Rows
  const studentRows = (activeClass.students || []).map((student, sIdx) => {
    let studentH = 0;
    let studentS = 0;
    let studentI = 0;
    let studentA = 0;
    let studentUniformCount = 0;

    const weekCells = meetings.map(m => {
      const rec = meta.weeklyRecords?.[student.id]?.[m.weekNum] || { status: 'H', uniform: true };
      const status = rec.status || 'H';
      const isUniform = rec.uniform !== false;

      if (status === 'H') {
        studentH++;
        grandTotalH++;
      } else if (status === 'S') {
        studentS++;
        grandTotalS++;
      } else if (status === 'I') {
        studentI++;
        grandTotalI++;
      } else if (status === 'A') {
        studentA++;
        grandTotalA++;
      }

      if (isUniform && status === 'H') {
        studentUniformCount++;
        grandTotalUniform++;
      }
      totalOpportunities++;

      let statusBg = '#f0fdf4';
      let statusColor = '#166534';
      if (status === 'S') { statusBg = '#eff6ff'; statusColor = '#1d4ed8'; }
      if (status === 'I') { statusBg = '#fefce8'; statusColor = '#b45309'; }
      if (status === 'A') { statusBg = '#fef2f2'; statusColor = '#b91c1c'; }

      const uniformBadge = isUniform 
        ? `<span style="color: #166534; font-size: 6pt; font-weight: bold;">[Seragam]</span>`
        : `<span style="color: #dc2626; font-size: 6pt; font-weight: bold;">[No Srgm]</span>`;

      const physNote = rec.physicalNote ? `<div style="font-size: 5.5pt; color: #64748b;">${rec.physicalNote}</div>` : '';

      return `
        <td style="background-color: ${statusBg}; text-align: center; border: 1px solid #94a3b8; padding: 4px 2px;">
          <div style="font-weight: bold; color: ${statusColor}; font-size: 8pt;">${status}</div>
          ${status === 'H' ? uniformBadge : ''}
          ${physNote}
        </td>
      `;
    }).join('');

    const baseDivider = meetingCount > 0 ? meetingCount : 1;
    const percent = Math.round((studentH / baseDivider) * 100);
    const customNote = meta.studentNotes?.[student.id] || (studentH === meetingCount ? 'Partisipasi fisik sangat baik' : studentS > 0 ? 'Perlu pemantauan kebugaran' : 'Cukup aktif');

    let percentStyle = 'color: #166534; font-weight: bold; background-color: #f0fdf4;';
    if (percent < 75) {
      percentStyle = 'color: #b91c1c; font-weight: bold; background-color: #fef2f2;';
    }

    return `
      <tr style="${sIdx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px 2px;">${sIdx + 1}</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 3px 5px; font-weight: 600;">${student.name}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px 2px; color: ${student.gender === 'L' ? '#1d4ed8' : '#db2777'}; font-weight: bold;">${student.gender}</td>
        ${weekCells}
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #166534; background-color: #f0fdf4;">${studentH}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #1d4ed8; background-color: #eff6ff;">${studentS}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #b45309; background-color: #fefce8;">${studentI}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #b91c1c; background-color: #fef2f2;">${studentA}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; ${percentStyle}">${percent}%</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 3px 5px; font-size: 6.5pt; color: #475569;">${customNote}</td>
      </tr>
    `;
  }).join('');

  const classAvgPercent = activeClass.students.length > 0 && meetingCount > 0
    ? Math.round((grandTotalH / (activeClass.students.length * meetingCount)) * 100)
    : 100;

  const content = `
    <div data-f4-kop="true">
      <!-- HEADER RESMI INSTANSI -->
      <div style="text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 6pt; margin-bottom: 10pt;">
        <p style="margin: 0; font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.8px;">
          PEMERINTAH KOTA / KABUPATEN DINAS PENDIDIKAN DAN KEBUDAYAAN
        </p>
        <h2 style="margin: 2pt 0 1pt 0; font-size: 13pt; color: #0f172a; text-transform: uppercase; border-left: none; padding-left: 0; font-family: 'Arial Black', Arial, sans-serif;">
          ${namaSekolah}
        </h2>
        <h1 style="margin: 3pt 0 3pt 0; font-size: 14pt; color: #0f172a; border-bottom: none; padding-bottom: 0; font-family: 'Arial Black', Arial, sans-serif;">
          PRESENSI & OBSERVASI PEMBELAJARAN MINGGUAN PJOK (1 BULAN)
        </h1>
        <p style="margin: 0; font-size: 9pt; font-weight: bold; color: #334155;">
          BULAN: ${namaBulan.toUpperCase()} ${meta.tahun} &bull; TAHUN AJARAN ${tahunAjaran} &bull; MATA PELAJARAN: PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN
        </p>
      </div>

      <!-- IDENTITAS KELAS & JADWAL -->
      <table style="width: 100%; font-size: 8pt; margin-bottom: 8pt; border-collapse: collapse; border: none;">
        <tr>
          <td style="border: none; padding: 2px 0; width: 35%;"><strong>Rombongan Belajar:</strong> ${activeClass.name} (Kelas ${activeClass.grade} SD)</td>
          <td style="border: none; padding: 2px 0; width: 35%;"><strong>Jadwal Pertemuan:</strong> Setiap Hari ${meta.dayOfWeekName || 'Selasa'}</td>
          <td style="border: none; padding: 2px 0; width: 30%; text-align: right;"><strong>Periode:</strong> ${namaBulan} ${meta.tahun}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;"><strong>Fase Kurikulum:</strong> Fase ${activeClass.grade <= 2 ? 'A' : activeClass.grade <= 4 ? 'B' : 'C'}</td>
          <td style="border: none; padding: 2px 0;"><strong>Jumlah Peserta Didik:</strong> ${activeClass.students.length} Siswa (${boysCount} L / ${girlsCount} P)</td>
          <td style="border: none; padding: 2px 0; text-align: right;"><strong>Total Pertemuan:</strong> ${meetingCount} Pekan Tatap Muka</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;"><strong>Guru PJOK Pengampu:</strong> ${namaGuru}</td>
          <td style="border: none; padding: 2px 0;"><strong>Kepala Sekolah:</strong> ${namaKepalaSekolah}</td>
          <td style="border: none; padding: 2px 0; text-align: right;"><strong>Rata-rata Kehadiran:</strong> <span style="font-weight: bold; color: #166534;">${classAvgPercent}%</span></td>
        </tr>
      </table>
    </div>

    <div data-f4-section="Bagian 1: Rincian Pertemuan & Matriks Presensi Mingguan PJOK" data-f4-orientation="landscape">
      <!-- TABEL RINCIAN PERTEMUAN MINGGUAN -->
      <div style="margin-bottom: 8pt;">
        <p style="margin: 0 0 3pt 0; font-size: 8pt; font-weight: bold; color: #1e293b;">Rincian Materi Pertemuan Mingguan PJOK:</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt;">
          <thead>
            <tr style="background-color: #047857; color: #ffffff;">
              <th style="width: 15%; text-align: center; border: 1px solid #047857; padding: 3px;">Pekan / Minggu</th>
              <th style="width: 18%; text-align: center; border: 1px solid #047857; padding: 3px;">Tanggal Pertemuan</th>
              <th style="width: 47%; text-align: left; border: 1px solid #047857; padding: 3px 6px;">Materi / Aktivitas Pembelajaran PJOK</th>
              <th style="width: 20%; text-align: center; border: 1px solid #047857; padding: 3px;">Lokasi / Status</th>
            </tr>
          </thead>
          <tbody>
            ${meetings.map(m => `
              <tr>
                <td style="text-align: center; font-weight: bold; border: 1px solid #cbd5e1; padding: 3px;">Minggu Ke-${m.weekNum}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px;">${m.date || '-'}</td>
                <td style="text-align: left; border: 1px solid #cbd5e1; padding: 3px 6px;">${m.topic || 'Aktivitas Kebugaran & Olahraga'}</td>
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px; font-size: 7pt; color: #047857; font-weight: 600;">${m.venue || 'Lapangan Olahraga'} (${m.executionStatus || 'Terlaksana'})</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- TABEL UTAMA MATRIKS PRESENSI MINGGUAN SISWA -->
      <table style="width: 100%; border-collapse: collapse; font-size: 7pt; margin-bottom: 10pt;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th rowspan="2" style="width: 24px; text-align: center; border: 1px solid #0f172a; padding: 4px 2px;">No.</th>
            <th rowspan="2" style="width: 140px; text-align: left; border: 1px solid #0f172a; padding: 4px 5px;">Nama Peserta Didik</th>
            <th rowspan="2" style="width: 24px; text-align: center; border: 1px solid #0f172a; padding: 4px 2px;">L/P</th>
            <th colspan="${meetingCount}" style="text-align: center; border: 1px solid #0f172a; padding: 3px 2px; font-size: 7.5pt;">
              PRESENSI PERTEMUAN MINGGUAN BULAN ${namaBulan.toUpperCase()} ${meta.tahun}
            </th>
            <th colspan="4" style="text-align: center; border: 1px solid #0f172a; padding: 3px 2px;">REKAP</th>
            <th rowspan="2" style="width: 32px; text-align: center; border: 1px solid #0f172a; padding: 4px 2px;">%</th>
            <th rowspan="2" style="width: 120px; text-align: left; border: 1px solid #0f172a; padding: 4px 5px;">Catatan Observasi Fisik Guru</th>
          </tr>
          <tr style="background-color: #1e293b; color: #ffffff;">
            ${meetings.map(m => `
              <th style="width: 55px; text-align: center; font-size: 6.5pt; border: 1px solid #94a3b8; padding: 3px 1px;">
                Minggu ${m.weekNum}<br>
                <span style="font-weight: normal; font-size: 6pt; opacity: 0.85;">${m.date ? m.date.slice(5) : ''}</span>
              </th>
            `).join('')}
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #166534; color: #ffffff; border: 1px solid #94a3b8;">H</th>
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #1d4ed8; color: #ffffff; border: 1px solid #94a3b8;">S</th>
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #b45309; color: #ffffff; border: 1px solid #94a3b8;">I</th>
            <th style="width: 18px; text-align: center; font-size: 6.5pt; background-color: #b91c1c; color: #ffffff; border: 1px solid #94a3b8;">A</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="3" style="text-align: right; padding: 4px; border: 1px solid #94a3b8;">TOTAL KELAS:</td>
            ${meetings.map(m => {
              const mH = (activeClass.students || []).filter(s => {
                const r = meta.weeklyRecords?.[s.id]?.[m.weekNum];
                return !r || r.status === 'H';
              }).length;
              return `<td style="text-align: center; border: 1px solid #94a3b8; font-size: 6.5pt; color: #166534;">${mH} Hadir</td>`;
            }).join('')}
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #dcfce7; color: #166534;">${grandTotalH}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #dbeafe; color: #1d4ed8;">${grandTotalS}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #fef9c3; color: #b45309;">${grandTotalI}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #fee2e2; color: #b91c1c;">${grandTotalA}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; color: #166534;">${classAvgPercent}%</td>
            <td style="border: 1px solid #94a3b8;"></td>
          </tr>
        </tfoot>
      </table>

      <!-- KETERANGAN KODE & CEKLIS FISIK -->
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 12pt; border: none;">
        <tr>
          <td style="border: none; width: 60%; vertical-align: top;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6pt; border-radius: 4px;">
              <strong>Keterangan Format Presensi Mingguan PJOK:</strong><br>
              <span style="display: inline-block; width: 90px;"><strong>H</strong> = Hadir</span>
              <span style="display: inline-block; width: 90px;"><strong>S</strong> = Sakit</span>
              <span style="display: inline-block; width: 90px;"><strong>I</strong> = Izin</span>
              <span style="display: inline-block; width: 140px;"><strong>A</strong> = Alpa (Tanpa Keterangan)</span><br>
              <span style="display: inline-block; width: 180px;"><strong>[Seragam]</strong> = Pakaian Olahraga Lengkap</span>
              <span style="display: inline-block; width: 180px;"><strong>[No Srgm]</strong> = Tidak Berseragam Lengkap</span>
            </div>
          </td>
          <td style="border: none; width: 40%; vertical-align: top; padding-left: 10pt;">
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 6pt; border-radius: 4px;">
              <strong>Ringkasan Kebugaran & Kepatuhan Kelas:</strong><br>
              Total Hadir: <strong>${grandTotalH}</strong> &bull; Sakit: <strong>${grandTotalS}</strong> &bull; Izin: <strong>${grandTotalI}</strong> &bull; Alpa: <strong>${grandTotalA}</strong><br>
              Rasio Kehadiran Lapangan: <strong style="color: #166534; font-size: 9pt;">${classAvgPercent}%</strong><br>
              Kepatuhan Seragam Olahraga: <strong style="color: #047857;">${totalOpportunities > 0 ? Math.round((grandTotalUniform / totalOpportunities) * 100) : 100}%</strong>
            </div>
          </td>
        </tr>
      </table>

      <!-- LEMBAR PENGESAHAN TANDA TANGAN -->
      <table style="width: 100%; border: none; font-size: 8pt; margin-top: 14pt; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
            <p style="margin: 0;">Mengetahui,</p>
            <p style="margin: 2pt 0 0 0; font-weight: bold;">Kepala Sekolah ${namaSekolah}</p>
            <br><br><br><br>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaKepalaSekolah}</p>
            <p style="margin: 2pt 0 0 0; color: #475569; font-size: 7.5pt;">NIP. ${nipKepalaSekolah}</p>
          </td>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
            <p style="margin: 0;">${kota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 2pt 0 0 0; font-weight: bold;">Guru Mata Pelajaran PJOK</p>
            <br><br><br><br>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaGuru}</p>
            <p style="margin: 2pt 0 0 0; color: #475569; font-size: 7.5pt;">NIP. ${nipGuru}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithLandscapeDocShell(`Presensi_Mingguan_PJOK_${activeClass.name.replace(/\s+/g, '_')}_${namaBulan}_${meta.tahun}`, content);
}

export interface MonthSummaryPerStudent {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  totalMeetings: number;
  uniformCount: number;
}

export interface SemesterWeekInfo {
  weekNum: number;
  dateStr?: string;
  dateLabel?: string;
}

export interface StudentSemesterPjokRow {
  studentId: string;
  studentName: string;
  nisn?: string;
  gender: 'L' | 'P';
  weeklyStatus?: { [monthNum: number]: { [weekNum: number]: 'H' | 'S' | 'I' | 'A' } };
  monthlyData: { [monthNum: number]: MonthSummaryPerStudent }; // month 7..12 or 1..6
  semesterTotalH: number;
  semesterTotalS: number;
  semesterTotalI: number;
  semesterTotalA: number;
  semesterTotalMeetings: number;
  semesterTotalJp: number; // e.g. semesterTotalH * 3
  semesterAttendancePercent: number; // e.g. 95%
  semesterUniformPercent: number; // e.g. 92%
  predicate: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  catatanRaporPjok: string;
}

export interface RekapSemesterPjokMeta {
  semester: 1 | 2; // 1 = Ganjil, 2 = Genap
  tahunAjaran: string; // e.g. "2026/2027"
  namaSekolah?: string;
  namaGuru?: string;
  nipGuru?: string;
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  kota?: string;
  jpPerPertemuan?: number; // default 3 JP
  months: { monthNum: number; monthName: string; meetingCount: number; weeks?: SemesterWeekInfo[] }[];
  studentRows: StudentSemesterPjokRow[];
  classStats: {
    avgAttendancePercent: number;
    avgUniformPercent: number;
    totalSemesterJp: number;
    perfectStudentsCount: number;
    attentionStudentsCount: number;
  };
}

/**
 * 3d. Exports 1 Semester PJOK Attendance Recapitulation to Microsoft Word format (Landscape)
 */
export function exportRekapSemesterPjokToDoc(activeClass: ClassData, meta: RekapSemesterPjokMeta): string {
  const namaSekolah = meta.namaSekolah || 'SD NEGERI KALIMANTONG';
  const namaGuru = meta.namaGuru || 'Ahmad Rafsanjani, S.Pd.';
  const nipGuru = meta.nipGuru || '19880512 201503 1 002';
  const namaKepalaSekolah = meta.namaKepalaSekolah || 'H. Muhammad Nur, M.Pd.';
  const nipKepalaSekolah = meta.nipKepalaSekolah || '19750814 199903 1 004';
  const kota = meta.kota || 'Jakarta';

  const boysCount = (activeClass.students || []).filter(s => s.gender === 'L').length;
  const girlsCount = (activeClass.students || []).filter(s => s.gender === 'P').length;

  const months = meta.months || [];
  const jpPerPertemuan = meta.jpPerPertemuan || 3;

  let grandSemesterH = 0;
  let grandSemesterS = 0;
  let grandSemesterI = 0;
  let grandSemesterA = 0;

  // Build Table Rows
  const studentRowsHtml = (meta.studentRows || []).map((row, sIdx) => {
    grandSemesterH += row.semesterTotalH;
    grandSemesterS += row.semesterTotalS;
    grandSemesterI += row.semesterTotalI;
    grandSemesterA += row.semesterTotalA;

    const monthlyCells = months.map(m => {
      const weeksList = m.weeks && m.weeks.length > 0 
        ? m.weeks 
        : Array.from({ length: m.meetingCount || 4 }, (_, i) => ({ weekNum: i + 1 }));

      return weeksList.map(w => {
        const status = row.weeklyStatus?.[m.monthNum]?.[w.weekNum] || 'H';
        let bg = '#f0fdf4';
        let col = '#166534';
        if (status === 'S') { bg = '#eff6ff'; col = '#1d4ed8'; }
        if (status === 'I') { bg = '#fefce8'; col = '#b45309'; }
        if (status === 'A') { bg = '#fef2f2'; col = '#b91c1c'; }

        return `<td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: ${col}; background-color: ${bg}; padding: 3px 1px; font-size: 6.5pt;">${status}</td>`;
      }).join('');
    }).join('');

    let predicateColor = '#166534';
    if (row.predicate === 'Baik') predicateColor = '#0369a1';
    else if (row.predicate === 'Cukup') predicateColor = '#b45309';
    else if (row.predicate === 'Perlu Bimbingan') predicateColor = '#b91c1c';

    return `
      <tr style="${sIdx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px 2px;">${sIdx + 1}</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 3px 5px; font-weight: 600;">${row.studentName}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; padding: 3px 2px; color: ${row.gender === 'L' ? '#1d4ed8' : '#db2777'}; font-weight: bold;">${row.gender}</td>
        ${monthlyCells}
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #166534; background-color: #dcfce7; padding: 3px 2px;">${row.semesterTotalH}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #1d4ed8; background-color: #dbeafe; padding: 3px 2px;">${row.semesterTotalS}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #b45309; background-color: #fef9c3; padding: 3px 2px;">${row.semesterTotalI}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #b91c1c; background-color: #fee2e2; padding: 3px 2px;">${row.semesterTotalA}</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #047857; padding: 3px 2px;">${row.semesterTotalJp} JP</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: #166534; background-color: #f0fdf4; padding: 3px 2px;">${row.semesterAttendancePercent}%</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: 600; color: #0369a1; padding: 3px 2px;">${row.semesterUniformPercent}%</td>
        <td style="text-align: center; border: 1px solid #cbd5e1; font-weight: bold; color: ${predicateColor}; padding: 3px 2px; font-size: 6.5pt;">${row.predicate}</td>
        <td style="text-align: left; border: 1px solid #cbd5e1; padding: 3px 4px; font-size: 6.5pt; color: #475569;">${row.catatanRaporPjok}</td>
      </tr>
    `;
  }).join('');

  const content = `
    <div data-f4-kop="true">
      <!-- HEADER RESMI INSTANSI -->
      <div style="text-align: center; border-bottom: 2.5px solid #0f172a; padding-bottom: 6pt; margin-bottom: 10pt;">
        <p style="margin: 0; font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.8px;">
          PEMERINTAH KOTA / KABUPATEN DINAS PENDIDIKAN DAN KEBUDAYAAN
        </p>
        <h2 style="margin: 2pt 0 1pt 0; font-size: 13pt; color: #0f172a; text-transform: uppercase; border-left: none; padding-left: 0; font-family: 'Arial Black', Arial, sans-serif;">
          ${namaSekolah}
        </h2>
        <h1 style="margin: 3pt 0 3pt 0; font-size: 13.5pt; color: #0f172a; border-bottom: none; padding-bottom: 0; font-family: 'Arial Black', Arial, sans-serif;">
          REKAPITULASI PRESENSI MINGGUAN GURU PJOK SEMESTER ${meta.semester === 1 ? '1 (GANJIL: JULI - DESEMBER)' : '2 (GENAP: JANUARI - JUNI)'}
        </h1>
        <p style="margin: 0; font-size: 9pt; font-weight: bold; color: #334155;">
          TAHUN AJARAN ${meta.tahunAjaran} &bull; MATA PELAJARAN: PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN (PJOK)
        </p>
      </div>

      <!-- IDENTITAS KELAS & RINGKASAN SEMESTER -->
      <table style="width: 100%; font-size: 8pt; margin-bottom: 8pt; border-collapse: collapse; border: none;">
        <tr>
          <td style="border: none; padding: 2px 0; width: 35%;"><strong>Rombongan Belajar:</strong> ${activeClass.name} (Kelas ${activeClass.grade} SD)</td>
          <td style="border: none; padding: 2px 0; width: 35%;"><strong>Periode Semester:</strong> Semester ${meta.semester === 1 ? '1 (Juli - Desember)' : '2 (Januari - Juni)'}</td>
          <td style="border: none; padding: 2px 0; width: 30%; text-align: right;"><strong>Tahun Ajaran:</strong> ${meta.tahunAjaran}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;"><strong>Fase Kurikulum:</strong> Fase ${activeClass.grade <= 2 ? 'A' : activeClass.grade <= 4 ? 'B' : 'C'}</td>
          <td style="border: none; padding: 2px 0;"><strong>Jumlah Peserta Didik:</strong> ${activeClass.students.length} Siswa (${boysCount} L / ${girlsCount} P)</td>
          <td style="border: none; padding: 2px 0; text-align: right;"><strong>Rata-rata Kehadiran Semester:</strong> <span style="font-weight: bold; color: #166534;">${meta.classStats.avgAttendancePercent}%</span></td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;"><strong>Guru PJOK Pengampu:</strong> ${namaGuru}</td>
          <td style="border: none; padding: 2px 0;"><strong>Kepala Sekolah:</strong> ${namaKepalaSekolah}</td>
          <td style="border: none; padding: 2px 0; text-align: right;"><strong>Rata-rata Kepatuhan Seragam:</strong> <span style="font-weight: bold; color: #0369a1;">${meta.classStats.avgUniformPercent}%</span></td>
        </tr>
      </table>
    </div>

    <div data-f4-section="Bagian 1: Tabel Rekapitulasi Presensi Semester ${meta.semester} PJOK & Pengesahan" data-f4-orientation="landscape">
      <!-- TABEL UTAMA REKAPITULASI SEMESTER (DENGAN MINGGU 1, 2, 3, 4, 5 PER BULAN) -->
      <table style="width: 100%; border-collapse: collapse; font-size: 6pt; margin-bottom: 10pt;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th rowspan="2" style="width: 18px; text-align: center; border: 1px solid #0f172a; padding: 4px 1px;">No.</th>
            <th rowspan="2" style="width: 110px; text-align: left; border: 1px solid #0f172a; padding: 4px 3px;">Nama Peserta Didik</th>
            <th rowspan="2" style="width: 16px; text-align: center; border: 1px solid #0f172a; padding: 4px 1px;">L/P</th>
            ${months.map(m => {
              const wLen = m.weeks && m.weeks.length > 0 ? m.weeks.length : (m.meetingCount || 4);
              return `
                <th colspan="${wLen}" style="text-align: center; border: 1px solid #0f172a; padding: 2px 1px; font-size: 6.5pt; letter-spacing: 0.5px;">
                  ${m.monthName.toUpperCase()}<br>
                  <span style="font-weight: normal; font-size: 5pt; opacity: 0.85;">(${wLen} Minggu)</span>
                </th>
              `;
            }).join('')}
            <th colspan="4" style="text-align: center; border: 1px solid #0f172a; padding: 2px 1px; background-color: #047857;">TOTAL SEMESTER</th>
            <th rowspan="2" style="width: 28px; text-align: center; border: 1px solid #0f172a; padding: 4px 1px;">TOTAL JP</th>
            <th rowspan="2" style="width: 22px; text-align: center; border: 1px solid #0f172a; padding: 4px 1px;">% HADIR</th>
            <th rowspan="2" style="width: 22px; text-align: center; border: 1px solid #0f172a; padding: 4px 1px;">% SRGM</th>
            <th rowspan="2" style="width: 40px; text-align: center; border: 1px solid #0f172a; padding: 4px 1px;">PREDIKAT</th>
            <th rowspan="2" style="width: 100px; text-align: left; border: 1px solid #0f172a; padding: 4px 3px;">Catatan Rapor & Kebugaran PJOK</th>
          </tr>
          <tr style="background-color: #1e293b; color: #ffffff;">
            ${months.map(m => {
              const weeksList = m.weeks && m.weeks.length > 0 
                ? m.weeks 
                : Array.from({ length: m.meetingCount || 4 }, (_, i) => ({ weekNum: i + 1 }));
              return weeksList.map(w => `
                <th style="width: 18px; text-align: center; font-size: 5pt; border: 1px solid #94a3b8; padding: 2px 1px; font-weight: bold;">
                  Ming ${w.weekNum}
                </th>
              `).join('');
            }).join('')}
            <th style="width: 13px; text-align: center; font-size: 5.5pt; background-color: #166534; color: #ffffff; border: 1px solid #94a3b8;">H</th>
            <th style="width: 13px; text-align: center; font-size: 5.5pt; background-color: #1d4ed8; color: #ffffff; border: 1px solid #94a3b8;">S</th>
            <th style="width: 13px; text-align: center; font-size: 5.5pt; background-color: #b45309; color: #ffffff; border: 1px solid #94a3b8;">I</th>
            <th style="width: 13px; text-align: center; font-size: 5.5pt; background-color: #b91c1c; color: #ffffff; border: 1px solid #94a3b8;">A</th>
          </tr>
        </thead>
        <tbody>
          ${studentRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="3" style="text-align: right; padding: 3px; border: 1px solid #94a3b8; font-size: 6pt;">TOTAL KELAS:</td>
            ${months.map(m => {
              const weeksList = m.weeks && m.weeks.length > 0 
                ? m.weeks 
                : Array.from({ length: m.meetingCount || 4 }, (_, i) => ({ weekNum: i + 1 }));
              return weeksList.map(w => {
                const presentCount = meta.studentRows.filter(r => {
                  const st = r.weeklyStatus?.[m.monthNum]?.[w.weekNum];
                  return !st || st === 'H';
                }).length;
                return `<td style="text-align: center; border: 1px solid #94a3b8; font-weight: bold; color: #166534; font-size: 5.5pt;">${presentCount}</td>`;
              }).join('');
            }).join('')}
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #dcfce7; color: #166534; font-weight: bold;">${grandSemesterH}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #dbeafe; color: #1d4ed8; font-weight: bold;">${grandSemesterS}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #fef9c3; color: #b45309; font-weight: bold;">${grandSemesterI}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; background-color: #fee2e2; color: #b91c1c; font-weight: bold;">${grandSemesterA}</td>
            <td style="text-align: center; border: 1px solid #94a3b8; color: #047857; font-weight: bold;">${meta.classStats.totalSemesterJp} JP</td>
            <td style="text-align: center; border: 1px solid #94a3b8; color: #166534; font-weight: bold;">${meta.classStats.avgAttendancePercent}%</td>
            <td style="text-align: center; border: 1px solid #94a3b8; color: #0369a1; font-weight: bold;">${meta.classStats.avgUniformPercent}%</td>
            <td colspan="2" style="border: 1px solid #94a3b8;"></td>
          </tr>
        </tfoot>
      </table>

      <!-- RINGKASAN EVALUASI SEMESTER & LEMBAR PENGESAHAN -->
      <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; margin-bottom: 12pt; border: none;">
        <tr>
          <td style="border: none; width: 60%; vertical-align: top;">
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6pt; border-radius: 4px;">
              <strong>Keterangan Format Presensi Mingguan:</strong><br>
              <span style="display: inline-block; width: 140px;"><strong>M1, M2, M3, M4, M5:</strong> Minggu ke-1 s.d. ke-5</span><br>
              <span style="display: inline-block; width: 85px;"><strong>H</strong> = Hadir</span>
              <span style="display: inline-block; width: 85px;"><strong>S</strong> = Sakit</span>
              <span style="display: inline-block; width: 85px;"><strong>I</strong> = Izin</span>
              <span style="display: inline-block; width: 85px;"><strong>A</strong> = Alpa</span>
            </div>
          </td>
          <td style="border: none; width: 40%; vertical-align: top; padding-left: 10pt;">
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 6pt; border-radius: 4px;">
              <strong>Ringkasan Semester Rombel:</strong><br>
              Rasio Kehadiran: <strong style="color: #166534;">${meta.classStats.avgAttendancePercent}%</strong> &bull; Kepatuhan Seragam: <strong style="color: #0369a1;">${meta.classStats.avgUniformPercent}%</strong><br>
              Hadir Sempurna (100%): <strong>${meta.classStats.perfectStudentsCount}</strong> Siswa<br>
              Perhatian Kebugaran Khusus: <strong>${meta.classStats.attentionStudentsCount}</strong> Siswa
            </div>
          </td>
        </tr>
      </table>

      <!-- LEMBAR PENGESAHAN TANDA TANGAN -->
      <table style="width: 100%; border: none; font-size: 8pt; margin-top: 14pt; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
            <p style="margin: 0;">Mengetahui,</p>
            <p style="margin: 2pt 0 0 0; font-weight: bold;">Kepala Sekolah ${namaSekolah}</p>
            <br><br><br><br>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaKepalaSekolah}</p>
            <p style="margin: 2pt 0 0 0; color: #475569; font-size: 7.5pt;">NIP. ${nipKepalaSekolah}</p>
          </td>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
            <p style="margin: 0;">${kota}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 2pt 0 0 0; font-weight: bold;">Guru Mata Pelajaran PJOK</p>
            <br><br><br><br>
            <p style="margin: 0; font-weight: bold; text-decoration: underline;">${namaGuru}</p>
            <p style="margin: 2pt 0 0 0; color: #475569; font-size: 7.5pt;">NIP. ${nipGuru}</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithLandscapeDocShell(`Rekap_Semester_PJOK_${activeClass.name.replace(/\s+/g, '_')}_Sem_${meta.semester}_${meta.tahunAjaran.replace(/\//g, '-')}`, content);
}

/**
 * 4. Exports Student Scores Portfolio to Google Docs compatible Word Document
 */
export function exportPenilaianToDoc(activeClass: ClassData): string {
  const rows = activeClass.students.map((st, idx) => {
    const cog = st.scores.cognitive;
    const psy = st.scores.psychomotor;
    const aff = st.scores.affective;
    const avg = Math.round((cog + psy + aff) / 3);

    let avgStyle = 'color: #334155;';
    if (avg >= 85) avgStyle = 'color: #15803d; font-weight: bold; background-color: #f0fdf4;';
    else if (avg >= 70) avgStyle = 'color: #1e293b; font-weight: bold;';
    else avgStyle = 'color: #b91c1c; font-weight: bold; background-color: #fef2f2;';

    const bgRow = idx % 2 === 1 ? 'class="bg-row-alt"' : '';

    return `
      <tr ${bgRow}>
        <td style="text-align: center; font-family: 'Courier New', monospace;">${idx + 1}</td>
        <td style="font-weight: bold;">
          <div>${st.name}</div>
          ${st.nisn ? `<div style="font-size: 8.5pt; font-weight: normal; color: #64748b; font-family: monospace;">NISN: ${st.nisn}</div>` : ''}
        </td>
        <td style="text-align: center; font-weight: bold;">${st.gender}</td>
        <td style="text-align: center; font-family: 'Courier New', monospace;">${cog}</td>
        <td style="text-align: center; font-family: 'Courier New', monospace;">${psy}</td>
        <td style="text-align: center; font-family: 'Courier New', monospace;">${aff}</td>
        <td style="text-align: center; font-family: 'Courier New', monospace; ${avgStyle}">${avg}</td>
      </tr>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1>REKAP NILAI KINERJA PJOK (PORTOFOLIO)</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">DOKUMEN EVALUASI KOMPREHENSIF TIGA RANAH PJOK</p>

      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Rombongan Belajar:</strong> ${activeClass.name}</td>
            <td width="50%" style="text-align: right;"><strong>Kategori:</strong> Formatif & Sumatif Terpadu</td>
          </tr>
          <tr>
            <td><strong>Aspek Evaluasi:</strong> Kognitif, Psikomotorik, Afektif</td>
            <td style="text-align: right;"><strong>Jenjang Kelas:</strong> Kelas ${activeClass.grade} SD</td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Tabel Rekap Nilai Kinerja PJOK & Pengesahan">
      <table>
        <thead>
          <tr>
            <th width="6%" style="text-align: center;">No.</th>
            <th width="34%">Nama Siswa</th>
            <th width="8%" style="text-align: center;">L/P</th>
            <th width="13%" style="text-align: center;">Kognitif<br>(Pengetahuan)</th>
            <th width="13%" style="text-align: center;">Psikomotorik<br>(Keterampilan)</th>
            <th width="13%" style="text-align: center;">Afektif<br>(Sikap)</th>
            <th width="13%" style="text-align: center; background-color: #cbd5e1;">Rerata<br>(Nilai Akhir)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
          <td>
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell(`Daftar_Nilai_PJOK_${activeClass.name.replace(' ', '_')}`, content);
}

/**
 * 5. Exports Jurnal Harian to Google Docs compatible Word Document
 */
export function exportJurnalToDoc(journals: JurnalMengajar[]): string {
  const rows = journals.map((j, idx) => {
    const bgRow = idx % 2 === 1 ? 'class="bg-row-alt"' : '';
    return `
      <tr ${bgRow}>
        <td style="text-align: center; font-family: 'Courier New', monospace;">${idx + 1}</td>
        <td style="font-family: 'Courier New', monospace; font-size: 9.5pt;">${j.date}</td>
        <td style="font-weight: bold; font-size: 9.5pt; text-align: center;">${j.className}</td>
        <td style="font-weight: bold; font-size: 9.5pt;">${j.materi}</td>
        <td style="font-size: 9.5pt; line-height: 1.4;">${j.catatanKejadian}</td>
        <td style="font-size: 9.5pt; line-height: 1.4; background-color: #f0fdf4; color: #14532d;">${j.tindakLanjut || '<span style="color: #94a3b8;">-</span>'}</td>
      </tr>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1>JURNAL HARIAN GURU PJOK</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">LOG KEJADIAN, CATATAN CEDERA, DAN SPORTIVITAS LAPANGAN</p>
    </div>

    <div data-f4-section="Bagian 1: Tabel Jurnal Harian Guru PJOK & Pengesahan">
      <table>
        <thead>
          <tr>
            <th width="5%" style="text-align: center;">No.</th>
            <th width="15%">Tanggal</th>
            <th width="10%" style="text-align: center;">Rombel</th>
            <th width="20%">Materi</th>
            <th width="30%">Catatan Kejadian Pembelajaran</th>
            <th width="20%" style="background-color: #d1fae5;">Tindak Lanjut / Solusi</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #94a3b8;">Belum ada data jurnal mengajar yang direkam.</td></tr>'}
        </tbody>
      </table>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
          <td>
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell('Jurnal_Harian_PJOK', content);
}

/**
 * 6. Exports Rubrik Fisik Kinerja to Google Docs compatible Word Document
 */
export function exportRubrikToDoc(rubrik: RubrikFisik): string {
  const cards = rubrik.indikator.map((ind, idx) => `
    <div style="margin-bottom: 15pt; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden;">
      <div style="background-color: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-weight: bold; font-size: 10.5pt; color: #0f172a;">
        <span style="background-color: #059669; color: white; padding: 2px 6px; border-radius: 50%; font-family: monospace; font-size: 9.5pt; margin-right: 6px;">${idx + 1}</span>
        Indikator: ${ind.nama}
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 0;">
        <tr>
          <th width="33.33%" style="background-color: #f0fdf4; color: #166534; border: none; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-size: 9.5pt;">Sangat Baik (86-100)</th>
          <th width="33.33%" style="background-color: #fffbeb; color: #92400e; border: none; border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; font-size: 9.5pt;">Layak / Cukup (71-85)</th>
          <th width="33.33%" style="background-color: #fef2f2; color: #991b1b; border: none; border-bottom: 1px solid #cbd5e1; font-size: 9.5pt;">Perlu Bimbingan (0-70)</th>
        </tr>
        <tr>
          <td style="padding: 10px; font-size: 9.5pt; line-height: 1.5; border: none; border-right: 1px solid #cbd5e1; background-color: #fcfdfd;">${ind.kriteriaBagus}</td>
          <td style="padding: 10px; font-size: 9.5pt; line-height: 1.5; border: none; border-right: 1px solid #cbd5e1; background-color: #fdfdfc;">${ind.kriteriaCukup}</td>
          <td style="padding: 10px; font-size: 9.5pt; line-height: 1.5; border: none; background-color: #fdfcfc;">${ind.kriteriaKurang}</td>
        </tr>
      </table>
    </div>
  `).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1>RUBRIK ASESMEN MOTORIK (OLAHRAGA)</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">DOKUMEN ASESMEN KINERJA NYATA PJOK</p>

      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Materi Gerak:</strong> ${rubrik.materi}</td>
            <td width="50%" style="text-align: right;"><strong>Metode Penilaian:</strong> Skala Penilaian Kinerja Kualitatif</td>
          </tr>
          <tr>
            <td><strong>Kategori Cabang:</strong> ${rubrik.kategori}</td>
            <td style="text-align: right;"><strong>Fokus:</strong> Presisi, Mekanika Gerak & Koordinasi</td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Instrumen Rubrik Asesmen Motorik & Pengesahan">
      <div style="margin-top: 15pt;">
        ${cards}
      </div>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
          <td>
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell(`Rubrik_PJOK_${rubrik.materi.replace(' ', '_')}`, content);
}

/**
 * 7. Exports Evaluation Questions to Google Docs compatible Word Document
 */
export function exportSoalToDoc(grade: string, materi: string, questions: any[], includeAnswers: boolean = true): string {
  const qList = questions.map((q, idx) => {
    const rawOpts = Array.isArray(q.options) ? q.options : [];
    const opts = rawOpts.map((opt: string) => `
      <div style="padding: 4px 10px; margin-bottom: 3px; font-size: 10pt; color: #334155;">
        &bull; ${opt}
      </div>
    `).join('\n');

    return `
      <div style="margin-bottom: 15pt; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; background-color: #f8fafc;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td width="4%" style="border: none; font-weight: bold; font-size: 11pt; font-family: monospace; padding: 2px; vertical-align: top;">${idx + 1}.</td>
            <td width="96%" style="border: none; font-weight: bold; font-size: 10.5pt; padding: 2px;">${q.question}</td>
          </tr>
        </table>
        <div style="margin-left: 20px; margin-top: 6px; margin-bottom: 8px;">
          ${opts}
        </div>
        ${includeAnswers ? `
        <div style="margin-left: 20px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 9pt; color: #475569; font-style: italic;">
          <strong>Kunci Jawaban Guru:</strong> ${q.correctAnswer} <br>
          <strong>Penjelasan:</strong> ${q.explanation}
        </div>` : ''}
      </div>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1>LEMBAR EVALUASI PENGETAHUAN (SOAL)</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">UJIAN FORMATIF / SUMATIF KOGNITIF PJOK</p>

      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Materi Pokok:</strong> ${materi}</td>
            <td width="50%" style="text-align: right;"><strong>Nama Siswa:</strong> ________________________</td>
          </tr>
          <tr>
            <td><strong>Tingkat Jenjang:</strong> Kelas ${grade} SD</td>
            <td style="text-align: right;"><strong>Tanggal Ujian:</strong> ________________________</td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Naskah Soal Evaluasi Pengetahuan & Pengesahan">
      <div style="margin-top: 15pt;">
        ${qList}
      </div>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
          <td>
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell(`Lembar_Soal_PJOK_${materi.replace(' ', '_')}`, content);
}

/**
 * 8. Exports ATP (Alur Tujuan Pembelajaran) & KKTP Rubrics to Google Docs compatible Word Document
 */
export function exportAtpToDoc(
  faseName: string, 
  grades: string, 
  elementName: string, 
  materiSpesifik: string, 
  saranaSpesifik: string, 
  atp: AtpResult
): string {
  const atpSteps = atp.alurTujuanPembelajaran.map((step, idx) => `
    <tr>
      <td width="6%" style="text-align: center; font-family: monospace; font-weight: bold; vertical-align: middle;">${idx + 1}</td>
      <td width="94%" style="line-height: 1.5; font-size: 10pt;">${step}</td>
    </tr>
  `).join('\n');

  const kktpRows = atp.kriteriaKetercapaian.map((item, idx) => {
    const bgRow = idx % 2 === 1 ? 'class="bg-row-alt"' : '';
    return `
      <tr ${bgRow}>
        <td style="text-align: center; font-family: 'Courier New', monospace; font-weight: bold;">${idx + 1}</td>
        <td style="font-weight: bold;">${item.kriteria}</td>
        <td style="background-color: #fff5f5; color: #991b1b;">${item.baruBerkembang}</td>
        <td style="background-color: #fffbeb; color: #92400e;">${item.layak}</td>
        <td style="background-color: #f0fdf4; color: #166534;">${item.mahir}</td>
      </tr>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1>ALUR TUJUAN PEMBELAJARAN (ATP) & KKTP</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: -4px;">FORMULASI ASESMEN DAN TUJUAN BELAJAR KURIKULUM MERDEKA</p>

      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Fase / Kelas:</strong> ${faseName} (${grades})</td>
            <td width="50%" style="text-align: right;"><strong>Materi Spesifik:</strong> ${materiSpesifik || 'Kondisional'}</td>
          </tr>
          <tr>
            <td><strong>Elemen CP:</strong> ${elementName}</td>
            <td style="text-align: right;"><strong>Sarana Pendukung:</strong> ${saranaSpesifik || 'Standar Lapangan Sekolah'}</td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: A. Alur Tujuan Pembelajaran (ATP)">
      <h2>A. Alur Tujuan Pembelajaran (ATP)</h2>
      <table>
        <thead>
          <tr>
            <th width="8%" style="text-align: center;">Langkah</th>
            <th width="92%">Deskripsi Alur Tujuan Pembelajaran</th>
          </tr>
        </thead>
        <tbody>
          ${atpSteps}
        </tbody>
      </table>
    </div>

    <div data-f4-section="Bagian 2: B. Rubrik KKTP, Strategi Pembelajaran & Pengesahan">
      <h2>B. Rubrik Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)</h2>
      <table>
        <thead>
          <tr>
            <th width="6%" style="text-align: center;">No.</th>
            <th width="34%">Kriteria Asesmen</th>
            <th width="20%" style="background-color: #fee2e2; color: #991b1b;">Baru Berkembang</th>
            <th width="20%" style="background-color: #fef3c7; color: #92400e;">Layak</th>
            <th width="20%" style="background-color: #d1fae5; color: #065f46;">Mahir</th>
          </tr>
        </thead>
        <tbody>
          ${kktpRows}
        </tbody>
      </table>

      <h2>C. Rekomendasi Strategi & Metode Pembelajaran</h2>
      <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 12px; border-radius: 6px; font-size: 10pt; color: #1e1b4b; line-height: 1.5; white-space: pre-wrap;">
        ${atp.metodePembelajaran}
      </div>

      <table class="signature-grid">
        <tr>
          <td>
            <p>Mengetahui,</p>
            <p><strong>Kepala Sekolah</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
          <td>
            <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p><strong>Guru PJOK</strong></p>
            <br><br><br>
            <p>___________________________</p>
          </td>
        </tr>
      </table>
    </div>
  `;

  return wrapWithDocShell(`ATP_PJOK_${faseName}`, content);
}

/**
 * 9. Exports Deep Learning RPM (Rencana Pembelajaran Mendalam) & LKPD to Microsoft Word/Google Docs format
 * Format standar Perencanaan Pembelajaran Mendalam (RPM) sesuai ketentuan Lendi Ike Hermawan, S.Pd., Gr.
 */
function nl2br(text?: string | null): string {
  if (!text) return '';
  return String(text).replace(/\r\n|\r|\n/g, '<br/>');
}

export function exportRpmToDoc(rpm: DeepLearningRPM): string {
  const penyusun = rpm.identitas?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolah = rpm.identitas?.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaran = rpm.identitas?.tahunAjaran || '2026/2027';
  const semester = rpm.identitas?.semester || '1 (Ganjil)';
  const mataPelajaran = rpm.identitas?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelasFase = rpm.identitas?.kelasFase || 'Kelas IV / Fase B';
  const topikElemen = rpm.identitas?.topik || rpm.identitas?.topikElemen || `${rpm.identitas?.bab || ''} / Keterampilan Gerak Dasar`;
  const alokasiWaktu = rpm.identitas?.alokasiWaktu || '2x40 Menit';

  const dplList = [
    'DPL1 Keimanan dan Ketakwaan terhadap Tuhan YME',
    'DPL2 Kewargaan',
    'DPL3 Penalaran Kritis',
    'DPL4 Kreativitas',
    'DPL5 Kolaborasi',
    'DPL6 Kemandirian',
    'DPL7 Kesehatan',
    'DPL8 Komunikasi'
  ];

  const selectedDpl = Array.isArray(rpm.identifikasi?.dimensiProfilLulusan)
    ? rpm.identifikasi.dimensiProfilLulusan
    : (typeof rpm.identifikasi?.dimensiProfilLulusan === 'string'
        ? [rpm.identifikasi.dimensiProfilLulusan]
        : []);

  const dplHtml = dplList.map(item => {
    const isChecked = selectedDpl.some(d => item.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(item.slice(0, 4).toLowerCase()));
    return `<div style="margin-bottom: 4px; font-size: 9.5pt;">
      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid ${isChecked ? '#4f46e5' : '#94a3b8'}; background-color: ${isChecked ? '#4f46e5' : '#ffffff'}; color: ${isChecked ? '#ffffff' : 'transparent'}; text-align: center; line-height: 12px; font-weight: bold; margin-right: 6px; font-size: 9pt; border-radius: 3px;">${isChecked ? '&#10003;' : '&nbsp;'}</span>
      <span style="font-weight: ${isChecked ? 'bold' : 'normal'}; color: ${isChecked ? '#0f172a' : '#475569'};">${item}</span>
    </div>`;
  }).join('');

  // 5 Butir Soal Asesmen Awal + Kunci Jawaban
  const soalAwalList = (rpm.lampiran?.soalAsesmenAwalList && rpm.lampiran.soalAsesmenAwalList.length > 0)
    ? rpm.lampiran.soalAsesmenAwalList
    : [
        { no: 1, pertanyaan: `Apa yang kamu ketahui tentang konsep dan manfaat dari aktivitas ${topikElemen}?`, kunciJawaban: 'Aktivitas fisik yang melatih koordinasi dan kekuatan tubuh untuk kebugaran jasmani dan kesehatan organ vital.' },
        { no: 2, pertanyaan: 'Mengapa kita wajib melakukan pemanasan (warm-up) sebelum melakukan latihan fisik inti?', kunciJawaban: 'Untuk meningkatkan suhu tubuh, melancarkan peredaran darah, melenturkan otot dan sendi, serta mencegah terjadinya cedera.' },
        { no: 3, pertanyaan: 'Sebutkan bagian tubuh atau otot utama yang paling aktif bekerja saat melakukan gerakan ini!', kunciJawaban: 'Otot tungkai/kaki, otot lengan dan bahu, serta otot inti tubuh (core muscles) yang menjaga keseimbangan.' },
        { no: 4, pertanyaan: 'Sikap apa yang harus kamu utamakan saat berlatih mempraktikkan gerakan bersama teman satu kelompok?', kunciJawaban: 'Sikap sportivitas, saling menghargai kemampuan teman, bekerja sama secara kompak (kolaborasi), dan menjaga keselamatan bersama.' },
        { no: 5, pertanyaan: 'Bagaimana cara mengatur pernapasan yang tepat saat melakukan aktivitas fisik yang membutuhkan tenaga?', kunciJawaban: 'Menghirup napas teratur melalui hidung dan menghembuskannya secara terkontrol melalui mulut tanpa menahan napas.' }
      ];

  // 5 Butir Soal Asesmen Akhir Pembelajaran + Kunci Jawaban
  const soalAkhirList = (rpm.lampiran?.soalAsesmenAkhirList && rpm.lampiran.soalAsesmenAkhirList.length > 0)
    ? rpm.lampiran.soalAsesmenAkhirList
    : [
        { no: 1, pertanyaan: `Jelaskan konsep dasar, variasi pola gerak, dan prinsip pelaksanaan aktivitas ${topikElemen}!`, kunciJawaban: 'Menjelaskan pengertian, ragam variasi gerak, posisi tubuh yang benar, dan prinsip keselamatan gerak secara sistematis.' },
        { no: 2, pertanyaan: 'Bagaimana cara mengatasi kendala teknis dan menjaga ritme keseimbangan saat melakukan aktivitas fisik ini?', kunciJawaban: 'Memusatkan perhatian (mindful), mengatur napas teratur, menyesuaikan tumpuan kaki, dan melakukan adaptasi gerak.' },
        { no: 3, pertanyaan: 'Analisis dampak jangka panjang dari pembiasaan aktivitas fisik ini terhadap kebugaran jasmani dan kesehatan organ vital!', kunciJawaban: 'Meningkatkan kapasitas kardiorespirasi (daya tahan paru-jantung), menguatkan massa otot, kelenturan sendi, dan imunitas tubuh.' },
        { no: 4, pertanyaan: 'Rancanglah sebuah modifikasi peraturan permainan atau strategi tim yang menerapkan nilai sportivitas (fair play) dan inklusif!', kunciJawaban: 'Modifikasi lapangan/alat yang memberi kesempatan setara bagi semua anggota tanpa diskriminasi, serta mengutamakan keselamatan.' },
        { no: 5, pertanyaan: 'Tuliskan refleksi evaluasi diri tentang perkembangan keterampilan, kedisiplinan, dan kerja sama tim yang Anda capai selama 1 bab ini!', kunciJawaban: 'Refleksi jujur mengenai peningkatan teknik gerak, kemampuan mengelola emosi dalam kompetisi, dan kontribusi aktif dalam kelompok.' }
      ];

  // Rubrik Sikap (4 Skala)
  const rawRubrikSikap = rpm.lampiran?.rubrikSikap;
  const rubrikSikapAspek: Array<{ dimensi: string; indikator?: string; skor4: string; skor3: string; skor2: string; skor1: string }> =
    (rawRubrikSikap && Array.isArray((rawRubrikSikap as any).aspekList) && (rawRubrikSikap as any).aspekList.length > 0)
      ? (rawRubrikSikap as any).aspekList
      : (Array.isArray(rawRubrikSikap) && rawRubrikSikap.length > 0
          ? rawRubrikSikap.map((r: any) => ({
              dimensi: r.dimensi,
              indikator: r.indikator || '',
              skor4: r.sangatBaik || r.skor4,
              skor3: r.baik || r.skor3,
              skor2: r.cukup || r.skor2,
              skor1: r.perluBimbingan || r.skor1
            }))
          : [
              {
                dimensi: 'Penalaran Kritis',
                indikator: 'Mengidentifikasi kunci keberhasilan gerak dan menganalisis kesalahan teknik.',
                skor4: 'Sangat kritis, mampu menganalisis kesalahan dan memberikan solusi perbaikan dengan tepat.',
                skor3: 'Cukup kritis, mampu menunjukkan kekeliruan gerak dan memahami langkah perbaikan.',
                skor2: 'Mulai menunjukkan pemikiran kritis namun masih membutuhkan bimbingan guru.',
                skor1: 'Belum mampu menganalisis kesalahan gerak atau memberikan tanggapan.'
              },
              {
                dimensi: 'Kolaborasi',
                indikator: 'Bekerja sama, berbagi peran aktif, dan saling membantu dalam latihan kelompok.',
                skor4: 'Selalu aktif bekerja sama, suportif membantu teman, dan berbagi peran secara adil.',
                skor3: 'Sering bekerja sama dengan baik dan bersedia membantu rekan satu kelompok.',
                skor2: 'Kadang-kadang bekerja sama, cenderung pasif jika tidak diarahkan.',
                skor1: 'Tidak mau bekerja sama atau mengganggu keterlaksanaan tugas kelompok.'
              },
              {
                dimensi: 'Kesehatan',
                indikator: 'Menjaga keselamatan diri, mengenakan seragam rapi, dan mempraktikkan gaya hidup aktif.',
                skor4: 'Sangat peduli keselamatan diri & teman, hidrasi teratur, dan menerapkan pemanasan/pendinginan optimal.',
                skor3: 'Peduli keselamatan, mematuhi instruksi pemanasan dan pendinginan dengan baik.',
                skor2: 'Kurang memperhatikan keselamatan, kadang mengabaikan arahan pendinginan.',
                skor1: 'Melakukan tindakan berbahaya yang berisiko cedera bagi diri sendiri atau teman.'
              },
              {
                dimensi: 'Kemandirian',
                indikator: 'Bertanggung jawab atas tugas gerak mandiri dan percaya diri menampilkan kemampuan.',
                skor4: 'Sangat mandiri, berinisiatif tinggi berlatih, dan sangat percaya diri memperagakan gerakan.',
                skor3: 'Mandiri menyelesaikan latihan, percaya diri dan bertanggung jawab atas tugasnya.',
                skor2: 'Memerlukan dorongan guru untuk memulai latihan dan kurang percaya diri.',
                skor1: 'Tidak menunjukkan kemandirian dan enggan mencoba gerakan.'
              }
            ]);

  // Rubrik Pengetahuan (4 Skala)
  const pedomanPengetahuan = rpm.lampiran?.penilaianPengetahuan?.pedomanSkor || [
    { aspek: 'Kelengkapan Jawaban', skor4: 'Semua pertanyaan pemahaman dan studi kasus pada LKPD dijawab tuntas dan lengkap.', skor3: 'Sebagian besar pertanyaan dijawab lengkap sesuai instruksi.', skor2: 'Hanya separuh pertanyaan yang dijawab, beberapa bagian kosong.', skor1: 'Hampir seluruh lembar jawaban kosong atau tidak diisi.' },
    { aspek: 'Ketepatan Konsep Materi', skor4: 'Seluruh penjelasan konsep gerak dan fungsi kesehatan sangat tepat dan akurat.', skor3: 'Konsep materi dijelaskan dengan benar, hanya 1 kekeliruan kecil.', skor2: 'Beberapa penjelasan konsep masih keliru atau rancu.', skor1: 'Penjelasan konsep salah seluruhnya.' }
  ];

  // Rubrik Keterampilan (4 Skala)
  const pedomanKeterampilan = rpm.lampiran?.penilaianKeterampilan?.pedomanSkor || [
    { aspek: 'Teknik Sikap Awalan & Tumpuan', skor4: 'Sikap awalan tubuh seimbang, posisi kaki/tumpuan sangat akurat dan mantap.', skor3: 'Sikap awalan cukup baik dan seimbang, tumpuan tepat.', skor2: 'Sikap awalan kurang seimbang, posisi tumpuan sering keliru.', skor1: 'Sikap awalan salah total dan tidak siap.' },
    { aspek: 'Koordinasi Fase Gerakan Inti', skor4: 'Gerakan luwes, irama gerak terkoordinasi sempurna, dan bertenaga.', skor3: 'Gerakan inti cukup terkoordinasi dengan baik.', skor2: 'Gerakan inti kaku atau terputus-putus.', skor1: 'Tidak mampu melakukan koordinasi gerakan inti.' }
  ];

  // Materi Ajar Ringkas
  const materiAjarRingkas = rpm.lampiran?.materiAjarRingkas || rpm.lampiran?.materiAjar || `RINGKASAN MATERI AJAR: ${topikElemen}
1. Pengertian & Konsep Dasar: Pembahasan konsep dasar dan prinsip mekanika gerak terkoordinasi.
2. Manfaat Pembelajaran: Menjaga kebugaran jasmani, kesehatan organ pernapasan & sirkulasi darah.
3. Prinsip Keselamatan: Pemanasan terarah, posisi tumpuan yang aman, hidrasi teratur, dan pendinginan relaksasi.`;

  // Pengalaman Belajar (Exact match with DeepLearningDocumentPreview.tsx)
  const awalPrinsip = rpm.pengalamanBelajar?.langkahPembelajaran?.awalOps?.prinsip || 'Berkesadaran, bermakna, menggembirakan';
  const awalText = rpm.pengalamanBelajar?.kegiatanAwal || rpm.pengalamanBelajar?.langkahPembelajaran?.awalOps?.deskripsi || 'Awali dengan mengucap salam kemudian kegiatan berdoa dan mengecek kehadiran. Apersepsi, motivasi, dan pengkondisian yang membangun semangat.';

  const penutupPrinsip = rpm.pengalamanBelajar?.langkahPembelajaran?.penutupOps?.prinsip || 'Berkesadaran, bermakna, dan menggembirakan';
  const penutupText = rpm.pengalamanBelajar?.kegiatanPenutup || rpm.pengalamanBelajar?.langkahPembelajaran?.penutupOps?.deskripsi || 'Pendinginan, simpulan bersama, umpan balik konstruktif, rencana tindak lanjut, berdoa, dan salam.';

  const intiHtml = rpm.pengalamanBelajar?.kegiatanInti
    ? `<div style="background-color: #ffffff; padding: 8pt 10pt; border: 1px solid #cbd5e1; border-radius: 4px; line-height: 1.55;">${nl2br(rpm.pengalamanBelajar.kegiatanInti)}</div>`
    : `<div style="padding-left: 8pt; border-left: 2.5px solid #818cf8;">
        <div style="margin-bottom: 6pt;">
          <div style="font-weight: bold; color: #0f172a;">Memahami (${rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.memahami?.prinsip || 'Orientasi Masalah) (15 Menit'})</div>
          <div style="padding-left: 6pt;">${(rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.memahami?.kegiatan || ['Siswa mengamati tayangan stimulus kontekstual mengenai materi pokok.']).map(k => `&bull; ${nl2br(k)}`).join('<br/>')}</div>
        </div>
        <div style="margin-bottom: 6pt;">
          <div style="font-weight: bold; color: #0f172a;">Mengaplikasikan (${rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.mengaplikasi?.prinsip || 'Penyelidikan Mandiri & Kelompok) (30 Menit'})</div>
          <div style="padding-left: 6pt;">${(rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.mengaplikasi?.kegiatan || ['Siswa berkolaborasi dalam kelompok kecil menyelesaikan tugas aplikatif.']).map(k => `&bull; ${nl2br(k)}`).join('<br/>')}</div>
        </div>
        <div>
          <div style="font-weight: bold; color: #0f172a;">Merefleksi (${rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.merefleksi?.prinsip || 'Penyajian & Refleksi Solusi) (15 Menit'})</div>
          <div style="padding-left: 6pt;">${(rpm.pengalamanBelajar?.langkahPembelajaran?.inti?.merefleksi?.kegiatan || ['Kelompok lain memberikan tanggapan dan refleksi konstruktif atas presentasi.']).map(k => `&bull; ${nl2br(k)}`).join('<br/>')}</div>
        </div>
      </div>`;

  // Tanda Tangan Fallbacks
  const kepalaSekolahNama = typeof rpm.tandaTangan?.kepalaSekolah === 'object' && rpm.tandaTangan?.kepalaSekolah !== null
    ? (rpm.tandaTangan.kepalaSekolah as { nama: string; nip: string }).nama
    : (typeof rpm.tandaTangan?.kepalaSekolah === 'string' && rpm.tandaTangan.kepalaSekolah.trim()
        ? rpm.tandaTangan.kepalaSekolah
        : 'Soleh, S.Pd., M.Pd.');

  const kepalaSekolahNip = typeof rpm.tandaTangan?.kepalaSekolah === 'object' && rpm.tandaTangan?.kepalaSekolah !== null
    ? (rpm.tandaTangan.kepalaSekolah as { nama: string; nip: string }).nip
    : 'NIP. 19750512 200003 1 004';

  const guruNama = typeof rpm.tandaTangan?.guruMapel === 'object' && rpm.tandaTangan?.guruMapel !== null
    ? (rpm.tandaTangan.guruMapel as { nama: string; nip: string }).nama
    : (typeof rpm.tandaTangan?.guruMapel === 'string' && rpm.tandaTangan.guruMapel.trim()
        ? rpm.tandaTangan.guruMapel
        : penyusun);

  const guruNip = typeof rpm.tandaTangan?.guruMapel === 'object' && rpm.tandaTangan?.guruMapel !== null
    ? (rpm.tandaTangan.guruMapel as { nama: string; nip: string }).nip
    : 'NIP. ........................................';

  const content = `
    <!-- HEADER DOKUMEN -->
    <div data-f4-kop="true" style="border-bottom: 1.5px solid #cbd5e1; padding-bottom: 8pt; margin-bottom: 12pt;">
      <h2 style="font-size: 13pt; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase;">TABEL RENCANA PELAKSANAAN PEMBELAJARAN (RPM)</h2>
      <p style="font-size: 9.5pt; color: #475569; margin: 2pt 0 0 0;">Format Standar Pembelajaran Mendalam (Mindful, Meaningful, Joyful)</p>
    </div>

    <div data-f4-section="Bagian 1: Tabel Utama RPM (A. Identitas s.d. E. Asesmen & Pengesahan)">
    <!-- TABEL UTAMA RPM (STRUKTUR A S.D. E PERSIS PREVIEW) -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 18pt; font-family: Arial, sans-serif; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: #0f172a; color: #ffffff;">
          <th style="width: 32%; padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; color: #ffffff; background-color: #0f172a;">Komponen / Sub-komponen</th>
          <th style="width: 68%; padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; color: #ffffff; background-color: #0f172a;">Isi Perencanaan Pembelajaran</th>
        </tr>
      </thead>
      <tbody>
        <!-- A. IDENTITAS -->
        <tr style="background-color: #e0e7ff;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #312e81; background-color: #e0e7ff;">
            A. IDENTITAS
          </td>
        </tr>
        <tr>
          <td style="width: 32%; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Penyusun</td>
          <td style="width: 68%; padding: 6px 10px; border: 1px solid #cbd5e1;">${penyusun}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Sekolah</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${sekolah}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Tahun Ajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${tahunAjaran}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Semester</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${semester}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Mata Pelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${mataPelajaran}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Kelas / Fase Capaian</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${kelasFase}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Topik</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${topikElemen}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f8fafc;">Alokasi Waktu</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${alokasiWaktu}</td>
        </tr>

        <!-- B. IDENTIFIKASI -->
        <tr style="background-color: #e0e7ff;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #312e81; background-color: #e0e7ff;">
            B. IDENTIFIKASI
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Identifikasi Murid</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.identifikasi?.muridOps || rpm.identifikasi?.identifikasiMurid || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Materi Pelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.identifikasi?.materiPelajaranOps || rpm.identifikasi?.materiPelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Dimensi Profil Lulusan</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.6;">${dplHtml}</td>
        </tr>

        <!-- C. DESAIN PEMBELAJARAN -->
        <tr style="background-color: #e0e7ff;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #312e81; background-color: #e0e7ff;">
            C. DESAIN PEMBELAJARAN
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Capaian Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.capaianPembelajaranOps || rpm.desainPembelajaran?.capaianPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Lintas Disiplin Ilmu</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.lintasDisiplinIlmuOps || rpm.desainPembelajaran?.lintasDisiplinIlmu || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Tujuan Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.tujuanPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Topik Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.topikPembelajaranOps || rpm.desainPembelajaran?.topikPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Praktik Pedagogis</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.praktikPedagogis || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Kemitraan Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.kemitraanPembelajaranOps || rpm.desainPembelajaran?.kemitraanPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Lingkungan Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.lingkunganPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Pemanfaatan Digital</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.desainPembelajaran?.pemanfaatanDigitalOps || rpm.desainPembelajaran?.pemanfaatanDigital || '-')}</td>
        </tr>

        <!-- D. PENGALAMAN BELAJAR -->
        <tr style="background-color: #e0e7ff;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #312e81; background-color: #e0e7ff;">
            D. PENGALAMAN BELAJAR
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 10px; border: 1px solid #cbd5e1; font-size: 9.5pt;">
            <div style="font-weight: bold; color: #0f172a; text-transform: uppercase; margin-bottom: 8pt;">Langkah-langkah Pembelajaran:</div>

            <!-- Kegiatan Awal -->
            <div style="background-color: #f8fafc; padding: 8pt 10pt; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8pt;">
              <div style="font-weight: bold; color: #312e81; margin-bottom: 4pt;">
                Kegiatan Awal (15 Menit) - ${awalPrinsip}
              </div>
              <div style="color: #334155; line-height: 1.55;">
                ${nl2br(awalText)}
              </div>
            </div>

            <!-- Kegiatan Inti -->
            <div style="background-color: #f8fafc; padding: 8pt 10pt; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8pt;">
              <div style="font-weight: bold; color: #312e81; margin-bottom: 6pt;">
                Kegiatan Inti (60 Menit) - Mindful (Berkesadaran), Meaningful (Bermakna), Joyful (Menggembirakan)
              </div>
              <div style="color: #334155; line-height: 1.55;">
                ${intiHtml}
              </div>
            </div>

            <!-- Kegiatan Penutup -->
            <div style="background-color: #f8fafc; padding: 8pt 10pt; border: 1px solid #cbd5e1; border-radius: 6px;">
              <div style="font-weight: bold; color: #312e81; margin-bottom: 4pt;">
                Kegiatan Penutup (5 Menit) - ${penutupPrinsip}
              </div>
              <div style="color: #334155; line-height: 1.55;">
                ${nl2br(penutupText)}
              </div>
            </div>
          </td>
        </tr>

        <!-- E. ASESMEN PEMBELAJARAN -->
        <tr style="background-color: #e0e7ff;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #312e81; background-color: #e0e7ff;">
            E. ASESMEN PEMBELAJARAN
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Awal</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.asesmenPembelajaran?.awal || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Proses</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.asesmenPembelajaran?.proses || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; vertical-align: top; font-weight: bold; background-color: #f8fafc;">Akhir</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.5;">${nl2br(rpm.asesmenPembelajaran?.akhir || '-')}</td>
        </tr>
      </tbody>
    </table>

    <!-- TANDA TANGAN -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 18pt; margin-bottom: 20pt; border: none;">
      <tr>
        <td style="width: 50%; border: none; text-align: center; font-size: 9.5pt; vertical-align: top;">
          <p style="margin: 0 0 4px 0; color: #475569;">Mengetahui,</p>
          <p style="font-weight: bold; margin: 0 0 48pt 0; color: #0f172a;">Kepala Sekolah</p>
          <p style="font-weight: bold; text-decoration: underline; margin: 0 0 3px 0; color: #0f172a;">${kepalaSekolahNama}</p>
          <p style="margin: 0; color: #64748b; font-size: 9pt;">${kepalaSekolahNip.startsWith('NIP') ? kepalaSekolahNip : `NIP. ${kepalaSekolahNip}`}</p>
        </td>
        <td style="width: 50%; border: none; text-align: center; font-size: 9.5pt; vertical-align: top;">
          <p style="margin: 0 0 4px 0; color: #475569;">${rpm.tandaTangan?.tempatTanggal || 'Jember, 1 Juli 2025'}</p>
          <p style="font-weight: bold; margin: 0 0 48pt 0; color: #0f172a;">Guru Mata Pelajaran</p>
          <p style="font-weight: bold; text-decoration: underline; margin: 0 0 3px 0; color: #0f172a;">${guruNama}</p>
          <p style="margin: 0; color: #64748b; font-size: 9pt;">${guruNip.startsWith('NIP') ? guruNip : `NIP. ${guruNip}`}</p>
        </td>
      </tr>
    </table>
    </div>

    <!-- ======================================================== -->
    <!-- LAMPIRAN DOKUMEN RPM (PERSIS DEEPLearningDocumentPreview) -->
    <!-- ======================================================== -->
    <div data-f4-section="Bagian 2: Lampiran 1–4 (Soal Asesmen Awal & Rubrik Sikap, Pengetahuan, Keterampilan)" style="page-break-before: always; margin-top: 20pt; padding-top: 6pt;">
      <div style="border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6pt; margin-bottom: 12pt;">
        <h3 style="font-size: 12pt; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase;">LAMPIRAN DOKUMEN RPM</h3>
        <p style="font-size: 9pt; color: #64748b; margin: 2pt 0 0 0;">Instrumen Asesmen Awal, Rubrik 4 Skala, dan Materi Ajar Lengkap (Terpisah dengan Tabel RPP)</p>
      </div>

      <!-- Lampiran 1: Soal Asesmen Awal (5 Soal Beserta Jawaban) -->
      <div style="background-color: #f8fafc; padding: 12pt; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14pt;">
        <h4 style="font-size: 10.5pt; font-weight: bold; color: #1e1b4b; margin: 0 0 6pt 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt;">
          Lampiran 1: Soal Asesmen Awal (5 Soal Beserta Jawaban)
        </h4>
        <p style="font-size: 9pt; color: #475569; margin: 0 0 8pt 0;">
          5 butir pertanyaan pemantik lisan/tertulis singkat untuk mengukur kesiapan pengetahuan awal murid terhadap topik yang dibahas:
        </p>
        ${soalAwalList.map(item => `
          <div style="background-color: #ffffff; padding: 8pt 10pt; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 6pt; font-size: 9.5pt;">
            <p style="font-weight: bold; color: #0f172a; margin: 0 0 4pt 0;">${item.no}. ${nl2br(item.pertanyaan)}</p>
            <div style="color: #065f46; background-color: #ecfdf5; border-left: 3px solid #10b981; padding: 4pt 8pt;">
              <strong>Kunci Jawaban:</strong> ${nl2br(item.kunciJawaban)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Lampiran 2: Rubrik Penilaian Sikap (4 Skala Penilaian) -->
      <div style="background-color: #f8fafc; padding: 12pt; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14pt;">
        <h4 style="font-size: 10.5pt; font-weight: bold; color: #1e1b4b; margin: 0 0 8pt 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt;">
          Lampiran 2: Rubrik Penilaian Sikap (4 Skala Penilaian) - Sesuai Dimensi Profil Lulusan (DPL)
        </h4>
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; font-size: 9pt;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Dimensi / Indikator</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 4 (Sangat Baik)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 3 (Baik)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 2 (Cukup)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 1 (Perlu Bimbingan)</th>
            </tr>
          </thead>
          <tbody>
            ${rubrikSikapAspek.map(item => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">
                  <div style="font-weight: bold; color: #1e1b4b;">${item.dimensi}</div>
                  ${item.indikator ? `<div style="font-size: 8.5pt; color: #475569; margin-top: 2px;">${item.indikator}</div>` : ''}
                </td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${item.skor4}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${item.skor3}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${item.skor2}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${item.skor1}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 8.5pt; color: #475569; font-style: italic; margin: 6pt 0 0 0;">
          Rumus Penilaian: Nilai Sikap = (Jumlah Skor Diperoleh / Total Skor Maksimal) &times; 100
        </p>
      </div>

      <!-- Lampiran 3: Rubrik Penilaian Pengetahuan (4 Skala Penilaian) -->
      <div style="background-color: #f8fafc; padding: 12pt; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14pt;">
        <h4 style="font-size: 10.5pt; font-weight: bold; color: #1e1b4b; margin: 0 0 8pt 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt;">
          Lampiran 3: Rubrik Penilaian Pengetahuan (4 Skala Penilaian)
        </h4>
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; font-size: 9pt;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Aspek Penilaian</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 4 (Sangat Baik)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 3 (Baik)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 2 (Cukup)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 1 (Kurang)</th>
            </tr>
          </thead>
          <tbody>
            ${pedomanPengetahuan.map(p => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top;">${p.aspek}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${p.skor4}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${p.skor3}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${p.skor2}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${p.skor1}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 8.5pt; color: #475569; font-style: italic; margin: 6pt 0 0 0;">
          Rumus Penilaian: Nilai Akhir = (Jumlah Skor Diperoleh / 16) &times; 100
        </p>
      </div>

      <!-- Lampiran 4: Rubrik Penilaian Keterampilan (4 Skala Penilaian) -->
      <div style="background-color: #f8fafc; padding: 12pt; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14pt;">
        <h4 style="font-size: 10.5pt; font-weight: bold; color: #1e1b4b; margin: 0 0 8pt 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt;">
          Lampiran 4: Rubrik Penilaian Keterampilan (4 Skala Penilaian)
        </h4>
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; font-size: 9pt;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Aspek Keterampilan</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 4 (Sangat Baik)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 3 (Baik)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 2 (Cukup)</th>
              <th style="width: 20%; padding: 6px 8px; border: 1px solid #cbd5e1; text-align: left;">Skor 1 (Kurang)</th>
            </tr>
          </thead>
          <tbody>
            ${pedomanKeterampilan.map(k => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top;">${k.aspek}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${k.skor4}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${k.skor3}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${k.skor2}</td>
                <td style="padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top;">${k.skor1}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="font-size: 8.5pt; color: #475569; font-style: italic; margin: 6pt 0 0 0;">
          Rumus Penilaian: Nilai Akhir = (Jumlah Skor Diperoleh / 16) &times; 100
        </p>
      </div>
    </div>

    <div data-f4-section="Bagian 3: Lampiran 5–6 (Asesmen Akhir Sumatif & Ringkasan Materi Ajar)" style="page-break-before: always; margin-top: 20pt; padding-top: 6pt;">
      <!-- Lampiran 5: Asesmen Akhir Pembelajaran (Sumatif Lingkup Materi) -->
      <div style="background-color: #f8fafc; padding: 12pt; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14pt;">
        <h4 style="font-size: 10.5pt; font-weight: bold; color: #1e1b4b; margin: 0 0 6pt 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt;">
          Lampiran 5: Asesmen Akhir Pembelajaran (Sumatif Lingkup Materi)
        </h4>
        <p style="font-size: 9pt; color: #475569; margin: 0 0 8pt 0;">
          Instrumen penilaian akhir untuk mengukur ketuntasan kompetensi murid pada lingkup materi:
        </p>
        ${soalAkhirList.map(item => `
          <div style="background-color: #ffffff; padding: 8pt 10pt; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 6pt; font-size: 9.5pt;">
            <p style="font-weight: bold; color: #0f172a; margin: 0 0 4pt 0;">${item.no}. ${nl2br(item.pertanyaan)}</p>
            <div style="color: #065f46; background-color: #ecfdf5; border-left: 3px solid #10b981; padding: 4pt 8pt;">
              <strong>Kunci Jawaban:</strong> ${nl2br(item.kunciJawaban)}
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Lampiran 6: Materi Ajar Ringkas dan Jelas -->
      <div style="background-color: #f8fafc; padding: 12pt; border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14pt;">
        <h4 style="font-size: 10.5pt; font-weight: bold; color: #1e1b4b; margin: 0 0 6pt 0; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt;">
          Lampiran 6: Materi Ajar Ringkas dan Jelas
        </h4>
        <div style="background-color: #ffffff; padding: 10pt; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9.5pt; line-height: 1.6; color: #1e293b;">
          ${nl2br(materiAjarRingkas)}
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- LEMBAR KERJA PESERTA DIDIK (LKPD) - NON-TABEL            -->
    <!-- ======================================================== -->
    ${(rpm.lkpdList || []).map((lkpd, idx) => `
      <div data-f4-section="Bagian ${idx + 4}: LKPD Pertemuan ${idx + 1} (${lkpd.title || topikElemen})" style="page-break-before: always; margin-top: 22pt; padding: 16pt; border: 1px solid #cbd5e1; border-radius: 10px; background-color: #ffffff;">
        <!-- LKPD Header (Non-table) -->
        <div style="text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 8pt; margin-bottom: 12pt;">
          <div style="display: inline-block; font-size: 8.5pt; font-weight: bold; color: #4338ca; background-color: #eef2ff; padding: 2px 8px; border: 1px solid #c7d2fe; border-radius: 4px; text-transform: uppercase; margin-bottom: 4pt;">
            LEMBAR KERJA PESERTA DIDIK (LKPD)
          </div>
          <h4 style="font-size: 12pt; font-weight: bold; color: #0f172a; margin: 2pt 0; text-transform: uppercase;">
            ${lkpd.title || `Pertemuan ${idx + 1}: ${topikElemen}`}
          </h4>
          <p style="font-size: 9pt; color: #64748b; margin: 2pt 0 0 0;">
            ${sekolah} &bull; Tahun Ajaran ${tahunAjaran}
          </p>
        </div>

        <!-- 1. IDENTITAS DIRI (NON-TABEL) -->
        <div style="background-color: #f8fafc; padding: 10pt 12pt; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; font-size: 9.5pt;">
          <div style="font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4pt; margin-bottom: 6pt; text-transform: uppercase;">
            1. IDENTITAS DIRI
          </div>
          <div style="line-height: 1.75; color: #334155;">
            <div><strong>Nama Peserta Didik:</strong> ..................................................... &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; <strong>Mata Pelajaran:</strong> ${mataPelajaran}</div>
            <div><strong>No. Absen / Kelas:</strong> .......... / ${kelasFase} &nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp; <strong>Hari / Tanggal:</strong> .....................................................</div>
            <div><strong>Topik / Materi:</strong> ${topikElemen}</div>
          </div>
        </div>

        <!-- Full Content (NON-TABEL) -->
        <div style="background-color: #ffffff; padding: 12pt; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9.5pt; line-height: 1.65; color: #1e293b;">
          ${nl2br(lkpd.content)}
        </div>
      </div>
    `).join('')}
  `;

  return wrapWithDocShell(rpm.title || 'PERENCANAAN_PEMBELAJARAN_MENDALAM', content);
}

/**
 * 9b. Exports Deep Learning RPM 1 Pertemuan (2x40 Menit) strictly adhering to:
 * - Penyusun: Lendi Ike Hermawan, S.Pd., Gr.
 * - TEMPLATE_VERSI_2_MODUL_AJAR_PEMBELAJARAN_MENDALAM.docx__1__7f3f8ccb.pdf
 * - Yellow gold table headers (#fef08a)
 * - 10 complete attachments (Diagnostik Non-kognitif, Soal Awal, Formatif 1-5, Sikap SL/SR/KD/TP, Pengetahuan 1-4, Keterampilan 1-4, Remedial-Pengayaan, Refleksi, LKPD Non-tabel, Materi Ajar)
 */
export function exportRpmSatuPertemuanToDoc(rpm: DeepLearningRPM): string {
  const penyusun = rpm.identitas?.penyusun || 'Lendi Ike Hermawan, S.Pd., Gr.';
  const sekolah = rpm.identitas?.sekolah || 'SD Negeri Kalimantong';
  const tahunAjaran = rpm.identitas?.tahunAjaran || '2026/2027';
  const semester = rpm.identitas?.semester || '1 (Ganjil)';
  const mataPelajaran = rpm.identitas?.mataPelajaran || 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
  const kelasFase = rpm.identitas?.kelasFase || 'Kelas IV / Fase B';
  const topikElemen = rpm.identitas?.topik || rpm.identitas?.topikElemen || 'Keterampilan Gerak Dasar';
  const alokasiWaktu = rpm.identitas?.alokasiWaktu || '2x40 Menit';

  // 8 DPL list with checkboxes
  const dplList = [
    'Keimanan dan Ketakwaan terhadap Tuhan YME',
    'Kewargaan',
    'Penalaran Kritis',
    'Kreativitas',
    'Kolaborasi',
    'Kemandirian',
    'Kesehatan',
    'Komunikasi'
  ];

  const selectedDpl = Array.isArray(rpm.identifikasi?.dimensiProfilLulusan)
    ? rpm.identifikasi.dimensiProfilLulusan
    : (typeof rpm.identifikasi?.dimensiProfilLulusan === 'string'
        ? [rpm.identifikasi.dimensiProfilLulusan]
        : []);

  const dplHtml = dplList.map(item => {
    const isChecked = selectedDpl.some(d => item.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(item.slice(0, 4).toLowerCase()));
    return `<div style="margin-bottom: 4px; font-size: 9.5pt;">
      <span style="display: inline-block; width: 14px; height: 14px; border: 1.5px solid ${isChecked ? '#d97706' : '#94a3b8'}; text-align: center; line-height: 12px; font-weight: bold; margin-right: 6px; font-size: 9pt; background-color: ${isChecked ? '#fef08a' : '#ffffff'}; color: ${isChecked ? '#78350f' : 'transparent'};">${isChecked ? '&#10003;' : '&nbsp;'}</span>
      <span style="font-weight: ${isChecked ? 'bold' : 'normal'}; color: ${isChecked ? '#0f172a' : '#475569'};">${item}</span>
    </div>`;
  }).join('');

  // Lampiran 1: Diagnostik Non-kognitif
  const diagQuestions = rpm.lampiran?.asesmenDiagnostikNonKognitif?.pertanyaan || [
    { no: 1, teks: 'Bagaimana perasaanmu sebelum memulai jam pelajaran PJOK hari ini?' },
    { no: 2, teks: 'Apakah kamu sudah sarapan sehat dan membawa botol minum air putih?' },
    { no: 3, teks: 'Apakah saat ini tubuhmu terasa bugar dan siap beraktivitas di lapangan?' },
    { no: 4, teks: 'Apakah ada bagian tubuh yang terasa nyeri atau cedera hari ini?' }
  ];

  // Lampiran 2: 5 Soal Awal
  const soalAwalList = (rpm.lampiran?.soalAsesmenAwalList && rpm.lampiran.soalAsesmenAwalList.length > 0)
    ? rpm.lampiran.soalAsesmenAwalList
    : [
        { no: 1, pertanyaan: `Apa yang kamu ketahui tentang konsep dan manfaat aktivitas gerak ${topikElemen}?`, kunciJawaban: 'Gerakan fisik yang melatih koordinasi dan kekuatan tubuh untuk kebugaran jasmani dan kesehatan organ vital.' },
        { no: 2, pertanyaan: 'Mengapa kita wajib melakukan pemanasan (warming-up) terarah sebelum latihan gerak inti?', kunciJawaban: 'Menaikkan suhu tubuh dan sirkulasi darah, melenturkan sendi dan otot, serta mencegah terjadinya cedera.' },
        { no: 3, pertanyaan: 'Sebutkan bagian otot atau persendian tubuh yang paling aktif bekerja saat mempraktikkan gerakan ini!', kunciJawaban: 'Otot tungkai/kaki, otot lengan bahu, serta otot inti tubuh (core muscles) penjaga keseimbangan.' },
        { no: 4, pertanyaan: 'Sikap sportivitas apa yang harus ditunjukkan saat berlatih bersama teman satu kelompok?', kunciJawaban: 'Saling menghargai kemampuan teman, tidak mengejek, berbagi peran adil, dan mengutamakan keselamatan.' },
        { no: 5, pertanyaan: 'Bagaimana cara mengatur pernapasan yang tepat saat melakukan aktivitas fisik intensif?', kunciJawaban: 'Menghirup udara teratur melalui hidung dan menghembuskannya secara terkontrol lewat mulut tanpa menahan napas.' }
      ];

  // Lampiran 3: Formatif
  const formatifDiskusi = rpm.lampiran?.asesmenFormatif?.keterangan?.diskusi || 'Melatih kolaborasi, keberanian mengemukakan ide solusi gerak, dan mendengarkan rekan tim.';
  const formatifPresentasi = rpm.lampiran?.asesmenFormatif?.keterangan?.presentasi || 'Melatih keberanian berbicara di depan kelas dan memperagakan teknik gerak dengan percaya diri.';
  const formatifUnjukKerja = rpm.lampiran?.asesmenFormatif?.keterangan?.unjukKerja || 'Menilai keterampilan motorik dan koordinasi tubuh yang dipraktikkan secara berkelanjutan.';
  const formatifRubrik = rpm.lampiran?.asesmenFormatif?.rubrikPenilaian || [
    { skor: 5, deskripsi: 'Sangat aktif berkontribusi dalam diskusi & peragaan, teknik gerak sangat akurat, komunikatif, dan sangat konsisten.' },
    { skor: 4, deskripsi: 'Aktif berdiskusi dan berlatih, mampu memperagakan gerak dengan baik, keterampilan gerak terlihat berkembang.' },
    { skor: 3, deskripsi: 'Cukup aktif, berpartisipasi saat diarahkan, keterampilan dasar mulai tampak konsisten.' },
    { skor: 2, deskripsi: 'Kurang aktif, pasif dalam kelompok, teknik gerak masih sering keliru.' },
    { skor: 1, deskripsi: 'Tidak menunjukkan partisipasi, tidak menguasai gerakan, enggan mencoba.' }
  ];

  // Lampiran 4: Sikap Spiritual & Sosial
  const sikapSpiritual = rpm.lampiran?.penilaianSikap?.spiritual?.indikator || [
    'Berdoa sebelum dan sesudah aktivitas pembelajaran dengan khusyuk',
    'Menunjukkan rasa syukur atas kesehatan dan kebugaran tubuh',
    'Menunjukkan empati dan sikap saling tolong-menolong antarteman',
    'Menjaga sportivitas dan kejujuran dalam setiap aktivitas'
  ];
  const sikapSosial = rpm.lampiran?.penilaianSikap?.sosial?.indikator || [
    'Mampu berkomunikasi dengan santun dan positif saat berdiskusi',
    'Bekerja sama secara aktif dan berbagi tugas merata dalam kelompok',
    'Menghargai keberagaman kemampuan fisik dan pendapat teman',
    'Peduli terhadap kebersihan lingkungan dan keselamatan sarana alat'
  ];

  // Lampiran 5: Pengetahuan (4 Skala)
  const pedomanPengetahuan = rpm.lampiran?.penilaianPengetahuan?.pedomanSkor || [
    { aspek: 'Kelengkapan Jawaban LKPD', skor4: 'Seluruh pertanyaan pemahaman dan studi kasus dijawab tuntas', skor3: 'Sebagian besar pertanyaan dijawab lengkap', skor2: 'Hanya separuh pertanyaan yang dijawab', skor1: 'Sebagian besar lembar LKPD tidak diisi' },
    { aspek: 'Ketepatan Konsep Materi', skor4: 'Penjelasan konsep gerak dan fungsi kesehatan sangat tepat', skor3: 'Konsep materi dijelaskan benar dengan 1 kekeliruan kecil', skor2: 'Beberapa penjelasan konsep masih keliru atau rancu', skor1: 'Penjelasan konsep salah dan tidak relevan' },
    { aspek: 'Penyajian Analisis Strategi', skor4: 'Strategi pemecahan masalah disajikan logis dan aplikatif', skor3: 'Strategi cukup logis dan dapat diterapkan dalam latihan', skor2: 'Strategi kurang terstruktur dan sulit diterapkan', skor1: 'Tidak ada usulan strategi atau tidak masuk akal' },
    { aspek: 'Kedalaman Refleksi Diri', skor4: 'Refleksi mendalam, jujur, menunjukkan kesadaran diri tinggi', skor3: 'Memberikan jawaban reflektif yang cukup jelas dan bermakna', skor2: 'Jawaban refleksi masih sangat singkat dan umum', skor1: 'Tidak mengisi refleksi diri atau tidak relevan' }
  ];

  // Lampiran 6: Keterampilan (4 Skala)
  const pedomanKeterampilan = rpm.lampiran?.penilaianKeterampilan?.pedomanSkor || [
    { aspek: 'Penguasaan & Presisi Gerak', skor4: 'Mempraktikkan gerak dengan mekanik tubuh sangat baik, seimbang, dan konsisten', skor3: 'Mempraktikkan gerak terampil dengan 1 kekeliruan kecil', skor2: 'Gerakan masih kaku, koordinasi anggota badan belum stabil', skor1: 'Belum mampu mempraktikkan pola gerak dasar yang diinstruksikan' },
    { aspek: 'Penerapan Taktik & Adaptasi', skor4: 'Mampu mentransfer dan menyesuaikan strategi gerak secara efektif', skor3: 'Mampu menerapkan strategi gerak dasar dalam permainan', skor2: 'Hanya bisa menerapkan strategi gerak dalam situasi latihan tertutup', skor1: 'Bingung menerapkan strategi saat berada dalam situasi kelompok' },
    { aspek: 'Sportivitas & Fair Play', skor4: 'Selalu menjunjung tinggi fair play, menghargai lawan/rekan, taat aturan', skor3: 'Menaati peraturan permainan dan menunjukkan sportivitas baik', skor2: 'Kadang melanggar aturan jika tidak diawasi wasit/guru', skor1: 'Sering melakukan pelanggaran dan tidak menghargai lawan' },
    { aspek: 'Efisiensi & Keselamatan', skor4: 'Sangat sigap menjaga keselamatan diri dan rekan serta memanfaatkan waktu optimal', skor3: 'Cermat menjaga keselamatan diri dan memanfaatkan waktu memadai', skor2: 'Kurang waspada terhadap potensi cedera saat beraktivitas', skor1: 'Ceroboh dan berpotensi menimbulkan bahaya keselamatan' }
  ];

  // Lampiran 7: Remedial & Pengayaan
  const remedialStrategi = rpm.lampiran?.pengayaanDanRemedial?.remedial?.strategi || [
    { nama: 'Bimbingan Tutor Sebaya', deskripsi: 'Memasangkan murid yang belum mencapai kompetensi dasar dengan rekan yang telah mahir untuk berlatih gerakan secara perlahan.' },
    { nama: 'Modifikasi Alat dan Jarak', deskripsi: 'Menyesuaikan beban gerakan, mendekatkan jarak sasaran, atau menggunakan alat bantu yang lebih ringan agar gerak dasar terbentuk dengan percaya diri.' },
    { nama: 'Umpan Balik Terfokus', deskripsi: 'Guru memberikan koreksi bagian per bagian dari fase awalan, pelaksanaan, hingga sikap akhir gerak secara personal.' }
  ];

  const pengayaanStrategi = rpm.lampiran?.pengayaanDanRemedial?.pengayaan?.strategi || [
    { nama: 'Tantangan Variasi & Kombinasi', deskripsi: 'Memberikan tantangan rangkaian gerak kompleks dengan tempo lebih dinamis atau rintangan tambahan.' },
    { nama: 'Peran Kepemimpinan & Pengatur Permainan', deskripsi: 'Melatih murid berkemampuan tinggi menjadi kapten regu, pemandu pemanasan, atau perancang strategi kelompok.' },
    { nama: 'Eksplorasi Studi Kasus Mandiri', deskripsi: 'Memberikan tugas pengamatan taktik pertandingan dan menyusun modifikasi permainan baru yang inklusif.' }
  ];

  // Lampiran 8: Refleksi Guru
  const refleksiGuruList = rpm.lampiran?.refleksi?.guru || [
    { no: 1, aspek: 'Penguasaan Materi & Sintaks', refleksiGuru: 'Apakah sintaks pendekatan Deep Learning (Memahami, Mengaplikasikan, Merefleksi) terlaksana secara runtut dan kondusif pada pertemuan ini?', jawaban: '' },
    { no: 2, aspek: 'Keterlibatan Siswa (Joyful & Mindful)', refleksiGuru: 'Apakah seluruh peserta didik terlibat secara aktif, gembira, dan memiliki kesadaran penuh saat mempraktikkan gerakan?', jawaban: '' },
    { no: 3, aspek: 'Ketercapaian Tujuan Pembelajaran', refleksiGuru: 'Apakah minimal 85% peserta didik menunjukkan peningkatan kompetensi gerak dan pemahaman nilai karakter sesuai indikator?', jawaban: '' }
  ];

  // Lampiran 9: Soal Asesmen Akhir
  const soalAkhirList = (rpm.lampiran?.soalAsesmenAkhirList && rpm.lampiran.soalAsesmenAkhirList.length > 0)
    ? rpm.lampiran.soalAsesmenAkhirList
    : [
        { no: 1, pertanyaan: `Jelaskan konsep dasar, variasi pola gerak, dan prinsip pelaksanaan aktivitas ${topikElemen}!`, kunciJawaban: 'Menjelaskan pengertian, ragam variasi gerak, posisi tubuh yang benar, dan prinsip keselamatan gerak secara sistematis.' },
        { no: 2, pertanyaan: 'Bagaimana cara mengatasi kendala teknis dan menjaga ritme keseimbangan saat melakukan aktivitas fisik ini?', kunciJawaban: 'Memusatkan perhatian (mindful), mengatur napas teratur, menyesuaikan tumpuan kaki, dan melakukan adaptasi gerak.' },
        { no: 3, pertanyaan: 'Analisis dampak jangka panjang dari pembiasaan aktivitas fisik ini terhadap kebugaran jasmani dan kesehatan organ vital!', kunciJawaban: 'Meningkatkan kapasitas kardiorespirasi (daya tahan paru-jantung), menguatkan massa otot, kelenturan sendi, dan imunitas tubuh.' },
        { no: 4, pertanyaan: 'Rancanglah sebuah modifikasi peraturan permainan atau strategi tim yang menerapkan nilai sportivitas (fair play) dan inklusif!', kunciJawaban: 'Modifikasi lapangan/alat yang memberi kesempatan setara bagi semua anggota tanpa diskriminasi, serta mengutamakan keselamatan.' },
        { no: 5, pertanyaan: 'Tuliskan refleksi evaluasi diri tentang perkembangan keterampilan, kedisiplinan, dan kerja sama tim yang Anda capai!', kunciJawaban: 'Refleksi jujur mengenai peningkatan teknik gerak, kemampuan mengelola emosi dalam kompetisi, dan kontribusi aktif dalam kelompok.' }
      ];

  // Lampiran 10: Materi Ajar Ringkas
  const materiAjarRingkas = rpm.lampiran?.materiAjarRingkas || rpm.lampiran?.materiAjar || `RINGKASAN MATERI AJAR: ${topikElemen.toUpperCase()} (1 PERTEMUAN / ${alokasiWaktu})
1. Konsep Pokok Faktual & Konseptual:
   Materi ${topikElemen} merupakan bagian penting dalam kurikulum PJOK untuk mengasah koordinasi motorik, keseimbangan dinamis, dan kesadaran kinestetik tubuh.
2. Prosedural & Langkah Gerak:
   - Awalan: Berdiri tegak, pandangan ke depan, tumpuan kaki seimbang.
   - Pelaksanaan: Lakukan rangkaian gerak dengan ritme pernapasan yang stabil.
   - Sikap Akhir: Pendaratan mengeper dengan kedua lutut lentur untuk meredam beban kejut.
3. Nilai Karakter & Kebugaran (Mindful, Meaningful, Joyful):
   Menanamkan sportivitas, gotong royong, menjaga keselamatan diri dan rekan, serta mensyukuri nikmat tubuh sehat.`;

  // Tanda Tangan
  const kepalaSekolahNama = typeof rpm.tandaTangan?.kepalaSekolah === 'object' && rpm.tandaTangan?.kepalaSekolah !== null
    ? (rpm.tandaTangan.kepalaSekolah as { nama: string; nip: string }).nama
    : (typeof rpm.tandaTangan?.kepalaSekolah === 'string' && rpm.tandaTangan.kepalaSekolah.trim()
        ? rpm.tandaTangan.kepalaSekolah
        : 'Soleh, S.Pd., M.Pd.');

  const kepalaSekolahNip = typeof rpm.tandaTangan?.kepalaSekolah === 'object' && rpm.tandaTangan?.kepalaSekolah !== null
    ? (rpm.tandaTangan.kepalaSekolah as { nama: string; nip: string }).nip
    : 'NIP. 19750512 200003 1 004';

  const guruNama = typeof rpm.tandaTangan?.guruMapel === 'object' && rpm.tandaTangan?.guruMapel !== null
    ? (rpm.tandaTangan.guruMapel as { nama: string; nip: string }).nama
    : (typeof rpm.tandaTangan?.guruMapel === 'string' && rpm.tandaTangan.guruMapel.trim()
        ? rpm.tandaTangan.guruMapel
        : penyusun);

  const guruNip = typeof rpm.tandaTangan?.guruMapel === 'object' && rpm.tandaTangan?.guruMapel !== null
    ? (rpm.tandaTangan.guruMapel as { nama: string; nip: string }).nip
    : 'NIP. ........................................';

  // Single Meeting LKPD
  const lkpdItem = (rpm.lkpdList && rpm.lkpdList.length > 0) ? rpm.lkpdList[0] : {
    pertemuan: 'Pertemuan 1',
    title: `LKPD Pertemuan 1: ${topikElemen}`,
    content: `LEMBAR KERJA PESERTA DIDIK (LKPD) - PERTEMUAN 1 (${alokasiWaktu})\nTopik: ${topikElemen}\n\n1. IDENTITAS PESERTA DIDIK\nNama: .......................................\nKelas/Fase: ${kelasFase}\nMata Pelajaran: ${mataPelajaran}\n\n2. PETUNJUK BELAJAR\n- Berdoalah sebelum belajar.\n- Terapkan prinsip mindful, meaningful, dan joyful.\n- Praktikkan gerakan dengan mengutamakan keselamatan.\n\n3. SINTAKS & AKTIVITAS\nProblem Based Learning: Orientasi Masalah -> Diskusi Solusi -> Praktik Lapangan -> Refleksi.\n\n4. PENGALAMAN BELAJAR MENDALAM\nA. MEMAHAMI:\n1) Jelaskan konsep dasar gerakan ${topikElemen}!\n2) Sebutkan 2 kesalahan umum yang harus dihindari!\n3) Mengapa keseimbangan tubuh sangat penting?\n\nB. MENGAPLIKASIKAN:\nTugas studi kasus: Praktikkan gerakan dalam tim estafet kecil secara sportif dan saling menyemangati!\n\nC. MEREFLEKSIKAN:\n1) Apa hal baru yang kamu rasakan hari ini?\n2) Nilai karakter apa yang paling berkembang pada dirimu?`
  };

  const content = `
    <!-- JUDUL DOKUMEN (PERSIS PREVIEW) -->
    <div data-f4-kop="true" style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10pt; margin-bottom: 14pt;">
      <h2 style="font-size: 13.5pt; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase;">
        PERENCANAAN PEMBELAJARAN MENDALAM (RPM)
      </h2>
      <p style="font-size: 10pt; font-weight: bold; color: #334155; margin: 3pt 0 0 0; text-transform: uppercase;">
        ${mataPelajaran} &bull; ${kelasFase}
      </p>
      <p style="font-size: 9pt; color: #64748b; margin: 2pt 0 0 0;">
        ${sekolah} &bull; Tahun Ajaran ${tahunAjaran} &bull; Alokasi Waktu: ${alokasiWaktu}
      </p>
    </div>

    <div data-f4-section="Bagian 1: Tabel Utama RPM 1 Pertemuan (A. Identitas s.d. E. Asesmen & Pengesahan)">
    <!-- TABEL UTAMA RPM DENGAN HEADER GELAP (#0f172a) & KATEGORI KUNING EMAS (#fef08a) -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 18pt; font-family: Arial, sans-serif; font-size: 9.5pt;">
      <thead>
        <tr style="background-color: #0f172a; color: #ffffff;">
          <th style="width: 32%; padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; color: #ffffff; background-color: #0f172a;">Komponen</th>
          <th style="width: 68%; padding: 8px 10px; border: 1px solid #334155; text-align: left; font-size: 9.5pt; font-weight: bold; text-transform: uppercase; color: #ffffff; background-color: #0f172a;">Uraian Perencanaan Pembelajaran Mendalam</th>
        </tr>
      </thead>
      <tbody>
        <!-- A. IDENTITAS -->
        <tr style="background-color: #fef08a;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #1c1917; background-color: #fef08a;">
            A. IDENTITAS
          </td>
        </tr>
        <tr>
          <td style="width: 32%; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Penyusun</td>
          <td style="width: 68%; padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${penyusun}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Sekolah</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${sekolah}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Tahun Ajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${tahunAjaran}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Semester</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${semester}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Mata Pelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${mataPelajaran}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Kelas / Fase Capaian</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${kelasFase}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Topik</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #78350f;">${topikElemen}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9;">Alokasi Waktu</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #065f46;">${alokasiWaktu}</td>
        </tr>

        <!-- B. IDENTIFIKASI -->
        <tr style="background-color: #fef08a;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #1c1917; background-color: #fef08a;">
            B. IDENTIFIKASI
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Identifikasi Murid</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.identifikasi?.muridOps || rpm.identifikasi?.identifikasiMurid || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Materi Pelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.identifikasi?.materiPelajaranOps || rpm.identifikasi?.materiPelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Dimensi Profil Lulusan</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.6;">
            ${dplHtml}
          </td>
        </tr>

        <!-- C. DESAIN PEMBELAJARAN -->
        <tr style="background-color: #fef08a;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #1c1917; background-color: #fef08a;">
            C. DESAIN PEMBELAJARAN
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Capaian Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.capaianPembelajaranOps || rpm.desainPembelajaran?.capaianPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Lintas Disiplin Ilmu</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.lintasDisiplinIlmuOps || rpm.desainPembelajaran?.lintasDisiplinIlmu || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Tujuan Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.tujuanPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Topik Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.topikPembelajaranOps || rpm.desainPembelajaran?.topikPembelajaran || topikElemen)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Praktik Pedagogis</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.praktikPedagogis || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Kemitraan Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.kemitraanPembelajaranOps || rpm.desainPembelajaran?.kemitraanPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Lingkungan Pembelajaran</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.lingkunganPembelajaran || '-')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">Pemanfaatan Digital</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.desainPembelajaran?.pemanfaatanDigitalOps || rpm.desainPembelajaran?.pemanfaatanDigital || '-')}</td>
        </tr>

        <!-- D. PENGALAMAN BELAJAR (2-COLUMN PERSIS PREVIEW) -->
        <tr style="background-color: #fef08a;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #1c1917; background-color: #fef08a;">
            D. PENGALAMAN BELAJAR
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">
            <div>Kegiatan Awal</div>
            <div style="font-size: 8.5pt; color: #92400e; font-weight: normal;">(15 Menit)</div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">
            ${nl2br(rpm.pengalamanBelajar?.kegiatanAwal || '1. Guru menyapa murid dengan salam hangat dan ramah.\n2. Murid berdoa bersama dipimpin ketua kelas.\n3. Guru mengecek kehadiran dan kesiapan fisik.\n4. Apersepsi kontekstual dan motivasi.')}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">
            <div>Kegiatan Inti</div>
            <div style="font-size: 8.5pt; color: #92400e; font-weight: normal;">(60 Menit)</div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">
            ${nl2br(rpm.pengalamanBelajar?.kegiatanInti || 'Tahap 1: Memahami (15 Menit)\nTahap 2: Mengaplikasikan (30 Menit)\nTahap 3: Merefleksi (15 Menit)')}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: bold; vertical-align: top; background-color: #fafaf9;">
            <div>Kegiatan Penutup</div>
            <div style="font-size: 8.5pt; color: #92400e; font-weight: normal;">(5 Menit)</div>
          </td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">
            ${nl2br(rpm.pengalamanBelajar?.kegiatanPenutup || '1. Pendinginan terpandu.\n2. Simpulan bersama dan apresiasi.\n3. Doa dan salam penutup.')}
          </td>
        </tr>

        <!-- E. ASESMEN PEMBELAJARAN -->
        <tr style="background-color: #fef08a;">
          <td colspan="2" style="padding: 7px 10px; border: 1px solid #94a3b8; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; color: #1c1917; background-color: #fef08a;">
            E. ASESMEN PEMBELAJARAN
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9; vertical-align: top;">Asesmen Awal</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.asesmenPembelajaran?.awal || 'Asesmen diagnostik non-kognitif & 5 butir soal pemahaman awal.')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9; vertical-align: top;">Asesmen Proses</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.asesmenPembelajaran?.proses || 'Observasi unjuk kerja gerak kelompok, rubrik sikap, dan penilaian LKPD.')}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #fafaf9; vertical-align: top;">Asesmen Akhir</td>
          <td style="padding: 6px 10px; border: 1px solid #cbd5e1; line-height: 1.55;">${nl2br(rpm.asesmenPembelajaran?.akhir || 'Uji pemahaman mandiri, peragaan unjuk kerja autentik, serta ceklis refleksi diri.')}</td>
        </tr>
      </tbody>
    </table>

    <!-- TANDA TANGAN RESMI -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 18pt; margin-bottom: 20pt; border: none;">
      <tr>
        <td style="width: 50%; border: none; text-align: center; font-size: 9.5pt; vertical-align: top;">
          <p style="margin: 0 0 4px 0;">Mengetahui,</p>
          <p style="font-weight: bold; margin: 0 0 48pt 0;">Kepala Sekolah</p>
          <p style="font-weight: bold; text-decoration: underline; margin: 0 0 3px 0;">${kepalaSekolahNama}</p>
          <p style="margin: 0; color: #64748b; font-size: 9pt;">${kepalaSekolahNip.startsWith('NIP') ? kepalaSekolahNip : `NIP. ${kepalaSekolahNip}`}</p>
        </td>
        <td style="width: 50%; border: none; text-align: center; font-size: 9.5pt; vertical-align: top;">
          <p style="margin: 0 0 4px 0;">${rpm.tandaTangan?.tempatTanggal || 'Surakarta, 1 Juli 2025'}</p>
          <p style="font-weight: bold; margin: 0 0 48pt 0;">Guru Mata Pelajaran</p>
          <p style="font-weight: bold; text-decoration: underline; margin: 0 0 3px 0;">${guruNama}</p>
          <p style="margin: 0; color: #64748b; font-size: 9pt;">${guruNip.startsWith('NIP') ? guruNip : `NIP. ${guruNip}`}</p>
        </td>
      </tr>
    </table>
    </div>

    <!-- ======================================================== -->
    <!-- LAMPIRAN 1 - 10 (PERSIS PREVIEW)                         -->
    <!-- ======================================================== -->
    <div data-f4-section="Bagian 2: Lampiran 1–5 (Asesmen Diagnostik, Soal Awal, Formatif, Sikap & Pengetahuan)" style="page-break-before: always; margin-top: 20pt; padding-top: 6pt;">
      <div style="border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6pt; margin-bottom: 12pt;">
        <h3 style="font-size: 11.5pt; font-weight: bold; color: #0f172a; margin: 0; text-transform: uppercase;">
          LAMPIRAN ASESMEN &amp; PERANGKAT PEMBELAJARAN (1 - 10)
        </h3>
      </div>

      <!-- Lampiran 1: Lembar Asesmen Diagnostik Non-kognitif -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 1: Lembar Asesmen Diagnostik Non-kognitif
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9.5pt;">
          <p style="margin: 0 0 8pt 0; font-weight: bold; color: #334155;">
            Tujuan: ${rpm.lampiran?.asesmenDiagnostikNonKognitif?.tujuan || 'Mengetahui kesiapan fisik, mental, dan emosional sebelum belajar.'}
          </p>
          ${diagQuestions.map(q => `
            <div style="padding: 6pt 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6pt;">
              <div style="font-weight: bold; color: #1e293b;">${q.no}. ${nl2br(q.teks)}</div>
              <div style="margin-top: 3pt; font-size: 8.5pt; color: #475569;">
                [ &nbsp; ] Sangat Siap / Bahagia &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Cukup Siap &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Kurang Fit / Butuh Istirahat
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Lampiran 2: Soal Asesmen Awal Kognitif (5 Butir Soal & Kunci Jawaban) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 2: Soal Asesmen Awal Kognitif (5 Butir Soal &amp; Kunci Jawaban)
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9.5pt;">
          ${soalAwalList.map((s, idx) => `
            <div style="padding: 6pt 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6pt;">
              <div style="font-weight: bold; color: #0f172a;">${s.no || idx + 1}. ${nl2br(s.pertanyaan)}</div>
              <div style="color: #047857; font-size: 9pt; margin-top: 2pt;"><strong>Kunci Jawaban:</strong> ${nl2br(s.kunciJawaban)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Lampiran 3: Lembar Asesmen Formatif (Diskusi, Presentasi, Unjuk Kerja) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 3: Lembar Asesmen Formatif (Diskusi, Presentasi, Unjuk Kerja)
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9.5pt;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-size: 9pt;">
            <tr>
              <td style="width: 33.3%; padding: 6pt 8pt; background-color: #fffbeb; border: 1px solid #fde68a; vertical-align: top;">
                <div style="font-weight: bold; color: #78350f; margin-bottom: 2pt;">Diskusi Kelompok</div>
                <div style="color: #334155;">${nl2br(formatifDiskusi)}</div>
              </td>
              <td style="width: 33.3%; padding: 6pt 8pt; background-color: #eff6ff; border: 1px solid #bfdbfe; vertical-align: top;">
                <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 2pt;">Presentasi &amp; Peragaan</div>
                <div style="color: #334155;">${nl2br(formatifPresentasi)}</div>
              </td>
              <td style="width: 33.3%; padding: 6pt 8pt; background-color: #ecfdf5; border: 1px solid #a7f3d0; vertical-align: top;">
                <div style="font-weight: bold; color: #065f46; margin-bottom: 2pt;">Unjuk Kerja Praktik</div>
                <div style="color: #334155;">${nl2br(formatifUnjukKerja)}</div>
              </td>
            </tr>
          </table>
          <div style="font-weight: bold; color: #1e293b; margin-bottom: 4pt;">Rubrik Penilaian Formatif 5 Skala:</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 9pt;">
            ${formatifRubrik.map(r => `
              <tr>
                <td style="width: 15%; padding: 4pt 6pt; border: 1px solid #e2e8f0; font-weight: bold; color: #92400e; background-color: #fef3c7; text-align: center;">Skor ${r.skor}</td>
                <td style="width: 85%; padding: 4pt 8pt; border: 1px solid #e2e8f0; color: #334155;">${nl2br(r.deskripsi)}</td>
              </tr>
            `).join('')}
          </table>
        </div>
      </div>

      <!-- Lampiran 4: Lembar Penilaian Sikap (Spiritual, Sosial, Skala SL/SR/KD/TP) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 4: Lembar Penilaian Sikap (Spiritual, Sosial, Skala SL/SR/KD/TP)
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9.5pt;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 8pt; font-size: 9pt;">
            <tr>
              <td style="width: 50%; padding: 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; vertical-align: top;">
                <div style="font-weight: bold; color: #0f172a; margin-bottom: 4pt;">A. Sikap Spiritual (Penilaian Diri)</div>
                ${sikapSpiritual.map(item => `<div style="margin-bottom: 3pt;">&bull; ${nl2br(item)}</div>`).join('')}
              </td>
              <td style="width: 50%; padding: 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; vertical-align: top;">
                <div style="font-weight: bold; color: #0f172a; margin-bottom: 4pt;">B. Sikap Sosial (Penilaian Antarteman)</div>
                ${sikapSosial.map(item => `<div style="margin-bottom: 3pt;">&bull; ${nl2br(item)}</div>`).join('')}
              </td>
            </tr>
          </table>
          <div style="padding: 6pt 8pt; background-color: #fefce8; border: 1px solid #fde047; font-size: 8.5pt; color: #713f12;">
            <strong>Keterangan Skala:</strong> SL = Selalu (4), SR = Sering (3), KD = Kadang-kadang (2), TP = Tidak Pernah (1). Rumus: (Jumlah Skor / 16) &times; 100.
          </div>
        </div>
      </div>

      <!-- Lampiran 5: Rubrik Penilaian Pengetahuan LKPD (4 Skala) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 5: Rubrik Penilaian Pengetahuan LKPD (4 Skala)
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9pt;">
          ${pedomanPengetahuan.map((p, idx) => `
            <div style="padding: 6pt 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6pt;">
              <div style="font-weight: bold; color: #0f172a; margin-bottom: 3pt;">${idx + 1}. Aspek: ${p.aspek}</div>
              <div><strong style="color: #065f46;">Skor 4:</strong> ${p.skor4} &nbsp;&bull;&nbsp; <strong style="color: #1e40af;">Skor 3:</strong> ${p.skor3}</div>
              <div><strong style="color: #92400e;">Skor 2:</strong> ${p.skor2} &nbsp;&bull;&nbsp; <strong style="color: #9f1239;">Skor 1:</strong> ${p.skor1}</div>
            </div>
          `).join('')}
          <div style="font-size: 8.5pt; font-weight: bold; color: #475569;">
            Rumus: ${rpm.lampiran?.penilaianPengetahuan?.rumusNilai || 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'}
          </div>
        </div>
      </div>
    </div>

    <div data-f4-section="Bagian 3: Lampiran 6–10 (Rubrik Keterampilan, Remedial/Pengayaan, Refleksi, Soal Akhir & Materi Ajar)" style="page-break-before: always; margin-top: 20pt; padding-top: 6pt;">
      <!-- Lampiran 6: Rubrik Penilaian Keterampilan Unjuk Kerja Praktik (4 Skala) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 6: Rubrik Penilaian Keterampilan Unjuk Kerja Praktik (4 Skala)
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9pt;">
          ${pedomanKeterampilan.map((p, idx) => `
            <div style="padding: 6pt 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6pt;">
              <div style="font-weight: bold; color: #0f172a; margin-bottom: 3pt;">${idx + 1}. Aspek: ${p.aspek}</div>
              <div><strong style="color: #065f46;">Skor 4:</strong> ${p.skor4} &nbsp;&bull;&nbsp; <strong style="color: #1e40af;">Skor 3:</strong> ${p.skor3}</div>
              <div><strong style="color: #92400e;">Skor 2:</strong> ${p.skor2} &nbsp;&bull;&nbsp; <strong style="color: #9f1239;">Skor 1:</strong> ${p.skor1}</div>
            </div>
          `).join('')}
          <div style="font-size: 8.5pt; font-weight: bold; color: #475569;">
            Rumus: ${rpm.lampiran?.penilaianKeterampilan?.rumusNilai || 'Nilai Akhir = (Jumlah Skor Diperoleh / 16) × 100'}
          </div>
        </div>
      </div>

      <!-- Lampiran 7: Strategi Pengayaan dan Remedial -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 7: Strategi Pengayaan dan Remedial
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9pt;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; padding: 8pt; background-color: #fff1f2; border: 1px solid #fecdd3; vertical-align: top;">
                <div style="font-weight: bold; color: #881337; margin-bottom: 3pt;">Program Remedial:</div>
                <div style="margin-bottom: 4pt; color: #334155;">Tujuan: ${rpm.lampiran?.pengayaanDanRemedial?.remedial?.tujuan || 'Membantu murid yang belum tuntas mencapai kompetensi gerak.'}</div>
                ${remedialStrategi.map(s => `<div style="margin-bottom: 3pt;">&bull; <strong>${s.nama}:</strong> ${s.deskripsi}</div>`).join('')}
              </td>
              <td style="width: 50%; padding: 8pt; background-color: #ecfdf5; border: 1px solid #a7f3d0; vertical-align: top;">
                <div style="font-weight: bold; color: #064e3b; margin-bottom: 3pt;">Program Pengayaan:</div>
                <div style="margin-bottom: 4pt; color: #334155;">Tujuan: ${rpm.lampiran?.pengayaanDanRemedial?.pengayaan?.tujuan || 'Memberikan tantangan perluasan keterampilan dan kepemimpinan.'}</div>
                ${pengayaanStrategi.map(s => `<div style="margin-bottom: 3pt;">&bull; <strong>${s.nama}:</strong> ${s.deskripsi}</div>`).join('')}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- Lampiran 8: Lembar Refleksi Guru dan Peserta Didik -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 8: Lembar Refleksi Guru dan Peserta Didik
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9pt;">
          <div style="font-weight: bold; color: #0f172a; margin-bottom: 4pt;">A. Refleksi Guru:</div>
          ${refleksiGuruList.map((g, i) => `
            <div style="padding: 4pt 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; margin-bottom: 4pt;">
              ${i + 1}. ${g.refleksiGuru || g.aspek} &nbsp;&mdash;&nbsp; <span style="color: #64748b; font-style: italic;">[${g.jawaban || '........................'}]</span>
            </div>
          `).join('')}
          <div style="font-weight: bold; color: #0f172a; margin: 8pt 0 3pt 0;">B. Refleksi Peserta Didik:</div>
          <div style="color: #334155; line-height: 1.55;">
            ${nl2br(rpm.lampiran?.refleksi?.pesertaDidik || 'Menutup pembelajaran dengan refleksi diri menggunakan lembar ceklis jurnal refleksi mengenai pengalaman gerak dan perasaan belajar hari ini.')}
          </div>
        </div>
      </div>

      <!-- Lampiran 9: Soal Asesmen Akhir Lingkup Materi (5 Butir Soal & Kunci Jawaban) -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 12pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 9: Soal Asesmen Akhir Lingkup Materi (5 Butir Soal &amp; Kunci Jawaban)
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9.5pt;">
          ${soalAkhirList.map((s, idx) => `
            <div style="padding: 6pt 8pt; background-color: #fafaf9; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 6pt;">
              <div style="font-weight: bold; color: #0f172a;">${s.no || idx + 1}. ${nl2br(s.pertanyaan)}</div>
              <div style="color: #047857; font-size: 9pt; margin-top: 2pt;"><strong>Kunci Jawaban:</strong> ${nl2br(s.kunciJawaban)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Lampiran 10: Ringkasan Materi Ajar -->
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 14pt; overflow: hidden;">
        <div style="background-color: #fef08a; padding: 6pt 10pt; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; color: #1c1917;">
          Lampiran 10: Ringkasan Materi Ajar
        </div>
        <div style="padding: 10pt; background-color: #ffffff; font-size: 9.5pt; line-height: 1.6; color: #1e293b;">
          ${nl2br(materiAjarRingkas)}
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- LEMBAR KERJA PESERTA DIDIK (LKPD) - NON-TABEL            -->
    <!-- ======================================================== -->
    <div data-f4-section="Bagian 4: Lembar Kerja Peserta Didik (LKPD) Non-Tabel — 1 Pertemuan" style="page-break-before: always; margin-top: 20pt; padding-top: 6pt;">
      <div style="border-bottom: 1.5px solid #cbd5e1; padding-bottom: 6pt; margin-bottom: 10pt;">
        <span style="font-weight: bold; color: #0f172a; font-size: 11pt; text-transform: uppercase;">
          LEMBAR KERJA PESERTA DIDIK (LKPD) - NON-TABEL &bull; 1 PERTEMUAN (${alokasiWaktu})
        </span>
      </div>
      <div style="padding: 14pt; background-color: #fafaf9; border: 1px solid #cbd5e1; border-radius: 8px; font-family: 'Courier New', Courier, monospace; font-size: 9.5pt; line-height: 1.65; color: #0f172a;">
        ${nl2br(lkpdItem.content)}
      </div>
    </div>
  `;

  return wrapWithDocShell(rpm.title || `RPM_1_PERTEMUAN_${topikElemen.replace(/\s+/g, '_')}`, content);
}

/**
 * Copies rich HTML content directly to clipboard and opens a new Google Doc tab for immediate pasting
 */
export async function copyRichHtmlToClipboard(htmlContent: string): Promise<boolean> {
  try {
    const formattedF4Html = formatHtmlForF4WordDoc(htmlContent, 'Dokumen_Administrasi_PJOK_F4');
    // Plain text fallback (strip all html tags cleanly)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedF4Html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    const htmlBlob = new Blob([formattedF4Html], { type: 'text/html' });
    
    const clipboardItem = new ClipboardItem({
      'text/plain': textBlob,
      'text/html': htmlBlob,
    });
    
    await navigator.clipboard.write([clipboardItem]);
    return true;
  } catch (err) {
    console.error('Failed to copy rich HTML to clipboard:', err);
    // Fallback to plain text copy via traditional API
    try {
      await navigator.clipboard.writeText(htmlContent.replace(/<[^>]*>/g, ''));
      return true;
    } catch (e) {
      console.error('Fallback copy failed:', e);
      return false;
    }
  }
}

/**
 * Helper to copy generated content as beautiful rich doc and open https://docs.new
 */
export async function copyAndOpenGoogleDocs(htmlContent: string): Promise<boolean> {
  const copied = await copyRichHtmlToClipboard(htmlContent);
  if (copied) {
    // Open a new tab to docs.new so user can immediately paste with Ctrl+V / Cmd+V
    window.open('https://docs.new', '_blank');
  }
  return copied;
}

/**
 * 10. Exports KKTP (Kriteria Ketercapaian Tujuan Pembelajaran) with Interval and descriptions
 */
export function exportKktpToDoc(kktp: KktpData): string {
  const rows = kktp.kktpRows.map((row) => {
    return `
      <tr>
        <td style="text-align: center; vertical-align: top; border: 1px solid #cbd5e1; padding: 8px;">${row.no}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${kktp.bab}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${kktp.materiPokok}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px;">${kktp.deskripsiCp}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${row.tujuanPembelajaran}</td>
        <td style="background-color: #fef2f2; font-size: 9pt; border: 1px solid #cbd5e1; padding: 8px; color: #991b1b;">${row.intervalDeskripsi.perluBimbingan}</td>
        <td style="background-color: #fffbeb; font-size: 9pt; border: 1px solid #cbd5e1; padding: 8px; color: #92400e;">${row.intervalDeskripsi.cukup}</td>
        <td style="background-color: #eff6ff; font-size: 9pt; border: 1px solid #cbd5e1; padding: 8px; color: #1e40af;">${row.intervalDeskripsi.baik}</td>
        <td style="background-color: #f0fdf4; font-size: 9pt; border: 1px solid #cbd5e1; padding: 8px; color: #065f46;">${row.intervalDeskripsi.sangatBaik}</td>
      </tr>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1 style="text-align: center; margin-bottom: 5px;">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h1>
      <p style="text-align: center; font-size: 10pt; font-weight: bold; color: #475569; margin-top: 0; margin-bottom: 20px;">
        INTERVAL NILAI DAN RUBRIK DESKRIPTIF KINERJA BELAJAR
      </p>

      <div class="info-box">
        <table class="info-grid">
          <tr>
            <td width="50%"><strong>Satuan Pendidikan:</strong> ${kktp.identitas.satuanPendidikan}</td>
            <td width="50%"><strong>Mata Pelajaran:</strong> ${kktp.identitas.mataPelajaran}</td>
          </tr>
          <tr>
            <td><strong>Semester:</strong> Semester ${kktp.identitas.semester}</td>
            <td><strong>Kelas / Fase:</strong> Kelas ${kktp.identitas.kelas} / Fase ${kktp.identitas.fase}</td>
          </tr>
          <tr>
            <td><strong>Tahun Pelajaran:</strong> ${kktp.identitas.tahunPelajaran}</td>
            <td><strong>Status Kurikulum:</strong> Kurikulum Merdeka</td>
          </tr>
        </table>
      </div>
    </div>

    <div data-f4-section="Bagian 1: Tabel Interval Nilai & Rubrik KKTP serta Pengesahan" data-f4-orientation="landscape">
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      <thead>
        <tr style="background-color: #0f172a; color: #ffffff;">
          <th rowspan="2" style="width: 4%; text-align: center; border: 1px solid #cbd5e1; padding: 8px;">No</th>
          <th rowspan="2" style="width: 8%; border: 1px solid #cbd5e1; padding: 8px;">Bab</th>
          <th rowspan="2" style="width: 12%; border: 1px solid #cbd5e1; padding: 8px;">Materi Pokok</th>
          <th rowspan="2" style="width: 18%; border: 1px solid #cbd5e1; padding: 8px;">Deskripsi Capaian Pembelajaran</th>
          <th rowspan="2" style="width: 18%; border: 1px solid #cbd5e1; padding: 8px;">Tujuan Pembelajaran</th>
          <th colspan="4" style="text-align: center; border: 1px solid #cbd5e1; padding: 8px; background-color: #1e293b;">Interval Nilai</th>
        </tr>
        <tr style="background-color: #1e293b; color: #ffffff;">
          <th style="width: 10%; text-align: center; border: 1px solid #cbd5e1; padding: 6px; background-color: #fee2e2; color: #991b1b; font-size: 8.5pt;">Perlu Bimbingan (0-68)</th>
          <th style="width: 10%; text-align: center; border: 1px solid #cbd5e1; padding: 6px; background-color: #fef3c7; color: #92400e; font-size: 8.5pt;">Cukup (68-78)</th>
          <th style="width: 10%; text-align: center; border: 1px solid #cbd5e1; padding: 6px; background-color: #dbeafe; color: #1e40af; font-size: 8.5pt;">Baik (79-89)</th>
          <th style="width: 10%; text-align: center; border: 1px solid #cbd5e1; padding: 6px; background-color: #d1fae5; color: #065f46; font-size: 8.5pt;">Sangat Baik (90-100)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <table class="signature-grid" style="width: 100%; border-collapse: collapse; margin-top: 40px;">
      <tr>
        <td style="width: 50%; border: none; text-align: center;">
          <p>Mengetahui,</p>
          <p><strong>Kepala Sekolah</strong></p>
          <br><br><br><br>
          <p>___________________________</p>
          <p style="font-size: 9pt; color: #64748b;">NIP. _______________________</p>
        </td>
        <td style="width: 50%; border: none; text-align: center;">
          <p>Jakarta, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Guru Mata Pelajaran</strong></p>
          <br><br><br><br>
          <p>___________________________</p>
          <p style="font-size: 9pt; color: #64748b;">NIP. _______________________</p>
        </td>
      </tr>
    </table>
    </div>
  `;

  return wrapWithLandscapeDocShell(`KKTP_${kktp.identitas.mataPelajaran.replace(/\s+/g, '_')}`, content);
}

/**
 * 11. Exports Rincian Pekan Efektif (RPE) to Microsoft Word compatible format
 */
export function exportRpeToDoc(rpe: RpeData): string {
  const bulanRows = rpe.alokasiWaktu.bulans.map((b) => {
    return `
      <tr style="page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${b.no}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${b.bulan}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${b.jumlahPekan}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-weight: bold; color: #15803d; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${b.pekanEfektif}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-weight: bold; color: #b91c1c; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${b.pekanTidakEfektif}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-family: Arial, sans-serif; font-size: 9pt; color: #334155; mso-border-alt: solid windowtext 0.5pt;">${b.keterangan || '-'}</td>
      </tr>
    `;
  }).join('\n');

  const tidakEfektifRows = rpe.pekanTidakEfektif.map((act) => {
    return `
      <tr style="page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${act.no}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${act.uraianKegiatan}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-weight: bold; color: #b91c1c; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${act.jumlahPekan}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-family: Arial, sans-serif; font-size: 9pt; color: #334155; mso-border-alt: solid windowtext 0.5pt;">${act.keterangan || '-'}</td>
      </tr>
    `;
  }).join('\n');

  const distribusiRows = Array.isArray(rpe.distribusiAlokasiWaktu) && rpe.distribusiAlokasiWaktu.length > 0
    ? rpe.distribusiAlokasiWaktu.map((item) => `
      <tr style="page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">${item.no}</td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-weight: bold; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">
          ${item.materiPokok}
        </td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-family: Arial, sans-serif; font-size: 9pt; color: #475569; mso-border-alt: solid windowtext 0.5pt;">
          ${item.lingkupMateri || 'Elemen Capaian Pembelajaran'}
        </td>
        <td style="border: 1pt solid #000000; padding: 5pt 4pt; text-align: center; font-weight: bold; color: #0f172a; font-family: Arial, sans-serif; font-size: 9.5pt; mso-border-alt: solid windowtext 0.5pt;">
          ${item.alokasiWaktuJp} JP
        </td>
        <td style="border: 1pt solid #000000; padding: 5pt 6pt; font-family: Arial, sans-serif; font-size: 9pt; color: #475569; mso-border-alt: solid windowtext 0.5pt;">
          ${item.keterangan || '-'}
        </td>
      </tr>
    `).join('\n')
    : '';

  const totalDistribusiJp = Array.isArray(rpe.distribusiAlokasiWaktu)
    ? rpe.distribusiAlokasiWaktu.reduce((acc, curr) => acc + (Number(curr.alokasiWaktuJp) || 0), 0)
    : rpe.totalJamEfektif;

  const kepsekName = rpe.identitas.kepalaSekolah || 'Kepala Sekolah';
  const kepsekNip = rpe.identitas.nipKepsek || '-';
  const guruName = rpe.identitas.namaGuru || 'Guru Mata Pelajaran PJOK';
  const guruNip = rpe.identitas.nipGuru || '-';
  const kota = rpe.identitas.kota || 'Kota';

  const content = `
    <div data-f4-kop="true">
      <!-- HEADER KOP RESMI DOKUMEN -->
      <div style="text-align: center; border-bottom: 2.5pt double #000000; padding-bottom: 6pt; margin-bottom: 14pt;">
        <h3 style="margin: 0 0 2pt 0; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #334155; letter-spacing: 0.5pt;">
          ${rpe.identitas.namaSekolah}
        </h3>
        <h1 style="margin: 2pt 0 2pt 0; font-family: Arial, sans-serif; font-size: 15pt; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 1pt;">
          RINCIAN PEKAN EFEKTIF (RPE)
        </h1>
        <p style="margin: 2pt 0 0 0; font-family: Arial, sans-serif; font-size: 10pt; font-weight: bold; color: #000000; text-transform: uppercase;">
          KURIKULUM MERDEKA &bull; TAHUN PELAJARAN ${rpe.identitas.tahunPelajaran}
        </p>
      </div>

      <!-- TABEL IDENTITAS SEKOLAH -->
      <table border="0" cellspacing="0" cellpadding="3" style="width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-family: Arial, sans-serif; font-size: 9.5pt;">
        <tr>
          <td style="width: 20%; padding: 3pt 0; font-weight: bold; border: none;">Satuan Pendidikan</td>
          <td style="width: 30%; padding: 3pt 0; border: none;">: ${rpe.identitas.namaSekolah}</td>
          <td style="width: 20%; padding: 3pt 0; font-weight: bold; border: none;">Mata Pelajaran</td>
          <td style="width: 30%; padding: 3pt 0; border: none;">: ${rpe.identitas.mataPelajaran}</td>
        </tr>
        <tr>
          <td style="padding: 3pt 0; font-weight: bold; border: none;">Kelas / Fase</td>
          <td style="padding: 3pt 0; border: none;">: Kelas ${rpe.identitas.kelas} ${rpe.identitas.fase ? `(${rpe.identitas.fase})` : ''}</td>
          <td style="padding: 3pt 0; font-weight: bold; border: none;">Semester</td>
          <td style="padding: 3pt 0; border: none;">: Semester ${rpe.identitas.semester}</td>
        </tr>
        <tr>
          <td style="padding: 3pt 0; font-weight: bold; border: none;">Beban Alokasi Waktu</td>
          <td style="padding: 3pt 0; border: none;">: ${rpe.identitas.jpPerMinggu} Jam Pelajaran (JP) / Pekan</td>
          <td style="padding: 3pt 0; font-weight: bold; border: none;">Tahun Pelajaran</td>
          <td style="padding: 3pt 0; border: none;">: ${rpe.identitas.tahunPelajaran}</td>
        </tr>
      </table>
    </div>

    <div data-f4-section="Bagian 1: I. Perhitungan Alokasi Waktu Pekan Efektif">
    <!-- I. PERHITUNGAN PEKAN EFEKTIF -->
    <h2 style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; border-bottom: 1pt solid #000000; padding-bottom: 2pt; text-transform: uppercase;">
      I. PERHITUNGAN ALOKASI WAKTU PEKAN EFEKTIF
    </h2>

    <h3 style="font-family: Arial, sans-serif; font-size: 10pt; color: #000000; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt;">
      1. Jumlah Pekan dalam Semester ${rpe.identitas.semester}
    </h3>
    
    <table border="1" cellspacing="0" cellpadding="5" bordercolor="#000000" style="width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-family: Arial, sans-serif; font-size: 9.5pt; border: 1pt solid #000000; mso-table-layout-alt: fixed; mso-border-alt: solid windowtext 0.75pt;">
      <thead>
        <tr style="background-color: #f1f5f9; color: #000000; mso-yfti-head: y; display: table-header-group;">
          <th style="width: 6%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">No</th>
          <th style="width: 24%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Nama Bulan</th>
          <th style="width: 16%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Jumlah Pekan</th>
          <th style="width: 16%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Pekan Efektif</th>
          <th style="width: 16%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Tidak Efektif</th>
          <th style="width: 22%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Keterangan Kegiatan</th>
        </tr>
      </thead>
      <tbody>
        ${bulanRows}
        <tr style="background-color: #f8fafc; font-weight: bold; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
          <td colspan="2" style="text-align: center; border: 1pt solid #000000; padding: 6pt; text-transform: uppercase; mso-border-alt: solid windowtext 0.75pt;">Jumlah Total Pekan</td>
          <td style="text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; mso-border-alt: solid windowtext 0.75pt;">${rpe.alokasiWaktu.totalPekan}</td>
          <td style="text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; color: #15803d; mso-border-alt: solid windowtext 0.75pt;">${rpe.alokasiWaktu.totalPekanEfektif}</td>
          <td style="text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; color: #b91c1c; mso-border-alt: solid windowtext 0.75pt;">${rpe.alokasiWaktu.totalPekanTidakEfektif}</td>
          <td style="border: 1pt solid #000000; padding: 6pt; mso-border-alt: solid windowtext 0.75pt;">-</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-family: Arial, sans-serif; font-size: 10pt; color: #000000; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt;">
      2. Rincian Banyaknya Pekan Tidak Efektif
    </h3>

    <table border="1" cellspacing="0" cellpadding="5" bordercolor="#000000" style="width: 100%; border-collapse: collapse; margin-bottom: 14pt; font-family: Arial, sans-serif; font-size: 9.5pt; border: 1pt solid #000000; mso-table-layout-alt: fixed; mso-border-alt: solid windowtext 0.75pt;">
      <thead>
        <tr style="background-color: #f1f5f9; color: #000000; mso-yfti-head: y; display: table-header-group;">
          <th style="width: 8%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">No</th>
          <th style="width: 46%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Uraian Kegiatan / Agenda Sekolah</th>
          <th style="width: 18%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Jumlah (Pekan)</th>
          <th style="width: 28%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Keterangan / Waktu Pelaksanaan</th>
        </tr>
      </thead>
      <tbody>
        ${tidakEfektifRows}
        <tr style="background-color: #f8fafc; font-weight: bold; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
          <td colspan="2" style="text-align: center; border: 1pt solid #000000; padding: 6pt; text-transform: uppercase; mso-border-alt: solid windowtext 0.75pt;">Jumlah Total Pekan Tidak Efektif</td>
          <td style="text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; color: #b91c1c; mso-border-alt: solid windowtext 0.75pt;">${rpe.alokasiWaktu.totalPekanTidakEfektif}</td>
          <td style="border: 1pt solid #000000; padding: 6pt; mso-border-alt: solid windowtext 0.75pt;">Pekan</td>
        </tr>
      </tbody>
    </table>

    <h3 style="font-family: Arial, sans-serif; font-size: 10pt; color: #000000; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt;">
      3. Perhitungan Pekan Efektif & Jam Pelajaran (JP) Efektif
    </h3>
    <table border="1" cellspacing="0" cellpadding="8" bordercolor="#000000" style="width: 100%; border-collapse: collapse; margin-bottom: 16pt; font-family: Arial, sans-serif; font-size: 9.5pt; background-color: #f8fafc; border: 1pt solid #000000; mso-border-alt: solid windowtext 0.75pt;">
      <tr style="page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
        <td style="padding: 8pt 12pt; width: 50%; border: 1pt solid #000000; vertical-align: top; mso-border-alt: solid windowtext 0.75pt;">
          <strong>a. Banyaknya Pekan Efektif:</strong><br/>
          <span style="font-size: 8.5pt; color: #475569;">Rumus: Total Pekan Semester – Pekan Tidak Efektif</span><br/>
          <span style="font-size: 11pt; font-weight: bold; color: #15803d; font-family: Arial, monospace;">= ${rpe.totalPekanEfektifFormula}</span>
        </td>
        <td style="padding: 8pt 12pt; width: 50%; border: 1pt solid #000000; vertical-align: top; mso-border-alt: solid windowtext 0.75pt;">
          <strong>b. Jumlah Jam Pelajaran (JP) Efektif:</strong><br/>
          <span style="font-size: 8.5pt; color: #475569;">Rumus: Pekan Efektif × Beban JP/Pekan</span><br/>
          <span style="font-size: 11pt; font-weight: bold; color: #0f172a; font-family: Arial, monospace;">= ${rpe.totalJamEfektifFormula}</span>
        </td>
      </tr>
    </table>
    </div>

    <div data-f4-section="Bagian 2: II. Distribusi Alokasi Waktu Pembelajaran & Pengesahan">
    ${distribusiRows ? `
    <!-- II. DISTRIBUSI ALOKASI WAKTU -->
    <h2 style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; font-weight: bold; margin-top: 16pt; margin-bottom: 6pt; border-bottom: 1pt solid #000000; padding-bottom: 2pt; text-transform: uppercase;">
      II. DISTRIBUSI ALOKASI WAKTU PEMBELAJARAN (MATERI POKOK PJOK)
    </h2>
    <table border="1" cellspacing="0" cellpadding="5" bordercolor="#000000" style="width: 100%; border-collapse: collapse; margin-bottom: 16pt; font-family: Arial, sans-serif; font-size: 9.5pt; border: 1pt solid #000000; mso-table-layout-alt: fixed; mso-border-alt: solid windowtext 0.75pt;">
      <thead>
        <tr style="background-color: #f1f5f9; color: #000000; mso-yfti-head: y; display: table-header-group;">
          <th style="width: 6%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">No</th>
          <th style="width: 44%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Materi Pokok Pembelajaran PJOK</th>
          <th style="width: 22%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Lingkup Materi / Elemen CP</th>
          <th style="width: 14%; text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Alokasi Waktu</th>
          <th style="width: 14%; border: 1pt solid #000000; padding: 6pt 6pt; text-align: left; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        ${distribusiRows}
        <tr style="background-color: #f8fafc; font-weight: bold; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
          <td colspan="3" style="text-align: center; border: 1pt solid #000000; padding: 6pt; text-transform: uppercase; mso-border-alt: solid windowtext 0.75pt;">Total Jam Pembelajaran Didistribusikan</td>
          <td style="text-align: center; border: 1pt solid #000000; padding: 6pt 4pt; font-weight: bold; mso-border-alt: solid windowtext 0.75pt;">${totalDistribusiJp} JP</td>
          <td style="border: 1pt solid #000000; padding: 6pt; mso-border-alt: solid windowtext 0.75pt;">Sesuai JP Efektif</td>
        </tr>
      </tbody>
    </table>
    ` : ''}

    ${rpe.catatanAnalisis ? `
    <!-- III. CATATAN & REKOMENDASI -->
    <h2 style="font-family: Arial, sans-serif; font-size: 11pt; color: #000000; font-weight: bold; margin-top: 16pt; margin-bottom: 6pt; border-bottom: 1pt solid #000000; padding-bottom: 2pt; text-transform: uppercase;">
      III. CATATAN & REKOMENDASI ANALISIS KALENDER
    </h2>
    <div style="background-color: #f0fdf4; border: 1pt solid #16a34a; padding: 8pt 10pt; font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.5; color: #14532d; margin-bottom: 20pt;">
      ${rpe.catatanAnalisis}
    </div>
    ` : ''}

    <!-- KOLOM PENGESAHAN TANDA TANGAN (BEBAS TERPOTONG HALAMAN) -->
    <div style="margin-top: 25pt; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
      <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; border: none;">
        <tr style="border: none;">
          <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 0 15pt;">
            Mengetahui,<br/>
            Kepala Sekolah ${rpe.identitas.namaSekolah}<br/><br/><br/><br/><br/>
            <strong style="text-decoration: underline; font-size: 10pt;">${kepsekName}</strong><br/>
            NIP. ${kepsekNip}
          </td>
          <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 0 15pt;">
            ${kota}, ${rpe.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
            Guru Mata Pelajaran PJOK<br/><br/><br/><br/><br/>
            <strong style="text-decoration: underline; font-size: 10pt;">${guruName}</strong><br/>
            NIP. ${guruNip}
          </td>
        </tr>
      </table>
    </div>
    </div>
  `;

  return wrapWithDocShell(`RPE_${rpe.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${rpe.identitas.kelas}_${rpe.identitas.semester}`, content);
}


/**
 * 12. Exports Program Tahunan (PROTA) to Microsoft Word compatible format
 */
export function exportProtaToDoc(prota: ProtaData): string {
  const totals = prota.rows.reduce(
    (acc, row) => {
      const match = row.alokasiWaktu.match(/(\d+)\s*JP/i) || row.alokasiWaktu.match(/^(\d+)/);
      const jp = match ? parseInt(match[1], 10) : 0;
      const sem = row.semester.toLowerCase();
      if (sem.includes('1') || sem.includes('ganjil') || sem.includes('i')) {
        acc.smt1 += jp;
      } else {
        acc.smt2 += jp;
      }
      acc.total += jp;
      return acc;
    },
    { smt1: 0, smt2: 0, total: 0 }
  );

  const displaySmt1 = prota.totalJpSemester1 ?? totals.smt1;
  const displaySmt2 = prota.totalJpSemester2 ?? totals.smt2;
  const displayTahunan = prota.totalJpTahunan ?? totals.total;

  const rowsHtml = prota.rows.map((row, idx) => {
    const isEven = idx % 2 === 0;
    const bg = isEven ? '#ffffff' : '#f8fafc';
    return `
      <tr style="page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit; background-color: ${bg};">
        <td style="border: 1pt solid #000000; padding: 6pt; text-align: center; vertical-align: top; font-weight: bold; font-size: 9.5pt;">${row.no}</td>
        <td style="border: 1pt solid #000000; padding: 6pt; vertical-align: top; font-weight: bold; font-size: 9.5pt; color: #0f172a;">
          ${row.bab}
          ${row.elemen ? `<div style="font-size: 8.5pt; font-weight: normal; color: #475569; margin-top: 3pt;"><em>Elemen: ${row.elemen}</em></div>` : ''}
        </td>
        <td style="border: 1pt solid #000000; padding: 6pt; vertical-align: top; text-align: justify; font-size: 9.5pt; line-height: 1.35;">${row.tujuanPembelajaran}</td>
        <td style="border: 1pt solid #000000; padding: 6pt; vertical-align: top; font-size: 9pt; color: #334155;">${row.materi}</td>
        <td style="border: 1pt solid #000000; padding: 6pt; text-align: center; vertical-align: top; font-weight: bold; font-size: 9.5pt; white-space: nowrap;">${row.alokasiWaktu}</td>
        <td style="border: 1pt solid #000000; padding: 6pt; text-align: center; vertical-align: top; font-weight: 600; font-size: 9pt; white-space: nowrap;">${row.semester}</td>
        <td style="border: 1pt solid #000000; padding: 6pt; vertical-align: top; font-size: 8.5pt; color: #475569;">${row.keterangan || '-'}</td>
      </tr>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <!-- HEADER RESMI KEMENTERIAN / SEKOLAH -->
      <div style="text-align: center; margin-bottom: 12pt; border-bottom: 2pt solid #000000; padding-bottom: 8pt;">
        <h2 style="font-size: 14pt; font-weight: bold; margin: 0 0 4pt 0; text-transform: uppercase; letter-spacing: 0.5pt; font-family: 'Times New Roman', serif;">
          ${prota.identitas.namaSekolah ? prota.identitas.namaSekolah.toUpperCase() : 'PEMERINTAH DAERAH DINAS PENDIDIKAN'}
        </h2>
        <h1 style="font-size: 13pt; font-weight: bold; margin: 0 0 4pt 0; text-transform: uppercase; color: #000000; font-family: 'Times New Roman', serif;">
          PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA
        </h1>
        <p style="font-size: 10pt; font-weight: bold; margin: 0; text-transform: uppercase; font-family: 'Times New Roman', serif;">
          TAHUN PELAJARAN ${prota.identitas.tahunPelajaran}
        </p>
      </div>

      <!-- TABEL IDENTITAS SEKOLAH -->
      <table border="0" cellspacing="0" cellpadding="3" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 9.5pt; margin-bottom: 12pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; padding: 2pt 4pt;">Satuan Pendidikan</td>
          <td style="width: 30%; padding: 2pt 4pt;">: ${prota.identitas.namaSekolah || 'SD Negeri Kalimantong'}</td>
          <td style="width: 22%; font-weight: bold; padding: 2pt 4pt;">Beban Belajar per Pekan</td>
          <td style="width: 28%; padding: 2pt 4pt;">: ${prota.identitas.alokasiWaktuTiapMinggu || '4 JP / Pekan'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 2pt 4pt;">Mata Pelajaran</td>
          <td style="padding: 2pt 4pt;">: ${prota.identitas.mataPelajaran}</td>
          <td style="font-weight: bold; padding: 2pt 4pt;">Pekan Efektif Smt 1 / 2</td>
          <td style="padding: 2pt 4pt;">: ${prota.identitas.semester1Weeks || '19'} Pekan / ${prota.identitas.semester2Weeks || '17'} Pekan</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 2pt 4pt;">Kelas / Fase</td>
          <td style="padding: 2pt 4pt;">: Kelas ${prota.identitas.kelas} / Fase ${prota.identitas.fase}</td>
          <td style="font-weight: bold; padding: 2pt 4pt;">Total Target Alokasi JP</td>
          <td style="padding: 2pt 4pt;">: <strong>${prota.identitas.totalJp2Semester || displayTahunan + ' JP'}</strong></td>
        </tr>
      </table>
    </div>

    <div data-f4-section="Bagian 1: Tabel Program Tahunan (PROTA) & Pengesahan" data-f4-orientation="landscape">
    <!-- TABEL UTAMA PROTA SIAP CETAK -->
    <table border="1" cellspacing="0" cellpadding="5" bordercolor="#000000" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 9.5pt; margin-bottom: 14pt; border: 1pt solid #000000; mso-table-layout-alt: fixed;">
      <thead>
        <tr style="background-color: #e2e8f0; font-weight: bold; text-align: center; mso-yfti-row-cant-split: cantSplit;">
          <th style="border: 1pt solid #000000; padding: 6pt; width: 6%; font-size: 9.5pt;">NO</th>
          <th style="border: 1pt solid #000000; padding: 6pt; width: 22%; font-size: 9.5pt;">BAB / UNIT & ELEMEN CP</th>
          <th style="border: 1pt solid #000000; padding: 6pt; width: 34%; font-size: 9.5pt;">TUJUAN PEMBELAJARAN (TP)</th>
          <th style="border: 1pt solid #000000; padding: 6pt; width: 16%; font-size: 9.5pt;">LINGKUP MATERI</th>
          <th style="border: 1pt solid #000000; padding: 6pt; width: 7%; font-size: 9.5pt;">ALOKASI WAKTU</th>
          <th style="border: 1pt solid #000000; padding: 6pt; width: 8%; font-size: 9.5pt;">SEMESTER</th>
          <th style="border: 1pt solid #000000; padding: 6pt; width: 7%; font-size: 9.5pt;">KET.</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <!-- BARIS REKAPITULASI TOTAL ALOKASI WAKTU -->
        <tr style="background-color: #f1f5f9; font-weight: bold; mso-yfti-row-cant-split: cantSplit;">
          <td colspan="4" style="border: 1pt solid #000000; padding: 6pt; text-align: right; font-size: 9.5pt;">
            TOTAL ALOKASI WAKTU SEMESTER 1 (GANJIL)
          </td>
          <td colspan="3" style="border: 1pt solid #000000; padding: 6pt; text-align: center; font-size: 9.5pt; color: #1e3a8a;">
            ${displaySmt1} Jam Pelajaran (JP)
          </td>
        </tr>
        <tr style="background-color: #f1f5f9; font-weight: bold; mso-yfti-row-cant-split: cantSplit;">
          <td colspan="4" style="border: 1pt solid #000000; padding: 6pt; text-align: right; font-size: 9.5pt;">
            TOTAL ALOKASI WAKTU SEMESTER 2 (GENAP)
          </td>
          <td colspan="3" style="border: 1pt solid #000000; padding: 6pt; text-align: center; font-size: 9.5pt; color: #1e3a8a;">
            ${displaySmt2} Jam Pelajaran (JP)
          </td>
        </tr>
        <tr style="background-color: #cbd5e1; font-weight: bold; mso-yfti-row-cant-split: cantSplit;">
          <td colspan="4" style="border: 1pt solid #000000; padding: 6pt; text-align: right; font-size: 10pt;">
            TOTAL ALOKASI WAKTU TAHUNAN (SEMESTER 1 + SEMESTER 2)
          </td>
          <td colspan="3" style="border: 1pt solid #000000; padding: 6pt; text-align: center; font-size: 10pt; color: #0f172a;">
            ${displayTahunan} Jam Pelajaran (JP)
          </td>
        </tr>
      </tbody>
    </table>

    ${prota.catatan ? `
    <div style="margin-bottom: 16pt; font-family: 'Times New Roman', serif; font-size: 9pt; color: #334155; font-style: italic;">
      <strong>Catatan Khusus:</strong> ${prota.catatan}
    </div>` : ''}

    <!-- TANDA TANGAN PENGESAHAN DOKUMEN -->
    <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-top: 24pt; font-family: 'Times New Roman', serif; font-size: 10pt; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10pt;">
          <p style="margin: 0;">Mengetahui,</p>
          <p style="margin: 2pt 0 0 0; font-weight: bold;">Kepala ${prota.identitas.namaSekolah || 'Sekolah Dasar'}</p>
          <div style="height: 55pt;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            ${prota.identitas.kepalaSekolah || prota.kepalaSekolah || 'BUDI SANTOSO, S.Pd., M.M.'}
          </p>
          <p style="margin: 2pt 0 0 0; font-size: 9pt; color: #000000;">
            NIP. ${prota.identitas.nipKepsek || '19750812 199903 1 002'}
          </p>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10pt;">
          <p style="margin: 0;">
            ${prota.identitas.kota || 'Jakarta'}, ${prota.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p style="margin: 2pt 0 0 0; font-weight: bold;">Guru Mata Pelajaran PJOK</p>
          <div style="height: 55pt;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            ${prota.identitas.guruMapel || prota.guruMapel || 'AHMAD FAUZI, S.Pd.'}
          </p>
          <p style="margin: 2pt 0 0 0; font-size: 9pt; color: #000000;">
            NIP. ${prota.identitas.nipGuru || '19880415 201502 1 003'}
          </p>
        </td>
      </tr>
    </table>
    </div>
  `;

  return wrapWithLandscapeDocShell(`PROTA_${prota.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${prota.identitas.kelas}`, content);
}

/**
 * Utility to wrap HTML content into an F4 Landscape (330mm x 215mm) Microsoft Word compatible format
 */
export function wrapWithLandscapeDocShell(title: string, contentHtml: string): string {
  return formatHtmlForF4WordDoc(contentHtml, title, 'landscape');
}

/**
 * Exports Program Semester (PROSEM) to Microsoft Word compatible format (Landscape)
 */
export function exportProsemToDoc(prosem: ProsemData): string {
  function buildSemesterTable(semesterName: string, semesterData: any) {
    let totalJpSemester = 0;
    let totalPekanEfektif = 0;

    semesterData.monthsHeader.forEach((m: any) => {
      totalPekanEfektif += (m.totalWeeks - (m.nonEffectiveWeeks ? m.nonEffectiveWeeks.length : 0));
    });

    const monthsHeaderHtml = semesterData.monthsHeader.map((m: any) => {
      return `<th colspan="${m.totalWeeks}" style="border: 1pt solid #000000; padding: 4pt; background-color: #e2e8f0; text-align: center; font-weight: bold; font-size: 8.5pt;">${m.monthName.toUpperCase()}</th>`;
    }).join('\n');

    const weeksHeaderHtml = semesterData.monthsHeader.map((m: any) => {
      let weekCells = '';
      for (let w = 1; w <= m.totalWeeks; w++) {
        const isNonEffective = m.nonEffectiveWeeks && m.nonEffectiveWeeks.includes(w);
        const cellStyle = isNonEffective 
          ? 'border: 1pt solid #000000; padding: 3pt; background-color: #cbd5e1; text-align: center; font-size: 8pt; font-weight: bold; color: #475569;'
          : 'border: 1pt solid #000000; padding: 3pt; background-color: #f8fafc; text-align: center; font-size: 8pt; font-weight: bold; color: #0f172a;';
        weekCells += `<th style="${cellStyle}">${w}</th>`;
      }
      return weekCells;
    }).join('\n');

    const rowsHtml = semesterData.rows.map((row: any, rIdx: number) => {
      const match = row.alokasiWaktu.match(/(\d+)\s*JP/i) || row.alokasiWaktu.match(/^(\d+)/);
      if (match) {
        totalJpSemester += parseInt(match[1], 10);
      }

      const weekValueCells = row.months.map((m: any) => {
        const headerMonth = semesterData.monthsHeader.find((h: any) => h.monthName === m.monthName);
        return m.weeks.map((w: any) => {
          const isNonEffectiveHeader = headerMonth ? headerMonth.nonEffectiveWeeks.includes(w.weekNum) : !w.isEffective;
          
          let cellColor = '#ffffff';
          let cellText = w.value || '';
          
          if (isNonEffectiveHeader || !w.isEffective) {
            cellColor = '#f1f5f9';
            if (w.value && (w.value.includes('L') || w.value.toLowerCase().includes('libur'))) {
              cellColor = '#fef08a'; // yellow
            } else if (w.value && (w.value.includes('MPLS') || w.value.toLowerCase().includes('asesmen') || w.value.includes('PTS') || w.value.includes('PAS') || w.value.includes('PAT') || w.value.includes('STS') || w.value.includes('SAS') || w.value.includes('SAT'))) {
              cellColor = '#bfdbfe'; // blue
            }
          } else if (w.value) {
            cellColor = '#ecfdf5'; // light emerald for scheduled lesson
          }
          
          return `<td style="border: 1pt solid #000000; padding: 3pt; text-align: center; background-color: ${cellColor}; font-weight: bold; font-size: 8pt; mso-number-format:'\\@'; min-width: 14pt;">${cellText}</td>`;
        }).join('\n');
      }).join('\n');

      const isEven = rIdx % 2 === 0;
      const rowBg = isEven ? '#ffffff' : '#fcfcfc';

      return `
        <tr style="page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit; background-color: ${rowBg};">
          <td style="border: 1pt solid #000000; padding: 4pt; text-align: center; font-weight: bold; font-size: 8pt;">${row.no}</td>
          <td style="border: 1pt solid #000000; padding: 4pt; font-weight: bold; font-size: 8pt; color: #0f172a;">${row.bab}</td>
          <td style="border: 1pt solid #000000; padding: 4pt; font-size: 8pt; line-height: 1.25;">${row.topik}</td>
          <td style="border: 1pt solid #000000; padding: 4pt; text-align: center; font-size: 8pt; font-family: monospace;">${row.pertemuanKe}</td>
          <td style="border: 1pt solid #000000; padding: 4pt; text-align: center; font-weight: bold; color: #1e3a8a; font-size: 8pt; white-space: nowrap;">${row.alokasiWaktu}</td>
          ${weekValueCells}
        </tr>
      `;
    }).join('\n');

    // Total week columns count
    const totalWeeksCols = semesterData.monthsHeader.reduce((acc: number, m: any) => acc + m.totalWeeks, 0);

    return `
      <div style="margin-top: 14pt; margin-bottom: 6pt;">
        <h3 style="font-size: 11pt; font-weight: bold; color: #0f172a; margin: 0 0 4pt 0; text-transform: uppercase; font-family: 'Times New Roman', serif;">
          DISTRIBUSI WAKTU SEMESTER ${semesterName.toUpperCase()}
        </h3>
      </div>
      <table border="1" cellspacing="0" cellpadding="3" bordercolor="#000000" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 8pt; margin-bottom: 16pt; border: 1pt solid #000000; mso-table-layout-alt: fixed;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; text-align: center; font-weight: bold; mso-yfti-row-cant-split: cantSplit;">
            <th rowspan="2" style="border: 1pt solid #000000; padding: 4pt; width: 4%; font-size: 8pt;">NO</th>
            <th rowspan="2" style="border: 1pt solid #000000; padding: 4pt; width: 14%; font-size: 8pt;">UNIT / BAB</th>
            <th rowspan="2" style="border: 1pt solid #000000; padding: 4pt; width: 22%; font-size: 8pt;">TOPIK / MATERI PEMBELAJARAN</th>
            <th rowspan="2" style="border: 1pt solid #000000; padding: 4pt; width: 5%; font-size: 8pt;">PERT.</th>
            <th rowspan="2" style="border: 1pt solid #000000; padding: 4pt; width: 5%; font-size: 8pt;">ALOKASI</th>
            ${monthsHeaderHtml}
          </tr>
          <tr style="mso-yfti-row-cant-split: cantSplit;">
            ${weeksHeaderHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <!-- BARIS TOTAL JP SEMESTER -->
          <tr style="background-color: #e2e8f0; font-weight: bold; mso-yfti-row-cant-split: cantSplit;">
            <td colspan="4" style="border: 1pt solid #000000; padding: 5pt; text-align: right; font-size: 8.5pt;">
              TOTAL ALOKASI JAM PELAJARAN (JP) TERJADWAL
            </td>
            <td style="border: 1pt solid #000000; padding: 5pt; text-align: center; font-size: 8.5pt; color: #1e3a8a;">
              ${totalJpSemester} JP
            </td>
            <td colspan="${totalWeeksCols}" style="border: 1pt solid #000000; padding: 5pt; text-align: left; font-size: 8pt; color: #334155;">
              Beban mengajar ${totalPekanEfektif} pekan efektif (Rata-rata ${prosem.identitas.alokasiWaktuTiapMinggu || '4 JP'} per pekan)
            </td>
          </tr>
        </tbody>
      </table>
    `;
  }

  const content = `
    <div data-f4-kop="true">
      <!-- KOP DOKUMEN RESMI -->
      <div style="text-align: center; margin-bottom: 12pt; border-bottom: 2pt solid #000000; padding-bottom: 6pt;">
        <h2 style="font-size: 13pt; font-weight: bold; margin: 0 0 3pt 0; text-transform: uppercase; font-family: 'Times New Roman', serif;">
          ${prosem.identitas.namaSekolah ? prosem.identitas.namaSekolah.toUpperCase() : 'PEMERINTAH DAERAH DINAS PENDIDIKAN'}
        </h2>
        <h1 style="font-size: 13pt; font-weight: bold; margin: 0 0 3pt 0; text-transform: uppercase; font-family: 'Times New Roman', serif;">
          PROGRAM SEMESTER (PROSEM) KURIKULUM MERDEKA
        </h1>
        <p style="font-size: 10pt; font-weight: bold; margin: 0; text-transform: uppercase; font-family: 'Times New Roman', serif;">
          TAHUN PELAJARAN ${prosem.identitas.tahunPelajaran}
        </p>
      </div>

      <!-- TABEL IDENTITAS -->
      <table border="0" cellspacing="0" cellpadding="2" style="width: 100%; border-collapse: collapse; font-family: 'Times New Roman', serif; font-size: 9pt; margin-bottom: 10pt;">
        <tr>
          <td style="width: 20%; font-weight: bold; padding: 2pt 4pt;">Satuan Pendidikan</td>
          <td style="width: 30%; padding: 2pt 4pt;">: ${prosem.identitas.namaSekolah || 'SD Negeri Kalimantong'}</td>
          <td style="width: 22%; font-weight: bold; padding: 2pt 4pt;">Alokasi per Pekan</td>
          <td style="width: 28%; padding: 2pt 4pt;">: ${prosem.identitas.alokasiWaktuTiapMinggu || '4 JP / Pekan'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 2pt 4pt;">Mata Pelajaran</td>
          <td style="padding: 2pt 4pt;">: ${prosem.identitas.mataPelajaran}</td>
          <td style="font-weight: bold; padding: 2pt 4pt;">Tahun Pelajaran</td>
          <td style="padding: 2pt 4pt;">: ${prosem.identitas.tahunPelajaran}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 2pt 4pt;">Kelas / Fase</td>
          <td style="padding: 2pt 4pt;">: Kelas ${prosem.identitas.kelas} / Fase ${prosem.identitas.fase}</td>
          <td style="font-weight: bold; padding: 2pt 4pt;">Status Kurikulum</td>
          <td style="padding: 2pt 4pt;">: Kurikulum Merdeka (Keputusan Kepala BSKAP Nomor 046/H/KR/2025)</td>
        </tr>
      </table>
    </div>

    <div data-f4-section="Bagian 1: Distribusi Waktu Semester Ganjil (Semester I)" data-f4-orientation="landscape">
      ${buildSemesterTable('Ganjil (Semester I)', prosem.ganjil)}
    </div>

    <div data-f4-section="Bagian 2: Distribusi Waktu Semester Genap (Semester II) & Pengesahan" data-f4-orientation="landscape">
      ${buildSemesterTable('Genap (Semester II)', prosem.genap)}

    <!-- KETERANGAN AGENDA -->
    <div style="margin-top: 12pt; border: 1pt solid #000000; padding: 8pt; background-color: #f8fafc; font-family: 'Times New Roman', serif; font-size: 8.5pt;">
      <strong>Keterangan Simbol & Catatan Agenda Khusus:</strong>
      <p style="margin: 4pt 0 0 0; line-height: 1.35; white-space: pre-wrap;">${prosem.keterangan || 'Angka 4 = Alokasi 4 JP pada pekan efektif KBM.\nSTS = Sumatif Tengah Semester.\nSAS / SAT = Sumatif Akhir Semester / Akhir Tahun.\nL = Libur Semester / Libur Hari Besar Nasional.'}</p>
    </div>

    <!-- TANDA TANGAN PENGESAHAN DOKUMEN -->
    <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-top: 24pt; font-family: 'Times New Roman', serif; font-size: 9.5pt; page-break-inside: avoid; mso-yfti-row-cant-split: cantSplit;">
      <tr>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10pt;">
          <p style="margin: 0;">Mengetahui,</p>
          <p style="margin: 2pt 0 0 0; font-weight: bold;">Kepala ${prosem.identitas.namaSekolah || 'Sekolah Dasar'}</p>
          <div style="height: 50pt;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            ${prosem.identitas.kepalaSekolah || prosem.kepalaSekolah || 'BUDI SANTOSO, S.Pd., M.M.'}
          </p>
          <p style="margin: 2pt 0 0 0; font-size: 8.5pt; color: #000000;">
            NIP. ${prosem.identitas.nipKepsek || '19750812 199903 1 002'}
          </p>
        </td>
        <td style="width: 50%; text-align: center; vertical-align: top; padding: 0 10pt;">
          <p style="margin: 0;">
            ${prosem.identitas.kota || 'Jakarta'}, ${prosem.tanggalDokumen || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p style="margin: 2pt 0 0 0; font-weight: bold;">Guru Mata Pelajaran PJOK</p>
          <div style="height: 50pt;"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">
            ${prosem.identitas.guruMapel || prosem.guruMapel || 'AHMAD FAUZI, S.Pd.'}
          </p>
          <p style="margin: 2pt 0 0 0; font-size: 8.5pt; color: #000000;">
            NIP. ${prosem.identitas.nipGuru || '19880415 201502 1 003'}
          </p>
        </td>
      </tr>
    </table>
    </div>
  `;

  return wrapWithLandscapeDocShell(`PROSEM_${prosem.identitas.mataPelajaran.replace(/\s+/g, '_')}_Kelas${prosem.identitas.kelas}`, content);
}

/**
 * Exports Slide Presentation to Microsoft Word compatible format (Landscape)
 */
export function exportSlidesToDoc(data: SlidePresentationData): string {
  const slidesHtml = data.slides.map((slide) => {
    const pointsHtml = slide.points.map(p => `<li style="margin-bottom: 6px;">${p}</li>`).join('\n');
    return `
      <div class="slide-container" data-f4-section="Slide ${slide.slideNo}: ${slide.title}" data-f4-orientation="landscape" style="border: 2px solid #1e293b; border-radius: 8px; padding: 20px; background-color: #ffffff; margin-bottom: 25px; page-break-after: always; min-height: 400px; font-family: 'Arial', sans-serif;">
        <!-- Slide Header -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          <tr>
            <td style="border: none; padding: 0; text-align: left;">
              <span style="font-size: 10.5pt; font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">SLIDE ${slide.slideNo} dari ${data.identitas.jumlahSlide}</span>
              <span style="font-size: 9pt; color: #475569; margin-left: 10px; background-color: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: bold;">
                Topik / Materi: ${data.identitas.topikMateri}
              </span>
            </td>
            <td style="border: none; padding: 0; text-align: right;">
              <span style="font-size: 8.5pt; font-weight: bold; color: #475569; background-color: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">${slide.layoutType}</span>
            </td>
          </tr>
        </table>

        <!-- Slide Title -->
        <h2 style="font-size: 17pt; font-weight: bold; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-top: 0; margin-bottom: 15px;">
          ${slide.title}
        </h2>

        <!-- Slide Content Area (2 Columns in Landscape) -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 15px;">
          <tr>
            <!-- Left Side: Content Points -->
            <td style="border: none; width: 60%; vertical-align: top; padding-right: 15px;">
              <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px; border-radius: 4px; min-height: 180px;">
                <p style="font-size: 9.5pt; font-weight: bold; color: #475569; margin-top: 0; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Teks Slide / Poin Inti:</p>
                <ul style="font-size: 10.5pt; color: #0f172a; line-height: 1.5; margin-top: 0; padding-left: 20px;">
                  ${pointsHtml}
                </ul>
              </div>
            </td>

            <!-- Right Side: Visual Recommendations -->
            <td style="border: none; width: 40%; vertical-align: top;">
              <div style="background-color: #fdf2f8; border: 1px dashed #db2777; padding: 14px; border-radius: 6px; min-height: 180px;">
                <p style="font-size: 9.5pt; font-weight: bold; color: #be185d; margin-top: 0; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">💡 Desain Visual & Media:</p>
                <p style="font-size: 9pt; color: #334155; line-height: 1.45; margin: 0; font-style: italic;">
                  ${slide.visualRecommendation}
                </p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Speaker Notes Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; margin-top: 10px;">
          <p style="font-size: 9.5pt; font-weight: bold; color: #15803d; margin-top: 0; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">🎤 Catatan Suara / Panduan Guru:</p>
          <p style="font-size: 9.5pt; color: #1e293b; line-height: 1.45; margin: 0;">
            "${slide.speakerNotes}"
          </p>
        </div>
      </div>
    `;
  }).join('\n');

  const content = `
    <div data-f4-kop="true">
      <h1 style="text-align: center; margin-bottom: 5px; color: #1e3b8b;">RANCANGAN SLIDE PRESENTASI PPT</h1>
      <p style="text-align: center; font-size: 11pt; font-weight: bold; color: #1e293b; margin-top: 0; margin-bottom: 20px; text-transform: uppercase;">
        TOPIK MATERI: ${data.identitas.topikMateri}
      </p>

      <div class="info-box" style="margin-bottom: 25px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background-color: #f8fafc;">
        <table class="info-grid" style="width: 100%; border-collapse: collapse; font-size: 9.5pt; border: none;">
          <tr>
            <td style="padding: 4px; border: none;" width="50%"><strong>Mata Pelajaran:</strong> ${data.identitas.mataPelajaran}</td>
            <td style="padding: 4px; border: none;" width="50%"><strong>Kelas / Fase:</strong> Kelas ${data.identitas.kelas} / Fase ${data.identitas.fase}</td>
          </tr>
          <tr>
            <td style="padding: 4px; border: none;"><strong>Gaya Desain PPT:</strong> ${data.identitas.gayaDesain}</td>
            <td style="padding: 4px; border: none;"><strong>Jumlah Slide:</strong> ${data.identitas.jumlahSlide} Slide</td>
          </tr>
          <tr>
            <td style="padding: 4px; border: none;"><strong>Penyusun:</strong> ${data.identitas.guruPenyusun || 'Guru Kelas'}</td>
            <td style="padding: 4px; border: none;"><strong>Tanggal Dokumen:</strong> ${data.identitas.tanggalDokumen}</td>
          </tr>
        </table>
      </div>
    </div>

    ${slidesHtml}
  `;

  return wrapWithLandscapeDocShell(`PPT_${data.identitas.topikMateri.replace(/\s+/g, '_')}`, content);
}

/**
 * Exports Interactive LKPD to Microsoft Word compatible format (Portrait, A4)
 */
export function exportLkpdToDoc(data: InteractiveLkpdData): string {
  const sectionsHtml = data.sections.map((section, idx) => {
    const blocksHtml = section.contentBlocks.map((block) => {
      if (block.blockType === 'text') {
        return `
          <p style="font-size: 10.5pt; color: #334155; line-height: 1.6; margin-bottom: 12px;">
            ${block.exactText || ''}
          </p>
        `;
      }

      if (block.blockType === 'highlight') {
        return `
          <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
            <p style="font-size: 10pt; font-weight: bold; color: #92400e; margin: 0 0 4px 0;">💡 PENTING / CATATAN UTAMA:</p>
            <p style="font-size: 10pt; color: #78350f; margin: 0; font-style: italic; line-height: 1.5;">
              ${block.exactText || ''}
            </p>
          </div>
        `;
      }

      if (block.blockType === 'question' && block.questionData) {
        const q = block.questionData;
        let boxStyle = 'border: 2px solid #cbd5e1; border-radius: 6px; min-height: 80px; padding: 10px;';
        if (q.answerBoxStyle === 'dotted_box') {
          boxStyle = 'border: 2px dashed #6366f1; border-radius: 6px; min-height: 80px; padding: 10px; background-color: #f8fafc;';
        } else if (q.answerBoxStyle === 'speech_bubble') {
          boxStyle = 'border: 1px solid #e2e8f0; border-radius: 12px; min-height: 80px; padding: 12px; background-color: #f0fdf4; border-left: 5px solid #10b981;';
        } else if (q.answerBoxStyle === 'ruled_lines') {
          boxStyle = 'border-bottom: 1px solid #cbd5e1; min-height: 80px; line-height: 24px; background-image: linear-gradient(rgba(0,0,0,0) 23px, #cbd5e1 24px); background-size: 100% 24px; padding: 4px;';
        }

        return `
          <div style="margin-bottom: 18px;">
            <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 6px;">
              <tr>
                <td style="border: none; padding: 0; font-size: 11pt; font-weight: bold; color: #1e293b;">
                  📝 ${q.questionText}
                </td>
                ${q.score ? `
                <td style="border: none; padding: 0; text-align: right; width: 80px;">
                  <span style="font-size: 8.5pt; font-weight: bold; background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">Skor: ${q.score}</span>
                </td>
                ` : ''}
              </tr>
            </table>
            <div style="${boxStyle}">
              <p style="font-size: 9pt; color: #94a3b8; margin: 0; font-style: italic;">
                ${q.placeholderText || 'Tuliskan jawaban rapi anak-anak di sini...'}
              </p>
            </div>
          </div>
        `;
      }

      if (block.blockType === 'table' && block.tableData) {
        const tbl = block.tableData;
        const headersHtml = tbl.headers.map(h => `<th style="background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; font-size: 9.5pt; color: #1e293b; text-align: left;">${h}</th>`).join('');
        const rowsHtml = tbl.rows.map(row => {
          const cellsHtml = row.map(cell => `<td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 9.5pt; color: #334155; vertical-align: top;">${cell}</td>`).join('');
          return `<tr>${cellsHtml}</tr>`;
        }).join('\n');

        return `
          <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 15px;">
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        `;
      }

      if (block.blockType === 'matching' && block.matchingData) {
        const mat = block.matchingData;
        const pairsHtml = mat.pairs.map((pair, pIdx) => {
          return `
            <tr>
              <td style="border: 1px solid #e2e8f0; padding: 10px; font-size: 10pt; width: 45%; vertical-align: middle; background-color: #fafafa;">
                <strong>${pIdx + 1}.</strong> ${pair.leftItem}
              </td>
              <td style="border: none; width: 10%; text-align: center; font-size: 14pt; color: #94a3b8; vertical-align: middle;">
                &bull; &mdash;&mdash;&mdash;&gt; &bull;
              </td>
              <td style="border: 1px solid #e2e8f0; padding: 10px; font-size: 10pt; width: 45%; vertical-align: middle; background-color: #fafafa;">
                ${pair.rightItem}
              </td>
            </tr>
          `;
        }).join('\n');

        return `
          <div style="margin-bottom: 18px; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; background-color: #f8fafc;">
            <p style="font-size: 10pt; font-weight: bold; color: #4338ca; margin-top: 0; margin-bottom: 8px;">
              🔗 Tarik Garis Penghubung (Aktivitas Mencocokkan):
            </p>
            <table style="width: 100%; border-collapse: collapse; border: none;">
              <thead>
                <tr>
                  <th style="border: none; padding: 4px; text-align: left; font-size: 9.5pt; color: #475569;">${mat.leftLabel || 'Kolom A'}</th>
                  <th style="border: none; padding: 4px; width: 10%;"></th>
                  <th style="border: none; padding: 4px; text-align: left; font-size: 9.5pt; color: #475569;">${mat.rightLabel || 'Kolom B'}</th>
                </tr>
              </thead>
              <tbody>
                ${pairsHtml}
              </tbody>
            </table>
          </div>
        `;
      }

      if (block.blockType === 'pjokVisual' || block.visualType || block.illustrationPrompt) {
        const vType = block.visualType || detectPjokVisualType(block.illustrationPrompt || block.exactText || data.identitas.topikMateri);
        return getPjokDiagramHtml(vType, block.visualCaption || block.illustrationPrompt, data.identitas.sekolah || 'SD Negeri Kalimantong');
      }

      return '';
    }).join('\n');

    return `
      <div data-f4-section="Bagian ${idx + 1}: ${section.sectionTitle}" style="margin-bottom: 25px; page-break-inside: avoid;">
        <h3 style="font-size: 12pt; font-weight: bold; color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 15px; margin-bottom: 12px; text-transform: uppercase;">
          ${section.icon} ${section.sectionTitle}
        </h3>
        ${section.introText ? `<p style="font-size: 10.5pt; color: #475569; font-style: italic; margin-bottom: 10px;">${section.introText}</p>` : ''}
        ${blocksHtml}
        ${section.visualDesignTip ? `<p style="font-size: 8.5pt; color: #64748b; margin-top: 4px; font-family: monospace;">📌 <i>Saran Desain: ${section.visualDesignTip}</i></p>` : ''}
      </div>
    `;
  }).join('\n');

  let reflectionHtml = '';
  if (data.selfReflectionChecklist && data.selfReflectionChecklist.length > 0) {
    const listItems = data.selfReflectionChecklist.map(item => {
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="border: none; padding: 6px; font-size: 9.5pt; color: #334155;">${item}</td>
          <td style="border: none; padding: 6px; text-align: center; width: 40px; font-size: 11pt; color: #cbd5e1;">[ &nbsp; ]</td>
          <td style="border: none; padding: 6px; text-align: center; width: 40px; font-size: 11pt; color: #cbd5e1;">[ &nbsp; ]</td>
        </tr>
      `;
    }).join('\n');

    reflectionHtml = `
      <div data-f4-section="Bagian Refleksi Mandiri Siswa" style="margin-top: 30px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; page-break-inside: avoid;">
        <h3 style="font-size: 11pt; font-weight: bold; color: #15803d; margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px;">
          🎯 REFLEKSI MANDIRI SISWA
        </h3>
        <p style="font-size: 9pt; color: #166534; margin-bottom: 10px;">Centanglah (v) pada kolom yang paling menggambarkan perasaanmu setelah menyelesaikan lembar kerja ini!</p>
        <table style="width: 100%; border-collapse: collapse; border: none;">
          <thead>
            <tr style="border-bottom: 2px solid #bbf7d0;">
              <th style="border: none; padding: 6px; text-align: left; font-size: 9.5pt; color: #15803d; font-weight: bold;">Pernyataan Refleksi</th>
              <th style="border: none; padding: 6px; text-align: center; width: 40px; font-size: 9.5pt; color: #15803d; font-weight: bold;">Ya</th>
              <th style="border: none; padding: 6px; text-align: center; width: 40px; font-size: 9.5pt; color: #15803d; font-weight: bold;">Tidak</th>
            </tr>
          </thead>
          <tbody>
            ${listItems}
          </tbody>
        </table>
      </div>
    `;
  }

  const content = `
    <div style="border: 4px double #4f46e5; border-radius: 10px; padding: 25px; background-color: #ffffff; font-family: 'Arial', sans-serif;">
      
      <div data-f4-kop="true">
        <!-- LKPD MAIN HEADER -->
        <table style="width: 100%; border-collapse: collapse; border: none; margin-bottom: 20px;">
          <tr>
            <td style="border: none; padding: 0; vertical-align: middle;">
              <h1 style="text-align: left; margin: 0; font-size: 20pt; color: #1e3a8a; border: none; padding: 0; text-transform: uppercase; font-family: 'Arial Black', sans-serif;">
                LEMBAR KERJA PESERTA DIDIK
              </h1>
              <p style="font-size: 12pt; font-weight: bold; color: #4f46e5; margin: 4px 0 0 0; text-transform: uppercase;">
                ${data.judulMenarik}
              </p>
            </td>
            <td style="border: none; padding: 0; text-align: right; vertical-align: middle; width: 120px;">
              <div style="border: 2px solid #4f46e5; border-radius: 8px; padding: 8px; text-align: center; background-color: #f5f3ff;">
                <span style="font-size: 9pt; font-weight: bold; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px;">UKURAN</span><br/>
                <strong style="font-size: 12pt; color: #1e1b4b;">F4 PORTRAIT</strong>
              </div>
            </td>
          </tr>
        </table>

        <!-- IDENTITAS PANEL -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 25px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; border: none;">
            <tr>
              <td style="padding: 4px; border: none;" width="50%"><strong>Mata Pelajaran:</strong> ${data.identitas.mataPelajaran}</td>
              <td style="padding: 4px; border: none;" width="50%"><strong>Sekolah:</strong> ${data.identitas.sekolah || 'Sekolah Dasar'}</td>
            </tr>
            <tr>
              <td style="padding: 4px; border: none;"><strong>Kelas:</strong> Kelas ${data.identitas.kelas}</td>
              <td style="padding: 4px; border: none;"><strong>Materi Pembelajaran:</strong> ${data.identitas.topikMateri}</td>
            </tr>
            <tr>
              <td style="padding: 4px; border: none;"><strong>Guru Pengampu:</strong> ${data.identitas.guruPenyusun || 'Guru Kelas'}</td>
              <td style="padding: 4px; border: none;"><strong>Tanggal Terbit:</strong> ${data.identitas.tanggalDokumen}</td>
            </tr>
          </table>
        </div>

        <!-- STUDENT NAME & SCORE HEADER -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="border: 1px solid #94a3b8; background-color: #f8fafc; padding: 10px; border-radius: 6px 0 0 6px; width: 65%;">
              <strong style="font-size: 9pt; color: #475569; text-transform: uppercase;">Nama Lengkap Siswa:</strong>
              <div style="border-bottom: 1px dashed #94a3b8; margin-top: 15px; font-size: 11pt; color: #cbd5e1;">&nbsp;</div>
            </td>
            <td style="border: 1px solid #94a3b8; background-color: #f8fafc; padding: 10px; border-radius: 0 6px 6px 0; width: 35%; text-align: center;">
              <strong style="font-size: 9pt; color: #475569; text-transform: uppercase;">NILAI AKHIR:</strong>
              <div style="font-size: 18pt; font-weight: bold; color: #4f46e5; margin-top: 4px;">______ / 100</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- LKPD MAIN SECTIONS -->
      ${sectionsHtml}

      <!-- REFLECTION AND SELF EVALUATION -->
      ${reflectionHtml}

      <!-- FOOTER BANNER -->
      ${data.penutupMotivasi ? `
      <div style="margin-top: 30px; text-align: center; border-top: 1px dashed #cbd5e1; pt-15px;">
        <p style="font-size: 11pt; font-weight: bold; color: #4f46e5; margin-bottom: 2px;">
          ⭐ ${data.penutupMotivasi} ⭐
        </p>
        <p style="font-size: 8.5pt; color: #94a3b8; margin-top: 0;">Teruslah Belajar dengan Ceria & Kreatif! Kita Semua Adalah Juara!</p>
      </div>
      ` : ''}

    </div>
  `;

  return wrapWithDocShell(`LKPD_${data.identitas.topikMateri.replace(/\s+/g, '_')}`, content);
}

/**
 * Exports CP ke TP Formulation Data to Word / Google Docs compatible HTML Document
 */
export function exportCpToTpToDoc(
  data: CpToTpResult,
  meta?: {
    namaSekolah?: string;
    namaGuru?: string;
    nipGuru?: string;
    kepalaSekolah?: string;
    nipKepsek?: string;
    tahunAjaran?: string;
    kota?: string;
  }
): string {
  const sekolah = meta?.namaSekolah || 'SD NEGERI KALIMANTONG';
  const guru = meta?.namaGuru || 'Guru PJOK';
  const nipG = meta?.nipGuru || '-';
  const kepsek = meta?.kepalaSekolah || 'Kepala Sekolah';
  const nipK = meta?.nipKepsek || '-';
  const thnAjar = meta?.tahunAjaran || '2026/2027';
  const kota = meta?.kota || 'Tempat';

  const tpRowsHtml = data.daftarTp.map((tp, idx) => `
    <tr>
      <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center; font-weight: bold; background-color: #f8fafc;">
        ${tp.kodeTp}
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 8px;">
        <strong style="color: #0f172a;">${tp.rumusanTp}</strong>
        ${Array.isArray(tp.indikatorKetercapaian) && tp.indikatorKetercapaian.length > 0 ? `
        <div style="margin-top: 6px; font-size: 9pt; color: #475569;">
          <strong>Indikator Ketercapaian (IKTP):</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0;">
            ${tp.indikatorKetercapaian.map(ind => `<li>${ind}</li>`).join('')}
          </ul>
        </div>` : ''}
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 9.5pt;">
        <div><strong>KKO:</strong> ${tp.kompetensiKko}</div>
        <div style="margin-top: 4px;"><strong>Materi:</strong> ${tp.lingkupMateri}</div>
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 9.5pt; text-align: center;">
        ${tp.targetKelasSemester}
        <div style="margin-top: 4px; font-size: 8.5pt; color: #059669; font-weight: bold;">${tp.alokasiWaktu}</div>
      </td>
      <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 9.5pt;">
        <div><strong>P3:</strong> ${tp.profilPancasila}</div>
        <div style="margin-top: 4px;"><strong>Asesmen:</strong> ${tp.rekomendasiAsesmen}</div>
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="width: 100%; margin: 0 auto;">
      <div data-f4-kop="true">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8pt; margin-bottom: 14pt;">
          <h3 style="margin: 0; font-size: 11pt; text-transform: uppercase; color: #475569;">${sekolah}</h3>
          <h1 style="margin: 4pt 0 0 0; font-size: 14pt; color: #0f172a;">
            FORMULASI PENYUSUNAN CP KE TUJUAN PEMBELAJARAN (TP)
          </h1>
          <p style="margin: 3pt 0 0 0; font-size: 9.5pt; color: #64748b; font-weight: bold;">
            MATA PELAJARAN PJOK &bull; KURIKULUM MERDEKA &bull; TAHUN AJARAN ${thnAjar}
          </p>
        </div>

        <!-- IDENTITAS CP -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16pt; background-color: #f8fafc; border: 1px solid #e2e8f0; font-size: 9.5pt;">
          <tr>
            <td style="padding: 6px 12px; width: 25%; font-weight: bold; color: #334155;">Fase / Kelas:</td>
            <td style="padding: 6px 12px; font-weight: bold; color: #0f172a;">${data.fase} (${data.kelas || 'Sesuai Fase'})</td>
          </tr>
          <tr>
            <td style="padding: 6px 12px; font-weight: bold; color: #334155;">Elemen PJOK:</td>
            <td style="padding: 6px 12px; font-weight: bold; color: #059669;">${data.elemen}</td>
          </tr>
          ${data.materiSpesifik ? `
          <tr>
            <td style="padding: 6px 12px; font-weight: bold; color: #334155;">Topik / Materi Spesifik:</td>
            <td style="padding: 6px 12px; color: #1e293b;">${data.materiSpesifik}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 6px 12px; vertical-align: top; font-weight: bold; color: #334155;">Teks Capaian Pembelajaran:</td>
            <td style="padding: 6px 12px; font-style: italic; color: #334155; line-height: 1.5; text-align: justify;">
              "${data.cpAsli}"
            </td>
          </tr>
        </table>
      </div>

      <div data-f4-section="Bagian 1: 1. Hasil Dekonstruksi CP (Kompetensi & Lingkup Materi)">
      <!-- HASIL DEKONSTRUKSI -->
      <h2 style="font-size: 11pt; color: #0f172a; border-left: 4px solid #059669; padding-left: 8px; margin-top: 14pt; margin-bottom: 8pt;">
        1. HASIL DEKONSTRUKSI CP (KOMPETENSI & LINGKUP MATERI)
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16pt; font-size: 9.5pt;">
        <tr style="background-color: #f1f5f9;">
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; width: 45%;">Kompetensi Utama (Kata Kerja Operasional)</th>
          <th style="border: 1px solid #cbd5e1; padding: 8px; text-align: left; width: 55%;">Lingkup Materi Pokok</th>
        </tr>
        <tr>
          <td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;">
            <ul style="margin: 0; padding-left: 18px; color: #1e293b;">
              ${(data.analisisDekonstruksi.kompetensiUtama || []).map(k => `<li>${k}</li>`).join('')}
            </ul>
          </td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; vertical-align: top;">
            <ul style="margin: 0; padding-left: 18px; color: #1e293b;">
              ${(data.analisisDekonstruksi.lingkupMateriUtama || []).map(m => `<li>${m}</li>`).join('')}
            </ul>
          </td>
        </tr>
        ${data.analisisDekonstruksi.variasiKarakteristikSiswa ? `
        <tr>
          <td colspan="2" style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; color: #475569; font-size: 9pt;">
            <strong>Catatan Karakteristik Peserta Didik:</strong> ${data.analisisDekonstruksi.variasiKarakteristikSiswa}
          </td>
        </tr>` : ''}
      </table>
      </div>

      <div data-f4-section="Bagian 2: 2. Rumusan Tujuan Pembelajaran (TP), Strategi & Pengesahan">
      <!-- DAFTAR RUMUSAN TP -->
      <h2 style="font-size: 11pt; color: #0f172a; border-left: 4px solid #059669; padding-left: 8px; margin-top: 14pt; margin-bottom: 8pt;">
        2. RUMUSAN TUJUAN PEMBELAJARAN (TP) TERSTRUKTUR
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16pt; font-size: 9.5pt;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff;">
            <th style="border: 1px solid #0f172a; padding: 8px; width: 10%; text-align: center;">Kode</th>
            <th style="border: 1px solid #0f172a; padding: 8px; width: 42%; text-align: left;">Rumusan Tujuan Pembelajaran (TP) & IKTP</th>
            <th style="border: 1px solid #0f172a; padding: 8px; width: 20%; text-align: left;">KKO & Materi</th>
            <th style="border: 1px solid #0f172a; padding: 8px; width: 13%; text-align: center;">Kelas/Waktu</th>
            <th style="border: 1px solid #0f172a; padding: 8px; width: 15%; text-align: left;">P3 & Asesmen</th>
          </tr>
        </thead>
        <tbody>
          ${tpRowsHtml}
        </tbody>
      </table>

      <!-- CATATAN & STRATEGI PEMBELAJARAN -->
      <h2 style="font-size: 11pt; color: #0f172a; border-left: 4px solid #059669; padding-left: 8px; margin-top: 14pt; margin-bottom: 8pt;">
        3. REKOMENDASI STRATEGI & CATATAN PENDIDIK
      </h2>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 10px 14px; border-radius: 6px; font-size: 9.5pt;">
        <p style="margin-top: 0; margin-bottom: 6px;">
          <strong style="color: #065f46;">Pendekatan / Model Pembelajaran:</strong> ${data.rekomendasiPendekatan}
        </p>
        <p style="margin: 0; color: #334155;">
          <strong style="color: #0f172a;">Catatan Pelaksanaan Guru:</strong> ${data.catatanPendidik}
        </p>
      </div>

      <!-- LEMBAR TANDA TANGAN -->
      <div style="margin-top: 25pt; page-break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <tr>
            <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
              Mengetahui,<br/>
              Kepala Sekolah<br/><br/><br/><br/>
              <strong style="text-decoration: underline;">${kepsek}</strong><br/>
              NIP. ${nipK}
            </td>
            <td style="width: 50%; border: none; text-align: center; vertical-align: top;">
              ${kota}, ............................ ${new Date().getFullYear()}<br/>
              Guru Mata Pelajaran PJOK<br/><br/><br/><br/>
              <strong style="text-decoration: underline;">${guru}</strong><br/>
              NIP. ${nipG}
            </td>
          </tr>
        </table>
      </div>
      </div>
    </div>
  `;

  return wrapWithDocShell(`FORMULASI_CP_KE_TP_${data.elemen.replace(/\s+/g, '_')}`, content);
}

/**
 * Triggers a browser download of a formatted JSON file.
 */
export function downloadJsonFile(filename: string, data: any): void {
  const jsonContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 30000);
}



