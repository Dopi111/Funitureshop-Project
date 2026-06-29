using FurnitureShop.API.DTOs;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class InventoryController : ControllerBase
    {
        private readonly IPurchaseOrderService _poService;

        public InventoryController(IPurchaseOrderService poService)
        {
            _poService = poService;
        }

        [HttpGet("suppliers")]
        public async Task<IActionResult> GetSuppliers()
        {
            var suppliers = await _poService.GetSuppliersAsync();
            return Ok(new { success = true, data = suppliers });
        }

        [HttpPost("suppliers")]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateSupplierDto dto)
        {
            var supplier = await _poService.CreateSupplierAsync(dto);
            return Ok(new { success = true, data = supplier });
        }

        [HttpGet("purchase-orders")]
        public async Task<IActionResult> GetPurchaseOrders()
        {
            var pos = await _poService.GetPurchaseOrdersAsync();
            return Ok(new { success = true, data = pos });
        }

        [HttpPost("purchase-orders")]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] CreatePurchaseOrderDto dto)
        {
            // Extract Admin ID from JWT token claims
            var userIdStr = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int adminUserId))
            {
                // Fallback for testing if claim name differs
                adminUserId = 1; // Default to admin for simplicity in this project if token lacks ID claim
            }

            try
            {
                var po = await _poService.CreatePurchaseOrderAsync(dto, adminUserId);
                return Ok(new { success = true, data = po });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("purchase-orders/{id}/complete")]
        public async Task<IActionResult> CompletePurchaseOrder(int id)
        {
            var result = await _poService.CompletePurchaseOrderAsync(id);
            if (!result)
                return BadRequest(new { success = false, message = "Cannot complete PO or already completed" });

            return Ok(new { success = true, message = "Purchase order completed and stock updated" });
        }
    }
}
