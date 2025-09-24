// Main Dashboard Controller
// Orchestrates API calls and UI updates

class MedicalDashboard {
    constructor() {
        console.log('MedicalDashboard constructor called');
        this.apiService = new ApiService();
        console.log('ApiService created:', this.apiService);
        this.ui = new UIComponents();
        console.log('UIComponents created:', this.ui);
        
        this.initialize();
    }

    // Initialize dashboard
    async initialize() {
        console.log('Initializing Medical Dashboard...');
        
        try {
            // STEP 1: Clear all localStorage first
            console.log('Clearing localStorage...');
            this.clearLocalStorage();
            
            // STEP 2: Extract session data from main BV Phuyen tab
            console.log('Extracting session data from main tab...');
            await this.extractAndStoreSessionData();
            
            // Set up event listeners
            console.log('Setting up event listeners...');
            this.setupEventListeners();
            
            // Set up SmartCA monitoring
            console.log('Setting up SmartCA monitoring...');
            this.setupSmartCAMonitoring();
            
            // Setup responsive scroll heights
            console.log('Setting up responsive scroll heights...');
            this.ui.setupResponsiveScrollHeight();
            
            // Always load hardcoded doctors first (doesn't require authentication)
            console.log('Loading hardcoded doctors...');
            this.loadHardcodedDoctors();
            
            // Update status indicators
            this.updateStatusIndicators();
            
            // Check API connection
            console.log('Checking API connection...');
            await this.checkConnection();
            
            // Load initial data if connected
            if (this.apiService.isReady()) {
                console.log('API is ready, loading initial data...');
                
                // Load patients for default doctor (Nguyễn Trần Anh Thư - 104201)
                await this.loadPatientsByDoctor("104201");
            } else {
                console.warn('API is not ready - doctors loaded but patient data will require authentication');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    // Clear all localStorage data
    clearLocalStorage() {
        try {
            const localStorageKeys = ['uuid', 'extractedSessionData', 'sessionDataTimestamp'];
            const sessionStorageKeys = ['uuid', 'hisl2_smartca'];
            
            localStorageKeys.forEach(key => {
                localStorage.removeItem(key);
                console.log(`Dashboard: Removed ${key} from localStorage`);
            });
            
            sessionStorageKeys.forEach(key => {
                sessionStorage.removeItem(key);
                console.log(`Dashboard: Removed ${key} from sessionStorage`);
            });
            
            console.log('Dashboard: Successfully cleared localStorage and sessionStorage');
        } catch (error) {
            console.error('Dashboard: Error clearing storage:', error);
        }
    }

    // Extract session data from main BV Phuyen tab
    async extractAndStoreSessionData() {
        try {
            this.updateStatusIndicators('loading');
            
            // First try to get stored session data from background (if available)
            const storedData = await this.getStoredSessionData();
            
            if (storedData && this.isSessionDataValid(storedData)) {
                console.log('Dashboard: Using stored session data');
                this.storeSessionDataLocally(storedData);
                this.updateStatusIndicators();
                return;
            }
            
            // If no valid stored data, extract from main tab
            console.log('Dashboard: Extracting fresh session data from main tab...');
            
            const response = await this.sendMessageToBackground({
                action: 'extractDataFromMainTab'
            });
            
            if (response.success && response.data) {
                console.log('Dashboard: Successfully extracted session data:', {
                    hasUuid: !!response.data.uuid,
                    hasSmartca: !!response.data.smartca
                });
                
                this.storeSessionDataLocally(response.data);
                this.updateStatusIndicators();
                
                // If no SmartCA session found, just notify user (don't auto-trigger)
                if (!response.data.smartca) {
                    console.log('Dashboard: No SmartCA session found');
                    this.ui.showNotification('⚠️ Không tìm thấy phiên SmartCA. Click vào icon SmartCA để kích hoạt.', 'warning');
                }
            } else {
                console.error('Dashboard: Failed to extract session data:', response.error);
                this.ui.showNotification(`❌ Lỗi trích xuất dữ liệu: ${response.error}`, 'error');
                this.updateStatusIndicators('error');
            }
            
        } catch (error) {
            console.error('Dashboard: Error in extractAndStoreSessionData:', error);
            this.ui.showNotification(`❌ Lỗi trích xuất dữ liệu phiên: ${error.message}`, 'error');
            this.updateStatusIndicators('error');
        }
    }

    // Get stored session data from extension storage
    async getStoredSessionData() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['extractedSessionData', 'sessionDataTimestamp'], (result) => {
                if (result.extractedSessionData && result.sessionDataTimestamp) {
                    // Check if data is not too old (5 minutes)
                    const now = Date.now();
                    const dataAge = now - result.sessionDataTimestamp;
                    if (dataAge < 5 * 60 * 1000) { // 5 minutes
                        resolve(result.extractedSessionData);
                        return;
                    }
                }
                resolve(null);
            });
        });
    }

    // Check if session data is valid
    isSessionDataValid(data) {
        return data && (data.uuid || data.smartca);
    }

    // Store session data in localStorage for API service to use
    storeSessionDataLocally(data) {
        try {
            if (data.uuid) {
                localStorage.setItem('uuid', data.uuid);
                sessionStorage.setItem('uuid', data.uuid);
                console.log('Dashboard: Stored UUID in localStorage and sessionStorage');
            }
            
            if (data.smartca) {
                // SmartCA is stored in sessionStorage (not localStorage)
                sessionStorage.setItem('hisl2_smartca', data.smartca);
                console.log('Dashboard: Stored SmartCA session in sessionStorage');
            }
            
        } catch (error) {
            console.error('Dashboard: Error storing session data locally:', error);
        }
    }

    // Trigger SmartCA login on main tab
    async triggerSmartCALogin() {
        try {
            const response = await this.sendMessageToBackground({
                action: 'triggerSmartCAOnMainTab'
            });
            
            if (response.success) {
                console.log('Dashboard: SmartCA trigger successful');
                
                if (response.data && response.data.smartca) {
                    console.log('Dashboard: SmartCA session obtained after trigger');
                    this.storeSessionDataLocally(response.data);
                    this.updateStatusIndicators();
                    this.ui.showNotification('✅ SmartCA đã được kích hoạt thành công!', 'success');
                } else {
                    console.log('Dashboard: SmartCA triggered but no session obtained yet');
                    this.ui.showNotification('⚠️ SmartCA đã được kích hoạt, vui lòng kiểm tra tab chính', 'warning');
                }
            } else {
                console.error('Dashboard: SmartCA trigger failed:', response.error);
                this.ui.showNotification(`❌ Lỗi kích hoạt SmartCA: ${response.error}`, 'error');
            }
            
        } catch (error) {
            console.error('Dashboard: Error triggering SmartCA:', error);
            this.ui.showNotification(`❌ Lỗi kích hoạt SmartCA: ${error.message}`, 'error');
        }
    }

    // Send message to background script
    async sendMessageToBackground(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    resolve({
                        success: false,
                        error: chrome.runtime.lastError.message
                    });
                } else {
                    resolve(response || { success: false, error: 'No response' });
                }
            });
        });
    }

    // Update status indicators in header
    updateStatusIndicators(state = null) {
        const uuidDot = document.getElementById('uuidDot');
        const smartcaDot = document.getElementById('smartcaDot');
        const smartcaStatus = document.getElementById('smartcaStatus');
        
        if (!uuidDot || !smartcaDot) {
            console.warn('Dashboard: Status indicator elements not found');
            return;
        }
        
        if (state === 'loading') {
            uuidDot.className = 'status-dot loading';
            smartcaDot.className = 'status-dot loading';
            return;
        }
        
        if (state === 'error') {
            uuidDot.className = 'status-dot';
            smartcaDot.className = 'status-dot';
            return;
        }
        
        // Check actual data in storage
        const uuid = localStorage.getItem('uuid');
        const smartca = sessionStorage.getItem('hisl2_smartca');
        
        console.log('🔍 Dashboard: updateStatusIndicators - Checking storage:', {
            uuid: !!uuid,
            smartca: !!smartca,
            uuidLength: uuid ? uuid.length : 0,
            smartcaLength: smartca ? smartca.length : 0,
            state: state
        });
        
        // Update UUID status
        if (uuid && uuid !== 'null' && uuid !== 'undefined') {
            uuidDot.className = 'status-dot active';
            console.log('✅ UUID status: ACTIVE');
        } else {
            uuidDot.className = 'status-dot';
            console.log('⭕ UUID status: INACTIVE');
        }
        
        // Update SmartCA status (always enabled)
        if (smartca && smartca !== 'null' && smartca !== 'undefined') {
            smartcaDot.className = 'status-dot active';
            if (smartcaStatus) {
                smartcaStatus.title = 'SmartCA đã được kích hoạt - Click để refresh';
            }
            console.log('✅ SmartCA status: ACTIVE');
        } else {
            smartcaDot.className = 'status-dot';
            if (smartcaStatus) {
                smartcaStatus.title = 'Click để kích hoạt SmartCA';
            }
            console.log('⭕ SmartCA status: INACTIVE');
        }
        
        console.log('🎯 Dashboard: Status indicators updated - UUID:', !!uuid, 'SmartCA:', !!smartca);
    }

    // Setup event listeners
    setupEventListeners() {
        console.log('Setting up event listeners...');
        


        // Load patients button
        const loadPatientsBtn = document.getElementById('loadPatientsBtn');
        if (loadPatientsBtn) {
            loadPatientsBtn.addEventListener('click', async () => {
                console.log('Load patients button clicked');
                console.log('this context:', this);
                try {
                    await this.loadPatients();
                } catch (error) {
                    console.error('Error in loadPatients from button click:', error);
                }
            });
            console.log('✅ Load patients button listener added');
        } else {
            console.warn('❌ loadPatientsBtn not found');
        }

        // Doctor filter for patients
        const doctorFilter = document.getElementById('doctorFilter');
        if (doctorFilter) {
            doctorFilter.addEventListener('change', async () => {
                console.log('Doctor filter changed');
                console.log('this context:', this);
                try {
                    await this.handleDoctorFilter();
                } catch (error) {
                    console.error('Error in handleDoctorFilter from change event:', error);
                }
            });
            console.log('✅ Doctor filter listener added');
        } else {
            console.warn('❌ doctorFilter not found');
        }

        // PTTT filters
        const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
        if (procedureDoctorFilter) {
            procedureDoctorFilter.addEventListener('change', () => {
                console.log('Procedure doctor filter changed to:', procedureDoctorFilter.value);
                this.handleProcedureFilters();
            });
            console.log('✅ Procedure doctor filter listener added');
        } else {
            console.warn('❌ procedureDoctorFilter not found');
        }

        const procedureTypeFilter = document.getElementById('procedureTypeFilter');
        if (procedureTypeFilter) {
            procedureTypeFilter.addEventListener('change', () => {
                console.log('Procedure type filter changed to:', procedureTypeFilter.value);
                this.handleProcedureFilters();
            });
            console.log('✅ Procedure type filter listener added');
        } else {
            console.warn('❌ procedureTypeFilter not found');
        }

        // Status indicators click handlers
        const uuidStatus = document.getElementById('uuidStatus');
        if (uuidStatus) {
            uuidStatus.addEventListener('click', async () => {
                console.log('UUID status clicked - refreshing session data');
                this.ui.showNotification('🔄 Đang làm mới dữ liệu UUID...', 'info');
                await this.extractAndStoreSessionData();
            });
            console.log('✅ UUID status listener added');
        }

        const smartcaStatus = document.getElementById('smartcaStatus');
        if (smartcaStatus) {
            smartcaStatus.addEventListener('click', async () => {
                console.log('SmartCA status clicked - attempting SmartCA trigger');
                this.ui.showNotification('🔒 Đang kích hoạt/refresh SmartCA...', 'info');
                await this.triggerSmartCALogin();
            });
            console.log('✅ SmartCA status listener added');
        }

        // Signature action buttons (moved to panel-filters)
        const signProceduresBtn = document.getElementById('signProcedures');
        if (signProceduresBtn) {
            signProceduresBtn.addEventListener('click', async () => {
                console.log('Sign procedures button clicked');
                await this.ui.signSelectedProcedures();
            });
            console.log('✅ Sign procedures button listener added');
        }

        const cancelSignProceduresBtn = document.getElementById('cancelSignProcedures');
        if (cancelSignProceduresBtn) {
            cancelSignProceduresBtn.addEventListener('click', async () => {
                console.log('Cancel sign procedures button clicked');
                await this.ui.cancelSignSelectedProcedures();
            });
            console.log('✅ Cancel sign procedures button listener added');
        }

        // Global error handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.ui.showNotification(`Lỗi: ${event.reason.message}`, 'error');
        });
    }

    // Check API connection
    async checkConnection() {
        try {
            this.ui.updateAuthStatus(false, 'Đang kiểm tra kết nối...');
            
            // Always show popup when authentication is needed
            const result = await this.apiService.testConnection(true);
            
            if (result.success) {
                this.ui.updateAuthStatus(true, 'Kết nối thành công');
                this.ui.showNotification('✅ Kết nối API thành công', 'success');
            } else {
                this.ui.updateAuthStatus(false, result.message);
                if (!result.needLogin) {
                    this.ui.showNotification(`❌ Lỗi kết nối: ${result.message}`, 'error');
                } else {
                    this.ui.showNotification(`🔑 Cần đăng nhập để tiếp tục`, 'info');
                }
            }
            
            return result.success;
            
        } catch (error) {
            console.error('Connection check failed:', error);
            this.ui.updateAuthStatus(false, 'Lỗi kết nối');
            this.ui.showNotification(`❌ Không thể kết nối: ${error.message}`, 'error');
            return false;
        }
    }

    // Refresh data after login
    async refreshData() {
        console.log('Refreshing data after login...');
        try {
            // Show loading notification
            this.ui.showNotification('🔄 Đang tải dữ liệu sau khi đăng nhập...', 'info', 2000);
            
            // Update status indicators
            this.updateStatusIndicators();
            
            // Always reload doctors first (doesn't require authentication)
            this.loadHardcodedDoctors();
            
            // Check connection (should be successful after login)
            const connected = await this.checkConnection();
            if (connected) {
                // Reload patients for default doctor
                await this.loadPatientsByDoctor("104201");
                this.ui.showNotification('✅ Đăng nhập thành công! Đã tải danh sách bệnh nhân', 'success');
                
                // Clear procedures since patient selection may change
                this.ui.clearProcedures();
            } else {
                this.ui.showNotification('⚠️ Đã tải danh sách bác sĩ, nhưng không thể tải bệnh nhân', 'warning');
            }
            
            // Final status update
            this.updateStatusIndicators();
        } catch (error) {
            console.error('Error refreshing data after login:', error);
            this.ui.showNotification(`❌ Lỗi làm mới dữ liệu: ${error.message}`, 'error');
        }
    }

    // Load patients list
    async loadPatients() {
        console.log('=== loadPatients START ===');
        try {
            console.log('Step 1: Starting loadPatients...');
            console.log('this.ui:', this.ui);
            console.log('this.apiService:', this.apiService);
            
            // Clear any previous error messages first
            console.log('Step 1.5: Clearing previous errors...');
            this.ui.clearError('patientsList');
            
            // Test UI method first
            console.log('Step 2: Calling showLoading...');
            this.ui.showLoading('patientsLoading', true);
            
            console.log('Step 3: Finding patientsEmpty element...');
            const patientsEmptyEl = document.getElementById('patientsEmpty');
            if (patientsEmptyEl) {
                patientsEmptyEl.style.display = 'none';
                console.log('Step 3: patientsEmpty hidden');
            } else {
                console.warn('Step 3: patientsEmpty element not found');
            }
            
            console.log('Step 4: Calling clearProcedures...');
            this.ui.clearProcedures();
            
            console.log('Step 5: Making API request to getPatients...');
            console.log('API Service ready:', this.apiService.isReady());
            
            // Make API request
            const response = await this.apiService.getPatients();
            console.log('Step 6: API response received:', response);
            
            console.log('Step 7: Processing response...');
            // Process response
            if (response && response.rows) {
                console.log(`Step 8: Loaded ${response.rows.length} patients`);
                
                // Filter patients by selected doctor if not loading all
                const filteredPatients = this.filterPatientsBySelectedDoctor(response.rows);
                
                console.log('Step 9: Calling renderPatients...');
                this.ui.renderPatients(filteredPatients);
                
                console.log('Step 10: Showing success notification...');
                this.ui.showNotification(`✅ Đã tải ${filteredPatients.length}/${response.rows.length} bệnh nhân`, 'success');
            } else {
                console.warn('Step 8: No patient data received:', response);
                this.ui.renderPatients([]);
                this.ui.showNotification('⚠️ Không có dữ liệu bệnh nhân', 'warning');
            }
            
            // Cache all patients data for filtering
            this.allPatientsData = response?.rows || [];
            
            console.log('=== loadPatients SUCCESS ===');
            
        } catch (error) {
            console.error('=== loadPatients ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            console.error('At line:', error.lineNumber);
            
            try {
                this.ui.showLoading('patientsLoading', false);
                this.ui.showError(`Không thể tải danh sách bệnh nhân: ${error.message}`, 'patientsList');
            } catch (uiError) {
                console.error('Error in UI error handling:', uiError);
            }
        }
    }

    // Load hardcoded doctors list
    loadHardcodedDoctors() {
        try {
            console.log('Loading hardcoded doctors list...');
            const response = this.apiService.cacheHardcodedDoctors();
            
            if (response && response.rows) {
                this.populateDoctorFilters(response.rows);
                console.log(`✅ Loaded ${response.rows.length} hardcoded doctors`);
            }
        } catch (error) {
            console.error('Error loading hardcoded doctors:', error);
            this.ui.showNotification('Không thể tải danh sách bác sĩ', 'error');
        }
    }

    // Populate doctor filter dropdowns
    populateDoctorFilters(doctors) {
        const doctorFilter = document.getElementById('doctorFilter');
        const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
        
        // Sort doctors by name
        const sortedDoctors = doctors.sort((a, b) => a.fullName.localeCompare(b.fullName));
        
        // Populate both filter dropdowns
        [doctorFilter, procedureDoctorFilter].forEach(select => {
            if (select) {
                // Clear existing options except "Tất cả"
                select.innerHTML = '<option value="all">Tất cả bác sĩ</option>';
                
                // Add doctor options using ID as value
                sortedDoctors.forEach(doctor => {
                    const option = document.createElement('option');
                    option.value = doctor.id;  // Use doctor ID as value
                    option.textContent = doctor.fullName;
                    select.appendChild(option);
                });
                
                // Set default to "104201" (Nguyễn Trần Anh Thư)
                if (select.id === 'procedureDoctorFilter') {
                    select.value = "104201";
                } else if (select.id === 'doctorFilter') {
                    select.value = "104201";  // Also set default for patient filter
                    console.log('Set default doctor filter to 104201 (Nguyễn Trần Anh Thư)');
                }
            }
        });
    }

    // Handle doctor filter for patients
    async handleDoctorFilter() {
        const doctorFilter = document.getElementById('doctorFilter');
        const selectedDoctorId = doctorFilter?.value;
        
        console.log('Doctor filter changed to ID:', selectedDoctorId);
        
        try {
            if (this.allPatientsData && this.allPatientsData.length > 0) {
                // Use cached data for instant filtering
                const filteredPatients = this.filterPatientsBySelectedDoctor(this.allPatientsData);
                this.ui.renderPatients(filteredPatients);
                
                const doctor = this.apiService.getDoctorById(selectedDoctorId);
                const doctorName = doctor ? doctor.fullName : 'Tất cả';
                this.ui.showNotification(`✅ Hiển thị ${filteredPatients.length} bệnh nhân - ${doctorName}`, 'success');
            } else {
                // No cached data, load from API
                if (selectedDoctorId === "all") {
                    await this.loadPatients();
                } else {
                    await this.loadPatientsByDoctor(selectedDoctorId);
                }
            }
        } catch (error) {
            console.error('Error filtering patients by doctor:', error);
            this.ui.showNotification(`Lỗi lọc bệnh nhân: ${error.message}`, 'error');
        }
    }

    // Load patients by specific doctor
    async loadPatientsByDoctor(doctorId) {
        try {
            console.log('Loading patients for doctor ID:', doctorId);
            
            // Clear any previous error messages first
            this.ui.clearError('patientsList');
            
            // Show loading state with null checking
            this.ui.showLoading('patientsLoading', true);
            
            const patientsEmptyEl = document.getElementById('patientsEmpty');
            if (patientsEmptyEl) {
                patientsEmptyEl.style.display = 'none';
            } else {
                console.warn('patientsEmpty element not found');
            }
            
            // Clear previous data
            this.ui.clearProcedures();
            
            // Make API request for specific doctor
            const response = await this.apiService.getPatientsByDoctor(doctorId);
            
            // Process response
            if (response && response.rows) {
                console.log(`Loaded ${response.rows.length} patients for doctor ${doctorId}`);
                this.ui.renderPatients(response.rows);
                
                const doctor = this.apiService.getDoctorById(doctorId);
                const doctorName = doctor ? doctor.fullName : `ID ${doctorId}`;
                this.ui.showNotification(`✅ Đã tải ${response.rows.length} bệnh nhân của BS ${doctorName}`, 'success');
            } else {
                console.warn('No patient data received for doctor:', doctorId);
                this.ui.renderPatients([]);
                this.ui.showNotification('⚠️ Không có dữ liệu bệnh nhân cho bác sĩ này', 'warning');
            }
            
        } catch (error) {
            console.error('Failed to load patients by doctor:', error);
            this.ui.showLoading('patientsLoading', false);
            this.ui.showError(`Không thể tải danh sách bệnh nhân: ${error.message}`, 'patientsList');
        }
    }

    // Filter patients by currently selected doctor
    filterPatientsBySelectedDoctor(patients) {
        const doctorFilter = document.getElementById('doctorFilter');
        if (!doctorFilter) {
            return patients;
        }

        const selectedDoctorId = doctorFilter.value;
        console.log('Filtering patients by doctor ID:', selectedDoctorId);

        if (selectedDoctorId === "all") {
            // Show all patients
            return patients;
        } else {
            // Filter by specific doctor
            const filtered = patients.filter(patient => 
                patient.BACSYDIEUTRIID === selectedDoctorId
            );
            console.log(`Filtered ${filtered.length} patients for doctor ${selectedDoctorId}`);
            return filtered;
        }
    }

    // Handle procedure filters (re-apply to cached data)
    async handleProcedureFilters() {
        if (this.ui.selectedPatient && this.cachedProcedures) {
            console.log('Procedure filters changed, re-applying filters...');
            
            const filteredProcedures = this.applyProcedureFilters(this.cachedProcedures);
            this.ui.renderProcedures(filteredProcedures);
            
            const filterInfo = this.getFilterInfo();
            const filterText = filterInfo ? ` (${filterInfo})` : '';
            
            // Get selected values for better notification
            const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
            const procedureTypeFilter = document.getElementById('procedureTypeFilter');
            const doctorText = procedureDoctorFilter?.selectedOptions[0]?.textContent || 'Tất cả';
            const typeText = procedureTypeFilter?.selectedOptions[0]?.textContent || 'Tất cả';
            
            this.ui.showNotification(`🔍 Lọc PTTT: ${filteredProcedures.length}/${this.cachedProcedures.length} - ${doctorText}, Loại: ${typeText}`, 'info');
        }
    }

    // Populate procedure filters from actual data
    populateProcedureFilters(procedures) {
        console.log('🔄 populateProcedureFilters called with:', procedures.length, 'procedures');
        
        // Cache procedures for re-filtering
        this.cachedProcedures = procedures;
        
        // Extract unique doctors
        const doctorsSet = new Set();
        procedures.forEach(proc => {
            if (proc.NGUOITAO) {
                doctorsSet.add(proc.NGUOITAO);
            }
        });
        const uniqueDoctors = Array.from(doctorsSet).sort();
        console.log('Unique doctors found:', uniqueDoctors);
        
        // Extract unique procedure types
        const typesSet = new Set();
        procedures.forEach(proc => {
            if (proc.TENPHIEU) {
                typesSet.add(proc.TENPHIEU);
            }
        });
        const uniqueTypes = Array.from(typesSet).sort();
        console.log('Unique procedure types found:', uniqueTypes);
        
        // Populate doctor filter
        const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
        if (procedureDoctorFilter) {
            const currentValue = procedureDoctorFilter.value;
            console.log('Current doctor filter value before populate:', currentValue);
            
            // Get current selected doctor NAME from main doctor filter (not ID)
            const mainDoctorFilter = document.getElementById('doctorFilter');
            const selectedMainDoctorText = mainDoctorFilter?.selectedOptions[0]?.textContent || null;
            console.log('Main doctor filter element found:', !!mainDoctorFilter);
            console.log('Main doctor filter selected value (ID):', mainDoctorFilter?.value);
            console.log('Main doctor filter selected text (NAME):', selectedMainDoctorText);
            
            procedureDoctorFilter.innerHTML = '<option value="all">Tất cả bác sĩ</option>';
            
            let defaultDoctorSet = false;
            uniqueDoctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor;
                option.textContent = doctor;
                
                // Check if this doctor contains the selected main doctor NAME
                // Example: if mainDoctorText = "ABC", select "BS ABC"
                // Also handle reverse case: if mainDoctorText = "BS ABC", select "ABC"
                let matchesMainDoctor = false;
                if (selectedMainDoctorText && selectedMainDoctorText !== 'Tất cả bác sĩ') {
                    // Case 1: procedure doctor contains main doctor name (BS ABC contains ABC)
                    matchesMainDoctor = doctor.includes(selectedMainDoctorText);
                    // Case 2: main doctor contains procedure doctor name (ABC contains in ABC)
                    if (!matchesMainDoctor) {
                        matchesMainDoctor = selectedMainDoctorText.includes(doctor);
                    }
                    // Case 3: normalize and compare (remove BS, Dr, etc.)
                    if (!matchesMainDoctor) {
                        const normalizedMainDoctor = selectedMainDoctorText.replace(/^(BS|Dr|Bác sĩ)\s+/i, '').trim();
                        const normalizedProcedureDoctor = doctor.replace(/^(BS|Dr|Bác sĩ)\s+/i, '').trim();
                        matchesMainDoctor = normalizedMainDoctor === normalizedProcedureDoctor ||
                                          normalizedMainDoctor.includes(normalizedProcedureDoctor) ||
                                          normalizedProcedureDoctor.includes(normalizedMainDoctor);
                    }
                }
                
                console.log(`Checking doctor: "${doctor}" vs main NAME: "${selectedMainDoctorText}" - matches: ${matchesMainDoctor}`);
                
                if (doctor === currentValue || (matchesMainDoctor && !defaultDoctorSet)) {
                    option.selected = true;
                    procedureDoctorFilter.value = doctor;
                    defaultDoctorSet = true;
                    console.log('✅ Pre-selected doctor (matches main doctor name):', doctor, 'matches', selectedMainDoctorText);
                }
                procedureDoctorFilter.appendChild(option);
            });
            
            // If no matching doctor found, keep "Tất cả bác sĩ" as default
            if (!defaultDoctorSet) {
                procedureDoctorFilter.value = 'all';
                console.log('✅ No doctor contains main doctor name, using "Tất cả bác sĩ" as default');
            }
            
            console.log('✅ Doctor filter populated with', uniqueDoctors.length, 'options, default set:', defaultDoctorSet);
        } else {
            console.warn('❌ procedureDoctorFilter element not found');
        }
        
        // Populate type filter  
        const procedureTypeFilter = document.getElementById('procedureTypeFilter');
        if (procedureTypeFilter) {
            const currentValue = procedureTypeFilter.value;
            console.log('Current type filter value before populate:', currentValue);
            
            procedureTypeFilter.innerHTML = '<option value="all">Tất cả loại phiếu</option>';
            
            let defaultTypeSet = false;
            uniqueTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                
                // Try to find "Phiếu chỉ định PTTT" or similar
                const isPTTTType = type.includes('Phiếu chỉ định PTTT') || type.includes('PTTT') || type.includes('phẫu thuật');
                
                if (type === currentValue || (isPTTTType && !defaultTypeSet)) {
                    option.selected = true;
                    procedureTypeFilter.value = type;
                    defaultTypeSet = true;
                    console.log('✅ Pre-selected type (PTTT-related):', type);
                }
                procedureTypeFilter.appendChild(option);
            });
            
            // If no PTTT-related type found, keep "Tất cả loại phiếu" as default
            if (!defaultTypeSet) {
                procedureTypeFilter.value = 'all';
                console.log('✅ No PTTT-related type found, using "Tất cả loại phiếu" as default');
            }
            
            console.log('✅ Type filter populated with', uniqueTypes.length, 'options, default set:', defaultTypeSet);
        } else {
            console.warn('❌ procedureTypeFilter element not found');
        }
        
        console.log(`📊 Populated filters: ${uniqueDoctors.length} doctors, ${uniqueTypes.length} types`);
        console.log('Final filter values - Doctor:', procedureDoctorFilter?.value, 'Type:', procedureTypeFilter?.value);
    }

    // Apply current filter values to procedures
    applyProcedureFilters(procedures) {
        const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
        const procedureTypeFilter = document.getElementById('procedureTypeFilter');
        
        const doctorFilter = procedureDoctorFilter?.value;
        const typeFilter = procedureTypeFilter?.value;
        
        let filtered = [...procedures];
        
        // Apply doctor filter
        if (doctorFilter && doctorFilter !== 'all') {
            filtered = filtered.filter(proc => {
                return proc.NGUOITAO && proc.NGUOITAO === doctorFilter;
            });
        }
        
        // Apply type filter
        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(proc => {
                return proc.TENPHIEU && proc.TENPHIEU === typeFilter;
            });
        }
        
        console.log(`Filtered procedures: ${filtered.length}/${procedures.length} (doctor: ${doctorFilter}, type: ${typeFilter})`);
        return filtered;
    }

    // Apply procedure filters with default - wait for defaults to be set then apply
    applyProcedureFiltersWithDefault(procedures) {
        console.log('🎯 applyProcedureFiltersWithDefault called with:', procedures.length, 'procedures');
        
        // Check current filter states
        const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
        const procedureTypeFilter = document.getElementById('procedureTypeFilter');
        
        console.log('Doctor filter element found:', !!procedureDoctorFilter);
        console.log('Procedure type filter element found:', !!procedureTypeFilter);
        console.log('Current doctor filter value:', procedureDoctorFilter?.value);
        console.log('Current procedure type filter value:', procedureTypeFilter?.value);
        
        // Wait a bit for defaults to be set, then apply filters
        setTimeout(() => {
            console.log('⏰ Delayed filtering starting...');
            console.log('Doctor filter value at filter time:', procedureDoctorFilter?.value);
            console.log('Procedure type filter value at filter time:', procedureTypeFilter?.value);
            
            const filteredProcedures = this.applyProcedureFilters(procedures);
            console.log('Filtered procedures count:', filteredProcedures.length);
            
            this.ui.renderProcedures(filteredProcedures);
            
            const filterInfo = this.getFilterInfo();
            const filterText = filterInfo ? ` (${filterInfo})` : '';
            console.log(`✅ Applied default filters: ${filteredProcedures.length}/${procedures.length} PTTT${filterText}`);
        }, 150);
        
        // Return unfiltered for immediate display, will be re-filtered shortly
        console.log('📋 Returning unfiltered procedures for immediate display');
        return procedures;
    }

    // Get current filter info for display
    getFilterInfo() {
        const procedureDoctorFilter = document.getElementById('procedureDoctorFilter');
        const procedureTypeFilter = document.getElementById('procedureTypeFilter');
        
        const doctorFilter = procedureDoctorFilter?.value;
        const typeFilter = procedureTypeFilter?.value;
        
        const filterInfo = [];
        if (doctorFilter && doctorFilter !== 'all') {
            filterInfo.push(`BS: ${doctorFilter}`);
        }
        if (typeFilter && typeFilter !== 'all') {
            filterInfo.push(`Loại: ${typeFilter}`);
        }
        
        return filterInfo.join(', ');
    }

    // Load procedures for selected patient
    async loadProcedures(patient) {
        try {
            console.log('Loading procedures for patient:', patient);
            console.log('Patient name:', patient.TENBENHNHAN);
            console.log('Required IDs:', {
                HOSOBENHANID: patient.HOSOBENHANID,
                TIEPNHANID: patient.TIEPNHANID
            });
            
            // Clear any previous error messages first
            this.ui.clearError('proceduresList');
            
            // Show loading state with fallback
            try {
                this.ui.showLoading('proceduresLoading', true);
            } catch (error) {
                console.warn('Error showing procedures loading:', error);
            }
            
            const proceduresEmpty = document.getElementById('proceduresEmpty');
            const proceduresPlaceholder = document.getElementById('proceduresPlaceholder');
            
            if (proceduresEmpty) proceduresEmpty.style.display = 'none';
            if (proceduresPlaceholder) proceduresPlaceholder.style.display = 'none';
            
            // Load ALL procedures first (no server-side filtering)
            const response = await this.apiService.getProcedures(patient, null, null);
            
            if (response && response.rows && Array.isArray(response.rows)) {
                console.log(`Loaded ${response.rows.length} total procedures for ${patient.TENBENHNHAN}`);
                
                // Cache all procedures data for filtering
                this.cachedProcedures = response.rows;
                this.ui.selectedPatient = patient;
                
                // Populate dynamic filters from actual data
                this.populateProcedureFilters(response.rows);
                
                // Apply defaults and filter after a short delay to ensure dropdowns are ready
                setTimeout(() => {
                    console.log('🎯 Applying default filters after dropdown population...');
                    this.handleProcedureFilters();
                }, 200);
                
                // Show unfiltered data first for immediate feedback
                this.ui.renderProcedures(response.rows);
                
                // Show initial notification with total count
                //this.ui.showNotification(`✅ Đã tải ${response.rows.length} PTTT cho ${patient.TENBENHNHAN}`, 'success');
            } else {
                console.warn('No procedure data received:', response);
                this.ui.renderProcedures([]);
                this.ui.showNotification(`⚠️ Không có dữ liệu PTTT cho ${patient.TENBENHNHAN}`, 'warning');
            }
            

            
        } catch (error) {
            console.error('Failed to load procedures for patient:', patient.TENBENHNHAN, error);
            this.ui.showLoading('proceduresLoading', false);
            this.ui.showError(`Không thể tải PTTT cho ${patient.TENBENHNHAN}: ${error.message}`, 'proceduresList');
        }
    }

    // Refresh all data
    async refresh() {
        try {
            console.log('Refreshing dashboard...');
            this.ui.showNotification('🔄 Đang làm mới dữ liệu...', 'info', 2000);
            
            // Re-check connection
            const connected = await this.checkConnection();
            
            if (connected) {
                // Reload patients
                await this.loadPatients();
                
                // If a patient is selected, reload their procedures
                if (this.ui.selectedPatient) {
                    await this.loadProcedures(this.ui.selectedPatient);
                }
            }
            
        } catch (error) {
            console.error('Refresh failed:', error);
            this.ui.showNotification(`❌ Lỗi làm mới: ${error.message}`, 'error');
        }
    }



    // Manual UUID setup (for testing or manual auth)
    setUuid(uuid) {
        this.apiService.setUuid(uuid);
        this.ui.showNotification('✅ UUID đã được thiết lập', 'success');
        this.checkConnection();
    }

    // Setup SmartCA monitoring for real-time updates
    setupSmartCAMonitoring() {
        console.log('🔍 Dashboard: Setting up SmartCA monitoring...');
        
        // Listen for messages from content script/background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('📨 Dashboard: Received message:', message.action, 'from:', sender);
            
            if (message.action === 'smartcaDataUpdated') {
                console.log('📡 Dashboard: SmartCA data updated from main tab, details:', {
                    hasData: !!message.smartcaData,
                    timestamp: message.timestamp
                });
                this.handleSmartCAUpdate(message.smartcaData, message.timestamp);
                sendResponse({ success: true, received: true });
                return true; // Keep message channel open
            }
            
            return false;
        });
        
        // Enhanced Chrome storage listener for SmartCA data changes
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local') {
                if (changes.smartcaSessionData) {
                    console.log('🔄 Dashboard: SmartCA data changed in storage:', {
                        hasOldValue: !!changes.smartcaSessionData.oldValue,
                        hasNewValue: !!changes.smartcaSessionData.newValue
                    });
                    
                    this.handleSmartCAUpdate(
                        changes.smartcaSessionData.newValue,
                        changes.smartcaUpdateTimestamp?.newValue || new Date().toISOString()
                    );
                }
            }
        });
        
        // Check for stored SmartCA data on startup and periodically
        this.checkStoredSmartCAData();
        
        // Set up periodic checking for SmartCA data in case of missed events
        setInterval(() => {
            this.checkStoredSmartCAData();
        }, 5000); // Check every 5 seconds
        
        // Add manual debugging function
        window.debugSmartCAStatus = () => {
            const sessionData = sessionStorage.getItem('hisl2_smartca');
            const storageData = localStorage.getItem('uuid');
            console.log('🐛 Dashboard Debug:', {
                sessionSmartCA: !!sessionData,
                localStorage_uuid: !!storageData,
                sessionLength: sessionData ? sessionData.length : 0
            });
            this.updateStatusIndicators();
        };
        
        console.log('✅ SmartCA monitoring setup complete');
    }

    // Handle SmartCA data updates
    handleSmartCAUpdate(smartcaDataString, timestamp) {
        console.log('🔄 Dashboard: handleSmartCAUpdate called with:', {
            hasData: !!smartcaDataString,
            dataLength: smartcaDataString ? smartcaDataString.length : 0,
            timestamp: timestamp
        });
        
        try {
            if (smartcaDataString && smartcaDataString !== 'null') {
                console.log('💾 Dashboard: Updating sessionStorage with SmartCA data...');
                
                // Update extension's sessionStorage with SmartCA data
                sessionStorage.setItem('hisl2_smartca', smartcaDataString);
                
                // Verify it was stored
                const storedData = sessionStorage.getItem('hisl2_smartca');
                console.log('✅ Dashboard: SmartCA data stored in sessionStorage:', {
                    stored: !!storedData,
                    length: storedData ? storedData.length : 0
                });
                
                // Parse and validate the data
                const smartcaData = JSON.parse(smartcaDataString);
                
                console.log('📋 Dashboard: Parsed SmartCA data:', {
                    hasToken: !!smartcaData.token,
                    hasUser: !!smartcaData.user,
                    userName: smartcaData.user?.fullName,
                    tokenType: smartcaData.token?.token_type,
                    timestamp: timestamp
                });
                
                // Show detailed notification to user with SmartCA info
                const userName = smartcaData.user?.fullName || 'Unknown User';
                this.ui.showNotification(
                    `✅ SmartCA session updated - User: ${userName}`, 
                    'success', 
                    3000
                );
                
                // Temporarily highlight SmartCA status indicator
                const smartcaStatus = document.getElementById('smartcaStatus');
                if (smartcaStatus) {
                    smartcaStatus.classList.add('status-updated');
                    setTimeout(() => {
                        smartcaStatus.classList.remove('status-updated');
                    }, 2000);
                }
                
                // Update UI status indicators
                console.log('🔄 Dashboard: Updating status indicators...');
                this.updateStatusIndicators();
                
            } else {
                console.log('🗑️ Dashboard: Clearing SmartCA data...');
                
                // SmartCA data was cleared
                sessionStorage.removeItem('hisl2_smartca');
                
                console.log('🗑️ SmartCA data cleared in extension');
                this.ui.showNotification('⚠️ SmartCA session cleared', 'warning');
                
                // Update UI status indicators
                this.updateStatusIndicators();
            }
            
        } catch (error) {
            console.error('❌ Error handling SmartCA update:', error);
            this.ui.showNotification('❌ Error updating SmartCA data', 'error');
        }
    }

    // Check for stored SmartCA data on startup
    async checkStoredSmartCAData() {
        try {
            const result = await chrome.storage.local.get(['smartcaSessionData', 'smartcaUpdateTimestamp']);
            
            if (result.smartcaSessionData) {
                console.log('📦 Found stored SmartCA data from startup');
                
                // Update extension's sessionStorage
                sessionStorage.setItem('hisl2_smartca', result.smartcaSessionData);
                
                // Update UI
                this.updateStatusIndicators();
                
                console.log('✅ SmartCA data loaded from storage on startup');
            } else {
                console.log('📭 No stored SmartCA data found on startup');
            }
            
        } catch (error) {
            console.error('❌ Error checking stored SmartCA data:', error);
        }
    }


}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    
    try {
        // Create global instances
        window.dashboard = new MedicalDashboard();
        window.ui = window.dashboard.ui;
        
        // Debug helper - expose API service for console debugging
        window.api = window.dashboard.apiService;
        
        console.log('Dashboard initialized successfully.');
        console.log('Available globals:', {
            dashboard: window.dashboard,
            ui: window.ui,
            api: window.api
        });
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
});
