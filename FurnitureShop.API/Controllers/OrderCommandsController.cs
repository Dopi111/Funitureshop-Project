using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Patterns.Command;
using FurnitureShop.API.Patterns.Observer;
using FurnitureShop.API.Patterns.Singleton;
using Microsoft.AspNetCore.Mvc;

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
            IInventoryService inventoryService)
        {
            _context = context;
            _commandInvoker = commandInvoker;

            _orderNotifier = new OrderNotifier();
            _orderNotifier.Attach(new EmailNotificationObserver(emailService));
            _orderNotifier.Attach(new SmsNotificationObserver(smsService));
            _orderNotifier.Attach(new InventoryObserver(inventoryService));
            _orderNotifier.Attach(new AnalyticsObserver());

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

            return Ok(new
            {
                success = true,
                message = "Order shipped",
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
