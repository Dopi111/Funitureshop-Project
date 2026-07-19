using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using FurnitureShop.API.Patterns.Decorator;
using System.Text.Json;

namespace FurnitureShop.API.Patterns.Builder
{
    // BUILDER PATTERN: Order Builder
    public class OrderBuilder
    {
        private readonly Order _order;
        private readonly List<OrderDetail> _orderDetails = new();
        private decimal _taxAmount = 0;
        private bool _built = false;

        public OrderBuilder()
        {
            _order = new Order
            {
                OrderNumber = GenerateOrderNumber(),
                CreatedAt = DateTime.UtcNow,
                Status = OrderStatus.Pending
            };
        }

        public OrderBuilder ForUser(int userId, User user)
        {
            _order.UserId = userId;
            return this;
        }

        public OrderBuilder WithShippingInfo(
            string fullName,
            string phone,
            string address,
            string? city = null,
            string? district = null,
            string? ward = null)
        {
            _order.ShippingFullName = fullName;
            _order.ShippingPhone = phone;
            _order.ShippingAddress = address;
            _order.ShippingCity = city;
            _order.ShippingDistrict = district;
            _order.ShippingWard = ward;
            return this;
        }

        public OrderBuilder WithShippingMethod(int shippingMethodId, decimal shippingFee)
        {
            _order.ShippingMethodId = shippingMethodId;
            _order.ShippingFee = shippingFee;
            return this;
        }

        // BUILDER PATTERN: Add product với DECORATOR pattern
        public OrderBuilder AddProduct(
            Product product,
            int quantity,
            List<ProductAttribute>? selectedAttributes = null)
        {
            // Sử dụng Decorator để tính giá với attributes
            var decoratedBuilder = new DecoratedProductBuilder(product);

            if (selectedAttributes != null && selectedAttributes.Any())
            {
                decoratedBuilder.WithAttributes(selectedAttributes);
            }

            var decoratedProduct = decoratedBuilder.Build();
            var finalPrice = decoratedProduct.GetPrice();
            var attributesAdjustment = selectedAttributes?.Sum(a => a.PriceAdjustment) ?? 0;

            var orderDetail = new OrderDetail
            {
                ProductId = product.ProductId,
                ProductName = product.Name,
                ProductSKU = product.SKU,
                UnitPrice = product.DiscountPrice ?? product.BasePrice,
                Quantity = quantity,
                SelectedAttributes = selectedAttributes != null && selectedAttributes.Any()
                    ? JsonSerializer.Serialize(selectedAttributes.Select(a => new
                    {
                        a.AttributeId,
                        a.AttributeName,
                        a.AttributeValue,
                        a.PriceAdjustment
                    }))
                    : null,
                AttributesAdjustment = attributesAdjustment,
                TotalPrice = finalPrice * quantity
            };

            _orderDetails.Add(orderDetail);
            return this;
        }

        public OrderBuilder WithPaymentMethod(string paymentMethod)
        {
            _order.PaymentMethod = paymentMethod;
            return this;
        }

        public OrderBuilder WithNotes(string? notes)
        {
            _order.Notes = notes;
            return this;
        }

        public OrderBuilder WithTax(decimal taxAmount)
        {
            _taxAmount = taxAmount;
            return this;
        }

        public OrderBuilder WithInstallation(bool requireInstallation, decimal installationFee)
        {
            _order.RequireInstallation = requireInstallation;
            _order.InstallationFee = requireInstallation ? installationFee : 0;
            return this;
        }

        public OrderBuilder MarkAsPaid(DateTime? paidAt = null)
        {
            _order.IsPaid = true;
            _order.PaidAt = paidAt ?? DateTime.UtcNow;
            return this;
        }

        // BUILDER PATTERN: Build final order
        public Order Build()
        {
            if (_built)
                throw new InvalidOperationException("Build() has already been called on this builder");

            if (_order.UserId == 0)
                throw new InvalidOperationException("Order must have a user");

            if (!_orderDetails.Any())
                throw new InvalidOperationException("Order must have at least one product");

            if (string.IsNullOrEmpty(_order.ShippingFullName) ||
                string.IsNullOrEmpty(_order.ShippingPhone) ||
                string.IsNullOrEmpty(_order.ShippingAddress))
                throw new InvalidOperationException("Shipping information is incomplete");

            // Calculate totals
            _order.SubTotal = _orderDetails.Sum(od => od.TotalPrice);
            _order.TotalAmount = _order.SubTotal + _taxAmount + _order.ShippingFee + _order.InstallationFee;

            // Add order details
            foreach (var detail in _orderDetails)
            {
                _order.OrderDetails.Add(detail);
            }

            // Add initial status history
            _order.StatusHistories.Add(new OrderStatusHistory
            {
                FromStatus = OrderStatus.Pending,
                ToStatus = OrderStatus.Pending,
                Notes = "Đơn hàng được tạo",
                ChangedBy = "System"
            });

            _built = true;
            return _order;
        }

        private string GenerateOrderNumber()
        {
            var now = DateTime.UtcNow;
            // Random.Shared an toàn với concurrency, tránh trùng lặp hơn new Random()
            return $"ORD{now:yyyyMMdd}{now:HHmmss}{Random.Shared.Next(100, 999)}";
        }
    }

    // BUILDER PATTERN: Fluent interface example
    public static class OrderBuilderExtensions
    {
        public static OrderBuilder CreateOrder(this User user)
        {
            return new OrderBuilder().ForUser(user.UserId, user);
        }
    }
}

// DTOs for Builder Pattern
namespace FurnitureShop.API.DTOs
{
    public class CreateOrderRequest
    {
        public int UserId { get; set; }
        
        public ShippingInfoDto ShippingInfo { get; set; } = new();
        
        public List<OrderItemDto> Items { get; set; } = new();
        
        public int? ShippingMethodId { get; set; }
        
        public string PaymentMethod { get; set; } = "COD";
        
        public string? Notes { get; set; }
        
        public bool RequireInstallation { get; set; } = false;
    }

    public class ShippingInfoDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
    }

    public class OrderItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public List<int> SelectedAttributeIds { get; set; } = new();
    }
}