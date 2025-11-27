/**
 * UI Handler cho Procedure Scheduler
 * Xử lý tương tác người dùng và hiển thị kết quả
 */

const googleSheetsService = new GoogleSheetsService();
const procedureScheduler = new ProcedureSchedulerV2();

// Progress tracking
let progressSteps = [
    { percent: 20, text: 'Đang đọc dữ liệu từ Google Sheets...' },
    { percent: 40, text: 'Đang xử lý danh sách bệnh nhân...' },
    { percent: 60, text: 'Đang phân bổ thủ thuật...' },
    { percent: 80, text: 'Đang cập nhật vào Google Sheets...' },
    { percent: 100, text: 'Hoàn thành!' }
];

function updateProgress(percent, text) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = percent + '%';
    progressText.textContent = text;
}

// Main function - Xử lý khi click nút "Chia Thủ Thuật"
document.getElementById('btnChiaTT').addEventListener('click', async () => {

    // Show loading
    document.getElementById('loading').classList.add('active');
    document.getElementById('results').classList.remove('active');
    document.getElementById('btnChiaTT').disabled = true;
    updateProgress(0, 'Đang chuẩn bị...');

    try {
        // Step 1: Read data from Google Sheets
        updateProgress(20, 'Đang đọc dữ liệu từ Google Sheets...');
        const patients = await googleSheetsService.readPatientList();
        const staffList = await googleSheetsService.readStaffList();
        const settings = await googleSheetsService.readSettings();

        console.log('Dữ liệu đã đọc:', { patients: patients.length, staff: staffList.length });

        // Step 2: Process scheduling
        updateProgress(40, 'Đang xử lý danh sách bệnh nhân...');
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for UX
        
        updateProgress(60, 'Đang phân bổ thủ thuật...');
        const result = await procedureScheduler.scheduleProcedures(patients, staffList, settings);

        // Step 3: Update to Google Sheets
        updateProgress(80, 'Đang cập nhật vào Google Sheets...');
        
        // Cập nhật kết quả vào sheet BN (ManageExcelTT)
        if (result.success && result.patients.length > 0) {
            console.log('📝 Đang cập nhật kết quả vào sheet BN (columns: Cham, MangCham, ..., GiacHoi)...');
            await googleSheetsService.updateResultsToBN(result.patients);
        }
        
        // Ghi kết quả vào sheet TT (ManageExcelPrintTT)
        if (result.success && result.scheduleData) {
            console.log('📝 Đang ghi kết quả vào sheet TT (arrBS grid)...');
            await googleSheetsService.writeResultsToTT(result.scheduleData);
        }

        // Step 4: Complete
        updateProgress(100, 'Hoàn thành!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Show results
        displayResults(result);

    } catch (error) {
        console.error('Lỗi:', error);
        
        // Show more helpful error message
        let errorMsg = error.message;
        if (error.message.includes('HTTP error')) {
            errorMsg = 'Không thể kết nối với Google Sheets. Vui lòng kiểm tra:\n' +
                      '1. Google Sheets đã được share công khai (Anyone with the link can view)\n' +
                      '2. Link Google Sheets đúng\n' +
                      '3. Kết nối internet\n\n' +
                      'Chi tiết lỗi: ' + error.message;
        }
        displayError({ message: errorMsg });
    } finally {
        document.getElementById('loading').classList.remove('active');
        document.getElementById('btnChiaTT').disabled = false;
    }
});

// Reset button - removed

/**
 * Hiển thị kết quả chia thủ thuật
 */
function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('resultSummary');
    const patientTableDiv = document.getElementById('patientTable');
    const scheduleTableDiv = document.getElementById('scheduleTable');

    resultsDiv.classList.add('active');

    if (result.success) {
        summaryDiv.className = 'result-summary';
        summaryDiv.innerHTML = `
            <h3>✅ Chia thủ thuật thành công!</h3>
            <p><strong>Tổng số bệnh nhân:</strong> ${result.patients.length}</p>
            <p><strong>Thời gian xử lý:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><strong>Đã cập nhật:</strong> Sheet BN (Result columns) và Sheet TT (Lịch phân bổ)</p>
        `;
    } else {
        summaryDiv.className = 'result-summary error';
        summaryDiv.innerHTML = `
            <h3>❌ Có lỗi xảy ra!</h3>
            <p>${result.error}</p>
        `;
    }

    // Display patient table với đầy đủ 14 procedures
    if (result.patients && result.patients.length > 0) {
        let tableHTML = `
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Giường</th>
                    <th>Tên BN</th>
                    <th>Giờ khám</th>
                    <th>Châm</th>
                    <th>Mãng Châm</th>
                    <th>Xung</th>
                    <th>Hồng Ngoại</th>
                    <th>Ròng Rọc</th>
                    <th>Parafin</th>
                    <th>Cấy</th>
                    <th>Ngâm</th>
                    <th>Xông</th>
                    <th>Bó</th>
                    <th>Xoa Máy</th>
                    <th>Xoa Tay</th>
                    <th>Cứu</th>
                    <th>Giác Hơi</th>
                </tr>
            </thead>
            <tbody>
        `;

        result.patients.forEach(patient => {
            tableHTML += `
                <tr>
                    <td>${patient.STT}</td>
                    <td>${patient.Code}</td>
                    <td>${patient.Name}</td>
                    <td>${patient.TimeKham}</td>
                    <td>${patient.Cham || '-'}</td>
                    <td>${patient.MangCham || '-'}</td>
                    <td>${patient.Xung || '-'}</td>
                    <td>${patient.HongNgoai || '-'}</td>
                    <td>${patient.RongRoc || '-'}</td>
                    <td>${patient.Parafin || '-'}</td>
                    <td>${patient.Cay || '-'}</td>
                    <td>${patient.Ngam || '-'}</td>
                    <td>${patient.Xong || '-'}</td>
                    <td>${patient.Bo || '-'}</td>
                    <td>${patient.XoaMay || '-'}</td>
                    <td>${patient.XoaTay || '-'}</td>
                    <td>${patient.Cuu || '-'}</td>
                    <td>${patient.GiacHoi || '-'}</td>
                </tr>
            `;
        });

        tableHTML += '</tbody>';
        patientTableDiv.innerHTML = tableHTML;
    }

    // Display schedule table (TT sheet)
    if (result.scheduleData) {
        const { dateTimes, arrBS, staffNames } = result.scheduleData;
        
        let scheduleHTML = `
            <thead>
                <tr>
                    <th>STT</th>
                    <th>Giờ</th>
                    ${staffNames.map(name => `<th>${name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
        `;

        for (let i = 0; i < dateTimes.length; i++) {
            scheduleHTML += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${dateTimes[i]}</td>
                    ${staffNames.map((_, j) => {
                        const value = (arrBS[i] && arrBS[i][j]) ? arrBS[i][j] : '';
                        return `<td>${value === 'x' ? '' : value}</td>`;
                    }).join('')}
                </tr>
            `;
        }

        scheduleHTML += '</tbody>';
        scheduleTableDiv.innerHTML = scheduleHTML;
    }
}

