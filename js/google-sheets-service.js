/**
 * Google Sheets Service
 * Service để đọc dữ liệu từ Google Sheets (Public Access)
 * Không cần API Key - chỉ cần share Google Sheets với "Anyone with the link"
 */

class GoogleSheetsService {
    constructor() {
        // Google Sheets ID từ URL
        // https://docs.google.com/spreadsheets/d/18s8RPoITbVq3StIdG6VUDoZi7GpZfdxIWr6XvBB_FlY/edit?usp=sharing
        this.spreadsheetId = '18s8RPoITbVq3StIdG6VUDoZi7GpZfdxIWr6XvBB_FlY';
        this.baseUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
        
        // Web App URL for writing data to TT sheet
        // ✅ ĐÃ SETUP GOOGLE APPS SCRIPT
        this.webAppUrl = 'https://script.google.com/macros/s/AKfycbyXy6Kkuw9ZznF0MLFTxH_Sw83qXgs9Ifeu3e6MARWSCuWkAHOB7aHBVZP0zHdkU0Ag/exec';
    }

    /**
     * Write bulk data to BN sheet starting at B22
     * @param {Array<Array>} dataRows - Array of data rows (no header)
     */
    async writeBulkData(dataRows) {
        const payload = {
            action: 'writeBulkBN',
            data: dataRows,
            startCell: 'B22'
        };

        // Use FormData to avoid CORS preflight
        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));

        const response = await fetch(this.webAppUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error || 'Unknown error');
        }

        return result;
    }

    /**
     * Đọc dữ liệu từ sheet cụ thể bằng tên sheet
     * Không cần API Key
     */
    async readSheet(sheetName) {
        // Sử dụng Google Visualization API Query để đọc theo tên sheet
        // Format: https://docs.google.com/spreadsheets/d/{id}/gviz/tq?tqx=out:csv&sheet={sheetName}
        const encodedSheetName = encodeURIComponent(sheetName);
        const url = `${this.baseUrl}/gviz/tq?tqx=out:csv&sheet=${encodedSheetName}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}. Vui lòng kiểm tra:\n1. Google Sheets đã được share công khai\n2. Sheet có tên "${sheetName}" tồn tại (phân biệt HOA/thường)`);
            }
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.error('Lỗi đọc Google Sheets:', error);
            throw error;
        }
    }

    /**
     * Parse CSV text thành array
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const result = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Simple CSV parser (handling quoted fields)
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const nextChar = line[j + 1];
                
                if (char === '"' && inQuotes && nextChar === '"') {
                    current += '"';
                    j++; // Skip next quote
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current); // Add last value
            
            result.push(values);
        }
        
        return result;
    }

    /**
     * Đọc danh sách bệnh nhân (sheet BN)
     * Đọc theo tên column header như C# (Reader["Column Name"])
     */
    async readPatientList() {
        const values = await this.readSheet('BN');
        if (values.length === 0) return [];
        
        // Row đầu tiên là headers
        const headers = values[0];
        const dataRows = values.slice(1);
        
        // Tạo map từ tên column sang index
        const getColumnValue = (row, columnName) => {
            const index = headers.indexOf(columnName);
            return index !== -1 ? (row[index] || '') : '';
        };
        
        return dataRows.map((row, index) => ({
            STT: getColumnValue(row, 'STT') || (index + 1).toString(),
            Code: getColumnValue(row, 'Giường'),
            Name: getColumnValue(row, 'Tên bệnh nhân'),
            TimeKham: getColumnValue(row, 'Giờ khám'),
            RaVien: getColumnValue(row, 'Ra viện'),
            
            // Các thủ thuật
            Cham: getColumnValue(row, 'Cham'),
            MangCham: getColumnValue(row, 'MangCham'),
            Xung: getColumnValue(row, 'Xung'),
            HongNgoai: getColumnValue(row, 'HongNgoai'),
            RongRoc: getColumnValue(row, 'RongRoc'),
            Parafin: getColumnValue(row, 'Parafin'),
            Cay: getColumnValue(row, 'Cay'),
            Ngam: getColumnValue(row, 'Ngam'),
            Xong: getColumnValue(row, 'Xong'),
            Bo: getColumnValue(row, 'Bo'),
            XoaMay: getColumnValue(row, 'XoaMay'),
            XoaTay: getColumnValue(row, 'XoaTay'),
            Cuu: getColumnValue(row, 'Cuu'),
            GiacHoi: getColumnValue(row, 'GiacHoi'),
            
            // Time thủ thuật
            ttCham: getColumnValue(row, 'Time Châm'),
            ttMangCham: getColumnValue(row, 'Time Mãng Châm'),
            ttXung: getColumnValue(row, 'Time Xung'),
            ttHongNgoai: getColumnValue(row, 'Time Hồng Ngoại'),
            ttRongRoc: getColumnValue(row, 'Time Ròng Rọc'),
            ttParafin: getColumnValue(row, 'Time Parafin'),
            ttCay: getColumnValue(row, 'Time Cấy'),
            ttNgam: getColumnValue(row, 'Time Ngâm'),
            ttXong: getColumnValue(row, 'Time Xông'),
            ttBo: getColumnValue(row, 'Time Bó'),
            ttXoaMay: getColumnValue(row, 'Time Xoa máy'),
            ttXoaTay: getColumnValue(row, 'Time Xoa tay'),
            ttCuu: getColumnValue(row, 'Time Cứu'),
            ttGiacHoi: getColumnValue(row, 'Time Giác Hơi')
        }));
    }

    /**
     * Đọc danh sách bác sĩ/kỹ thuật viên (sheet BS)
     * Đọc theo tên column header như C# (Reader["Column Name"])
     */
    async readStaffList() {
        const values = await this.readSheet('BS');
        if (values.length === 0) return [];
        
        // Row đầu tiên là headers
        const headers = values[0];
        const dataRows = values.slice(1);
        
        // Tạo map từ tên column sang index
        const getColumnValue = (row, columnName) => {
            const index = headers.indexOf(columnName);
            return index !== -1 ? (row[index] || '') : '';
        };
        
        return dataRows.map((row, index) => ({
            STT: getColumnValue(row, 'STT') || (index + 1).toString(),
            Code: getColumnValue(row, 'Mã KTV'),
            Name: getColumnValue(row, 'Tên KTV'),
            Role: getColumnValue(row, 'Chức danh'),
            LeaveSang: getColumnValue(row, 'Nghỉ buổi sáng'),
            LeaveChieu: getColumnValue(row, 'Nghỉ buổi chiều'),
            StartTimeMorning: getColumnValue(row, 'Giờ bắt đầu buổi sáng'),
            EndTimeMorning: getColumnValue(row, 'Giờ kết thúc buổi sáng'),
            StartTimeAfternoon: getColumnValue(row, 'Giờ bắt đầu buổi chiều'),
            EndTimeAfternoon: getColumnValue(row, 'Giờ kết thúc buổi chiều'),
            ThuThuat: getColumnValue(row, 'Thủ thuật')
        }));
    }

    /**
     * Đọc cài đặt (sheet Setting)
     * Đọc theo tên column header như C# (Reader["Column Name"])
     */
    async readSettings() {
        const values = await this.readSheet('Setting');
        if (values.length < 2) return null;
        
        // Row đầu tiên là headers
        const headers = values[0];
        const dataRow = values[1]; // Chỉ có 1 dòng setting
        
        // Tạo map từ tên column sang index
        const getColumnValue = (columnName) => {
            const index = headers.indexOf(columnName);
            return index !== -1 ? (dataRow[index] || '') : '';
        };
        
        return {
            MorningStart: getColumnValue('Giờ BĐ sáng') || '7.00',
            MorningEnd: getColumnValue('Giờ KT sáng') || '11.30',
            AfternoonStart: getColumnValue('Giờ BĐ chiều') || '13.00',
            AfternoonEnd: getColumnValue('Giờ KT chiều') || '17.00',
            SLNgam: getColumnValue('SL chậu ngâm') || '2',
            SLXong: getColumnValue('SL chậu xông') || '2',
            SLXung: getColumnValue('SL máy xung') || '2',
            SLBo: getColumnValue('SL máy bó') || '2',
            TimeNext: getColumnValue('Khoảng thời gian cách nhau TT') || '3'
        };
    }

    /**
     * Parse giá trị thủ thuật an toàn
     * @param {*} value - Giá trị có thể là string "08:30-KTV01" hoặc các kiểu khác
     * @param {number} index - 0 = time, 1 = staff code
     * @returns {string} Giá trị đã parse hoặc empty string
     */
    parseProcedureValue(value, index) {
        if (!value) return '';
        
        // Nếu là string và có format đúng
        if (typeof value === 'string' && value.includes('-')) {
            const parts = value.split('-');
            if (index === 0) {
                // Return time part, replace : with .
                return parts[0] ? parts[0].replace(':', '.') : '';
            } else if (index === 1) {
                // Return staff code part
                return parts[1] || '';
            }
        }
        
        // Nếu không đúng format, return empty
        return '';
    }

    /**
     * Cập nhật kết quả thủ thuật vào sheet BN (Google Sheets)
     * Match C# ManageExcelTT() - Update columns: Cham, MangCham, Xung, etc.
     * Format: "HH:mm-KTV" hoặc "x" nếu không làm được
     * @param {Array} patients - Mảng bệnh nhân đã được phân bổ thủ thuật
     * @returns {Promise<boolean>} True nếu ghi thành công
     */
    async updateResultsToBN(patients) {
        try {
            console.log('📝 Chuẩn bị cập nhật kết quả vào sheet BN...');
            
            // Chuẩn bị dữ liệu theo format C#: "HH:mm-KTV" hoặc "x"
            // Columns: E=Cham, F=MangCham, G=Xung, H=HongNgoai, I=RongRoc, J=Parafin, 
            //          K=Cay, L=Ngam, M=Xong, N=Bo, O=XoaMay, P=XoaTay, Q=Cuu, R=GiacHoi
            
            const updates = patients.map((patient) => ({
                STT: patient.STT,
                data: {
                    Cham: patient.Cham || '',
                    MangCham: patient.MangCham || '',
                    Xung: patient.Xung || '',
                    HongNgoai: patient.HongNgoai || '',
                    RongRoc: patient.RongRoc || '',
                    Parafin: patient.Parafin || '',
                    Cay: patient.Cay || '',
                    Ngam: patient.Ngam || '',
                    Xong: patient.Xong || '',
                    Bo: patient.Bo || '',
                    XoaMay: patient.XoaMay || '',
                    XoaTay: patient.XoaTay || '',
                    Cuu: patient.Cuu || '',
                    GiacHoi: patient.GiacHoi || ''
                }
            }));
            
            console.log('📊 Dữ liệu cập nhật sheet BN (ManageExcelTT format):', updates);
            
            // Kiểm tra Web App URL đã được cấu hình chưa
            if (!this.webAppUrl || this.webAppUrl === '') {
                console.warn('⚠️ Web App URL chưa được cấu hình - bỏ qua ghi sheet BN');
                console.log('ℹ️ Kết quả đã hiển thị trên màn hình. Để TỰ ĐỘNG GHI vào Google Sheets, cần setup Google Apps Script.');
                console.log('📖 Xem hướng dẫn: GOOGLE_APPS_SCRIPT_SETUP.md');
                return false;
            }
            
            // Gọi Web App API để cập nhật sheet BN
            console.log('🚀 Đang gửi cập nhật đến sheet BN...');
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'updateBN',
                    updates: updates 
                })
            });
            
            console.log('✅ Đã gửi cập nhật', updates.length, 'bản ghi vào sheet BN (columns: Cham, MangCham, ..., GiacHoi)');
            
            return true;
            
        } catch (error) {
            console.error('❌ Lỗi cập nhật sheet BN:', error);
            return false;
        }
    }

    /**
     * Ghi kết quả thủ thuật vào sheet TT (Google Sheets)
     * Match C# ManageExcelPrintTT() - Update theo arrBS grid
     * Format: Mỗi row là 1 time slot, mỗi column là 1 staff, value là "Code-Procedure"
     * @param {Object} scheduleData - Object chứa arrBS (grid) và staffNames (column headers)
     * @returns {Promise<boolean>} True nếu ghi thành công
     */
    async writeResultsToTT(scheduleData) {
        try {
            console.log('📝 Chuẩn bị ghi kết quả vào sheet TT (ManageExcelPrintTT format)...');
            
            // scheduleData có format:
            // {
            //   dateTimes: [DateTime array],
            //   arrBS: [2D array],
            //   staffNames: [staff names array]
            // }
            
            const { dateTimes, arrBS, staffNames } = scheduleData;
            
            if (!dateTimes || !arrBS || !staffNames) {
                console.error('❌ scheduleData không hợp lệ:', scheduleData);
                return false;
            }
            
            // Chuẩn bị data theo C# logic:
            // - Row đầu: STT + staff names (column headers)
            // - Data rows: STT + time + procedures for each staff
            
            const updates = [];
            
            for (let i = 0; i < dateTimes.length; i++) {
                const STT = (i + 1).toString();
                const dataLst = [];
                
                // Lấy data từ arrBS[i][j] cho tất cả staff
                for (let j = 0; j < staffNames.length; j++) {
                    const value = (arrBS[i] && arrBS[i][j]) ? arrBS[i][j] : '';
                    dataLst.push(value === 'x' ? '' : value);
                }
                
                updates.push({
                    STT: STT,
                    time: dateTimes[i],
                    data: dataLst
                });
            }
            
            console.log('📊 Dữ liệu cập nhật sheet TT:');
            console.log('  - Staff names (columns):', staffNames);
            console.log('  - Time slots:', updates.length);
            console.log('  - Sample row:', updates[0]);
            
            // Kiểm tra Web App URL
            if (!this.webAppUrl || this.webAppUrl === '') {
                console.warn('⚠️ Web App URL chưa được cấu hình - bỏ qua ghi sheet TT');
                console.log('ℹ️ Kết quả đã hiển thị trên màn hình. Để TỰ ĐỘNG GHI vào Google Sheets, cần setup Google Apps Script.');
                console.log('📖 Xem hướng dẫn: GOOGLE_APPS_SCRIPT_SETUP.md');
                return false;
            }
            
            // Gọi Web App API để update sheet TT
            console.log('🚀 Đang gửi cập nhật đến sheet TT...');
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    action: 'createTT',
                    staffNames: staffNames,
                    updates: updates
                })
            });
            
            console.log('✅ Đã gửi cập nhật', updates.length, 'time slots vào sheet TT');
            console.log('ℹ️ Vui lòng kiểm tra sheet TT trong Google Sheets để xác nhận');
            
            //alert(`✅ Đã gửi ${updates.length} time slots đến Google Sheets.\n\nVui lòng kiểm tra sheet "TT" để xác nhận kết quả.`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Lỗi ghi kết quả vào sheet TT:', error);
            alert(`❌ Lỗi khi ghi dữ liệu: ${error.message}\n\nVui lòng kiểm tra Console (F12) để xem chi tiết.`);
            throw error;
        }
    }
    
    /**
     * Export dữ liệu để ghi vào Google Sheets
     * Note: Đã được thay thế bằng writeResultsToTT()
     */
    prepareExportData(patients) {
        return patients.map(patient => [
            patient.STT,
            patient.Code,
            patient.Name,
            patient.TimeKham,
            patient.RaVien,
            patient.Cham,
            patient.MangCham,
            patient.Xung,
            patient.HongNgoai,
            patient.RongRoc,
            patient.Parafin,
            patient.Cay,
            patient.Ngam,
            patient.Xong,
            patient.Bo,
            patient.XoaMay,
            patient.XoaTay,
            patient.Cuu,
            patient.GiacHoi
        ]);
    }
}

// Export service
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsService;
}
