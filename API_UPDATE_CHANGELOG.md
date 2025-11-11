# ✅ CẬP NHẬT API MỚI - Mã Liên Kết XML130

## 🔄 Thay đổi chính

Đã cập nhật code để sử dụng API mới cho việc search và update thuốc theo mã liên kết BHYT XML130.

## 📝 API Endpoint Mới

### Search bằng Mã Liên Kết
```
POST https://bvphuyen.vncare.vn/vnpthis/RestService

Payload:
{
  "func": "ajaxCALL_SP_O",
  "params": [
    "T.GET.DATA",
    "{\"TNAME\":\"BH_XML2_130\",\"TKEY\":\"MA_LK\",\"TVAL\":\"450285\",\"TMODE\":\"1\",\"THID\":\"CSYTID\"}",
    0
  ],
  "uuid": "uuid_from_session"
}

Response:
{
  "result": "[{...}, {...}]",  // JSON string chứa array thuốc
  "out_var": "[]",
  "error_code": 0,
  "error_msg": ""
}
```

### Update Cách Dùng
```
POST https://bvphuyen.vncare.vn/vnpthis/RestService

Payload:
{
  "func": "ajaxCALL_SP_U",
  "params": [
    "UPD.XML2.CACHDUNG",
    "{\"XML2ID\":\"989652\",\"MA_LK\":\"450285\",\"TIEPNHANID\":\"450285\",\"CSYTID\":\"42346\",\"CACH_DUNG\":\"Uống ngày 2 lần, sáng và tối, sau ăn\"}"
  ],
  "uuid": "uuid_from_session"
}
```

## 🔧 Thay đổi trong Code

### 1. Hàm `searchPatientByConnectionCode(code)` - MỚI
**Trước:**
- Search bệnh nhân qua nhiều fields (MABHYT, MABENHAN, MABENHNHAN)
- Trả về thông tin bệnh nhân
- Cần gọi thêm API để lấy danh sách thuốc

**Sau:**
- Search trực tiếp theo MA_LK qua API `T.GET.DATA`
- Trả về luôn danh sách thuốc trong response
- Parse JSON result để lấy array thuốc
- Filter ngay để tìm thuốc mục tiêu
- Trả về object chứa: MA_LK, TIEPNHANID, CSYTID, XML2ID, medicines, targetMedicine

### 2. Hàm `processConnectionCode(code)` - CẬP NHẬT
**Thay đổi:**
- Không cần gọi `getPatientMedicines()` nữa vì medicines đã có sẵn
- Chỉ cập nhật 1 thuốc duy nhất (targetMedicine) thay vì list
- Simplified flow: search → filter → update → done

**Flow cũ:**
```
search patient → get medicines → filter medicines → update all → save
```

**Flow mới:**
```
search by MA_LK (includes medicines) → get target medicine → update one → save
```

### 3. Hàm `findTargetMedicine(medicines)` - MỚI
**Chức năng:**
- Tìm thuốc mục tiêu từ danh sách
- Ưu tiên: "Cam thảo" > "Độc hoạt" > "Đại táo"
- Chỉ trả về 1 thuốc duy nhất (ưu tiên cao nhất)

**Logic:**
```javascript
priorities = ['Cam thảo', 'Độc hoạt', 'Đại táo'];
for (targetName in priorities) {
    found = medicines.find(m => m.TEN_THUOC.includes(targetName));
    if (found) return found;  // Trả về ngay khi tìm thấy
}
return null;
```

### 4. Hàm `updateMedicineUsage()` - CẬP NHẬT
**Trước:**
- Update nhiều thuốc trong array
- Loop qua từng thuốc

**Sau:**
- Chỉ update 1 thuốc duy nhất
- Simplified parameters

### 5. Hàm `updateSingleMedicineUsage()` - CẬP NHẬT
**Thay đổi API call:**

**Trước:**
```javascript
{
  func: "ajaxCALL_SP_U",
  params: [
    "NTU.UPD.MEDICINE.USAGE",
    JSON.stringify({
      THUOCID: medicine.THUOCID,
      HOSOBENHANID: patient.HOSOBENHANID,
      TIEPNHANID: patient.TIEPNHANID,
      CACHDUNG: usage
    })
  ]
}
```

**Sau:**
```javascript
{
  func: "ajaxCALL_SP_U",
  params: [
    "UPD.XML2.CACHDUNG",
    JSON.stringify({
      XML2ID: medicine.XML2ID,
      MA_LK: patientData.MA_LK,
      TIEPNHANID: medicine.TIEPNHANID,
      CSYTID: medicine.CSYTID,
      CACH_DUNG: usage
    })
  ]
}
```

