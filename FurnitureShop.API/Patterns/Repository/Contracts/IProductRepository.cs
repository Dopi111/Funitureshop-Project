using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Repository.Contracts
{
    // Specific repository interfaces extending generic
    public interface IProductRepository : IRepository<Product>
    {
        Task<IEnumerable<Product>> GetFeaturedProductsAsync(int count = 8);
        Task<IEnumerable<Product>> GetByCategoryAsync(int categoryId);
        Task<Product?> GetBySlugAsync(string slug);
    }

    public interface ICategoryRepository : IRepository<Category>
    {
        Task<IEnumerable<Category>> GetRootCategoriesAsync();
        Task<IEnumerable<Category>> GetChildrenAsync(int parentId);
    }

    public interface IOrderRepository : IRepository<Order>
    {
        Task<IEnumerable<Order>> GetByUserAsync(int userId);
        Task<Order?> GetByOrderNumberAsync(string orderNumber);
    }
}
