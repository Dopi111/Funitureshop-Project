# 🛋️ FurnitureShop - Hệ Thống E-Commerce Nội Thất Hiện Đại

Dự án website thương mại điện tử chuyên cung cấp nội thất, xây dựng theo kiến trúc hiện đại với **ASP.NET Core 9 Web API** (Backend) và **React 19 + Vite** (Frontend), áp dụng đầy đủ các **Design Patterns**, cơ chế bảo mật và giao tiếp thời gian thực (**Realtime SignalR**).

---

## 🚀 Công Nghệ Sử Dụng

### 🖥️ Backend
- **Framework:** ASP.NET Core 9.0 Web API
- **ORM & Database:** Entity Framework Core 9.0, Microsoft SQL Server
- **Realtime:** SignalR Hub (`/hubs/chat`, `/hubs/order`)
- **Authentication:** JWT Bearer Token, BCrypt Password Hashing, Role-Based Access Control (RBAC)
- **Background Tasks:** `System.Threading.Channels` + `BackgroundService` (Product View Tracking & Cleanup)
- **Vận chuyển:** Tích hợp API Giao Hàng Nhanh (GHN) tính cước tự động
- **Architecture & Design Patterns:**
  - **Repository & Unit of Work:** Trừu tượng hóa tầng dữ liệu
  - **Factory Pattern:** Tạo sản phẩm và phương thức thanh toán linh hoạt
  - **Command Pattern:** Quản lý quy trình xử lý đơn hàng (Execute / Undo / Redo)
  - **Strategy Pattern:** Tính toán chiết khấu và chi phí vận chuyển theo điều kiện
  - **Facade Pattern:** Đơn giản hóa quy trình thanh toán phức tạp (`CheckoutFacade`)
  - **Proxy Pattern:** Caching layer đứng trước Product Service (`ProductServiceProxy`)
  - **Observer Pattern:** Thông báo trạng thái đơn hàng và sự kiện tồn kho

### 💻 Frontend
- **Framework & Build Tool:** React 19, Vite, React Router v7
- **UI & Styling:** TailwindCSS v4, Ant Design (AntD), Lucide React
- **Biểu đồ & Thống kê:** ApexCharts, Recharts
- **HTTP Client:** Axios (cấu hình interceptor tự động đính kèm JWT)
- **Thông báo:** React Hot Toast

---

## 🌟 Tính Năng Nổi Bật

### 🛒 Dành cho Khách Hàng
- 🔍 **Tìm kiếm & Bộ lọc nâng cao:** Lọc theo danh mục đa cấp, khoảng giá, chất liệu, màu sắc.
- 🛍️ **Giỏ hàng & Đặt hàng:** Quản lý giỏ hàng realtime, áp dụng mã khuyến mãi (Coupon).
- 🚚 **Tính phí vận chuyển tự động:** Tích hợp trực tiếp với API GHN theo địa chỉ nhận hàng (Tỉnh/Quận/Phường).
- 💬 **Live Chat hỗ trợ:** Trao đổi trực tiếp với nhân viên chăm sóc khách hàng qua SignalR.
- 📦 **Theo dõi đơn hàng:** Tra cứu trạng thái đơn hàng theo thời gian thực.

### 📊 Dành cho Quản Trị Viên (Admin Portal)
- 📈 **Dashboard phân tích:** Thống kê doanh thu, số lượng đơn hàng, sản phẩm bán chạy theo biểu đồ trực quan.
- 🏷️ **Quản lý sản phẩm & Biến thể:** Quản lý thuộc tính, màu sắc, kích thước, hình ảnh và tồn kho theo từng biến thể.
- 📑 **Quản lý nhập hàng (Purchase Orders):** Theo dõi nhà cung cấp và lịch sử nhập hàng.
- ⚙️ **Quản lý đơn hàng:** Xử lý chuyển trạng thái đơn hàng (Duyệt, Đóng gói, Xuất kho, Giao hàng, Hoàn trả).
- 🛡️ **Bảo mật & Nhật ký (Audit Logs):** Ghi lại mọi thao tác quan trọng trong hệ thống.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (phiên bản 18+ hoặc 20+)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) hoặc SQL Server LocalDB

---

### Bước 1: Khởi tạo Database & Chạy Backend (API)

1. Mở terminal và chuyển đến thư mục Backend:
   ```bash
   cd FurnitureShop.API
   ```

2. Kiểm tra chuỗi kết nối trong `appsettings.json` (mặc định sử dụng SQL Server LocalDB):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Data Source=(localdb)\\mssqllocaldb;Initial Catalog=FunitureShop;Integrated Security=True;..."
   }
   ```

3. Cập nhật database với EF Core Migrations (tự động tạo bảng & seed dữ liệu mẫu):
   ```bash
   dotnet ef database update
   ```

4. Chạy Backend API:
   ```bash
   dotnet run
   ```
   > 🌐 **Swagger UI / API Endpoint:** `https://localhost:7198` hoặc `http://localhost:5246`

---

### Bước 2: Chạy Frontend (Client)

1. Mở terminal mới và chuyển đến thư mục Frontend:
   ```bash
   cd FurnitureShop.Client
   ```

2. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```

3. Khởi chạy môi trường phát triển:
   ```bash
   npm run dev
   ```
   > 🌐 **Giao diện Client:** `http://localhost:5173`

---

## 🔑 Tài Khoản Mặc Định (Seed Data)

Sau khi chạy `dotnet ef database update`, hệ thống có sẵn tài khoản quản trị:

| Quyền | Tên đăng nhập | Mật khẩu |
| :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` |

---

## 📁 Cấu Trúc Dự Án

```
├── FurnitureShop.API/                  # Backend ASP.NET Core 9 Web API
│   ├── Controllers/                   # RESTful API Controllers
│   ├── Data/                          # DbContext và cấu hình thực thể
│   ├── DTOs/                          # Data Transfer Objects
│   ├── Hubs/                          # SignalR Hubs (Realtime Chat & Tracking)
│   ├── Migrations/                    # EF Core Database Migrations
│   ├── Models/                        # Domain Entities & ViewModels
│   ├── Patterns/                      # Triển khai các Design Patterns (Factory, Command, Facade,...)
│   ├── Services/                      # Business Logic Services
│   ├── Program.cs                     # Cấu hình DI, Middleware, Services
│   └── appsettings.json               # Cấu hình ứng dụng
│
├── FurnitureShop.Client/               # Frontend React 19 + Vite
│   ├── src/
│   │   ├── assets/                    # Static Assets (Images, Icons)
│   │   ├── components/                # Reusable UI Components
│   │   ├── contexts/                  # React Contexts (Auth, Cart, Chat)
│   │   ├── layouts/                   # Main & Admin Layouts
│   │   ├── pages/                     # Application Pages (Home, Shop, Admin...)
│   │   ├── services/                  # API Clients & Axios Interceptors
│   │   └── App.jsx                    # Root App Component & Routing
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md                          # Tài liệu dự án
```

---

## 📄 Giấy Phép
Dự án được xây dựng phục vụ mục đích học tập và nghiên cứu.
