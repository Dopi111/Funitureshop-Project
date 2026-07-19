using FurnitureShop.API.Data;
using FurnitureShop.API.Patterns.Repository.Contracts;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Patterns.Repository.Implementations
{
    public class OrderRepository : GenericRepository<Order>, IOrderRepository
    {
        public OrderRepository(AppDbContext context) : base(context)
        {
        }

        public override async Task<Order?> GetByIdAsync(int id)
        {
            return await _dbSet
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .Include(o => o.ShippingMethod)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == id);
        }

        public async Task<IEnumerable<Order>> GetByUserAsync(int userId)
        {
            return await _dbSet
                .Include(o => o.OrderDetails)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<Order?> GetByOrderNumberAsync(string orderNumber)
        {
            return await _dbSet
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                    .ThenInclude(od => od.Product)
                .Include(o => o.ShippingMethod)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
        }
    }
}
