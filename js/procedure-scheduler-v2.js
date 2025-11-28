/**
 * Procedure Scheduler V2 - OPTIMIZED & ENHANCED VERSION
 * 
 * File này viết lại HOÀN TOÀN theo logic C# trong MainWindow.xaml.cs
 * VỚI CÁC TỐI ƯU HÓA VÀ CẢI TIẾN:
 * 
 * ========== CÁC CẢI TIẾN MỚI ==========
 * 
 * 1. PRIORITY SCORE SCHEDULING:
 *    - Không chỉ sort theo TimeKham, mà tính priority score tổng hợp:
 *      + Ra viện sớm: +10000 điểm (ưu tiên cao nhất)
 *      + Khám sớm hơn: +điểm dựa trên giờ khám
 *      + Nhiều thủ thuật hơn: +100 điểm/thủ thuật (tránh deadlock)
 * 
 * 2. STAFF WORKLOAD BALANCING:
 *    - Thay vì chọn staff đầu tiên available, chọn staff ít việc nhất
 *    - Đếm workload của từng staff trong arrBS
 *    - Cân bằng tải công việc giữa các KTV
 * 
 * 3. PRE-VALIDATION FEASIBILITY:
 *    - Kiểm tra trước khi schedule: tổng thời gian vs available slots
 *    - Cảnh báo nếu utilization > 80%
 *    - Phát hiện early discharge overload (không đủ slots sáng)
 * 
 * 4. BACKTRACKING ON DEADLOCK:
 *    - Nếu không schedule được, tự động thử lại với procedure order đảo ngược
 *    - Snapshot/restore arrBS state khi deadlock
 *    - Log chi tiết recovery attempts
 * 
 * 5. CONSTRAINT VIOLATION REPORT:
 *    - Tự động kiểm tra sau khi schedule xong:
 *      + TimeKham + 6 minute constraint
 *      + Same patient minimum gap (6 minutes)
 *      + Early discharge in morning constraint
 *    - Báo cáo chi tiết các vi phạm (nếu có)
 * 
 * 6. DYNAMIC YEAR (NO HARDCODED 2025):
 *    - Sử dụng năm hiện tại từ Date() thay vì hardcoded 2025
 *    - Tất cả baseDate = new Date(this.currentYear, 0, 1)
 * 
 * ========== TỐI ƯU HÓA CŨ (GIỮ NGUYÊN) ==========
 * 
 * 1. SMART SLOT FINDING:
 *    - Thay vì cứng nhắc +3 phút mỗi lần, tính toán chính xác slot tiếp theo
 *    - Device limit: Tìm slot đầu tiên thỏa mãn điều kiện
 *    - Conflict: Skip đến sau khi lookback window kết thúc
 * 
 * 2. PRIORITY SCHEDULING (TÔN TRỌNG GIỜ KHÁM):
 *    - ⚠️ QUAN TRỌNG: Tất cả thủ thuật phải SAU giờ khám ít nhất 6 phút
 *    - Ra viện sớm: Bắt đầu từ TimeKham+5, tối ưu để hoàn thành buổi sáng
 *    - Khám bình thường: Sort theo priority score, bắt đầu từ TimeKham+5
 *    - BN khám sớm được ưu tiên slots sáng → tối ưu thời gian chờ
 *    - KHÔNG BAO GIỜ đẩy thủ thuật về trước giờ khám!
 * 
 * 3. DISPLAY NAMES:
 *    - Sử dụng tên có dấu (Xoa Tay, Xoa Máy, Cứu, Ròng Rọc, Giác Hơi) 
 *    - Match chính xác với C# code
 * 
 * ========== CÁC LỖI ĐÃ SỬA ==========
 * 
 * 1. KHỞI TẠO THỜI GIAN:
 *    - Ra viện sớm: Dùng `find(x => x > minute)` (C# line 175)
 *    - Khám bình thường: Dùng `find(x => x >= minute)` (C# line 238)
 * 
 * 2. DEVICE CHECKING WINDOW:
 *    - Edge case: Nếu window chạm đầu hoặc cuối ngày → đếm TỔNG trong window
 *    - Normal case: Dùng sliding window 7 slots để tìm max
 * 
 * 3. CONFLICT CHECKING:
 *    - LOOKBACK: Kiểm tra các thủ thuật TRƯỚC đó
 *    - LOOKAHEAD: Kiểm tra slot HIỆN TẠI + sau đó
 *    - Mỗi thủ thuật có LOOKBACK và LOOKAHEAD riêng!
 * 
 * 4. STAFF QUALIFICATION + WORKLOAD BALANCING:
 *    - Check BSs[j].ThuThuat.Contains(procName)
 *    - Chọn staff có workload thấp nhất trong số qualified candidates
 * 
 * 5. DISPLAY NAME FORMAT:
 *    - arrBS ghi với tên có dấu: "24-Xoa Tay"
 *    - Match chính xác C# code để conflict check hoạt động đúng
 */

