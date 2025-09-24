// API Service for BV Phuyen Medical Dashboard
// Handles all API communications with the hospital system

class ApiService {
    constructor() {
        this.baseUrl = 'https://bvphuyen.vncare.vn/vnpthis/RestService';
        this.uuid = null;
        this.initialized = false;
        
        // Try to get UUID from existing session
        this.initializeFromSession();
    }

    // Initialize UUID from existing browser session
    async initializeFromSession() {
        try {
            // Try to extract UUID from existing requests or storage
            this.uuid = await this.extractUuidFromSession();
            if (this.uuid) {
                this.initialized = true;
                console.log('API Service initialized with session UUID');
            }
        } catch (error) {
            console.warn('Could not initialize from session:', error);
        }
    }

    // Extract UUID from existing browser session or storage
    async extractUuidFromSession() {
        return new Promise((resolve) => {
            // Method 1: Check localStorage for stored UUID (standard key from old_source)
            const storedUuid = localStorage.getItem('uuid');
            if (storedUuid && storedUuid !== 'null' && storedUuid !== 'undefined') {
                console.log('UUID found in localStorage');
                resolve(storedUuid);
                return;
            }

            // Method 2: Check sessionStorage
            const sessionUuid = sessionStorage.getItem('uuid');
            if (sessionUuid && sessionUuid !== 'null' && sessionUuid !== 'undefined') {
                console.log('UUID found in sessionStorage');
                resolve(sessionUuid);
                return;
            }

            // Method 3: Try Chrome extension storage (if available)
            try {
                if (chrome && chrome.storage) {
                    chrome.storage.local.get(['uuid'], (result) => {
                        if (result.uuid) {
                            console.log('UUID found in Chrome extension storage');
                            this.setUuid(result.uuid);
                            resolve(result.uuid);
                            return;
                        }
                    });
                }
            } catch (e) {
                console.warn('Chrome extension storage not available:', e);
            }

            // Fallback: Use working default UUID 
            const defaultUuid = "eyJhbGciOiJIUzUxMiJ9.eyJqdGkiOiJlZGY5YThjZC1iM2M1LTQ3MmEtYmEwMy03ZGY2M2E0NzIzMmYiLCJpYXQiOjE3NTc5MjM1MzgsInN1YiI6IlRIVU5UQS5ZSENUIiwiaXNzIjoiIiwiZXhwIjoxNzU3OTUyMzM4fQ.9yv1yDJHoCY40SEgGLiJ2b6ShcchIvUcc4jPYDgZhNbUVMpjVFyiB_rw5SRPUG68xtKRmjxkQbJpXVU1r0GsCQ";
            
            console.warn('No UUID found in storage. Using working default UUID.');
            console.warn('To login and get valid UUID: call window.api.login(username, password)');
            resolve(defaultUuid);
        });
    }

    // Set UUID manually (for authenticated sessions)
    setUuid(uuid) {
        this.uuid = uuid;
        this.initialized = true;
        
        // Store using standard key from old_source pattern
        localStorage.setItem('uuid', uuid);
        sessionStorage.setItem('uuid', uuid);
        
        // Also try Chrome extension storage if available
        try {
            if (chrome && chrome.storage) {
                chrome.storage.local.set({ 'uuid': uuid });
            }
        } catch (e) {
            console.warn('Chrome extension storage not available:', e);
        }
        
        console.log('UUID updated and stored:', uuid.substring(0, 20) + '...');
    }

