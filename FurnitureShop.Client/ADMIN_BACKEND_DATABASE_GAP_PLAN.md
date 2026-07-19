# Kế hoạch hoàn thiện Backend & Database cho khu vực Quản trị (Admin)

> Ngày lập: 2026-07-19
> Phạm vi: đối chiếu Front-end admin (đã cải thiện) với Backend `FurnitureShop.API` và Database (`AppDbContext`).
> Kết luận nhanh: **Front-end đã sạch mock** (dùng empty state / `N/A` / disable đúng cách). Vấn đề còn lại nằm ở **backend chạy dữ liệu giả lập** và **database thiếu bảng/cột**.

---

## 0. Tình trạng Front-end sau khi sửa (đã kiểm tra lại)

Đã xác nhận các trang sau **không còn hardcode/mock data**, xử lý null an toàn:

| Trang | Trạng thái FE | Ghi chú |
|-------|---------------|---------|
| AdminOverview | ✅ Sạch | `targetRevenue = null` → hiện "CHƯA CẤU HÌNH MỤC TIÊU"; trend tính thật từ `revenueByDate`; cột Khách hàng lấy `o.customerName` |
| AdminStatistics | ✅ Sạch | trend tính thật; grossProfit `N/A` nếu API không trả; mọi chart có empty state |
| AdminBehavior | ✅ Sạch | fallback về `[]`, hiện "KHÔNG CÓ DỮ LIỆU"; có báo lỗi |
| AdminAuth | ✅ Sạch | 2FA/sessions gọi API thật; disable khi `!securitySupported`; bỏ mã demo 123456 |
| AdminTickets | ✅ Sạch | SLA `avgResponse` tính thật từ replies/firstResponseAt, `N/A` nếu thiếu |
| AdminInventory | ✅ Sạch | `reserved` = `N/A` nếu API không trả; `cost` = `N/A` nếu thiếu |
| AdminDelivery | ✅ Sạch | Bỏ mảng DRIVERS hardcode; nhập tay tài xế/xe/mã vận đơn |
| AdminStockIn | ✅ Sạch | Giá vốn lấy từ `costPrice`, không tự bịa hệ số |
| AdminSuppliers | ⚠️ Lỗi encoding | Code chạy được nhưng toàn bộ chuỗi tiếng Việt bị lỗi mojibake (xem mục 4) |

→ **Không cần sửa logic FE nữa**, trừ lỗi encoding ở AdminSuppliers.

---

## 1. Vấn đề cốt lõi: Backend chạy dữ liệu giả lập trong `SystemSettings`

Các tính năng admin sau **không có bảng thật**, đang lưu JSON tạm trong bảng `SystemSettings` và một phần là dữ liệu demo tạo runtime:

- Support Tickets (key `Admin.SupportTickets`)
- Chat Conversations (key `Admin.ChatConversations`)
- Delivery Assignments (key `Admin.DeliveryAssignments`)
- 2FA flag (key `Admin.2FA.{userId}`)
- Sessions (mảng hardcode trong `GetSecurity`)

Hệ quả: dữ liệu không quan hệ, không bền vững, không truy vấn/thống kê được đúng nghĩa, dễ mất khi ghi đè key.

---

## 2. Database — Bảng/Cột còn thiếu

### 2.1. Cột thiếu trên entity có sẵn (ưu tiên CAO — dễ làm, tác động lớn)

| Entity | Cột cần thêm | Kiểu | Lý do (FE đang cần) |
|--------|--------------|------|---------------------|
| `Product` | `CostPrice` | `decimal?` | AdminInventory (giá vốn, tổng giá trị vốn COGS), AdminStockIn, grossProfit thống kê |
| `Product` | `ReservedQuantity` | `int` (default 0) | AdminInventory cột "Đang giữ"; cơ chế giữ hàng khi có đơn |
| `User` | `TwoFactorEnabled` | `bool` (default false) | AdminAuth 2FA thật thay vì key SystemSettings |
| `Order` | `ReturnedAt` | `datetime?` | Enum đã có `Returned` nhưng thiếu mốc thời gian |
| `Order` | `RefundedAt` | `datetime?` | Enum đã có `Refunded` nhưng thiếu mốc thời gian |

Mỗi thay đổi cần: cập nhật entity → tạo EF Core Migration → cập nhật DTO/mapping trả về cho FE.

### 2.2. Bảng mới cần tạo (ưu tiên TRUNG BÌNH — thay dữ liệu giả lập)

| Bảng mới | Cột chính | Thay cho |
|----------|-----------|----------|
| `SupportTickets` | Id, Subject, Customer, Email, Category, Priority, Status, CreatedAt, UpdatedAt, **FirstResponseAt** | JSON `Admin.SupportTickets` |
| `SupportReplies` | Id, TicketId(FK), Message, IsAdmin, CreatedAt | list lồng trong ticket JSON |
| `ChatConversations` | Id, Customer, Email, Status, Unread, CreatedAt, UpdatedAt | JSON `Admin.ChatConversations` |
| `ChatMessages` | Id, ConversationId(FK), Sender, Message, CreatedAt | list lồng trong conversation JSON |
| `DeliveryAssignments` | Id, OrderId(FK), DriverName, Vehicle, TrackingCode, Status, AssignedAt | JSON `Admin.DeliveryAssignments` |
| `UserSessions` | Id, UserId(FK), Device, IpAddress, Location, LoginAt, IsCurrent | mảng hardcode trong GetSecurity |

