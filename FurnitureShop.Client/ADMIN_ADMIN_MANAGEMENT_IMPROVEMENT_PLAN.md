# Kế hoạch sửa và cải thiện chức năng quản lý Admin

Ngày lập: 2026-07-19

## 1. Mục tiêu

Hoàn thiện các màn hình quản lý admin còn đang dùng dữ liệu mock, giá trị hardcode hoặc UI chỉ để trình bày nhưng chưa có chức năng thật. Đồng thời chuẩn hóa cách gọi API để giảm lỗi khi triển khai production.

## 2. Phạm vi khảo sát

Các màn hình admin đã được rà soát:

- `src/pages/admin/AdminOverview.jsx`
- `src/pages/admin/AdminStatistics.jsx`
- `src/pages/admin/AdminBehavior.jsx`
- `src/pages/admin/AdminAuth.jsx`
- `src/pages/admin/AdminTickets.jsx`
- `src/pages/admin/AdminInventory.jsx`
- `src/pages/admin/AdminStockIn.jsx`
- `src/pages/admin/AdminDelivery.jsx`
- `src/pages/admin/AdminSuppliers.jsx`
- `src/pages/admin/AdminChat.jsx`
- `src/pages/admin/AdminOrders.jsx`
- `src/pages/admin/AdminUsers.jsx`
- `src/pages/admin/AdminPromotions.jsx`
- `src/pages/admin/AdminCategories.jsx`
- `src/pages/admin/AdminDashboard.jsx`
- `src/pages/admin/AdminSettings.jsx`
- `src/pages/admin/AdminUtilities.jsx`
- `src/pages/admin/AdminAuditLogs.jsx`
- `src/components/admin/AdminVariantsModal.jsx`

## 3. Tổng quan hiện trạng

| Nhóm | Trạng thái | Ghi chú |
|---|---|---|
| Sản phẩm / danh mục | Tương đối hoàn chỉnh | Có CRUD sản phẩm, danh mục, biến thể, upload ảnh |
| Đơn hàng | Tương đối hoàn chỉnh | Có xem chi tiết, đổi trạng thái, undo/redo, in hóa đơn, export CSV |
| Khách hàng / user | Tương đối hoàn chỉnh | Có CRUD, khóa/mở khóa, reset password |
| Coupon / khuyến mãi | Tương đối hoàn chỉnh | Có CRUD coupon |
| Kho / nhập hàng / nhà cung cấp | Một phần | Có API nhưng còn giá trị fallback, một số field chưa thật |
| CSKH / chat / ticket | Một phần | Chat có API; ticket còn KPI hardcode |
| Dashboard / thống kê / hành vi | Cần ưu tiên sửa | Nhiều trend, biểu đồ, fallback data đang hardcode |
| Bảo mật admin / profile | Cần sửa | 2FA demo, nút cấu hình không hoạt động, session fallback giả |
| Cấu hình / audit / tiện ích | Tương đối hoàn chỉnh | Có gọi API thật |

## 4. Các vấn đề mock/hardcode cần xử lý

### 4.1. `AdminOverview.jsx` — Ưu tiên cao

Vấn đề:

- Các chỉ số tăng/giảm đang hardcode:
  - `change={14.2}`
  - `change={8.5}`
  - `change={12.0}`
  - `change={4.1}`
- KPI target hardcode:
  - `completion={82.4}`
- Mục tiêu doanh thu đang tự bịa theo công thức:
  - `targetRevenue = totalRevenue * 1.25`
- Biểu đồ fallback dùng dữ liệu hardcode tháng 6/2026.
- Một số mô tả phụ như “84 khách hàng mới”, “Tỉ lệ chuyển đổi 3.2%” không lấy từ API.
- Recent order có cột danh mục hiển thị cứng “Khách hàng”.

Hướng sửa:

1. Bỏ toàn bộ fallback data giả trông như dữ liệu thật.
2. Nếu API không có dữ liệu thì hiển thị empty state rõ ràng: “Chưa có dữ liệu trong khoảng thời gian này”.
3. Thêm helper tính phần trăm thay đổi dựa trên dữ liệu kỳ hiện tại và kỳ trước nếu API có trả dữ liệu.
4. Nếu backend chưa trả kỳ trước, UI hiển thị `N/A` thay vì số hardcode.
5. Target doanh thu nên lấy từ setting/API riêng, hoặc tạm hiển thị “Chưa cấu hình mục tiêu”.
6. Recent order cần map đúng thông tin khách hàng/sản phẩm từ API, không dùng text cứng.

