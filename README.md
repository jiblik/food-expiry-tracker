# 🍎 מעקב תפוגה - Food Expiry Tracker

אפליקציה פשוטה לניהול תאריכי תפוגה של מוצרי מזון.

## איך להתקין גרסה משלך?

### שלב 1 - צור Google Sheet

1. לך ל-[Google Sheets](https://sheets.google.com)
2. צור גיליון חדש בשם `food-tracker`
3. בשורה הראשונה כתוב: `id`, `name`, `date`, `image`, `category` (כל אחד בעמודה נפרדת)

### שלב 2 - צור Apps Script

1. בגיליון, לחץ על **Extensions** → **Apps Script**
2. מחק את הקוד הקיים והדבק את הקוד הבא:

```javascript
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = e.parameter.action;

  var output;

  if (action === 'get') {
    var data = sheet.getDataRange().getValues();
    var products = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][0]) {
        products.push({
          id: data[i][0],
          name: data[i][1],
          date: data[i][2],
          image: data[i][3],
          category: data[i][4] || 'other'
        });
      }
    }
    output = JSON.stringify(products);
  }

  else if (action === 'add') {
    var id = e.parameter.id;
    var name = e.parameter.name;
    var date = e.parameter.date;
    var image = e.parameter.image || '';
    var category = e.parameter.category || 'other';
    sheet.appendRow([id, name, date, image, category]);
    output = JSON.stringify({success: true});
  }

  else if (action === 'delete') {
    var id = e.parameter.id;
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] == id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    output = JSON.stringify({success: true});
  }

  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. לחץ **Save**
4. לחץ **Deploy** → **New deployment**
5. בחר **Web app**
6. הגדר:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. לחץ **Deploy**
8. **העתק את הקישור** שמופיע

### שלב 3 - צור את האפליקציה

1. הורד את הקובץ `index.html` מהריפו הזה
2. פתח אותו בעורך טקסט
3. מצא את השורה: `const API_URL = '...'`
4. החלף את הקישור בקישור שהעתקת בשלב 2
5. שמור את הקובץ

### שלב 4 - העלה ל-GitHub Pages (אופציונלי)

1. צור ריפו חדש ב-GitHub
2. העלה את `index.html`
3. הפעל GitHub Pages בהגדרות

---

## שימוש

- הוסף מוצרים עם שם, קטגוריה, תאריך תפוגה ותמונה
- מוצרים שעומדים לפוג יופיעו בצבע כתום/אדום
- הנתונים מסונכרנים בין כל המכשירים שלך
