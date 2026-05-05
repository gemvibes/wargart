function jsonResponse(data, success, message) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: success,
      data: data,
      message: message || ""
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function parseJsonBody_(e) {
  if (!e.postData || !e.postData.contents) {
    throw new Error("Body JSON tidak ditemukan.");
  }
  return JSON.parse(e.postData.contents);
}

function redirectToFrontend_(url) {
  const safeUrl = String(url);
  const html = HtmlService.createHtmlOutput(
    '<!doctype html><html><head>' +
      '<meta charset="utf-8">' +
      '<meta http-equiv="refresh" content="0; url=' +
      safeUrl +
      '">' +
      '<script>window.location.replace(' +
      JSON.stringify(safeUrl) +
      ');</script>' +
      "</head><body>" +
      '<p>Mengarahkan ke aplikasi WargaRT. Jika tidak berpindah otomatis, buka <a href="' +
      safeUrl +
      '">halaman aplikasi</a>.</p>' +
      "</body></html>"
  );
  html.setTitle("WargaRT");
  return html;
}
