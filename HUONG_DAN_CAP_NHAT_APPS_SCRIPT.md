# 🔧 HƯỚNG DẪN CẬP NHẬT GOOGLE APPS SCRIPT

## ⚠️ VẤN ĐỀ HIỆN TẠI

Kết quả chia thủ thuật đã ĐÚNG trong extension, nhưng **CHƯA GHI** vào Google Sheets vì:
- Google Apps Script đang cập nhật SAI cột (Time columns T-AG thay vì Result columns E-R)

## ✅ GIẢI PHÁP

Cập nhật lại Google Apps Script với code MỚI đã được sửa đúng.

---

## 📋 BƯỚC 1: MỞ GOOGLE APPS SCRIPT EDITOR

1. Mở Google Sheets của bạn: https://docs.google.com/spreadsheets/d/18s8RPoITbVq3StIdG6VUDoZi7GpZfdxIWr6XvBB_FlY/edit
2. Click **Extensions** → **Apps Script**
3. Bạn sẽ thấy code cũ (có thể có nhiều files)

---

## 📋 BƯỚC 2: THAY THẾ CODE

### Cách 1: Xóa toàn bộ và paste code mới (KHUYẾN NGHỊ)

1. Xóa TẤT CẢ code cũ trong editor
2. Copy toàn bộ code trong file **GoogleAppsScript.js** (260 dòng)
3. Paste vào Apps Script editor
4. Click **Save** (Ctrl+S)

### Cách 2: Chỉ sửa phần quan trọng

Nếu bạn muốn giữ code cũ, chỉ cần sửa 2 chỗ này:

#### ✏️ Sửa 1: Column Mapping (dòng ~75-90)

**TÌM đoạn code này:**
```javascript
const colMap = {
  ttCham: 20,        // ❌ SAI - Column T
  ttMangCham: 21,    // ❌ SAI - Column U
  ttXung: 22,        // ❌ SAI - Column V
  // ...
};
```

**THAY BẰNG:**
```javascript
const colMap = {
  Cham: 5,           // ✅ ĐÚNG - Column E (Châm)
  MangCham: 6,       // ✅ ĐÚNG - Column F (Mãng Châm)
  Xung: 7,           // ✅ ĐÚNG - Column G (Xung)
  HongNgoai: 8,      // ✅ ĐÚNG - Column H (Hồng Ngoại)
  RongRoc: 9,        // ✅ ĐÚNG - Column I (Rống Rọc)
  Parafin: 10,       // ✅ ĐÚNG - Column J (Parafin)
  Cay: 11,           // ✅ ĐÚNG - Column K (Cạy)
  Ngam: 12,          // ✅ ĐÚNG - Column L (Ngâm)
  Xong: 13,          // ✅ ĐÚNG - Column M (Xông)
  Bo: 14,            // ✅ ĐÚNG - Column N (Bó)
  XoaMay: 15,        // ✅ ĐÚNG - Column O (Xoa Máy)
  XoaTay: 16,        // ✅ ĐÚNG - Column P (Xoa Tay)
  Cuu: 17,           // ✅ ĐÚNG - Column Q (Cứu)
  GiacHoi: 18        // ✅ ĐÚNG - Column R (Giác Hơi)
};
```

#### ✏️ Sửa 2: Row Finding Logic (dòng ~100-115)

**TÌM đoạn code này:**
```javascript
data.updates.forEach(update => {
  const rowNumber = update.row;  // ❌ SAI - Dùng row number trực tiếp
  const rowData = update.data;
  
  Object.keys(rowData).forEach(key => {
    // ...
  });
});
```

**THAY BẰNG:**
```javascript
// Get all STT values to find row numbers (Column A)
const sttColumn = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

// Update each patient by STT
data.updates.forEach(update => {
  const stt = update.STT;  // ✅ ĐÚNG - Tìm row bằng STT
  const rowData = update.data;
  
  // Find row number by matching STT in column A
  let rowNumber = -1;
  for (let i = 0; i < sttColumn.length; i++) {
    if (sttColumn[i][0].toString() === stt.toString()) {
      rowNumber = i + 2; // +2 because: +1 for header row, +1 for 0-based index
      break;
    }
  }
  
  if (rowNumber === -1) {
    Logger.log('⚠️ Warning: STT ' + stt + ' not found');
    return;
  }
  
  // Update each column with value from rowData
  Object.keys(rowData).forEach(key => {
    if (colMap[key]) {
      const col = colMap[key];
      const value = rowData[key] || '';
      sheet.getRange(rowNumber, col).setValue(value);
      Logger.log('✅ Updated STT=' + stt + ' Row=' + rowNumber + ' Col=' + col + ' (' + key + ') = ' + value);
    }
  });
  
  updatedCount++;
});
```

---

## 📋 BƯỚC 3: SAVE (KHÔNG CẦN REDEPLOY!)

1. Click **Save** (Ctrl+S) trong Apps Script editor
2. **KHÔNG CẦN** click Deploy lại!
3. Code mới sẽ tự động chạy ngay lần gọi tiếp theo

---

## 📋 BƯỚC 4: TEST

1. Quay lại extension trong Chrome
2. Click **Reload extension** (hoặc Ctrl+R trong extension page)
3. Mở procedure-scheduler.html
4. Click **"Chia Thủ Thuật"**
5. Kiểm tra Console (F12):
   - Phải thấy: `✅ Đã gửi cập nhật X bản ghi vào sheet BN`
6. **Kiểm tra Google Sheets**:
   - Column E (Cham): Phải thấy `07:55-UYEN`, `08:22-HUYEN`, etc.
   - Column G (Xung): Phải thấy `08:40-UYEN`, etc.
   - Column J (Parafin): Phải thấy `08:28-HUYEN`, etc.

---

## 🔍 DEBUG

### Nếu vẫn không ghi được:

1. **Kiểm tra Apps Script Executions:**
   - Trong Apps Script editor → Click **View** → **Executions**
   - Xem log của lần chạy gần nhất
   - Nếu có lỗi sẽ hiển thị ở đây

2. **Kiểm tra Console trong Extension:**
   ```
   F12 → Console tab
   Tìm dòng: "✅ Đã gửi cập nhật ... bản ghi"
   ```

3. **Kiểm tra Web App URL:**
   - File: `js/google-sheets-service.js`, dòng 11
   - Phải có URL dạng: `https://script.google.com/macros/s/.../exec`

---

## 📊 KẾT QUẢ MONG ĐỢI

### Trước khi chia (Sheet BN):
| STT | Name | Cham | MangCham | Xung | ... | Parafin |
|-----|------|------|----------|------|-----|---------|
| 1   | A    | x    | x        | x    | ... | x       |
| 2   | B    | x    |          | x    | ... | x       |

### Sau khi chia (Sheet BN):
| STT | Name | Cham        | MangCham | Xung        | ... | Parafin     |
|-----|------|-------------|----------|-------------|-----|-------------|
| 1   | A    | 07:55-UYEN  | 08:10-UYEN | 08:40-UYEN | ... | 08:28-HUYEN |
| 2   | B    | 07:52-UYEN  |          | 08:37-UYEN | ... | 08:22-HUYEN |

---

## 🆘 NẾU VẪN KHÔNG HOẠT ĐỘNG

Liên hệ với log đầy đủ từ:
1. Browser Console (F12)
2. Apps Script Executions (View → Executions)
3. Screenshot sheet BN trước và sau khi chạy