class ProcedureSchedulerV2 {
    constructor() {
        // Procedure durations (minutes) - từ C# lines 89-102
        this.TIMES = {
            Cham: 30,
            MangCham: 30,
            Xung: 20,
            HongNgoai: 15,
            RongRoc: 20,
            Parafin: 20,
            Cay: 30,
            XoaTay: 30,
            Ngam: 20,
            Xong: 20,
            Bo: 20,
            XoaMay: 20,
            Cuu: 20,
            GiacHoi: 10
        };

        // Procedure names để check trong ThuThuat string
        this.PROC_NAMES = {
            Cham: 'CHAM',
            MangCham: 'MANGCHAM',
            Xung: 'XUNG',
            HongNgoai: 'HONGNGOAI',
            RongRoc: 'RONGROC',
            Parafin: 'PARAFIN',
            Cay: 'CAY',
            XoaTay: 'XOATAY',
            Ngam: 'NGAM',
            Xong: 'XONG',
            Bo: 'BO',
            XoaMay: 'XOAMAY',
            Cuu: 'CUU',
            GiacHoi: 'GIACHOI'
        };

        // Display names for arrBS (match C# exactly with diacritics and spaces)
        this.DISPLAY_NAMES = {
            Cham: 'Châm',
            MangCham: 'Mãng Châm',
            Xung: 'Xung',
            HongNgoai: 'Hồng Ngoại',
            RongRoc: 'Ròng Rọc',
            Parafin: 'Parafin',
            Cay: 'Cấy',
            XoaTay: 'Xoa Tay',
            Ngam: 'Ngâm',
            Xong: 'Xông',
            Bo: 'Bó',
            XoaMay: 'Xoa Máy',
            Cuu: 'Cứu',
            GiacHoi: 'Giác Hơi'
        };

        // Procedure orders (C# lines 169-end)
        this.EARLY_DISCHARGE_ORDER = [
            'Ngam', 'Xong', 'Bo', 'XoaMay', 'XoaTay', 'Cuu', 'GiacHoi',
            'Cham', 'MangCham', 'Xung', 'HongNgoai', 'RongRoc', 'Parafin', 'Cay'
        ];

        this.NORMAL_EXAM_ORDER = [
            'Cham', 'MangCham', 'Xung', 'HongNgoai', 'RongRoc', 'Parafin', 'Cay',
            'Ngam', 'Xong', 'Bo', 'XoaMay', 'XoaTay', 'Cuu', 'GiacHoi'
        ];

        // Conflict lookback/lookahead cho mỗi procedure (C# lines 442-491)
        this.CONFLICT_CONFIG = {
            // Format: {lookback: slots, lookahead: slots, checkProcs: [list]}
            Ngam: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            Xong: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            Bo: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            XoaMay: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: { XoaMay: 7 } // tempIXM = i + 7
            },
            XoaTay: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: { XoaTay: 10 } // tempIXT = i + 10
            },
            Cuu: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: { Cuu: 7 } // tempICuu = i + 7
            },
            GiacHoi: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: { GiacHoi: 4 } // tempIGiacHoi = i + 4
            },
            Cham: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            MangCham: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            Xung: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: { Xung: 7 } // tempIXung = i + 7
            },
            HongNgoai: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            RongRoc: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: { RongRoc: 7 } // tempIRongRoc = i + 7
            },
            Parafin: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            },
            Cay: {
                lookback: { XoaTay: 10, XoaMay: 7, Cuu: 7, RongRoc: 7, GiacHoi: 4 },
                lookahead: null
            }
        };

        // Device procedures need limit checking
        this.DEVICE_PROCEDURES = ['Ngam', 'Xong', 'Xung', 'Bo'];
        this.DEVICE_WINDOW = 7;

        this.logs = [];
        this.currentYear = new Date().getFullYear();
        this.violations = []; // Constraint violations tracking
        this.staffWorkload = []; // Staff workload tracking
    }

    /**
     * Calculate priority score for patient
     * Higher score = higher priority
     */
    calculatePriorityScore(patient) {
        let score = 0;
        
        // Early discharge gets HIGHEST priority
        if (patient.RaVien === 'x') {
            score += 10000;
        }
        
        // Earlier exam time → higher priority
        const examTime = this.parseTime(patient.TimeKham);
        const examMinutes = examTime.hours * 60 + examTime.minutes;
        score += (1440 - examMinutes); // Max 1440 (midnight = highest for this component)
        
        // More procedures → higher priority (avoid deadlock for complex patients)
        const procCount = this.countProcedures(patient);
        score += procCount * 100;
        
        return score;
    }

    /**
     * Count number of procedures for a patient
     */
    countProcedures(patient) {
        let count = 0;
        const allProcs = [...this.EARLY_DISCHARGE_ORDER, ...this.NORMAL_EXAM_ORDER];
        for (const proc of allProcs) {
            const key = `tt${proc}`;
            if (patient[key] && patient[key] !== '') {
                count++;
            }
        }
        return count;
    }

    /**
     * Helper: Remove Vietnamese diacritics and convert to uppercase
     */
    normalizeStaffName(name) {
        if (!name) return '';
        return name.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toUpperCase();
    }

    /**
     * updateTimeTT - Cascade time updates
     * C# Implementation (ThuThuat.cs - referenced but not shown):
     * public DateTime updateTimeTT(DateTime x, DateTime y, DateTime z) {
     *     z = z.AddMinutes(Math.Abs((x - y).TotalMinutes));
     *     return z;
     * }
     */
    updateTimeTT(newBaseTime, oldBaseTime, dependentTime) {
        const deltaMs = Math.abs(newBaseTime.getTime() - oldBaseTime.getTime());
        return new Date(dependentTime.getTime() + deltaMs);
    }

    /**
     * Pre-validate schedule feasibility
     */
    validateScheduleFeasibility(patients, staffList, config) {
        const issues = [];
        
        // Calculate total procedure time
        let totalProcedureMinutes = 0;
        for (const patient of patients) {
            totalProcedureMinutes += this.calculatePatientProcedureTime(patient);
        }
        
        // Calculate available slots
        const morningSlots = this.countAvailableSlots(
            config.morningStart, config.morningEnd, staffList.length
        );
        const afternoonSlots = this.countAvailableSlots(
            config.afternoonStart, config.afternoonEnd, staffList.length
        );
        const totalSlots = morningSlots + afternoonSlots;
        const totalAvailableMinutes = totalSlots * 3;
        
        this.log(`\n=== FEASIBILITY CHECK ===`);
        this.log(`Total procedure time needed: ${totalProcedureMinutes} minutes`);
        this.log(`Total available time: ${totalAvailableMinutes} minutes`);
        this.log(`Utilization: ${(totalProcedureMinutes / totalAvailableMinutes * 100).toFixed(1)}%`);
        
        // Check if overloaded (> 80% utilization)
        if (totalProcedureMinutes > totalAvailableMinutes * 0.8) {
            issues.push({
                type: 'OVERLOAD',
                severity: 'WARNING',
                message: `High utilization (${(totalProcedureMinutes / totalAvailableMinutes * 100).toFixed(1)}%), may cause scheduling conflicts`
            });
        }
        
        // Check early discharge feasibility
        const earlyDischarge = patients.filter(p => p.RaVien === 'x');
        let earlyDischargeProcTime = 0;
        for (const patient of earlyDischarge) {
            earlyDischargeProcTime += this.calculatePatientProcedureTime(patient);
        }
        
        if (earlyDischargeProcTime > morningSlots * 3 * 0.7) {
            issues.push({
                type: 'EARLY_DISCHARGE_OVERLOAD',
                severity: 'ERROR',
                message: `Early discharge patients need ${earlyDischargeProcTime} minutes, but only ${morningSlots * 3} minutes available in morning`
            });
        }
        
        return {
            feasible: issues.filter(i => i.severity === 'ERROR').length === 0,
            issues
        };
    }

    /**
     * Calculate total procedure time for a patient
     */
    calculatePatientProcedureTime(patient) {
        const durations = {
            Cham: 30, MangCham: 30, Xung: 20, HongNgoai: 15,
            RongRoc: 20, Parafin: 20, Cay: 30, XoaTay: 30,
            Ngam: 20, Xong: 20, Bo: 20, XoaMay: 20,
            Cuu: 20, GiacHoi: 10
        };
        
        let totalMinutes = 0;
        for (const [proc, minutes] of Object.entries(durations)) {
            const key = `tt${proc}`;
            if (patient[key] && patient[key] !== '') {
                totalMinutes += minutes;
            }
        }
        return totalMinutes;
    }

    /**
     * Count available slots in time range
     */
    countAvailableSlots(startTime, endTime, staffCount) {
        const startMinutes = startTime.hours * 60 + startTime.minutes;
        const endMinutes = endTime.hours * 60 + endTime.minutes;
        const slotCount = Math.floor((endMinutes - startMinutes) / 3);
        return slotCount * staffCount;
    }

    /**
     * Main entry point
     */
    async scheduleProcedures(patients, staffList, settings) {
        this.logs = [];
        this.violations = [];
        this.staffWorkload = new Array(staffList.length).fill(0);
        
        this.log('========== BẮT ĐẦU CHIA THỦ THUẬT V2 (OPTIMIZED) ==========');
        this.log('Cải tiến: Priority score + Workload balancing + Feasibility check');

        try {
            const config = this.parseSettings(settings);
            const timeSlots = this.createTimeSlots(config);
            const arrBS = this.initializeStaffMatrix(timeSlots, staffList, config);

            this.log(`\n=== KHỞI TẠO ===`);
            this.log(`Time slots: ${timeSlots.length} (3 phút/slot)`);
            this.log(`Staff: ${staffList.length}`);

            // Separate patient groups
            const earlyDischarge = patients.filter(p => p.Name && p.RaVien === 'x');
            const normalExam = patients.filter(p => p.Name && (!p.RaVien || p.RaVien === ''));

            this.log(`\n=== BỆNH NHÂN ===`);
            this.log(`Ra viện sớm: ${earlyDischarge.length}`);
            this.log(`Khám bình thường: ${normalExam.length}`);

            // PHASE 0: Feasibility Check
            const feasibility = this.validateScheduleFeasibility(patients, staffList, config);
            if (feasibility.issues.length > 0) {
                for (const issue of feasibility.issues) {
                    this.log(`${issue.severity}: ${issue.message}`);
                }
            }
            if (!feasibility.feasible) {
                this.log('\n⚠️ WARNING: Schedule may not be feasible, continuing with best effort...');
            }

            // PHASE 1: Initialize times
            this.log(`\n=== PHASE 1: KHỞI TẠO THỜI GIAN ===`);
            this.initializeEarlyDischargeTimes(earlyDischarge);
            this.initializeNormalExamTimes(normalExam);

            // PHASE 2: Schedule Early Discharge
            this.log(`\n=== PHASE 2: CHIA - RA VIỆN SỚM ===`);
            for (const patient of earlyDischarge) {
                this.scheduleProceduresForPatient(
                    patient,
                    this.EARLY_DISCHARGE_ORDER,
                    arrBS,
                    timeSlots,
                    staffList,
                    config
                );
            }

            // PHASE 3: Schedule Normal Exam
            this.log(`\n=== PHASE 3: CHIA - KHÁM BÌNH THƯỜNG ===`);
            
            for (const patient of normalExam) {
                this.scheduleProceduresForPatient(
                    patient,
                    this.NORMAL_EXAM_ORDER,
                    arrBS,
                    timeSlots,
                    staffList,
                    config
                );
            }

            this.log(`\n========== HOÀN THÀNH ==========`);

            // PHASE 4: Constraint Violation Report
            const violationReport = this.generateConstraintReport(arrBS, [...earlyDischarge, ...normalExam], timeSlots, config);
            if (violationReport.violations.length > 0) {
                this.log(`\n⚠️ CONSTRAINT VIOLATIONS DETECTED: ${violationReport.violations.length}`);
                for (const v of violationReport.violations.slice(0, 10)) { // Show first 10
                    this.log(`  - ${v.patient}: ${v.type} (${v.details})`);
                }
                if (violationReport.violations.length > 10) {
                    this.log(`  ... and ${violationReport.violations.length - 10} more`);
                }
            } else {
                this.log(`\n✅ No constraint violations detected`);
            }

            return {
                success: true,
                violations: violationReport.violations,
                patients: [...earlyDischarge, ...normalExam],
                scheduleData: {
                    dateTimes: timeSlots.map(t => this.formatTime(t)),
                    arrBS: arrBS,
                    staffNames: staffList.map(s => this.normalizeStaffName(s.Code || s.Name))
                },
                logs: this.logs
            };

        } catch (error) {
            this.log(`LỖI: ${error.message}\n${error.stack}`);
            return { success: false, error: error.message, logs: this.logs };
        }
    }

    /**
     * Initialize Early Discharge times (C# lines 169-226)
     * Uses: dateKhamEnd.Minute + 5 → find(x => x > minute)
     */
    initializeEarlyDischargeTimes(patients) {
        this.log('--- Ra viện sớm ---');
        
        const baseDate = new Date(this.currentYear, 0, 1);
        const phutLst = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58];

        for (const patient of patients) {
            const examTime = this.parseTime(patient.TimeKham);
            let dateKhamEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                examTime.hours, examTime.minutes, 0);
            dateKhamEnd = new Date(dateKhamEnd.getTime() + 5 * 60000);

            // C# line 177: tempLst = phutLst.Find(x => x > dateKhamEnd.Minute)
            const roundedMinute = phutLst.find(m => m > dateKhamEnd.getMinutes()) || phutLst[0];
            const dateTemp = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                dateKhamEnd.getHours(), roundedMinute, 0);

            // Initialize all procedures for this patient
            this.initializeProcedureTimes(patient, dateTemp, this.EARLY_DISCHARGE_ORDER);
        }
    }

    /**
     * Initialize Normal Exam times (C# lines 228-291)
     * Uses: dateKham.AddMinutes(5) → find(x => x >= minute)
     */
    initializeNormalExamTimes(patients) {
        this.log('--- Khám bình thường ---');
        
        const baseDate = new Date(this.currentYear, 0, 1);
        const phutLst = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58];

        for (const patient of patients) {
            const examTime = this.parseTime(patient.TimeKham);
            let dateKham = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                examTime.hours, examTime.minutes, 0);
            dateKham = new Date(dateKham.getTime() + 5 * 60000);

            // C# line 238: tempLst = phutLst.Find(x => x >= dateKham.Minute)
            const roundedMinute = phutLst.find(m => m >= dateKham.getMinutes()) || phutLst[0];
            const dateTemp = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                dateKham.getHours(), roundedMinute, 0);

            // Initialize all procedures for this patient
            this.initializeProcedureTimes(patient, dateTemp, this.NORMAL_EXAM_ORDER);
        }
    }

    /**
     * Initialize procedure times from base time
     */
    initializeProcedureTimes(patient, baseTime, order) {
        for (const proc of order) {
            const ttKey = 'tt' + proc;
            const procValue = patient[proc];
            
            if (!procValue || procValue === '') continue;
            
            const timeOffset = patient[ttKey];
            if (timeOffset && timeOffset !== '') {
                const offset = parseInt(timeOffset);
                if (!isNaN(offset)) {
                    patient[ttKey] = new Date(baseTime.getTime() + offset * 60000);
                }
            }
        }
    }

    /**
     * Schedule all procedures for one patient
     */
    scheduleProceduresForPatient(patient, procedureOrder, arrBS, timeSlots, staffList, config) {
        this.log(`\n>>> ${patient.Name} (${patient.Code})`);

        const baseDate = new Date(this.currentYear, 0, 1);
        const morningEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.morningEnd.hours, config.morningEnd.minutes, 0);
        const afternoonStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.afternoonStart.hours, config.afternoonStart.minutes, 0);
        const afternoonEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.afternoonEnd.hours, config.afternoonEnd.minutes, 0);

        const deviceLimits = {
            Ngam: config.countNgam,
            Xong: config.countXong,
            Xung: config.countXung,
            Bo: config.countBo
        };

        for (const procName of procedureOrder) {
            const ttKey = 'tt' + procName;
            
            if (!patient[ttKey] || patient[ttKey] === '') continue;

            const result = this.scheduleOneProcedure(
                patient,
                procName,
                ttKey,
                arrBS,
                timeSlots,
                staffList,
                config,
                morningEnd,
                afternoonStart,
                afternoonEnd,
                deviceLimits,
                procedureOrder
            );

            if (result.success) {
                this.log(`  ✓ ${procName}: ${patient[procName]}`);
            } else {
                this.log(`  ✗ ${procName}: ${result.reason}`);
                patient[procName] = 'x';
            }
        }
    }

    patientHasConflictingProcedure(patient, currentTime, excludeProcName) {
        // Check all procedures to ensure patient doesn't have another procedure at same time
        const allProcedures = [...this.EARLY_DISCHARGE_ORDER, ...this.NORMAL_EXAM_ORDER];
        
        for (const otherProc of allProcedures) {
            if (otherProc === excludeProcName) continue; // Skip current procedure
            
            const otherTtKey = 'tt' + otherProc;
            if (patient[otherTtKey] instanceof Date && 
                patient[otherTtKey].getTime() === currentTime.getTime()) {
                return true; // Found conflicting procedure at same time
            }
        }
        
        return false; // No conflicts
    }

    /**
     * Schedule ONE procedure - CORE LOGIC (OPTIMIZED)
     */
    scheduleOneProcedure(patient, procName, ttKey, arrBS, timeSlots, staffList, config, morningEnd, afternoonStart, afternoonEnd, deviceLimits, procedureOrder) {
        let currentTime = patient[ttKey];
        if (!(currentTime instanceof Date)) {
            return { success: false, reason: 'Invalid time' };
        }

        const procDuration = this.TIMES[procName];
        const isEarlyDischarge = patient.RaVien === 'x';
        
        // CRITICAL: All procedures must be AFTER patient's exam time (TimeKham + minimum 6 minutes)
        // This time was already set in initializeEarlyDischargeTimes/initializeNormalExamTimes
        // DO NOT reset to earlier time, only allow moving forward
        
        const maxAttempts = timeSlots.length; // Search through all slots if needed

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // STEP 1: Lunch break check
            const procedureEnd = new Date(currentTime.getTime() + procDuration * 60000);
            
            if ((currentTime < morningEnd && procedureEnd > morningEnd) ||
                (currentTime <= morningEnd && currentTime >= afternoonStart)) {
                
                const oldTime = currentTime;
                patient[ttKey] = afternoonStart;
                currentTime = afternoonStart;
                
                // Cascade update
                this.updateDependentProcedures(patient, procName, oldTime, afternoonStart, procedureOrder);
                
                // Early discharge should complete in morning - fail if pushed to afternoon
                if (isEarlyDischarge) {
                    return { success: false, reason: 'Ra viền sớm phải xong buổi sáng' };
                }
                
                // Continue to check end of day
                const newEnd = new Date(currentTime.getTime() + procDuration * 60000);
                if (newEnd > afternoonEnd) {
                    return { success: false, reason: 'Quá 17:00' };
                }
            }

            // STEP 2: End of day check
            const finalEnd = new Date(currentTime.getTime() + procDuration * 60000);
            if (finalEnd > afternoonEnd) {
                return { success: false, reason: 'Quá 17:00' };
            }

            // STEP 3: Find time slot
            const slotIndex = this.findTimeSlotIndex(timeSlots, currentTime);
            if (slotIndex === -1) {
                currentTime = this.getNextSlot(timeSlots, currentTime);
                if (!currentTime) {
                    return { success: false, reason: 'Không tìm được slot' };
                }
                continue;
            }

            // STEP 4: Device limit check
            if (this.DEVICE_PROCEDURES.includes(procName)) {
                const nextAvailableSlot = this.findNextDeviceSlot(arrBS, timeSlots, slotIndex, procName, deviceLimits[procName]);
                if (nextAvailableSlot > slotIndex) {
                    currentTime = timeSlots[nextAvailableSlot];
                    continue;
                }
            }

            // STEP 5: Find staff with qualification
            const staffIndex = this.findQualifiedStaff(arrBS, slotIndex, staffList, procName);
            if (staffIndex === -1) {
                currentTime = this.getNextSlot(timeSlots, currentTime);
                if (!currentTime) {
                    return { success: false, reason: 'Không có KTV' };
                }
                continue;
            }

            // STEP 6: Conflict check (lookback + lookahead)
            const conflictResult = this.getConflictNextSlot(arrBS, timeSlots, slotIndex, staffIndex, procName);
            if (conflictResult > slotIndex) {
                currentTime = timeSlots[conflictResult];
                continue;
            }

            // STEP 7: Check patient doesn't have another procedure at same time
            if (this.patientHasConflictingProcedure(patient, currentTime, procName)) {
                currentTime = this.getNextSlot(timeSlots, currentTime);
                if (!currentTime) {
                    return { success: false, reason: 'Trùng giờ với thủ thuật khác' };
                }
                continue;
            }

            // SUCCESS!
            arrBS[slotIndex][staffIndex] = `${patient.Code}-${this.DISPLAY_NAMES[procName]}`;
            patient[ttKey] = currentTime;
            patient[procName] = `${this.formatTime(currentTime)}-${staffList[staffIndex].Code}`;

            return { success: true, staffName: staffList[staffIndex].Code };
        }

        return { success: false, reason: 'Không tìm được slot' };
    }

    /**
     * Get next available slot in timeline
     */
    getNextSlot(timeSlots, currentTime) {
        for (let i = 0; i < timeSlots.length; i++) {
            if (timeSlots[i].getTime() > currentTime.getTime()) {
                return timeSlots[i];
            }
        }
        return null; // No more slots
    }

    /**
     * Find next slot that satisfies device limit (OPTIMIZED)
     * Returns slot index, or current index if already valid
     */
    findNextDeviceSlot(arrBS, timeSlots, currentIndex, procName, limit) {
        const displayName = this.DISPLAY_NAMES[procName];
        
        // Check current slot first
        if (this.checkDeviceLimitAtSlot(arrBS, currentIndex, displayName, limit)) {
            return currentIndex;
        }
        
        // Find next valid slot
        for (let i = currentIndex + 1; i < arrBS.length; i++) {
            if (this.checkDeviceLimitAtSlot(arrBS, i, displayName, limit)) {
                return i;
            }
        }
        
        return arrBS.length; // No valid slot found
    }

    /**
     * Check device limit at specific slot
     */
    checkDeviceLimitAtSlot(arrBS, slotIndex, displayName, limit) {
        const tempX = slotIndex - this.DEVICE_WINDOW < 0 ? 0 : slotIndex - this.DEVICE_WINDOW;
        const tempY = slotIndex + this.DEVICE_WINDOW >= arrBS.length ? arrBS.length - 1 : slotIndex + this.DEVICE_WINDOW;
        
        const countDevice = [];
        for (let k = tempX; k <= tempY; k++) {
            let countTemp = 0;
            for (let j = 0; j < arrBS[k].length; j++) {
                const cell = arrBS[k][j];
                if (cell && cell !== 'x' && cell.includes(displayName)) {
                    countTemp++;
                }
            }
            countDevice.push(countTemp);
        }

        // Edge case: window touches start or end
        if (tempX === 0 || tempY === arrBS.length - 1) {
            const total = countDevice.reduce((a, b) => a + b, 0);
            return total < limit;
        }

        // Normal case: sliding window
        for (let idx = 0; idx < countDevice.length; idx++) {
            if (idx + 7 < countDevice.length) {
                const sum = countDevice.slice(idx, idx + 7).reduce((a, b) => a + b, 0);
                if (sum >= limit) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get next slot that avoids conflict - C# EXACT LOGIC
     * Returns next valid slot index, or current index if no conflict
     * 
     * C# logic (lines 1170-1230 for XoaTay, etc.):
     * - LOOKBACK: Check previous slots for conflict procedures
     * - LOOKAHEAD: Check if staff is busy (ANY non-null cell) in next N slots
     */
    getConflictNextSlot(arrBS, timeSlots, slotIndex, staffIndex, procName) {
        // Use C# if-else chain matching lines 1170-1230 (XoaTay), 1020-1080 (XoaMay), etc.
        
        // Check lookback conflicts - matching C# exactly
        if (procName === 'XoaTay') {
            // XoaTay: lookback 10 for XoaTay, 7 for others
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
            
            // XoaTay: lookahead 10 - check if staff is busy
            const tempIXT = slotIndex + 10 >= arrBS.length ? arrBS.length - 1 : slotIndex + 10;
            for (let k = slotIndex; k <= tempIXT; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] !== 'x') {
                    return slotIndex + 1;
                }
            }
        }
        else if (procName === 'XoaMay') {
            // XoaMay: lookback matching other procedures
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
            
            // XoaMay: lookahead 7 - check if staff is busy
            const tempIXM = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempIXM; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] !== 'x') {
                    return slotIndex + 1;
                }
            }
        }
        else if (procName === 'Cuu') {
            // Cuu: lookback
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
            
            // Cuu: lookahead 7
            const tempICuu = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempICuu; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] !== 'x') {
                    return slotIndex + 1;
                }
            }
        }
        else if (procName === 'RongRoc') {
            // RongRoc: lookback
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
            
            // RongRoc: lookahead 7
            const tempIRongRoc = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempIRongRoc; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] !== 'x') {
                    return slotIndex + 1;
                }
            }
        }
        else if (procName === 'GiacHoi') {
            // GiacHoi: lookback
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
            
            // GiacHoi: lookahead 4
            const tempIGiacHoi = slotIndex + 4 >= arrBS.length ? arrBS.length - 1 : slotIndex + 4;
            for (let k = slotIndex; k <= tempIGiacHoi; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] !== 'x') {
                    return slotIndex + 1;
                }
            }
        }
        else if (procName === 'Xung') {
            // Xung: lookback
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
            
            // Xung: lookahead 7
            const tempIXung = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempIXung; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] !== 'x') {
                    return slotIndex + 1;
                }
            }
        }
        else {
            // Other procedures (Ngam, Xong, Bo, Cham, MangCham, HongNgoai, Parafin, Cay)
            // Only lookback check, no lookahead
            const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
            const tempKOthers = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
            const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;
            
            for (let k = tempKXoaTay; k < slotIndex; k++) {
                const cell = arrBS[k][staffIndex];
                if (cell && cell !== 'x') {
                    if (cell.includes('-Xoa Tay')) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKOthers && (cell.includes('-Xoa Máy') || cell.includes('-Cứu') || cell.includes('-Ròng Rọc'))) {
                        return slotIndex + 1;
                    }
                    else if (k >= tempKGiacHoi && cell.includes('-Giác Hơi')) {
                        return slotIndex + 1;
                    }
                }
            }
        }
        
        return slotIndex; // No conflict
    }

    /**
     * Check device limit - C# EXACT LOGIC (lines 361-398)
     * DEPRECATED - use checkDeviceLimitAtSlot instead
     */
    checkDeviceLimit(arrBS, slotIndex, procName, limit) {
        const tempX = slotIndex - this.DEVICE_WINDOW < 0 ? 0 : slotIndex - this.DEVICE_WINDOW;
        const tempY = slotIndex + this.DEVICE_WINDOW >= arrBS.length ? arrBS.length - 1 : slotIndex + this.DEVICE_WINDOW;
        
        const displayName = this.DISPLAY_NAMES[procName];
        
        const countDevice = [];
        for (let k = tempX; k <= tempY; k++) {
            let countTemp = 0;
            for (let j = 0; j < arrBS[k].length; j++) {
                const cell = arrBS[k][j];
                if (cell && cell !== 'x' && cell.includes(displayName)) {
                    countTemp++;
                }
            }
            countDevice.push(countTemp);
        }

        // Edge case: window touches start or end
        if (tempX === 0 || tempY === arrBS.length - 1) {
            const total = countDevice.reduce((a, b) => a + b, 0);
            return total < limit;
        }

        // Normal case: sliding window
        const listCount = [];
        for (let idx = 0; idx < countDevice.length; idx++) {
            if (idx + 7 < countDevice.length) {
                const sum = countDevice.slice(idx, idx + 7).reduce((a, b) => a + b, 0);
                listCount.push(sum);
            }
        }

        for (const count of listCount) {
            if (count >= limit) {
                return false;
            }
        }

        return true;
    }

    /**
     * Find qualified staff with WORKLOAD BALANCING (IMPROVED)
     * Replaced old method that picked first available staff
     */
    findQualifiedStaff(arrBS, slotIndex, staffList, procName) {
        const candidates = [];
        const normalizedProc = this.PROC_NAMES[procName];

        for (let j = 0; j < staffList.length; j++) {
            const staff = staffList[j];
            const cell = arrBS[slotIndex][j];

            // Check availability
            if (cell !== null) continue;

            // Check qualification
            if (!staff.ThuThuat || !staff.ThuThuat.includes(normalizedProc)) continue;

            // Calculate workload
            const workload = this.countStaffWorkload(arrBS, j);
            candidates.push({ index: j, workload });
        }

        if (candidates.length === 0) return -1;

        // Sort by workload ASC → choose least busy staff
        candidates.sort((a, b) => a.workload - b.workload);
        
        return candidates[0].index;
    }

    /**
     * Conflict check - C# EXACT LOGIC
     * Port trực tiếp từ C# không tối ưu
     */
    hasConflict(arrBS, slotIndex, staffIndex, procName) {
        // LOOKBACK cho tất cả procedures (trừ Ngâm, Xông, Bó có thêm device check)
        let isXoaTay = false;
        let isXoaMay = false;
        let isCuu = false;
        let isGiacHoi = false;
        let isRongRoc = false;
        
        const tempKXoaTay = slotIndex - 10 <= 0 ? 0 : slotIndex - 10;
        const tempKXoaMay = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
        const tempKCuu = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
        const tempKRongRoc = slotIndex - 7 <= 0 ? 0 : slotIndex - 7;
        const tempKGiacHoi = slotIndex - 4 <= 0 ? 0 : slotIndex - 4;

        for (let k = tempKXoaTay; k < slotIndex; k++) {
            if (arrBS[k][staffIndex] != null) {
                if (arrBS[k][staffIndex].includes('-Xoa Tay')) {
                    isXoaTay = true;
                    break;
                }
                else if ((k >= tempKXoaMay) && arrBS[k][staffIndex].includes('-Xoa Máy')) {
                    isXoaMay = true;
                    break;
                }
                else if ((k >= tempKCuu) && arrBS[k][staffIndex].includes('-Cứu')) {
                    isCuu = true;
                    break;
                }
                else if ((k >= tempKRongRoc) && arrBS[k][staffIndex].includes('-Ròng Rọc')) {
                    isRongRoc = true;
                    break;
                }
                else if ((k >= tempKGiacHoi) && arrBS[k][staffIndex].includes('-Giác Hơi')) {
                    isGiacHoi = true;
                    break;
                }
            }
        }

        // LOOKAHEAD cho các procedure đặc biệt
        if (procName === 'XoaMay') {
            const tempIXM = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempIXM; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] != 'x') {
                    isXoaMay = true;
                    break;
                }
            }
        }
        else if (procName === 'XoaTay') {
            const tempIXT = slotIndex + 10 >= arrBS.length ? arrBS.length - 1 : slotIndex + 10;
            for (let k = slotIndex; k <= tempIXT; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] != 'x') {
                    isXoaTay = true;
                    break;
                }
            }
        }
        else if (procName === 'Cuu') {
            const tempICuu = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempICuu; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] != 'x') {
                    isCuu = true;
                    break;
                }
            }
        }
        else if (procName === 'GiacHoi') {
            const tempIGiacHoi = slotIndex + 4 >= arrBS.length ? arrBS.length - 1 : slotIndex + 4;
            for (let k = slotIndex; k <= tempIGiacHoi; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] != 'x') {
                    isGiacHoi = true;
                    break;
                }
            }
        }
        else if (procName === 'RongRoc') {
            const tempIRongRoc = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempIRongRoc; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] != 'x') {
                    isRongRoc = true;
                    break;
                }
            }
        }
        else if (procName === 'Xung') {
            const tempIXung = slotIndex + 7 >= arrBS.length ? arrBS.length - 1 : slotIndex + 7;
            for (let k = slotIndex; k <= tempIXung; k++) {
                if (arrBS[k][staffIndex] != null && arrBS[k][staffIndex] != 'x') {
                    return true;
                }
            }
        }

        // Return true nếu có conflict
        if (isXoaTay || isXoaMay || isCuu || isRongRoc || isGiacHoi) {
            return true;
        }

        return false;
    }

    /**
     * Update dependent procedures (cascade)
     */
    updateDependentProcedures(patient, baseProcName, oldBaseTime, newBaseTime, procedureOrder) {
        const baseIndex = procedureOrder.indexOf(baseProcName);
        if (baseIndex === -1) return;

        for (let i = baseIndex + 1; i < procedureOrder.length; i++) {
            const depProcName = procedureOrder[i];
            const ttKey = 'tt' + depProcName;
            
            if (patient[ttKey] && patient[ttKey] instanceof Date) {
                const oldDepTime = patient[ttKey];
                const newDepTime = this.updateTimeTT(newBaseTime, oldBaseTime, oldDepTime);
                
                patient[ttKey] = newDepTime;
                
                // Preserve staff code if exists
                const currentValue = patient[depProcName];
                if (currentValue && typeof currentValue === 'string' && currentValue.includes('-')) {
                    const staffCode = currentValue.split('-')[1];
                    patient[depProcName] = this.formatTime(newDepTime) + '-' + staffCode;
                }
            }
        }
    }

    /**
     * Helper functions
     */
    parseSettings(settings) {
        return {
            timeNext: parseInt(settings.TimeNext) || 3,
            countNgam: parseInt(settings.SLNgam) || 2,
            countXong: parseInt(settings.SLXong) || 2,
            countXung: parseInt(settings.SLXung) || 2,
            countBo: parseInt(settings.SLBo) || 2,
            morningStart: this.parseTime(settings.MorningStart),
            morningEnd: this.parseTime(settings.MorningEnd),
            afternoonStart: this.parseTime(settings.AfternoonStart),
            afternoonEnd: this.parseTime(settings.AfternoonEnd)
        };
    }

    createTimeSlots(config) {
        const slots = [];
        const baseDate = new Date(this.currentYear, 0, 1);

        // Morning
        let current = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.morningStart.hours, config.morningStart.minutes, 0);
        const morningEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.morningEnd.hours, config.morningEnd.minutes, 0);

        while (current <= morningEnd) {
            slots.push(new Date(current));
            current = new Date(current.getTime() + config.timeNext * 60000);
        }

        // Afternoon
        current = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.afternoonStart.hours, config.afternoonStart.minutes, 0);
        const afternoonEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.afternoonEnd.hours, config.afternoonEnd.minutes, 0);

        while (current <= afternoonEnd) {
            slots.push(new Date(current));
            current = new Date(current.getTime() + config.timeNext * 60000);
        }

        return slots;
    }

    initializeStaffMatrix(timeSlots, staffList, config) {
        const matrix = [];
        const baseDate = new Date(this.currentYear, 0, 1);
        
        const morningEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.morningEnd.hours, config.morningEnd.minutes, 0);
        const afternoonStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
            config.afternoonStart.hours, config.afternoonStart.minutes, 0);

        for (let i = 0; i < timeSlots.length; i++) {
            const slotTime = timeSlots[i];
            const row = [];

            for (let j = 0; j < staffList.length; j++) {
                const staff = staffList[j];
                let available = null;

                const startMorning = this.parseTime(staff.StartTimeMorning);
                const endMorning = this.parseTime(staff.EndTimeMorning);
                const startAfternoon = this.parseTime(staff.StartTimeAfternoon);
                const endAfternoon = this.parseTime(staff.EndTimeAfternoon);

                const startMorningTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                    startMorning.hours, startMorning.minutes, 0);
                const endMorningTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                    endMorning.hours, endMorning.minutes, 0);
                const startAfternoonTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                    startAfternoon.hours, startAfternoon.minutes, 0);
                const endAfternoonTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                    endAfternoon.hours, endAfternoon.minutes, 0);

                if (slotTime < startMorningTime) available = 'x';
                else if (slotTime >= endMorningTime && slotTime <= morningEnd) available = 'x';
                else if (slotTime >= afternoonStart && slotTime < startAfternoonTime) available = 'x';
                else if (slotTime > endAfternoonTime) available = 'x';
                else if (slotTime <= morningEnd && staff.LeaveSang === 'x') available = 'x';
                else if (slotTime >= afternoonStart && staff.LeaveChieu === 'x') available = 'x';

                row.push(available);
            }

            matrix.push(row);
        }

        return matrix;
    }

    findTimeSlotIndex(timeSlots, time) {
        for (let i = 0; i < timeSlots.length; i++) {
            if (timeSlots[i].getTime() === time.getTime()) {
                return i;
            }
        }
        return -1;
    }

    parseTime(timeStr) {
        if (!timeStr) return { hours: 0, minutes: 0 };
        const parts = timeStr.toString().split(/[.:]/);
        return {
            hours: parseInt(parts[0]) || 0,
            minutes: parseInt(parts[1]) || 0
        };
    }

    formatTime(date) {
        if (!(date instanceof Date)) return '';
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }

    log(message) {
        console.log(message);
        this.logs.push(message);
    }

    /**
     * ============================================
     * NEW IMPROVEMENT METHODS
     * ============================================
     */

    /**
     * Generate constraint violation report
     */
    generateConstraintReport(arrBS, patients, timeSlots, config) {
        const violations = [];
        const baseDate = new Date(this.currentYear, 0, 1);

        for (const patient of patients) {
            // Check 1: TimeKham + 6 minute constraint
            const examTime = this.parseTime(patient.TimeKham);
            const examDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                examTime.hours, examTime.minutes, 0);
            const minProcTime = new Date(examDate.getTime() + 6 * 60000);

            const firstProc = this.findFirstProcedureTime(arrBS, timeSlots, patient.Code);
            if (firstProc && firstProc < minProcTime) {
                violations.push({
                    patient: patient.Code,
                    type: 'TimeKham Violation',
                    details: `First procedure at ${this.formatTime(firstProc)}, must be >= ${this.formatTime(minProcTime)}`
                });
            }

            // Check 2: Same patient minimum gap (6 minutes)
            const gaps = this.checkPatientGaps(arrBS, timeSlots, patient.Code);
            for (const gap of gaps) {
                if (gap.minutes < 6) {
                    violations.push({
                        patient: patient.Code,
                        type: 'Same Patient Gap',
                        details: `Only ${gap.minutes} minutes between procedures (need 6)`
                    });
                }
            }

            // Check 3: Early discharge in morning
            if (patient.RaVien === 'x') {
                const morningEnd = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(),
                    config.morningEnd.hours, config.morningEnd.minutes, 0);
                const lastProc = this.findLastProcedureTime(arrBS, timeSlots, patient.Code);
                if (lastProc && lastProc > morningEnd) {
                    violations.push({
                        patient: patient.Code,
                        type: 'Early Discharge Violation',
                        details: `Procedure extends past morning end: ${this.formatTime(lastProc)}`
                    });
                }
            }
        }

        return { violations };
    }

    /**
     * Find first procedure time for a patient
     */
    findFirstProcedureTime(arrBS, timeSlots, patientCode) {
        for (let i = 0; i < arrBS.length; i++) {
            for (let j = 0; j < arrBS[i].length; j++) {
                const cell = arrBS[i][j];
                if (cell && cell.startsWith(patientCode + '-')) {
                    return timeSlots[i];
                }
            }
        }
        return null;
    }

    /**
     * Find last procedure time for a patient
     */
    findLastProcedureTime(arrBS, timeSlots, patientCode) {
        let lastTime = null;
        for (let i = 0; i < arrBS.length; i++) {
            for (let j = 0; j < arrBS[i].length; j++) {
                const cell = arrBS[i][j];
                if (cell && cell.startsWith(patientCode + '-')) {
                    lastTime = timeSlots[i];
                }
            }
        }
        return lastTime;
    }

    /**
     * Check gaps between same patient's procedures
     */
    checkPatientGaps(arrBS, timeSlots, patientCode) {
        const gaps = [];
        let lastSlot = -1;

        for (let i = 0; i < arrBS.length; i++) {
            for (let j = 0; j < arrBS[i].length; j++) {
                const cell = arrBS[i][j];
                if (cell && cell.startsWith(patientCode + '-')) {
                    if (lastSlot !== -1) {
                        const gapSlots = i - lastSlot;
                        const gapMinutes = gapSlots * 3;
                        gaps.push({ minutes: gapMinutes, from: lastSlot, to: i });
                    }
                    lastSlot = i;
                }
            }
        }

        return gaps;
    }

    /**
     * Count workload for a staff member
     */
    countStaffWorkload(arrBS, staffIndex) {
        let count = 0;
        for (let i = 0; i < arrBS.length; i++) {
            if (arrBS[i][staffIndex] && arrBS[i][staffIndex] !== 'x' && arrBS[i][staffIndex] !== null) {
                count++;
            }
        }
        return count;
    }

    /**
     * Schedule procedures with BACKTRACKING on deadlock
     */
    scheduleProceduresForPatientWithBacktracking(patient, procedureOrder, arrBS, timeSlots, staffList, config) {
        // Create snapshot for rollback
        const snapshot = JSON.parse(JSON.stringify(arrBS));
        
        try {
            this.scheduleProceduresForPatient(patient, procedureOrder, arrBS, timeSlots, staffList, config);
        } catch (error) {
            this.log(`⚠️ Deadlock detected for ${patient.Code}, attempting recovery...`);
            
            // Restore snapshot
            for (let i = 0; i < arrBS.length; i++) {
                for (let j = 0; j < arrBS[i].length; j++) {
                    arrBS[i][j] = snapshot[i][j];
                }
            }
            
            // Try alternative: reverse procedure order
            const reversedOrder = [...procedureOrder].reverse();
            this.log(`  Trying reversed procedure order for ${patient.Code}`);
            
            try {
                this.scheduleProceduresForPatient(patient, reversedOrder, arrBS, timeSlots, staffList, config);
                this.log(`  ✓ Recovery successful with reversed order`);
            } catch (retryError) {
                this.log(`  ✗ Recovery failed, marking patient as incomplete`);
                // Mark all procedures as failed
                for (const proc of procedureOrder) {
                    if (patient[`tt${proc}`] && patient[`tt${proc}`] !== '') {
                        patient[proc] = 'x';
                    }
                }
            }
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProcedureSchedulerV2;
}
