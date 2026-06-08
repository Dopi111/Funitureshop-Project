# Bảng endpoint liên quan Design Pattern (FurnitureShop.API)

> Swagger UI: `http://localhost:5028/api/docs` (hoặc `https://localhost:7206/api/docs`).
>
> Quy ước route theo controller:
> - `[Route("api/[controller]")]` → Payments/Orders/Products/Auth
> - `[Route("api/shipping")]` → Shipping
> - `[Route("api/order-commands")]` → OrderCommands

## Payment / Factory (+ Singleton Logger)

| Endpoint (method + path) | Pattern chính | Request body mẫu | Response (field chính) | Controller |
|---|---|---|---|---|
| GET `/api/Payments/methods` | Factory (liệt kê payment methods), Singleton (logger) | — | `{ success, data: PaymentMethodInfo[] }` | [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs) |
| POST `/api/Payments/process` | Factory Method + Template Method (ExecutePaymentAsync), Singleton | `{ paymentMethod, orderId, amount, fullName?, email?, phoneNumber?, shippingAddress? }` | `{ success, data: PaymentResult }` (data có `transactionId`, `message`, `status`, `amount`, `transactionFee`, `paymentMethod`, `paymentUrl?`, `timestamp`) | [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs) |
| GET `/api/Payments/status/{transactionId}?paymentMethod=CASH` | Factory (tạo đúng method để check status), Singleton | — | `{ success, data: { transactionId, status, paymentMethod } }` | [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs) |
| POST `/api/Payments/refund` | Factory, Singleton | `{ transactionId, paymentMethod, amount }` | `{ success, data: RefundResult }` | [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs) |
| POST `/api/Payments/create-payment-url` | Factory, Singleton | `{ paymentMethod, orderId, amount, returnUrl }` | `{ success, data: { requiresRedirect, paymentUrl?/message? } }` | [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs) |
| GET `/api/Payments/vnpay-return?...` | (Payment callback), Singleton | — | HTTP 302 redirect `/payment-success?...` hoặc `/payment-failed?...` | [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs) |

## Order / Command (+ Observer + Singleton) và State

