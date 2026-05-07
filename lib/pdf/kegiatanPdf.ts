import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { KegiatanPdfExportPayload } from "@/lib/types";
import { base64ToUint8Array, formatDate } from "@/lib/utils";

const A4_PORTRAIT: [number, number] = [595.28, 841.89];
const A4_LANDSCAPE: [number, number] = [841.89, 595.28];
const PAGE_MARGIN = 42;
const TEXT_COLOR = rgb(0.09, 0.2, 0.18);
const MUTED_COLOR = rgb(0.34, 0.45, 0.43);

type CursorState = {
  page: PDFPage;
  y: number;
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

function addTextPage(pdfDoc: PDFDocument) {
  return pdfDoc.addPage(A4_PORTRAIT);
}

function ensureSpace(
  pdfDoc: PDFDocument,
  state: CursorState,
  minimumHeight: number
) {
  if (state.y - minimumHeight >= PAGE_MARGIN) {
    return state;
  }

  const page = addTextPage(pdfDoc);
  return {
    page,
    y: page.getHeight() - PAGE_MARGIN
  };
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
  const lineHeight = size + 4;
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

function drawMetaRow(
  pdfDoc: PDFDocument,
  state: CursorState,
  label: string,
  value: string,
  boldFont: PDFFont,
  font: PDFFont
) {
  const labelText = label + ":";
  const labelWidth = boldFont.widthOfTextAtSize(labelText, 11);
  const valueX = PAGE_MARGIN + labelWidth + 10;
  const maxWidth = state.page.getWidth() - PAGE_MARGIN - valueX;
  const lines = splitTextLines(value, font, 11, maxWidth);
  const lineHeight = 16;
  const nextState = ensureSpace(pdfDoc, state, Math.max(1, lines.length) * lineHeight + 4);

  nextState.page.drawText(labelText, {
    x: PAGE_MARGIN,
    y: nextState.y,
    size: 11,
    font: boldFont,
    color: TEXT_COLOR
  });

  lines.forEach((line, index) => {
    nextState.page.drawText(line, {
      x: valueX,
      y: nextState.y - index * lineHeight,
      size: 11,
      font,
      color: TEXT_COLOR
    });
  });

  nextState.y -= Math.max(1, lines.length) * lineHeight;
  return nextState;
}

function drawSectionTitle(
  pdfDoc: PDFDocument,
  state: CursorState,
  title: string,
  boldFont: PDFFont
) {
  const nextState = ensureSpace(pdfDoc, state, 28);
  nextState.page.drawText(title, {
    x: PAGE_MARGIN,
    y: nextState.y,
    size: 14,
    font: boldFont,
    color: TEXT_COLOR
  });
  nextState.y -= 24;
  return nextState;
}

function addPhotoPage(
  pdfDoc: PDFDocument,
  titleFont: PDFFont,
  bodyFont: PDFFont,
  photoTitle: string,
  caption: string,
  image: PDFImage
) {
  const isLandscape = image.width > image.height;
  const page = pdfDoc.addPage(isLandscape ? A4_LANDSCAPE : A4_PORTRAIT);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();

  page.drawText(photoTitle, {
    x: PAGE_MARGIN,
    y: pageHeight - PAGE_MARGIN,
    size: 16,
    font: titleFont,
    color: TEXT_COLOR
  });

  const captionLines = splitTextLines(
    caption || "Tanpa caption",
    bodyFont,
    11,
    pageWidth - PAGE_MARGIN * 2
  );
  const captionHeight = captionLines.length * 15 + 18;
  const maxWidth = pageWidth - PAGE_MARGIN * 2;
  const maxHeight = pageHeight - PAGE_MARGIN * 2 - 40 - captionHeight;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = PAGE_MARGIN + captionHeight;

  page.drawImage(image, {
    x: imageX,
    y: imageY,
    width: imageWidth,
    height: imageHeight
  });

  captionLines.forEach((line, index) => {
    page.drawText(line, {
      x: PAGE_MARGIN,
      y: PAGE_MARGIN + captionHeight - 14 - index * 15,
      size: 11,
      font: bodyFont,
      color: MUTED_COLOR
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

  state = drawMetaRow(pdfDoc, state, "Nama kegiatan", kegiatan.nama_kegiatan, boldFont, font);
  state = drawMetaRow(pdfDoc, state, "Jenis kegiatan", kegiatan.jenis_kegiatan, boldFont, font);
  state = drawMetaRow(
    pdfDoc,
    state,
    "Hari / tanggal",
    kegiatan.hari + ", " + formatDate(kegiatan.tanggal),
    boldFont,
    font
  );
  state = drawMetaRow(
    pdfDoc,
    state,
    "Waktu",
    kegiatan.waktu_mulai + " - " + kegiatan.waktu_selesai,
    boldFont,
    font
  );
  state = drawMetaRow(pdfDoc, state, "Tempat", kegiatan.tempat, boldFont, font);
  state = drawMetaRow(
    pdfDoc,
    state,
    "Dicetak",
    formatDate(payload.generated_at),
    boldFont,
    font
  );
  state.y -= 8;

  state = drawSectionTitle(pdfDoc, state, "Laporan / Notulen", boldFont);
  state = drawParagraph(
    pdfDoc,
    state,
    kegiatan.laporan || "Belum ada laporan kegiatan.",
    font,
    11
  );

  state = drawSectionTitle(pdfDoc, state, "Daftar Hadir", boldFont);
  if (!payload.attendance.length) {
    state = drawParagraph(pdfDoc, state, "Belum ada warga yang ditandai hadir.", font, 11);
  } else {
    payload.attendance.forEach((item, index) => {
      const line =
        index +
        1 +
        ". " +
        item.nama +
        " - Rumah " +
        item.nomor_rumah +
        " - Dawis " +
        item.dawis +
        (item.catatan ? " - Catatan: " + item.catatan : "");
      state = drawParagraph(pdfDoc, state, line, font, 11, TEXT_COLOR, 4);
    });
    state.y -= 6;
  }

  state = drawSectionTitle(pdfDoc, state, "Pengesahan", boldFont);
  state = drawParagraph(
    pdfDoc,
    state,
    "Ketua RT: " + payload.nama_ketua_rt,
    font,
    11,
    TEXT_COLOR,
    4
  );
  state = drawParagraph(
    pdfDoc,
    state,
    "Sekretaris: " + payload.nama_sekretaris,
    font,
    11
  );

  for (let index = 0; index < payload.photos.length; index += 1) {
    const photo = payload.photos[index];
    const image = await embedImage(
      pdfDoc,
      photo.mime_type,
      base64ToUint8Array(photo.base64_data)
    );
    addPhotoPage(
      pdfDoc,
      boldFont,
      font,
      "Dokumentasi Foto " + (index + 1),
      photo.caption || photo.file_name,
      image
    );
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: "application/pdf" });
  downloadBlob(payload.file_name, blob);
}
