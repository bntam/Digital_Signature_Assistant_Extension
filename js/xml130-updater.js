// XML130 BHYT Updater - Main Logic with Table View
// Handles searching and updating medicine usage data

class XML130Updater {
    constructor() {
        this.apiService = null;
        this.allMedicines = []; // Store all searched medicine data
        this.selectedMedicines = []; // Store selected medicines for update
        this.allPatients = []; // Store all patients data
        this.selectedPatients = []; // Store selected patients
        this.isProcessing = false;
        
        // Sorting state for patients table
        this.currentSortField = null;
        this.currentSortOrder = 'asc'; // 'asc' or 'desc'
        
        // Target medicines to filter (priority order)
        this.targetMedicines = ['Cam thảo', 'Độc hoạt', 'Đại táo'];
        
        // Medicine usage templates
        this.medicineUsageMap = {
            'Cam thảo': 'Uống ngày 2 lần, sáng và tối, sau ăn',
            'Độc hoạt': 'Uống ngày 2 lần, sáng và tối, sau ăn',
            'Đại táo': 'Uống ngày 3 lần, sau ăn'
        };
        
        // Statistics
        this.stats = {
            total: 0,
            selected: 0,
            success: 0,
            error: 0
        };

        // Patient statistics
        this.patientStats = {
            total: 0,
            selected: 0,
            warning: 0
        };

        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing XML130 Updater...');
        
        // Initialize API Service
        this.apiService = new ApiService();
        await this.apiService.initializeFromSession();
        
        // Setup UI event listeners
        this.setupEventListeners();
        
        // Update initial stats
        this.updateInputStats();
        
        // Check authentication status
        await this.checkAuthStatus();
        
        console.log('✅ XML130 Updater initialized');
    }