| Endpoint (method + path) | Pattern chính | Request body mẫu | Response (field chính) | Controller |
|---|---|---|---|---|
| POST `/api/Orders/checkout` | Facade (gom checkout), Strategy (ship fee), Decorator (price), Builder (build order), Observer (notify), Singleton (logger) | `CreateOrderRequest` (xem mẫu ở cuối file) | `200: { success, orderId, orderNumber, totalAmount }` hoặc `400: { error }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/price-breakdown` | Facade + Decorator + Strategy | `PriceCalculationRequest` | `OrderPriceBreakdown` (Items, SubTotal, TotalDiscount, TotalTax, ShippingFee, TotalAmount) | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/shipping-options` | Strategy | `ShippingOptionsRequest` | danh sách option ship (phí + số ngày) | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/{id}/confirm` | Command (ConfirmOrderCommand) + Observer (notifier) | `TransitionRequest?` (`{ notes?, changedBy? }`) | `{ success, message }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/{id}/ship` | Command (ShipOrderCommand) + Observer | `TransitionRequest?` | `{ success, message }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| PATCH `/api/Orders/{id}/mark-paid` | Command (MarkAsPaidCommand) | — | `{ success, message }` hoặc `{ error }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/{id}/undo` | Command (Undo) | — | `{ success, message, canUndo, canRedo }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/{id}/redo` | Command (Redo) | — | `{ success, message, canUndo, canRedo }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| PUT `/api/Orders/{id}/shipping-address` | Command (UpdateShippingAddressCommand) | `ShippingInfoDto` | `{ success, message }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/{id}/next-state` | State (transition) | `TransitionRequest?` | `{ success, currentStatus }` hoặc `{ error }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |
| POST `/api/Orders/{id}/cancel` | State (cancel) | `CancelRequest?` (`{ reason?, changedBy? }`) | `{ success, message }` hoặc `{ error }` | [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs) |

## Shipping / Strategy (API riêng)

| Endpoint (method + path) | Pattern chính | Request body mẫu | Response (field chính) | Controller |
|---|---|---|---|---|
| POST `/api/shipping/options` | Strategy (thông qua CheckoutFacade) | `ShippingOptionsRequest` | `{ success, data: ShippingOptionDto[] }` | [FurnitureShop.API/Controllers/ShippingController.cs](FurnitureShop.API/Controllers/ShippingController.cs) |
| POST `/api/shipping/calculate-best` | Strategy (build ShippingCalculator, chọn strategy phù hợp) | `ShippingCalculationRequest` | `{ success, data: { fee, strategy, estimatedDays } }` | [FurnitureShop.API/Controllers/ShippingController.cs](FurnitureShop.API/Controllers/ShippingController.cs) |
| POST `/api/shipping/calculate-all` | Strategy (liệt kê mọi option áp dụng) | `ShippingCalculationRequest` | `{ success, data: { strategy, fee, estimatedDays }[] }` | [FurnitureShop.API/Controllers/ShippingController.cs](FurnitureShop.API/Controllers/ShippingController.cs) |

## Product / Decorator

| Endpoint (method + path) | Pattern chính | Request body mẫu | Response (field chính) | Controller |
|---|---|---|---|---|
| POST `/api/Products/configure` | Decorator (tính giá theo thuộc tính) | `{ productId, selectedAttributeIds: [] }` | `ProductConfigurationResponse` (`productName`, `basePrice`, `selectedAttributes`, `totalAdjustment`, `finalPrice`, `fullDescription`) | [FurnitureShop.API/Controllers/ProductsController.cs](FurnitureShop.API/Controllers/ProductsController.cs) |
| GET `/api/Products/all` | (hỗ trợ demo lấy productId/attributes) | — | danh sách product | [FurnitureShop.API/Controllers/ProductsController.cs](FurnitureShop.API/Controllers/ProductsController.cs) |

## Logger / Singleton (không có endpoint riêng)

- Singleton logger được dùng trong controller, ví dụ: [FurnitureShop.API/Controllers/OrdersController.cs](FurnitureShop.API/Controllers/OrdersController.cs), [FurnitureShop.API/Controllers/PaymentsController.cs](FurnitureShop.API/Controllers/PaymentsController.cs), [FurnitureShop.API/Controllers/AuthController.cs](FurnitureShop.API/Controllers/AuthController.cs).
- Class: [FurnitureShop.API/Patterns/Singleton/LoggerService.cs](FurnitureShop.API/Patterns/Singleton/LoggerService.cs)

---

## Mẫu request body dùng để demo trong Swagger

### 1) `CreateOrderRequest` (POST `/api/Orders/checkout`)
```json
{
  "userId": 1,
  "shippingInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "address": "123 Le Loi",
    "city": "TP.HCM",
    "district": "Quan 1",
    "ward": "Ben Nghe"
  },
  "items": [
    { "productId": 1, "quantity": 1, "selectedAttributeIds": [] }
  ],
  "shippingMethodId": 1,
  "paymentMethod": "COD",
  "notes": "Demo swagger"
}
```

### 2) `PriceCalculationRequest` (POST `/api/Orders/price-breakdown`)
```json
{
  "items": [
    { "productId": 1, "quantity": 1, "selectedAttributeIds": [] }
  ],
  "discountPercent": 10,
  "discountLabel": "Coupon",
  "applyTax": true,
  "taxPercent": 10,
  "shippingInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "address": "123 Le Loi",
    "city": "TP.HCM",
    "district": "Quan 1",
    "ward": "Ben Nghe"
  }
}
```

### 3) `ShippingOptionsRequest` (POST `/api/Orders/shipping-options` hoặc `/api/shipping/options`)
```json
{
  "productIds": [1],
  "shippingInfo": {
    "fullName": "Nguyen Van A",
    "phone": "0900000000",
    "address": "123 Le Loi",
    "city": "TP.HCM",
    "district": "Quan 1",
    "ward": "Ben Nghe"
  }
}
```
