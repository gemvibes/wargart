import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { KegiatanPdfExportPayload } from "@/lib/types";
import { base64ToUint8Array, formatDate } from "@/lib/utils";

const A4_PORTRAIT: [number, number] = [595.28, 841.89];
const PAGE_MARGIN = 42;
const SECTION_GAP = 16;
const TEXT_COLOR = rgb(0.09, 0.2, 0.18);
const MUTED_COLOR = rgb(0.34, 0.45, 0.43);
const BORDER_COLOR = rgb(0.79, 0.85, 0.83);
const HEADER_FILL = rgb(0.93, 0.96, 0.95);

type CursorState = {
  page: PDFPage;
  y: number;
};

type MetaRow = {
  label: string;
  value: string;
};

function splitTextLines(text: string, font: PDFFont, size: number, maxWidth: number) {
  return String(text || "")
    .split("\n")
    .flatMap((paragraph) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [""];

      const lines: string[] = [];
      let currentLine = "";

      words.forEach((word) => {
        const candidate = currentLine ? currentLine + " " + word : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
          currentLine = candidate;
          return;
        }

        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      });

      if (currentLine) {
        lines.push(currentLine);
      }

      return lines;
    });
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function addTextPage(pdfDoc: PDFDocument) {
  return pdfDoc.addPage(A4_PORTRAIT);
}

function ensureSpace(pdfDoc: PDFDocument, state: CursorState, minimumHeight: number) {
  if (state.y - minimumHeight >= PAGE_MARGIN) {
    return state;
  }

  const page = addTextPage(pdfDoc);
  return {
    page,
    y: page.getHeight() - PAGE_MARGIN
  };
}

function formatTimeValue(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const withoutSuffix = raw.replace(/\s*wib$/i, "").trim();
  const match = withoutSuffix.match(/^(\d{1,2})[:.](\d{2})$/);
  if (match) {
    return `${match[1].padStart(2, "0")}.${match[2]}`;
  }

  return withoutSuffix.replace(/:/g, ".");
}

function formatTimeRange(start: string, end: string) {
  const startValue = formatTimeValue(start);
  const endValue = formatTimeValue(end);

  if (!startValue && !endValue) return "-";
  if (startValue && endValue) return `${startValue} - ${endValue} WIB`;
  return `${startValue || endValue} WIB`;
}

function drawParagraph(
  pdfDoc: PDFDocument,
  state: CursorState,
  text: string,
  font: PDFFont,
  size: number,
  color = TEXT_COLOR,
  extraBottom = 8
) {
  const lines = splitTextLines(text, font, size, state.page.getWidth() - PAGE_MARGIN * 2);
  const lineHeight = size + 5;
  const nextState = ensureSpace(pdfDoc, state, lines.length * lineHeight + extraBottom);

  lines.forEach((line) => {
    nextState.page.drawText(line, {
      x: PAGE_MARGIN,
      y: nextState.y,
      size,
      font,
      color
    });
    nextState.y -= lineHeight;
  });

  nextState.y -= extraBottom;
  return nextState;
}

function drawMetaTable(
  pdfDoc: PDFDocument,
  state: CursorState,
  rows: MetaRow[],
  boldFont: PDFFont,
  font: PDFFont
) {
  const labelWidth = rows.reduce((width, row) => {
    return Math.max(width, boldFont.widthOfTextAtSize(row.label, 11));
  }, 0);
  const colonX = PAGE_MARGIN + labelWidth + 8;
  const valueX = colonX + 10;
  const maxValueWidth = state.page.getWidth() - PAGE_MARGIN - valueX;
  let nextState = state;

  rows.forEach((row) => {
    const valueLines = splitTextLines(row.value || "-", font, 11, maxValueWidth);
    const rowHeight = Math.max(1, valueLines.length) * 16 + 2;
    nextState = ensureSpace(pdfDoc, nextState, rowHeight);

    nextState.page.drawText(row.label, {
      x: PAGE_MARGIN,
      y: nextState.y,
      size: 11,
      font: boldFont,
      color: TEXT_COLOR
    });

    nextState.page.drawText(":", {
      x: colonX,
      y: nextState.y,
      size: 11,
      font: boldFont,
      color: TEXT_COLOR
    });

    valueLines.forEach((line, index) => {
      nextState.page.drawText(line, {
        x: valueX,
        y: nextState.y - index * 16,
        size: 11,
        font,
        color: TEXT_COLOR
      });
    });

    nextState.y -= rowHeight;
  });

  nextState.y -= 8;
  return nextState;
}

