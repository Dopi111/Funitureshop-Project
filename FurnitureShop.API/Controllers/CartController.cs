using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;
        private readonly Microsoft.Extensions.Logging.ILogger<CartController> _aspLogger;
        // SINGLETON PATTERN: Sử dụng Logger Service duy nhất
        private readonly ILoggerService _logger = LoggerService.Instance;

        public CartController(ICartService cartService, Microsoft.Extensions.Logging.ILogger<CartController> logger)
        {
            _cartService = cartService;
            _aspLogger = logger;
            _logger.LogInfo($"CartController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        /// <summary>
        /// Lấy giỏ hàng của user hiện tại
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCart([FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { success = false, message = "UserId không hợp lệ" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        cartId = cart.CartId,
                        userId = cart.UserId,
                        items = cart.Items.Select(i => new
                        {
                            cartItemId = i.CartItemId,
                            productId = i.ProductId,
                            productName = i.Product?.Name,
                            productImage = i.Product?.Images?.FirstOrDefault()?.ImageUrl,
                            productSlug = i.Product?.Slug,
                            categoryName = i.Product?.Category?.Name,
                            quantity = i.Quantity,
                            unitPrice = i.UnitPrice,
                            originalPrice = i.Product?.BasePrice,
                            subtotal = i.Subtotal,
                            stockQuantity = i.Product?.StockQuantity ?? 0,
                            addedAt = i.AddedAt
                        }),
                        totalItems = cart.TotalItems,
                        totalAmount = cart.TotalAmount,
                        updatedAt = cart.UpdatedAt
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting cart for user {userId}", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi tải giỏ hàng" });
            }
        }

        /// <summary>
        /// Thêm sản phẩm vào giỏ hàng
        /// </summary>
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            try
            {
                if (request.UserId <= 0)
                {
                    return BadRequest(new { success = false, message = "UserId không hợp lệ" });
                }

                if (request.ProductId <= 0)
                {
                    return BadRequest(new { success = false, message = "ProductId không hợp lệ" });
                }

                if (request.Quantity <= 0)
                {
                    return BadRequest(new { success = false, message = "Số lượng phải lớn hơn 0" });
                }

                var cartItem = await _cartService.AddToCartAsync(
                    request.UserId,
                    request.ProductId,
                    request.Quantity,
                    request.SelectedAttributes
                );

                var cart = await _cartService.GetCartByUserIdAsync(request.UserId);

                return Ok(new
                {
                    success = true,
                    message = "Đã thêm sản phẩm vào giỏ hàng",
                    data = new
                    {
                        cartItemId = cartItem.CartItemId,
                        productId = cartItem.ProductId,
                        productName = cartItem.Product?.Name,
                        quantity = cartItem.Quantity,
                        unitPrice = cartItem.UnitPrice,
                        subtotal = cartItem.Subtotal
                    },
                    cartSummary = new
                    {
                        totalItems = cart.TotalItems,
                        totalAmount = cart.TotalAmount
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error adding to cart", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi thêm vào giỏ hàng" });
            }
        }

        /// <summary>
        /// Cập nhật số lượng sản phẩm trong giỏ
        /// </summary>
        [HttpPut("update")]
        public async Task<IActionResult> UpdateCartItem([FromBody] UpdateCartItemRequest request)
        {
            try
            {
                if (request.UserId <= 0)
                {
                    return BadRequest(new { success = false, message = "UserId không hợp lệ" });
                }

                var cartItem = await _cartService.UpdateCartItemAsync(
                    request.UserId,
                    request.CartItemId,
                    request.Quantity
                );

                var cart = await _cartService.GetCartByUserIdAsync(request.UserId);

                if (request.Quantity <= 0)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Đã xóa sản phẩm khỏi giỏ hàng",
                        cartSummary = new
                        {
                            totalItems = cart.TotalItems,
                            totalAmount = cart.TotalAmount
                        }
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Đã cập nhật số lượng",
                    data = cartItem != null ? new
                    {
                        cartItemId = cartItem.CartItemId,
                        quantity = cartItem.Quantity,
                        subtotal = cartItem.Subtotal
                    } : null,
                    cartSummary = new
                    {
                        totalItems = cart.TotalItems,
                        totalAmount = cart.TotalAmount
                    }
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error updating cart item", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi cập nhật giỏ hàng" });
            }
        }

        /// <summary>
        /// Xóa sản phẩm khỏi giỏ hàng
        /// </summary>
        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId, [FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { success = false, message = "UserId không hợp lệ" });
                }

                var result = await _cartService.RemoveFromCartAsync(userId, cartItemId);

                if (!result)
                {
                    return NotFound(new { success = false, message = "Không tìm thấy sản phẩm trong giỏ hàng" });
                }

                var cart = await _cartService.GetCartByUserIdAsync(userId);

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa sản phẩm khỏi giỏ hàng",
                    cartSummary = new
                    {
                        totalItems = cart.TotalItems,
                        totalAmount = cart.TotalAmount
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error removing from cart", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa sản phẩm" });
            }
        }

        /// <summary>
        /// Xóa toàn bộ giỏ hàng
        /// </summary>
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart([FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { success = false, message = "UserId không hợp lệ" });
                }

                await _cartService.ClearCartAsync(userId);

                return Ok(new
                {
                    success = true,
                    message = "Đã xóa toàn bộ giỏ hàng",
                    cartSummary = new
                    {
                        totalItems = 0,
                        totalAmount = 0
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error clearing cart", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa giỏ hàng" });
            }
        }

        /// <summary>
        /// Đếm số lượng sản phẩm trong giỏ
        /// </summary>
        [HttpGet("count")]
        public async Task<IActionResult> GetCartItemCount([FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return Ok(new { success = true, count = 0 });
                }

                var count = await _cartService.GetCartItemCountAsync(userId);

                return Ok(new { success = true, count });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error getting cart count", ex);
                return Ok(new { success = true, count = 0 });
            }
        }
    }

    // Request DTOs
    public class AddToCartRequest
    {
        public int UserId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? SelectedAttributes { get; set; }
    }

    public class UpdateCartItemRequest
    {
        public int UserId { get; set; }
        public int CartItemId { get; set; }
        public int Quantity { get; set; }
    }
}