/**
 * Copy table to clipboard với format đẹp
 */
function copyTableToClipboard(tableId) {
    const table = document.getElementById(tableId);
    
    // Lấy data từ table
    const rows = Array.from(table.querySelectorAll('tr'));
    const textData = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.textContent.trim()).join('\t');
    }).join('\n');
    
    // Copy to clipboard
    navigator.clipboard.writeText(textData).then(() => {
        alert('✅ Đã copy bảng vào clipboard!\n\nBạn có thể paste trực tiếp vào Excel.');
    }).catch(err => {
        // Fallback method
        const textarea = document.createElement('textarea');
        textarea.value = textData;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Đã copy bảng vào clipboard!');
    });
}

/**
 * Export table to Excel - đơn giản như hình mẫu
 * Tạo file Excel với HTML table format
 */
function exportTableToExcel(tableId, filename) {
    const table = document.getElementById(tableId);
    
    // Tạo HTML với Excel XML format
    let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                table { border-collapse: collapse; }
                td, th { 
                    padding: 5px; 
                    mso-number-format:"\\@"; 
                }
            </style>
        </head>
        <body>
            ${table.outerHTML}
        </body>
        </html>
    `;
    
    // Tạo blob
    const blob = new Blob(['\ufeff', html], {
        type: 'application/vnd.ms-excel'
    });
    
    // Download file
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Event listeners for buttons
document.getElementById('btnCopyBN')?.addEventListener('click', () => {
    copyTableToClipboard('patientTable');
});

document.getElementById('btnExportBN')?.addEventListener('click', () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportTableToExcel('patientTable', `Danh_Sach_Benh_Nhan_${timestamp}`);
});

document.getElementById('btnCopyTT')?.addEventListener('click', () => {
    copyTableToClipboard('scheduleTable');
});

document.getElementById('btnExportTT')?.addEventListener('click', () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportTableToExcel('scheduleTable', `Lich_Thu_Thuat_${timestamp}`);
});

/**
 * Hiển thị lỗi
 */
function displayError(error) {
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('resultSummary');

    resultsDiv.classList.add('active');
    summaryDiv.className = 'result-summary error';
    summaryDiv.innerHTML = `
        <h3>❌ Lỗi kết nối!</h3>
        <p style="white-space: pre-wrap;">${error.message}</p>
    `;
}
