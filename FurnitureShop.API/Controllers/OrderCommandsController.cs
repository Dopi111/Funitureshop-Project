using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Patterns.Command;
using FurnitureShop.API.Patterns.Observer;
using FurnitureShop.API.Patterns.Singleton;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using FurnitureShop.API.Hubs;
using Microsoft.Extensions.Caching.Memory;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/order-commands")]
    public class OrderCommandsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly OrderCommandInvoker _commandInvoker;
        private readonly OrderNotifier _orderNotifier;
        private readonly ILoggerService _logger = LoggerService.Instance;

        public OrderCommandsController(
            AppDbContext context,
            OrderCommandInvoker commandInvoker,
            IEmailService emailService,
            ISmsService smsService,
            IInventoryService inventoryService,
            IHubContext<NotificationHub> hubContext,
            IMemoryCache cache)
        {
            _context = context;
            _commandInvoker = commandInvoker;

            _orderNotifier = new OrderNotifier();
            _orderNotifier.Attach(new EmailNotificationObserver(emailService));
            _orderNotifier.Attach(new SmsNotificationObserver(smsService));
            _orderNotifier.Attach(new InventoryObserver(inventoryService));
            _orderNotifier.Attach(new AnalyticsObserver());
            _orderNotifier.Attach(new SignalRObserver(hubContext));
            _orderNotifier.Attach(new CacheInvalidationObserver(cache));

            _logger.LogInfo("OrderCommandsController initialized");
        }

        [HttpPost("{orderId}/confirm")]
        public async Task<IActionResult> Confirm(int orderId, [FromBody] TransitionRequest? request)
        {
            var command = new ConfirmOrderCommand(_context, _orderNotifier, orderId, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
            {
                return BadRequest(new { success = false, message = "Cannot confirm order in current state" });
            }

            _context.AuditLogs.Add(new Models.Entities.AuditLog
            {
                UserId = int.TryParse(request?.ChangedBy, out var uId1) ? uId1 : null,
                Username = request?.ChangedBy ?? "System",
                Action = "Confirm Order",
                EntityName = "Order",
                EntityId = orderId,
                Details = $"Order #{orderId} confirmed"
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Order confirmed",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPost("{orderId}/ship")]
        public async Task<IActionResult> Ship(int orderId, [FromBody] TransitionRequest? request)
        {
            var command = new ShipOrderCommand(_context, _orderNotifier, orderId, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
            {
                return BadRequest(new { success = false, message = "Cannot ship order in current state" });
            }

            _context.AuditLogs.Add(new Models.Entities.AuditLog
            {
                UserId = int.TryParse(request?.ChangedBy, out var uId2) ? uId2 : null,
                Username = request?.ChangedBy ?? "System",
                Action = "Ship Order",
                EntityName = "Order",
                EntityId = orderId,
                Details = $"Order #{orderId} shipped"
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Order shipped",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPost("{orderId}/complete")]
        public async Task<IActionResult> Complete(int orderId, [FromBody] TransitionRequest? request)
        {
            var command = new CompleteOrderCommand(_context, _orderNotifier, orderId, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
            {
                return BadRequest(new { success = false, message = "Cannot complete order in current state" });
            }

            _context.AuditLogs.Add(new Models.Entities.AuditLog
            {
                UserId = int.TryParse(request?.ChangedBy, out var uId3) ? uId3 : null,
                Username = request?.ChangedBy ?? "System",
                Action = "Complete Order",
                EntityName = "Order",
                EntityId = orderId,
                Details = $"Order #{orderId} completed"
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Order completed",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPost("{orderId}/cancel")]
        public async Task<IActionResult> Cancel(int orderId, [FromBody] CancelRequest? request)
        {
            var command = new CancelOrderCommand(_context, _orderNotifier, orderId, request?.Reason, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
            {
                return BadRequest(new { success = false, message = "Cannot cancel order in current state" });
            }

            _context.AuditLogs.Add(new Models.Entities.AuditLog
            {
                UserId = int.TryParse(request?.ChangedBy, out var uId4) ? uId4 : null,
                Username = request?.ChangedBy ?? "System",
                Action = "Cancel Order",
                EntityName = "Order",
                EntityId = orderId,
                Details = $"Order #{orderId} cancelled. Reason: {request?.Reason}"
            });
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Order cancelled",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPatch("{orderId}/mark-paid")]
        public async Task<IActionResult> MarkPaid(int orderId, [FromBody] TransitionRequest? request)
        {
            var command = new MarkAsPaidCommand(_context, orderId, request?.ChangedBy);
            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
            {
                return BadRequest(new { success = false, message = "Cannot mark order as paid" });
            }

            return Ok(new
            {
                success = true,
                message = "Order marked as paid",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPut("{orderId}/shipping-address")]
        public async Task<IActionResult> UpdateShippingAddress(int orderId, [FromBody] ShippingInfoDto dto)
        {
            var command = new UpdateShippingAddressCommand(
                _context,
                orderId,
                dto.FullName,
                dto.Phone,
                dto.Address,
                dto.City,
                dto.District,
                dto.Ward);

            var success = await _commandInvoker.ExecuteAsync(command);

            if (!success)
            {
                return BadRequest(new { success = false, message = "Cannot update shipping address in current state" });
            }

            return Ok(new
            {
                success = true,
                message = "Shipping address updated",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPost("{orderId}/undo")]
        public async Task<IActionResult> Undo(int orderId)
        {
            var success = await _commandInvoker.UndoAsync(orderId);
            if (!success)
            {
                return BadRequest(new { success = false, message = "No action to undo for this order" });
            }

            return Ok(new
            {
                success = true,
                message = "Undo successful",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpPost("{orderId}/redo")]
        public async Task<IActionResult> Redo(int orderId)
        {
            var success = await _commandInvoker.RedoAsync(orderId);
            if (!success)
            {
                return BadRequest(new { success = false, message = "No action to redo for this order" });
            }

            return Ok(new
            {
                success = true,
                message = "Redo successful",
                canUndo = _commandInvoker.CanUndo(orderId),
                canRedo = _commandInvoker.CanRedo(orderId)
            });
        }

        [HttpGet("{orderId}/history")]
        public IActionResult GetHistory(int orderId)
        {
            return Ok(new
            {
                success = true,
                orderId,
                undoHistory = _commandInvoker.GetUndoHistory(orderId),
                executionHistory = _commandInvoker.GetExecutionHistory(orderId)
            });
        }
    }
}
