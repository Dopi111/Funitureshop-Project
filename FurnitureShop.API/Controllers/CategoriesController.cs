using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly CategoryService _categoryService;
        private readonly AppDbContext _context;
        // SINGLETON PATTERN: Sử dụng Logger Service duy nhất
        private readonly ILoggerService _logger = LoggerService.Instance;

        public CategoriesController(CategoryService categoryService, AppDbContext context)
        {
            _categoryService = categoryService;
            _context = context;
            _logger.LogInfo($"CategoriesController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        // GET: api/categories
        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _categoryService.GetRootCategoriesAsync();
            return Ok(categories);
        }

        // GET: api/categories/all - Get all categories (for admin)
        [HttpGet("all")]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _context.Categories
                .Include(c => c.Children)
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .ToListAsync();
            return Ok(categories);
        }

        // GET: api/categories/tree
        // COMPOSITE PATTERN: Category tree
        [HttpGet("tree")]
        public async Task<IActionResult> GetCategoryTree()
        {
            var tree = await _categoryService.GetCategoryTreeAsync();
            return Ok(tree);
        }

        // GET: api/categories/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Children)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });

            return Ok(category);
        }

        // GET: api/categories/by-slug/{slug}
        [HttpGet("by-slug/{slug}")]
        public async Task<IActionResult> GetCategoryBySlug(string slug)
        {
            var category = await _context.Categories
                .Include(c => c.Children)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Slug == slug);

            if (category == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });

            return Ok(category);
        }

        // POST: api/categories - Create new category
        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if slug already exists
            if (!string.IsNullOrEmpty(dto.Slug))
            {
                var existingSlug = await _context.Categories.AnyAsync(c => c.Slug == dto.Slug);
                if (existingSlug)
                    return BadRequest(new { message = "Slug đã tồn tại" });
            }

            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                Slug = dto.Slug ?? GenerateSlug(dto.Name),
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
                ImageUrl = dto.ImageUrl,
                ParentId = dto.ParentId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategory), new { id = category.CategoryId }, category);
        }

        // PUT: api/categories/{id} - Update category
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });

            // Check if slug already exists (excluding current category)
            if (!string.IsNullOrEmpty(dto.Slug))
            {
                var existingSlug = await _context.Categories
                    .AnyAsync(c => c.Slug == dto.Slug && c.CategoryId != id);
                if (existingSlug)
                    return BadRequest(new { message = "Slug đã tồn tại" });
            }

            // Prevent circular parent reference
            if (dto.ParentId == id)
                return BadRequest(new { message = "Danh mục không thể là danh mục cha của chính nó" });

            category.Name = dto.Name;
            category.Description = dto.Description;
            category.Slug = dto.Slug ?? GenerateSlug(dto.Name);
            category.DisplayOrder = dto.DisplayOrder;
            category.IsActive = dto.IsActive;
            category.ImageUrl = dto.ImageUrl;
            category.ParentId = dto.ParentId;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(category);
        }

        // DELETE: api/categories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Children)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.CategoryId == id);

            if (category == null)
                return NotFound(new { message = "Không tìm thấy danh mục" });

            // Check if category has children
            if (category.Children?.Any() == true)
                return BadRequest(new { message = "Không thể xóa danh mục có danh mục con" });

            // Check if category has products
            if (category.Products?.Any() == true)
                return BadRequest(new { message = "Không thể xóa danh mục đang có sản phẩm" });

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/categories/{id}/upload-image - Upload ảnh cho danh mục
        [HttpPost("{id}/upload-image")]
        public async Task<IActionResult> UploadCategoryImage(int id, IFormFile file)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy danh mục" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "Vui lòng chọn file ảnh" });
            }

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { success = false, message = "Chỉ cho phép file ảnh: jpg, jpeg, png, gif, webp" });
            }

            // Validate file size (max 5MB)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { success = false, message = "Kích thước file tối đa là 5MB" });
            }

            try
            {
                // Create categories folder if not exists
                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "categories");
                if (!Directory.Exists(uploadPath))
                {
                    Directory.CreateDirectory(uploadPath);
                }

                // Delete old image if exists
                if (!string.IsNullOrEmpty(category.ImageUrl))
                {
                    var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", category.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        System.IO.File.Delete(oldFilePath);
                    }
                }

                // Generate unique filename
                var uniqueFileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadPath, uniqueFileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Update category ImageUrl
                var imageUrl = $"/images/categories/{uniqueFileName}";
                category.ImageUrl = imageUrl;
                category.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Upload ảnh thành công", imageUrl = imageUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi upload ảnh: {ex.Message}" });
            }
        }

        // DELETE: api/categories/{id}/image - Xóa ảnh danh mục
        [HttpDelete("{id}/image")]
        public async Task<IActionResult> DeleteCategoryImage(int id)
        {
            var category = await _context.Categories.FindAsync(id);
            if (category == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy danh mục" });
            }

            if (string.IsNullOrEmpty(category.ImageUrl))
            {
                return BadRequest(new { success = false, message = "Danh mục không có ảnh" });
            }

            try
            {
                // Delete file
                var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", category.ImageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                // Clear ImageUrl
                category.ImageUrl = null;
                category.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = "Đã xóa ảnh thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Lỗi xóa ảnh: {ex.Message}" });
            }
        }

        private string GenerateSlug(string name)
        {
            return name.ToLower()
                .Normalize(System.Text.NormalizationForm.FormD)
                .Where(c => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
                .Aggregate("", (current, c) => current + c)
                .Replace("đ", "d")
                .Replace("Đ", "D")
                .Replace(" ", "-")
                .Replace("--", "-")
                .Trim('-');
        }
    }

    // DTO for Category
    public class CategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Slug { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public string? ImageUrl { get; set; }
        public int? ParentId { get; set; }
    }
}