function drawSectionTitle(pdfDoc: PDFDocument, state: CursorState, title: string, boldFont: PDFFont) {
  const nextState = ensureSpace(pdfDoc, state, 24);
  nextState.page.drawText(title, {
    x: PAGE_MARGIN,
    y: nextState.y,
    size: 13,
    font: boldFont,
    color: TEXT_COLOR
  });
  nextState.y -= 22;
  return nextState;
}

function drawAttendanceTable(
  pdfDoc: PDFDocument,
  state: CursorState,
  names: string[],
  boldFont: PDFFont,
  font: PDFFont
) {
  const pageWidth = state.page.getWidth();
  const tableWidth = pageWidth - PAGE_MARGIN * 2;
  const noWidth = 54;
  const namaWidth = tableWidth - noWidth;
  const headerHeight = 24;
  const leftX = PAGE_MARGIN;
  let nextState = state;

  const drawHeader = () => {
    nextState.page.drawRectangle({
      x: leftX,
      y: nextState.y - headerHeight + 4,
      width: tableWidth,
      height: headerHeight,
      borderColor: BORDER_COLOR,
      borderWidth: 1,
      color: HEADER_FILL
    });

    nextState.page.drawLine({
      start: { x: leftX + noWidth, y: nextState.y - headerHeight + 4 },
      end: { x: leftX + noWidth, y: nextState.y + 4 },
      thickness: 1,
      color: BORDER_COLOR
    });

    nextState.page.drawText("No", {
      x: leftX + 18,
      y: nextState.y - 12,
      size: 10.5,
      font: boldFont,
      color: TEXT_COLOR
    });

    nextState.page.drawText("Nama", {
      x: leftX + noWidth + 10,
      y: nextState.y - 12,
      size: 10.5,
      font: boldFont,
      color: TEXT_COLOR
    });

    nextState.y -= headerHeight;
  };

  nextState = ensureSpace(pdfDoc, nextState, 120);
  drawHeader();

  if (!names.length) {
    nextState = ensureSpace(pdfDoc, nextState, 28);
    nextState.page.drawRectangle({
      x: leftX,
      y: nextState.y - 20,
      width: tableWidth,
      height: 24,
      borderColor: BORDER_COLOR,
      borderWidth: 1
    });
    nextState.page.drawText("Belum ada warga yang ditandai hadir.", {
      x: leftX + 10,
      y: nextState.y - 12,
      size: 10.5,
      font,
      color: MUTED_COLOR
    });
    nextState.y -= 28;
    return nextState;
  }

  names.forEach((name, index) => {
    const nameLines = splitTextLines(name, font, 10.5, namaWidth - 20);
    const rowHeight = Math.max(24, nameLines.length * 14 + 10);

    nextState = ensureSpace(pdfDoc, nextState, rowHeight + 8);
    if (nextState.y === nextState.page.getHeight() - PAGE_MARGIN) {
      drawHeader();
    }

    nextState.page.drawRectangle({
      x: leftX,
      y: nextState.y - rowHeight + 4,
      width: tableWidth,
      height: rowHeight,
      borderColor: BORDER_COLOR,
      borderWidth: 1
    });

    nextState.page.drawLine({
      start: { x: leftX + noWidth, y: nextState.y - rowHeight + 4 },
      end: { x: leftX + noWidth, y: nextState.y + 4 },
      thickness: 1,
      color: BORDER_COLOR
    });

    nextState.page.drawText(String(index + 1), {
      x: leftX + 18,
      y: nextState.y - 14,
      size: 10.5,
      font,
      color: TEXT_COLOR
    });

    nameLines.forEach((line, lineIndex) => {
      nextState.page.drawText(line, {
        x: leftX + noWidth + 10,
        y: nextState.y - 14 - lineIndex * 14,
        size: 10.5,
        font,
        color: TEXT_COLOR
      });
    });

    nextState.y -= rowHeight;
  });

  nextState.y -= 10;
  return nextState;
}