    setupEventListeners() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });

        // Sync connection codes between tabs
        const input1 = document.getElementById('connectionCodesInput');
        const input2 = document.getElementById('connectionCodesInput2');
        
        if (input1 && input2) {
            input1.addEventListener('input', () => {
                input2.value = input1.value;
                this.updateInputStats();
            });
            
            input2.addEventListener('input', () => {
                input1.value = input2.value;
                this.updateInputStats();
            });
        }

        // Input textarea change - update stats
        const inputTextarea = document.getElementById('connectionCodesInput');
        if (inputTextarea) {
            inputTextarea.addEventListener('input', () => {
                this.updateInputStats();
            });
        }

        // Clear input button
        const clearInputBtn = document.getElementById('clearInputBtn');
        if (clearInputBtn) {
            clearInputBtn.addEventListener('click', () => {
                this.clearInput();
            });
        }

        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }

        // Select all checkbox
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.handleSelectAll(e.target.checked);
            });
        }

        // Update selected button
        const updateSelectedBtn = document.getElementById('updateSelectedBtn');
        if (updateSelectedBtn) {
            updateSelectedBtn.addEventListener('click', () => {
                this.handleUpdateSelected();
            });
        }

        // Patient tab event listeners
        this.setupPatientEventListeners();
    }

    updateInputStats() {
        const textarea = document.getElementById('connectionCodesInput');
        const statsEl = document.getElementById('inputStats');
        const statsEl2 = document.getElementById('inputStats2');
        
        if (!textarea) return;

        const codes = textarea.value
            .split('\n')
            .map(code => code.trim())
            .filter(code => code.length > 0);

        const text = `${codes.length} mã`;
        if (statsEl) statsEl.textContent = text;
        if (statsEl2) statsEl2.textContent = text;
    }

    setupPatientEventListeners() {
        // Search patients button
        const searchPatientsBtn = document.getElementById('searchPatientsBtn');
        if (searchPatientsBtn) {
            searchPatientsBtn.addEventListener('click', () => {
                this.handleSearchPatients();
            });
        }

        // Select all patients checkbox
        const selectAllPatientsCheckbox = document.getElementById('selectAllPatientsCheckbox');
        if (selectAllPatientsCheckbox) {
            selectAllPatientsCheckbox.addEventListener('change', (e) => {
                this.handleSelectAllPatients(e.target.checked);
            });
        }

        // Send selected 130 button
        const sendSelected130Btn = document.getElementById('sendSelected130Btn');
        if (sendSelected130Btn) {
            sendSelected130Btn.addEventListener('click', () => {
                this.handleSendSelected130();
            });
        }
        
        // Sortable column headers
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortField = header.dataset.sort;
                this.handleSort(sortField);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const activeTab = document.getElementById(`tab-${tabName}`);
        if (activeTab) {
            activeTab.classList.add('active');
            activeTab.style.display = 'block';
        }
    }

    updateInputStats() {
        const textarea = document.getElementById('connectionCodesInput');
        const statsEl = document.getElementById('inputStats');
        
        if (!textarea || !statsEl) return;

        const codes = textarea.value
            .split('\n')
            .map(code => code.trim())
            .filter(code => code.length > 0);

        statsEl.textContent = `${codes.length} mã`;
    }

    clearInput() {
        const textarea = document.getElementById('connectionCodesInput');
        if (textarea) {
            textarea.value = '';
            this.updateInputStats();
        }
        
        // Clear table
        this.allMedicines = [];
        this.renderTable();
        this.updateStats();
    }

    async handleSearch() {
        if (this.isProcessing) {
            this.showNotification('Đang xử lý, vui lòng đợi...', 'warning');
            return;
        }

        const textarea = document.getElementById('connectionCodesInput');
        const codes = textarea.value
            .split('\n')
            .map(code => code.trim())
            .filter(code => code.length > 0);

        if (codes.length === 0) {
            this.showNotification('Vui lòng nhập mã liên kết', 'error');
            return;
        }

        this.isProcessing = true;
        this.allMedicines = [];
        this.selectedMedicines = [];
        
        // Show progress
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressStatus = document.getElementById('progressStatus');
        
        if (progressSection) progressSection.style.display = 'block';
        
        let processed = 0;
        const total = codes.length;

        const notFoundCodes = [];

        for (const code of codes) {
            try {
                progressStatus.textContent = `Đang tìm kiếm: ${code}`;
                
                const medicines = await this.searchMedicinesByConnectionCode(code);
                
                if (medicines && medicines.length > 0) {
                    this.allMedicines.push(...medicines);
                } else {
                    notFoundCodes.push(code);
                }
                
                processed++;
                const percentage = (processed / total) * 100;
                progressFill.style.width = `${percentage}%`;
                progressText.textContent = `${processed}/${total}`;
                
            } catch (error) {
                console.error(`Error searching ${code}:`, error);
                notFoundCodes.push(code);
            }
        }

        // Show not found codes in modal popup
        if (notFoundCodes.length > 0) {
            this.showNotFoundModal(notFoundCodes);
        }

        // Hide progress
        if (progressSection) progressSection.style.display = 'none';
        
        this.isProcessing = false;
        this.renderTable();
        this.updateStats();
        
        if (this.allMedicines.length > 0) {
            this.showNotification(`Tìm thấy ${this.allMedicines.length} thuốc`, 'success');
        }
    }

    async searchMedicinesByConnectionCode(connectionCode) {
        try {
            const url = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
            
            // Build JSON string for param[1]
            const queryJson = JSON.stringify({
                TNAME: "BH_XML2_130",
                TKEY: "MA_LK",
                TVAL: connectionCode,
                TMODE: "1",
                THID: "CSYTID"
            });
            
            const payload = {
                func: "ajaxCALL_SP_O",
                params: ["T.GET.DATA", queryJson, 0],
                uuid: this.apiService.uuid
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Read as text first to handle encoding
            const textData = await response.text();
            const data = JSON.parse(textData);

            if (data.error_code && data.error_code !== '0') {
                console.warn(`API warning for ${connectionCode}:`, data.error_msg);
                return [];
            }

            if (!data.result) {
                return [];
            }

            // Parse JSON array result
            const resultData = JSON.parse(data.result);
            
            if (!Array.isArray(resultData) || resultData.length === 0) {
                return [];
            }

            // Map all medicines with proper UTF-8 decoding
            const medicines = resultData.map(row => ({
                MA_LK: this.decodeText(row.MA_LK) || connectionCode,
                STT: this.decodeText(row.STT) || '',
                TEN_THUOC: this.decodeText(row.TEN_THUOC) || '',
                LIEU_DUNG: this.decodeText(row.LIEU_DUNG) || '',
                CACH_DUNG: this.decodeText(row.CACH_DUNG) || '',
                XML2ID: row.XML2ID || '',
                TIEPNHANID: row.TIEPNHANID || '',
                CSYTID: row.CSYTID || '',
                status: 'pending',
                selected: false,
                fullData: row  // Store full original data for update
            }));

            // Filter target medicines with priority
            // Match both correct and incorrect encoding
            const targetMedicines = [];
            
            // Priority 1: Cam thảo (match: "Cam thảo", "Cam thá»o", "cam tha", etc.)
            const camThao = medicines.find(med => {
                const name = med.TEN_THUOC.toLowerCase();
                return name.includes('cam th') && (
                    name.includes('thảo') || 
                    name.includes('thá»') ||
                    name.includes('tha\u1EA3o') ||
                    /cam\s*th[aá»]/.test(name)
                );
            });
            if (camThao) {
                targetMedicines.push(camThao);
                return targetMedicines; // Return immediately if found
            }
            
            // Priority 2: Độc hoạt (match: "Độc hoạt", "Äá»c hoáº¡t", "Äá»c hoẠ¡t", etc.)
            const docHoat = medicines.find(med => {
                const name = med.TEN_THUOC.toLowerCase();
                return (
                    name.includes('độc ho') ||
                    name.includes('äá»c ho') ||  // Pattern: "Äá»c hoáº¡t" 
                    name.includes('Äá»c') ||
                    name.includes('doc ho') ||
                    /[dÄä].*[cá»]\s*ho/.test(name)
                );
            });
            if (docHoat) {
                targetMedicines.push(docHoat);
                return targetMedicines; // Return immediately if found
            }
            
            // Priority 3: Đại táo (match: "Đại táo", "Äáº¡i tÃ¡o", "ÄáẠ¡i tĂ¡o", "dai tao", etc.)
            const daiTao = medicines.find(med => {
                const name = med.TEN_THUOC.toLowerCase();
                return (
                    name.includes('đại t') ||
                    name.includes('äáº¡i t') ||  // Pattern: "Äáº¡i tÃ¡o"
                    name.includes('Äá') ||
                    name.includes('dai t') ||
                    /[dÄä].*[iáº¡]\s*t/.test(name)
                );
            });
            if (daiTao) {
                targetMedicines.push(daiTao);
                return targetMedicines; // Return immediately if found
            }
            
            // Priority 4: Bạch linh (match: "Bạch linh", "Báº¡ch linh", etc.)
            const bachLinh = medicines.find(med => {
                const name = med.TEN_THUOC.toLowerCase();
                return (
                    name.includes('bạch l') ||
                    name.includes('báº¡ch l') ||  // Pattern with wrong encoding
                    name.includes('bach l') ||
                    /b[aáº¡].*ch\s*l/.test(name)
                );
            });
            if (bachLinh) {
                targetMedicines.push(bachLinh);
                return targetMedicines; // Return immediately if found
            }
            
            // Priority 5: Long nhãn (match: "Long nhãn", "Long nhÃ£n", etc.)
            const longNhan = medicines.find(med => {
                const name = med.TEN_THUOC.toLowerCase();
                return (
                    name.includes('long nh') ||
                    name.includes('long n') ||
                    /long\s*nh/.test(name)
                );
            });
            if (longNhan) {
                targetMedicines.push(longNhan);
                return targetMedicines; // Return immediately if found
            }

            return []; // No target medicine found

        } catch (error) {
            console.error('Error searching medicines:', error);
            throw error;
        }
    }

    renderTable() {
        const tbody = document.getElementById('dataTableBody');
        if (!tbody) return;

        if (this.allMedicines.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7" class="empty-state">
                        Nhập mã liên kết và click Search để xem dữ liệu
                    </td>
                </tr>
            `;
            return;
        }

        const targetCachDung = 'Sắc uống 1 thang/ ngày, chia 2 lần uống sáng-chiều';

        tbody.innerHTML = this.allMedicines.map((med, index) => {
            const alreadyUpdated = med.CACH_DUNG === targetCachDung;
            const cachDungStyle = alreadyUpdated ? 'style="color: blue; font-weight: bold;"' : '';
            
            return `
            <tr data-index="${index}" class="${med.status} ${med.selected ? 'selected' : ''}">
                <td class="col-checkbox">
                    <input type="checkbox" 
                           data-index="${index}" 
                           ${med.selected ? 'checked' : ''}
                           ${med.status === 'success' ? 'disabled' : ''}>
                </td>
                <td class="col-ma-lk">${this.escapeHtml(med.MA_LK)}</td>
                <td class="col-stt">${this.escapeHtml(med.STT)}</td>
                <td class="col-ten-thuoc">${this.escapeHtml(med.TEN_THUOC)}</td>
                <td class="col-lieu-dung">${this.escapeHtml(med.LIEU_DUNG)}</td>
                <td class="col-cach-dung" ${cachDungStyle}>${this.escapeHtml(med.CACH_DUNG)}</td>
                <td class="col-status">
                    <span class="status-badge ${alreadyUpdated ? 'already-correct' : med.status}">
                        ${alreadyUpdated ? 'ℹ️ Đúng cách dùng' : this.getStatusText(med.status)}
                    </span>
                </td>
            </tr>
        `;
        }).join('');

        // Attach checkbox event listeners
        tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.handleRowSelect(index, e.target.checked);
            });
        });
    }

    handleRowSelect(index, checked) {
        if (index >= 0 && index < this.allMedicines.length) {
            this.allMedicines[index].selected = checked;
            
            // Update selected array
            if (checked) {
                if (!this.selectedMedicines.includes(index)) {
                    this.selectedMedicines.push(index);
                }
            } else {
                const idx = this.selectedMedicines.indexOf(index);
                if (idx > -1) {
                    this.selectedMedicines.splice(idx, 1);
                }
            }
            
            this.updateStats();
            this.renderTable();
        }
    }

    handleSelectAll(checked) {
        this.selectedMedicines = [];
        
        this.allMedicines.forEach((med, index) => {
            // Only exclude already successfully updated items
            if (med.status !== 'success') {
                med.selected = checked;
                if (checked) {
                    this.selectedMedicines.push(index);
                }
            }
        });
        
        this.updateStats();
        this.renderTable();
    }

    async handleUpdateSelected() {
        if (this.isProcessing) {
            this.showNotification('Đang xử lý, vui lòng đợi...', 'warning');
            return;
        }

        if (this.selectedMedicines.length === 0) {
            this.showNotification('Vui lòng chọn ít nhất 1 thuốc để cập nhật', 'error');
            return;
        }

        const confirmed = confirm(`Bạn có chắc muốn cập nhật ${this.selectedMedicines.length} thuốc đã chọn?`);
        if (!confirmed) return;

        this.isProcessing = true;
        this.stats.success = 0;
        this.stats.error = 0;

        // Show progress
        const progressSection = document.getElementById('progressSection');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressStatus = document.getElementById('progressStatus');
        
        if (progressSection) progressSection.style.display = 'block';

        let processed = 0;
        const total = this.selectedMedicines.length;

        for (const index of [...this.selectedMedicines]) {
            const medicine = this.allMedicines[index];
            
            try {
                progressStatus.textContent = `Đang cập nhật: ${medicine.TEN_THUOC}`;
                medicine.status = 'processing';
                this.renderTable();

                const success = await this.updateMedicineUsage(medicine);
                
                if (success) {
                    medicine.status = 'success';
                    this.stats.success++;
                } else {
                    medicine.status = 'error';
                    this.stats.error++;
                }

            } catch (error) {
                console.error('Error updating medicine:', error);
                medicine.status = 'error';
                this.stats.error++;
            }

            processed++;
            const percentage = (processed / total) * 100;
            progressFill.style.width = `${percentage}%`;
            progressText.textContent = `${processed}/${total}`;
            
            this.renderTable();
            this.updateStats();
        }

        // Hide progress
        if (progressSection) progressSection.style.display = 'none';
        
        this.isProcessing = false;
        this.selectedMedicines = [];
        
        this.showNotification(
            `Hoàn thành! Thành công: ${this.stats.success}, Lỗi: ${this.stats.error}`,
            this.stats.error > 0 ? 'warning' : 'success'
        );
    }

    async updateMedicineUsage(medicine) {
        try {
            // Get the appropriate usage text
            let cachDung = 'Sắc uống 1 thang/ ngày, chia 2 lần uống sáng-chiều';
            
            // Fix encoding for all text fields in fullData
            const fixedData = this.fixAllTextEncoding(medicine.fullData);
            
            // Build full data object with updated CACH_DUNG
            // Keep TEN_THUOC from fixedData (encoding fixed but name unchanged)
            const fullData = {
                ...fixedData,              // Use fixed data (includes TEN_THUOC with encoding fixed)
                CACH_DUNG: cachDung        // Update usage
            };

            // Build param array as JSON string
            const paramData = [{
                DATA: fullData,
                TAB: "BH_XML2_130",
                KEY: "XML2ID"
            }];
            
            const modeInfo = {
                MODE: "MANU",
                CODE: "VPI01T014_toolxml130"
            };
            
            const paramString = JSON.stringify(paramData) + '$' + JSON.stringify(modeInfo);

            const url = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
            const payload = {
                func: "ajaxCALL_SP_S",
                params: ["VPI.UPDATE.STABLE", paramString],
                uuid: this.apiService.uuid
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept': 'application/json; charset=UTF-8'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Read as text first to handle encoding  
            const textData = await response.text();
            const data = JSON.parse(textData);

            if (data.error_code && data.error_code !== '0') {
                console.error('Update failed:', data.error_msg);
                return false;
            }

            // Update local data
            medicine.TEN_THUOC = fullData.TEN_THUOC;  // Use fixed encoding version
            medicine.CACH_DUNG = cachDung;
            
            return true;

        } catch (error) {
            console.error('Error updating medicine usage:', error);
            return false;
        }
    }

    updateStats() {
        this.stats.total = this.allMedicines.length;
        this.stats.selected = this.selectedMedicines.length;
        
        document.getElementById('totalCount').textContent = this.stats.total;
        document.getElementById('selectedCount').textContent = this.stats.selected;
        document.getElementById('successCount').textContent = this.stats.success;
        document.getElementById('errorCount').textContent = this.stats.error;

        // Enable/disable update button
        const updateBtn = document.getElementById('updateSelectedBtn');
        if (updateBtn) {
            updateBtn.disabled = this.stats.selected === 0 || this.isProcessing;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Chờ xử lý',
            'processing': 'Đang xử lý',
            'success': '✅ Thành công',
            'error': '❌ Lỗi'
        };
        return statusMap[status] || status;
    }

    async checkAuthStatus() {
        const statusIndicator = document.querySelector('.status-indicator');
        const statusText = document.querySelector('.auth-status span:last-child');

        if (!statusIndicator || !statusText) return;

        if (this.apiService && this.apiService.uuid) {
            statusIndicator.className = 'status-indicator connected';
            statusText.textContent = 'Đã kết nối';
        } else {
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'Chưa đăng nhập';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        }[type] || 'ℹ️';

        notification.innerHTML = `
            <span class="icon">${icon}</span>
            <span>${this.escapeHtml(message)}</span>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    decodeText(text) {
        // Return text as-is for now
        // The encoding issue should be fixed on the server side
        return text || '';
    }

    fixAllTextEncoding(dataObject) {
        if (!dataObject || typeof dataObject !== 'object') {
            return dataObject;
        }

        const fixed = {};
        
        for (const [key, value] of Object.entries(dataObject)) {
            if (typeof value === 'string' && value) {
                // Try to fix common Vietnamese encoding issues
                fixed[key] = this.fixVietnameseEncoding(value);
            } else {
                fixed[key] = value;
            }
        }
        
        return fixed;
    }

    fixVietnameseEncoding(text) {
        if (!text) return text;
        
        try {
            // Check if text has encoding issues
            const hasEncodingIssue = /[ÃÄáº»á»]/u.test(text);
            
            if (!hasEncodingIssue) {
                return text;
            }
            
            console.log('Original text:', text);
            
            // Method: Manual byte-by-byte decoding
            // Text like "ngÃ y" is UTF-8 bytes misinterpreted as Latin-1
            // We need to convert back to bytes and re-decode as UTF-8
            
            let bytes = [];
            for (let i = 0; i < text.length; i++) {
                const charCode = text.charCodeAt(i);
                // If character code is in Latin-1 range (0-255), treat as byte
                if (charCode <= 0xFF) {
                    bytes.push(charCode);
                } else {
                    // For characters > 255, convert to UTF-8 bytes
                    const char = text[i];
                    for (let j = 0; j < char.length; j++) {
                        const code = char.charCodeAt(j);
                        if (code <= 0x7F) {
                            bytes.push(code);
                        } else if (code <= 0x7FF) {
                            bytes.push(0xC0 | (code >> 6));
                            bytes.push(0x80 | (code & 0x3F));
                        } else if (code <= 0xFFFF) {
                            bytes.push(0xE0 | (code >> 12));
                            bytes.push(0x80 | ((code >> 6) & 0x3F));
                            bytes.push(0x80 | (code & 0x3F));
                        }
                    }
                }
            }
            
            // Try to decode as UTF-8
            try {
                const decoder = new TextDecoder('utf-8', { fatal: false });
                const fixed = decoder.decode(new Uint8Array(bytes));
                
                console.log('Fixed text:', fixed);
                
                // Check if fix is better (more Vietnamese characters)
                const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi;
                const originalCount = (text.match(vietnameseChars) || []).length;
                const fixedCount = (fixed.match(vietnameseChars) || []).length;
                
                console.log('Vietnamese chars - Original:', originalCount, 'Fixed:', fixedCount);
                
                if (fixedCount >= originalCount && fixed !== text) {
                    return fixed;
                }
            } catch (e) {
                console.warn('UTF-8 decode error:', e);
            }
            
            // Fallback: Manual string replacements
            console.log('Using fallback replacements');
            let fixed = text;
            
            const replacements = [
                // Fix "Độc hoạt" with wrong encoding
                ["Äá»c hoáº¡t", "Độc hoạt"],
                ["Äá»c", "Độc"],
                ["hoáº¡t", "hoạt"],
                // Fix "Đại táo" with wrong encoding
                ["Äáº¡i tÃ¡o", "Đại táo"],
                ["Äáº¡i", "Đại"],
                ["tÃ¡o", "táo"],
                // Fix "Bạch linh" with wrong encoding
                ["Báº¡ch linh", "Bạch linh"],
                ["Báº¡ch", "Bạch"],
                // Fix "Long nhãn" with wrong encoding
                ["Long nhÃ£n", "Long nhãn"],
                ["nhÃ£n", "nhãn"],
                // Common patterns
                ["ngÃ y", "ngày"],
                ["ngÃ ", "ngà"],
                ["Ã y", "ày"],
                ["Ã¡", "á"],
                ["Ã©", "é"],
                ["Ã´", "ô"],
                ["Ã£", "ã"],
                ["sĂ¡ng", "sáng"],
                ["chiá»u", "chiều"],
                ["tĂ¡o", "táo"],
                ["thá»", "thảo"],
                ["hoẠ¡t", "hoạt"],
                ["Äá»c", "độc"],
                ["ÄáẠ¡i", "đại"],
                ["á»", "ộ"],
                ["á»‹", "ị"],
                ["lần", "lần"]
            ];
            
            for (const [wrong, correct] of replacements) {
                if (fixed.includes(wrong)) {
                    console.log('Replacing:', wrong, '->', correct);
                    fixed = fixed.split(wrong).join(correct);
                }
            }
            
            console.log('Final fixed text:', fixed);
            return fixed;
            
        } catch (error) {
            console.error('Error fixing encoding:', error);
            return text;
        }
    }

    showNotFoundModal(notFoundCodes) {
        const modal = document.getElementById('notFoundModal');
        const codesList = document.getElementById('notFoundCodesList');
        
        if (!modal || !codesList) return;
        
        // Build list of not found codes
        codesList.innerHTML = notFoundCodes.map(code => 
            `<div class="not-found-item">${code}</div>`
        ).join('');
        
        // Show modal
        modal.style.display = 'flex';
        
        // Setup close handlers (if not already set)
        const closeBtn = document.getElementById('closeNotFoundModal');
        const confirmBtn = document.getElementById('confirmNotFoundModal');
        
        const closeModal = () => {
            modal.style.display = 'none';
        };
        
        if (closeBtn) {
            closeBtn.onclick = closeModal;
        }
        
        if (confirmBtn) {
            confirmBtn.onclick = closeModal;
        }
        
        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    }

    // ============================================
    // PATIENT TAB METHODS
    // ============================================

    async handleSearchPatients() {
        // Get connection codes from shared textarea
        const textarea = document.getElementById('connectionCodesInput');
        if (!textarea) return;

        const connectionCodes = textarea.value
            .split('\n')
            .map(code => code.trim())
            .filter(code => code.length > 0);

        if (connectionCodes.length === 0) {
            this.showNotification('⚠️ Vui lòng nhập mã liên kết!', 'warning');
            return;
        }

        const dateFrom = document.getElementById('patientDateFrom').value.trim();
        const dateTo = document.getElementById('patientDateTo').value.trim();
        const totalCodes = connectionCodes.length;

        try {
            // Step 1: Show progress - Start
            this.updatePatientProgressWithCount(0, totalCodes, 'Đang bắt đầu tìm kiếm...');
            
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Step 2: Fetch all patients in date range with animated progress
            this.updatePatientProgressWithCount(0, totalCodes, 'Đang tải dữ liệu từ API...');
            
            // Start simulated progress animation while waiting for API
            const progressInterval = this.startFetchProgressAnimation(totalCodes);
            
            const allPatients = await this.fetchPatients(dateFrom, dateTo);
            
            // Stop the animation
            clearInterval(progressInterval);
            
            console.log(`📊 Fetched ${allPatients.length} patients from API`);
            
            // Step 3: Filter by connection codes with progress tracking
            this.updatePatientProgressWithCount(0, totalCodes, 'Đang lọc bệnh nhân...');
            
            const filtered = [];
            const batchSize = Math.ceil(totalCodes / 10); // Process in 10 batches for smooth progress
            
            for (let i = 0; i < connectionCodes.length; i++) {
                const code = connectionCodes[i];
                
                // Find patients matching this connection code
                const matching = allPatients.filter(patient => {
                    const maLK = patient.MA_LK ? patient.MA_LK.toString() : '';
                    return maLK === code;
                });
                
                filtered.push(...matching);
                
                // Update progress every batch
                if (i % batchSize === 0 || i === connectionCodes.length - 1) {
                    this.updatePatientProgressWithCount(i + 1, totalCodes, 'Đang lọc bệnh nhân...');
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            console.log(`✅ Filtered to ${filtered.length} patients matching ${totalCodes} connection codes`);

            // Step 4: Rendering
            this.updatePatientProgressWithCount(totalCodes, totalCodes, 'Đang hiển thị kết quả...');
            
            await new Promise(resolve => setTimeout(resolve, 200));

            this.allPatients = filtered;
            this.renderPatientsTable(filtered);
            this.updatePatientStats();

            // Step 5: Complete
            this.updatePatientProgressWithCount(totalCodes, totalCodes, 'Hoàn thành!');
            
            setTimeout(() => {
                this.hidePatientProgress();
            }, 1000);

            this.showNotification(`✅ Tìm thấy ${filtered.length} bệnh nhân từ ${totalCodes} mã!`, 'success');

        } catch (error) {
            console.error('Error searching patients:', error);
            this.showNotification('❌ Lỗi khi tìm kiếm bệnh nhân!', 'error');
            this.renderEmptyPatients();
            this.hidePatientProgress();
        }
    }

    async fetchPatients(dateFrom, dateTo) {
        // Ensure apiService is initialized
        if (!this.apiService.uuid) {
            await this.apiService.initializeFromSession();
        }
        const uuid = this.apiService.uuid;
        
        const postData = {
            func: "ajaxExecuteQueryPaging",
            uuid: uuid,
            params: ["NTU02D061.03.RG"],
            options: [{
                name: "[0]",
                value: JSON.stringify({
                    TU_NGAY: dateFrom || "01/10/2025 00:00:00",
                    DEN_NGAY: dateTo || "31/10/2025 23:59:59",
                    GUI_BHXH: "-1",
                    LOCTHEO: "1",
                    GUI: "0",
                    GUI_CONG: "-1",
                    LOAIHS: "-1",
                    LOAITHE: "-1",
                    SUACHUA_BA: "-1",
                    KHOA: "-1",
                    LOAIXML: "130",
                    DTBNID: "100",
                    CSKCB: "54018",
                    TRANGTHAI_KYSO: "-1",
                    TUYEN: "-1",
                    MATHE: "-1",
                    DS_BA: "",
                    LOAITIEPNHAN: "-1",
                    LOAI_XML_KYSO: ""
                })
            }]
        };

        // Build URL with all required query parameters matching the sample
        const timestamp = Date.now();
        const baseUrl = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
        const params = new URLSearchParams({
            postData: JSON.stringify(postData),
            _search: 'true',
            nd: timestamp.toString(),
            rows: '10000',
            page: '1',
            sidx: '',
            sord: 'asc'
        });
        
        const url = `${baseUrl}?${params.toString()}`;
        
        console.log('🌐 Fetching patients from API...');
        console.log('📋 Request URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 API Response:', data);
        console.log('👥 Total patients fetched:', data.rows ? data.rows.length : 0);
        
        return data.rows || [];
    }

    renderPatientsTable(patients) {
        const tbody = document.getElementById('patientsTableBody');
        if (!tbody) return;

        if (patients.length === 0) {
            this.renderEmptyPatients();
            return;
        }

        tbody.innerHTML = patients.map((patient, index) => {
            const isWarning = this.shouldHighlightPatient(patient);
            const rowClass = isWarning ? 'warning' : '';
            
            return `
                <tr class="${rowClass}" data-index="${index}">
                    <td class="col-checkbox">
                        <input type="checkbox" class="patient-checkbox" data-index="${index}">
                    </td>
                    <td class="col-ma-lk">${this.escapeHtml(patient.MA_LK || '')}</td>
                    <td class="col-ma-bn">${this.escapeHtml(patient.MA_BN || '')}</td>
                    <td class="col-ho-ten">${this.escapeHtml(patient.HO_TEN || '')}</td>
                    <td class="col-ngay-gui">${this.escapeHtml(patient.NGAY_GUI || '')}</td>
                    <td class="col-trang-thai">${this.escapeHtml(patient.TRANG_THAI_GUI || '')}</td>
                    <td class="col-so-lan-gui-hs">${this.escapeHtml(patient.SOLANGUI_BH_HS || '')}</td>
                    <td class="col-nguoi-gui">${this.escapeHtml(patient.NGUOI_GUI || '')}</td>
                </tr>
            `;
        }).join('');

        // Add checkbox event listeners
        tbody.querySelectorAll('.patient-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.togglePatientSelection(index, e.target.checked);
            });
        });
    }

    shouldHighlightPatient(patient) {
        // Highlight red if:
        // 1. NGUOI_GUI is "PVHOA - Phạm Văn Hóa" AND SOLANGUI_BH > 2
        // 2. NGAY_GUI < "07/11/2025 00:00:00"
        const isPVHOA = patient.NGUOI_GUI && patient.NGUOI_GUI.includes('PVHOA');
        const sendCount = parseInt(patient.SOLANGUI_BH) || 0;
        const pvhoaCondition = isPVHOA && sendCount > 2;
        
        // Check NGAY_GUI date condition
        let dateCondition = false;
        if (patient.NGAY_GUI) {
            try {
                // Parse Vietnamese date format: "DD/MM/YYYY HH:mm:ss"
                const dateParts = patient.NGAY_GUI.split(' ')[0].split('/');
                if (dateParts.length === 3) {
                    const day = parseInt(dateParts[0]);
                    const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
                    const year = parseInt(dateParts[2]);
                    const ngayGui = new Date(year, month, day);
                    const cutoffDate = new Date(2025, 10, 7); // November 7, 2025 (month is 0-indexed)
                    dateCondition = ngayGui < cutoffDate;
                }
            } catch (e) {
                console.error('Error parsing NGAY_GUI:', patient.NGAY_GUI, e);
            }
        }
        
        return  dateCondition;
    }

    renderEmptyPatients() {
        const tbody = document.getElementById('patientsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8" class="empty-state">
                        Không tìm thấy bệnh nhân nào
                    </td>
                </tr>
            `;
        }
    }

    togglePatientSelection(index, isSelected) {
        const patient = this.allPatients[index];
        if (!patient) return;

        if (isSelected) {
            if (!this.selectedPatients.includes(patient)) {
                this.selectedPatients.push(patient);
            }
        } else {
            this.selectedPatients = this.selectedPatients.filter(p => p !== patient);
        }

        this.updatePatientStats();
    }

    handleSelectAllPatients(isChecked) {
        const checkboxes = document.querySelectorAll('.patient-checkbox');
        checkboxes.forEach((checkbox, index) => {
            checkbox.checked = isChecked;
            this.togglePatientSelection(index, isChecked);
        });
    }

    updatePatientStats() {
        const warningCount = this.allPatients.filter(p => this.shouldHighlightPatient(p)).length;

        this.patientStats = {
            total: this.allPatients.length,
            selected: this.selectedPatients.length,
            warning: warningCount
        };

        // Update UI
        document.getElementById('patientsTotalCount').textContent = this.patientStats.total;
        document.getElementById('patientsSelectedCount').textContent = this.patientStats.selected;
        document.getElementById('patientsWarningCount').textContent = this.patientStats.warning;

        // Enable/disable send button
        const sendBtn = document.getElementById('sendSelected130Btn');
        if (sendBtn) {
            sendBtn.disabled = this.patientStats.selected === 0;
        }
    }

    async handleSendSelected130() {
        if (this.selectedPatients.length === 0) {
            this.showNotification('⚠️ Vui lòng chọn ít nhất 1 bệnh nhân!', 'warning');
            return;
        }

        const confirmed = confirm(`Bạn có chắc muốn gửi 130 cho ${this.selectedPatients.length} bệnh nhân đã chọn?`);
        if (!confirmed) return;

        this.updatePatientProgress(50, 'Đang gửi 130...');

        // TODO: Implement send 130 logic
        // This will call the API to send XML 130 for selected patients
        
        this.showNotification('🚧 Chức năng gửi 130 đang được phát triển...', 'info');
        this.hidePatientProgress();
    }

    // Progress bar methods
    updatePatientProgress(percent, message) {
        const progressSection = document.getElementById('patientProgressSection');
        const progressFill = document.getElementById('patientProgressFill');
        const progressStatus = document.getElementById('patientProgressStatus');
        const progressText = document.getElementById('patientProgressText');

        if (progressSection) {
            progressSection.style.display = 'block';
        }

        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }

        if (progressStatus && message) {
            progressStatus.textContent = message;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
    }

    updatePatientProgressWithCount(current, total, message) {
        const progressSection = document.getElementById('patientProgressSection');
        const progressFill = document.getElementById('patientProgressFill');
        const progressStatus = document.getElementById('patientProgressStatus');
        const progressText = document.getElementById('patientProgressText');

        const percent = total > 0 ? (current / total) * 100 : 0;

        if (progressSection) {
            progressSection.style.display = 'block';
        }

        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }

        if (progressStatus && message) {
            progressStatus.textContent = message;
        }
        
        if (progressText) {
            progressText.textContent = `${current}/${total} mã`;
        }
    }

    startFetchProgressAnimation(totalCodes) {
        let fakeProgress = 0;
        const maxFakeProgress = Math.floor(totalCodes * 0.3); // Max 30% of total during fetch
        
        const interval = setInterval(() => {
            if (fakeProgress < maxFakeProgress) {
                fakeProgress++;
                const progressFill = document.getElementById('patientProgressFill');
                const progressText = document.getElementById('patientProgressText');
                
                const percent = (fakeProgress / totalCodes) * 100;
                
                if (progressFill) {
                    progressFill.style.width = `${percent}%`;
                }
                
                if (progressText) {
                    progressText.textContent = `${fakeProgress}/${totalCodes} mã`;
                }
            }
        }, 200); // Update every 200ms
        
        return interval;
    }

    hidePatientProgress() {
        const progressSection = document.getElementById('patientProgressSection');
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }

    // Sorting methods
    handleSort(field) {
        // Toggle sort order if clicking same field
        if (this.currentSortField === field) {
            this.currentSortOrder = this.currentSortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortField = field;
            this.currentSortOrder = 'asc';
        }

        // Sort the patients array
        this.sortPatients(field, this.currentSortOrder);

        // Re-render table
        this.renderPatientsTable(this.allPatients);

        // Update sort indicators
        this.updateSortIndicators(field, this.currentSortOrder);
    }

    sortPatients(field, order) {
        this.allPatients.sort((a, b) => {
            let valA, valB;

            if (field === 'NGAY_GUI') {
                // Parse Vietnamese date format for sorting
                valA = this.parseVietnameseDate(a.NGAY_GUI);
                valB = this.parseVietnameseDate(b.NGAY_GUI);
            } else if (field === 'SOLANGUI_BH_HS') {
                // Parse as number
                valA = parseInt(a.SOLANGUI_BH_HS) || 0;
                valB = parseInt(b.SOLANGUI_BH_HS) || 0;
            }

            if (order === 'asc') {
                return valA > valB ? 1 : valA < valB ? -1 : 0;
            } else {
                return valA < valB ? 1 : valA > valB ? -1 : 0;
            }
        });
    }

    parseVietnameseDate(dateStr) {
        if (!dateStr) return new Date(0);
        try {
            // Parse "DD/MM/YYYY HH:mm:ss" format
            const parts = dateStr.split(' ');
            const dateParts = parts[0].split('/');
            const timeParts = parts[1] ? parts[1].split(':') : ['0', '0', '0'];
            
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const year = parseInt(dateParts[2]);
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            const second = parseInt(timeParts[2]);
            
            return new Date(year, month, day, hour, minute, second);
        } catch (e) {
            console.error('Error parsing date:', dateStr, e);
            return new Date(0);
        }
    }

    updateSortIndicators(field, order) {
        // Remove all sort classes
        document.querySelectorAll('.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });

        // Add sort class to current field
        const currentHeader = document.querySelector(`.sortable[data-sort="${field}"]`);
        if (currentHeader) {
            currentHeader.classList.add(`sort-${order}`);
        }
    }

    showPatientProgress(show, message = '') {
        const progressSection = document.getElementById('patientProgressSection');
        const progressText = document.getElementById('patientProgressText');
        const progressStatus = document.getElementById('patientProgressStatus');

        if (progressSection) {
            progressSection.style.display = show ? 'block' : 'none';
        }

        if (show && progressStatus) {
            progressStatus.textContent = message;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.xml130Updater = new XML130Updater();
    });
} else {
    window.xml130Updater = new XML130Updater();
}