### 2.3. Cấu hình mục tiêu doanh thu (ưu tiên THẤP)

- `targetRevenue` cho KPI tháng: có thể lưu vào `SystemSettings` (key `Kpi.MonthlyTargetRevenue`) — không cần bảng mới. FE đã sẵn sàng nhận `data.targetRevenue`.

---

## 3. Backend API — Cần bổ sung / sửa

### 3.1. Sửa lỗi khớp method (ưu tiên CAO — bug thật)

- `AdminUtilities` gọi `notificationService.sendTestEmail/sendTestSms`. Backend chỉ có **POST** `test-email`/`test-sms`.
  → Kiểm tra `notificationService.js`: nếu đang gọi GET thì sửa thành POST. (Cần đọc lại file service để xác nhận — báo cáo backend cảnh báo GET sẽ 404/405.)

### 3.2. StatisticsService — bổ sung dữ liệu thật cho dashboard

`GET /api/statistics/dashboard` cần trả thêm (FE đã sẵn sàng đọc, hiện `N/A`/empty nếu thiếu):
- `summary.grossProfit` — tính từ `SUM((unitPrice - product.CostPrice) * quantity)` sau khi có `CostPrice`
- `monthlySales` — `[{ month, revenue, orderCount }]` tính runtime từ Orders
- `recentOrders` — `[{ orderNumber, customerName, totalAmount, status, createdAt }]` 5 đơn mới nhất
- `targetRevenue` — đọc từ SystemSettings key `Kpi.MonthlyTargetRevenue`
- `orderStatusDistribution` — `[{ status, count }]`

### 3.3. AdminOperations — chuyển từ JSON sang bảng thật

Sau khi tạo bảng ở mục 2.2, viết lại các action trong `AdminOperationsController` để đọc/ghi qua `AppDbContext` thay vì serialize JSON vào `SystemSettings`:
- Tickets: GetTickets/ReplyTicket/UpdateTicketStatus + set `FirstResponseAt` ở reply đầu tiên
- Chat: GetChatConversations/SendChatMessage
- Delivery: GetDeliveryOrders/AssignDelivery/UpdateDeliveryStatus (join Orders)
- Security: GetSecurity (đọc `User.TwoFactorEnabled` + `UserSessions`), SetTwoFactor (update cột), RevokeSession (xóa row thật)

### 3.4. Inventory — Reserved & Cost

- `GetPurchaseOrders`/products: trả `CostPrice`, `ReservedQuantity`.
- Cân nhắc: khi tạo đơn hàng → tăng `ReservedQuantity`; khi hoàn tất/hủy → giảm. (Phạm vi rộng, tách giai đoạn riêng.)

---

## 4. Sửa lỗi encoding AdminSuppliers.jsx (ưu tiên CAO — nhanh)

File `src/pages/admin/AdminSuppliers.jsx` bị lỗi mojibake toàn bộ chuỗi tiếng Việt (VD: `Lá»—i khi táº£i`, `NhÃ  cung cáº¥p`). File được lưu sai encoding. Cần gõ lại toàn bộ literal tiếng Việt bằng UTF-8 chuẩn. Logic không đổi.

---

## 5. Thứ tự triển khai đề xuất

**Giai đoạn 1 — Quick wins (ít rủi ro, tác động ngay):**
1. Sửa encoding `AdminSuppliers.jsx`
2. Sửa method GET→POST trong `notificationService.js` (nếu sai)
3. Thêm cột `Product.CostPrice`, `Product.ReservedQuantity` + migration + trả trong DTO
4. `targetRevenue` qua SystemSettings + trả trong dashboard

**Giai đoạn 2 — Statistics thật:**
5. StatisticsService bổ sung grossProfit, monthlySales, recentOrders, orderStatusDistribution

**Giai đoạn 3 — Bảng thật cho AdminOperations:**
6. Tạo bảng Tickets/Replies, Chat/Messages, DeliveryAssignments, UserSessions + `User.TwoFactorEnabled`
7. Viết lại AdminOperationsController dùng DbContext
8. Thêm `Order.ReturnedAt`, `Order.RefundedAt`

**Giai đoạn 4 — Nghiệp vụ nâng cao:**
9. Cơ chế Reserved stock tự động theo vòng đời đơn hàng

---

## 6. Câu hỏi cần xác nhận trước khi code

1. Ưu tiên làm phần nào trước: **sửa nhanh FE (encoding) + thêm cột DB đơn giản**, hay **làm trọn bộ bảng thật cho tickets/chat/delivery**?
2. Có được phép **tạo & chạy EF Core migration** trên database hiện tại không? (cần biết chuỗi kết nối / môi trường DB đang dùng — SQL Server?)
3. `CostPrice` sẽ nhập thủ công qua trang quản lý sản phẩm, hay lấy trung bình từ giá nhập (`PurchaseOrderDetail.UnitPrice`)?
4. Cơ chế Reserved stock (giữ hàng) có nằm trong phạm vi lần này không, hay để sau?