### 4.2. `AdminStatistics.jsx` — Ưu tiên cao

Vấn đề:

- `trend` và `sparkData` hardcode trong các metric card.
- Lợi nhuận gộp fallback bằng `s.totalRevenue * 0.42`.
- Biểu đồ doanh thu fallback dữ liệu tháng 6/2026.
- Donut trạng thái đơn hàng fallback hardcode.
- Top products fallback là danh sách sản phẩm giả.

Hướng sửa:

1. Không hiển thị dữ liệu giả khi API trả rỗng.
2. Tách hàm normalize dữ liệu thống kê để map an toàn từ API.
3. Chỉ render biểu đồ khi có dữ liệu thật.
4. Với trường chưa có từ backend như gross profit, cancel rate, return customer rate: hiển thị `N/A` hoặc “Chưa có dữ liệu”.
5. Nếu cần biểu đồ sparkline, backend nên trả chuỗi dữ liệu theo ngày/tuần; frontend không tự bịa.

### 4.3. `AdminBehavior.jsx` — Ưu tiên trung bình/cao

Vấn đề:

- Có gọi API thật qua `behaviorService`, nhưng có fallback hardcode:
  - top viewed products
  - click-to-sale
  - daily views
- Dữ liệu fallback cố định tháng 6/2026.

Hướng sửa:

1. Xóa fallback mảng sản phẩm/ngày hardcode.
2. Nếu API trả null/rỗng, set state thành mảng rỗng.
3. Thêm empty state cho từng bảng/biểu đồ.
4. Thêm trạng thái lỗi riêng nếu API lỗi thay vì âm thầm hiển thị dữ liệu giả.

### 4.4. `AdminAuth.jsx` — Ưu tiên cao

Vấn đề:

- Profile mặc định hardcode:
  - `Admin Executive`
  - `admin@furnitureshop.vn`
  - `0901234567`
- Sessions fallback hardcode:
  - “Trình duyệt hiện tại / 127.0.0.1”
- Toggle 2FA hiển thị demo code:
  - “Đã bật 2FA demo, mã xác thực: 123456”
- Nút “Cấu hình” cho Google Authenticator/SMS OTP chưa có `onClick`.
- Nút “Đăng xuất thiết bị lạ” chỉ filter state cục bộ, không gọi API.

Hướng sửa:

1. Bỏ profile fallback giả; nếu chưa có user thì hiển thị loading/error.
2. Sessions nếu API chưa trả thì hiển thị empty state.
3. Bỏ thông báo mã demo `123456`.
4. Làm flow 2FA rõ ràng:
   - Nếu backend đã có endpoint setup 2FA: gọi API lấy QR/secret, verify OTP, enable.
   - Nếu backend chưa có: disable nút và ghi “Chưa hỗ trợ từ backend”.
5. Nút “Cấu hình” phải mở modal cấu hình 2FA hoặc bị disable rõ ràng.
6. Nút “Đăng xuất thiết bị lạ” phải gọi API revoke all sessions except current; nếu chưa có endpoint thì không cho bấm giả.

### 4.5. `AdminTickets.jsx` — Ưu tiên trung bình

Vấn đề:

- KPI “Thời Gian Phản Hồi” đang hardcode `12 Phút`.

Hướng sửa:

1. Tính SLA trung bình từ dữ liệu ticket nếu API trả `createdAt`, `firstResponseAt`, `resolvedAt`.
2. Nếu thiếu field, hiển thị `N/A`.
3. Có thể thêm filter theo priority/status nếu backend hỗ trợ.

### 4.6. `AdminInventory.jsx` — Ưu tiên trung bình

Vấn đề:

- Field `reserved` luôn bằng `0`.
- Giá vốn fallback bằng công thức ước tính `basePrice * 0.6` khi thiếu `costPrice`.

Hướng sửa:

1. Nếu backend có `reservedQuantity`/`allocatedStock`, map đúng field.
2. Nếu chưa có, ẩn cột “Đang giữ” hoặc hiển thị `N/A`.
3. Giá vốn thiếu thì hiển thị `N/A`, không tự ước tính.
4. KPI giá trị kho chỉ tính trên item có cost thật.

