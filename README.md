# FurnitureShop - Cửa Hàng Trực Tuyến Bán Đồ Gia Dụng & Nội Thất

Dự án **FurnitureShop** là một ứng dụng thương mại điện tử chuyên nghiệp cung cấp các sản phẩm đồ gia dụng và nội thất cao cấp. Hệ thống được phát triển theo kiến trúc Client-Server hiện đại, tập trung vào việc áp dụng các **Mẫu thiết kế phần mềm (Design Patterns)** để giải quyết các bài toán nghiệp vụ phức tạp.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend (`FurnitureShop.API`)
- **Framework:** ASP.NET Core 9.0 (C#)
- **Database ORM:** Entity Framework Core 9.0 (SQL Server)
- **Tài liệu API:** Swagger UI / OpenApi
- **Bảo mật:** BCrypt.Net-Next (Mã hóa mật khẩu)

### Frontend (`FurnitureShop.Client`)
- **Framework:** React 19.2 (JavaScript / JSX)
- **Build Tool & Dev Server:** Vite (Rolldown compiler)
- **Routing:** React Router 7.13
- **Linter:** ESLint 9

---

## 📐 Kiến Trúc & Design Patterns Áp Dụng

Mục tiêu cốt lõi của dự án là hiện thực hóa các mẫu thiết kế phần mềm kinh điển của nhóm Gang of Four (GoF) vào các chức năng thương mại điện tử thực tế:

| STT | Design Pattern | Module/Chức năng áp dụng | Mô tả chi tiết |
|:---:|---|---|---|
| **1** | **Singleton** | `LoggerService` | Đảm bảo chỉ có một instance duy nhất ghi log hệ thống toàn cục. |
| **2** | **Factory Method** | `PaymentMethodCreator` | Khởi tạo linh hoạt các cổng thanh toán (COD, PayPal, VNPay, v.v.). |
| **3** | **Strategy** | `ShippingCalculator` | Thay đổi chiến lược tính phí vận chuyển theo khoảng cách địa lý (Local, Regional, National). |
| **4** | **Observer** | `OrderNotifier` | Gửi email/SMS và cập nhật kho hàng (Inventory) tự động khi có sự thay đổi trạng thái đơn hàng. |
| **5** | **Repository** | `GenericRepository` & `UnitOfWork` | Tách biệt hoàn toàn tầng truy xuất dữ liệu (Entity Framework) ra khỏi logic nghiệp vụ. |
| **6** | **Decorator** | `DecoratedProductBuilder` | Tính toán giá sản phẩm cộng dồn (thêm thuộc tính, thuế VAT, mã giảm giá) mà không sửa đổi đối tượng gốc. |
| **7** | **Command** | `OrderCommandInvoker` | Đóng gói các tác vụ đơn hàng (Xác nhận, Giao hàng, Huỷ đơn) thành đối tượng Command, hỗ trợ lịch sử thay đổi và tính năng **Undo / Redo**. |
| **8** | **Facade** | `CheckoutFacade` | Gom toàn bộ quy trình đặt hàng phức tạp (tính phí ship, áp dụng giảm giá, lưu đơn, gửi thông báo) vào một giao diện đơn giản duy nhất. |
| **9** | **State** | `OrderState` Workflow | Quản lý vòng đời trạng thái đơn hàng (Chờ xử lý, Đang giao, Đã giao, Đã hủy) một cách an toàn và nhất quán. |

---

## 📂 Cấu Trúc Dự Án

```text
FurnitureShop-main/
├── FurnitureShop.API/         # Mã nguồn Backend (ASP.NET Core Web API)
│   ├── Controllers/           # Các RESTful API Endpoints (Auth, Products, Orders, Payments...)
│   ├── Models/                # Định nghĩa các thực thể CSDL (User, Order, Product, Category...)
│   ├── Data/                  # DbContext cấu hình quan hệ bảng & hạt giống dữ liệu (Seed)
│   ├── DTOs/                  # Đối tượng truyền tải dữ liệu giữa Client và Server
│   ├── Services/              # Các dịch vụ xử lý nghiệp vụ chính
│   ├── Patterns/              # Nơi triển khai các Design Patterns (Singleton, Factory, Command...)
│   └── Program.cs             # Điểm cấu hình và khởi chạy ứng dụng API
│
├── FurnitureShop.Client/      # Mã nguồn Frontend (React + Vite SPA)
│   ├── src/
│   │   ├── components/        # Các UI Components dùng chung (Header, Footer, ProductCard...)
│   │   ├── pages/             # Các màn hình chính (Trang chủ, Giỏ hàng, Checkout, Admin...)
│   │   ├── services/          # Các hàm gọi API tập trung
│   │   └── context/           # Quản lý State toàn cục (Giỏ hàng, Thông tin người dùng)
│   └── index.html             # Tệp HTML chính của ứng dụng SPA
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (Khuyên dùng v18+)
- [SQL Server](https://www.microsoft.com/sql-server/) (LocalDB hoặc Express)

### Bước 1: Khởi Chạy Backend (API)
1. Cấu hình chuỗi kết nối Database tại tệp `FurnitureShop.API/appsettings.json` (phần `"DefaultConnection"`).
2. Di chuyển vào thư mục API và chạy các lệnh sau để tự động tạo Database, áp dụng Migrations và Seed dữ liệu mẫu:
   ```bash
   cd FurnitureShop.API
   dotnet run
   ```
3. Sau khi chạy, API sẽ chạy tại cổng mặc định. Tài liệu Swagger UI có thể truy cập tại:
   - `http://localhost:5028/api/docs` hoặc `https://localhost:7206/api/docs`

### Bước 2: Khởi Chạy Frontend (React)
1. Di chuyển vào thư mục Client:
   ```bash
   cd FurnitureShop.Client
   ```
2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ phát triển (Dev server):
   ```bash
   npm run dev
   ```
4. Truy cập giao diện người dùng tại cổng hiển thị trên terminal (thường là `http://localhost:5173`).

---

## 🔑 Tài Khoản Admin Mặc Định (Seed Data)
Để truy cập vào trang quản trị (Admin Dashboard) kiểm tra các luồng trạng thái của đơn hàng và quản trị viên:
- **Tên đăng nhập (Username):** `admin`
- **Email:** `admin@furnitures.com`
- **Mật khẩu:** `Admin@123`
