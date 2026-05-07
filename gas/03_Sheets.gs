function getSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty(
    CONFIG.PROPERTIES.SPREADSHEET_ID
  );
  if (!spreadsheetId) {
    throw new Error("Property SPREADSHEET_ID belum diatur.");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getSheet(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) {
    throw new Error("Sheet tidak ditemukan: " + name);
  }
  return sheet;
}

function readSheetAsObjects(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const displayValues = sheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1).map(function (row, rowIndex) {
    const item = {};
    headers.forEach(function (header, index) {
      const key = String(header);
      if (key === "waktu_mulai" || key === "waktu_selesai") {
        item[key] = displayValues[rowIndex + 1][index];
        return;
      }
      item[key] = row[index];
    });
    return item;
  });
}

function appendRow(sheetName, objectData) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(function (header) {
    return objectData[String(header)] !== undefined ? objectData[String(header)] : "";
  });
  sheet.appendRow(row);
  return objectData;
}

function replaceSheetRows_(sheetName, rows) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();

  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  if (!rows.length) {
    return true;
  }

  const values = rows.map(function (objectData) {
    return headers.map(function (header) {
      return objectData[String(header)] !== undefined ? objectData[String(header)] : "";
    });
  });

  sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  return true;
}

function updateRowById(sheetName, idColumn, idValue, objectData) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) {
    throw new Error("Kolom ID tidak ditemukan: " + idColumn);
  }

  for (var rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
    if (String(values[rowIndex][idIndex]) === String(idValue)) {
      const nextRow = headers.map(function (header, columnIndex) {
        if (objectData[String(header)] !== undefined) {
          return objectData[String(header)];
        }
        return values[rowIndex][columnIndex];
      });
      sheet.getRange(rowIndex + 1, 1, 1, headers.length).setValues([nextRow]);
      return objectData;
    }
  }

  throw new Error("Data dengan ID " + idValue + " tidak ditemukan.");
}

function deleteRowById(sheetName, idColumn, idValue) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) {
    throw new Error("Kolom ID tidak ditemukan: " + idColumn);
  }

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][idIndex]) === String(idValue)) {
      sheet.deleteRow(rowIndex + 1);
      return true;
    }
  }

  throw new Error("Data dengan ID " + idValue + " tidak ditemukan.");
}

function deleteRowsByColumnValue_(sheetName, columnName, value) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return;
  const headers = values[0];
  const columnIndex = headers.indexOf(columnName);
  if (columnIndex === -1) {
    throw new Error("Kolom tidak ditemukan: " + columnName);
  }

  for (var rowIndex = values.length - 1; rowIndex >= 1; rowIndex -= 1) {
    if (String(values[rowIndex][columnIndex]) === String(value)) {
      sheet.deleteRow(rowIndex + 1);
    }
  }
}

function generateId(prefix, sheetName, idColumn) {
  const data = readSheetAsObjects(sheetName);
  const lastNumber = data.reduce(function (maxValue, item) {
    const currentId = String(item[idColumn] || "");
    const matched = currentId.match(/(\d+)$/);
    const numeric = matched ? Number(matched[1]) : 0;
    return numeric > maxValue ? numeric : maxValue;
  }, 0);
  return prefix + "-" + ("0000" + (lastNumber + 1)).slice(-4);
}

function findById_(sheetName, idColumn, idValue) {
  const item = readSheetAsObjects(sheetName).find(function (row) {
    return String(row[idColumn]) === String(idValue);
  });
  if (!item) {
    throw new Error("Data dengan ID " + idValue + " tidak ditemukan di sheet " + sheetName + ".");
  }
  return item;
}

function getSettingsObject_() {
  return readSheetAsObjects(CONFIG.SHEETS.SETTINGS).reduce(function (settings, item) {
    settings[String(item.key)] = item.value;
    return settings;
  }, {});
}

function getFrontendAppUrl_() {
  return sanitizeText_(
    PropertiesService.getScriptProperties().getProperty(CONFIG.PROPERTIES.FRONTEND_APP_URL)
  );
}
