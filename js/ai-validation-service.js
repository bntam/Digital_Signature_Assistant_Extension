/**
 * AI Validation Service
 * Uses Gemini API to analyze ICD compatibility with medicine
 */

class AIValidationService {
    constructor() {
        this.baseURL = 'https://gb.phongkhamtaisanh.com';
        this.token = 'sk-782699';
        this.model = 'gemini-2.5-flash';
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
        this.timeout = 30000; // 30 seconds
        this.requestCache = new Map();
        this.maxCacheSize = 100;
        this.requestQueue = [];
        this.isProcessing = false;
        this.rateLimitDelay = 1000; // 1 second between requests
    }

    /**
     * Sleep helper for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Create error object
     */
    createError(type, message, details = null) {
        return {
            type,
            message,
            details,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate cache key for batch request (per patient)
     */
    getBatchCacheKey(medicines, patientICDs) {
        const medicineKeys = medicines.map(m => `${m.tenThuoc}|${m.chiDinh}|${m.chongChiDinh}`).sort().join('||');
        return JSON.stringify({
            medicines: medicineKeys,
            patient: patientICDs.sort().join(',')
        });
    }

    /**
     * Generate cache key for request
     */
    getCacheKey(tenThuoc, chiDinh, chongChiDinh, patientICDs) {
        return JSON.stringify({
            medicine: tenThuoc,
            indication: chiDinh,
            contraindication: chongChiDinh,
            patient: patientICDs.sort().join(',')
        });
    }

    /**
     * Check cache first
     */
    getCached(cacheKey) {
        if (this.requestCache.has(cacheKey)) {
            console.log('✅ AI Validation: Using cached result');
            return this.requestCache.get(cacheKey);
        }
        return null;
    }

    /**
     * Save to cache with size limit
     */
    setCache(cacheKey, result) {
        // LRU: Remove oldest entry if cache is full
        if (this.requestCache.size >= this.maxCacheSize) {
            const firstKey = this.requestCache.keys().next().value;
            this.requestCache.delete(firstKey);
        }
        this.requestCache.set(cacheKey, result);
    }

    /**
     * Build prompt for batch validation (multiple medicines for one patient)
     */
    buildBatchPrompt(medicines, patientICDs) {
        const medicineList = medicines.map((med, index) => 
            `${index + 1}. Tên thuốc: ${med.tenThuoc}
   - ICD Chỉ định: ${med.chiDinh || 'Không có'}
   - ICD Chống chỉ định: ${med.chongChiDinh || 'Không có'}`
        ).join('\n\n');

        return `Bạn là chuyên gia y khoa về mã bệnh ICD-10. Nhiệm vụ của bạn là phân tích xem CÁC THUỐC có phù hợp với bệnh nhân không.

**THÔNG TIN BỆNH NHÂN:**
- Các mã ICD của bệnh nhân: ${patientICDs.join(', ')}

**DANH SÁCH ${medicines.length} THUỐC CẦN KIỂM TRA:**
${medicineList}

**YÊU CẦU PHÂN TÍCH:**
Với MỖI THUỐC, kiểm tra:
1. Bệnh nhân có mã ICD nào vi phạm "Chống chỉ định" không
2. Bệnh nhân có mã ICD phù hợp với "Chỉ định" không (nếu có yêu cầu)
3. Xem xét các trường hợp:
   - Mã ICD có thể khác format nhưng cùng nhóm (VD: I10 và I10.0)
   - Mã ICD có thể thiếu dấu chấm (VD: I100 thay vì I10.0)
   - Chỉ định có thể là khoảng (VD: "B35.0 ĐẾN B35.3")

**ĐỊNH DẠNG TRẢ LỜI (JSON):**
Trả lời CHÍNH XÁC theo format JSON sau - một array với kết quả cho TỪNG THUỐC theo đúng thứ tự:

{
  "results": [
    {
      "medicineIndex": 1,
      "medicineName": "Tên thuốc 1",
      "valid": true/false,
      "hasContraindication": true/false,
      "hasMissingIndication": true/false,
      "violatedICDs": ["mã ICD vi phạm"],
      "matchedICDs": ["mã ICD khớp"],
      "missingICDs": ["mã ICD còn thiếu"],
      "reasoning": "Giải thích ngắn gọn (1-2 câu)",
      "severity": "safe|warning|danger"
    }
  ]
}

**QUY TẮC:**
- "valid": false nếu có chống chỉ định HOẶC thiếu chỉ định
- "hasContraindication": true nếu có vi phạm chống chỉ định
- "hasMissingIndication": true nếu thiếu chỉ định (khi có yêu cầu)
- "severity": "danger" nếu có chống chỉ định, "warning" nếu thiếu chỉ định, "safe" nếu hợp lệ
- Phải có ${medicines.length} kết quả trong array "results"

Hãy phân tích và trả lời NGAY BẰNG JSON:`;
    }

    /**
     * Build prompt for AI analysis
     */
    buildPrompt(tenThuoc, chiDinh, chongChiDinh, patientICDs) {
        return `Bạn là chuyên gia y khoa về mã bệnh ICD-10. Nhiệm vụ của bạn là phân tích xem thuốc có phù hợp với bệnh nhân không.

**THÔNG TIN THUỐC:**
- Tên thuốc: ${tenThuoc}
- ICD Chỉ định: ${chiDinh || 'Không có'}
- ICD Chống chỉ định: ${chongChiDinh || 'Không có'}

**THÔNG TIN BỆNH NHÂN:**
- Các mã ICD của bệnh nhân: ${patientICDs.join(', ')}

**YÊU CẦU PHÂN TÍCH:**
1. Kiểm tra xem bệnh nhân có mã ICD nào vi phạm "Chống chỉ định" không
2. Kiểm tra xem bệnh nhân có mã ICD phù hợp với "Chỉ định" không (nếu có yêu cầu chỉ định)
3. Xem xét các trường hợp:
   - Mã ICD có thể khác format nhưng cùng nhóm (VD: I10 và I10.0)
   - Mã ICD có thể thiếu dấu chấm (VD: I100 thay vì I10.0)
   - Chỉ định có thể là khoảng (VD: "B35.0 ĐẾN B35.3")

**ĐỊNH DẠNG TRẢ LỜI (JSON):**
Trả lời CHÍNH XÁC theo format JSON sau, không thêm text nào khác:

{
  "valid": true/false,
  "hasContraindication": true/false,
  "hasMissingIndication": true/false,
  "violatedICDs": ["mã ICD vi phạm chống chỉ định"],
  "matchedICDs": ["mã ICD khớp với chỉ định"],
  "missingICDs": ["mã ICD còn thiếu"],
  "reasoning": "Giải thích ngắn gọn (1-2 câu)",
  "severity": "safe|warning|danger"
}

**QUY TẮC:**
- "valid": false nếu có chống chỉ định HOẶC thiếu chỉ định
- "hasContraindication": true nếu có vi phạm chống chỉ định
- "hasMissingIndication": true nếu thiếu chỉ định (khi có yêu cầu)
- "severity": "danger" nếu có chống chỉ định, "warning" nếu thiếu chỉ định, "safe" nếu hợp lệ

Hãy phân tích và trả lời NGAY BẰNG JSON:`;
    }

    /**
     * Call Gemini API with retry logic
     */
    async callGeminiAPI(prompt, options = {}) {
        const { retry = true } = options;
        let lastError = null;

        for (let attempt = 0; attempt < (retry ? this.maxRetries : 1); attempt++) {
            try {
                console.log(`🤖 AI Validation: Calling Gemini API (attempt ${attempt + 1}/${this.maxRetries})...`);
                
                const requestBody = {
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    model: options.model || this.model,
                    temperature: options.temperature ?? 0.0,
                    max_tokens: options.max_tokens ?? 500
                };

                const response = await fetch(`${this.baseURL}/openai/v1/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody),
                    signal: AbortSignal.timeout(this.timeout)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    
                    // Handle rate limiting (429)
                    if (response.status === 429) {
                        const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
                        if (attempt < this.maxRetries - 1) {
                            console.warn(`⚠️ Rate limit hit, retrying after ${retryAfter}s...`);
                            await this.sleep(retryAfter * 1000);
                            continue;
                        }
                        throw this.createError(
                            'RATE_LIMIT',
                            'Đã vượt quá giới hạn số lần gọi API. Vui lòng thử lại sau.',
                            `Retry after ${retryAfter} seconds`
                        );
                    }

                    // Handle other HTTP errors
                    throw this.createError(
                        errorData.error?.type || 'API_ERROR',
                        errorData.error?.message || 'Lỗi khi gọi AI API',
                        `Status: ${response.status}`
                    );
                }

                const data = await response.json();
                
                if (!data.choices || data.choices.length === 0) {
                    throw this.createError(
                        'NO_RESPONSE',
                        'AI không trả về kết quả',
                        'Empty choices array'
                    );
                }

                const choice = data.choices[0];
                const content = choice.message?.content;
                
                // Check if response was truncated
                if (choice.finish_reason === 'length') {
                    console.warn('⚠️ Response truncated due to max_tokens limit');
                    throw this.createError(
                        'TRUNCATED_RESPONSE',
                        'Response bị cắt ngắn do vượt quá giới hạn tokens',
                        'Try increasing max_tokens or reducing prompt size'
                    );
                }

                // Check if content exists
                if (!content || content.trim().length === 0) {
                    throw this.createError(
                        'EMPTY_RESPONSE',
                        'AI trả về response rỗng',
                        `finish_reason: ${choice.finish_reason}`
                    );
                }

                console.log('✅ AI Validation: Response received');
                
                return content;

            } catch (error) {
                lastError = error;
                
                // Don't retry on abort (timeout)
                if (error.name === 'AbortError') {
                    throw this.createError(
                        'TIMEOUT',
                        'Yêu cầu AI đã hết thời gian chờ',
                        `Timeout after ${this.timeout}ms`
                    );
                }

                // If response was truncated, throw immediately (don't retry)
                if (error.type === 'TRUNCATED_RESPONSE' || error.type === 'EMPTY_RESPONSE') {
                    throw error;
                }

                // Retry on network errors
                if (attempt < this.maxRetries - 1 && retry) {
                    const delay = this.retryDelay * (attempt + 1);
                    console.warn(`⚠️ Network error, retrying in ${delay}ms...`);
                    await this.sleep(delay);
                    continue;
                }
            }
        }

        // All retries failed
        throw this.createError(
            'NETWORK_ERROR',
            'Không thể kết nối tới AI service. Vui lòng kiểm tra kết nối mạng.',
            lastError?.message || lastError?.details
        );
    }

    /**
     * Parse AI batch response (JSON with results array)
     */
    parseBatchAIResponse(content, expectedCount) {
        try {
            // Check if content is valid
            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                throw new Error('Response content is empty or invalid');
            }

            // Remove markdown code blocks if present
            let cleaned = content.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }
            cleaned = cleaned.trim();

            const parsed = JSON.parse(cleaned);
            
            // Validate structure
            if (!parsed.results || !Array.isArray(parsed.results)) {
                throw new Error('Response missing "results" array');
            }

            if (parsed.results.length !== expectedCount) {
                console.warn(`⚠️ Expected ${expectedCount} results but got ${parsed.results.length}`);
            }

            // Validate each result
            parsed.results.forEach((result, index) => {
                const required = ['medicineIndex', 'medicineName', 'valid', 'hasContraindication', 'hasMissingIndication', 'reasoning', 'severity'];
                for (const field of required) {
                    if (result[field] === undefined) {
                        throw new Error(`Result ${index}: Missing required field: ${field}`);
                    }
                }

                // Ensure arrays exist
                result.violatedICDs = result.violatedICDs || [];
                result.matchedICDs = result.matchedICDs || [];
                result.missingICDs = result.missingICDs || [];
            });

            return parsed;
            
        } catch (error) {
            console.error('❌ AI Batch Validation: Failed to parse response:', error);
            console.log('Raw content:', content);
            throw this.createError(
                'PARSE_ERROR',
                'Không thể phân tích kết quả batch từ AI',
                error.message
            );
        }
    }

    /**
     * Parse AI response (JSON)
     */
    parseAIResponse(content) {
        try {
            // Remove markdown code blocks if present
            let cleaned = content.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/```\n?/g, '');
            }
            cleaned = cleaned.trim();

            const result = JSON.parse(cleaned);
            
            // Validate required fields
            const required = ['valid', 'hasContraindication', 'hasMissingIndication', 'reasoning', 'severity'];
            for (const field of required) {
                if (result[field] === undefined) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }

            // Ensure arrays exist
            result.violatedICDs = result.violatedICDs || [];
            result.matchedICDs = result.matchedICDs || [];
            result.missingICDs = result.missingICDs || [];

            return result;
            
        } catch (error) {
            console.error('❌ AI Validation: Failed to parse response:', error);
            console.log('Raw content:', content);
            throw this.createError(
                'PARSE_ERROR',
                'Không thể phân tích kết quả từ AI',
                error.message
            );
        }
    }

    /**
     * Process request queue with rate limiting
     */
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.requestQueue.length > 0) {
            const { requestFn, resolve, reject } = this.requestQueue.shift();

            try {
                const result = await requestFn();
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // Rate limiting: Wait before next request
            if (this.requestQueue.length > 0) {
                await this.sleep(this.rateLimitDelay);
            }
        }

        this.isProcessing = false;
    }

    /**
     * Add request to queue
     */
    queueRequest(requestFn) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({ requestFn, resolve, reject });
            // Start processing if not already running
            this.processQueue();
        });
    }

    /**
     * Validate multiple medicines for ONE patient (batch per patient)
     * This reduces API calls significantly by validating all medicines at once
     */
    async validateBatchForPatient(medicines, patientICDs) {
        // Check cache first
        const cacheKey = this.getBatchCacheKey(medicines, patientICDs);
        const cached = this.getCached(cacheKey);
        if (cached) {
            console.log(`✅ AI Validation: Using cached batch result for ${medicines.length} medicines`);
            return cached;
        }

        // Queue request with rate limiting
        try {
            const results = await this.queueRequest(async () => {
                // Build batch prompt
                const prompt = this.buildBatchPrompt(medicines, patientICDs);
                
                // Call API with retry logic (increase max_tokens significantly for batch)
                // Each medicine result needs ~150-200 tokens, so calculate accordingly
                const estimatedTokens = 300 + medicines.length * 200; // Base + per medicine
                const maxTokens = Math.min(4096, Math.max(1000, estimatedTokens));
                
                console.log(`🤖 Batch validation: ${medicines.length} medicines, max_tokens: ${maxTokens}`);
                
                const responseContent = await this.callGeminiAPI(prompt, { 
                    max_tokens: 100000
                });
                
                // Parse batch response
                const parsed = this.parseBatchAIResponse(responseContent, medicines.length);
                
                // Add metadata to each result
                const resultsWithMeta = parsed.results.map(result => ({
                    ...result,
                    source: 'ai-batch',
                    model: this.model,
                    timestamp: new Date().toISOString()
                }));
                
                return resultsWithMeta;
            });

            // Cache result
            this.setCache(cacheKey, results);
            
            console.log(`✅ AI Batch Validation complete: ${medicines.length} medicines`, {
                validCount: results.filter(r => r.valid === true).length,
                invalidCount: results.filter(r => r.valid === false).length
            });
            
            return results;
            
        } catch (error) {
            console.error('❌ AI Batch Validation failed:', error);
            
            // Special handling for truncated responses - try splitting batch
            if (error.type === 'TRUNCATED_RESPONSE' && medicines.length > 1) {
                console.warn(`⚠️ Response truncated, splitting batch of ${medicines.length} into smaller chunks...`);
                
                // Split into 2 halves and validate separately
                const mid = Math.ceil(medicines.length / 2);
                const firstHalf = medicines.slice(0, mid);
                const secondHalf = medicines.slice(mid);
                
                try {
                    const [firstResults, secondResults] = await Promise.all([
                        this.validateBatchForPatient(firstHalf, patientICDs),
                        this.validateBatchForPatient(secondHalf, patientICDs)
                    ]);
                    
                    const combinedResults = [...firstResults, ...secondResults];
                    console.log(`✅ Split batch completed: ${combinedResults.length} medicines`);
                    
                    // Cache combined result
                    const cacheKey = this.getBatchCacheKey(medicines, patientICDs);
                    this.setCache(cacheKey, combinedResults);
                    
                    return combinedResults;
                } catch (splitError) {
                    console.error('❌ Split batch also failed:', splitError);
                    // Fall through to fallback
                }
            }
            
            // Fallback: return error result for each medicine
            return medicines.map(med => ({
                found: true,
                valid: null,
                fallback: true,
                reasoning: `AI validation error: ${error.message}`,
                severity: 'warning'
            }));
        }
    }

    /**
     * Validate MEGA BATCH: Multiple patients with multiple medicines
     * Each medicine has its own patientICDs
     * This is the ultimate optimization: 1 API call for 25+ patients!
     */
    async validateMegaBatch(medicinesData) {
        console.log(`🚀 MEGA BATCH: Validating ${medicinesData.length} medicines across multiple patients...`);
        
        // Queue request with rate limiting
        try {
            const results = await this.queueRequest(async () => {
                // Build mega batch prompt
                const prompt = this.buildMegaBatchPrompt(medicinesData);
                
                // Calculate max tokens (very large batch)
                const estimatedTokens = 500 + medicinesData.length * 200;
                const maxTokens = Math.min(100000, Math.max(2000, estimatedTokens));
                
                console.log(`🤖 MEGA batch validation: ${medicinesData.length} medicines, max_tokens: ${maxTokens}`);
                
                const responseContent = await this.callGeminiAPI(prompt, { 
                    max_tokens: maxTokens
                });
                
                // Parse mega batch response
                const parsed = this.parseBatchAIResponse(responseContent, medicinesData.length);
                
                // Add metadata to each result
                const resultsWithMeta = parsed.results.map(result => ({
                    ...result,
                    source: 'ai-megabatch',
                    model: this.model,
                    timestamp: new Date().toISOString()
                }));
                
                return resultsWithMeta;
            });

            console.log(`✅ MEGA Batch complete: ${medicinesData.length} medicines validated in 1 API call!`);
            
            return results;
            
        } catch (error) {
            console.error('❌ MEGA Batch Validation failed:', error);
            
            // Fallback: return error result for each medicine
            return medicinesData.map(med => ({
                found: true,
                valid: null,
                fallback: true,
                reasoning: `AI mega batch error: ${error.message}`,
                severity: 'warning'
            }));
        }
    }

    /**
     * Build prompt for MEGA batch validation
     * Each medicine has its own patient ICDs
     */
    buildMegaBatchPrompt(medicinesData) {
        const medicinesList = medicinesData.map((item, index) => {
            return `${index + 1}. Thuốc: "${item.tenThuoc}"
   - ICD bệnh nhân: ${item.patientICDs.join(', ')}
   - Chỉ định thuốc: ${item.chiDinh || 'Không có'}
   - Chống chỉ định: ${item.chongChiDinh || 'Không có'}`;
        }).join('\n\n');

        return `Bạn là chuyên gia y tế, hãy kiểm tra DANH SÁCH THUỐC sau đây:

${medicinesList}

Với MỖI THUỐC, hãy trả về JSON theo format:
{
  "results": [
    {
      "valid": true/false,
      "hasContraindication": true/false,
      "hasMissingIndication": true/false,
      "violatedICDs": [],
      "matchedICDs": [],
      "missingICDs": [],
      "reasoning": "Giải thích ngắn gọn"
    }
  ]
}

LƯU Ý QUAN TRỌNG:
- Array "results" phải có ĐÚNG ${medicinesData.length} phần tử (theo thứ tự thuốc)
- Chỉ trả về JSON, không thêm text khác`;
    }

    /**
     * Validate multiple medicines for ONE patient (batch per patient)
     * This reduces API calls significantly by validating all medicines at once
     */
    async validateBatchForPatient(medicines, patientICDs) {
        // Check cache first
        const cacheKey = this.getBatchCacheKey(medicines, patientICDs);
        const cached = this.getCached(cacheKey);
        if (cached) {
            console.log(`✅ AI Validation: Using cached batch result for ${medicines.length} medicines`);
            return cached;
        }

        // Queue request with rate limiting
        try {
            const results = await this.queueRequest(async () => {
                // Build batch prompt
                const prompt = this.buildBatchPrompt(medicines, patientICDs);
                
                // Call API with retry logic (increase max_tokens significantly for batch)
                // Each medicine result needs ~150-200 tokens, so calculate accordingly
                const estimatedTokens = 300 + medicines.length * 200; // Base + per medicine
                const maxTokens = Math.min(4096, Math.max(1000, estimatedTokens));
                
                console.log(`🤖 Batch validation: ${medicines.length} medicines, max_tokens: ${maxTokens}`);
                
                const responseContent = await this.callGeminiAPI(prompt, { 
                    max_tokens: 100000
                });
                
                // Parse batch response
                const parsed = this.parseBatchAIResponse(responseContent, medicines.length);
                
                // Add metadata to each result
                const resultsWithMeta = parsed.results.map(result => ({
                    ...result,
                    source: 'ai-batch',
                    model: this.model,
                    timestamp: new Date().toISOString()
                }));
                
                return resultsWithMeta;
            });

            // Cache result
            this.setCache(cacheKey, results);
            
            console.log(`✅ AI Batch Validation complete: ${medicines.length} medicines`, {
                validCount: results.filter(r => r.valid === true).length,
                invalidCount: results.filter(r => r.valid === false).length
            });
            
            return results;
            
        } catch (error) {
            console.error('❌ AI Batch Validation failed:', error);
            
            // Special handling for truncated responses - try splitting batch
            if (error.type === 'TRUNCATED_RESPONSE' && medicines.length > 1) {
                console.warn(`⚠️ Response truncated, splitting batch of ${medicines.length} into smaller chunks...`);
                
                // Split into 2 halves and validate separately
                const mid = Math.ceil(medicines.length / 2);
                const firstHalf = medicines.slice(0, mid);
                const secondHalf = medicines.slice(mid);
                
                try {
                    const [firstResults, secondResults] = await Promise.all([
                        this.validateBatchForPatient(firstHalf, patientICDs),
                        this.validateBatchForPatient(secondHalf, patientICDs)
                    ]);
                    
                    const combinedResults = [...firstResults, ...secondResults];
                    console.log(`✅ Split batch completed: ${combinedResults.length} medicines`);
                    
                    // Cache combined result
                    const cacheKey = this.getBatchCacheKey(medicines, patientICDs);
                    this.setCache(cacheKey, combinedResults);
                    
                    return combinedResults;
                } catch (splitError) {
                    console.error('❌ Split batch also failed:', splitError);
                    // Fall through to fallback
                }
            }
            
            // Return fallback results for all medicines
            return medicines.map((med, index) => ({
                medicineIndex: index + 1,
                medicineName: med.tenThuoc,
                valid: null,
                hasContraindication: false,
                hasMissingIndication: false,
                violatedICDs: [],
                matchedICDs: [],
                missingICDs: [],
                reasoning: `Không thể xác thực qua AI: ${error.message || error.details || 'Lỗi không xác định'}`,
                severity: 'warning',
                error: error,
                fallback: true,
                source: 'fallback',
                timestamp: new Date().toISOString()
            }));
        }
    }

    /**
     * Main validation function with AI (single medicine)
     */
    async validateWithAI(tenThuoc, chiDinh, chongChiDinh, patientICDs) {
        // Check cache first
        const cacheKey = this.getCacheKey(tenThuoc, chiDinh, chongChiDinh, patientICDs);
        const cached = this.getCached(cacheKey);
        if (cached) {
            return cached;
        }

        // Queue request with rate limiting
        try {
            const result = await this.queueRequest(async () => {
                // Build prompt
                const prompt = this.buildPrompt(tenThuoc, chiDinh, chongChiDinh, patientICDs);
                
                // Call API with retry logic
                const responseContent = await this.callGeminiAPI(prompt);
                
                // Parse response
                const parsed = this.parseAIResponse(responseContent);
                
                // Add metadata
                parsed.source = 'ai';
                parsed.model = this.model;
                parsed.timestamp = new Date().toISOString();
                
                return parsed;
            });

            // Cache result
            this.setCache(cacheKey, result);
            
            console.log('✅ AI Validation complete:', {
                medicine: tenThuoc,
                valid: result.valid,
                severity: result.severity
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ AI Validation failed:', error);
            
            // Return fallback result
            return {
                valid: null,
                hasContraindication: false,
                hasMissingIndication: false,
                violatedICDs: [],
                matchedICDs: [],
                missingICDs: [],
                reasoning: `Không thể xác thực qua AI: ${error.message || error.details || 'Lỗi không xác định'}`,
                severity: 'warning',
                error: error,
                fallback: true,
                source: 'fallback',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Batch validation for multiple medicines
     */
    async batchValidate(requests) {
        console.log(`🤖 AI Validation: Batch validating ${requests.length} medicines...`);
        
        const results = [];
        for (const req of requests) {
            const result = await this.validateWithAI(
                req.tenThuoc,
                req.chiDinh,
                req.chongChiDinh,
                req.patientICDs
            );
            results.push(result);
        }
        
        return results;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.requestCache.clear();
        console.log('🗑️ AI Validation: Cache cleared');
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.requestCache.size,
            maxSize: this.maxCacheSize,
            queueLength: this.requestQueue.length,
            isProcessing: this.isProcessing
        };
    }
}

// Create global instance
if (typeof window !== 'undefined') {
    window.aiValidationService = new AIValidationService();
    console.log('✅ AI Validation Service initialized');
}
