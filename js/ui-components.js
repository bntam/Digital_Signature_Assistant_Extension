// UI Components for Medical Dashboard
// Handles UI state, notifications, and component rendering

class UIComponents {
    constructor() {
        this.notificationContainer = document.getElementById('notificationContainer');
        this.selectedPatient = null;
        this.patients = [];
        this.procedures = [];
        
        // Initialize event bus communication
        this.initializeEventBus();
        
        // Wait for DOM to be ready before initializing
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeEventListeners());
        } else {
            this.initializeEventListeners();
        }
    }
    
    // Initialize event bus subscriptions for decoupled communication
    initializeEventBus() {
        // Listen for patient selection events
        if (window.eventBus) {
            window.eventBus.on('patient:selected', (patient) => {
                this.selectedPatient = patient;
            });
            
            // Listen for data update events
            window.eventBus.on('procedures:dataChanged', () => {
                this.requestProceduresRefresh();
            });
        }
    }

    // HTML sanitization for XSS prevention
    escapeHtml(text) {
        if (typeof text !== 'string') return String(text || '');
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Safe innerHTML wrapper for user data
    safeInnerHTML(element, htmlContent) {
        if (typeof htmlContent !== 'string') {
            element.textContent = String(htmlContent || '');
            return;
        }
        element.innerHTML = htmlContent;
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('patientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterPatients(e.target.value);
            });
        }
    }

    // Show notification with XSS protection
    showNotification(message, type = 'info', duration = 5000) {
        if (!this.notificationContainer) {
            console.warn('Notification container not found');
            return null;
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Create notification content safely
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.justifyContent = 'space-between';
        contentDiv.style.alignItems = 'center';
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message; // Safe text assignment
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.fontSize = '18px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.color = '#666';
        closeButton.onclick = () => notification.remove();
        
        contentDiv.appendChild(messageSpan);
        contentDiv.appendChild(closeButton);
        notification.appendChild(contentDiv);

        this.notificationContainer.appendChild(notification);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }

        return notification;
    }

    // Update auth status
    updateAuthStatus(isConnected, message = '') {
        const authStatus = document.getElementById('authStatus');
        const statusIndicator = authStatus.querySelector('.status-indicator');
        const statusText = authStatus.querySelector('.status-text');

        if (isConnected) {
            statusIndicator.className = 'status-indicator connected';
            statusText.textContent = message || 'Đã kết nối';
        } else {
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = message || 'Mất kết nối';
        }
    }

    // Show/hide loading state
    showLoading(containerId, show = true) {
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = show ? 'flex' : 'none';
        } else {
            //console.error(`Element not found: ${containerId}`);
            // Try to find all elements with similar IDs for debugging
            const allElements = document.querySelectorAll('[id*="Loading"]');
            console.log('Found loading-related elements:', Array.from(allElements).map(el => el.id));
            
            // Debug DOM structure
            this.debugDOMStructure();
            
            // Try to create the element if it doesn't exist (fallback)
            if (containerId === 'patientsLoading') {
                this.recreatePatientsLoading(show);
            } else if (containerId === 'proceduresLoading') {
                this.recreateProceduresLoading(show);
            }
        }
    }

    // Debug DOM structure
    debugDOMStructure() {
        const patientsList = document.getElementById('patientsList');
        const proceduresList = document.getElementById('proceduresList');
        
        console.log('DOM Debug:');
        console.log('patientsList:', patientsList ? 'Found' : 'Missing');
        console.log('proceduresList:', proceduresList ? 'Found' : 'Missing');
        
        if (patientsList) {
            console.log('patientsList children:', Array.from(patientsList.children).map(el => el.id || el.className));
        }
        if (proceduresList) {
            console.log('proceduresList children:', Array.from(proceduresList.children).map(el => el.id || el.className));
        }
    }

    // Recreate missing patientsLoading element
    recreatePatientsLoading(show) {
        const patientsList = document.getElementById('patientsList');
        if (patientsList) {
            const loadingEl = document.createElement('div');
            loadingEl.id = 'patientsLoading';
            loadingEl.className = 'loading-state';
            loadingEl.innerHTML = '<div class="spinner"></div><p>Đang tải danh sách bệnh nhân...</p>';
            loadingEl.style.display = show ? 'flex' : 'none';
            patientsList.insertBefore(loadingEl, patientsList.firstChild);
        }
    }

    // Recreate missing proceduresLoading element
    recreateProceduresLoading(show) {
        const proceduresList = document.getElementById('proceduresList');
        if (proceduresList) {
            const loadingEl = document.createElement('div');
            loadingEl.id = 'proceduresLoading';
            loadingEl.className = 'loading-state';
            loadingEl.innerHTML = '<div class="spinner"></div><p>Đang tải danh sách PTTT...</p>';
            loadingEl.style.display = show ? 'flex' : 'none';
            proceduresList.insertBefore(loadingEl, proceduresList.firstChild);
        }
    }

    // Render patient list
    renderPatients(patients) {
        this.patients = patients || [];
        const patientsList = document.getElementById('patientsList');
        
        if (!patientsList) {
            console.error('patientsList element not found');
            return;
        }
        
        // Hide loading states
        this.showLoading('patientsLoading', false);
        
        // Get existing state elements to preserve them
        const patientsLoading = document.getElementById('patientsLoading');
        const patientsEmpty = document.getElementById('patientsEmpty');
        
        if (!patients || patients.length === 0) {
            if (patientsEmpty) patientsEmpty.style.display = 'flex';
            // Clear only patient items, preserve state elements
            this.clearPatientItems(patientsList);
            return;
        }

        if (patientsEmpty) patientsEmpty.style.display = 'none';
        
        // Create patient items HTML
        const patientsHTML = patients.map((patient, index) => `
            <div class="patient-item" data-patient-index="${index}">
                <div class="patient-id">#${patient.MABENHAN || 'N/A'} - ${patient.MABENHNHAN || 'N/A'}</div>
                <div class="patient-name">${patient.TENBENHNHAN || 'Tên không có'}</div>
                <div class="patient-info">
                    <span>📅 ${patient.NGAYSINH || 'N/A'}</span>
                    <span>👤 ${patient.GIOITINH || 'N/A'}</span>
                    <span>🩺 ${patient.BENHCHINH || patient.CHANDOANRAVIEN || 'N/A'}</span>
                </div>
            </div>
        `).join('');
        
        // Clear only patient items and add new ones
        this.clearPatientItems(patientsList);
        
        // Add patients HTML while preserving state elements
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = patientsHTML;
        
        while (tempDiv.firstChild) {
            patientsList.appendChild(tempDiv.firstChild);
        }

        // Add event listeners for patient selection (CSP-safe)
        this.addPatientClickListeners();

        // Update scroll height after rendering
        setTimeout(() => {
            if (this.setupResponsiveScrollHeight) {
                this.setupResponsiveScrollHeight();
            }
        }, 100);

        this.updateLastUpdate();
    }

    // Clear only patient items, preserve loading/empty state elements
    clearPatientItems(patientsList) {
        const patientItems = patientsList.querySelectorAll('.patient-item');
        patientItems.forEach(item => item.remove());
    }

    // Add click listeners for patient items (CSP-safe)
    addPatientClickListeners() {
        const patientItems = document.querySelectorAll('.patient-item');
        
        patientItems.forEach((item, idx) => {
            // Remove existing listeners to prevent duplicates
            item.removeEventListener('click', this.handlePatientClick);
            
            // Add new listener
            item.addEventListener('click', (e) => {
                const index = parseInt(item.getAttribute('data-patient-index'));
                this.selectPatient(index);
            });
        });
    }

    // Select a patient
    selectPatient(index) {
        // Update UI selection
        document.querySelectorAll('.patient-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-patient-index="${index}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        // Update selected patient info
        this.selectedPatient = this.patients[index];
        
        // Emit patient selection event for decoupled communication
        if (window.eventBus) {
            window.eventBus.emit('patient:selected', this.selectedPatient);
        }
        
        const selectedPatientEl = document.getElementById('selectedPatient');
        
        if (selectedPatientEl && this.selectedPatient) {
            const patientNameEl = selectedPatientEl.querySelector('.patient-name');
            if (patientNameEl) {
                patientNameEl.textContent = `${this.selectedPatient.TENBENHNHAN || 'Tên không có'} (#${this.selectedPatient.MABENHAN || 'N/A'})`;
            }
            
            // Load procedures for this patient using event bus
            if (window.eventBus) {
                window.eventBus.emit('procedures:needRefresh', {
                    patient: this.selectedPatient,
                    useCache: true
                });
            } else if (window.dashboard && typeof window.dashboard.loadProcedures === 'function') {
                // Fallback to direct access
                window.dashboard.loadProcedures(this.selectedPatient);
            } else {
                console.error('Dashboard loadProcedures not available');
            }
        } else {
            console.error('selectedPatientEl not found or selectedPatient is null', {
                selectedPatientEl: !!selectedPatientEl,
                selectedPatient: !!this.selectedPatient
            });
        }
    }

    // Filter patients
    filterPatients(searchTerm) {
        if (!searchTerm) {
            // Store original patients for re-rendering
            const patientsToRender = [...this.patients];
            this.renderPatientsFiltered(patientsToRender);
            return;
        }

        const filtered = this.patients.filter(patient => {
            const name = (patient.TENBENHNHAN || '').toLowerCase();
            const mabenhan = (patient.MABENHAN || '').toLowerCase();
            const mabenhnhan = (patient.MABENHNHAN || '').toLowerCase();
            const bhyt = (patient.MA_BHYT || '').toLowerCase();
            const benhchinh = (patient.BENHCHINH || '').toLowerCase();
            const search = searchTerm.toLowerCase();
            
            return name.includes(search) || 
                   mabenhan.includes(search) || 
                   mabenhnhan.includes(search) ||
                   bhyt.includes(search) ||
                   benhchinh.includes(search);
        });

        this.renderPatientsFiltered(filtered);
    }

    // Render filtered patients (without updating this.patients)
    renderPatientsFiltered(patients) {
        const patientsList = document.getElementById('patientsList');
        
        if (!patientsList) {
            console.error('patientsList element not found');
            return;
        }
        
        if (!patients || patients.length === 0) {
            patientsList.innerHTML = '<div class="empty-state"><p>Không tìm thấy bệnh nhân phù hợp</p></div>';
            return;
        }

        // Render patient items with XSS protection
        patientsList.innerHTML = patients.map((patient, index) => {
            // Find original index in this.patients array
            const originalIndex = this.patients.findIndex(p => p.TIEPNHANID === patient.TIEPNHANID);
            
            // Sanitize all user data to prevent XSS
            const mabenhan = this.escapeHtml(patient.MABENHAN || 'N/A');
            const mabenhnhan = this.escapeHtml(patient.MABENHNHAN || 'N/A');
            const tenbenhnhan = this.escapeHtml(patient.TENBENHNHAN || 'Tên không có');
            const ngaysinh = this.escapeHtml(patient.NGAYSINH || 'N/A');
            const gioitinh = this.escapeHtml(patient.GIOITINH || 'N/A');
            const tenphong = this.escapeHtml(patient.TENPHONG || 'N/A');
            const mabhyt = patient.MA_BHYT ? this.escapeHtml(patient.MA_BHYT) : '';
            const benhchinh = this.escapeHtml(patient.BENHCHINH || patient.CHANDOANRAVIEN || 'N/A');
            const trangthai = this.escapeHtml(patient.TEN_TRANGTHAI || 'N/A');
            
            return `
                <div class="patient-item" data-patient-index="${originalIndex}">
                    <div class="patient-id">#${mabenhan} - ${mabenhnhan}</div>
                    <div class="patient-name">${tenbenhnhan}</div>
                    <div class="patient-info">
                        <span>📅 ${ngaysinh}</span>
                        <span>👤 ${gioitinh}</span>
                        <span>🏥 ${tenphong}</span>
                        ${mabhyt ? `<span>💳 BHYT: ${mabhyt}</span>` : ''}
                        <span>🩺 ${benhchinh}</span>
                        <span>📊 ${trangthai}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners for patient selection
        this.addPatientClickListeners();
    }

    // Render procedures list
    renderProcedures(procedures) {
        this.procedures = procedures || [];
        const proceduresList = document.getElementById('proceduresList');
        
        if (!proceduresList) {
            console.error('proceduresList element not found');
            return;
        }
        
        // Hide loading and placeholder states
        this.showLoading('proceduresLoading', false);
        const proceduresPlaceholder = document.getElementById('proceduresPlaceholder');
        if (proceduresPlaceholder) proceduresPlaceholder.style.display = 'none';
        
        if (!procedures || procedures.length === 0) {
            const proceduresEmpty = document.getElementById('proceduresEmpty');
            if (proceduresEmpty) proceduresEmpty.style.display = 'flex';
            proceduresList.innerHTML = '';
            return;
        }

        const proceduresEmpty = document.getElementById('proceduresEmpty');
        if (proceduresEmpty) proceduresEmpty.style.display = 'none';
        
        // Create button container if it doesn't exist
        let buttonContainer = document.getElementById('procedureButtons');
        if (!buttonContainer) {
            buttonContainer = document.createElement('div');
            buttonContainer.id = 'procedureButtons';
            buttonContainer.style.cssText = 'margin-bottom: 10px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; align-items: center;';
            proceduresList.parentNode.insertBefore(buttonContainer, proceduresList);
        }

        // Create left side container for selection buttons
        let leftButtonContainer = document.getElementById('leftButtonContainer');
        if (!leftButtonContainer) {
            leftButtonContainer = document.createElement('div');
            leftButtonContainer.id = 'leftButtonContainer';
            leftButtonContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
            buttonContainer.appendChild(leftButtonContainer);
        }

        // Create right side container for action buttons  
        let rightButtonContainer = document.getElementById('rightButtonContainer');
        if (!rightButtonContainer) {
            rightButtonContainer = document.createElement('div');
            rightButtonContainer.id = 'rightButtonContainer';
            rightButtonContainer.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
            buttonContainer.appendChild(rightButtonContainer);
        }

        // Create select unsigned button
        let selectUnsignedButton = document.getElementById('selectUnsignedProcedures');
        if (!selectUnsignedButton) {
            selectUnsignedButton = document.createElement('button');
            selectUnsignedButton.id = 'selectUnsignedProcedures';
            selectUnsignedButton.className = 'select-btn';
            selectUnsignedButton.innerHTML = '✅ Chọn tất cả phiếu chưa ký số';
            selectUnsignedButton.style.cssText = 'padding: 8px 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;';
            leftButtonContainer.appendChild(selectUnsignedButton);
        }

        // Create select signed button  
        let selectSignedButton = document.getElementById('selectSignedProcedures');
        if (!selectSignedButton) {
            selectSignedButton = document.createElement('button');
            selectSignedButton.id = 'selectSignedProcedures';
            selectSignedButton.className = 'select-btn';
            selectSignedButton.innerHTML = '📝 Chọn tất cả phiếu đã ký số';
            selectSignedButton.style.cssText = 'padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;';
            leftButtonContainer.appendChild(selectSignedButton);
        }

        // Create deselect all button (always shows "Bỏ chọn tất cả")
        let deselectAllButton = document.getElementById('deselectAllProcedures');
        if (!deselectAllButton) {
            deselectAllButton = document.createElement('button');
            deselectAllButton.id = 'deselectAllProcedures';
            deselectAllButton.className = 'select-btn';
            deselectAllButton.innerHTML = '☐ Bỏ chọn tất cả';
            deselectAllButton.style.cssText = 'padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;';
            leftButtonContainer.appendChild(deselectAllButton);
        }

        // Move signature buttons to signature-actions container in panel-filters
        const signatureActionsContainer = document.getElementById('signatureActions');
        
        // Create digital signature button
        let signButton = document.getElementById('signProcedures');
        if (!signButton && signatureActionsContainer) {
            signButton = document.createElement('button');
            signButton.id = 'signProcedures';
            signButton.className = 'btn btn-success btn-sm';
            signButton.innerHTML = '<span class="icon">✍️</span> Ký số';
            signButton.disabled = true; // Initially disabled
            signatureActionsContainer.appendChild(signButton);
        } else if (signButton && signatureActionsContainer && !signatureActionsContainer.contains(signButton)) {
            // Move existing button to signature actions container
            signatureActionsContainer.appendChild(signButton);
            signButton.className = 'btn btn-success btn-sm';
            signButton.innerHTML = '<span class="icon">✍️</span> Ký số';
        }

        // Create cancel signature button
        let cancelSignButton = document.getElementById('cancelSignProcedures');
        if (!cancelSignButton && signatureActionsContainer) {
            cancelSignButton = document.createElement('button');
            cancelSignButton.id = 'cancelSignProcedures';
            cancelSignButton.className = 'btn btn-warning btn-sm';
            cancelSignButton.innerHTML = '<span class="icon">❌</span> Hủy Ký số';
            cancelSignButton.disabled = true; // Initially disabled
            signatureActionsContainer.appendChild(cancelSignButton);
        } else if (cancelSignButton && signatureActionsContainer && !signatureActionsContainer.contains(cancelSignButton)) {
            // Move existing button to signature actions container
            signatureActionsContainer.appendChild(cancelSignButton);
            cancelSignButton.className = 'btn btn-warning btn-sm';
            cancelSignButton.innerHTML = '<span class="icon">❌</span> Hủy Ký số';
        }

        // Render procedure items with checkboxes
        proceduresList.innerHTML = procedures.map((procedure, index) => {
            const isDisabled = procedure.FLAG_CA == 1;
            const titleColor = procedure.FLAG_CA != 1 ? 'color: red;' : '';
            
            // Sanitize all user data to prevent XSS
            const tenphieu = this.escapeHtml(procedure.TENPHIEU || 'Tên phiếu không có');
            const sophieu = this.escapeHtml(procedure.SOPHIEU || 'N/A');
            const nguoitao = this.escapeHtml(procedure.NGUOITAO || 'N/A');
            const statusText = procedure.TRANGTHAIMAUBENHPHAM ? 
                this.escapeHtml(this.getProcedureStatusText(procedure.TRANGTHAIMAUBENHPHAM)) : '';
            
            return `
            <div class="procedure-item" data-procedure-index="${index}" 
                 style="padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px; transition: background-color 0.2s;">
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <input type="checkbox" 
                           class="procedure-checkbox" 
                           data-procedure-index="${index}"
                           ${isDisabled ? 'disabled' : ''}
                           style="margin-top: 5px;">
                    <div style="flex: 1;">
                        <div class="procedure-name" style="${titleColor}">${tenphieu}</div>
                        <div class="procedure-info">
                            <span>📅 ${this.formatDate(procedure.NGAYMAUBENHPHAM)}</span>
                            <span>📄 Số phiếu: ${sophieu}</span>
                            <span>👨‍⚕️ ${nguoitao}</span>
                            ${statusText ? `<span>📊 Trạng thái: ${statusText}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        // Add event listeners for buttons
        selectUnsignedButton.onclick = () => {
            this.selectProceduresBySignStatus(false); // chưa ký số (FLAG_CA != 1)
            this.updateActionButtonsState();
        };
        selectSignedButton.onclick = () => {
            this.selectProceduresBySignStatus(true);  // đã ký số (FLAG_CA == 1)
            this.updateActionButtonsState();
        };
        deselectAllButton.onclick = () => {
            this.deselectAllProcedures();             // bỏ chọn tất cả
            this.updateActionButtonsState();
        };
        signButton.onclick = () => this.signSelectedProcedures();           // ký số
        cancelSignButton.onclick = () => this.cancelSignSelectedProcedures(); // hủy ký số
        
        // Add click listeners to procedure rows for checkbox toggle
        this.addProcedureRowClickListeners();
        
        // Initial button state update
        this.updateActionButtonsState();

        // Update scroll height after rendering
        setTimeout(() => {
            if (this.setupResponsiveScrollHeight) {
                this.setupResponsiveScrollHeight();
            }
        }, 100);
    }

    // Select procedures by signature status
    selectProceduresBySignStatus(selectSigned) {
        if (!this.procedures) {
            console.warn('No procedures available');
            return;
        }
        
        // Clear all selections first
        const allCheckboxes = document.querySelectorAll('.procedure-checkbox');
        allCheckboxes.forEach(cb => cb.checked = false);
        
        let selectedCount = 0;
        this.procedures.forEach((procedure, index) => {
            const checkbox = document.querySelector(`.procedure-checkbox[data-procedure-index="${index}"]`);
            const procedureRow = document.querySelector(`.procedure-item[data-procedure-index="${index}"]`);
            
            if (checkbox) {
                const isSigned = procedure.FLAG_CA == 1;
                
                // Select if signature status matches what we want (ignore disabled state for programmatic selection)
                if (isSigned === selectSigned) {
                    checkbox.checked = true;
                    selectedCount++;
                    
                    // Apply visual feedback - blue background for selected
                    if (procedureRow) {
                        procedureRow.style.backgroundColor = 'rgba(0, 124, 186, 0.1)';
                    }
                } else {
                    // Clear visual feedback for unselected
                    if (procedureRow) {
                        procedureRow.style.backgroundColor = '';
                    }
                }
            } else {
                console.warn(`❌ Checkbox not found for procedure ${index}`);
            }
        });
        
        const statusText = selectSigned ? 'đã ký số' : 'chưa ký số';
        
        // Show notification
        if (this.showNotification) {
            this.showNotification(`✅ Đã chọn ${selectedCount} phiếu ${statusText}`, 'success');
        }
    }

    // Deselect all procedures (always unchecks all)
    deselectAllProcedures() {
        const allCheckboxes = document.querySelectorAll('.procedure-checkbox');
        
        if (allCheckboxes.length === 0) return;
        
        // Uncheck all checkboxes (works even for disabled ones)
        let deselectedCount = 0;
        allCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                deselectedCount++;
            }
        });
        
        // Update visual feedback for all rows (clear all blue backgrounds)
        this.updateProcedureVisualFeedback();
        
        // Show notification
        if (this.showNotification) {
            this.showNotification(`✅ Đã bỏ chọn ${deselectedCount} phiếu`, 'success');
        }
    }

    // Get selected procedures
    getSelectedProcedures() {
        const selectedProcedures = [];
        const checkboxes = document.querySelectorAll('.procedure-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.dataset.procedureIndex);
            if (this.procedures && this.procedures[index]) {
                selectedProcedures.push(this.procedures[index]);
            }
        });
        
        return selectedProcedures;
    }

    // Add click listeners to procedure rows for checkbox toggle
    addProcedureRowClickListeners() {
        const procedureItems = document.querySelectorAll('.procedure-item');
        
        procedureItems.forEach((item, index) => {
            // Remove existing listener if any
            item.onclick = null;
            
            // Add new click listener
            item.onclick = (event) => {
                // Don't toggle if user clicked directly on checkbox
                if (event.target.type === 'checkbox') {
                    return;
                }
                
                const checkbox = item.querySelector('.procedure-checkbox');
                if (checkbox) {
                    // Toggle checkbox state (works even for disabled checkboxes)
                    checkbox.checked = !checkbox.checked;
                    
                    // Update visual feedback and action button states
                    this.updateProcedureVisualFeedback();
                    this.updateActionButtonsState();
                }
            };
            
            // Add hover effect
            item.style.cursor = 'pointer';
            item.onmouseenter = () => {
                const checkbox = item.querySelector('.procedure-checkbox');
                if (!checkbox || !checkbox.checked) {
                    item.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
            };
            item.onmouseleave = () => {
                // Restore proper background based on checkbox state
                const checkbox = item.querySelector('.procedure-checkbox');
                item.style.backgroundColor = checkbox?.checked ? 'rgba(0, 124, 186, 0.1)' : '';
            };
        });
    }

    // Update visual feedback for all procedure rows based on checkbox state
    updateProcedureVisualFeedback() {
        const procedureItems = document.querySelectorAll('.procedure-item');
        procedureItems.forEach(item => {
            const checkbox = item.querySelector('.procedure-checkbox');
            if (checkbox) {
                // Apply blue background for checked, clear for unchecked
                item.style.backgroundColor = checkbox.checked ? 'rgba(0, 124, 186, 0.1)' : '';
            }
        });
    }

    // Update action button states based on selection
    updateActionButtonsState() {
        const signButton = document.getElementById('signProcedures');
        const cancelSignButton = document.getElementById('cancelSignProcedures');
        
        if (!signButton || !cancelSignButton) return;
        
        const selectedProcedures = this.getSelectedProcedures();
        
        // Enable "Ký Số" if any selected procedure has FLAG_CA != 1
        const hasUnsignedSelected = selectedProcedures.some(proc => proc.FLAG_CA != 1);
        signButton.disabled = !hasUnsignedSelected;
        signButton.style.opacity = hasUnsignedSelected ? '1' : '0.5';
        
        // Enable "Hủy ký số" if any selected procedure has FLAG_CA == 1
        const hasSignedSelected = selectedProcedures.some(proc => proc.FLAG_CA == 1);
        cancelSignButton.disabled = !hasSignedSelected;
        cancelSignButton.style.opacity = hasSignedSelected ? '1' : '0.5';
    }

    // Sign selected procedures (POST API calls)
    async signSelectedProcedures() {
        const selectedProcedures = this.getSelectedProcedures();
        const unsignedProcedures = selectedProcedures.filter(proc => proc.FLAG_CA != 1);
        
        if (unsignedProcedures.length === 0) {
            this.showNotification('⚠️ Không có phiếu chưa ký số nào được chọn', 'warning');
            return;
        }

        // Set loading state for sign button and procedures list
        this.setButtonLoading('signProcedures', true, `Đang ký ${unsignedProcedures.length} phiếu...`);
        this.setProceduresLoading(true, `Đang ký số ${unsignedProcedures.length} phiếu...`);
        
        try {
            this.showNotification(`🔄 Đang ký số ${unsignedProcedures.length} phiếu...`, 'info');
            
            let successCount = 0;
            let errorCount = 0;
            let failedProcedures = [];
            
            for (let i = 0; i < unsignedProcedures.length; i++) {
                const procedure = unsignedProcedures[i];
                
                // Update progress in button and list overlay
                const progressText = `Đang ký ${i + 1}/${unsignedProcedures.length}...`;
                this.setButtonLoading('signProcedures', true, progressText);
                this.setProceduresLoading(true, `Ký số phiếu "${procedure.TENPHIEU || 'N/A'}" (${i + 1}/${unsignedProcedures.length})`);
                
                try {
                    await this.signSingleProcedure(procedure);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to sign procedure ${procedure.TENPHIEU}:`, error);
                    
                    // User-friendly error message based on error type
                    let errorMsg = '❌ Lỗi ký số';
                    if (error.message.includes('SmartCA') || error.message.includes('session data')) {
                        errorMsg = '🔒 Lỗi SmartCA - vui lòng kiểm tra kết nối';
                    } else if (error.message.includes('UUID') || error.message.includes('Authentication')) {
                        errorMsg = '🔐 Lỗi xác thực - vui lòng đăng nhập lại';
                    } else if (error.message.includes('network') || error.message.includes('fetch')) {
                        errorMsg = '🌐 Lỗi kết nối mạng';
                    }
                    
                    // Store detailed error for final summary
                    failedProcedures = failedProcedures || [];
                    failedProcedures.push({
                        name: procedure.TENPHIEU || 'N/A', 
                        error: errorMsg
                    });
                }
            }
            
            // Show detailed result notification
            if (successCount > 0) {
                this.showNotification(`✅ Đã ký số thành công ${successCount} phiếu`, 'success', 5000);
            }
            if (errorCount > 0) {
                let errorMessage = `❌ Không thể ký ${errorCount} phiếu`;
                if (failedProcedures.length > 0) {
                    // Group errors by type for better user understanding
                    const errorTypes = {};
                    failedProcedures.forEach(fp => {
                        if (!errorTypes[fp.error]) errorTypes[fp.error] = 0;
                        errorTypes[fp.error]++;
                    });
                    
                    const errorDetails = Object.entries(errorTypes)
                        .map(([error, count]) => `${count} phiếu: ${error}`)
                        .join(', ');
                    errorMessage += ` (${errorDetails})`;
                }
                this.showNotification(errorMessage, 'error', 10000);
            }
            
            // Refresh data after signing
            this.refreshProceduresData();
            
        } finally {
            // Always restore button and procedures list state
            this.setButtonLoading('signProcedures', false);
            this.setProceduresLoading(false);
            // Update button states after restore
            setTimeout(() => this.updateActionButtonsState(), 100);
        }
    }

    // Cancel signature for selected procedures
    async cancelSignSelectedProcedures() {
        const selectedProcedures = this.getSelectedProcedures();
        const signedProcedures = selectedProcedures.filter(proc => proc.FLAG_CA == 1);
        
        if (signedProcedures.length === 0) {
            this.showNotification('⚠️ Không có phiếu đã ký số nào được chọn', 'warning');
            return;
        }

        // Set loading state for cancel button and procedures list
        this.setButtonLoading('cancelSignProcedures', true, `Đang hủy ${signedProcedures.length} phiếu...`);
        this.setProceduresLoading(true, `Đang hủy ký số ${signedProcedures.length} phiếu...`);
        
        try {
            this.showNotification(`🔄 Đang hủy ký số ${signedProcedures.length} phiếu...`, 'info');
            
            let successCount = 0;
            let errorCount = 0;
            
            for (let i = 0; i < signedProcedures.length; i++) {
                const procedure = signedProcedures[i];
                
                // Update progress in button and list overlay
                const progressText = `Đang hủy ${i + 1}/${signedProcedures.length}...`;
                this.setButtonLoading('cancelSignProcedures', true, progressText);
                this.setProceduresLoading(true, `Hủy ký số phiếu "${procedure.TENPHIEU || 'N/A'}" (${i + 1}/${signedProcedures.length})`);
                
                try {
                    await this.cancelSignSingleProcedure(procedure);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to cancel signature for procedure ${procedure.TENPHIEU}:`, error);
                }
            }
            
            // Show result notification
            if (successCount > 0) {
                this.showNotification(`✅ Đã hủy ký số thành công ${successCount} phiếu`, 'success');
            }
            if (errorCount > 0) {
                this.showNotification(`❌ Không thể hủy ký ${errorCount} phiếu`, 'error');
            }
            
            // Refresh data after canceling signatures
            this.refreshProceduresData();
            
        } finally {
            // Always restore button and procedures list state
            this.setButtonLoading('cancelSignProcedures', false);
            this.setProceduresLoading(false);
            // Update button states after restore
            setTimeout(() => this.updateActionButtonsState(), 100);
        }
    }

    // Helper function to extract common authentication data
    extractAuthData() {
        // Get UUID from global ApiService instance or via event request
        let uuid = window.api?.uuid || window.dashboard?.apiService?.uuid;
        
        // If still no UUID, try to request it via event bus
        if (!uuid && window.eventBus) {
            // This could be enhanced to use async event communication
            // For now, fallback to direct access
        }
        
        if (!uuid) {
            throw new Error('UUID not available. Please ensure API service is initialized.');
        }

        // Extract SmartCA session data from sessionStorage
        let smartcaData;
        try {
            const smartcaString = sessionStorage.getItem('hisl2_smartca');
            if (!smartcaString) {
                throw new Error('SmartCA session data not found. Please login to SmartCA first.');
            }
            smartcaData = JSON.parse(smartcaString);
        } catch (error) {
            throw new Error('Failed to extract SmartCA session data: ' + error.message);
        }

        // Extract required params
        const refreshToken = smartcaData?.token?.refresh_token;
        const accessToken = smartcaData?.token?.access_token;
        const smartcaUser = smartcaData?.user?.uid;

        if (!refreshToken || !accessToken || !smartcaUser) {
            throw new Error('Invalid SmartCA session data. Missing required tokens or user info.');
        }

        return { uuid, refreshToken, accessToken, smartcaUser };
    }

    // Helper function to create common API payload params
    createApiParams(procedure) {
        return [
            {"name": "HOSOBENHANID", "type": "String", "value": procedure.HOSOBENHANID?.toString()},
            {"name": "maubenhphamid", "type": "String", "value": procedure.MAUBENHPHAMID?.toString()},
            {"name": "report_code", "type": "String", "value": "PHIEU_PHAUTHUAT_A4"},
            {"name": "RPT_CODE", "type": "String", "value": "PHIEU_PHAUTHUAT_A4"}
        ];
    }

    // Helper function to update FLAG_CA status
    async updateFlagCA(procedure, uuid, singType) {
        console.log(`🏁 Step 3: Updating FLAG_CA status (SINGTYPE: ${singType})...`);
        const flagPayload = {
            "func": "ajaxCALL_SP_I",
            "params": [
                "UPD.FLAG.CA",
                JSON.stringify({
                    "TABLENAME": "kbh_maubenhpham",
                    "COLUMNAME": "maubenhphamid", 
                    "COLUMDATA": procedure.KEY1?.toString(),
                    "SINGTYPE": singType,
                    "RPT_CODE": "PHIEU_PHAUTHUAT_A4",
                    "PARAM_HASHED": procedure.PARAM_HASHED
                })
            ],
            "uuid": uuid
        };

        const flagResponse = await fetch('https://bvphuyen.vncare.vn/vnpthis/RestService', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flagPayload)
        });

        if (!flagResponse.ok) {
            throw new Error(`FLAG_CA update failed: HTTP ${flagResponse.status}: ${flagResponse.statusText}`);
        }

        const flagResult = await flagResponse.json();
        console.log('✅ Step 3 - FLAG_CA update API response:', flagResult);
        return flagResult;
    }

    // Helper function to set button loading state
    setButtonLoading(buttonId, isLoading, loadingText = 'Đang xử lý...') {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isLoading) {
            // Store original content only once when first starting
            if (!button.dataset.originalContent) {
                button.dataset.originalContent = button.innerHTML;
                button.dataset.originalDisabled = button.disabled;
            }
            
            // Set loading state
            button.innerHTML = `
                <span class="loading-spinner" style="
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid #ffffff;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                    margin-right: 8px;
                "></span>
                ${loadingText}
            `;
            button.disabled = true;
            button.style.opacity = '0.7';
            button.style.cursor = 'not-allowed';

            // Add CSS animation if not exists
            if (!document.querySelector('#signature-loading-styles')) {
                const style = document.createElement('style');
                style.id = 'signature-loading-styles';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .loading-spinner {
                        animation: spin 1s linear infinite !important;
                    }
                    .procedures-loading-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(255, 255, 255, 0.8);
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        z-index: 1000;
                        border-radius: 4px;
                    }
                    .procedures-loading-overlay .loading-spinner {
                        width: 24px;
                        height: 24px;
                        border: 3px solid #007cba;
                        border-top-color: transparent;
                        border-radius: 50%;
                        margin-bottom: 10px;
                        animation: spin 1s linear infinite !important;
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            // Restore original state only if we have stored data
            if (button.dataset.originalContent) {
                button.innerHTML = button.dataset.originalContent;
                button.disabled = button.dataset.originalDisabled === 'true';
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
                
                // Clear stored data
                delete button.dataset.originalContent;
                delete button.dataset.originalDisabled;
            }
        }
    }

    // Helper function to set procedures list loading state
    setProceduresLoading(isLoading, loadingText = 'Đang xử lý...') {
        const proceduresList = document.getElementById('proceduresList');
        if (!proceduresList) return;

        const existingOverlay = document.getElementById('proceduresLoadingOverlay');

        if (isLoading) {
            // Create overlay if it doesn't exist
            if (!existingOverlay) {
                // Make procedures list container relative positioned
                const proceduresContainer = proceduresList.parentElement;
                if (proceduresContainer) {
                    proceduresContainer.style.position = 'relative';
                }

                const overlay = document.createElement('div');
                overlay.id = 'proceduresLoadingOverlay';
                overlay.className = 'procedures-loading-overlay';
                overlay.innerHTML = `
                    <div class="loading-spinner"></div>
                    <div style="font-size: 14px; color: #007cba; font-weight: 500;">${loadingText}</div>
                `;
                proceduresContainer.appendChild(overlay);
            } else {
                // Update existing overlay text
                const textElement = existingOverlay.querySelector('div:last-child');
                if (textElement) {
                    textElement.textContent = loadingText;
                }
                existingOverlay.style.display = 'flex';
            }

            // Disable all procedure interactions
            const procedureItems = proceduresList.querySelectorAll('.procedure-item');
            procedureItems.forEach(item => {
                item.style.pointerEvents = 'none';
                item.style.opacity = '0.6';
            });

            const procedureCheckboxes = proceduresList.querySelectorAll('.procedure-checkbox');
            procedureCheckboxes.forEach(checkbox => {
                checkbox.disabled = true;
            });

        } else {
            // Remove overlay
            if (existingOverlay) {
                existingOverlay.style.display = 'none';
            }

            // Re-enable procedure interactions
            const procedureItems = proceduresList.querySelectorAll('.procedure-item');
            procedureItems.forEach(item => {
                item.style.pointerEvents = '';
                item.style.opacity = '';
            });

            const procedureCheckboxes = proceduresList.querySelectorAll('.procedure-checkbox');
            procedureCheckboxes.forEach(checkbox => {
                // Only enable checkboxes that weren't originally disabled
                const procedureIndex = checkbox.dataset.procedureIndex;
                const procedure = this.procedures[procedureIndex];
                if (procedure) {
                    checkbox.disabled = procedure.FLAG_CA == 1;
                }
            });
        }
    }

    // Sign single procedure via API
    async signSingleProcedure(procedure) {
        const { uuid, refreshToken, accessToken, smartcaUser } = this.extractAuthData();

        try {
            // Step 1: Call apicarpt to sign the document
            const signPayload = {
                "sign_type": "1",
                "causer": refreshToken,
                "capassword": accessToken,
                "params": this.createApiParams(procedure),
                "smartcauser": smartcaUser
            };

            const signResponse = await fetch('https://bvphuyen.vncare.vn/vnpthis/apicarpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signPayload)
            });

            if (!signResponse.ok) {
                throw new Error(`Digital signature failed: HTTP ${signResponse.status}: ${signResponse.statusText}`);
            }

            const signResult = await signResponse.json();

            // Step 2: Call carptrender to render the signed document (async, no wait)
            const renderPayload = {
                "params": [this.createApiParams(procedure)],
                "types": "HTML;PDF"
            };

            // Fire and forget - don't await the response
            fetch('https://bvphuyen.vncare.vn/vnpthis/carptrender', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(renderPayload)
            }).then(response => {
                if (!response.ok) {
                    console.warn(`⚠️ Step 2 - Document render API returned ${response.status} (async, continuing...)`);
                }
            }).catch(error => {
                console.warn('⚠️ Step 2 - Document render API error (async, continuing...):', error.message);
            });

            // Set renderResult to null since we're not waiting
            const renderResult = null;

            // Step 3: Update FLAG_CA via helper function
            const flagResult = await this.updateFlagCA(procedure, uuid, "1");

            return {
                signResult,
                renderResult, 
                flagResult,
                success: true
            };

        } catch (error) {
            console.error('❌ Error in signSingleProcedure:', error);
            throw error;
        }
    }

    // Cancel signature for single procedure via API
    async cancelSignSingleProcedure(procedure) {
        const { uuid, refreshToken, accessToken, smartcaUser } = this.extractAuthData();

        try {
            // Step 1: Call apicarpt to cancel the digital signature
            const cancelSignPayload = {
                "sign_type": "2",
                "causer": refreshToken,
                "capassword": accessToken,
                "params": this.createApiParams(procedure),
                "smartcauser": smartcaUser
            };

            const cancelResponse = await fetch('https://bvphuyen.vncare.vn/vnpthis/apicarpt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cancelSignPayload)
            });

            if (!cancelResponse.ok) {
                throw new Error(`Cancel digital signature failed: HTTP ${cancelResponse.status}: ${cancelResponse.statusText}`);
            }

            const cancelResult = await cancelResponse.json();

            // Step 3: Update FLAG_CA via helper function
            const flagResult = await this.updateFlagCA(procedure, uuid, "2");

            return {
                cancelResult,
                flagResult,
                success: true
            };

        } catch (error) {
            console.error('❌ Error in cancelSignSingleProcedure:', error);
            throw error;
        }
    }

    // Request procedures refresh via event bus (decoupled)
    requestProceduresRefresh() {
        if (this.selectedPatient && window.eventBus) {
            // Emit event instead of direct method call
            window.eventBus.emit('procedures:needRefresh', {
                patient: this.selectedPatient
            });
        }
    }

    // Refresh procedures data after signing operations
    refreshProceduresData() {
        if (this.selectedPatient) {
            // Use event bus for decoupled communication
            if (window.eventBus) {
                this.requestProceduresRefresh();
            } else {
                // Fallback to direct access if event bus not available
                if (window.dashboard && typeof window.dashboard.loadProcedures === 'function') {
                    window.dashboard.loadProcedures(this.selectedPatient);
                }
            }
        }
    }

    // Format date string
    formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            // Input format: "05/09/2025 08:17:30" 
            const [datePart, timePart] = dateStr.split(' ');
            if (datePart) {
                return `${datePart}${timePart ? ` ${timePart.substring(0,5)}` : ''}`;
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    }

    // Get procedure type text
    getProcedureTypeText(type) {
        const typeMap = {
            '1': 'PTTT',
            '6': 'Khám bệnh',
            '163': 'Tường trình',
            '321': 'Bìa bệnh án', 
            '327': 'Kỹ thuật',
            '4': 'Điều trị'
        };
        return typeMap[type] || `Loại ${type}`;
    }

    // Get procedure status text
    getProcedureStatusText(status) {
        const statusMap = {
            '1': 'Chờ thực hiện',
            '2': 'Hoàn thành', 
            '3': 'Đã thực hiện',
            '0': 'Mới tạo'
        };
        return statusMap[status] || `Trạng thái ${status}`;
    }

    // Clear procedures display
    clearProcedures() {
        const proceduresList = document.getElementById('proceduresList');
        const proceduresEmpty = document.getElementById('proceduresEmpty');
        const proceduresLoading = document.getElementById('proceduresLoading');
        const proceduresPlaceholder = document.getElementById('proceduresPlaceholder');
        
        if (proceduresList) {
            // Clear only procedure items, preserve state elements
            const procedureItems = proceduresList.querySelectorAll('.procedure-item');
            procedureItems.forEach(item => item.remove());
        } else {
            console.warn('proceduresList not found');
        }
        
        if (proceduresEmpty) {
            proceduresEmpty.style.display = 'none';
        }
        
        if (proceduresLoading) {
            proceduresLoading.style.display = 'none';
        }
        
        if (proceduresPlaceholder) {
            proceduresPlaceholder.style.display = 'flex';
        }
        
        // Clear selected patient
        const selectedPatientEl = document.getElementById('selectedPatient');
        if (selectedPatientEl) {
            const patientNameEl = selectedPatientEl.querySelector('.patient-name');
            if (patientNameEl) {
                patientNameEl.textContent = 'Chưa chọn';
            }
        }
    }

    // Clear patients display
    clearPatients() {
        const patientsList = document.getElementById('patientsList');
        const patientsEmpty = document.getElementById('patientsEmpty');
        const patientsLoading = document.getElementById('patientsLoading');
        
        if (patientsList) {
            // Clear only patient items, preserve state elements
            const patientItems = patientsList.querySelectorAll('.patient-item');
            patientItems.forEach(item => item.remove());
        } else {
            console.warn('patientsList not found');
        }
        
        if (patientsEmpty) {
            patientsEmpty.style.display = 'flex';
        }
        
        if (patientsLoading) {
            patientsLoading.style.display = 'none';
        }

        // Clear selected patient reference
        this.selectedPatient = null;
    }

    // Update last update time
    updateLastUpdate() {
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            lastUpdateEl.textContent = `Cập nhật lần cuối: ${timeStr}`;
        }
    }

    // Show error state
    showError(message, containerId = null) {
        this.showNotification(`❌ ${message}`, 'error');
        
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; color: #f44336;">
                        <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
                        <p style="text-align: center; margin: 0;">${message}</p>
                    </div>
                `;
            }
        }
    }

    // Clear error state
    clearError(containerId) {
        if (containerId) {
            const container = document.getElementById(containerId);
            if (container) {
                // Remove error-state elements specifically
                const errorStates = container.querySelectorAll('.error-state');
                errorStates.forEach(errorEl => errorEl.remove());
                console.log(`Cleared error state from ${containerId}`);
            }
        }
    }

    // Setup responsive scroll heights for data lists
    setupResponsiveScrollHeight() {
        const updateScrollHeight = () => {
            const viewportHeight = window.innerHeight;
            const header = document.querySelector('.dashboard-header');
            const footer = document.querySelector('.dashboard-footer');
            const panelHeaders = document.querySelectorAll('.panel-header');
            
            let reservedHeight = 0;
            if (header) reservedHeight += header.offsetHeight;
            if (footer) reservedHeight += footer.offsetHeight;
            
            // Add panel header heights (assume similar height for both panels)
            if (panelHeaders.length > 0) {
                reservedHeight += panelHeaders[0].offsetHeight + 50; // Add some margin
            }
            
            // Calculate available height for lists
            const availableHeight = viewportHeight - reservedHeight - 90; // Extra margin
            const minHeight = 300; // Minimum height
            const finalHeight = Math.max(availableHeight, minHeight);
            
            // Apply to both data lists
            const dataLists = document.querySelectorAll('.data-list');
            dataLists.forEach(list => {
                list.style.maxHeight = `${finalHeight}px`;
                list.style.height = `${finalHeight}px`;
            });
        };
        
        // Update on load and resize
        updateScrollHeight();
        window.addEventListener('resize', updateScrollHeight);
        
        return updateScrollHeight;
    }
}

// Export for global use
window.UIComponents = UIComponents;
