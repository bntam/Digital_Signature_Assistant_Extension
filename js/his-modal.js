// HIS Modal for patient list from API
(function(){
  const baseUrl = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
  let uuid = null;
  let lstBenhNhan = [];

  const modal = document.getElementById('hisModal');
  const closeBtn = document.getElementById('hisCloseBtn');
  const dateInput = document.getElementById('hisDateCheck');
  const loadBtn = document.getElementById('hisLoadBtn');
  const copyWithHeaderBtn = document.getElementById('hisCopyWithHeaderBtn');
  const copyDataOnlyBtn = document.getElementById('hisCopyDataOnlyBtn');
  const sendToSheetsBtn = document.getElementById('hisSendToSheetsBtn');
  const statusEl = document.getElementById('hisStatus');
  const progressEl = document.getElementById('hisProgress');
  const progressFill = document.getElementById('hisProgressFill');
  const progressText = document.getElementById('hisProgressText');
  const errorEl = document.getElementById('hisError');
  const tableEl = document.getElementById('hisTable');
  const tbody = document.getElementById('hisTableBody');

  // Initialize date picker with default value (next working day)
  function initDate() {
    const today = new Date();
    let numberDay = 1;
    if (today.getDay() === 5) numberDay = 3; // Friday
    else if (today.getDay() === 6) numberDay = 2; // Saturday
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + numberDay);
    dateInput.valueAsDate = checkDate;
  }

  // Get UUID from storage
  function getUuid() {
    uuid = sessionStorage.getItem('uuid') || localStorage.getItem('uuid');
    if (!uuid) {
      showError('Không tìm thấy UUID. Vui lòng đăng nhập trước.');
      return false;
    }
    return true;
  }

  function showStatus(msg, isError) {
    statusEl.textContent = msg;
    statusEl.className = 'his-status ' + (isError ? 'error' : 'success');
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('active');
    tableEl.style.display = 'none';
    progressEl.classList.remove('active');
  }

  function showProgress(show, percent = 0, text = 'Đang tải dữ liệu...') {
    if (show) {
      progressEl.classList.add('active');
      errorEl.classList.remove('active');
      tableEl.style.display = 'none';
      progressFill.style.width = percent + '%';
      progressText.textContent = text;
    } else {
      progressEl.classList.remove('active');
      tableEl.style.display = 'table';
    }
  }

  // Load all patients from API
  async function loadAllBenhNhan() {
    const _gridSQL = 'NTU02D021.EV001';
    const objData = {
      TG_NHAPVIEN_TU: '-1', TG_NHAPVIEN_DEN: '-1', TRANGTHAIKHAMBENH: '4',
      KHOAID: '42481', PHONGID: '-1', LOAITIEPNHANID: '0', BACSYDIEUTRIID: '0',
      LOAINGAY: '-1', TRANGTHAITIEPNHAN: '-1', DIEUTRIKETHOP: '-1', NGUOINHA: '2',
      MABENHAN: '-1', MABENHNHAN: '-1', TENBENHNHAN: '-1', MABHYT: '-1',
      CHUATAOPDT: '-1', CHUATAOTHUOC: '-1'
    };
    const _postdata = {
      func: 'ajaxExecuteQueryPaging', uuid: uuid, params: [_gridSQL],
      options: [{ name: '[0]', value: JSON.stringify(objData) }]
    };
    const _querydata = JSON.stringify(_postdata);
    const url = `${baseUrl}?_search=false&rows=1000&page=1&sidx=&sord=asc&postData=${encodeURIComponent(_querydata)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.rows || [];
  }

  // Load procedures for one patient
  async function loadPTTTByOne(bn) {
    const _gridSQL = 'NT.024.DSPHIEUCLS';
    const _postdata = {
      func: 'ajaxExecuteQueryPaging', uuid: uuid, params: [_gridSQL],
      options: [
        { name: '[0]', value: bn.KHAMBENHID },
        { name: '[1]', value: bn.BENHNHANID },
        { name: '[2]', value: 5 },
        { name: '[3]', value: bn.HOSOBENHANID }
      ]
    };
    const _querydata = JSON.stringify(_postdata);
    const url = `${baseUrl}?_search=false&rows=1000&page=1&sidx=&sord=asc&postData=${encodeURIComponent(_querydata)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.rows || [];
  }

  // Load procedure details
  async function loadChiTietDvByPTTT(mauBenhPhamId) {
    const _gridSQL = 'NT.024.3.VS2';
    const _postdata = {
      func: 'ajaxExecuteQueryPaging', uuid: uuid, params: [_gridSQL],
      options: [{ name: '[0]', value: { MAUBENHPHAMID: mauBenhPhamId } }]
    };
    const _querydata = JSON.stringify(_postdata);
    const url = `${baseUrl}?_search=false&rows=1000&page=1&sidx=&sord=asc&postData=${encodeURIComponent(_querydata)}`;
    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.rows || [];
  }

  // Parse procedures and times
  async function loadThoiGianKhamNgayMai(bn, checkDateStr) {
    const dates = [];
    for (const pttt of bn.PTTT) {
      const ptttDate = pttt.NGAYMAUBENHPHAM.split(' ')[0]; // DD/MM/YYYY
      if (checkDateStr === ptttDate) {
        const [d, m, y, h, min] = pttt.NGAYMAUBENHPHAM.match(/(\d+)/g);
        dates.push(new Date(y, m - 1, d, h, min));
        
        const chiTiet = await loadChiTietDvByPTTT(pttt.MAUBENHPHAMID);
        for (const dv of chiTiet) {
          const ten = dv.TENDICHVU.toUpperCase();
          if (ten.includes('ĐIỆN CHÂM') || ten.includes('HÀO CHÂM') || ten.includes('ÔN CHÂM') || ten.includes('NHĨ CHÂM')) bn.Cham = 'x';
          if (ten.includes('MÃNG CHÂM') || ten.includes('THUỶ CHÂM') || ten.includes('THỦY CHÂM')) bn.MangCham = 'x';
          if (ten.includes('XUNG')) bn.Xung = 'x';
          if (ten.includes('HỒNG NGOẠI')) bn.HongNgoai = 'x';
          if (ten.includes('RÒNG RỌC')) bn.RongRoc = 'x';
          if (ten.includes('PARAFIN')) bn.Parafin = 'x';
          if (ten.includes('CẤY')) bn.Cay = 'x';
          if (ten.includes('NGÂM')) bn.Ngam = 'x';
          if (ten.includes('XÔNG')) bn.Xong = 'x';
          if (ten.includes('BÓ THUỐC')) bn.Bo = 'x';
          if (ten.includes('MÁY') && ten.includes('XOA')) bn.XoaMay = 'x';
          if (ten.includes('TAY') && ten.includes('XOA')) bn.XoaTay = 'x';
          if (ten === 'CỨU') bn.Cuu = 'x';
          if (ten.includes('GIÁC HƠI')) bn.GiacHoi = 'x';
        }
      }
    }
    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates));
      bn.GioKham = `${String(maxDate.getHours()).padStart(2,'0')}.${String(maxDate.getMinutes()).padStart(2,'0')}`;
    }
    return bn;
  }

  // Format date from input to DD/MM/YYYY
  function formatDate(dateInput) {
    const d = dateInput.valueAsDate || new Date();
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }

  // Render table
  function renderTable() {
    tbody.innerHTML = '';
    lstBenhNhan.forEach(bn => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${bn.TENGIUONG || ''}</td>
        <td>${bn.TENBENHNHAN || ''}</td>
        <td>${bn.GioKham || ''}</td>
        <td>${bn.Cham || ''}</td>
        <td>${bn.MangCham || ''}</td>
        <td>${bn.Xung || ''}</td>
        <td>${bn.HongNgoai || ''}</td>
        <td>${bn.RongRoc || ''}</td>
        <td>${bn.Parafin || ''}</td>
        <td>${bn.Cay || ''}</td>
        <td>${bn.Ngam || ''}</td>
        <td>${bn.Xong || ''}</td>
        <td>${bn.Bo || ''}</td>
        <td>${bn.XoaMay || ''}</td>
        <td>${bn.XoaTay || ''}</td>
        <td>${bn.Cuu || ''}</td>
        <td>${bn.GiacHoi || ''}</td>
      `;
      tbody.appendChild(tr);
    });
    showStatus(`Đã tải ${lstBenhNhan.length} bệnh nhân`, false);
  }

  // Copy table with header
  async function copyWithHeader() {
    const headers = ['Giường', 'Tên bệnh nhân', 'Giờ khám', 'Châm', 'Mãng Châm', 'Xung', 'Hồng Ngoại', 'Ròng Rọc', 'Parafin', 'Cấy', 'Ngâm', 'Xông', 'Bó', 'Xoa máy', 'Xoa tay', 'Cứu', 'Giác Hơi'];
    let tsv = headers.join('\t') + '\n';
    lstBenhNhan.forEach(bn => {
      tsv += [bn.TENGIUONG, bn.TENBENHNHAN, bn.GioKham, bn.Cham, bn.MangCham, bn.Xung, bn.HongNgoai, bn.RongRoc, bn.Parafin, bn.Cay, bn.Ngam, bn.Xong, bn.Bo, bn.XoaMay, bn.XoaTay, bn.Cuu, bn.GiacHoi].map(v => v || '').join('\t') + '\n';
    });
    await navigator.clipboard.writeText(tsv);
    showStatus('✅ Đã copy bảng có header!', false);
  }

  // Copy data only (no header)
  async function copyDataOnly() {
    let tsv = '';
    lstBenhNhan.forEach(bn => {
      tsv += [bn.TENGIUONG, bn.TENBENHNHAN, bn.GioKham, bn.Cham, bn.MangCham, bn.Xung, bn.HongNgoai, bn.RongRoc, bn.Parafin, bn.Cay, bn.Ngam, bn.Xong, bn.Bo, bn.XoaMay, bn.XoaTay, bn.Cuu, bn.GiacHoi].map(v => v || '').join('\t') + '\n';
    });
    await navigator.clipboard.writeText(tsv);
    showStatus('✅ Đã copy data (không có header)!', false);
  }

  // Send data to Google Sheets
  async function sendToGoogleSheets() {
    showProgress(true, 10, 'Đang chuẩn bị dữ liệu...');
    
    try {
      // Convert lstBenhNhan to 2D array (no header)
      const dataRows = lstBenhNhan.map(bn => [
        bn.TENGIUONG || '',
        bn.TENBENHNHAN || '',
        bn.GioKham || '',
        bn.Cham || '',
        bn.MangCham || '',
        bn.Xung || '',
        bn.HongNgoai || '',
        bn.RongRoc || '',
        bn.Parafin || '',
        bn.Cay || '',
        bn.Ngam || '',
        bn.Xong || '',
        bn.Bo || '',
        bn.XoaMay || '',
        bn.XoaTay || '',
        bn.Cuu || '',
        bn.GiacHoi || ''
      ]);

      showProgress(true, 30, 'Đang gửi dữ liệu đến Google Sheets...');
      
      const sheetsService = new GoogleSheetsService();
      const result = await sheetsService.writeBulkData(dataRows);
      
      showProgress(true, 100, 'Hoàn tất!');
      setTimeout(() => {
        showProgress(false);
        showStatus(`✅ Đã ghi ${result.rowsWritten} dòng vào Google Sheets (từ B22)!`, false);
        
        // Open Google Sheets in new tab
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetsService.spreadsheetId}/edit#gid=0`;
        window.open(sheetUrl, '_blank');
      }, 500);
      
    } catch (err) {
      console.error('Send to Sheets error:', err);
      showProgress(false);
      showStatus('❌ Lỗi gửi dữ liệu: ' + err.message, true);
    }
  }

  // Load data with real-time progress
  loadBtn.addEventListener('click', async () => {
    if (!getUuid()) return;
    showProgress(true, 5, 'Đang kết nối...');
    showStatus('', false);
    
    try {
      const checkDateStr = formatDate(dateInput);
      
      showProgress(true, 10, 'Đang tải danh sách bệnh nhân...');
      let patients = await loadAllBenhNhan();
      
      lstBenhNhan = [];
      const totalPatients = patients.length;
      
      for (let i = 0; i < totalPatients; i++) {
        const bn = patients[i];
        const percent = 10 + Math.floor((i / totalPatients) * 80);
        showProgress(true, percent, `Đang xử lý bệnh nhân ${i + 1}/${totalPatients}...`);
        
        bn.TENGIUONG = (bn.TENGIUONG || '').replace('Giường', '').trim();
        bn.GioKham = ''; bn.Cham = ''; bn.MangCham = ''; bn.Xung = ''; bn.HongNgoai = '';
        bn.RongRoc = ''; bn.Parafin = ''; bn.Cay = ''; bn.Ngam = ''; bn.Xong = '';
        bn.Bo = ''; bn.XoaMay = ''; bn.XoaTay = ''; bn.Cuu = ''; bn.GiacHoi = '';
        
        bn.PTTT = await loadPTTTByOne(bn);
        await loadThoiGianKhamNgayMai(bn, checkDateStr);
        
        // Only include patients with procedures
        if (bn.PTTT && bn.PTTT.length > 0) {
          lstBenhNhan.push(bn);
        }
      }
      
      showProgress(true, 95, 'Đang hoàn tất...');
      renderTable();
      showProgress(false);
      
    } catch (err) {
      console.error('Load error:', err);
      showError('Lỗi: ' + err.message);
      showStatus('❌ Lỗi tải dữ liệu', true);
    }
  });

  copyWithHeaderBtn.addEventListener('click', () => {
    if (lstBenhNhan.length === 0) {
      showStatus('❌ Chưa có dữ liệu', true);
      return;
    }
    copyWithHeader();
  });

  copyDataOnlyBtn.addEventListener('click', () => {
    if (lstBenhNhan.length === 0) {
      showStatus('❌ Chưa có dữ liệu', true);
      return;
    }
    copyDataOnly();
  });

  sendToSheetsBtn.addEventListener('click', () => {
    if (lstBenhNhan.length === 0) {
      showStatus('❌ Chưa có dữ liệu', true);
      return;
    }
    sendToGoogleSheets();
  });

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Auto-init on page load
  initDate();
  if (getUuid()) {
    showStatus('UUID đã có. Click "Tải dữ liệu" để bắt đầu.', false);
  }

  // Expose open function
  window.openHISModal = function() {
    modal.classList.add('active');
    initDate();
    if (getUuid()) {
      showStatus('Sẵn sàng tải dữ liệu', false);
    }
  };
})();