function drawSignatureColumns(
  pdfDoc: PDFDocument,
  state: CursorState,
  ketua: string,
  sekretaris: string,
  boldFont: PDFFont,
  font: PDFFont
) {
  const blockHeight = 120;
  const nextState = ensureSpace(pdfDoc, state, blockHeight);
  const gap = 24;
  const totalWidth = nextState.page.getWidth() - PAGE_MARGIN * 2;
  const columnWidth = (totalWidth - gap) / 2;
  const leftX = PAGE_MARGIN;
  const rightX = PAGE_MARGIN + columnWidth + gap;
  const topY = nextState.y;

  const drawCentered = (text: string, x: number, width: number, y: number, fontRef: PDFFont, size: number) => {
    const textWidth = fontRef.widthOfTextAtSize(text, size);
    nextState.page.drawText(text, {
      x: x + (width - textWidth) / 2,
      y,
      size,
      font: fontRef,
      color: TEXT_COLOR
    });
  };

  drawCentered("Ketua RT", leftX, columnWidth, topY, font, 11);
  drawCentered("Sekretaris", rightX, columnWidth, topY, font, 11);

  nextState.page.drawLine({
    start: { x: leftX + 28, y: topY - 66 },
    end: { x: leftX + columnWidth - 28, y: topY - 66 },
    thickness: 0.8,
    color: BORDER_COLOR
  });

  nextState.page.drawLine({
    start: { x: rightX + 28, y: topY - 66 },
    end: { x: rightX + columnWidth - 28, y: topY - 66 },
    thickness: 0.8,
    color: BORDER_COLOR
  });

  drawCentered(ketua || "(Nama Ketua RT)", leftX, columnWidth, topY - 82, boldFont, 11);
  drawCentered(sekretaris || "(Nama Sekretaris)", rightX, columnWidth, topY - 82, boldFont, 11);

  nextState.y -= blockHeight;
  return nextState;
}

async function embedImage(pdfDoc: PDFDocument, mimeType: string, bytes: Uint8Array) {
  if (mimeType === "image/png") {
    return pdfDoc.embedPng(bytes);
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return pdfDoc.embedJpg(bytes);
  }

  const converted = await new Promise<Uint8Array>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Canvas browser tidak tersedia untuk memproses foto."));
        return;
      }

      context.drawImage(image, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      URL.revokeObjectURL(objectUrl);
      resolve(base64ToUint8Array(dataUrl.split(",")[1] ?? ""));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Gagal memproses foto untuk PDF."));
    };
    image.src = objectUrl;
  });

  return pdfDoc.embedPng(converted);
}