### 6. Hàm `renderResult()` - CẬP NHẬT
**Thay đổi:**
- Hiển thị MA_LK và TIEPNHANID thay vì tên bệnh nhân
- Chỉ hiển thị 1 thuốc thay vì list
- Updated HTML structure

## 🗑️ Các hàm đã XÓA

1. ❌ `getPatientMedicines(patient)` - Không cần nữa vì API mới trả về luôn
2. ❌ `filterTargetMedicines(medicines)` - Thay bằng `findTargetMedicine()`
3. ❌ `updateMedicinesUsage(medicines, patient)` - Thay bằng `updateMedicineUsage()` (singular)

## 📊 So sánh Flow

### Flow Cũ (nhiều bước)
```
1. Input mã liên kết
2. Search bệnh nhân (API 1)
3. Get medicines list (API 2)
4. Filter thuốc mục tiêu
5. Loop update từng thuốc (API 3 x N)
6. Display results
```

### Flow Mới (tối ưu)
```
1. Input mã liên kết
2. Search MA_LK → Medicines (API 1) ✨
3. Filter → Chỉ 1 thuốc ưu tiên cao nhất
4. Update 1 thuốc (API 2) ✨
5. Display result
```

**Cải thiện:**
- ✅ Giảm từ 2+N API calls xuống 2 API calls
- ✅ Faster performance
- ✅ Simplified logic
- ✅ Chỉ update thuốc cần thiết nhất

## 🎯 Ưu tiên Thuốc

**Thứ tự ưu tiên khi có nhiều thuốc:**
1. 🥇 "Cam thảo" - Ưu tiên cao nhất
2. 🥈 "Độc hoạt" - Ưu tiên thứ 2
3. 🥉 "Đại táo" - Ưu tiên thứ 3

**Ví dụ:**
```
Input: MA_LK = "450285"

Danh sách thuốc trả về:
- Phòng phong
- Đương quy chích rượu
- Đại táo ← có trong list mục tiêu
- Cam thảo ← có trong list mục tiêu (ưu tiên cao hơn)
- Thiên niên kiện

→ Chọn: "Cam thảo" (ưu tiên cao nhất)
→ Update CACH_DUNG cho "Cam thảo"
```

## 📝 Response Data Structure

### Medicine Object từ API mới:
```json
{
  "XML1ID": "203121",
  "TIEPNHANID": "450285",
  "MAUBENHPHAMID": "6158970",
  "MA_LK": "450285",
  "STT": "8",
  "MA_THUOC": "05V.329",
  "TEN_THUOC": "Cam thảo",
  "DON_VI_TINH": "gam",
  "LIEU_DUNG": "4 gam * 7 thang * 1 ngày",
  "CACH_DUNG": "1 ngày, Sáng 4 gam",
  "SO_LUONG": "28",
  "DON_GIA": "388.5",
  "THANH_TIEN_BV": "10878",
  "CSYTID": "42346",
  "XML2ID": "989652",
  ...
}
```

### Key Fields Used:
- `MA_LK` - Mã liên kết (input search)
- `TEN_THUOC` - Tên thuốc (filter)
- `CACH_DUNG` - Cách dùng (update field)
- `XML2ID` - ID record (update key)
- `TIEPNHANID` - ID tiếp nhận
- `CSYTID` - ID cơ sở y tế

## ✅ Testing Checklist

- [x] API call với MA_LK hợp lệ
- [x] Parse JSON result correctly
- [x] Filter "Cam thảo" - ưu tiên 1
- [x] Filter "Độc hoạt" - ưu tiên 2  
- [x] Filter "Đại táo" - ưu tiên 3
- [x] Update API với correct params
- [x] Handle không tìm thấy MA_LK
- [x] Handle không có thuốc mục tiêu
- [x] Display results correctly
- [ ] Test với data thật

## 🚀 Deployment Notes

1. ✅ Code đã được update
2. ✅ API endpoints mới đã integrate
3. ✅ Error handling đã cập nhật
4. ✅ UI render đã adjust
5. ⚠️ Cần test với data thật từ hệ thống BV Phuyen

## 📞 Support

Nếu có lỗi:
1. Check console log (F12)
2. Verify MA_LK tồn tại trong BH_XML2_130
3. Verify thuốc mục tiêu trong danh sách
4. Check API response structure
5. Verify stored procedure `UPD.XML2.CACHDUNG` exists

---

**Version**: 1.1  
**Updated**: 2025-11-10  
**Status**: ✅ Ready for testing
