using FurnitureShop.API.Services;
using FurnitureShop.API.Patterns.State;
using Microsoft.AspNetCore.Mvc;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/order-state")]
    public class OrderStateController : ControllerBase
    {
        private readonly OrderService _orderService;

        public OrderStateController(OrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetState(int orderId)
        {
            var order = await _orderService.GetOrderByIdAsync(orderId);
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

        [HttpGet("{orderId}/available-transitions")]
        public async Task<IActionResult> GetAvailableTransitions(int orderId)
        {
            var order = await _orderService.GetOrderByIdAsync(orderId);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Order not found" });
            }

            var context = new OrderStateContext(order);
            return Ok(new
            {
                success = true,
                orderId,
                transitions = context.GetAvailableTransitions()
            });
        }

        [HttpGet("{orderId}/description")]
        public async Task<IActionResult> GetStateDescription(int orderId)
        {
            var order = await _orderService.GetOrderByIdAsync(orderId);
            if (order == null)
            {
                return NotFound(new { success = false, message = "Order not found" });
            }

            var context = new OrderStateContext(order);
            return Ok(new
            {
                success = true,
                orderId,
                status = order.Status,
                description = context.CurrentState.GetStatusDescription()
            });
        }
    }
}
