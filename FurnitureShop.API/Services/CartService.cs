using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Services
{
    public interface ICartService
    {
        Task<ShoppingCart> GetCartByUserIdAsync(int userId);
        Task<CartItem> AddToCartAsync(int userId, int productId, int quantity, string? selectedAttributes = null);
        Task<CartItem?> UpdateCartItemAsync(int userId, int cartItemId, int quantity);
        Task<bool> RemoveFromCartAsync(int userId, int cartItemId);
        Task<bool> ClearCartAsync(int userId);
        Task<int> GetCartItemCountAsync(int userId);
    }

    public class CartService : ICartService
    {
        private readonly AppDbContext _context;

        public CartService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy giỏ hàng của user (tạo mới nếu chưa có)
        /// </summary>
        public async Task<ShoppingCart> GetCartByUserIdAsync(int userId)
        {
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Images)
                .Include(c => c.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new ShoppingCart
                {
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ShoppingCarts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return cart;
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ hàng
        /// </summary>
        public async Task<CartItem> AddToCartAsync(int userId, int productId, int quantity, string? selectedAttributes = null)
        {
            var cart = await GetCartByUserIdAsync(userId);
            var product = await _context.Products.FindAsync(productId);

            if (product == null)
            {
                throw new ArgumentException("Sản phẩm không tồn tại");
            }

            if (!product.IsActive)
            {
                throw new ArgumentException("Sản phẩm không còn bán");
            }

            if (product.StockQuantity < quantity)
            {
                throw new ArgumentException($"Chỉ còn {product.StockQuantity} sản phẩm trong kho");
            }

            // Kiểm tra sản phẩm đã có trong giỏ chưa
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartId == cart.CartId && ci.ProductId == productId);

            if (existingItem != null)
            {
                // Cập nhật số lượng nếu đã có
                existingItem.Quantity += quantity;
                existingItem.UpdatedAt = DateTime.UtcNow;

                if (existingItem.Quantity > product.StockQuantity)
                {
                    existingItem.Quantity = product.StockQuantity;
                }
            }
            else
            {
                // Thêm mới
                existingItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = productId,
                    Quantity = quantity,
                    UnitPrice = product.DiscountPrice ?? product.BasePrice,
                    SelectedAttributes = selectedAttributes,
                    AddedAt = DateTime.UtcNow
                };
                _context.CartItems.Add(existingItem);
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Load product info
            await _context.Entry(existingItem).Reference(i => i.Product).LoadAsync();

            return existingItem;
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm trong giỏ
        /// </summary>
        public async Task<CartItem?> UpdateCartItemAsync(int userId, int cartItemId, int quantity)
        {
            var cart = await GetCartByUserIdAsync(userId);
            var cartItem = await _context.CartItems
                .Include(ci => ci.Product)
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId && ci.CartId == cart.CartId);

            if (cartItem == null)
            {
                return null;
            }

            if (quantity <= 0)
            {
                _context.CartItems.Remove(cartItem);
            }
            else
            {
                if (quantity > cartItem.Product.StockQuantity)
                {
                    throw new ArgumentException($"Chỉ còn {cartItem.Product.StockQuantity} sản phẩm trong kho");
                }

                cartItem.Quantity = quantity;
                cartItem.UpdatedAt = DateTime.UtcNow;
            }

            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return quantity <= 0 ? null : cartItem;
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ hàng
        /// </summary>
        public async Task<bool> RemoveFromCartAsync(int userId, int cartItemId)
        {
            var cart = await GetCartByUserIdAsync(userId);
            var cartItem = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.CartItemId == cartItemId && ci.CartId == cart.CartId);

            if (cartItem == null)
            {
                return false;
            }

            _context.CartItems.Remove(cartItem);
            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng
        /// </summary>
        public async Task<bool> ClearCartAsync(int userId)
        {
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null || !cart.Items.Any())
            {
                return false;
            }

            _context.CartItems.RemoveRange(cart.Items);
            cart.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        /// <summary>
        /// Đếm số lượng sản phẩm trong giỏ
        /// </summary>
        public async Task<int> GetCartItemCountAsync(int userId)
        {
            var cart = await _context.ShoppingCarts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            return cart?.Items.Sum(i => i.Quantity) ?? 0;
        }
    }
}