### 4.7. `AdminStockIn.jsx` — Ưu tiên trung bình

Vấn đề:

- Khi lập phiếu nhập, giá vốn mặc định dùng `costPrice`, nếu không có thì fallback `basePrice * 0.6` hoặc `1000000`.

Hướng sửa:

1. Không tự sinh giá vốn ảo.
2. Khi chọn sản phẩm thiếu giá vốn, để trống giá và bắt admin nhập.
3. Validate giá nhập phải lớn hơn 0 trước khi submit.

### 4.8. `AdminDelivery.jsx` — Ưu tiên trung bình

Vấn đề:

- Danh sách tài xế `DRIVERS` hardcode trong frontend.

Hướng sửa:

1. Thêm service/API lấy danh sách tài xế nếu backend đã có.
2. Nếu backend chưa có endpoint tài xế, tạo một abstraction tạm `deliveryService` để sau này thay thế dễ hơn.
3. UI assignment lấy option từ API, có loading/empty state.
4. Không hardcode tài xế trong component.

### 4.9. `AdminSuppliers.jsx` — Cần kiểm tra kỹ

Vấn đề tiềm ẩn:

- POST/PUT đang dùng option `data: {...}` trong khi pattern `apiService.request` thường dùng `body: JSON.stringify(...)`.

Hướng sửa:

1. Kiểm tra `apiService.request` có xử lý `data` không.
2. Nếu không, đổi sang `body: JSON.stringify(payload)` và set `Content-Type: application/json`.
3. Cân nhắc tạo `supplierService.js` dùng `apiClient` cho đồng bộ.

### 4.10. `AdminVariantsModal.jsx` — Ưu tiên thấp/trung bình

Vấn đề:

- Component dùng `fetch` thô tới `/api/products/{id}/variants` và tự lấy token từ localStorage.
- Khác pattern chung của service layer.

Hướng sửa:

1. Chuyển sang `productService` hoặc tạo `variantService`.
2. Dùng `apiClient` để tự inject token và chuẩn hóa error handling.
3. Giữ nguyên chức năng hiện tại nhưng chuẩn hóa code.

## 5. Vấn đề kiến trúc API cần chuẩn hóa

Hiện có 2 cách gọi API song song:

1. `apiClient.js`
   - Base URL: `http://localhost:5028/api`
   - Tự inject token
   - Trả shape chuẩn `{ success, data, message, status }`

2. `apiService.js`
   - Base URL: `/api`
   - Một số method dùng fetch thô
   - `request()` có inject token

Rủi ro:

- Deploy production dễ lỗi do `apiClient` hardcode localhost.
- Component khó đoán response shape.
- Khó xử lý lỗi thống nhất.

Hướng sửa:

1. Đưa base API vào biến môi trường, ví dụ:
   - `VITE_API_BASE_URL`
2. Chuẩn hóa các màn admin ưu tiên dùng `apiClient` hoặc service riêng.
3. Tạo service thiếu cho các module admin:
   - `adminDashboardService.js` hoặc mở rộng `statisticsService.js`
   - `inventoryService.js`
   - `supplierService.js`
   - `deliveryService.js`
   - `ticketService.js`
   - `adminSecurityService.js`
   - `settingsService.js`
4. Component chỉ gọi service, không gọi endpoint trực tiếp rải rác.

## 6. Thứ tự ưu tiên triển khai

### Giai đoạn 1 — Dọn mock gây hiểu nhầm dữ liệu thật

Mục tiêu: Không để admin nhìn thấy số liệu giả.

File cần sửa:

1. `AdminOverview.jsx`
2. `AdminStatistics.jsx`
3. `AdminBehavior.jsx`
4. `AdminTickets.jsx`
5. `AdminInventory.jsx`
6. `AdminStockIn.jsx`

Việc làm:

- Xóa fallback data hardcode.
- Thêm empty state.
- Thêm `N/A` cho chỉ số chưa có dữ liệu.
- Không tự ước tính giá vốn/lợi nhuận nếu backend không trả.

### Giai đoạn 2 — Hoàn thiện chức năng admin đang là UI demo

File cần sửa:

1. `AdminAuth.jsx`
2. `AdminDelivery.jsx`

Việc làm:

