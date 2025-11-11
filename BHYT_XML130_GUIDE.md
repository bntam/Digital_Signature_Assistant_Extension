# Hướng dẫn sử dụng tính năng Cập nhật BHYT XML130

## Tổng quan

Tính năng này cho phép cập nhật tự động thông tin cách dùng thuốc cho các đơn thuốc Bảo hiểm Y tế XML130. Hệ thống sẽ tự động:

1. Tìm kiếm bệnh nhân theo Mã liên kết
2. Lấy danh sách thuốc của bệnh nhân
3. Lọc các loại thuốc cần cập nhật: **Cam thảo**, **Độc hoạt**, **Đại táo**
4. Cập nhật cách dùng tự động và lưu vào hệ thống

## Cách sử dụng

### 1. Truy cập trang cập nhật

Mở file `bhyt-xml130-update.html` trong extension hoặc truy cập trực tiếp từ hệ thống BV Phuyen.

### 2. Đăng nhập hệ thống

- Đảm bảo đã đăng nhập vào hệ thống BV Phuyen
- Kiểm tra trạng thái kết nối ở góc phải trên
- Nếu chưa đăng nhập, hệ thống sẽ hiển thị popup đăng nhập

### 3. Nhập danh sách Mã liên kết

Trong ô textarea lớn:
- Nhập từng Mã liên kết trên một dòng
- Ví dụ:
  ```
  MLC001
  MLC002
  MLC003
  ```
- Hệ thống sẽ tự động đếm số lượng mã đã nhập

### 4. Xử lý dữ liệu

1. Click nút **"▶️ Xử lý"**
2. Xác nhận thông tin xử lý
3. Hệ thống bắt đầu xử lý từng mã liên kết:
   - Thanh tiến trình hiển thị số lượng đã xử lý
   - Kết quả hiển thị ngay lập tức cho từng mã

### 5. Xem kết quả

Phần **"Kết quả xử lý"** hiển thị:
- ✅ Số lượng thành công
- ❌ Số lượng lỗi
- 💊 Tổng số thuốc đã cập nhật

Mỗi kết quả bao gồm:
- Mã liên kết
- Thông tin bệnh nhân
- Danh sách thuốc đã cập nhật
- Cách dùng mới cho mỗi thuốc
- Thông báo lỗi (nếu có)

## Cách dùng thuốc mặc định

Hệ thống tự động áp dụng các cách dùng sau:

| Tên thuốc | Cách dùng |
|-----------|-----------|
| Cam thảo  | Uống ngày 2 lần, sáng và tối, sau ăn |
| Độc hoạt  | Uống ngày 2 lần, sáng và tối, sau ăn |
| Đại táo   | Uống ngày 3 lần, sau ăn |

## Xử lý lỗi

### Các lỗi phổ biến:

1. **"Không tìm thấy bệnh nhân"**
   - Kiểm tra lại Mã liên kết
   - Đảm bảo bệnh nhân tồn tại trong hệ thống

2. **"Không có dữ liệu thuốc"**
   - Bệnh nhân chưa có đơn thuốc
   - Kiểm tra lại thông tin bệnh nhân

3. **"Không có thuốc cần cập nhật"**
   - Bệnh nhân không có các loại thuốc: Cam thảo, Độc hoạt, Đại táo
   - Đây là trường hợp bình thường, không phải lỗi

4. **"Authentication required"**
   - Phiên đăng nhập hết hạn
   - Đăng nhập lại vào hệ thống

## Tính năng bổ sung

### Nút Clear (🗑️ Xóa)
- Xóa toàn bộ dữ liệu trong ô nhập
- Reset số đếm mã liên kết

### Thông báo realtime
- Hiển thị thông báo cho mỗi bước xử lý
- Tự động ẩn sau 5 giây
- Click ×​ để đóng thủ công

### Cuộn tự động
- Kết quả mới nhất tự động cuộn vào view
- Dễ dàng theo dõi tiến trình

## API Endpoints sử dụng

1. **Tìm bệnh nhân**: `NTU02D021.EV001`
   - Input: Mã liên kết (MA_LK, MABENHAN, MABENHNHAN)
   - Output: Thông tin bệnh nhân

2. **Lấy danh sách thuốc**: `NTU01H051.01`
   - Input: HOSOBENHANID, TIEPNHANID
   - Output: Danh sách thuốc

3. **Cập nhật cách dùng**: `NTU.UPD.MEDICINE.USAGE`
   - Input: THUOCID, HOSOBENHANID, TIEPNHANID, CACHDUNG
   - Output: Kết quả cập nhật

## Lưu ý kỹ thuật

- Hệ thống xử lý tuần tự từng mã liên kết (không song song)
- Có delay 500ms giữa các request để tránh quá tải server
- Kết quả được hiển thị ngay sau khi xử lý xong mỗi mã
- Tất cả dữ liệu được sanitize để tránh XSS

## Hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra console log (F12)
2. Screenshot màn hình lỗi
3. Liên hệ bộ phận IT BV Phuyen

---

**Phiên bản**: 1.0  
**Cập nhật**: 2025-01-10  
**Developer**: BV Phuyen IT Department
