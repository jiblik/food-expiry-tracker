// ===========================================================
// Google Apps Script - Food Expiry Tracker with History Sync
// ===========================================================
//
// הוראות התקנה:
// 1. לך ל: https://script.google.com
// 2. פתח את הפרויקט הקיים של food-expiry-tracker
// 3. החלף את כל הקוד בקוד הזה
// 4. לחץ על "Deploy" > "Manage deployments"
// 5. לחץ על עריכה (עיפרון) ובחר "New version"
// 6. לחץ "Deploy"
//
// חשוב: צריך ליצור גיליון חדש בשם "history" ב-Google Sheets
// עם הכותרות: id | name | category | price | status | date | expiryDate
// ===========================================================

const SHEET_ID = '1lp_kKLPd30xoJOq6SXqh85GC-3tBwg5KR5mHZlNjvEk';
const PRODUCTS_SHEET = 'products';
const HISTORY_SHEET = 'history';

function doGet(e) {
  const action = e.parameter.action;

  // Products actions
  if (action === 'get') {
    return getProducts();
  } else if (action === 'add') {
    return addProduct(e.parameter);
  } else if (action === 'delete') {
    return deleteProduct(e.parameter.id);
  }

  // History actions
  else if (action === 'getHistory') {
    return getHistory();
  } else if (action === 'addHistory') {
    return addHistory(e.parameter);
  } else if (action === 'deleteHistory') {
    return deleteHistory(e.parameter.id);
  }

  return ContentService.createTextOutput('OK');
}

// ==================== Products ====================

function getProducts() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const products = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      products.push({
        id: row[0],
        name: row[1],
        date: row[2],
        category: row[3],
        notes: row[4],
        image: row[5]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(products))
    .setMimeType(ContentService.MimeType.JSON);
}

function addProduct(params) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PRODUCTS_SHEET);
  sheet.appendRow([
    params.id,
    params.name,
    params.date,
    params.category || 'other',
    params.notes || '',
    params.image || ''
  ]);
  return ContentService.createTextOutput('OK');
}

function deleteProduct(id) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput('OK');
}

// ==================== History ====================

function getHistory() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(HISTORY_SHEET);

  // יצירת גיליון היסטוריה אם לא קיים
  if (!sheet) {
    sheet = ss.insertSheet(HISTORY_SHEET);
    sheet.appendRow(['id', 'name', 'category', 'price', 'status', 'date', 'expiryDate']);
  }

  const data = sheet.getDataRange().getValues();
  const history = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      history.push({
        id: row[0],
        name: row[1],
        category: row[2],
        price: row[3],
        status: row[4],
        date: row[5],
        expiryDate: row[6]
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify(history))
    .setMimeType(ContentService.MimeType.JSON);
}

function addHistory(params) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(HISTORY_SHEET);

  // יצירת גיליון היסטוריה אם לא קיים
  if (!sheet) {
    sheet = ss.insertSheet(HISTORY_SHEET);
    sheet.appendRow(['id', 'name', 'category', 'price', 'status', 'date', 'expiryDate']);
  }

  sheet.appendRow([
    params.id,
    params.name,
    params.category || 'other',
    params.price || 0,
    params.status,
    params.date,
    params.expiryDate
  ]);

  return ContentService.createTextOutput('OK');
}

function deleteHistory(id) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(HISTORY_SHEET);

  if (!sheet) return ContentService.createTextOutput('OK');

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  return ContentService.createTextOutput('OK');
}
