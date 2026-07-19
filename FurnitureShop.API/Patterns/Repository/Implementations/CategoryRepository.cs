using FurnitureShop.API.Data;
using FurnitureShop.API.Patterns.Repository.Contracts;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Patterns.Repository.Implementations
{
    public class CategoryRepository : GenericRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<Category?> GetByIdAsync(int id)
        {
            return await _dbSet
                .Include(c => c.Children)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.CategoryId == id);
        }

        public async Task<IEnumerable<Category>> GetRootCategoriesAsync()
        {
            return await _dbSet
                .Include(c => c.Children)
                .Where(c => c.IsActive && c.ParentId == null)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();
        }

        public async Task<IEnumerable<Category>> GetChildrenAsync(int parentId)
        {
            return await _dbSet
                .Where(c => c.ParentId == parentId && c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();
        }
    }
}
