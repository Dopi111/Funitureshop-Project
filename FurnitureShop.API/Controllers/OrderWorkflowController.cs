using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using FurnitureShop.API.Patterns.State;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/order-workflow")]
    public class OrderWorkflowController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderWorkflowController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{orderId}/status-history")]
        public async Task<IActionResult> GetStatusHistory(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null)
            {
                return NotFound(new { success = false, message = "Order not found" });
            }

            var history = order.StatusHistories
                .OrderByDescending(h => h.CreatedAt)
                .Select(h => new
                {
                    h.HistoryId,
                    h.FromStatus,
                    h.ToStatus,
                    h.Notes,
                    h.ChangedBy,
                    h.CreatedAt
                })
                .ToList();

            return Ok(new { success = true, orderId, currentStatus = order.Status, history });
        }

        [HttpGet("{orderId}/transitions")]
        public async Task<IActionResult> GetWorkflowTransitions(int orderId)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Order not found" });
            }

            var context = new OrderStateContext(order);

            return Ok(new
            {
                success = true,
                orderId,
                currentStatus = order.Status,
                description = context.CurrentState.GetStatusDescription(),
                availableTransitions = context.GetAvailableTransitions()
            });
        }

        [HttpGet("rules")]
        public IActionResult GetWorkflowRules()
        {
            var rules = new Dictionary<OrderStatus, List<OrderStatus>>
            {
                { OrderStatus.Pending, new List<OrderStatus> { OrderStatus.Processing, OrderStatus.Cancelled } },
                { OrderStatus.Processing, new List<OrderStatus> { OrderStatus.Shipped, OrderStatus.Cancelled } },
                { OrderStatus.Shipped, new List<OrderStatus> { OrderStatus.Completed } },
                { OrderStatus.Completed, new List<OrderStatus>() },
                { OrderStatus.Cancelled, new List<OrderStatus>() }
            };

            return Ok(new { success = true, data = rules });
        }
    }
}
