// BHYT 4210 - Main Logic
// Handles fetching and displaying insurance data

class BHYT4210 {
    constructor() {
        this.apiService = null;
        this.allData = [];
        this.medicineRules = []; // Lưu danh sách thuốc và ICD rules
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing BHYT 4210...');
        
        // Initialize API Service
        this.apiService = new ApiService();
        await this.apiService.initializeFromSession();
        
        // Load medicine rules from JSON
        await this.loadMedicineRules();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup custom tooltip
        this.setupCustomTooltip();
        
        console.log('✅ BHYT 4210 initialized');
    }

    async loadMedicineRules() {
        try {
            const response = await fetch(chrome.runtime.getURL('data/Data_thuoc.json'));
            this.medicineRules = await response.json();
            console.log('📚 Loaded medicine rules:', this.medicineRules.length, 'medicines');
        } catch (error) {
            console.error('❌ Error loading medicine rules:', error);
            this.medicineRules = [];
        }
    }

    setupEventListeners() {
        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }

        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }

        // Medicine Data Management button
        const manageMedicineDataBtn = document.getElementById('manageMedicineDataBtn');
        if (manageMedicineDataBtn) {
            manageMedicineDataBtn.addEventListener('click', () => {
                this.openMedicineDataModal();
            });
        }

        // Add Medicine button
        const addMedicineBtn = document.getElementById('addMedicineBtn');
        if (addMedicineBtn) {
            addMedicineBtn.addEventListener('click', () => {
                this.addMedicine();
            });
        }

        // Save Medicine Data button
        const saveMedicineDataBtn = document.getElementById('saveMedicineDataBtn');
        if (saveMedicineDataBtn) {
            saveMedicineDataBtn.addEventListener('click', () => {
                this.saveMedicineData();
            });
        }

        // Filter checkbox for invalid medicines only
        const showInvalidOnlyCheckbox = document.getElementById('showInvalidOnlyCheckbox');
        if (showInvalidOnlyCheckbox) {
            showInvalidOnlyCheckbox.addEventListener('change', (e) => {
                this.filterInvalidOnly(e.target.checked);
            });
        }

        // Modal close button
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeMedicineDataModal();
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('medicineDataModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeMedicineDataModal();
                }
            });
        }

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

    async handleSearch() {
        const dateFrom = document.getElementById('dateFrom').value.trim();
        const dateTo = document.getElementById('dateTo').value.trim();

        if (!dateFrom || !dateTo) {
            this.showNotification('⚠️ Vui lòng nhập đầy đủ ngày tháng!', 'warning');
            return;
        }

        try {
            // Show progress
            this.showProgress('Đang tải dữ liệu XML1...');
            this.updateProgress(10);

            // Call API 1 (XML1)
            const xml1Data = await this.fetchXML1Data(dateFrom, dateTo);
            console.log('📊 XML1 Data:', xml1Data.length, 'records');

            this.updateProgress(40);
            this.showProgress('Đang tải dữ liệu XML2...');

            // Call API 2 (XML2)
            const xml2Data = await this.fetchXML2Data(dateFrom, dateTo);
            console.log('📊 XML2 Data:', xml2Data.length, 'records');

            this.updateProgress(70);
            this.showProgress('Đang merge dữ liệu...');

            // Merge data
            const mergedData = this.mergeData(xml1Data, xml2Data);
            console.log('✅ Merged Data:', mergedData.length, 'records');

            this.updateProgress(90);
            this.showProgress('Đang hiển thị kết quả...');

            // Render table
            this.allData = mergedData;
            this.renderTable(mergedData);

            this.updateProgress(100);
            
            setTimeout(() => {
                this.hideProgress();
            }, 500);

            this.showNotification(`✅ Tìm thấy ${mergedData.length} bản ghi!`, 'success');

        } catch (error) {
            console.error('❌ Error searching:', error);
            this.showNotification('❌ Lỗi khi tìm kiếm dữ liệu!', 'error');
            this.hideProgress();
            this.renderEmptyTable();
        }
    }

    async fetchXML1Data(dateFrom, dateTo) {
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
            KHOA: "-1",
            PHONG: "-1",
            LOAITIEPNHAN: "2",
            THEXML: "XML1"
        };

        const payload = {
            func: "ajaxCALL_SP_O",
            params: ["NTU02D060.13", JSON.stringify(queryJson) + "$-1", 0],
            uuid: this.apiService.uuid
        };

        console.log('🔵 API 1 (XML1) Request:', {
            url,
            payload,
            uuid: this.apiService.uuid
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
            throw new Error(data.error_msg || 'API Error');
        }

        // Parse result string to JSON
        const resultJson = JSON.parse(data.result || '[]');
        console.log('✅ API 1 Parsed:', resultJson.length, 'records');
        return resultJson;
    }

    async fetchXML2Data(dateFrom, dateTo) {
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
            KHOA: "-1",
            PHONG: "-1",
            LOAITIEPNHAN: "2",
            THEXML: "XML2"
        };

        const payload = {
            func: "ajaxCALL_SP_O",
            params: ["NTU02D060.13", JSON.stringify(queryJson) + "$-1", 0],
            uuid: this.apiService.uuid
        };

        console.log('🟢 API 2 (XML2) Request:', {
            url,
            payload,
            uuid: this.apiService.uuid
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
            throw new Error(data.error_msg || 'API Error');
        }

        // Parse result string to JSON
        const resultJson = JSON.parse(data.result || '[]');
        console.log('✅ API 2 Parsed:', resultJson.length, 'records');
        return resultJson;
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
                MA_BENH_KT: xml1Item.MA_BENH_KT || ''
            };
        });

        return merged;
    }

    renderTable(data) {
        const tbody = document.getElementById('resultsTableBody');
        if (!tbody) return;

        if (data.length === 0) {
            this.renderEmptyTable();
            return;
        }

        // Group data by MA_LK + HO_TEN + MA_BENH_CHINH + MA_BENH_KT
        const groupedData = this.groupDataByPatient(data);

        // Render grouped data with expand/collapse functionality
        tbody.innerHTML = '';
        let parentIndex = 0;
        
        groupedData.forEach(group => {
            parentIndex++;
            const groupId = `group-${parentIndex}`;
            
            // Check if group has any invalid medicines
            const hasInvalidMedicines = group.medicines.some(med => 
                med.validation && med.validation.found && !med.validation.valid
            );
            
            // Count invalid medicines
            const invalidCount = group.medicines.filter(med => 
                med.validation && med.validation.found && !med.validation.valid
            ).length;
            
            // Determine severity
            const hasContraindication = group.medicines.some(med => 
                med.validation && med.validation.violatedChongChiDinh && 
                med.validation.violatedChongChiDinh.length > 0
            );
            
            // Parent row (grouped data)
            const parentRow = document.createElement('tr');
            parentRow.className = 'parent-row';
            parentRow.dataset.groupId = groupId;
            
            // Add warning/error class if has invalid medicines
            if (hasInvalidMedicines) {
                if (hasContraindication) {
                    parentRow.classList.add('parent-row-error'); // Red for contraindication
                } else {
                    parentRow.classList.add('parent-row-warning'); // Yellow for wrong indication
                }
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
                childRow.innerHTML = `
                    <td class="col-stt" style="padding-left: 40px; color: #999;">${medIndex + 1}</td>
                    <td class="col-ma-thuoc" style="color: #667eea; font-weight: 500;" title="${this.escapeHtml(medicine.MA_THUOC)}">
                        ${this.escapeHtml(medicine.MA_THUOC)}
                    </td>
                    <td class="col-ten-thuoc" title="${this.escapeHtml(medicine.TEN_THUOC)}">${this.escapeHtml(medicine.TEN_THUOC)}</td>
                    <td colspan="3">${this.renderValidation(medicine.validation, patientICDs)}</td>
                `;
                tbody.appendChild(childRow);
            });
        });

        // Update stats
        document.getElementById('totalCount').textContent = `${parentIndex} nhóm, ${data.length} thuốc`;
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

    groupDataByPatient(data) {
        const grouped = new Map();

        data.forEach(item => {
            // Create unique key for grouping
            const key = `${item.MA_LK}_${item.HO_TEN}_${item.MA_BENH_CHINH}_${item.MA_BENH_KT}`;
            
            if (!grouped.has(key)) {
                grouped.set(key, {
                    MA_LK: item.MA_LK,
                    HO_TEN: item.HO_TEN,
                    MA_BENH_CHINH: item.MA_BENH_CHINH,
                    MA_BENH_KT: item.MA_BENH_KT,
                    medicines: []
                });
            }

            // Validate ICD for this medicine
            const validation = this.validateMedicineICD(
                item.TEN_THUOC,
                item.MA_BENH_CHINH,
                item.MA_BENH_KT
            );

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
                    validation: validation // Thêm kết quả validation
                });
            }
        });

        // Sort medicines alphabetically by TEN_THUOC for each group
        grouped.forEach(group => {
            group.medicines.sort((a, b) => {
                const nameA = (a.TEN_THUOC || '').toLowerCase();
                const nameB = (b.TEN_THUOC || '').toLowerCase();
                return nameA.localeCompare(nameB, 'vi');
            });
        });

        return Array.from(grouped.values());
    }

    validateMedicineICD(tenThuoc, maBenhChinh, maBenhKT) {
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

        // Tách các mã ICD từ string thành array
        const chiDinhICDs = this.parseICDList(medicine.ICD_CHI_DINH);
        const chongChiDinhICDs = this.parseICDList(medicine.ICD_CHONG_CHI_DINH);
        
        // Patient ICDs: Concatenate both fields with semicolon separator
        // Then parse to handle both comma and semicolon separators
        const patientICDString = [maBenhChinh, maBenhKT]
            .filter(Boolean) // Remove empty values
            .join(';'); // Join with semicolon
        const patientICDs = this.parseICDList(patientICDString);

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
            const hasValidIndication = patientICDs.some(icd => 
                chiDinhICDs.some(required => this.matchICD(icd, required))
            );
            if (!hasValidIndication) {
                missingChiDinh.push(...chiDinhICDs);
            }
        }

        // Validate CHỐNG CHỈ ĐỊNH
        const violatedChongChiDinh = [];
        patientICDs.forEach(icd => {
            if (chongChiDinhICDs.some(contra => this.matchICD(icd, contra))) {
                violatedChongChiDinh.push(icd);
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
    }

    normalizeName(name) {
        if (!name) return '';
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    parseICDList(icdString) {
        if (!icdString) return [];
        
        const result = [];
        
        // Split by both comma and semicolon
        const parts = icdString.split(/[,;]/).map(s => s.trim());
        
        for (let part of parts) {
            // Handle range patterns: "B35.0 ĐẾN 35.3" or "B35.0 - B35.3"
            const rangeMatch = part.match(/^([A-Z]\d+(?:\.\d+)?)\s*(?:ĐẾN|-)\s*([A-Z]?\d+(?:\.\d+)?)$/i);
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
                        // Different main codes, expand main codes
                        for (let i = startMain; i <= endMain; i++) {
                            result.push(`${letter}${i}`);
                        }
                    }
                }
                continue;
            }
            
            // Handle "ĐẾN" keyword in format like "C91.0 ĐẾN C91.9"
            if (part.includes('ĐẾN') && !rangeMatch) {
                const rangeMatch2 = part.match(/^([A-Z]\d+\.\d+)\s*ĐẾN\s*([A-Z]\d+\.\d+)$/i);
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
        
        return result;
    }

    matchICD(icd1, icd2) {
        // Remove special characters for comparison (*, +, etc.)
        const clean1 = icd1.replace(/[*+]/g, '').toUpperCase();
        const clean2 = icd2.replace(/[*+]/g, '').toUpperCase();
        
        // Exact match
        if (clean1 === clean2) return true;
        
        // Base code match (e.g., "I10" matches "I10.0", "I10.1", etc.)
        const base1 = clean1.split('.')[0];
        const base2 = clean2.split('.')[0];
        
        // If one is base code only and other has subcode, check base match
        const hasSubcode1 = clean1.includes('.');
        const hasSubcode2 = clean2.includes('.');
        
        if (base1 === base2) {
            // If both have subcodes, must match exactly
            if (hasSubcode1 && hasSubcode2) {
                return clean1 === clean2;
            }
            // If one has base only, match with any subcode
            return true;
        }
        
        return false;
    }

    toggleGroup(groupId) {
        const childRows = document.querySelectorAll(`.child-row[data-group-id="${groupId}"]`);
        const expandIcon = document.querySelector(`.expand-icon[data-group="${groupId}"]`);
        const parentRow = document.querySelector(`.parent-row[data-group-id="${groupId}"]`);

        if (!parentRow) return;

        const isExpanded = parentRow.classList.contains('expanded');

        if (isExpanded) {
            // Collapse
            childRows.forEach(row => row.style.display = 'none');
            expandIcon.textContent = '▶';
            parentRow.classList.remove('expanded');
        } else {
            // Expand
            childRows.forEach(row => row.style.display = '');
            expandIcon.textContent = '▼';
            parentRow.classList.add('expanded');
        }
    }

    renderEmptyTable() {
        const tbody = document.getElementById('resultsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7" class="empty-state">
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

        let tooltip = '📋 PHÂN TÍCH CHI TIẾT:\n\n';
        
        // 1. Dữ liệu
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '📊 DỮ LIỆU:\n';
        tooltip += `• Mã bệnh của bệnh nhân: ${patientICDs.join(', ')}\n`;
        tooltip += `• ICD Chỉ định thuốc: ${validation.chiDinhICDs.length > 0 ? validation.chiDinhICDs.join(', ') : '(Không có)'}\n`;
        tooltip += `• ICD Chống chỉ định: ${validation.chongChiDinhICDs.length > 0 ? validation.chongChiDinhICDs.join(', ') : '(Không có)'}\n\n`;
        
        // 2. Phân tích CHỈ ĐỊNH
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '🔍 PHÂN TÍCH CHỈ ĐỊNH:\n';
        
        if (validation.chiDinhICDs.length === 0) {
            tooltip += '• Thuốc không có yêu cầu chỉ định cụ thể\n';
            tooltip += '✅ Kết luận: HỢP LỆ (không cần kiểm tra)\n\n';
        } else {
            // Find matching ICDs
            const matchedICDs = [];
            patientICDs.forEach(patientICD => {
                validation.chiDinhICDs.forEach(requiredICD => {
                    if (this.matchICD(patientICD, requiredICD)) {
                        matchedICDs.push(`${patientICD} ↔️ ${requiredICD}`);
                    }
                });
            });

            if (matchedICDs.length > 0) {
                tooltip += '• Tìm thấy mã bệnh khớp với chỉ định:\n';
                matchedICDs.forEach(match => {
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
        
        if (validation.chongChiDinhICDs.length === 0) {
            tooltip += '• Thuốc không có chống chỉ định\n';
            tooltip += '✅ Kết luận: AN TOÀN (không có hạn chế)\n\n';
        } else {
            if (validation.violatedChongChiDinh.length > 0) {
                tooltip += '• Phát hiện vi phạm chống chỉ định:\n';
                validation.violatedChongChiDinh.forEach(icd => {
                    tooltip += `  ❌ ${icd}\n`;
                });
                tooltip += '🚫 Kết luận: CHỐNG CHỈ ĐỊNH (không được dùng)\n\n';
            } else {
                tooltip += '• Không có mã bệnh nào vi phạm chống chỉ định\n';
                tooltip += '✅ Kết luận: AN TOÀN\n\n';
            }
        }
        
        // 4. Kết quả tổng hợp
        tooltip += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
        tooltip += '📌 KẾT QUẢ TỔNG HỢP:\n';
        
        if (validation.valid) {
            tooltip += '✅ HỢP LỆ - Thuốc phù hợp với bệnh nhân\n';
            tooltip += '• Có chỉ định đúng (hoặc không yêu cầu)\n';
            tooltip += '• Không vi phạm chống chỉ định';
        } else {
            if (validation.violatedChongChiDinh.length > 0) {
                tooltip += '❌ CHỐNG CHỈ ĐỊNH - KHÔNG ĐƯỢC DÙNG\n';
                tooltip += '• Bệnh nhân có mã bệnh chống chỉ định';
            } else {
                tooltip += '⚠️ KHÔNG ĐÚNG CHỈ ĐỊNH\n';
                tooltip += '• Bệnh nhân không có mã bệnh phù hợp với chỉ định thuốc';
            }
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

        // Generate tooltip
        const tooltip = this.generateValidationTooltip(validation, patientICDs);

        if (validation.valid) {
            return `<span class="validation-result" style="color: #10b981; font-weight: 600; font-size: 13px;" 
                          data-tooltip="${this.escapeHtml(tooltip)}">✓ Hợp lệ</span>`;
        }

        // Build error message with tooltip
        let errorHtml = `<div class="validation-result" style="font-size: 12px; line-height: 1.8;" data-tooltip="${this.escapeHtml(tooltip)}">`;
        
        // CHỐNG CHỈ ĐỊNH (Ưu tiên cao nhất - màu đỏ)
        if (validation.violatedChongChiDinh.length > 0) {
            errorHtml += `
                <div style="margin-bottom: 8px;">
                    <div style="color: #dc2626; font-weight: 600; margin-bottom: 4px;">
                        ❌ CHỐNG CHỈ ĐỊNH
                    </div>
                    <div style="background: #fee2e2; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #dc2626;">
                        <span style="font-family: 'Courier New', monospace; color: #991b1b; font-weight: 600; font-size: 13px;">
                            ${validation.violatedChongChiDinh.join(', ')}
                        </span>
                    </div>
                </div>
            `;
        }

        // THIẾU CHỈ ĐỊNH (Cảnh báo - màu vàng)
        if (validation.missingChiDinh.length > 0) {
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
                            ${validation.chiDinhICDs.join(', ')}
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

    // Modal Management Functions
    openMedicineDataModal() {
        const modal = document.getElementById('medicineDataModal');
        modal.style.display = 'flex';
        this.renderMedicineDataTable();
    }

    closeMedicineDataModal() {
        const modal = document.getElementById('medicineDataModal');
        modal.style.display = 'none';
    }

    renderMedicineDataTable() {
        const tbody = document.getElementById('medicineDataBody');
        tbody.innerHTML = '';
        
        this.medicineRules.forEach((medicine, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="text-align: center;">${index + 1}</td>
                <td>
                    <input type="text" 
                           value="${this.escapeHtml(medicine.TEN_THUOC)}" 
                           data-field="TEN_THUOC" 
                           data-index="${index}"
                           placeholder="Tên thuốc...">
                </td>
                <td>
                    <textarea data-field="ICD_CHI_DINH" 
                              data-index="${index}"
                              placeholder="Ví dụ: I10, I15; I20.0"
                              rows="2">${this.escapeHtml(medicine.ICD_CHI_DINH || '')}</textarea>
                </td>
                <td>
                    <textarea data-field="ICD_CHONG_CHI_DINH" 
                              data-index="${index}"
                              placeholder="Ví dụ: I45, I45.8"
                              rows="2">${this.escapeHtml(medicine.ICD_CHONG_CHI_DINH || '')}</textarea>
                </td>
                <td style="text-align: center;">
                    <button class="btn btn-danger btn-sm" 
                            onclick="bhyt4210.deleteMedicine(${index})"
                            title="Xóa">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Update count
        document.getElementById('medicineCount').textContent = this.medicineRules.length;
    }

    addMedicine() {
        this.medicineRules.push({
            TEN_THUOC: '',
            ICD_CHI_DINH: '',
            ICD_CHONG_CHI_DINH: ''
        });
        this.renderMedicineDataTable();
        this.showNotification('✅ Đã thêm thuốc mới', 'success');
        
        // Scroll to bottom to show new row
        const tbody = document.getElementById('medicineDataBody');
        setTimeout(() => {
            tbody.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }

    deleteMedicine(index) {
        const medicine = this.medicineRules[index];
        if (confirm(`Xác nhận xóa thuốc "${medicine.TEN_THUOC}"?`)) {
            this.medicineRules.splice(index, 1);
            this.renderMedicineDataTable();
            this.showNotification('🗑️ Đã xóa thuốc', 'warning');
        }
    }

    saveMedicineData() {
        try {
            // Collect all changes from inputs
            const inputs = document.querySelectorAll('#medicineDataBody input, #medicineDataBody textarea');
            inputs.forEach(input => {
                const index = parseInt(input.dataset.index);
                const field = input.dataset.field;
                if (this.medicineRules[index]) {
                    this.medicineRules[index][field] = input.value.trim();
                }
            });

            // Convert to JSON
            const jsonData = JSON.stringify(this.medicineRules, null, 2);
            
            // Create download link
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Data_thuoc.json';
            a.click();
            URL.revokeObjectURL(url);

            this.showNotification('💾 Đã lưu thay đổi. File đã được tải xuống!', 'success');
            
            // Optionally close modal
            setTimeout(() => {
                this.closeMedicineDataModal();
            }, 1500);
        } catch (error) {
            console.error('Error saving medicine data:', error);
            this.showNotification('❌ Lỗi khi lưu dữ liệu', 'error');
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
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.bhyt4210 = new BHYT4210();
    });
} else {
    window.bhyt4210 = new BHYT4210();
}
