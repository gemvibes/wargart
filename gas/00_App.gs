function doGet(e) {
  try {
    const action = sanitizeText_(e.parameter.action);
    if (!action) {
      return handleRootRequest_();
    }
    const responseData = routeGetAction_(action, e);
    return jsonResponse(responseData, true);
  } catch (error) {
    return jsonResponse(null, false, error.message);
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    const action = getRequiredValue_(body.action, "Action POST wajib diisi.");
    const payload = body.payload || {};
    const responseData = routePostAction_(action, body, payload);
    return jsonResponse(responseData, true);
  } catch (error) {
    return jsonResponse(null, false, error.message);
  }
}

function routeGetAction_(action, e) {
  switch (action) {
    case "me":
      return getMe_(e);
    case "getDashboardSummary":
      return getDashboardSummary_(e);
    case "getWarga":
      return getWarga_(e);
    case "getKegiatan":
      return getKegiatan_(e);
    case "getKegiatanDetail":
      return getKegiatanDetail_(e);
    case "getKegiatanKehadiran":
      return getKegiatanKehadiran_(e);
    case "getRekapKehadiran":
      return getRekapKehadiran_(e);
    default:
      throw new Error("Action GET tidak dikenali: " + action);
  }
}

function routePostAction_(action, body, payload) {
  switch (action) {
    case "login":
      return login_(payload.username, payload.password);
    case "createWarga":
      return createWarga_(body, payload);
    case "updateWarga":
      return updateWarga_(body, payload);
    case "deleteWarga":
      return deleteWarga_(body, payload);
    case "importWargaBatch":
      return importWargaBatch_(body, payload);
    case "createKegiatan":
      return createKegiatan_(body, payload);
    case "updateKegiatan":
      return updateKegiatan_(body, payload);
    case "deleteKegiatan":
      return deleteKegiatan_(body, payload);
    case "saveKehadiran":
      return saveKehadiran_(body, payload);
    case "uploadFotoKegiatan":
      return uploadFotoKegiatan_(body, payload);
    case "deleteFotoKegiatan":
      return deleteFotoKegiatan_(body, payload);
    case "getKegiatanPdfData":
      return getKegiatanPdfData_(body, payload);
    case "exportKegiatan":
      return exportKegiatan_(body, payload);
    default:
      throw new Error("Action POST tidak dikenali: " + action);
  }
}

function handleRootRequest_() {
  const frontendUrl = getFrontendAppUrl_();
  if (!frontendUrl) {
    return jsonResponse(
      {
        message:
          "Backend Titeni aktif. Tambahkan parameter action untuk API atau atur FRONTEND_APP_URL agar URL GAS mengarahkan ke frontend publik."
      },
      true
    );
  }
  return redirectToFrontend_(frontendUrl);
}
