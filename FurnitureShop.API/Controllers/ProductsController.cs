using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Patterns.Decorator;
using FurnitureShop.API.Patterns.Factory;
using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ProductService _productService;
        private readonly AppDbContext _context;
        private readonly ProductFactory _productFactory;
        // SINGLETON PATTERN: Sử dụng Logger Service duy nhất
        private readonly ILoggerService _logger = LoggerService.Instance;

        public ProductsController(ProductService productService, AppDbContext context, ProductFactory productFactory)
        {
            _productService = productService;
            _context = context;
            _productFactory = productFactory;
            _logger.LogInfo($"ProductsController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        // GET: api/products
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int? categoryId, 
            [FromQuery] string? productType,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 12)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive);

            // Filter by category (including descendants)
            if (categoryId.HasValue)
            {
                var categoryIds = await GetAllDescendantCategoryIds(categoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            // Filter by ProductType
            if (!string.IsNullOrEmpty(productType))
            {
                query = query.Where(p => p.ProductType == productType);
            }

            var total = await query.CountAsync();
            var products = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                data = products,
                total,
                totalCount = total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }

        /// <summary>
        /// Recursively get all descendant category IDs including the parent
        /// </summary>
        private async Task<List<int>> GetAllDescendantCategoryIds(int parentCategoryId)
        {
            var allCategories = await _context.Categories.ToListAsync();
            var result = new List<int> { parentCategoryId };
            
            void AddDescendants(int parentId)
            {
                var children = allCategories.Where(c => c.ParentId == parentId).ToList();
                foreach (var child in children)
                {
                    result.Add(child.CategoryId);
                    AddDescendants(child.CategoryId);
                }
            }
            
            AddDescendants(parentCategoryId);
            return result;
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound();

            await _productService.IncrementViewCountAsync(id);
            return Ok(product);
        }

        // GET: api/products/featured
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            var products = await _productService.GetFeaturedProductsAsync();
            return Ok(products);
        }

        // GET: api/products/product-types - Lấy tất cả ProductTypes
        [HttpGet("product-types")]
        public async Task<IActionResult> GetAllProductTypes()
        {
            var productTypes = _productFactory.GetAvailableProductTypes();

            return Ok(productTypes);
        }

        // GET: api/products/product-types/by-category/{categoryId} - Lấy ProductTypes theo danh mục
        [HttpGet("product-types/by-category/{categoryId}")]
        public async Task<IActionResult> GetProductTypesByCategory(int categoryId)
        {
            // Get all descendant category IDs
            var categoryIds = await GetAllDescendantCategoryIds(categoryId);

            var productTypes = await _context.Products
                .Where(p => p.IsActive && categoryIds.Contains(p.CategoryId) && !string.IsNullOrEmpty(p.ProductType))
                .GroupBy(p => p.ProductType)
                .Select(g => new {
                    productType = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.productType)
                .ToListAsync();

            return Ok(productTypes);
        }

        // POST: api/products/configure
        // DECORATOR PATTERN: Calculate price with attributes
        [HttpPost("configure")]
        public async Task<IActionResult> ConfigureProduct([FromBody] ProductConfigurationRequest request)
        {
            var product = await _productService.GetProductByIdAsync(request.ProductId);
            if (product == null)
                return NotFound();

            var selectedAttributes = product.Attributes
                .Where(a => request.SelectedAttributeIds.Contains(a.AttributeId))
                .ToList();

            // DECORATOR PATTERN: Build decorated product
            var builder = new DecoratedProductBuilder(product);
            builder.WithAttributes(selectedAttributes);

            var decoratedProduct = builder.Build();

            var response = new ProductConfigurationResponse
            {
                ProductId = product.ProductId,
                ProductName = decoratedProduct.GetName(),
                BasePrice = product.DiscountPrice ?? product.BasePrice,
                SelectedAttributes = selectedAttributes.Select(a => new AttributeDto
                {
                    AttributeId = a.AttributeId,
                    Name = a.AttributeName,
                    Value = a.AttributeValue,
                    PriceAdjustment = a.PriceAdjustment
                }).ToList(),
                TotalAdjustment = selectedAttributes.Sum(a => a.PriceAdjustment),
                FinalPrice = decoratedProduct.GetPrice(),
                FullDescription = decoratedProduct.GetDescription()
            };

            return Ok(response);
        }

        // GET: api/products/category/5
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productService.GetByCategoryAsync(categoryId);
            return Ok(products);
        }

        // POST: api/products - Thêm sản phẩm mới (Admin only)
        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });
            }

            var product = new Models.Product
            {
                Name = request.Name,
                Description = request.Description,
                BasePrice = request.BasePrice,
                DiscountPrice = request.DiscountPrice,
                StockQuantity = request.StockQuantity,
                CategoryId = request.CategoryId,
                ProductType = request.ProductType ?? "Furniture",
                Width = request.Width,
                Height = request.Height,
                Depth = request.Depth,
                Weight = request.Weight,
                IsActive = request.IsActive,
                IsFeatured = request.IsFeatured,
                Slug = GenerateSlug(request.Name),
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                _productFactory.BuildProduct(product.ProductType, product);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            
            // Load category để trả về đầy đủ
            await _context.Entry(product).Reference(p => p.Category).LoadAsync();

            return Ok(new { success = true, message = "Thêm sản phẩm thành công", data = product });
        }

        // PUT: api/products/5 - Cập nhật sản phẩm (Admin only)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductId == id);
                
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            product.Name = request.Name;
            product.Description = request.Description;
            product.BasePrice = request.BasePrice;
            product.DiscountPrice = request.DiscountPrice;
            product.StockQuantity = request.StockQuantity;
            product.CategoryId = request.CategoryId;
            product.ProductType = request.ProductType ?? product.ProductType;
            product.Width = request.Width;
            product.Height = request.Height;
            product.Depth = request.Depth;
            product.Weight = request.Weight;
            product.IsActive = request.IsActive;
            product.IsFeatured = request.IsFeatured;
            product.Slug = GenerateSlug(request.Name);
            product.UpdatedAt = DateTime.UtcNow;

            try
            {
                _productFactory.BuildProduct(product.ProductType, product);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }

            await _context.SaveChangesAsync();
            
            // Reload category nếu đã thay đổi
            await _context.Entry(product).Reference(p => p.Category).LoadAsync();

            return Ok(new { success = true, message = "Cập nhật sản phẩm thành công", data = product });
        }

        // DELETE: api/products/5 - Xóa sản phẩm (Admin only)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm" });
            }

            // Soft delete - chỉ đánh dấu là inactive
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa sản phẩm thành công" });
        }

        // POST: api/products/{id}/upload-image - Upload ảnh cho sản phẩm (Admin only)
        [HttpPost("{productId}/upload-image")]
        public async Task<IActionResult> UploadProductImage(int productId, IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn file ảnh" });
            }

            // Kiểm tra sản phẩm có tồn tại không
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductId == productId);
            
            if (product == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });
            }

            // Kiểm tra định dạng file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { success = false, message = "Chỉ chấp nhận file ảnh: jpg, jpeg, png, gif, webp" });
            }

            // Giới hạn kích thước file (5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "File ảnh không được vượt quá 5MB" });
            }

            try
            {
                // Tạo thư mục nếu chưa có
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "products");
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                // Tạo tên file duy nhất
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadPath, uniqueFileName);

                // Lưu file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Tạo URL path cho ảnh
                var imageUrl = $"/images/products/{uniqueFileName}";

                // Xác định có phải ảnh chính không (ảnh đầu tiên sẽ là ảnh chính)
                var isPrimary = !product.Images.Any();
                var displayOrder = product.Images.Count;

                // Tạo record ProductImage
                var productImage = new Models.Entities.ProductImage
                {
                    ProductId = productId,
                    ImageUrl = imageUrl,
                    AltText = product.Name,
                    IsPrimary = isPrimary,
                    DisplayOrder = displayOrder,
                    CreatedAt = DateTime.UtcNow
                };

                _context.ProductImages.Add(productImage);
                await _context.SaveChangesAsync();

                return Ok(new 
                { 
                    success = true, 
                    message = "Upload ảnh thành công",
                    data = new 
                    {
                        imageId = productImage.ImageId,
                        imageUrl = productImage.ImageUrl,
                        isPrimary = productImage.IsPrimary
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi upload ảnh: {ex.Message}" });
            }
        }

        // DELETE: api/products/{productId}/images/{imageId} - Xóa ảnh sản phẩm (Admin only)
        [HttpDelete("{productId}/images/{imageId}")]
        public async Task<IActionResult> DeleteProductImage(int productId, int imageId)
        {
            var productImage = await _context.ProductImages
                .FirstOrDefaultAsync(pi => pi.ProductId == productId && pi.ImageId == imageId);
            
            if (productImage == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy ảnh" });
            }

            try
            {
                // Xóa file vật lý
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", productImage.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Xóa record trong database
                _context.ProductImages.Remove(productImage);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã xóa ảnh thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi khi xóa ảnh: {ex.Message}" });
            }
        }

        // PUT: api/products/{productId}/images/{imageId}/set-primary - Đặt làm ảnh chính
        [HttpPut("{productId}/images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimaryImage(int productId, int imageId)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductId == productId);

            if (product == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });
            }

            var targetImage = product.Images.FirstOrDefault(i => i.ImageId == imageId);
            if (targetImage == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy ảnh" });
            }

            // Bỏ primary của tất cả ảnh khác
            foreach (var img in product.Images)
            {
                img.IsPrimary = (img.ImageId == imageId);
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã đặt ảnh chính thành công" });
        }

        // GET: api/products/{productId}/images - Lấy danh sách ảnh của sản phẩm
        [HttpGet("{productId}/images")]
        public async Task<IActionResult> GetProductImages(int productId)
        {
            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.ProductId == productId);

            if (product == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy sản phẩm" });
            }

            var images = product.Images
                .OrderByDescending(i => i.IsPrimary)
                .ThenBy(i => i.DisplayOrder)
                .Select(i => new
                {
                    i.ImageId,
                    i.ImageUrl,
                    i.AltText,
                    i.IsPrimary,
                    i.DisplayOrder
                })
                .ToList();

            return Ok(new { success = true, data = images });
        }

        // GET: api/products/all - Lấy tất cả sản phẩm (bao gồm inactive - Admin only)
        [HttpGet("all")]
        public async Task<IActionResult> GetAllProducts([FromQuery] int? categoryId, [FromQuery] int page = 1, [FromQuery] int pageSize = 12)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            var total = await query.CountAsync();
            var products = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                data = products,
                total,
                page,
                pageSize,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }

        private string GenerateSlug(string name)
        {
            if (string.IsNullOrEmpty(name)) return "";
            
            // Chuyển thành chữ thường và loại bỏ dấu tiếng Việt
            var slug = name.ToLower()
                .Replace("á", "a").Replace("à", "a").Replace("ả", "a").Replace("ã", "a").Replace("ạ", "a")
                .Replace("ă", "a").Replace("ắ", "a").Replace("ằ", "a").Replace("ẳ", "a").Replace("ẵ", "a").Replace("ặ", "a")
                .Replace("â", "a").Replace("ấ", "a").Replace("ầ", "a").Replace("ẩ", "a").Replace("ẫ", "a").Replace("ậ", "a")
                .Replace("é", "e").Replace("è", "e").Replace("ẻ", "e").Replace("ẽ", "e").Replace("ẹ", "e")
                .Replace("ê", "e").Replace("ế", "e").Replace("ề", "e").Replace("ể", "e").Replace("ễ", "e").Replace("ệ", "e")
                .Replace("í", "i").Replace("ì", "i").Replace("ỉ", "i").Replace("ĩ", "i").Replace("ị", "i")
                .Replace("ó", "o").Replace("ò", "o").Replace("ỏ", "o").Replace("õ", "o").Replace("ọ", "o")
                .Replace("ô", "o").Replace("ố", "o").Replace("ồ", "o").Replace("ổ", "o").Replace("ỗ", "o").Replace("ộ", "o")
                .Replace("ơ", "o").Replace("ớ", "o").Replace("ờ", "o").Replace("ở", "o").Replace("ỡ", "o").Replace("ợ", "o")
                .Replace("ú", "u").Replace("ù", "u").Replace("ủ", "u").Replace("ũ", "u").Replace("ụ", "u")
                .Replace("ư", "u").Replace("ứ", "u").Replace("ừ", "u").Replace("ử", "u").Replace("ữ", "u").Replace("ự", "u")
                .Replace("ý", "y").Replace("ỳ", "y").Replace("ỷ", "y").Replace("ỹ", "y").Replace("ỵ", "y")
                .Replace("đ", "d");

            // Thay thế các ký tự không phải chữ cái hoặc số bằng dấu gạch ngang
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-");
            slug = System.Text.RegularExpressions.Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');

            return slug;
        }
    }

    // Request DTOs
    public class CreateProductRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public string? ProductType { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Depth { get; set; }
        public decimal? Weight { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
    }

    public class UpdateProductRequest
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public string? ProductType { get; set; }
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Depth { get; set; }
        public decimal? Weight { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsFeatured { get; set; } = false;
    }
}

