using FurnitureShop.API.Data;
using FurnitureShop.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    public class ProductVariantDto
    {
        public int VariantId { get; set; }
        public int ProductId { get; set; }
        public string SKU { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public string? Material { get; set; }
        public decimal AdditionalPrice { get; set; }
        public int StockQuantity { get; set; }
    }

    [Route("api/products/{productId}/variants")]
    [ApiController]
    public class ProductVariantsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductVariantsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/products/{productId}/variants
        [HttpGet]
        public async Task<IActionResult> GetVariants(int productId)
        {
            var variants = await _context.ProductVariants
                .Where(v => v.ProductId == productId)
                .Select(v => new ProductVariantDto
                {
                    VariantId = v.VariantId,
                    ProductId = v.ProductId,
                    SKU = v.SKU,
                    Color = v.Color,
                    Size = v.Size,
                    Material = v.Material,
                    AdditionalPrice = v.AdditionalPrice,
                    StockQuantity = v.StockQuantity
                })
                .ToListAsync();

            return Ok(new { success = true, data = variants });
        }

        // POST: api/products/{productId}/variants
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateVariant(int productId, [FromBody] ProductVariantDto dto)
        {
            var productExists = await _context.Products.AnyAsync(p => p.ProductId == productId);
            if (!productExists) return NotFound(new { success = false, message = "Sản phẩm không tồn tại" });

            var variant = new ProductVariant
            {
                ProductId = productId,
                SKU = dto.SKU ?? string.Empty,
                Color = dto.Color,
                Size = dto.Size,
                Material = dto.Material,
                AdditionalPrice = dto.AdditionalPrice,
                StockQuantity = dto.StockQuantity,
                CreatedAt = DateTime.UtcNow
            };

            _context.ProductVariants.Add(variant);
            await _context.SaveChangesAsync();

            dto.VariantId = variant.VariantId;
            return Ok(new { success = true, data = dto, message = "Thêm biến thể thành công" });
        }

        // PUT: api/products/{productId}/variants/{id}
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVariant(int productId, int id, [FromBody] ProductVariantDto dto)
        {
            var variant = await _context.ProductVariants
                .FirstOrDefaultAsync(v => v.VariantId == id && v.ProductId == productId);

            if (variant == null) return NotFound(new { success = false, message = "Biến thể không tồn tại" });

            variant.SKU = dto.SKU ?? variant.SKU;
            variant.Color = dto.Color;
            variant.Size = dto.Size;
            variant.Material = dto.Material;
            variant.AdditionalPrice = dto.AdditionalPrice;
            variant.StockQuantity = dto.StockQuantity;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = dto, message = "Cập nhật biến thể thành công" });
        }

        // DELETE: api/products/{productId}/variants/{id}
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVariant(int productId, int id)
        {
            var variant = await _context.ProductVariants
                .FirstOrDefaultAsync(v => v.VariantId == id && v.ProductId == productId);

            if (variant == null) return NotFound(new { success = false, message = "Biến thể không tồn tại" });

            _context.ProductVariants.Remove(variant);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Xoá biến thể thành công" });
        }
    }
}
