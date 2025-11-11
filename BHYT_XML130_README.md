# 💊 Cập nhật Bảo hiểm XML130 - BV Phuyen

## 🎯 Giới thiệu

Tính năng tự động cập nhật thông tin cách dùng thuốc cho đơn thuốc Bảo hiểm Y tế XML130. Hệ thống cho phép xử lý hàng loạt nhiều mã liên kết, tự động tìm bệnh nhân, lọc thuốc và cập nhật cách dùng.

## 🚀 Quick Start

### Cách 1: Từ Extension
1. Click icon extension trên Chrome
2. Chọn "💊 Cập nhật BHYT XML130"
3. Nhập danh sách mã liên kết
4. Click "Xử lý"

### Cách 2: Demo Mode
1. Mở `bhyt-xml130-demo.html` trong browser
2. Click "Load mẫu" để load dữ liệu test
3. Click "Xử lý" để xem flow hoạt động

## 📋 Flow hoạt động

```
1. Nhập mã liên kết (textarea)
   ↓
2. Click "Xử lý"
   ↓
3. Với mỗi mã:
   - Tìm bệnh nhân (API: NTU02D021.EV001)
   - Lấy danh sách thuốc (API: NTU01H051.01)
   - Filter: Cam thảo, Độc hoạt, Đại táo
   - Update cách dùng tự động
   - Save (API: NTU.UPD.MEDICINE.USAGE)
   ↓
4. Hiển thị kết quả chi tiết
```

## 💊 Cách dùng thuốc

| Thuốc | Cách dùng |
|-------|-----------|
| Cam thảo | Uống ngày 2 lần, sáng và tối, sau ăn |
| Độc hoạt | Uống ngày 2 lần, sáng và tối, sau ăn |
| Đại táo | Uống ngày 3 lần, sau ăn |

## 📁 Files chính

| File | Mô tả |
|------|-------|
| `bhyt-xml130-update.html` | Trang chính, production |
| `bhyt-xml130-demo.html` | Demo page, test UI |
| `css/xml130-update.css` | Styling |
| `js/xml130-updater.js` | Main logic |

## 📖 Documentation

- **[BHYT_XML130_GUIDE.md](BHYT_XML130_GUIDE.md)** - Hướng dẫn sử dụng chi tiết
- **[XML130_SUMMARY.md](XML130_SUMMARY.md)** - Tài liệu kỹ thuật
- **[BHYT_XML130_COMPLETE.md](BHYT_XML130_COMPLETE.md)** - Tổng quan hoàn chỉnh
- **[UI_MOCKUP.md](UI_MOCKUP.md)** - Thiết kế UI
- **[PROJECT_COMPLETION_REPORT.md](PROJECT_COMPLETION_REPORT.md)** - Báo cáo hoàn thành

## ✨ Features

- ✅ Batch processing nhiều mã
- ✅ Progress tracking realtime
- ✅ Statistics dashboard
- ✅ Error handling
- ✅ Auto-scroll results
- ✅ Toast notifications
- ✅ Responsive design
- ✅ XSS protection
- ✅ Demo mode

## 🎨 Screenshots

### Main Interface
![Main Interface](UI_MOCKUP.md)

### Processing
- Progress bar hiển thị % hoàn thành
- Status text: mã đang xử lý
- Statistics: thành công/lỗi/thuốc

### Results
- Danh sách kết quả chi tiết
- Color-coded: xanh (thành công), đỏ (lỗi)
- Thông tin bệnh nhân
- List thuốc đã cập nhật với cách dùng mới

## ⚙️ Cấu hình

### Thay đổi thuốc filter
Trong `js/xml130-updater.js`:
```javascript
this.targetMedicines = ['Cam thảo', 'Độc hoạt', 'Đại táo'];
```

### Thay đổi cách dùng
```javascript
this.medicineUsageMap = {
    'Cam thảo': 'Cách dùng mới...',
    'Độc hoạt': 'Cách dùng mới...',
    'Đại táo': 'Cách dùng mới...'
};
```

## 🔧 API Endpoints

| API | Purpose |
|-----|---------|
| `NTU02D021.EV001` | Search patient by connection code |
| `NTU01H051.01` | Get patient medicines list |
| `NTU.UPD.MEDICINE.USAGE` | Update medicine usage instructions |

## 🐛 Troubleshooting

### "Không tìm thấy bệnh nhân"
- Kiểm tra mã liên kết chính xác
- Đảm bảo bệnh nhân tồn tại trong hệ thống

### "Không có dữ liệu thuốc"
- Bệnh nhân chưa có đơn thuốc
- Kiểm tra HOSOBENHANID, TIEPNHANID

### "Authentication required"
- Phiên đăng nhập hết hạn
- Đăng nhập lại vào hệ thống BV Phuyen

## 📊 Statistics

- **Tổng code**: 1500+ lines
- **HTML**: 2 files (300+ lines)
- **CSS**: 600+ lines
- **JavaScript**: 500+ lines
- **Documentation**: 5 files (1000+ lines)

## 🎯 Browser Support

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## 📝 Changelog

### Version 1.0 (2025-01-10)
- ✅ Initial release
- ✅ Core functionality complete
- ✅ Documentation complete
- ✅ Demo mode added
- ✅ UI/UX polished

## 👥 Credits

- **Developer**: BV Phuyen IT Team
- **Design**: Modern Material Design
- **API Integration**: BV Phuyen Hospital System

## 📞 Support

Nếu cần hỗ trợ:
1. Đọc [BHYT_XML130_GUIDE.md](BHYT_XML130_GUIDE.md)
2. Test với `bhyt-xml130-demo.html`
3. Check console logs (F12)
4. Liên hệ IT Department

## 📜 License

Internal use only - BV Phuyen Hospital System

---

**Version**: 1.0  
**Status**: ✅ Production Ready  
**Last Update**: 2025-01-10
