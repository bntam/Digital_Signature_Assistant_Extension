// BHYT 4210 - Main Logic
// Handles fetching and displaying insurance data

class BHYT4210 {
    constructor() {
        this.apiService = null;
        this.allData = [];
        this.medicineRules = []; // Lưu danh sách thuốc và ICD rules
        this.doctorList = []; // Lưu danh sách bác sĩ
        this.maBacSiInitialized = false; // Flag to prevent duplicate initialization
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing BHYT 4210...');
        
        // Initialize API Service
        this.apiService = new ApiService();
        await this.apiService.initializeFromSession();
        
        // Load medicine rules and doctor list from Google Sheets
        await Promise.all([
            this.loadMedicineRules(),
            this.loadDoctorList()
        ]);
        
        // Set default dates to today
        this.setDefaultDates();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup custom tooltip
        this.setupCustomTooltip();
        
        console.log('✅ BHYT 4210 initialized');
    }

    setDefaultDates() {
        const now = new Date();
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        
        if (dateFrom && !dateFrom.value) {
            // Set to start of today
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            dateFrom.value = this.formatDateTime(startOfDay);
        }
        
        if (dateTo && !dateTo.value) {
            // Set to end of today
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            dateTo.value = this.formatDateTime(endOfDay);
        }
    }

    formatDateTime(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    async loadMedicineRules() {
        try {
            // Google Sheets ID and Sheet name
            const SHEET_ID = '1Jd55vLdLz9sd8JEYaoITRGk5K4Ahwjau';
            const SHEET_NAME = 'Data';
            
            // Use Google Sheets CSV export URL
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
            
            console.log('📊 Loading medicine rules from Google Sheets...');
            const response = await fetch(url);
            const csvText = await response.text();
            
            // Parse CSV to JSON
            this.medicineRules = this.parseCSVToMedicineRules(csvText);
            console.log('📚 Loaded medicine rules:', this.medicineRules.length, 'medicines');
        } catch (error) {
            console.error('❌ Error loading medicine rules from Google Sheets:', error);
            this.medicineRules = [];
            this.showNotification('⚠️ Không thể tải dữ liệu thuốc từ Google Sheets', 'error');
        }
    }

    parseCSVToMedicineRules(csvText) {
        const lines = csvText.split('\n');
        const result = [];
        
        // Skip header row (first line)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse CSV line (handle quoted fields)
            const values = this.parseCSVLine(line);
            
            if (values.length >= 4) {
                result.push({
                    STT: values[0],
                    TEN_THUOC: values[1],
                    ICD_CHI_DINH: values[2] || '',
                    ICD_CHONG_CHI_DINH: values[3] || ''
                });
            }
        }
        
        return result;
    }

    async loadDoctorList() {
        try {
            // Google Sheets ID and Sheet name
            const SHEET_ID = '1Jd55vLdLz9sd8JEYaoITRGk5K4Ahwjau';
            const SHEET_NAME = 'Data_BS';
            
            // Use Google Sheets CSV export URL
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
            
            console.log('👨‍⚕️ Loading doctor list from Google Sheets...');
            const response = await fetch(url);
            const csvText = await response.text();
            
            // Parse CSV to JSON
            this.doctorList = this.parseCSVToDoctorList(csvText);
            console.log('👨‍⚕️ Loaded doctors:', this.doctorList.length, 'doctors');
            
            // Render doctor dropdown after loading
            this.renderDoctorDropdown();
        } catch (error) {
            console.error('❌ Error loading doctor list from Google Sheets:', error);
            this.doctorList = [];
            this.showNotification('⚠️ Không thể tải danh sách bác sĩ từ Google Sheets', 'error');
        }
    }

    parseCSVToDoctorList(csvText) {
        const lines = csvText.split('\n');
        const result = [];
        
        // Skip header row (first line)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse CSV line (handle quoted fields)
            const values = this.parseCSVLine(line);
            
            if (values.length >= 3) {
                result.push({
                    STT: values[0],
                    MA_BS: values[1],
                    TEN_BS: values[2]
                });
            }
        }
        
        return result;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add last field
        result.push(current.trim());
        