function chunkPhotos<T>(items: T[], chunkSize: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function drawPhotoCard(
  page: PDFPage,
  image: PDFImage,
  caption: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: PDFFont
) {
  const captionLines = splitTextLines(caption || "Tanpa caption", font, 9, width - 12).slice(0, 2);
  const captionHeight = captionLines.length ? captionLines.length * 12 + 8 : 0;
  const imageAreaHeight = height - captionHeight - 8;
  const imageScale = Math.min(width / image.width, imageAreaHeight / image.height, 1);
  const imageWidth = image.width * imageScale;
  const imageHeight = image.height * imageScale;
  const imageX = x + (width - imageWidth) / 2;
  const imageY = y + captionHeight + (imageAreaHeight - imageHeight) / 2;

  page.drawImage(image, {
    x: imageX,
    y: imageY,
    width: imageWidth,
    height: imageHeight
  });

  captionLines.forEach((line, index) => {
    page.drawText(line, {
      x: x + 6,
      y: y + captionHeight - 10 - index * 12,
      size: 9,
      font,
      color: MUTED_COLOR
    });
  });
}

async function addPhotoGridPages(
  pdfDoc: PDFDocument,
  photos: KegiatanPdfExportPayload["photos"],
  boldFont: PDFFont,
  font: PDFFont
) {
  const embeddedPhotos = await Promise.all(
    photos.map(async (photo) => ({
      caption: photo.caption || photo.file_name,
      image: await embedImage(pdfDoc, photo.mime_type, base64ToUint8Array(photo.base64_data))
    }))
  );

  const photoPages = chunkPhotos(embeddedPhotos, 4);

  photoPages.forEach((pagePhotos, pageIndex) => {
    const page = pdfDoc.addPage(A4_PORTRAIT);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const title = pageIndex === 0 ? "Dokumentasi Foto" : `Dokumentasi Foto (${pageIndex + 1})`;

    page.drawText(title, {
      x: PAGE_MARGIN,
      y: pageHeight - PAGE_MARGIN,
      size: 13,
      font: boldFont,
      color: TEXT_COLOR
    });

    const gridTop = pageHeight - PAGE_MARGIN - 28;
    const gridBottom = PAGE_MARGIN + 20;
    const gridHeight = gridTop - gridBottom;
    const gap = 10;
    const cellWidth = (pageWidth - PAGE_MARGIN * 2 - gap) / 2;
    const cellHeight = (gridHeight - gap) / 2;

    pagePhotos.forEach((photo, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = PAGE_MARGIN + column * (cellWidth + gap);
      const topY = gridTop - row * (cellHeight + gap);
      const y = topY - cellHeight;

      drawPhotoCard(page, photo.image, photo.caption, x, y, cellWidth, cellHeight, font);
    });
  });
}

export async function downloadKegiatanPdf(payload: KegiatanPdfExportPayload) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const kegiatan = payload.kegiatan;
  let state: CursorState = {
    page: addTextPage(pdfDoc),
    y: A4_PORTRAIT[1] - PAGE_MARGIN
  };

  state.page.drawText("Laporan Kegiatan Warga", {
    x: PAGE_MARGIN,
    y: state.y,
    size: 18,
    font: boldFont,
    color: TEXT_COLOR
  });
  state.y -= 28;

  state = drawMetaTable(
    pdfDoc,
    state,
    [
      { label: "Nama kegiatan", value: kegiatan.nama_kegiatan },
      { label: "Hari / tanggal", value: `${kegiatan.hari}, ${formatDate(kegiatan.tanggal)}` },
      { label: "Waktu", value: formatTimeRange(kegiatan.waktu_mulai, kegiatan.waktu_selesai) },
      { label: "Tempat", value: kegiatan.tempat || "-" },
      { label: "Dicetak", value: formatDate(payload.generated_at) }
    ],
    boldFont,
    font
  );

  state.y -= SECTION_GAP - 8;
  state = drawSectionTitle(pdfDoc, state, "Laporan / Notulen", boldFont);
  state = drawParagraph(
    pdfDoc,
    state,
    kegiatan.laporan || "Belum ada laporan kegiatan.",
    font,
    11,
    TEXT_COLOR,
    10
  );

  state.y -= 4;
  state = drawSectionTitle(pdfDoc, state, "Daftar Hadir", boldFont);
  state = drawAttendanceTable(
    pdfDoc,
    state,
    payload.attendance.map((item) => item.nama),
    boldFont,
    font
  );

  state = drawSignatureColumns(
    pdfDoc,
    state,
    payload.nama_ketua_rt,
    payload.nama_sekretaris,
    boldFont,
    font
  );

  if (payload.photos.length) {
    await addPhotoGridPages(pdfDoc, payload.photos, boldFont, font);
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  downloadBlob(payload.file_name, blob);
}
