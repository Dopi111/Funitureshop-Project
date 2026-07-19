using FurnitureShop.API.Data;
using FurnitureShop.API.Patterns.Repository.Contracts;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Patterns.Repository.Implementations
{
    public class ProductRepository : GenericRepository<Product>, IProductRepository
    {
        public ProductRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<Product?> GetByIdAsync(int id)
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.Collection)
                .Include(p => p.Images)
                .Include(p => p.Attributes)
                .FirstOrDefaultAsync(p => p.ProductId == id);
        }

        public async Task<IEnumerable<Product>> GetFeaturedProductsAsync(int count = 8)
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsFeatured && p.IsActive)
                .OrderByDescending(p => p.ViewCount)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId)
        {
            return await _dbSet
                .Include(p => p.Images)
                .Where(p => p.CategoryId == categoryId && p.IsActive)
                .ToListAsync();
        }

        public async Task<Product?> GetBySlugAsync(string slug)
        {
            return await _dbSet
                .Include(p => p.Category)
                .Include(p => p.Collection)
                .Include(p => p.Images)
                .Include(p => p.Attributes)
                .FirstOrDefaultAsync(p => p.Slug == slug && p.IsActive);
        }
    }
}
