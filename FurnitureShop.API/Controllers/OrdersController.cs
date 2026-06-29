using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using FurnitureShop.API.Patterns.Command;
using FurnitureShop.API.Patterns.Facade;
using FurnitureShop.API.Patterns.Observer;
using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly OrderService _orderService;
        private readonly CheckoutFacade _checkoutFacade;
        private readonly AppDbContext _context;
        private readonly OrderCommandInvoker _commandInvoker;
        private readonly OrderNotifier _orderNotifier;
        // SINGLETON PATTERN: Sử dụng Logger Service duy nhất
        private readonly ILoggerService _logger = LoggerService.Instance;

        public OrdersController(
            OrderService orderService,
            CheckoutFacade checkoutFacade,
            AppDbContext context,
            OrderCommandInvoker commandInvoker,
            IEmailService emailService,
            ISmsService smsService,
            IInventoryService inventoryService)
        {
            _orderService = orderService;
            _checkoutFacade = checkoutFacade;
            _context = context;
            _commandInvoker = commandInvoker;

            // OrderNotifier dùng chung với Commands
            _orderNotifier = new OrderNotifier();
            _orderNotifier.Attach(new EmailNotificationObserver(emailService));
            _orderNotifier.Attach(new SmsNotificationObserver(smsService));
            _orderNotifier.Attach(new InventoryObserver(inventoryService));
            _orderNotifier.Attach(new AnalyticsObserver());

            _logger.LogInfo($"OrdersController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        // GET: api/orders - Get all orders with pagination (for admin)
        [HttpGet]
        public async Task<IActionResult> GetOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? status = null)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(o => (int)o.Status == status.Value);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderNumber,
                    o.UserId,
                    UserName = o.User.FullName,
                    o.Status,
                    o.ShippingFullName,
                    o.ShippingPhone,
                    o.ShippingAddress,
                    o.ShippingCity,
                    o.ShippingDistrict,
                    o.ShippingWard,
                    o.SubTotal,
                    o.ShippingFee,
                    o.RequireInstallation,
                    o.InstallationFee,
                    o.TotalAmount,
                    o.PaymentMethod,
                    o.IsPaid,
                    o.PaidAt,
                    o.Notes,
                    o.CreatedAt,
                    ItemCount = o.OrderDetails.Count
                })
                .ToListAsync();

            return Ok(new
            {
                data = orders,
                page,
                pageSize,
                totalCount,
                totalPages
            });
        }

        // POST: api/orders/checkout
        // FACADE PATTERN: Complete checkout process
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CreateOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _checkoutFacade.ProcessCheckoutAsync(request);

            if (!result.Success)
                return BadRequest(new { error = result.ErrorMessage });

            return Ok(new
            {
                success = true,
                orderId = result.OrderId,
                orderNumber = result.OrderNumber,
                totalAmount = result.TotalAmount
            });
        }

        // GET: api/orders/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrder(int id)
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound();

            return Ok(order);
        }

        // GET: api/orders/user/5
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserOrders(int userId)
        {
            var orders = await _orderService.GetOrdersByUserAsync(userId);
            return Ok(orders);
        }

        // POST: api/orders/5/next-state
        // STATE PATTERN: Transition order state
        [HttpPost("{id}/next-state")]
        public async Task<IActionResult> TransitionState(int id, [FromBody] TransitionRequest? request)
        {
            var success = await _orderService.TransitionOrderStateAsync(
                id,
                request?.Notes,
                request?.ChangedBy);

            if (!success)
                return BadRequest(new { error = "Cannot transition order state" });

            var order = await _orderService.GetOrderByIdAsync(id);
            return Ok(new { success = true, currentStatus = order?.Status });
        }

        // POST: api/orders/5/cancel
        // STATE PATTERN: Cancel order
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id, [FromBody] CancelRequest? request)
        {
            var success = await _orderService.CancelOrderAsync(
                id,
                request?.Reason,
                request?.ChangedBy);

            if (!success)
                return BadRequest(new { error = "Cannot cancel order" });

            return Ok(new { success = true, message = "Order cancelled successfully" });
        }

        // POST: api/orders/shipping-options
        // STRATEGY PATTERN: Get shipping options
        [HttpPost("shipping-options")]
        public async Task<IActionResult> GetShippingOptions([FromBody] ShippingOptionsRequest request)
        {
            var options = await _checkoutFacade.GetShippingOptionsAsync(
                request.ProductIds,
                request.ShippingInfo);

            return Ok(options);
        }

        // POST: api/orders/price-breakdown
        // FACADE PATTERN: Tính chi tiết giá (thuế, giảm giá, phí ship)
        [HttpPost("price-breakdown")]
        public async Task<IActionResult> GetPriceBreakdown([FromBody] PriceCalculationRequest request)
        {
            var breakdown = await _checkoutFacade.CalculatePriceBreakdownAsync(request);
            return Ok(breakdown);
        }

        // PATCH: api/orders/5/mark-paid - Mark order as paid
        [HttpPatch("{id}/mark-paid")]
        public async Task<IActionResult> MarkAsPaid(int id)
        {
            // COMMAND PATTERN: dùng MarkAsPaidCommand thay vì gán thỪng
            var command = new MarkAsPaidCommand(_context, id);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
                return BadRequest(new { error = "Không thể cập nhật thanh toán (có thể đã thanh toán rồi)" });

            return Ok(new { success = true, message = "Đã cập nhật trạng thái thanh toán" });
        }

        // POST: api/orders/5/confirm
        // COMMAND PATTERN: Xác nhận đơn hàng (Pending → Processing)
        [HttpPost("{id}/confirm")]
        public async Task<IActionResult> ConfirmOrder(int id, [FromBody] TransitionRequest? request)
        {
            var command = new ConfirmOrderCommand(_context, _orderNotifier, id, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
                return BadRequest(new { error = "Không thể xác nhận đơn hàng (sai trạng thái)" });

            return Ok(new { success = true, message = "Đơn hàng đã được xác nhận" });
        }

        // POST: api/orders/5/ship
        // COMMAND PATTERN: Giao hàng (Processing → Shipped)
        [HttpPost("{id}/ship")]
        public async Task<IActionResult> ShipOrder(int id, [FromBody] TransitionRequest? request)
        {
            var command = new ShipOrderCommand(_context, _orderNotifier, id, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
                return BadRequest(new { error = "Không thể giao hàng (sai trạng thái)" });

            return Ok(new { success = true, message = "Đơn hàng đang được giao" });
        }

        // POST: api/orders/5/undo
        // COMMAND PATTERN: Hoàn tác thao tác gần nhất
        [HttpPost("{id}/undo")]
        public async Task<IActionResult> UndoLastCommand(int id)
        {
            var success = await _commandInvoker.UndoAsync(id);

            if (!success)
                return BadRequest(new { error = "Không có thao tác nào để hoàn tác" });

            return Ok(new { success = true, message = "Hoàn tác thành công", canUndo = _commandInvoker.CanUndo(id), canRedo = _commandInvoker.CanRedo(id) });
        }

        // POST: api/orders/5/redo
        // COMMAND PATTERN: Thực hiện lại thao tác vừa undo
        [HttpPost("{id}/redo")]
        public async Task<IActionResult> RedoLastCommand(int id)
        {
            var success = await _commandInvoker.RedoAsync(id);

            if (!success)
                return BadRequest(new { error = "Không có thao tác nào để redo" });

            return Ok(new { success = true, message = "Redo thành công", canUndo = _commandInvoker.CanUndo(id), canRedo = _commandInvoker.CanRedo(id) });
        }

        // PUT: api/orders/5/shipping-address
        // COMMAND PATTERN: Cập nhật địa chỉ giao hàng (có Undo)
        [HttpPut("{id}/shipping-address")]
        public async Task<IActionResult> UpdateShippingAddress(int id, [FromBody] ShippingInfoDto dto)
        {
            var command = new UpdateShippingAddressCommand(
                _context, id,
                dto.FullName, dto.Phone, dto.Address,
                dto.City, dto.District, dto.Ward);

            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
                return BadRequest(new { error = "Không thể cập nhật địa chỉ (trạng thái không hợp lệ)" });

            return Ok(new { success = true, message = "Cập nhật địa chỉ giao hàng thành công" });
        }

        // POST: api/orders/{id}/request-return
        [HttpPost("{id}/request-return")]
        public async Task<IActionResult> RequestReturn(int id, [FromBody] TransitionRequest request)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.OrderId == id);
            if (order == null) return NotFound(new { success = false, message = "Không tìm thấy đơn hàng" });

            if (order.Status != OrderStatus.Completed)
                return BadRequest(new { success = false, message = "Chỉ có thể yêu cầu trả hàng đối với đơn hàng đã hoàn thành" });

            order.Status = OrderStatus.ReturnRequested;
            order.Notes = (order.Notes ?? "") + "\n[Yêu cầu trả hàng]: " + request.Notes;
            order.UpdatedAt = DateTime.UtcNow;

            var history = new OrderStatusHistory
            {
                OrderId = id,
                FromStatus = OrderStatus.Completed,
                ToStatus = OrderStatus.ReturnRequested,
                Notes = request.Notes,
                ChangedBy = request.ChangedBy ?? "User",
                CreatedAt = DateTime.UtcNow
            };
            _context.OrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã gửi yêu cầu trả hàng thành công" });
        }

        // POST: api/orders/{id}/approve-return
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/approve-return")]
        public async Task<IActionResult> ApproveReturn(int id, [FromBody] TransitionRequest request)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .FirstOrDefaultAsync(o => o.OrderId == id);
                
            if (order == null) return NotFound(new { success = false, message = "Không tìm thấy đơn hàng" });

            if (order.Status != OrderStatus.ReturnRequested)
                return BadRequest(new { success = false, message = "Đơn hàng chưa có yêu cầu trả hàng" });

            order.Status = OrderStatus.Returned;
            order.Notes = (order.Notes ?? "") + "\n[Đã duyệt trả hàng]: " + request.Notes;
            order.UpdatedAt = DateTime.UtcNow;

            var history = new OrderStatusHistory
            {
                OrderId = id,
                FromStatus = OrderStatus.ReturnRequested,
                ToStatus = OrderStatus.Returned,
                Notes = request.Notes,
                ChangedBy = request.ChangedBy ?? "Admin",
                CreatedAt = DateTime.UtcNow
            };
            _context.OrderStatusHistories.Add(history);

            // Audit Log
            var auditLog = new AuditLog
            {
                Action = "Approve Return",
                EntityName = "Order",
                EntityId = id,
                Username = request.ChangedBy ?? "Admin",
                Details = "Duyệt trả hàng đơn hàng #" + order.OrderNumber,
                CreatedAt = DateTime.UtcNow
            };
            _context.AuditLogs.Add(auditLog);

            // Cập nhật lại tồn kho
            foreach (var detail in order.OrderDetails)
            {
                var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == detail.ProductId);
                if (product != null)
                {
                    product.StockQuantity += detail.Quantity;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã phê duyệt trả hàng và hoàn lại tồn kho" });
        }
    }
}
