using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using FurnitureShop.API.Patterns.Factory;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/product-types")]
    public class ProductTypesController : ControllerBase
    {
        private readonly ProductFactory _productFactory;
        private readonly AppDbContext _context;

        public ProductTypesController(ProductFactory productFactory, AppDbContext context)
        {
            _productFactory = productFactory;
            _context = context;
        }

        [HttpGet]
        public IActionResult GetAvailableTypes()
        {
            return Ok(new { success = true, data = _productFactory.GetAvailableProductTypes() });
        }

        [HttpPost("validate")]
        public IActionResult ValidateByType([FromBody] ValidateProductTypeRequest request)
        {
            var product = new Product
            {
                Name = request.Name,
                ProductType = request.ProductType,
                Width = request.Width,
                Height = request.Height,
                Depth = request.Depth,
                Weight = request.Weight,
                BasePrice = request.BasePrice,
                CategoryId = request.CategoryId
            };

            try
            {
                var built = _productFactory.BuildProduct(request.ProductType, product);
                var typed = _productFactory.CreateProduct(built);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        productType = typed.GetProductType(),
                        description = typed.GetDescription(),
                        estimatedShippingWeight = typed.CalculateShippingWeight(),
                        requiredAttributes = typed.GetRequiredAttributes()
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetTypeStats()
        {
            var stats = await _context.Products
                .Where(p => p.IsActive)
                .GroupBy(p => p.ProductType)
                .Select(g => new
                {
                    productType = g.Key,
                    count = g.Count(),
                    minPrice = g.Min(x => x.BasePrice),
                    maxPrice = g.Max(x => x.BasePrice)
                })
                .OrderBy(x => x.productType)
                .ToListAsync();

            return Ok(new { success = true, data = stats });
        }
    }

    public class ValidateProductTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string ProductType { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public int CategoryId { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Depth { get; set; }
        public decimal? Weight { get; set; }
    }
}
