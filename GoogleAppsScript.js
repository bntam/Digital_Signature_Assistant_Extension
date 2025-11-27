/**
 * GOOGLE APPS SCRIPT - API ENDPOINT ĐỂ GHI DỮ LIỆU VÀO GOOGLE SHEETS
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở Google Sheets → Extensions → Apps Script
 * 2. Copy toàn bộ code này vào editor
 * 3. Deploy → New deployment → Web app
 * 4. Execute as: Me
 * 5. Who has access: Anyone
 * 6. Copy URL và paste vào js/google-sheets-service.js (dòng 11)
 * 
 * CẬP NHẬT QUAN TRỌNG:
 * - Đã sửa colMap để cập nhật đúng các cột RESULT (E-R)
 * - KHÔNG CẬP NHẬT các cột Time (S-AG) nữa
 * - Cột E = Cham, F = MangCham, G = Xung, ... R = GiacHoi
 */

function doPost(e) {
  try {
    // Parse request body
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'createTT'; // default action
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Action: Cập nhật sheet BN
    if (action === 'updateBN') {
      return updateBNSheet(ss, data);
    }
    
    // Action: Tạo sheet TT
    if (action === 'createTT') {
      return createTTSheet(ss, data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Cập nhật kết quả thủ thuật vào sheet BN
 * CẬP NHẬT: Ghi vào các cột RESULT (E-R) thay vì Time columns (S-AG)
 */
function updateBNSheet(ss, data) {
  try {
    // Validate data
    if (!data.updates || !Array.isArray(data.updates)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid updates format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get sheet BN
    const sheet = ss.getSheetByName('BN');
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet BN not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ⭐ COLUMN MAPPING - RESULT COLUMNS (E-R) - INDICES 1-BASED
    // Column E (Châm) = 5, F (Mãng Châm) = 6, G (Xung) = 7, ...
    // KHÔNG PHẢI Time columns (S-AG) nữa!
    const colMap = {
      Cham: 5,           // Column E (Châm)
      MangCham: 6,       // Column F (Mãng Châm)
      Xung: 7,           // Column G (Xung)
      HongNgoai: 8,      // Column H (Hồng Ngoại)
      RongRoc: 9,        // Column I (Ròng Rọc)
      Parafin: 10,       // Column J (Parafin)
      Cay: 11,           // Column K (Cấy)
      Ngam: 12,          // Column L (Ngâm)
      Xong: 13,          // Column M (Xông)
      Bo: 14,            // Column N (Bó)
      XoaMay: 15,        // Column O (Xoa Máy)
      XoaTay: 16,        // Column P (Xoa Tay)
      Cuu: 17,           // Column Q (Cứu)
      GiacHoi: 18        // Column R (Giác Hơi)
    };
    
    let updatedCount = 0;
    
    // Get all STT values to find row numbers (Column A)
    const sttColumn = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    
    // Update each patient by STT
    data.updates.forEach(update => {
      const stt = update.STT;
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
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      action: 'updateBN',
      rowsUpdated: updatedCount,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Error in updateBNSheet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Update sheet TT với kết quả thủ thuật (grid format)
 * Match C# ManageExcelPrintTT() - UPDATE theo STT, không create mới
 * Sheet TT phải có sẵn với columns: STT, Giờ, và các staff names
 */
function createTTSheet(ss, data) {
  try {
    // Log received data for debugging
    Logger.log('📥 Received data for TT sheet');
    Logger.log('   staffNames: ' + JSON.stringify(data.staffNames));
    Logger.log('   updates count: ' + (data.updates ? data.updates.length : 0));
    
    // Validate data - Extension gửi staffNames và updates
    if (!data.staffNames || !data.updates || !Array.isArray(data.staffNames) || !Array.isArray(data.updates)) {
      Logger.log('❌ Invalid data format');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid data format - expecting staffNames and updates arrays'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get sheet TT
    let sheet = ss.getSheetByName('TT');
    if (!sheet) {
      Logger.log('❌ Sheet TT not found');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet TT not found - please create it first with STT column'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('✅ Sheet TT found, rows: ' + sheet.getLastRow() + ', cols: ' + sheet.getLastColumn());
    
    // Get all STT values from column A to find row numbers
    const sttColumn = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    Logger.log('📋 STT column has ' + sttColumn.length + ' rows');
    
    // Get header row to find staff column positions
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Logger.log('📋 Header row: ' + JSON.stringify(headerRow));
    
    // Map staff names to column numbers
    const staffColMap = {};
    data.staffNames.forEach(staffName => {
      const colIndex = headerRow.indexOf(staffName);
      if (colIndex !== -1) {
        staffColMap[staffName] = colIndex + 1; // 1-based
        Logger.log('   ✅ Mapped: ' + staffName + ' → column ' + (colIndex + 1));
      } else {
        Logger.log('   ⚠️ NOT FOUND in header: ' + staffName);
      }
    });
    
    Logger.log('📋 Staff column mapping: ' + JSON.stringify(staffColMap));
    
    let updatedCount = 0;
    
    // Update each row by STT (match C# logic)
    data.updates.forEach(update => {
      const stt = update.STT;
      const staffData = update.data; // Array of values for each staff
      
      // Find row number by matching STT in column A
      let rowNumber = -1;
      for (let i = 0; i < sttColumn.length; i++) {
        if (sttColumn[i][0].toString() === stt.toString()) {
          rowNumber = i + 2; // +2 for header row and 0-based index
          break;
        }
      }
      
      if (rowNumber === -1) {
        Logger.log('⚠️ Warning: STT ' + stt + ' not found in TT sheet');
        return;
      }
      
      // Update Giờ column (column B)
      sheet.getRange(rowNumber, 2).setValue(update.time);
      
      // Update each staff column with corresponding data
      data.staffNames.forEach((staffName, index) => {
        const colNum = staffColMap[staffName];
        if (colNum) {
          const value = staffData[index] || '';
          sheet.getRange(rowNumber, colNum).setValue(value);
          Logger.log('✅ Updated TT: STT=' + stt + ' Row=' + rowNumber + ' Staff=' + staffName + ' Col=' + colNum + ' Value=' + value);
        }
      });
      
      updatedCount++;
    });
    
    Logger.log('✅ Updated ' + updatedCount + ' rows in TT sheet');
    
    // Return success
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      action: 'createTT',
      rowsUpdated: updatedCount,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Error in createTTSheet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * TEST FUNCTION - Cập nhật sheet BN
 * Chạy hàm này để test xem có update đúng cột không
 */
function testUpdateBN() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        action: 'updateBN',
        updates: [
          {
            STT: '1',  // Thay bằng STT thật trong sheet của bạn
            data: {
              Cham: '08:30-KTV01',      // Column E
              Xung: '09:00-KTV02',      // Column G
              Parafin: '09:30-KTV01'    // Column J
            }
          },
          {
            STT: '2',  // Thay bằng STT thật trong sheet của bạn
            data: {
              Cham: '08:45-KTV02',      // Column E
              Ngam: '09:15-KTV03'       // Column L
            }
          }
        ]
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}

/**
 * TEST FUNCTION - Tạo sheet TT
 * ⭐ CẬP NHẬT: Dùng format mới với staffNames và updates
 */
function testCreateTT() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        action: 'createTT',
        staffNames: ['KIET', 'LAN', 'TRAI', 'HONG'],
        updates: [
          { STT: '1', time: '7:01', data: ['G01-Cham', '', '', ''] },
          { STT: '2', time: '7:04', data: ['', 'G02-Xung', '', ''] },
          { STT: '3', time: '7:07', data: ['', '', 'G03-Ngam', ''] },
          { STT: '4', time: '7:10', data: ['', '', '', 'G04-Parafin'] },
          { STT: '5', time: '7:13', data: ['G05-Cham', 'G06-Xung', '', ''] }
        ]
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