        return result;
    }

    setupEventListeners() {
        // Search button (code-based ICD comparison)
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch(false); // false = no AI
            });
        }

        // AI Search button (AI-based validation)
        const searchAIBtn = document.getElementById('searchAIBtn');
        if (searchAIBtn) {
            searchAIBtn.addEventListener('click', () => {
                this.handleSearch(true); // true = use AI
            });
        }

        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Expand All button
        const expandAllBtn = document.getElementById('expandAllBtn');
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                this.expandAll();
            });
        }

        // Collapse All button
        const collapseAllBtn = document.getElementById('collapseAllBtn');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                this.collapseAll();
            });
        }

        // Filter inputs
        const filterMaLKInput = document.getElementById('filterMaLKInput');
        const filterHoTenInput = document.getElementById('filterHoTenInput');
        const filterMaBenhInput = document.getElementById('filterMaBenhInput');
        if (filterMaLKInput) {
            filterMaLKInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }
        if (filterHoTenInput) {
            filterHoTenInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }
        if (filterMaBenhInput) {
            filterMaBenhInput.addEventListener('input', () => {
                this.applyFilters();
            });
        }
        
        // Multi-select dropdown for MA_BAC_SI
        this.initMaBacSiMultiSelect();

        // Clear filter button
        const clearFilterBtn = document.getElementById('clearFilterBtn');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Checkbox filters
        const showInvalidOnlyCheckbox = document.getElementById('showInvalidOnlyCheckbox');
        const hideNotFoundMedicinesCheckbox = document.getElementById('hideNotFoundMedicinesCheckbox');
        
        if (showInvalidOnlyCheckbox) {
            showInvalidOnlyCheckbox.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        if (hideNotFoundMedicinesCheckbox) {
            hideNotFoundMedicinesCheckbox.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Sortable column headers
        document.querySelectorAll('.data-table th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const column = th.dataset.column;
                this.sortTable(column);
            });
        });

        // Enter key on inputs
        ['dateFrom', 'dateTo'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleSearch();
                    }
                });
            }
        });
    }

    setupCustomTooltip() {
        let tooltipElement = null;
        let hintElement = null;

        // Create tooltip element
        const createTooltip = () => {
            tooltipElement = document.createElement('div');
            tooltipElement.className = 'custom-tooltip';
            document.body.appendChild(tooltipElement);

            hintElement = document.createElement('div');
            hintElement.className = 'tooltip-hint';
            hintElement.innerHTML = '💡 <strong>Hover</strong> để xem | <strong>Click</strong> để copy';
            document.body.appendChild(hintElement);
        };

        // Copy to clipboard function
        const copyToClipboard = (text) => {
            // Method 1: Modern Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(() => {
                        this.showNotification('📋 Đã copy phân tích vào clipboard!', 'success');
                    })
                    .catch(err => {
                        console.error('Failed to copy:', err);
                        fallbackCopy(text);
                    });
            } else {
                // Method 2: Fallback for older browsers
                fallbackCopy(text);
            }
        };

        // Fallback copy method
        const fallbackCopy = (text) => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.showNotification('📋 Đã copy phân tích vào clipboard!', 'success');
                } else {
                    this.showNotification('❌ Không thể copy. Vui lòng copy thủ công.', 'error');
                }
            } catch (err) {
                console.error('Fallback copy failed:', err);
                this.showNotification('❌ Không thể copy. Vui lòng copy thủ công.', 'error');
            }
            
            document.body.removeChild(textarea);
        };

        // Show tooltip
        const showTooltip = (content, x, y) => {
            if (!tooltipElement) createTooltip();
            
            tooltipElement.textContent = content;
            tooltipElement.style.display = 'block';
            
            // Position tooltip - keep it on screen
            const rect = tooltipElement.getBoundingClientRect();
            let left = x + 20;
            let top = y + 20;
            
            // Adjust if goes off screen
            if (left + rect.width > window.innerWidth) {
                left = window.innerWidth - rect.width - 20;
            }
            if (top + rect.height > window.innerHeight) {
                top = window.innerHeight - rect.height - 20;
            }
            
            tooltipElement.style.left = left + 'px';
            tooltipElement.style.top = top + 'px';

            // Show hint
            if (hintElement) {
                hintElement.style.display = 'block';
            }
        };

        // Hide tooltip
        const hideTooltip = () => {
            if (tooltipElement) {
                tooltipElement.style.display = 'none';
            }
            if (hintElement) {
                hintElement.style.display = 'none';
            }
        };

        // Attach event listeners using delegation
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                const content = target.getAttribute('data-tooltip');
                if (content) {
                    showTooltip(content, e.clientX, e.clientY);
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                hideTooltip();
            }
        });

        document.addEventListener('mousemove', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target && tooltipElement && tooltipElement.style.display === 'block') {
                // Update position on mouse move
                const rect = tooltipElement.getBoundingClientRect();
                let left = e.clientX + 20;
                let top = e.clientY + 20;
                
                if (left + rect.width > window.innerWidth) {
                    left = window.innerWidth - rect.width - 20;
                }
                if (top + rect.height > window.innerHeight) {
                    top = window.innerHeight - rect.height - 20;
                }
                
                tooltipElement.style.left = left + 'px';
                tooltipElement.style.top = top + 'px';
            }
        });

        // Click event to copy tooltip content
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                const tooltipContent = target.getAttribute('data-tooltip');
                if (tooltipContent) {
                    copyToClipboard(tooltipContent);
                    
                    // Visual feedback: highlight briefly
                    target.style.transition = 'all 0.3s ease';
                    const originalBg = target.style.background;
                    target.style.background = 'rgba(102, 126, 234, 0.2)';
                    
                    setTimeout(() => {
                        target.style.background = originalBg;
                    }, 300);
                }
            }
        });
    }

    async handleSearch(useAI = false) {
        const dateFrom = document.getElementById('dateFrom').value.trim();
        const dateTo = document.getElementById('dateTo').value.trim();

        if (!dateFrom || !dateTo) {
            this.showNotification('⚠️ Vui lòng nhập đầy đủ ngày tháng!', 'warning');
            return;
        }

        try {
            // Store AI mode
            this.useAI = useAI;
            
            // Show progress
            const searchMode = useAI ? '🤖 AI' : '🔍 Code-based';
            this.showProgress(`${searchMode} - Đang tải dữ liệu XML1...`);
            this.updateProgress(10);

            // Call API 1 (XML1)
            const xml1Data = await this.fetchXML1Data(dateFrom, dateTo);
            console.log('📊 XML1 Data:', xml1Data.length, 'records');

            this.updateProgress(40);
            this.showProgress(`${searchMode} - Đang tải dữ liệu XML2...`);

            // Call API 2 (XML2)
            const xml2Data = await this.fetchXML2Data(dateFrom, dateTo);
            console.log('📊 XML2 Data:', xml2Data.length, 'records');

            this.updateProgress(70);
            this.showProgress(`${searchMode} - Đang merge dữ liệu...`);

            // Merge data
            const mergedData = this.mergeData(xml1Data, xml2Data);
            console.log('✅ Merged Data:', mergedData.length, 'records');

            this.updateProgress(90);
            this.showProgress(`${searchMode} - Đang hiển thị kết quả...`);

            // Render table (async now)
            this.allData = mergedData;
            await this.renderTable(mergedData, useAI);

            this.updateProgress(100);
            
            setTimeout(() => {
                this.hideProgress();
            }, 500);

            this.showNotification(`✅ Tìm thấy ${mergedData.length} bản ghi!`, 'success');

        } catch (error) {
            console.error('❌ Error searching:', error);
            
            // Show detailed error message
            let errorMessage = '❌ Lỗi khi tìm kiếm dữ liệu!';
            if (error.message) {
                // Extract meaningful error info
                if (error.message.includes('API XML1 Error') || error.message.includes('API XML2 Error')) {
                    errorMessage = `❌ ${error.message}`;
                } else if (error.message.includes('HTTP error')) {
                    errorMessage = `❌ Lỗi kết nối: ${error.message}`;
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = '❌ Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!';
                } else {
                    errorMessage = `❌ Lỗi: ${error.message}`;
                }
            }
            
            this.showNotification(errorMessage, 'error');
            this.hideProgress();
            this.renderEmptyTable();
        }
    }

    async fetchXML1Data(dateFrom, dateTo, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 2000; // 2 seconds base delay
        
        const url = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
        
        const queryJson = {
            TU_NGAY: dateFrom,
            DEN_NGAY: dateTo,
            DS_MALK: "",
            TUYEN: "-1",
            LOCTHEO: "1",
            LOAITHE: "-1",
            LOAIHS: "2",
            MATHE: "AK2,BA3,BA4,BT2,BT4,BT5,CA1,CA2,CA3,CA5,CB2,CB4,CB7,CC1,CD2,CD4,CH1,CH2,CH3,CH4,CH7,CK1,CK2,CN2,CN3,CN6,CS1,CS2,CS3,CS4,CT1,CT2,CT3,CT4,CY5,DC2,DD4,DK2,DN1,DN2,DN3,DN4,DN7,DQ4,DS1,DS2,DS3,DT2,GB2,GB4,GD2,GD4,GD7,GH4,GK4,GT4,HC1,HC2,HC3,HC4,HC7,HD2,HD3,HD4,HD7,HG2,HG3,HG4,HG7,HK3,HN2,HN3,HN4,HS3,HS4,HS6,HS7,HT1,HT2,HT3,HT4,HT5,HX1,HX2,HX3,HX4,HX7,KC2,KC3,KC4,KC7,KD2,KT4,LH,LH2,LH3,LH4,LS3,LS4,LS7,LT4,MS1,MS2,MS3,MS4,MS7,NB4,ND4,NK2,NM4,NN1,NN2,NN3,NN4,NN7,NO1,NO2,NO3,NO4,NO7,NT4,NTH,NU4,PV2,PV3,PV4,QD5,QN2,QN5,QN9,SV3,SV4,TA2,TA3,TA4,TA7,TB1,TB2,TB3,TB4,TB7,TC2,TC3,TC7,TD4,TE1,TG2,TG3,TH4,TK1,TK2,TK3,TK4,TK7,TL7,TM1,TN1,TN2,TN3,TN4,TN7,TQ2,TQ3,TQ4,TQ7,TS1,TS2,TU4,TV4,TY2,TY3,TY4,TY7,XB1,XB2,XB3,XB4,XB7,XD2,XK1,XK2,XK3,XK4,XK7,XN1,XN2,XN3,XN4,XN7,XV7,YT4",
            LOAIXML: "130",
            DTBNID: "100",
            PHAMVI: "-1",
            MUCHUONG: "-1",
            NHOMBHXH: "-1",
            NHOMDV: "-1",
            CSKCB: "54018",
            KHOA: "42480",
            PHONG: "-1",
            LOAITIEPNHAN: "2",
            THEXML: "XML1"
        };

        const payload = {
            func: "ajaxCALL_SP_O",
            params: ["NTU02D060.13", JSON.stringify(queryJson) + "$-1", 0],
            uuid: this.apiService.uuid
        };

        try {
            console.log(`🔵 API 1 (XML1) Request (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, {
                url,
                payload,
                uuid: this.apiService.uuid,
                dateFrom,
                dateTo
            });

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

            const data = await response.json();
            
            console.log('🔵 API 1 (XML1) Response:', data);
            
            if (data.error_code !== 0) {
                const errorMsg = data.error_msg || 'API Error';
                console.error('❌ API 1 Error:', {
                    error_code: data.error_code,
                    error_msg: errorMsg,
                    response: data
                });
                
                // Throw error with detailed message
                throw new Error(`API XML1 Error (code: ${data.error_code}): ${errorMsg}`);
            }

            // Parse result string to JSON
            const resultJson = JSON.parse(data.result || '[]');
            console.log('✅ API 1 Parsed:', resultJson.length, 'records');
            return resultJson;
            
        } catch (error) {
            // If we have retries left, retry with exponential backoff
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
                console.warn(`⚠️ API 1 failed, retrying in ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`, error.message);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchXML1Data(dateFrom, dateTo, retryCount + 1);
            }
            
            // No more retries, throw the error
            console.error('❌ API 1 failed after all retries:', error);
            throw error;
        }
    }

    async fetchXML2Data(dateFrom, dateTo, retryCount = 0) {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 2000; // 2 seconds base delay
        
        const url = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
        
        const queryJson = {
            TU_NGAY: dateFrom,
            DEN_NGAY: dateTo,
            DS_MALK: "",
            TUYEN: "-1",
            LOCTHEO: "1",
            LOAITHE: "-1",
            LOAIHS: "2",
            MATHE: "AK2,BA3,BA4,BT2,BT4,BT5,CA1,CA2,CA3,CA5,CB2,CB4,CB7,CC1,CD2,CD4,CH1,CH2,CH3,CH4,CH7,CK1,CK2,CN2,CN3,CN6,CS1,CS2,CS3,CS4,CT1,CT2,CT3,CT4,CY5,DC2,DD4,DK2,DN1,DN2,DN3,DN4,DN7,DQ4,DS1,DS2,DS3,DT2,GB2,GB4,GD2,GD4,GD7,GH4,GK4,GT4,HC1,HC2,HC3,HC4,HC7,HD2,HD3,HD4,HD7,HG2,HG3,HG4,HG7,HK3,HN2,HN3,HN4,HS3,HS4,HS6,HS7,HT1,HT2,HT3,HT4,HT5,HX1,HX2,HX3,HX4,HX7,KC2,KC3,KC4,KC7,KD2,KT4,LH,LH2,LH3,LH4,LS3,LS4,LS7,LT4,MS1,MS2,MS3,MS4,MS7,NB4,ND4,NK2,NM4,NN1,NN2,NN3,NN4,NN7,NO1,NO2,NO3,NO4,NO7,NT4,NTH,NU4,PV2,PV3,PV4,QD5,QN2,QN5,QN9,SV3,SV4,TA2,TA3,TA4,TA7,TB1,TB2,TB3,TB4,TB7,TC2,TC3,TC7,TD4,TE1,TG2,TG3,TH4,TK1,TK2,TK3,TK4,TK7,TL7,TM1,TN1,TN2,TN3,TN4,TN7,TQ2,TQ3,TQ4,TQ7,TS1,TS2,TU4,TV4,TY2,TY3,TY4,TY7,XB1,XB2,XB3,XB4,XB7,XD2,XK1,XK2,XK3,XK4,XK7,XN1,XN2,XN3,XN4,XN7,XV7,YT4",
            LOAIXML: "130",
            DTBNID: "100",
            PHAMVI: "-1",
            MUCHUONG: "-1",
            NHOMBHXH: "-1",
            NHOMDV: "-1",
            CSKCB: "54018",
            KHOA: "42480",
            PHONG: "-1",
            LOAITIEPNHAN: "2",
            THEXML: "XML2"
        };

        const payload = {
            func: "ajaxCALL_SP_O",
            params: ["NTU02D060.13", JSON.stringify(queryJson) + "$-1", 0],
            uuid: this.apiService.uuid
        };

        try {
            console.log(`🟢 API 2 (XML2) Request (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, {
                url,
                payload,
                uuid: this.apiService.uuid,
                dateFrom,
                dateTo
            });

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

            const data = await response.json();
            
            console.log('🟢 API 2 (XML2) Response:', data);
            
            if (data.error_code !== 0) {
                const errorMsg = data.error_msg || 'API Error';
                console.error('❌ API 2 Error:', {
                    error_code: data.error_code,
                    error_msg: errorMsg,
                    response: data
                });
                
                // Throw error with detailed message
                throw new Error(`API XML2 Error (code: ${data.error_code}): ${errorMsg}`);
            }

            // Parse result string to JSON
            const resultJson = JSON.parse(data.result || '[]');
            console.log('✅ API 2 Parsed:', resultJson.length, 'records');
            return resultJson;
            
        } catch (error) {
            // If we have retries left, retry with exponential backoff
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff
                console.warn(`⚠️ API 2 failed, retrying in ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`, error.message);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchXML2Data(dateFrom, dateTo, retryCount + 1);
            }
            
            // No more retries, throw the error
            console.error('❌ API 2 failed after all retries:', error);
            throw error;
        }
    }

    mergeData(xml1Data, xml2Data) {
        // Create a map of XML1 data by MA_LK for quick lookup
        const xml1Map = new Map();
        xml1Data.forEach(item => {
            xml1Map.set(item.MA_LK, {
                MA_BENH_CHINH: item.MA_BENH_CHINH || '',
                MA_BENH_KT: item.MA_BENH_KT || ''
            });
        });

        // Merge XML2 data with XML1 data
        const merged = xml2Data.map(xml2Item => {
            const xml1Item = xml1Map.get(xml2Item.MA_LK) || {};
            
            return {
                MA_LK: xml2Item.MA_LK || '',
                MA_THUOC: xml2Item.MA_THUOC || '',
                TEN_THUOC: xml2Item.TEN_THUOC || '',
                HO_TEN: xml2Item.HO_TEN || '',
                MA_BENH_CHINH: xml1Item.MA_BENH_CHINH || '',
                MA_BENH_KT: xml1Item.MA_BENH_KT || '',
                MA_BAC_SI: xml2Item.MA_BAC_SI || ''
            };
        });

        return merged;
    }

    async renderTable(data, useAI = false) {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;

        if (data.length === 0) {
            this.renderEmptyTable();
            return;
        }

        if (useAI) {
            // AI Mode: Progressive rendering
            await this.renderTableWithAI(data);
        } else {
            // Code-based Mode: Traditional rendering
            await this.renderTableCodeBased(data);
        }
    }

    async renderTableCodeBased(data) {
        const tbody = document.getElementById('resultsTableBody');
        
        // Group data by MA_LK + HO_TEN + MA_BENH_CHINH + MA_BENH_KT (sync validation)
        const groupedData = await this.groupDataByPatientCodeBased(data);

        // Render grouped data with expand/collapse functionality
        tbody.innerHTML = '';
        this.renderGroupedData(groupedData);
    }

    async renderTableWithAI(data) {
        const tbody = document.getElementById('resultsTableBody');
        
        // Group data first WITHOUT validation (fast)
        const groupedData = this.groupDataByPatientSync(data);
        
        // Render immediately with loading state
        tbody.innerHTML = '';
        this.renderGroupedDataLoading(groupedData);
        
        // Then validate progressively in background
        await this.validateGroupsProgressively(groupedData);
    }

    renderGroupedData(groupedData) {
        const tbody = document.getElementById('resultsTableBody');
        let parentIndex = 0;
        
        groupedData.forEach(group => {
            parentIndex++;
            const groupId = `group-${parentIndex}`;
            
            // Parse patient ICDs once for this group
            const patientICDs = this.parseICDList(group.MA_BENH_CHINH, group.MA_BENH_KT);
            
            // ✅ USE CENTRALIZED FUNCTIONS
            const hasInvalidMedicines = this.hasInvalidMedicines(group.medicines, patientICDs);
            const invalidCount = this.countInvalidMedicines(group.medicines, patientICDs);
            
            // Determine severity
            const hasContraindication = group.medicines.some(med => 
                med.validation && med.validation.violatedChongChiDinh && 
                med.validation.violatedChongChiDinh.length > 0
            );
            
            // Parent row (grouped data)
            const parentRow = document.createElement('tr');
            parentRow.className = 'parent-row';
            parentRow.dataset.groupId = groupId;
            // Add data attributes for filtering and sorting
            parentRow.dataset.maLk = group.MA_LK || '';
            parentRow.dataset.hoTen = group.HO_TEN || '';
            parentRow.dataset.totalMedicines = group.medicines.length;
            parentRow.dataset.maBenhChinh = group.MA_BENH_CHINH || '';
            parentRow.dataset.maBenhKt = group.MA_BENH_KT || '';
            parentRow.dataset.maBacSi = group.MA_BAC_SI || '';
            parentRow.dataset.hasInvalidMedicines = hasInvalidMedicines ? 'true' : 'false';
            
            // Count medicines not found in database
            const notFoundCount = group.medicines.filter(med => !med.validation || !med.validation.found).length;
            parentRow.dataset.hasNotFoundMedicines = notFoundCount > 0 ? 'true' : 'false';
            
            // Add warning/error/success class based on medicine validation
            // Only add success (green) if ALL medicines are found AND valid
            const allMedicinesValid = notFoundCount === 0 && !hasInvalidMedicines;
            
            if (hasInvalidMedicines) {
                if (hasContraindication) {
                    parentRow.classList.add('parent-row-error'); // Red for contraindication
                } else {
                    parentRow.classList.add('parent-row-warning'); // Yellow for wrong indication
                }
            } else if (allMedicinesValid) {
                // All medicines are found AND valid - add green highlight
                parentRow.classList.add('parent-row-success');
            }
            
            // Build medicine count badge with warning indicator
            let medicineCountHtml = `<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; white-space: nowrap;">${group.medicines.length} thuốc</span>`;
            
            if (hasInvalidMedicines) {
                const icon = hasContraindication ? '🚫' : '⚠️';
                const color = hasContraindication ? '#dc2626' : '#f59e0b';
                medicineCountHtml += `<span style="color: ${color}; font-weight: bold; white-space: nowrap;" title="${invalidCount} thuốc không hợp lệ">${icon} ${invalidCount}</span>`;
            }
            
            medicineCountHtml += `</div>`;
            
            parentRow.innerHTML = `
                <td class="col-stt" style="cursor: pointer;">
                    <span class="expand-icon" data-group="${groupId}">▶</span>
                    ${parentIndex}
                </td>
                <td class="col-ma-lk" title="${this.escapeHtml(group.MA_LK)}">${this.escapeHtml(group.MA_LK)}</td>
                <td class="col-ho-ten" title="${this.escapeHtml(group.HO_TEN)}">${this.escapeHtml(group.HO_TEN)}</td>
                <td class="col-benh-chinh" title="${this.escapeHtml(group.MA_BENH_CHINH)}">${this.escapeHtml(group.MA_BENH_CHINH)}</td>
                <td class="col-benh-kt" title="${this.escapeHtml(group.MA_BENH_KT)}">${this.escapeHtml(group.MA_BENH_KT)}</td>
                <td class="col-ma-bac-si" title="${this.escapeHtml(group.MA_BAC_SI)}">${this.escapeHtml(this.getDoctorName(group.MA_BAC_SI))}</td>
                <td class="col-tong-thuoc">
                    ${medicineCountHtml}
                </td>
            `;

            // Add click handler for expand/collapse
            parentRow.style.cursor = 'pointer';
            parentRow.addEventListener('click', () => {
                this.toggleGroup(groupId);
            });

            tbody.appendChild(parentRow);

            // Child rows (medicines) - hidden by default
            group.medicines.forEach((medicine, medIndex) => {
                // Prepare patient ICDs for tooltip
                const patientICDs = this.parseICDList(
                    [group.MA_BENH_CHINH, group.MA_BENH_KT]
                        .filter(Boolean)
                        .join(';')
                );

                const childRow = document.createElement('tr');
                childRow.className = 'child-row';
                childRow.dataset.groupId = groupId;
                childRow.style.display = 'none';
                // Track if medicine is not found in database
                const isNotFound = !medicine.validation || !medicine.validation.found;
                childRow.dataset.medicineNotFound = isNotFound ? 'true' : 'false';
                childRow.innerHTML = `
                    <td class="col-stt" style="padding-left: 40px; color: #999;">${medIndex + 1}</td>
                    <td class="col-ma-thuoc" style="color: #667eea; font-weight: 500;" title="${this.escapeHtml(medicine.MA_THUOC)}">
                        ${this.escapeHtml(medicine.MA_THUOC)}
                    </td>
                    <td class="col-ten-thuoc" title="${this.escapeHtml(medicine.TEN_THUOC)}">${this.escapeHtml(medicine.TEN_THUOC)}</td>
                    <td colspan="4">${this.renderValidation(medicine.validation, patientICDs)}</td>
                `;
                tbody.appendChild(childRow);
            });
        });

        // Update stats - calculate total medicines from groupedData
        const totalMedicines = groupedData.reduce((sum, group) => sum + group.medicines.length, 0);
        document.getElementById('totalCount').textContent = `${parentIndex} nhóm, ${totalMedicines} thuốc`;
    }

    filterInvalidOnly(showInvalidOnly) {
        const allParentRows = document.querySelectorAll('.parent-row');
        
        allParentRows.forEach(parentRow => {
            const hasError = parentRow.classList.contains('parent-row-error') || 
                           parentRow.classList.contains('parent-row-warning');
            
            if (showInvalidOnly) {
                // Only show rows with errors/warnings
                if (hasError) {
                    parentRow.style.display = '';
                    // Also show child rows if expanded
                    const groupId = parentRow.dataset.groupId;
                    if (parentRow.classList.contains('expanded')) {
                        const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
                        childRows.forEach(row => row.style.display = '');
                    }
                } else {
                    parentRow.style.display = 'none';
                    // Hide child rows
                    const groupId = parentRow.dataset.groupId;
                    const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
                    childRows.forEach(row => row.style.display = 'none');
                }
            } else {
                // Show all parent rows
                parentRow.style.display = '';
                // Show/hide child rows based on expanded state
                const groupId = parentRow.dataset.groupId;
                const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
                const isExpanded = parentRow.classList.contains('expanded');
                childRows.forEach(row => {
                    row.style.display = isExpanded ? '' : 'none';
                });
            }
        });
        
        // Update count
        const visibleParents = Array.from(allParentRows).filter(row => row.style.display !== 'none');
        const totalMedicines = visibleParents.reduce((sum, row) => {
            const groupId = row.dataset.groupId;
            const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
            return sum + childRows.length;
        }, 0);
        
        document.getElementById('totalCount').textContent = `${visibleParents.length} nhóm, ${totalMedicines} thuốc`;
        
        if (showInvalidOnly && visibleParents.length === 0) {
            this.showNotification('✅ Không có bệnh nhân nào có thuốc không hợp lệ!', 'success');
        }
    }

    /**
     * Group data synchronously without validation (for immediate rendering)
     */
    groupDataByPatientSync(data) {
        const grouped = new Map();

        data.forEach(item => {
            const key = `${item.MA_LK}_${item.HO_TEN}_${item.MA_BENH_CHINH}_${item.MA_BENH_KT}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    MA_LK: item.MA_LK,
                    HO_TEN: item.HO_TEN,
                    MA_BENH_CHINH: item.MA_BENH_CHINH,
                    MA_BENH_KT: item.MA_BENH_KT,
                    MA_BAC_SI: item.MA_BAC_SI,
                    medicines: [],
                    validating: true // Mark as validating
                });
            }

            const medicineKey = `${item.MA_THUOC}_${item.TEN_THUOC}`;
            const group = grouped.get(key);
            const isDuplicate = group.medicines.some(
                med => `${med.MA_THUOC}_${med.TEN_THUOC}` === medicineKey
            );

            if (!isDuplicate) {
                group.medicines.push({
                    MA_THUOC: item.MA_THUOC,
                    TEN_THUOC: item.TEN_THUOC,
                    validation: null
                });
            }
        });

        // Sort medicines
        grouped.forEach(group => {
            group.medicines.sort((a, b) => {
                const nameA = (a.TEN_THUOC || '').toLowerCase();
                const nameB = (b.TEN_THUOC || '').toLowerCase();
                return nameA.localeCompare(nameB, 'vi');
            });
        });

        return Array.from(grouped.values());
    }

    /**
     * Group data with code-based validation (old method, no AI)
     */
    async groupDataByPatientCodeBased(data) {
        const grouped = new Map();

        data.forEach(item => {
            const key = `${item.MA_LK}_${item.HO_TEN}_${item.MA_BENH_CHINH}_${item.MA_BENH_KT}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    MA_LK: item.MA_LK,
                    HO_TEN: item.HO_TEN,
                    MA_BENH_CHINH: item.MA_BENH_CHINH,
                    MA_BENH_KT: item.MA_BENH_KT,
                    MA_BAC_SI: item.MA_BAC_SI,
                    medicines: []
                });
            }

            const medicineKey = `${item.MA_THUOC}_${item.TEN_THUOC}`;
            const group = grouped.get(key);
            const isDuplicate = group.medicines.some(
                med => `${med.MA_THUOC}_${med.TEN_THUOC}` === medicineKey
            );

            if (!isDuplicate) {
                group.medicines.push({
                    MA_THUOC: item.MA_THUOC,
                    TEN_THUOC: item.TEN_THUOC,
                    validation: this.validateMedicineICDCodeBased(
                        item.TEN_THUOC,
                        item.MA_BENH_CHINH,
                        item.MA_BENH_KT
                    )
                });
            }
        });

        // Sort medicines
        grouped.forEach(group => {
            group.medicines.sort((a, b) => {
                const nameA = (a.TEN_THUOC || '').toLowerCase();
                const nameB = (b.TEN_THUOC || '').toLowerCase();
                return nameA.localeCompare(nameB, 'vi');
            });
        });

        return Array.from(grouped.values());
    }

    /**
     * Validate groups progressively (AI mode) - MEGA BATCH VERSION
     * Groups multiple patients into large batches to minimize API calls
     * Target: 100+ patients → only 4-5 API calls
     */
    async validateGroupsProgressively(groupedData) {
        console.log(`🤖 AI Mega Batch Validation: ${groupedData.length} patients...`);
        
        const PATIENTS_PER_BATCH = 25; // 25 patients per API call → 100 patients = 4 calls
        const total = groupedData.length;
        let completed = 0;

        // Split patients into mega batches
        const megaBatches = [];
        for (let i = 0; i < groupedData.length; i += PATIENTS_PER_BATCH) {
            megaBatches.push(groupedData.slice(i, i + PATIENTS_PER_BATCH));
        }

        console.log(`📦 Created ${megaBatches.length} mega batches (${PATIENTS_PER_BATCH} patients each)`);

        // Process each mega batch in parallel
        const batchPromises = megaBatches.map(async (batch, batchIndex) => {
            try {
                console.log(`🚀 Processing mega batch ${batchIndex + 1}/${megaBatches.length} (${batch.length} patients)...`);

                // Prepare ALL medicines from ALL patients in this batch
                const allMedicinesData = [];
                const patientMapping = []; // Track which medicines belong to which patient

                batch.forEach((group, groupIdx) => {
                    const patientICDs = this.parseICDList(group.MA_BENH_CHINH, group.MA_BENH_KT);
                    
                    group.medicines.forEach((med) => {
                        const medicineRule = this.medicineRules.find(m => 
                            this.normalizeName(m.TEN_THUOC) === this.normalizeName(med.TEN_THUOC)
                        );
                        
                        allMedicinesData.push({
                            tenThuoc: med.TEN_THUOC,
                            chiDinh: medicineRule ? medicineRule.ICD_CHI_DINH : '',
                            chongChiDinh: medicineRule ? medicineRule.ICD_CHONG_CHI_DINH : '',
                            patientICDs: patientICDs
                        });
                        
                        // Track: this medicine belongs to which patient
                        patientMapping.push({
                            groupIdx: groupIdx,
                            group: group,
                            medicine: med
                        });
                    });
                });

                console.log(`📊 Mega batch ${batchIndex + 1}: ${allMedicinesData.length} medicines from ${batch.length} patients`);

                // ONE API CALL for entire mega batch
                const allValidationResults = await window.aiValidationService.validateMegaBatch(
                    allMedicinesData
                );

                // Distribute results back to patients
                allValidationResults.forEach((validation, index) => {
                    const mapping = patientMapping[index];
                    if (mapping) {
                        mapping.medicine.validation = validation;
                    }
                });

                // Mark all groups as validated and update UI
                batch.forEach(group => {
                    group.validating = false;
                    this.updateGroupInUI(group);
                    completed++;
                });

                console.log(`✅ Mega batch ${batchIndex + 1} complete: ${batch.length} patients validated`);
                return { success: true, batchIndex: batchIndex, patientsCount: batch.length };

            } catch (error) {
                console.error(`❌ Mega batch ${batchIndex + 1} failed:`, error);
                
                // Fallback: mark all as error
                batch.forEach(group => {
                    group.validating = false;
                    group.medicines.forEach(medicine => {
                        medicine.validation = {
                            valid: null,
                            fallback: true,
                            reasoning: 'Lỗi AI validation (mega batch)',
                            severity: 'warning'
                        };
                    });
                    this.updateGroupInUI(group);
                    completed++;
                });
                
                return { success: false, batchIndex: batchIndex, error: error };
            }
        });

        // Wait for all mega batches
        const results = await Promise.all(batchPromises);
        
        const successBatches = results.filter(r => r.success).length;
        const failBatches = results.filter(r => !r.success).length;
        
        console.log(`✅ AI Mega Batch Validation complete: ${successBatches}/${megaBatches.length} batches success`);
        console.log(`📊 Total API calls: ${megaBatches.length} (reduced from ${total})`);
        
        this.showNotification(
            `✅ Hoàn thành AI validation: ${completed}/${total} bệnh nhân (${megaBatches.length} API calls)!`, 
            failBatches > 0 ? 'warning' : 'success'
        );
    }

    /**
     * Render grouped data with loading state
     */
    renderGroupedDataLoading(groupedData) {
        const tbody = document.getElementById('resultsTableBody');
        let parentIndex = 0;
        
        groupedData.forEach(group => {
            parentIndex++;
            const groupId = `group-${parentIndex}`;
            
            // Parent row with loading indicator
            const parentRow = document.createElement('tr');
            parentRow.className = 'parent-row';
            parentRow.dataset.groupId = groupId;
            parentRow.dataset.maLk = group.MA_LK;
            
            const medicineCountBadge = `
                <div class="medicine-count-container">
                    <span class="badge badge-info">${group.medicines.length}</span>
                    <span class="validating-spinner">⏳</span>
                </div>
            `;
            
            parentRow.innerHTML = `
                <td class="col-stt">${parentIndex}</td>
                <td class="col-ma-lk">${group.MA_LK || ''}</td>
                <td class="col-ho-ten">${group.HO_TEN || ''}</td>
                <td class="col-icd">${group.MA_BENH_CHINH || ''}</td>
                <td class="col-icd-kt">${group.MA_BENH_KT || ''}</td>
                <td class="col-tong-thuoc">${medicineCountBadge}</td>
            `;
            
            tbody.appendChild(parentRow);
            
            // Child rows (collapsed initially)
            group.medicines.forEach((medicine, medIndex) => {
                const childRow = document.createElement('tr');
                childRow.className = 'child-row';
                childRow.dataset.groupId = groupId;
                childRow.style.display = 'none';
                
                childRow.innerHTML = `
                    <td class="col-stt child-stt">${parentIndex}.${medIndex + 1}</td>
                    <td class="col-ma-thuoc">${medicine.MA_THUOC || ''}</td>
                    <td class="col-ten-thuoc">${medicine.TEN_THUOC || ''}</td>
                    <td class="col-icd-chi-dinh">
                        <span class="loading-text">⏳ Đang kiểm tra...</span>
                    </td>
                    <td class="col-icd-chong-chi-dinh">
                        <span class="loading-text">⏳ Đang kiểm tra...</span>
                    </td>
                    <td class="col-ket-qua">
                        <span class="loading-text">⏳ Đang kiểm tra...</span>
                    </td>
                `;
                
                tbody.appendChild(childRow);
            });
            
            // Add click handler
            parentRow.addEventListener('click', () => {
                this.toggleRow(groupId);
            });
        });
    }

    /**
     * Update a specific group in UI after validation
     */
    updateGroupInUI(group) {
        const tbody = document.getElementById('resultsTableBody');
        const parentRow = tbody.querySelector(`tr.parent-row[data-ma-lk="${group.MA_LK}"]`);
        if (!parentRow) return;

        const groupId = parentRow.dataset.groupId;

        // Parse patient ICDs once for this group
        const patientICDs = this.parseICDList(group.MA_BENH_CHINH, group.MA_BENH_KT);

        // ✅ USE CENTRALIZED FUNCTIONS
        const hasInvalidMedicines = this.hasInvalidMedicines(group.medicines, patientICDs);
        const invalidCount = this.countInvalidMedicines(group.medicines, patientICDs);
        
        const hasContraindication = group.medicines.some(med => 
            med.validation && med.validation.hasContraindication
        );

        // Check if all medicines are found
        const allMedicinesFound = group.medicines.every(med => 
            med.validation && med.validation.found
        );
        const allMedicinesValid = allMedicinesFound && !hasInvalidMedicines;

        // Update parent row styling
        parentRow.classList.remove('parent-row-error', 'parent-row-warning', 'parent-row-success');
        if (hasInvalidMedicines) {
            if (hasContraindication) {
                parentRow.classList.add('parent-row-error');
            } else {
                parentRow.classList.add('parent-row-warning');
            }
        } else if (allMedicinesValid) {
            // All medicines are found AND valid - add green highlight
            parentRow.classList.add('parent-row-success');
        }

        // Update medicine count badge
        const medicineCountContainer = parentRow.querySelector('.medicine-count-container');
        if (medicineCountContainer) {
            let medicineCountBadge = `<span class="badge badge-info">${group.medicines.length}</span>`;
            if (hasInvalidMedicines) {
                const errorIcon = hasContraindication ? '⛔' : '⚠️';
                medicineCountBadge += `<span class="warning-indicator" title="${invalidCount} thuốc không hợp lệ">${errorIcon}</span>`;
            }
            medicineCountContainer.innerHTML = medicineCountBadge;
        }

        // Update child rows
        const childRows = tbody.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
        childRows.forEach((childRow, index) => {
            const medicine = group.medicines[index];
            if (!medicine || !medicine.validation) return;

            const validation = medicine.validation;
            const medicineRule = this.medicineRules.find(m => 
                this.normalizeName(m.TEN_THUOC) === this.normalizeName(medicine.TEN_THUOC)
            );

            // Update ICD columns
            const icdChiDinhCell = childRow.querySelector('.col-icd-chi-dinh');
            const icdChongChiDinhCell = childRow.querySelector('.col-icd-chong-chi-dinh');
            const ketQuaCell = childRow.querySelector('.col-ket-qua');

            if (icdChiDinhCell) {
                icdChiDinhCell.textContent = medicineRule ? medicineRule.ICD_CHI_DINH : '';
            }
            if (icdChongChiDinhCell) {
                icdChongChiDinhCell.textContent = medicineRule ? medicineRule.ICD_CHONG_CHI_DINH : '';
            }

            // Update result
            if (ketQuaCell) {
                // Parse patient ICDs for validation calculation
                const patientICDs = this.parseICDList(group.MA_BENH_CHINH, group.MA_BENH_KT);
                
                if (validation.fallback) {
                    ketQuaCell.innerHTML = `<span class="badge badge-warning">⚠️ Lỗi AI</span>`;
                } else if (!validation.found) {
                    ketQuaCell.innerHTML = `<span class="badge badge-secondary">Không có rule</span>`;
                } else {
                    // ✅ USE CENTRAL VALIDATION LOGIC
                    const isValid = this.calculateValidationResult(
                        patientICDs,
                        validation.chiDinhICDs || [],
                        validation.violatedChongChiDinh || []
                    );
                    
                    if (isValid) {
                        ketQuaCell.innerHTML = `<span class="badge badge-success">✓ Hợp lệ</span>`;
                    } else {
                        const hasContraindication = validation.violatedChongChiDinh && validation.violatedChongChiDinh.length > 0;
                        const errorType = hasContraindication ? 'Chống chỉ định' : 'Sai chỉ định';
                        const badgeClass = hasContraindication ? 'badge-danger' : 'badge-warning';
                        const icon = hasContraindication ? '⛔' : '⚠️';
                        
                        let tooltip = validation.reasoning || '';
                        if (validation.violatedICDs && validation.violatedICDs.length > 0) {
                            tooltip += `\nVi phạm: ${validation.violatedICDs.join(', ')}`;
                        }
                        if (validation.missingICDs && validation.missingICDs.length > 0) {
                            tooltip += `\nThiếu: ${validation.missingICDs.join(', ')}`;
                        }
                        
                        ketQuaCell.innerHTML = `
                            <span class="badge ${badgeClass}" title="${tooltip}">
                                ${icon} ${errorType}
                            </span>
                        `;
                    }
                }
            }
        });
    }

    async groupDataByPatient(data) {
        const grouped = new Map();

        // First pass: Group data by patient
        data.forEach(item => {
            // Create unique key for grouping (one per patient)
            const key = `${item.MA_LK}_${item.HO_TEN}_${item.MA_BENH_CHINH}_${item.MA_BENH_KT}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    MA_LK: item.MA_LK,
                    HO_TEN: item.HO_TEN,
                    MA_BENH_CHINH: item.MA_BENH_CHINH,
                    MA_BENH_KT: item.MA_BENH_KT,
                    MA_BAC_SI: item.MA_BAC_SI,
                    medicines: []
                });
            }

            // Add medicine only if it's unique (avoid duplicates)
            const medicineKey = `${item.MA_THUOC}_${item.TEN_THUOC}`;
            const group = grouped.get(key);
            const isDuplicate = group.medicines.some(
                med => `${med.MA_THUOC}_${med.TEN_THUOC}` === medicineKey
            );

            if (!isDuplicate) {
                group.medicines.push({
                    MA_THUOC: item.MA_THUOC,
                    TEN_THUOC: item.TEN_THUOC,
                    validation: null // Will be filled later
                });
            }
        });

        // Second pass: Validate medicines BY PATIENT (batch per patient)
        console.log(`🤖 Validating ${grouped.size} patients with their medicines...`);
        
        const patientValidationPromises = Array.from(grouped.values()).map(async (group) => {
            // Parse patient ICDs
            const patientICDs = this.parseICDList(group.MA_BENH_CHINH, group.MA_BENH_KT);
            
            // Prepare medicine data for batch validation
            const medicinesForValidation = group.medicines.map(med => {
                const medicineRule = this.medicineRules.find(m => 
                    this.normalizeName(m.TEN_THUOC) === this.normalizeName(med.TEN_THUOC)
                );
                
                return {
                    tenThuoc: med.TEN_THUOC,
                    chiDinh: medicineRule ? medicineRule.ICD_CHI_DINH : '',
                    chongChiDinh: medicineRule ? medicineRule.ICD_CHONG_CHI_DINH : ''
                };
            });

            // Batch validate all medicines for this patient in ONE API call
            let validationResults = [];
            if (window.aiValidationService && medicinesForValidation.length > 0) {
                try {
                    validationResults = await window.aiValidationService.validateBatchForPatient(
                        medicinesForValidation,
                        patientICDs
                    );
                } catch (error) {
                    console.error('❌ Batch validation failed for patient:', group.MA_LK, error);
                    // Create fallback results
                    validationResults = medicinesForValidation.map((med, index) => ({
                        medicineIndex: index + 1,
                        medicineName: med.tenThuoc,
                        valid: null,
                        fallback: true,
                        reasoning: 'Lỗi khi gọi AI',
                        severity: 'warning'
                    }));
                }
            } else {
                // Fallback if AI not available
                validationResults = medicinesForValidation.map((med, index) => ({
                    medicineIndex: index + 1,
                    medicineName: med.tenThuoc,
                    valid: null,
                    fallback: true,
                    reasoning: 'AI service không khả dụng',
                    severity: 'warning'
                }));
            }

            // Assign validation results back to medicines
            group.medicines.forEach((medicine, index) => {
                medicine.validation = validationResults[index] || {
                    valid: null,
                    fallback: true,
                    reasoning: 'Không có kết quả',
                    severity: 'warning'
                };
            });

            return group;
        });

        // Wait for all patient validations to complete
        const validatedGroups = await Promise.all(patientValidationPromises);
        
        // Sort medicines alphabetically by TEN_THUOC for each group
        validatedGroups.forEach(group => {
            group.medicines.sort((a, b) => {
                const nameA = (a.TEN_THUOC || '').toLowerCase();
                const nameB = (b.TEN_THUOC || '').toLowerCase();
                return nameA.localeCompare(nameB, 'vi');
            });
        });

        console.log(`✅ Completed validation for ${validatedGroups.length} patients`);
        return validatedGroups;
    }

    /**
     * CENTRAL VALIDATION LOGIC - Single source of truth
     * Calculate validation result based on patient ICDs and medicine requirements
     * @returns {boolean} true if valid, false otherwise
     */
    calculateValidationResult(patientICDs, chiDinhICDs, violatedChongChiDinh) {
        // 1. Contraindication has highest priority
        if (violatedChongChiDinh && violatedChongChiDinh.length > 0) {
            return false;
        }
        
        // 2. No indication requirement = valid
        if (!chiDinhICDs || chiDinhICDs.length === 0) {
            return true;
        }
        
        // 3. Check if any patient ICD matches indication requirement
        if (!patientICDs || patientICDs.length === 0) {
            return false;
        }
        
        const hasMatch = patientICDs.some(patientICD => 
            chiDinhICDs.some(requiredICD => this.matchICD(patientICD, requiredICD))
        );
        
        return hasMatch;
    }

    /**
     * Count invalid medicines in a group
     * Only counts medicines that are FOUND in database but INVALID
     * (Does NOT count medicines not found in database)
     * @param {Array} medicines - Array of medicine objects with validation
     * @param {Array} patientICDs - Patient's ICD codes
     * @returns {number} Count of invalid medicines
     */
    countInvalidMedicines(medicines, patientICDs) {
        return medicines.filter(med => {
            // Skip medicines without validation or not found in database
            if (!med.validation || !med.validation.found) return false;
            
            // ✅ USE CENTRAL VALIDATION LOGIC
            const isValid = this.calculateValidationResult(
                patientICDs,
                med.validation.chiDinhICDs || [],
                med.validation.violatedChongChiDinh || []
            );
            
            // Count only invalid medicines (found but not valid)
            return !isValid;
        }).length;
    }

    /**
     * Check if group has any invalid medicines
     * Only checks medicines that are FOUND in database but INVALID
     * (Does NOT count medicines not found in database)
     * @param {Array} medicines - Array of medicine objects with validation
     * @param {Array} patientICDs - Patient's ICD codes
     * @returns {boolean} true if has invalid medicines
     */
    hasInvalidMedicines(medicines, patientICDs) {
        return medicines.some(med => {
            // Skip medicines not found in database
            if (!med.validation || !med.validation.found) return false;
            
            // Calculate validation using central logic
            const isValid = this.calculateValidationResult(
                patientICDs,
                med.validation.chiDinhICDs || [],
                med.validation.violatedChongChiDinh || []
            );
            
            // Return true if medicine is invalid (found but not valid)
            return !isValid;
        });
    }

    /**
     * Code-based ICD validation (old method, no AI)
     */
    /**
     * Extract excluded ICD codes from a string
     * Example: "E11(trừ E11.1)" returns ["E11.1"]
     * Example: "E11(trừ E11.1, E11.5)" returns ["E11.1", "E11.5"]
     */
    extractExclusions(icdString) {
        if (!icdString) return [];
        
        const exclusions = [];
        const exclusionMatch = icdString.match(/trừ\s+([A-Z]\d+(?:\.\d+)?(?:\s*,\s*[A-Z]\d+(?:\.\d+)?)*)/gi);
        
        if (exclusionMatch) {
            exclusionMatch.forEach(match => {
                const codes = match.replace(/trừ\s+/i, '').split(/\s*,\s*/);
                codes.forEach(code => {
                    const cleaned = code.trim().toUpperCase();
                    if (cleaned) {
                        exclusions.push(cleaned);
                    }
                });
            });
        }
        
        return exclusions;
    }

    validateMedicineICDCodeBased(tenThuoc, maBenhChinh, maBenhKT) {
        // Tìm thuốc trong database
        const medicine = this.medicineRules.find(m => 
            this.normalizeName(m.TEN_THUOC) === this.normalizeName(tenThuoc)
        );

        if (!medicine) {
            return {
                found: false,
                valid: null,
                message: 'Không tìm thấy thuốc trong danh mục',
                chiDinhICDs: [],
                chongChiDinhICDs: [],
                violatedChongChiDinh: [],
                matchedICDs: [],
                missingICDs: []
            };
        }

        // Parse ICDs
        const patientICDs = this.parseICDList(maBenhChinh, maBenhKT);
        const chiDinhICDs = this.parseICDList(medicine.ICD_CHI_DINH);
        const chongChiDinhICDs = this.parseICDList(medicine.ICD_CHONG_CHI_DINH);
        
        // Extract exclusions from original strings
        const chiDinhExclusions = this.extractExclusions(medicine.ICD_CHI_DINH);
        const chongChiDinhExclusions = this.extractExclusions(medicine.ICD_CHONG_CHI_DINH);
        
        // Check contraindications (with exclusion support)
        const violatedChongChiDinh = [];
        
        for (const patientICD of patientICDs) {
            // First check if patient ICD is in exclusion list
            if (chongChiDinhExclusions.some(ex => this.matchICD(patientICD, ex))) {
                continue; // This ICD is excluded, skip it
            }
            
            for (const contraindicationICD of chongChiDinhICDs) {
                if (this.matchICD(patientICD, contraindicationICD)) {
                    violatedChongChiDinh.push(patientICD);
                    break;
                }
            }
        }

        // Check if patient has required indication (for matchedICDs, with exclusion support)
        const matchedICDs = [];
        for (const patientICD of patientICDs) {
            // First check if patient ICD is in exclusion list
            if (chiDinhExclusions.some(ex => this.matchICD(patientICD, ex))) {
                continue; // This ICD is excluded, skip it
            }
            
            for (const indicationICD of chiDinhICDs) {
                if (this.matchICD(patientICD, indicationICD)) {
                    matchedICDs.push(patientICD);
                    break;
                }
            }
        }

        // ✅ USE CENTRAL VALIDATION LOGIC
        const isValid = this.calculateValidationResult(patientICDs, chiDinhICDs, violatedChongChiDinh);

        // Build result object
        const result = {
            found: true,
            valid: isValid,
            hasContraindication: violatedChongChiDinh.length > 0,
            hasMissingIndication: chiDinhICDs.length > 0 && matchedICDs.length === 0,
            chiDinhICDs: chiDinhICDs,
            chongChiDinhICDs: chongChiDinhICDs,
            violatedChongChiDinh: violatedChongChiDinh,
            matchedICDs: matchedICDs,
            missingICDs: isValid ? [] : chiDinhICDs,
            message: ''
        };

        // Set appropriate message
        if (violatedChongChiDinh.length > 0) {
            result.message = `Thuốc chống chỉ định với ICD: ${violatedChongChiDinh.join(', ')}`;
        } else if (isValid) {
            if (chiDinhICDs.length === 0) {
                result.message = 'Thuốc hợp lệ (không có yêu cầu chỉ định)';
            } else {
                result.message = `Thuốc hợp lệ, khớp với ICD: ${matchedICDs.join(', ')}`;
            }
        } else {
            result.message = `Thiếu chỉ định. Cần có một trong các ICD: ${chiDinhICDs.join(', ')}`;
        }

        return result;
    }

    async validateMedicineICD(tenThuoc, maBenhChinh, maBenhKT) {
        // Tìm thuốc trong database
        const medicine = this.medicineRules.find(m => 
            this.normalizeName(m.TEN_THUOC) === this.normalizeName(tenThuoc)
        );

        if (!medicine) {
            return {
                found: false,
                message: 'Không tìm thấy thuốc trong danh mục'
            };
        }

        // Parse patient ICDs
        const patientICDString = [maBenhChinh, maBenhKT]
            .filter(Boolean)
            .join(';');
        const patientICDs = this.parseICDList(patientICDString);

        // ======================================================================
        // 🤖 AI-BASED VALIDATION (NEW)
        // ======================================================================
        try {
            if (window.aiValidationService) {
                console.log('🤖 Using AI validation for:', tenThuoc);
                
                const aiResult = await window.aiValidationService.validateWithAI(
                    tenThuoc,
                    medicine.ICD_CHI_DINH,
                    medicine.ICD_CHONG_CHI_DINH,
                    patientICDs
                );

                // Convert AI result to legacy format
                return {
                    found: true,
                    valid: aiResult.valid === true,
                    missingChiDinh: aiResult.missingICDs || [],
                    violatedChongChiDinh: aiResult.violatedICDs || [],
                    chiDinhICDs: this.parseICDList(medicine.ICD_CHI_DINH),
                    chongChiDinhICDs: this.parseICDList(medicine.ICD_CHONG_CHI_DINH),
                    aiAnalysis: {
                        reasoning: aiResult.reasoning,
                        severity: aiResult.severity,
                        matchedICDs: aiResult.matchedICDs,
                        source: aiResult.source,
                        model: aiResult.model
                    }
                };
            }
        } catch (error) {
            console.error('❌ AI validation failed, falling back to code-based:', error);
        }

        // ======================================================================
        // 💻 CODE-BASED VALIDATION (FALLBACK - COMMENTED OUT)
        // ======================================================================
        // Keeping this as fallback in case AI service is unavailable
        
        /*
        // Tách các mã ICD từ string thành array
        const chiDinhICDs = this.parseICDList(medicine.ICD_CHI_DINH);
        const chongChiDinhICDs = this.parseICDList(medicine.ICD_CHONG_CHI_DINH);

        // Debug logging for first 3 medicines
        if (this.medicineRules.indexOf(medicine) < 3) {
            console.log('🔍 ICD Validation Debug:', {
                medicine: tenThuoc,
                patientICDString,
                patientICDs,
                chiDinhICDs,
                chongChiDinhICDs
            });
        }

        // Validate CHỈ ĐỊNH
        const missingChiDinh = [];
        if (chiDinhICDs.length > 0) {
            // Check if at least one patient ICD matches required indication
            const hasValidIndication = patientICDs.some(patientICD => 
                this.isICDInList(patientICD, chiDinhICDs)
            );
            if (!hasValidIndication) {
                missingChiDinh.push(...chiDinhICDs);
            }
        }

        // Validate CHỐNG CHỈ ĐỊNH
        const violatedChongChiDinh = [];
        patientICDs.forEach(patientICD => {
            if (this.isICDInList(patientICD, chongChiDinhICDs)) {
                violatedChongChiDinh.push(patientICD);
            }
        });

        return {
            found: true,
            valid: missingChiDinh.length === 0 && violatedChongChiDinh.length === 0,
            missingChiDinh,
            violatedChongChiDinh,
            chiDinhICDs,
            chongChiDinhICDs
        };
        */

        // Fallback: Return safe result when AI unavailable
        console.warn('⚠️ AI service unavailable, returning safe fallback');
        const chiDinhICDs = this.parseICDList(medicine.ICD_CHI_DINH);
        const chongChiDinhICDs = this.parseICDList(medicine.ICD_CHONG_CHI_DINH);
        
        return {
            found: true,
            valid: null, // Unknown
            missingChiDinh: [],
            violatedChongChiDinh: [],
            chiDinhICDs,
            chongChiDinhICDs,
            fallback: true,
            message: 'AI service unavailable'
        };
    }

    /**
     * Normalize medicine name for comparison
     * - Remove all Vietnamese diacritics (dấu)
     * - Remove all spaces
     * - Remove all special characters (dashes, dots, etc)
     * - Convert to lowercase
     */
    normalizeName(name) {
        if (!name) return '';
        
        // Step 1: Remove Vietnamese diacritics
        let normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Step 2: Convert specific Vietnamese characters
        normalized = normalized
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'd');
        
        // Step 3: Convert to lowercase
        normalized = normalized.toLowerCase();
        
        // Step 4: Remove ALL spaces
        normalized = normalized.replace(/\s+/g, '');
        
        // Step 5: Remove all dashes, hyphens, and special punctuation
        normalized = normalized.replace(/[\-–—−_\/\\.,;:'"!?()[\]{}]/g, '');
        
        // Step 6: Remove zero-width and control characters
        normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u0000-\u001F]/g, '');
        
        return normalized;
    }

    /**
     * Parse ICD codes from one or more ICD strings
     * @param {...string} icdStrings - One or more ICD strings to parse
     * @returns {Array} Array of parsed ICD codes
     */
    parseICDList(...icdStrings) {
        // Combine all ICD strings into one
        const combinedString = icdStrings
            .filter(s => s) // Remove null/undefined
            .join(';'); // Join with semicolon
        
        if (!combinedString) return [];
        
        const result = [];
        const exclusions = []; // Store excluded codes
        
        // Split by both comma and semicolon
        const parts = combinedString.split(/[,;]/).map(s => s.trim());
        
        for (let part of parts) {
            // Handle PARENTHESES with list: "J30 (J30.1; J30.2; J30.3; J30.4)" → only take codes inside parentheses
            const parenthesesMatch = part.match(/^[A-Z]\d+(?:\.\d+)?\s*\(([^)]+)\)$/i);
            if (parenthesesMatch) {
                // Extract codes inside parentheses
                const insideParentheses = parenthesesMatch[1];
                // Split by semicolon or comma
                const innerCodes = insideParentheses.split(/[;,]/).map(c => c.trim().toUpperCase());
                innerCodes.forEach(code => {
                    if (/^[A-Z]\d+(\.\d+)?[*+]?$/i.test(code)) {
                        result.push(code);
                    }
                });
                continue;
            }
            
            // Handle EXCLUSION patterns: "E11(trừ E11.1)" or "E11 (trừ E11.1)"
            const exclusionMatch = part.match(/^([A-Z]\d+(?:\.\d+)?)\s*\(?\s*trừ\s+([A-Z]\d+(?:\.\d+)?(?:\s*[;,]\s*[A-Z]\d+(?:\.\d+)?)*)\s*\)?$/i);
            if (exclusionMatch) {
                const baseCode = exclusionMatch[1].toUpperCase();
                const excludedCodes = exclusionMatch[2].split(/\s*[;,]\s*/).map(c => c.trim().toUpperCase());
                
                // Add the base code with wildcard to indicate "all subcodes"
                result.push(`${baseCode}*`);
                
                // Store exclusions for later filtering
                excludedCodes.forEach(code => {
                    exclusions.push(code);
                });
                continue;
            }
            
            // Handle range patterns: "H60 đến H95" (base codes only)
            const rangeMatch = part.match(/^([A-Z]\d+(?:\.\d+)?)\s*(?:ĐẾN|đến|-)\s*([A-Z]?\d+(?:\.\d+)?)$/i);
            if (rangeMatch) {
                const start = rangeMatch[1].toUpperCase();
                let end = rangeMatch[2].toUpperCase();
                
                // If end doesn't have letter prefix, inherit from start
                if (!/^[A-Z]/.test(end)) {
                    const startLetter = start.match(/^[A-Z]+/)[0];
                    end = startLetter + end;
                }
                
                // Extract base code and subcode
                const startParts = start.match(/^([A-Z]+)(\d+)(?:\.(\d+))?$/);
                const endParts = end.match(/^([A-Z]+)(\d+)(?:\.(\d+))?$/);
                
                if (startParts && endParts && startParts[1] === endParts[1]) {
                    const letter = startParts[1];
                    const startMain = parseInt(startParts[2]);
                    const endMain = parseInt(endParts[2]);
                    const startSub = startParts[3] ? parseInt(startParts[3]) : null;
                    const endSub = endParts[3] ? parseInt(endParts[3]) : null;
                    
                    // If same main code, expand subcodes
                    if (startMain === endMain && startSub !== null && endSub !== null) {
                        for (let i = startSub; i <= endSub; i++) {
                            result.push(`${letter}${startMain}.${i}`);
                        }
                    } else {
                        // Different main codes, expand main codes (no subcodes)
                        for (let i = startMain; i <= endMain; i++) {
                            result.push(`${letter}${i}`);
                        }
                    }
                }
                continue;
            }
            
            // Handle "ĐẾN" keyword in format like "C91.0 ĐẾN C91.9"
            if ((part.includes('ĐẾN') || part.includes('đến')) && !rangeMatch) {
                const rangeMatch2 = part.match(/^([A-Z]\d+\.\d+)\s*(?:ĐẾN|đến)\s*([A-Z]\d+\.\d+)$/i);
                if (rangeMatch2) {
                    const start = rangeMatch2[1].toUpperCase();
                    const end = rangeMatch2[2].toUpperCase();
                    
                    const startParts = start.match(/^([A-Z]+)(\d+)\.(\d+)$/);
                    const endParts = end.match(/^([A-Z]+)(\d+)\.(\d+)$/);
                    
                    if (startParts && endParts && startParts[1] === endParts[1] && startParts[2] === endParts[2]) {
                        const letter = startParts[1];
                        const mainCode = startParts[2];
                        const startSub = parseInt(startParts[3]);
                        const endSub = parseInt(endParts[3]);
                        
                        for (let i = startSub; i <= endSub; i++) {
                            result.push(`${letter}${mainCode}.${i}`);
                        }
                    }
                    continue;
                }
            }
            
            // Regular ICD code - keep full code including subcode
            // Accept: A00, I10, K25.0, G40.1, E80*, etc.
            const cleanPart = part.trim().toUpperCase();
            if (/^[A-Z]\d+(\.\d+)?[*+]?$/i.test(cleanPart)) {
                result.push(cleanPart);
            }
        }
        
        // Filter out excluded codes
        if (exclusions.length > 0) {
            return result.filter(code => {
                // If code ends with *, it means "all subcodes except exclusions"
                if (code.endsWith('*')) {
                    return true; // Keep wildcard codes for later matching
                }
                // Check if this code should be excluded
                return !exclusions.some(excluded => this.normalizeICD(code) === this.normalizeICD(excluded));
            });
        }
        
        return result;
    }

    /**
     * Normalize ICD code for comparison
     * Handles various formats and variations
     */
    normalizeICD(icd) {
        if (!icd) return '';
        
        // Convert to uppercase and trim
        let normalized = icd.toString().trim().toUpperCase();
        
        // Remove special characters (*, +, etc.)
        normalized = normalized.replace(/[*+]/g, '');
        
        // Remove spaces
        normalized = normalized.replace(/\s+/g, '');
        
        // Handle missing dot: I100 -> I10.0, E119 -> E11.9
        // Pattern: Letter + 2-3 digits + 1 digit at end (without dot)
        const missingDotMatch = normalized.match(/^([A-Z]+)(\d{2,3})(\d)$/);
        if (missingDotMatch) {
            normalized = `${missingDotMatch[1]}${missingDotMatch[2]}.${missingDotMatch[3]}`;
        }
        
        // Handle extra zeros: I10.00 -> I10.0, E11.90 -> E11.9
        normalized = normalized.replace(/\.(\d+?)0+$/, '.$1');
        
        // Handle missing leading zero in subcode: I10.1 (keep as is)
        
        return normalized;
    }

    /**
     * Enhanced ICD matching with fuzzy logic
     * Handles various formats and edge cases
     * Supports wildcard matching: E11* matches E11.0, E11.1, E11.9, etc.
     */
    matchICD(icd1, icd2) {
        // Handle wildcard patterns first (e.g., E11* matches E11.x)
        const hasWildcard1 = icd1 && icd1.toString().includes('*');
        const hasWildcard2 = icd2 && icd2.toString().includes('*');
        
        if (hasWildcard1 || hasWildcard2) {
            const baseWithWildcard = hasWildcard1 ? icd1 : icd2;
            const codeToMatch = hasWildcard1 ? icd2 : icd1;
            
            // Extract base code (remove *)
            const baseCode = baseWithWildcard.replace('*', '').trim().toUpperCase();
            const normalizedMatch = this.normalizeICD(codeToMatch);
            
            // Check if the code starts with the base
            // E11* should match E11, E11.0, E11.1, E11.9, etc.
            if (normalizedMatch.startsWith(baseCode)) {
                return true;
            }
        }
        
        // Normalize both codes
        const clean1 = this.normalizeICD(icd1);
        const clean2 = this.normalizeICD(icd2);
        
        if (!clean1 || !clean2) return false;
        
        // Exact match after normalization
        if (clean1 === clean2) return true;
        
        // Extract components
        const parts1 = clean1.match(/^([A-Z]+)(\d+)(?:\.(\d+))?$/);
        const parts2 = clean2.match(/^([A-Z]+)(\d+)(?:\.(\d+))?$/);
        
        if (!parts1 || !parts2) return false;
        
        const [, letter1, main1, sub1] = parts1;
        const [, letter2, main2, sub2] = parts2;
        
        // Different letter prefixes - no match
        if (letter1 !== letter2) return false;
        
        // Different main codes - no match
        if (main1 !== main2) return false;
        
        // Same letter and main code
        const hasSub1 = sub1 !== undefined;
        const hasSub2 = sub2 !== undefined;
        
        // If both have subcodes, must match exactly
        if (hasSub1 && hasSub2) {
            // Normalize subcodes: remove leading zeros for comparison
            const normalizedSub1 = parseInt(sub1).toString();
            const normalizedSub2 = parseInt(sub2).toString();
            return normalizedSub1 === normalizedSub2;
        }
        
        // If one has base only (e.g., I10) and other has subcode (e.g., I10.0)
        // Consider it a match (base code matches all subcodes)
        if (!hasSub1 || !hasSub2) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if patient ICD is in a list of target ICDs
     * Used for both CHỈ ĐỊNH and CHỐNG CHỈ ĐỊNH checking
     * Now supports exclusions: E11(trừ E11.1) will match E11.0, E11.9 but NOT E11.1
     */
    isICDInList(patientICD, targetICDList, originalString = '') {
        if (!patientICD || !targetICDList || targetICDList.length === 0) {
            return false;
        }
        
        // Check for exclusions in the original string
        let exclusions = [];
        if (originalString) {
            const exclusionMatch = originalString.match(/trừ\s+([A-Z]\d+(?:\.\d+)?(?:\s*,\s*[A-Z]\d+(?:\.\d+)?)*)/i);
            if (exclusionMatch) {
                exclusions = exclusionMatch[1].split(/\s*,\s*/).map(c => c.trim().toUpperCase());
            }
        }
        
        // First check if patient ICD is in exclusion list
        if (exclusions.length > 0) {
            for (const excluded of exclusions) {
                if (this.matchICD(patientICD, excluded)) {
                    return false; // Patient ICD is excluded
                }
            }
        }
        
        // Try direct matching
        for (const targetICD of targetICDList) {
            if (this.matchICD(patientICD, targetICD)) {
                return true;
            }
        }
        
        // Try fuzzy matching for edge cases
        // Example: Patient has I10, medicine requires I10.0 (should match)
        // Example: Patient has E11.9, medicine requires E119 (should match)
        const normalizedPatient = this.normalizeICD(patientICD);
        
        for (const targetICD of targetICDList) {
            const normalizedTarget = this.normalizeICD(targetICD);
            
            // Check if they share the same base code
            const patientBase = normalizedPatient.split('.')[0];
            const targetBase = normalizedTarget.split('.')[0];
            
            if (patientBase === targetBase) {
                // If one is base only, consider it a match
                if (!normalizedPatient.includes('.') || !normalizedTarget.includes('.')) {
                    return true;
                }
            }
        }
        
        return false;
    }

    toggleGroup(groupId) {
        const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
        const expandIcon = document.querySelector(`.expand-icon[data-group="${groupId}"]`);
        const parentRow = document.querySelector(`.parent-row[data-group-id="${groupId}"]`);

        if (!parentRow) return;

        const isExpanded = parentRow.classList.contains('expanded');
        const hideNotFoundMedicines = document.getElementById('hideNotFoundMedicinesCheckbox')?.checked || false;

        if (isExpanded) {
            // Collapse
            childRows.forEach(row => row.style.display = 'none');
            expandIcon.textContent = '▶';
            parentRow.classList.remove('expanded');
        } else {
            // Expand - respect hideNotFoundMedicines filter
            childRows.forEach(row => {
                if (hideNotFoundMedicines) {
                    const isNotFound = row.dataset.medicineNotFound === 'true';
                    row.style.display = isNotFound ? 'none' : '';
                } else {
                    row.style.display = '';
                }
            });
            expandIcon.textContent = '▼';
            parentRow.classList.add('expanded');
        }
    }

    renderEmptyTable() {
        const tbody = document.getElementById('resultsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="8" class="empty-state">
                        Không tìm thấy dữ liệu
                    </td>
                </tr>
            `;
        }
        document.getElementById('totalCount').textContent = '0';
    }

    generateValidationTooltip(validation, patientICDs) {
        if (!validation || !validation.found) {
            return '';
        }

        // Safe access with defaults
        const chiDinhICDs = validation.chiDinhICDs || [];
        const chongChiDinhICDs = validation.chongChiDinhICDs || [];
        const violatedChongChiDinh = validation.violatedChongChiDinh || [];
        const matchedICDs = validation.matchedICDs || [];

        let tooltip = '📋 PHÂN TÍCH CHI TIẾT:\n\n';
        
        // 1. Dữ liệu
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '📊 DỮ LIỆU:\n';
        tooltip += `• Mã bệnh của bệnh nhân: ${patientICDs.join(', ')}\n`;
        tooltip += `• ICD Chỉ định thuốc: ${chiDinhICDs.length > 0 ? chiDinhICDs.join(', ') : '(Không có)'}\n`;
        tooltip += `• ICD Chống chỉ định: ${chongChiDinhICDs.length > 0 ? chongChiDinhICDs.join(', ') : '(Không có)'}\n\n`;
        
        // 2. Phân tích CHỈ ĐỊNH
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '🔍 PHÂN TÍCH CHỈ ĐỊNH:\n';
        
        if (chiDinhICDs.length === 0) {
            tooltip += '• Thuốc không có yêu cầu chỉ định cụ thể\n';
            tooltip += '✅ Kết luận: HỢP LỆ (không cần kiểm tra)\n\n';
        } else {
            // Find matching ICDs using enhanced matching
            const foundMatches = [];
            patientICDs.forEach(patientICD => {
                chiDinhICDs.forEach(requiredICD => {
                    if (this.matchICD(patientICD, requiredICD)) {
                        // Show normalized versions for clarity
                        const norm1 = this.normalizeICD(patientICD);
                        const norm2 = this.normalizeICD(requiredICD);
                        if (norm1 === norm2) {
                            foundMatches.push(`${patientICD} ↔️ ${requiredICD}`);
                        } else {
                            foundMatches.push(`${patientICD} (${norm1}) ↔️ ${requiredICD} (${norm2})`);
                        }
                    }
                });
            });

            if (foundMatches.length > 0) {
                tooltip += '• Tìm thấy mã bệnh khớp với chỉ định:\n';
                foundMatches.forEach(match => {
                    tooltip += `  ✓ ${match}\n`;
                });
                tooltip += '✅ Kết luận: HỢP LỆ (có ít nhất 1 mã khớp)\n\n';
            } else {
                tooltip += '• Không tìm thấy mã bệnh nào khớp với chỉ định\n';
                tooltip += '❌ Kết luận: THIẾU CHỈ ĐỊNH\n\n';
            }
        }
        
        // 3. Phân tích CHỐNG CHỈ ĐỊNH
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '🔍 PHÂN TÍCH CHỐNG CHỈ ĐỊNH:\n';
        
        if (chongChiDinhICDs.length === 0) {
            tooltip += '• Thuốc không có chống chỉ định\n';
            tooltip += '✅ Kết luận: AN TOÀN (không có hạn chế)\n\n';
        } else {
            if (violatedChongChiDinh.length > 0) {
                tooltip += '• Phát hiện vi phạm chống chỉ định:\n';
                violatedChongChiDinh.forEach(icd => {
                    tooltip += `  ❌ ${icd}\n`;
                });
                tooltip += '🚫 Kết luận: CHỐNG CHỈ ĐỊNH (không được dùng)\n\n';
            } else {
                tooltip += '• Không có mã bệnh nào vi phạm chống chỉ định\n';
                tooltip += '✅ Kết luận: AN TOÀN\n\n';
            }
        }
        
        // 4. Kết quả tổng hợp - ✅ USE CENTRAL VALIDATION LOGIC
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '📌 KẾT QUẢ TỔNG HỢP:\n';
        
        const isValid = this.calculateValidationResult(patientICDs, chiDinhICDs, violatedChongChiDinh);
        
        if (violatedChongChiDinh.length > 0) {
            tooltip += '❌ CHỐNG CHỈ ĐỊNH - KHÔNG ĐƯỢC DÙNG\n';
            tooltip += '• Bệnh nhân có mã bệnh chống chỉ định';
        } else if (isValid) {
            tooltip += '✅ HỢP LỆ - Thuốc phù hợp với bệnh nhân\n';
            tooltip += '• Có chỉ định đúng (hoặc không yêu cầu)\n';
            tooltip += '• Không vi phạm chống chỉ định';
        } else {
            tooltip += '⚠️ KHÔNG ĐÚNG CHỈ ĐỊNH\n';
            tooltip += '• Bệnh nhân không có mã bệnh phù hợp với chỉ định thuốc';
        }
        
        return tooltip;
    }

    renderValidation(validation, patientICDs = []) {
        if (!validation) {
            return '<span style="color: #999; font-size: 12px;">Chưa kiểm tra</span>';
        }

        if (!validation.found) {
            return `<span style="color: #666; font-size: 12px;">⚠️ ${validation.message}</span>`;
        }

        // Safe access with defaults
        const violatedChongChiDinh = validation.violatedChongChiDinh || [];
        const missingICDs = validation.missingICDs || [];
        const chiDinhICDs = validation.chiDinhICDs || [];

        // Generate tooltip
        const tooltip = this.generateValidationTooltip(validation, patientICDs);

        // ✅ USE CENTRAL VALIDATION LOGIC
        const isValid = this.calculateValidationResult(patientICDs, chiDinhICDs, violatedChongChiDinh);

        if (isValid) {
            return `<span class="validation-result" style="color: #10b981; font-weight: 600; font-size: 13px;" 
                          data-tooltip="${this.escapeHtml(tooltip)}">✓ Hợp lệ</span>`;
        }

        // Build error message with tooltip
        let errorHtml = `<div class="validation-result" style="font-size: 12px; line-height: 1.8;" data-tooltip="${this.escapeHtml(tooltip)}">`;
        
        // CHỐNG CHỈ ĐỊNH (Ưu tiên cao nhất - màu đỏ)
        if (violatedChongChiDinh.length > 0) {
            errorHtml += `
                <div style="margin-bottom: 8px;">
                    <div style="color: #dc2626; font-weight: 600; margin-bottom: 4px;">
                        ❌ CHỐNG CHỈ ĐỊNH
                    </div>
                    <div style="background: #fee2e2; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #dc2626;">
                        <span style="font-family: 'Courier New', monospace; color: #991b1b; font-weight: 600; font-size: 13px;">
                            ${violatedChongChiDinh.join(', ')}
                        </span>
                    </div>
                </div>
            `;
        }
        // THIẾU CHỈ ĐỊNH (Chỉ hiển thị khi KHÔNG có chống chỉ định - màu vàng)
        else if (missingICDs.length > 0) {
            errorHtml += `
                <div style="margin-bottom: 8px;">
                    <div style="color: #d97706; font-weight: 600; margin-bottom: 4px;">
                        ⚠️ KHÔNG ĐÚNG CHỈ ĐỊNH
                    </div>
                    <div style="background: #fef3c7; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #f59e0b;">
                        <div style="color: #78350f; font-size: 11px; margin-bottom: 3px;">
                            Thuốc này chỉ định cho:
                        </div>
                        <span style="font-family: 'Courier New', monospace; color: #92400e; font-weight: 500; font-size: 12px;">
                            ${chiDinhICDs.join(', ')}
                        </span>
                    </div>
                </div>
            `;
        }

        errorHtml += '</div>';
        return errorHtml;
    }

    showProgress(message) {
        const progressSection = document.getElementById('progressSection');
        const progressStatus = document.getElementById('progressStatus');
        
        if (progressSection) {
            progressSection.style.display = 'block';
        }
        
        if (progressStatus) {
            progressStatus.textContent = message;
        }
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
    }

    hideProgress() {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.style.display = 'none';
        }
    }



    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
        notification.innerHTML = `
            <span class="icon">${icon}</span>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ==================== TABLE CONTROLS ====================

    /**
     * Expand all patient groups
     */
    expandAll() {
        const hideNotFoundMedicines = document.getElementById('hideNotFoundMedicinesCheckbox')?.checked || false;
        const parentRows = document.querySelectorAll('.parent-row');
        parentRows.forEach(row => {
            const groupId = row.dataset.groupId;
            const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
            const expandIcon = row.querySelector('.expand-icon');
            
            if (expandIcon && !row.classList.contains('expanded')) {
                // Respect hideNotFoundMedicines filter
                childRows.forEach(childRow => {
                    if (hideNotFoundMedicines) {
                        const isNotFound = childRow.dataset.medicineNotFound === 'true';
                        childRow.style.display = isNotFound ? 'none' : '';
                    } else {
                        childRow.style.display = '';
                    }
                });
                expandIcon.textContent = '▼';
                row.classList.add('expanded');
            }
        });
        this.showNotification('📂 Đã mở rộng tất cả', 'info');
    }

    /**
     * Collapse all patient groups
     */
    collapseAll() {
        const parentRows = document.querySelectorAll('.parent-row');
        parentRows.forEach(row => {
            const groupId = row.dataset.groupId;
            const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
            const expandIcon = row.querySelector('.expand-icon');
            
            if (expandIcon && row.classList.contains('expanded')) {
                childRows.forEach(childRow => childRow.style.display = 'none');
                expandIcon.textContent = '▶';
                row.classList.remove('expanded');
            }
        });
        this.showNotification('📁 Đã thu gọn tất cả', 'info');
    }

    /**
     * Get doctor name from code
     */
    getDoctorName(code) {
        if (!code) return '';
        
        // Try exact match first
        const exactMatch = this.doctorList.find(doc => doc.MA_BS === code);
        if (exactMatch) {
            return exactMatch.TEN_BS;
        }
        
        // Try partial match (contains)
        const partialMatch = this.doctorList.find(doc => 
            code.includes(doc.MA_BS) || doc.MA_BS.includes(code)
        );
        if (partialMatch) {
            return partialMatch.TEN_BS;
        }
        
        // Return original code if no match found
        return code;
    }

    /**
     * Render doctor dropdown with dynamic data from Google Sheets
     */
    renderDoctorDropdown() {
        const dropdown = document.getElementById('maBacSiDropdown');
        if (!dropdown) return;
        
        const optionsContainer = dropdown.querySelector('.multi-select-options');
        if (!optionsContainer) return;
        
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        // Add doctor options from loaded data
        this.doctorList.forEach(doctor => {
            const option = document.createElement('label');
            option.className = 'multi-select-option';
            option.innerHTML = `
                <input type="checkbox" value="${doctor.MA_BS}" data-name="${doctor.TEN_BS}" />
                <span>${doctor.TEN_BS} (${doctor.MA_BS})</span>
            `;
            optionsContainer.appendChild(option);
            
            // Add event listener to each checkbox
            const checkbox = option.querySelector('input');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedMaBacSi.add(checkbox.value);
                } else {
                    this.selectedMaBacSi.delete(checkbox.value);
                }
                this.updateMaBacSiDisplay();
                this.applyFilters();
            });
        });
    }

    /**
     * Initialize multi-select dropdown for MA_BAC_SI
     */
    initMaBacSiMultiSelect() {
        // Prevent duplicate initialization
        if (this.maBacSiInitialized) {
            return;
        }
        
        const multiSelectInput = document.getElementById('maBacSiMultiSelect');
        const dropdown = document.getElementById('maBacSiDropdown');
        const customInput = document.getElementById('customMaBacSiInput');
        
        if (!multiSelectInput || !dropdown || !customInput) {
            return;
        }
        
        // Initialize selectedMaBacSi if not exists
        if (!this.selectedMaBacSi) {
            this.selectedMaBacSi = new Set();
        }
        
        // Toggle dropdown
        multiSelectInput.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            multiSelectInput.classList.toggle('open', !isOpen);
            if (!isOpen) {
                customInput.focus();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!multiSelectInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
                multiSelectInput.classList.remove('open');
            }
        });
        
        // Prevent dropdown close when clicking inside
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Handle custom doctor code input
        const addCustomBtn = document.getElementById('addCustomMaBacSiBtn');
        
        const addCustomCode = () => {
            const customCode = customInput.value.trim();
            if (customCode) {
                // Add to selected set
                this.selectedMaBacSi.add(customCode);
                
                // Create a temporary checkbox option for this custom code
                const optionsContainer = dropdown.querySelector('.multi-select-options');
                const customOption = document.createElement('label');
                customOption.className = 'multi-select-option custom-option';
                customOption.innerHTML = `
                    <input type="checkbox" value="${customCode}" data-name="${customCode}" checked />
                    <span>${customCode}</span>
                `;
                
                // Append to options container
                optionsContainer.appendChild(customOption);
                
                // Add event listener to the new checkbox
                const newCheckbox = customOption.querySelector('input');
                newCheckbox.addEventListener('change', () => {
                    if (newCheckbox.checked) {
                        this.selectedMaBacSi.add(newCheckbox.value);
                    } else {
                        this.selectedMaBacSi.delete(newCheckbox.value);
                        // Remove the custom option when unchecked
                        customOption.remove();
                    }
                    this.updateMaBacSiDisplay();
                    this.applyFilters();
                });
                
                // Update display and clear input
                this.updateMaBacSiDisplay();
                this.applyFilters();
                customInput.value = '';
            }
        };
        
        if (addCustomBtn) {
            addCustomBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addCustomCode();
            });
        }
        
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                addCustomCode();
            }
        });
        
        // Mark as initialized
        this.maBacSiInitialized = true;
    }
    
    /**
     * Update multi-select display
     */
    updateMaBacSiDisplay() {
        const multiSelectInput = document.getElementById('maBacSiMultiSelect');
        const placeholder = multiSelectInput.querySelector('.placeholder');
        const dropdown = document.getElementById('maBacSiDropdown');
        
        // Clear existing tags
        const existingTags = multiSelectInput.querySelectorAll('.multi-select-tag');
        existingTags.forEach(tag => tag.remove());
        
        if (this.selectedMaBacSi.size === 0) {
            placeholder.style.display = '';
            return;
        }
        
        placeholder.style.display = 'none';
        
        // Create selected items container if doesn't exist
        let selectedContainer = multiSelectInput.querySelector('.selected-items');
        if (!selectedContainer) {
            selectedContainer = document.createElement('div');
            selectedContainer.className = 'selected-items';
            multiSelectInput.insertBefore(selectedContainer, multiSelectInput.querySelector('.arrow'));
        }
        
        // Add tags for selected items
        this.selectedMaBacSi.forEach(value => {
            const checkbox = dropdown.querySelector(`input[value="${value}"]`);
            const name = checkbox?.dataset.name || value;
            
            const tag = document.createElement('span');
            tag.className = 'multi-select-tag';
            tag.innerHTML = `
                ${name}
                <span class="remove" data-value="${value}">×</span>
            `;
            
            // Remove tag on click
            const removeBtn = tag.querySelector('.remove');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedMaBacSi.delete(value);
                checkbox.checked = false;
                this.updateMaBacSiDisplay();
                this.applyFilters();
            });
            
            selectedContainer.appendChild(tag);
        });
    }

    /**
     * Apply filters based on input values
     */
    applyFilters() {
        const filterMaLK = document.getElementById('filterMaLKInput').value.toLowerCase().trim();
        const filterHoTen = document.getElementById('filterHoTenInput').value.toLowerCase().trim();
        const filterMaBenh = document.getElementById('filterMaBenhInput').value.toLowerCase().trim();
        
        // Checkbox filters
        const showInvalidOnly = document.getElementById('showInvalidOnlyCheckbox')?.checked || false;
        const hideNotFoundMedicines = document.getElementById('hideNotFoundMedicinesCheckbox')?.checked || false;
        
        const parentRows = document.querySelectorAll('.parent-row');
        let visibleCount = 0;
        
        parentRows.forEach(row => {
            const maLK = row.dataset.maLk?.toLowerCase() || '';
            const hoTen = row.dataset.hoTen?.toLowerCase() || '';
            const maBenhChinh = row.dataset.maBenhChinh?.toLowerCase() || '';
            const maBenhKt = row.dataset.maBenhKt?.toLowerCase() || '';
            const maBacSi = row.dataset.maBacSi?.toLowerCase() || '';
            const hasInvalidMedicines = row.dataset.hasInvalidMedicines === 'true';
            
            // Text filters
            const matchMaLK = !filterMaLK || maLK.includes(filterMaLK);
            const matchHoTen = !filterHoTen || hoTen.includes(filterHoTen);
            const matchMaBenh = !filterMaBenh || maBenhChinh.includes(filterMaBenh) || maBenhKt.includes(filterMaBenh);
            
            // Multi-select MA_BAC_SI filter
            const matchMaBacSi = !this.selectedMaBacSi || this.selectedMaBacSi.size === 0 || 
                                 this.selectedMaBacSi.has(maBacSi) || 
                                 Array.from(this.selectedMaBacSi).some(selected => maBacSi.includes(selected.toLowerCase()));
            
            // Checkbox filters
            const matchInvalidOnly = !showInvalidOnly || hasInvalidMedicines;
            
            // Check if patient should be hidden when hideNotFoundMedicines is enabled
            let matchNotFoundFilter = true;
            if (hideNotFoundMedicines) {
                const groupId = row.dataset.groupId;
                const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
                // Only hide patient if ALL medicines are not found
                const hasAtLeastOneFoundMedicine = Array.from(childRows).some(childRow => 
                    childRow.dataset.medicineNotFound !== 'true'
                );
                matchNotFoundFilter = hasAtLeastOneFoundMedicine;
            }
            
            // Combine all filters (AND logic)
            const shouldShow = matchMaLK && matchHoTen && matchMaBenh && matchMaBacSi && matchInvalidOnly && matchNotFoundFilter;
            
            if (shouldShow) {
                row.style.display = '';
                // Handle child rows visibility based on hideNotFoundMedicines
                const groupId = row.dataset.groupId;
                if (row.classList.contains('expanded')) {
                    const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
                    childRows.forEach(childRow => {
                        if (hideNotFoundMedicines) {
                            // Hide individual medicines that are not found
                            const isNotFound = childRow.dataset.medicineNotFound === 'true';
                            childRow.style.display = isNotFound ? 'none' : '';
                        } else {
                            childRow.style.display = '';
                        }
                    });
                }
                visibleCount++;
            } else {
                row.style.display = 'none';
                // Hide child rows too
                const groupId = row.dataset.groupId;
                const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
                childRows.forEach(childRow => childRow.style.display = 'none');
            }
        });
        
        // Update count display
        const totalCount = document.getElementById('totalCount');
        if (totalCount) {
            totalCount.textContent = visibleCount;
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('filterMaLKInput').value = '';
        document.getElementById('filterHoTenInput').value = '';
        document.getElementById('filterMaBenhInput').value = '';
        
        // Clear multi-select MA_BAC_SI
        this.selectedMaBacSi.clear();
        const checkboxes = document.querySelectorAll('#maBacSiDropdown input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
        this.updateMaBacSiDisplay();
        
        // Clear search input
        const searchInput = document.getElementById('maBacSiSearchInput');
        if (searchInput) searchInput.value = '';
        
        // Uncheck checkboxes
        const showInvalidOnlyCheckbox = document.getElementById('showInvalidOnlyCheckbox');
        const hideNotFoundMedicinesCheckbox = document.getElementById('hideNotFoundMedicinesCheckbox');
        if (showInvalidOnlyCheckbox) showInvalidOnlyCheckbox.checked = false;
        if (hideNotFoundMedicinesCheckbox) hideNotFoundMedicinesCheckbox.checked = false;
        
        // Show all rows
        const parentRows = document.querySelectorAll('.parent-row');
        parentRows.forEach(row => {
            row.style.display = '';
        });
        
        // Show all child rows if parent is expanded
        document.querySelectorAll('.parent-row.expanded').forEach(parentRow => {
            const groupId = parentRow.dataset.groupId;
            const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
            childRows.forEach(childRow => childRow.style.display = '');
        });
        
        // Restore count
        const totalCount = document.getElementById('totalCount');
        if (totalCount) {
            totalCount.textContent = parentRows.length;
        }
        
        this.showNotification('✖️ Đã xóa bộ lọc', 'info');
    }

    /**
     * Sort table by column
     */
    sortTable(column) {
        const th = document.querySelector(`th[data-column="${column}"]`);
        if (!th) return;
        
        // Determine sort direction
        let direction = 'asc';
        if (th.classList.contains('sort-asc')) {
            direction = 'desc';
        }
        
        // Remove sort classes from all headers
        document.querySelectorAll('th.sortable').forEach(header => {
            header.classList.remove('sort-asc', 'sort-desc');
        });
        
        // Add sort class to current header
        th.classList.add(`sort-${direction}`);
        
        // Get all parent rows
        const tbody = document.getElementById('resultsTableBody');
        const rows = Array.from(tbody.querySelectorAll('.parent-row'));
        
        // Sort rows
        rows.sort((a, b) => {
            let aVal, bVal;
            
            switch(column) {
                case 'MA_LK':
                    aVal = a.dataset.maLk || '';
                    bVal = b.dataset.maLk || '';
                    break;
                case 'HO_TEN':
                    aVal = a.dataset.hoTen || '';
                    bVal = b.dataset.hoTen || '';
                    break;
                case 'MA_BAC_SI':
                    aVal = a.dataset.maBacSi || '';
                    bVal = b.dataset.maBacSi || '';
                    break;
                case 'TOTAL_MEDICINES':
                    aVal = parseInt(a.dataset.totalMedicines) || 0;
                    bVal = parseInt(b.dataset.totalMedicines) || 0;
                    break;
                default:
                    return 0;
            }
            
            // Compare
            if (typeof aVal === 'number') {
                return direction === 'asc' ? aVal - bVal : bVal - aVal;
            } else {
                return direction === 'asc' 
                    ? aVal.localeCompare(bVal, 'vi')
                    : bVal.localeCompare(aVal, 'vi');
            }
        });
        
        // Re-append rows with their children
        rows.forEach(parentRow => {
            const groupId = parentRow.dataset.groupId;
            const childRows = Array.from(tbody.querySelectorAll(`.child-row[data-group-id="${groupId}"]`));
            
            tbody.appendChild(parentRow);
            childRows.forEach(childRow => {
                tbody.appendChild(childRow);
            });
        });
        
        // Update STT (row numbers)
        this.updateRowNumbers();
        
        this.showNotification(`🔄 Đã sắp xếp theo ${column} (${direction === 'asc' ? 'tăng dần' : 'giảm dần'})`, 'info');
    }

    /**
     * Update row numbers after sorting
     */
    updateRowNumbers() {
        const parentRows = document.querySelectorAll('.parent-row');
        parentRows.forEach((row, index) => {
            const sttCell = row.querySelector('td:first-child');
            if (sttCell) {
                const expandIcon = sttCell.querySelector('.expand-icon');
                if (expandIcon) {
                    // Keep the expand icon and update number
                    const iconHtml = expandIcon.outerHTML;
                    sttCell.innerHTML = `${iconHtml} ${index + 1}`;
                } else {
                    sttCell.textContent = index + 1;
                }
            }
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bhyt4210 = new BHYT4210();
    });
} else {
    window.bhyt4210 = new BHYT4210();
}