    // Login to BV Phuyen system and get UUID
    async login(username, password) {
        try {
            console.log('Attempting login for user:', username);
            
            const loginUrl = `https://bvphuyen.vncare.vn/vnpthis/servlet/login.ValidateUser?txtName=${encodeURIComponent(username)}&txtPass=${encodeURIComponent(password)}`;
            
            const response = await fetch(loginUrl, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            console.log('Login response:', responseText.substring(0, 200) + '...');
            
            // Extract UUID from response - handle multiple possible formats
            let uuid = null;
            
            // Method 1: Try to extract from uuid field (newer format)
            if (responseText.includes('uuid:')) {
                try {
                    // Look for patterns like: uuid: 'TOKEN_HERE'
                    const uuidMatch = responseText.match(/uuid:\s*'([^']+)'/);
                    if (uuidMatch && uuidMatch[1]) {
                        uuid = uuidMatch[1].trim();
                        console.log('UUID extracted via regex match:', uuid.substring(0, 30) + '...');
                    }
                } catch (e) {
                    console.warn('Regex extraction failed, trying fallback method');
                }
            }
            
            // Method 2: Fallback to old extraction method
            if (!uuid && responseText.includes("uuid")) {
                try {
                    uuid = responseText.split('uuid: \'').pop().split('\'')[0];
                    console.log('UUID extracted via split method:', uuid ? uuid.substring(0, 30) + '...' : 'null');
                } catch (e) {
                    console.warn('Split extraction failed');
                }
            }
            
            // Method 3: Try to parse as JSON if it looks like JSON
            if (!uuid && (responseText.trim().startsWith('{') || responseText.includes('"uuid"'))) {
                try {
                    const jsonResponse = JSON.parse(responseText);
                    if (jsonResponse.uuid) {
                        uuid = jsonResponse.uuid;
                        console.log('UUID extracted from JSON:', uuid.substring(0, 30) + '...');
                    }
                } catch (e) {
                    console.warn('JSON parsing failed');
                }
            }
            
            // Validate extracted UUID
            if (uuid && uuid.length > 10 && !uuid.includes('his_token')) {
                console.log('Login successful, final UUID:', uuid.substring(0, 30) + '...');
                this.setUuid(uuid);
                return { success: true, uuid: uuid, message: 'Login successful' };
            } else {
                console.error('Invalid or no UUID extracted from login response');
                console.log('Response preview:', responseText.substring(0, 300));
                return { success: false, message: 'Login response does not contain valid UUID' };
            }
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    }

    // Clear stored UUID (for logout)
    clearUuid() {
        this.uuid = null;
        this.initialized = false;
        
        // Clear from all storage locations
        localStorage.removeItem('uuid');
        sessionStorage.removeItem('uuid');
        
        try {
            if (chrome && chrome.storage) {
                chrome.storage.local.remove(['uuid']);
            }
        } catch (e) {
            console.warn('Chrome extension storage not available:', e);
        }
        
        console.log('UUID cleared from all storage');
    }

    // Show login popup when UUID is invalid or missing
    showLoginPopup() {
        // Remove existing popup if present
        const existingPopup = document.getElementById('bv-login-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        // Create popup HTML
        const popupHtml = `
            <div id="bv-login-popup" style="
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0, 0, 0, 0.7); 
                z-index: 10000; 
                display: flex; 
                justify-content: center; 
                align-items: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px; 
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); 
                    max-width: 400px; 
                    width: 90%;
                ">
                    <h3 style="margin-top: 0; color: #333; text-align: center;">Đăng nhập BV Phuyen</h3>
                    <p style="color: #666; text-align: center; margin-bottom: 20px;">
                        Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.
                    </p>
                    
                    <div id="bv-login-error" style="
                        display: none; 
                        background: #ffebee; 
                        color: #c62828; 
                        padding: 10px; 
                        border-radius: 5px; 
                        margin-bottom: 15px; 
                        text-align: center;
                    "></div>
                    
                    <form id="bv-login-form">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: bold;">Tên đăng nhập:</label>
                            <input type="text" id="bv-username" required style="
                                width: 100%; 
                                padding: 10px; 
                                border: 1px solid #ddd; 
                                border-radius: 5px; 
                                font-size: 16px;
                                box-sizing: border-box;
                            " placeholder="Nhập tên đăng nhập">
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; color: #333; font-weight: bold;">Mật khẩu:</label>
                            <input type="password" id="bv-password" required style="
                                width: 100%; 
                                padding: 10px; 
                                border: 1px solid #ddd; 
                                border-radius: 5px; 
                                font-size: 16px;
                                box-sizing: border-box;
                            " placeholder="Nhập mật khẩu">
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button type="submit" id="bv-login-btn" style="
                                flex: 1;
                                background: #007cba; 
                                color: white; 
                                border: none; 
                                padding: 12px; 
                                border-radius: 5px; 
                                cursor: pointer; 
                                font-size: 16px; 
                                font-weight: bold;
                            ">Đăng nhập</button>
                            
                            <button type="button" id="bv-cancel-btn" style="
                                flex: 1;
                                background: #dc3545; 
                                color: white; 
                                border: none; 
                                padding: 12px; 
                                border-radius: 5px; 
                                cursor: pointer; 
                                font-size: 16px;
                            ">Hủy</button>
                        </div>
                        
                        <div id="bv-login-loading" style="
                            display: none; 
                            text-align: center; 
                            margin-top: 15px; 
                            color: #666;
                        ">
                            <span>Đang đăng nhập...</span>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add popup to page
        document.body.insertAdjacentHTML('beforeend', popupHtml);

        // Add event listeners
        this.setupLoginPopupEvents();
    }

    // Setup event listeners for login popup
    setupLoginPopupEvents() {
        const popup = document.getElementById('bv-login-popup');
        const form = document.getElementById('bv-login-form');
        const usernameInput = document.getElementById('bv-username');
        const passwordInput = document.getElementById('bv-password');
        const loginBtn = document.getElementById('bv-login-btn');
        const cancelBtn = document.getElementById('bv-cancel-btn');
        const errorDiv = document.getElementById('bv-login-error');
        const loadingDiv = document.getElementById('bv-login-loading');

        // Focus on username input
        setTimeout(() => usernameInput.focus(), 100);

        // Handle form submission
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!username || !password) {
                this.showLoginError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
                return;
            }

            // Show loading state
            loginBtn.disabled = true;
            loginBtn.textContent = 'Đang đăng nhập...';
            loadingDiv.style.display = 'block';
            errorDiv.style.display = 'none';

            try {
                const result = await this.login(username, password);
                
                if (result.success) {
                    // Success - close popup and show notification
                    popup.remove();
                    if (window.ui && window.ui.showNotification) {
                        window.ui.showNotification('✅ Đăng nhập thành công!', 'success');
                    }
                    
                    // Reload the current operation if dashboard exists
                    if (window.dashboard && typeof window.dashboard.refreshData === 'function') {
                        window.dashboard.refreshData();
                    }
                } else {
                    // Login failed
                    this.showLoginError(result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
                }
            } catch (error) {
                this.showLoginError('Lỗi kết nối. Vui lòng thử lại.');
                console.error('Login popup error:', error);
            } finally {
                // Reset button state
                loginBtn.disabled = false;
                loginBtn.textContent = 'Đăng nhập';
                loadingDiv.style.display = 'none';
            }
        };

        // Handle cancel button
        cancelBtn.onclick = () => {
            popup.remove();
        };

        // Handle ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('bv-login-popup')) {
                popup.remove();
            }
        });

        // Handle click outside popup
        popup.onclick = (e) => {
            if (e.target === popup) {
                popup.remove();
            }
        };
    }

    // Show error message in login popup
    showLoginError(message) {
        const errorDiv = document.getElementById('bv-login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Check if API service is ready
    isReady() {
        return this.initialized && this.uuid;
    }

    // Refresh UUID from storage (call this to reload from storage)
    async refreshUuidFromSession() {
        console.log('Refreshing UUID from storage...');
        
        // Re-run the session extraction
        const sessionUuid = await this.extractUuidFromSession();
        if (sessionUuid && sessionUuid !== this.uuid) {
            this.uuid = sessionUuid;
            this.initialized = true;
        }
        
        return sessionUuid;
    }

    // Make API request
    async makeRequest(payload, queryParams = {}) {
        if (!this.isReady()) {
            // Always show login popup when authentication is required
            this.showLoginPopup();
            throw new Error('Authentication required. Please login.');
        }

        // Add UUID to payload
        payload.uuid = this.uuid;

        // Build query string
        const defaultParams = {
            _search: false,
            nd: Date.now(),
            rows: 200,
            page: 1,
            sidx: '',
            sord: 'asc'
        };

        const finalParams = { ...defaultParams, ...queryParams };
        const postDataParam = encodeURIComponent(JSON.stringify(payload));
        
        const queryString = Object.keys(finalParams)
            .map(key => `${key}=${finalParams[key]}`)
            .join('&');

        const url = `${this.baseUrl}?postData=${postDataParam}&${queryString}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Raw API response:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('JSON Parse error:', parseError);
                console.error('Raw response text:', text);
                throw new Error(`Invalid JSON response: ${parseError.message}`);
            }
            
            // Check for API-level errors (only for object responses)
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                if (data.error_code) {
                    if (data.error_code === 2) {
                        // Authentication expired - clear current UUID and show popup
                        this.clearUuid();
                        this.showLoginPopup();
                        throw new Error('Authentication expired. Please login again.');
                    }
                    throw new Error(data.error_msg || 'API Error');
                }

                // Update UUID if provided in response
                if (data.uuid) {
                    this.setUuid(data.uuid);
                }
            }

            return data;

        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Get patient list
    async getPatients(params = {}) {
        // Calculate dynamic date range: 1 month ago to today
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        // Format dates as DD/MM/YYYY
        const formatDate = (date) => {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        };

        const defaultParams = {
            TG_NHAPVIEN_TU: formatDate(oneMonthAgo),  // 1 month ago
            TG_NHAPVIEN_DEN: formatDate(today),       // Today
            TRANGTHAIKHAMBENH: "4",
            KHOAID: "42480",
            PHONGID: "-1",
            LOAITIEPNHANID: "3",
            BACSYDIEUTRIID: "0",  // Changed to "0" to match actual API payload
            LOAINGAY: "1",
            TRANGTHAITIEPNHAN: "-1",
            DIEUTRIKETHOP: "-1",
            NGUOINHA: "2",
            MABENHAN: "-1",
            MABENHNHAN: "-1",
            TENBENHNHAN: "-1",
            MABHYT: "-1",
            CHUATAOPDT: "-1",
            CHUATAOTHUOC: "-1",
            LOAI_DTRI_NTU: "-1"
        };

        const finalParams = { ...defaultParams, ...params };
        
        console.log('Loading patients with date range:', {
            from: finalParams.TG_NHAPVIEN_TU,
            to: finalParams.TG_NHAPVIEN_DEN,
            doctorFilter: finalParams.BACSYDIEUTRIID
        });

        const payload = {
            func: "ajaxExecuteQueryPaging",
            params: ["NTU02D021.EV001"],
            options: [{
                name: "[0]",
                value: JSON.stringify(finalParams)
            }]
        };

        const queryParams = {
            rows: 1000,  // Increased to load more patients for better doctor extraction
            page: 1
        };

        return await this.makeRequest(payload, queryParams);
    }

    // Get hardcoded doctors list (static data)
    getHardcodedDoctors() {
        const doctorsArray = [
            ["114221", "Nguyễn An Chinh", "Chinh"],
            ["102372", "Nguyễn Thị Chưa", "Chưa"],
            ["102394", "Nguyễn Thị Kiều Diễm", "Diễm"],
            ["102381", "Thái Thị Ngọc Dung", "Dung"],
            ["124701", "Nguyễn Khánh Duy", "Duy"],
            ["102391", "Trần Ngọc Hân", "Hân"],
            ["102326", "Nguyễn Thị Thúy Hằng", "Hằng"],
            ["102344", "Ka Thị Thúy Hằng", "Hằng"],
            ["102350", "Lê Thị Thu Hương", "Hương"],
            ["104202", "Trịnh Thảo Kha", "Kha"],
            ["102360", "Phạm Văn Khoa", "Khoa"],
            ["139082", "Tô Thạch Lam", "Lam"],
            ["102333", "Đoàn Thị Băng Linh", "Linh"],
            ["102367", "Phạm Thị Mai Loan", "Loan"],
            ["102365", "Trần Thị Hoàng Oanh", "Oanh"],
            ["102362", "Nguyễn Trúc Quỳnh", "Quỳnh"],
            ["102337", "Lê Thiếu Tâm", "Tâm"],
            ["102399", "Nguyễn Thị Uyên Thi", "Thi"],
            ["104201", "Nguyễn Trần Anh Thư", "Thư"],
            ["102374", "Huỳnh Thị Bích Thủy", "Thủy"],
            ["102338", "Trần Thanh Thủy", "Thủy"],
            ["102330", "Phan Trần Trọng Tín", "Tín"],
            ["102355", "Nguyễn Quang Huyền Trân", "Trân"],
            ["102322", "Ngô Đường Trung", "Trung"],
            ["102349", "Trần Hữu Tuấn", "Tuấn"],
            ["112701", "Đặng Thị Mộng Tuyền", "Tuyền"],
            ["102393", "Hàng Đức Vinh", "Vinh"]
        ];

        const doctors = doctorsArray.map(doctor => ({
            id: doctor[0],
            fullName: doctor[1],
            shortName: doctor[2]
        }));
        
        console.log('Using hardcoded doctors list:', doctors.length);
        return { rows: doctors };
    }



    // Cache hardcoded doctors list
    cacheHardcodedDoctors() {
        const doctorsResponse = this.getHardcodedDoctors();
        if (doctorsResponse && doctorsResponse.rows) {
            this.doctorsCache = doctorsResponse.rows;
            console.log('Cached hardcoded doctors:', this.doctorsCache.length);
        }
        return doctorsResponse;
    }

    // Helper to get doctor by name or ID
    getDoctorByName(doctorName) {
        if (this.doctorsCache) {
            return this.doctorsCache.find(doctor => 
                doctor.fullName === doctorName || 
                doctor.shortName === doctorName ||
                doctor.id === doctorName ||
                doctorName.includes(doctor.fullName) ||
                doctorName.includes(doctor.shortName)
            );
        }
        return null;
    }

    // Helper to get doctor by ID
    getDoctorById(doctorId) {
        if (this.doctorsCache) {
            return this.doctorsCache.find(doctor => doctor.id === doctorId);
        }
        return null;
    }

    // Get procedures for a patient (PTTT)
    async getProcedures(patientData, doctorFilter = null, procedureTypeFilter = null) {
        console.log('Getting procedures for patient:', patientData);
        
        if (!patientData.HOSOBENHANID || !patientData.TIEPNHANID) {
            console.error('Missing required fields:', {
                HOSOBENHANID: patientData.HOSOBENHANID,
                TIEPNHANID: patientData.TIEPNHANID
            });
            throw new Error(`Missing required patient data: HOSOBENHANID=${patientData.HOSOBENHANID}, TIEPNHANID=${patientData.TIEPNHANID}`);
        }

        const params = {
            HOSOBENHANID: patientData.HOSOBENHANID,
            TIEPNHANID: patientData.TIEPNHANID,
            TRANGTHAI: "-1"
        };

        const payload = {
            func: "ajaxExecuteQueryPaging", 
            params: ["NTU01H101.02"],
            options: [{
                name: "[0]",
                value: JSON.stringify(params)
            }]
        };

        const queryParams = {
            rows: 1000,
            page: 1,
            sidx: "TENPHIEU asc,",
            sord: "asc"
        };

        return await this.makeRequest(payload, queryParams);
    }

    // Get patients by specific doctor ID
    async getPatientsByDoctor(doctorId) {
        return await this.getPatients({
            BACSYDIEUTRIID: doctorId
        });
    }

    // Check if UUID is likely valid (basic format check)
    isUuidValid(uuid) {
        if (!uuid || typeof uuid !== 'string') return false;
        
        // Check minimum length and basic format
        return uuid.length > 10;
    }

    // Test connection and UUID validity
    async testConnection(showPopupOnError = false) {
        try {
            // First refresh UUID from localStorage to get the latest value
            await this.refreshUuidFromSession();
            
            // Check if UUID looks valid after refresh
            if (!this.isUuidValid(this.uuid)) {
                if (showPopupOnError) {
                    this.showLoginPopup();
                }
                return { 
                    success: false, 
                    message: 'Invalid UUID format. Please login to get a valid session token.',
                    needLogin: true
                };
            }

            // Make a simple request to test connectivity
            await this.getPatients();
            return { success: true, message: 'Connected successfully' };
        } catch (error) {
            if (error.message.includes('Authentication') && showPopupOnError) {
                this.showLoginPopup();
            }
            
            if (error.message.includes('Authentication required') || error.message.includes('Authentication expired')) {
                return { 
                    success: false, 
                    message: 'Authentication required. Please login to BV Phuyen system first.',
                    needLogin: true
                };
            }
            return { success: false, message: error.message };
        }
    }

    // Get debugging info about current UUID status
    getDebugInfo() {
        const localUuid = localStorage.getItem('uuid');
        const sessionUuid = sessionStorage.getItem('uuid');
        
        return {
            hasUuid: !!this.uuid,
            uuidLength: this.uuid ? this.uuid.length : 0,
            uuidPreview: this.uuid ? this.uuid.substring(0, 30) + '...' : 'No UUID',
            isInitialized: this.initialized,
            isReady: this.isReady(),
            isValidFormat: this.isUuidValid(this.uuid),
            localStorage: {
                uuid: localUuid ? `Found (${localUuid.substring(0, 20)}...)` : 'Not found'
            },
            sessionStorage: {
                uuid: sessionUuid ? `Found (${sessionUuid.substring(0, 20)}...)` : 'Not found'
            },
            chromeStorage: 'Check via chrome.storage.local.get(["uuid"])',
            loginEndpoint: 'https://bvphuyen.vncare.vn/vnpthis/servlet/login.ValidateUser'
        };
    }
}

// Export for use in other scripts
window.ApiService = ApiService;