- 2FA: bỏ demo code, làm modal/config flow hoặc disable rõ nếu backend chưa hỗ trợ.
- Session: không dùng session giả; revoke thiết bị lạ phải gọi API thật.
- Delivery: danh sách tài xế lấy từ API/service, không hardcode.

### Giai đoạn 3 — Chuẩn hóa service layer

File cần sửa/tạo:

- `src/utils/apiClient.js`
- `src/services/apiService.js`
- `src/services/statisticsService.js`
- `src/services/productService.js`
- Tạo thêm service nếu cần:
  - `src/services/inventoryService.js`
  - `src/services/supplierService.js`
  - `src/services/deliveryService.js`
  - `src/services/ticketService.js`
  - `src/services/adminSecurityService.js`
  - `src/services/settingsService.js`
  - `src/services/variantService.js`

Việc làm:

- Dùng env cho base URL.
- Dời endpoint trực tiếp ra service.
- Chuẩn hóa error/loading state.

### Giai đoạn 4 — Kiểm thử và hoàn thiện UX

Việc làm:

- Chạy build/lint nếu project có script.
- Test thủ công các route admin chính:
  - `/admin/overview`
  - `/admin/statistics`
  - `/admin/behavior`
  - `/admin/auth`
  - `/admin/inventory`
  - `/admin/stockin`
  - `/admin/delivery`
  - `/admin/tickets`
- Kiểm tra các trạng thái:
  - API có dữ liệu
  - API trả rỗng
  - API lỗi
  - Không có quyền/token hết hạn

## 7. Đề xuất tiêu chí hoàn thành

Một chức năng admin được xem là hoàn chỉnh khi:

1. Không dùng dữ liệu giả để giả lập dữ liệu thật.
2. Nút bấm có một trong các trạng thái rõ ràng:
   - Có action thật
   - Disable kèm lý do
   - Ẩn nếu backend chưa hỗ trợ
3. API lỗi phải có thông báo rõ.
4. API trả rỗng phải có empty state.
5. Không hardcode số liệu kinh doanh như doanh thu, lợi nhuận, tăng trưởng, SLA.
6. Không hardcode dữ liệu vận hành như tài xế, session, tồn kho giữ chỗ.
7. Component ưu tiên gọi service, không gọi endpoint trực tiếp rải rác.

## 8. Kế hoạch implement chi tiết nếu bắt đầu sửa code

Nếu được duyệt triển khai, thứ tự sửa đề xuất:

1. Sửa `AdminStatistics.jsx`
   - Xóa fallback chart/top product/status hardcode.
   - Thêm empty states.
   - Thay trend/sparkData hardcode bằng `N/A` hoặc dữ liệu API.

2. Sửa `AdminOverview.jsx`
   - Xóa change hardcode, target hardcode, monthly fallback.
   - Chuẩn hóa metric card khi thiếu dữ liệu.

3. Sửa `AdminBehavior.jsx`
   - Xóa fallback arrays.
   - Thêm empty/error states.

4. Sửa `AdminAuth.jsx`
   - Bỏ demo 2FA code `123456`.
   - Disable/config modal cho nút chưa hỗ trợ.
   - Không fake session/profile.

5. Sửa `AdminInventory.jsx` và `AdminStockIn.jsx`
   - Không tự gán reserved/cost ảo.
   - Validate nhập giá vốn.

6. Sửa `AdminDelivery.jsx`
   - Tách `deliveryService`.
   - Lấy tài xế từ API nếu có, hoặc empty state nếu chưa có.

7. Chuẩn hóa service/API base URL
   - Dùng `VITE_API_BASE_URL`.
   - Giảm fetch trực tiếp trong component.

## 9. Ghi chú cần xác nhận trước khi code

Cần xác nhận backend hiện đã có các endpoint sau chưa:

- API lấy target doanh thu/KPI dashboard.
- API lấy dữ liệu kỳ trước để tính tăng trưởng.
- API lấy gross profit/cost thật.
- API lấy reserved stock hoặc allocated stock.
- API lấy danh sách tài xế.
- API quản lý 2FA setup/verify.
- API revoke all sessions except current.
- API tính average first response time cho ticket.

Nếu backend chưa có, frontend nên hiển thị `N/A`, disable chức năng hoặc empty state thay vì tiếp tục dùng mock.
