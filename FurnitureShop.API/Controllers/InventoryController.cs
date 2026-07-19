using FurnitureShop.API.DTOs;
using FurnitureShop.API.Services;
using FurnitureShop.API.Data;
using FurnitureShop.API.Models.Entities;
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
        private readonly AppDbContext _context;

        public InventoryController(IPurchaseOrderService poService, AppDbContext context)
        {
            _poService = poService;
            _context = context;
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

        [HttpPut("suppliers/{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] UpdateSupplierRequest request)
        {
            var supplier = await _poService.UpdateSupplierAsync(id, request, request.IsActive);
            return supplier == null
                ? NotFound(new { success = false, message = "Supplier not found" })
                : Ok(new { success = true, data = supplier });
        }

        [HttpDelete("suppliers/{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var result = await _poService.DeleteSupplierAsync(id);
            return result
                ? Ok(new { success = true, message = "Supplier deactivated" })
                : NotFound(new { success = false, message = "Supplier not found" });
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

        [HttpPost("products/{productId}/adjust")]
        public async Task<IActionResult> AdjustStock(int productId, [FromBody] AdjustStockRequest request)
        {
            if (request.Quantity < 0)
                return BadRequest(new { success = false, message = "Quantity cannot be negative" });

            var product = await _context.Products.FindAsync(productId);
            if (product == null)
                return NotFound(new { success = false, message = "Product not found" });

            var oldQuantity = product.StockQuantity;
            product.StockQuantity = request.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
            _context.AuditLogs.Add(new AuditLog
            {
                UserId = GetAdminUserId(),
                Username = User.Identity?.Name ?? "Admin",
                Action = "UPDATE_STOCK",
                EntityName = "Product",
                EntityId = productId,
                Details = System.Text.Json.JsonSerializer.Serialize(new { oldQuantity, request.Quantity, request.Reason })
            });
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = new { productId, stockQuantity = product.StockQuantity } });
        }

        private int? GetAdminUserId()
        {
            var value = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }

    public class UpdateSupplierRequest : CreateSupplierDto
    {
        public bool IsActive { get; set; } = true;
    }

    public class AdjustStockRequest
    {
        public int Quantity { get; set; }
        public string? Reason { get; set; }
    }
}
