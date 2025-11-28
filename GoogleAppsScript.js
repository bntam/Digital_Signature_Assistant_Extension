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
    // Support both JSON body (old) and FormData (new - for CORS fix)
    let data;
    if (e.parameter && e.parameter.payload) {
      // FormData from Chrome Extension (to avoid CORS preflight)
      data = JSON.parse(e.parameter.payload);
    } else if (e.postData && e.postData.contents) {
      // JSON body (original method)
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }
    
    const action = data.action || 'createTT'; // default action
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Action: Cập nhật sheet BN
    if (action === 'updateBN') {
      return updateBNSheet(ss, data);
    }
    
    // Action: Ghi bulk data vào sheet BN (từ HIS modal)
    if (action === 'writeBulkBN') {
      return writeBulkBNSheet(ss, data);
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
 * Ghi bulk data vào sheet BN (từ HIS modal)
 * Ghi data từ cell B22 trở đi (17 cột: B-R)
 */
function writeBulkBNSheet(ss, data) {
  try {
    // Validate data
    if (!data.data || !Array.isArray(data.data)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid data format'
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
    
    const startCell = data.startCell || 'B22';
    const dataRows = data.data;
    
    // Parse start cell (e.g., "B22" -> row=22, col=2)
    const match = startCell.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid startCell format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const startCol = columnToNumber(match[1]);
    const startRow = parseInt(match[2]);
    
    // Clear old data first (from B22 to R with enough rows)
    const maxRows = Math.max(dataRows.length, 50);
    sheet.getRange(startRow, startCol, maxRows, 17).clearContent();
    
    // Write new data
    if (dataRows.length > 0) {
      const numCols = dataRows[0].length;
      sheet.getRange(startRow, startCol, dataRows.length, numCols).setValues(dataRows);
    }
    
    Logger.log('✅ Wrote ' + dataRows.length + ' rows to BN sheet starting at ' + startCell);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      action: 'writeBulkBN',
      rowsWritten: dataRows.length,
      startCell: startCell,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('❌ Error in writeBulkBNSheet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Convert column letter to number (A=1, B=2, ..., Z=26, AA=27, etc.)
 */
function columnToNumber(column) {
  let number = 0;
  for (let i = 0; i < column.length; i++) {
    number = number * 26 + (column.charCodeAt(i) - 64);
  }
  return number;
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
