using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Patterns.Decorator;
using FurnitureShop.API.Patterns.Factory;
using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ProductService _productService;
        private readonly AppDbContext _context;
        private readonly ProductFactory _productFactory;
        private readonly IMemoryCache _cache;
        // SINGLETON PATTERN: Sử dụng Logger Service duy nhất
        private readonly ILoggerService _logger = LoggerService.Instance;

        public ProductsController(ProductService productService, AppDbContext context, ProductFactory productFactory, IMemoryCache cache)
        {
            _productService = productService;
            _context = context;
            _productFactory = productFactory;
            _cache = cache;
            _logger.LogInfo($"ProductsController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        // GET: api/products
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] int? categoryId,
            [FromQuery] string? productType,
            [FromQuery] bool? isFeatured,
            [FromQuery] decimal? minPrice,       // Lọc giá tối thiểu
            [FromQuery] decimal? maxPrice,       // Lọc giá tối đa
            [FromQuery] string? material,        // Lọc chất liệu
            [FromQuery] string? color,           // Lọc màu sắc
            [FromQuery] string? search,          // Tìm kiếm text
            [FromQuery] string? sortBy = "newest",  // Sắp xếp
            [FromQuery] decimal? minWidth = null,       // Rộng tối thiểu (cm)
            [FromQuery] decimal? maxWidth = null,       // Rộng tối đa (cm)
            [FromQuery] decimal? minHeight = null,      // Cao tối thiểu (cm)
            [FromQuery] decimal? maxHeight = null,      // Cao tối đa (cm)
            [FromQuery] decimal? minDepth = null,       // Sâu tối thiểu (cm)
            [FromQuery] decimal? maxDepth = null,       // Sâu tối đa (cm)
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Attributes) // Eager loading attributes to prevent N+1 query
                .Where(p => p.IsActive);

            // Lọc theo danh mục (bao gồm cả con cháu)
            if (categoryId.HasValue)
            {
                var categoryIds = await GetAllDescendantCategoryIds(categoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            if (!string.IsNullOrEmpty(productType))
                query = query.Where(p => p.ProductType == productType);

            if (isFeatured.HasValue)
                query = query.Where(p => p.IsFeatured == isFeatured.Value);

            // Lọc giá
            if (minPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.BasePrice) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.DiscountPrice ?? p.BasePrice) <= maxPrice.Value);

            // Lọc chất liệu (case-insensitive contains)
            if (!string.IsNullOrEmpty(material))
                query = query.Where(p => p.Material != null && p.Material.Contains(material));

            // Lọc màu sắc
            if (!string.IsNullOrEmpty(color))
                query = query.Where(p => p.Color != null && p.Color.Contains(color));

            // Lọc kích thước
            if (minWidth.HasValue)
                query = query.Where(p => p.Width >= minWidth.Value);
            if (maxWidth.HasValue)
                query = query.Where(p => p.Width <= maxWidth.Value);

            if (minHeight.HasValue)
                query = query.Where(p => p.Height >= minHeight.Value);
            if (maxHeight.HasValue)
                query = query.Where(p => p.Height <= maxHeight.Value);

            if (minDepth.HasValue)
                query = query.Where(p => p.Depth >= minDepth.Value);
            if (maxDepth.HasValue)
                query = query.Where(p => p.Depth <= maxDepth.Value);

            // Tìm kiếm text (tên, mô tả, thương hiệu)
            if (!string.IsNullOrEmpty(search))
                query = query.Where(p =>
                    p.Name.Contains(search) ||
                    (p.Description != null && p.Description.Contains(search)) ||
                    (p.Brand != null && p.Brand.Contains(search)));

            // Sắp xếp
            query = sortBy switch
            {
                "price_asc"  => query.OrderBy(p => p.DiscountPrice ?? p.BasePrice),
                "price_desc" => query.OrderByDescending(p => p.DiscountPrice ?? p.BasePrice),
                "name"       => query.OrderBy(p => p.Name),
                "popular"    => query.OrderByDescending(p => p.ViewCount),
                _            => query.OrderByDescending(p => p.CreatedAt)  // newest (mặc định)
            };

            var total = await query.CountAsync();
            var products = await query
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
        /// Lấy tất cả category con cháu - dùng IMemoryCache để tránh load toàn bộ DB mỗi request
        /// </summary>
        private async Task<List<int>> GetAllDescendantCategoryIds(int parentCategoryId)
        {
            // Cache danh sách categories trong 5 phút → giảm query DB
            var allCategories = await _cache.GetOrCreateAsync("all_categories_tree", async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                return await _context.Categories
                    .Select(c => new { c.CategoryId, c.ParentId })
                    .ToListAsync();
            });

            var result = new List<int> { parentCategoryId };

            void AddDescendants(int parentId)
            {
                var children = allCategories!.Where(c => c.ParentId == parentId).ToList();
                foreach (var child in children)
                {
                    result.Add(child.CategoryId);
                    AddDescendants(child.CategoryId);
                }
            }

            AddDescendants(parentCategoryId);
            return result;
        }

        // GET: api/products/suggest?keyword=so
        [AllowAnonymous]
        [HttpGet("suggest")]
        public async Task<IActionResult> SuggestProducts([FromQuery] string? keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword) || keyword.Trim().Length < 2)
            {
                return Ok(new { categories = new List<object>(), products = new List<object>() });
            }

            var cleanKeyword = keyword.Trim().ToLower();

            // 1. Query Categories (max 3)
            var matchedCategories = await _context.Categories
                .Where(c => c.IsActive && c.Name.ToLower().Contains(cleanKeyword))
                .OrderBy(c => c.DisplayOrder)
                .Take(3)
                .Select(c => new
                {
                    categoryId = c.CategoryId,
                    name = c.Name,
                    slug = c.Slug
                })
                .ToListAsync();

            // 2. Query Products (max 5)
            var matchedProducts = await _context.Products
                .Include(p => p.Images)
                .Where(p => p.IsActive && p.Name.ToLower().Contains(cleanKeyword))
                .OrderByDescending(p => p.ViewCount)
                .Take(5)
                .Select(p => new
                {
                    productId = p.ProductId,
                    name = p.Name,
                    basePrice = p.BasePrice,
                    discountPrice = p.DiscountPrice,
                    imageUrl = p.Images.OrderBy(i => i.DisplayOrder).Select(i => i.ImageUrl).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(new
            {
                categories = matchedCategories,
                products = matchedProducts
            });
        }

        // GET: api/products/5
        [AllowAnonymous]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            var product = await _productService.GetProductByIdAsync(id);
            if (product == null)
                return NotFound();

            await _productService.IncrementViewCountAsync(id);
            return Ok(product);
        }

        // GET: api/products/featured
        [AllowAnonymous]
        [HttpGet("featured")]
        public async Task<IActionResult> GetFeaturedProducts()
        {
            var products = await _productService.GetFeaturedProductsAsync();
            return Ok(products);
        }

        // GET: api/products/product-types - Lấy tất cả ProductTypes
        [AllowAnonymous]
        [HttpGet("product-types")]
        public async Task<IActionResult> GetAllProductTypes()
        {
            var productTypes = _productFactory.GetAvailableProductTypes();

            return Ok(productTypes);
        }

        // GET: api/products/product-types/by-category/{categoryId} - Lấy ProductTypes theo danh mục
        [AllowAnonymous]
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

        // GET: api/products/colors - Lấy danh sách màu sắc (tùy chọn categoryId)
        [AllowAnonymous]
        [HttpGet("colors")]
        public async Task<IActionResult> GetColors([FromQuery] int? categoryId)
        {
            var query = _context.Products.Where(p => p.IsActive && p.Color != null && p.Color != "");
            
            if (categoryId.HasValue)
            {
                var categoryIds = await GetAllDescendantCategoryIds(categoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            var colors = await query
                .GroupBy(p => p.Color)
                .Select(g => new {
                    color = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.color)
                .ToListAsync();

            return Ok(colors);
        }

        // GET: api/products/materials - Lấy danh sách chất liệu (tùy chọn categoryId)
        [AllowAnonymous]
        [HttpGet("materials")]
        public async Task<IActionResult> GetMaterials([FromQuery] int? categoryId)
        {
            var query = _context.Products.Where(p => p.IsActive && p.Material != null && p.Material != "");
            
            if (categoryId.HasValue)
            {
                var categoryIds = await GetAllDescendantCategoryIds(categoryId.Value);
                query = query.Where(p => categoryIds.Contains(p.CategoryId));
            }

            var materials = await query
                .GroupBy(p => p.Material)
                .Select(g => new {
                    material = g.Key,
                    count = g.Count()
                })
                .OrderBy(x => x.material)
                .ToListAsync();

            return Ok(materials);
        }


        // POST: api/products/configure
        // DECORATOR PATTERN: Calculate price with attributes
        [AllowAnonymous]
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
        [AllowAnonymous]
        [HttpGet("category/{categoryId}")]
        public async Task<IActionResult> GetByCategory(int categoryId)
        {
            var products = await _productService.GetByCategoryAsync(categoryId);
            return Ok(products);
        }

        // POST: api/products - Thêm sản phẩm mới (Admin only)
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [Authorize(Roles = "Admin")]
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
        [AllowAnonymous]
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
        [Authorize(Roles = "Admin")]
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

