using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Decorator
{
    // DECORATOR PATTERN: Component interface
    public interface IProductComponent
    {
        string GetName();
        decimal GetPrice();
        string GetDescription();
    }

    // DECORATOR PATTERN: Concrete Component (Sản phẩm cơ bản)
    public class BaseProduct : IProductComponent
    {
        protected readonly Product _product;

        public BaseProduct(Product product)
        {
            _product = product;
        }

        public virtual string GetName() => _product.Name;

        public virtual decimal GetPrice()
        {
            return _product.DiscountPrice ?? _product.BasePrice;
        }

        public virtual string GetDescription() => _product.Description ?? string.Empty;
    }

    // DECORATOR PATTERN: Base Decorator
    public abstract class ProductAttributeDecorator : IProductComponent
    {
        protected readonly IProductComponent _product;
        protected readonly ProductAttribute _attribute;

        protected ProductAttributeDecorator(IProductComponent product, ProductAttribute attribute)
        {
            _product = product;
            _attribute = attribute;
        }

        public virtual string GetName()
        {
            return $"{_product.GetName()} - {_attribute.AttributeValue}";
        }

        public virtual decimal GetPrice()
        {
            return _product.GetPrice() + _attribute.PriceAdjustment;
        }

        public virtual string GetDescription()
        {
            return $"{_product.GetDescription()}\n+ {_attribute.AttributeName}: {_attribute.AttributeValue}";
        }
    }

    // DECORATOR PATTERN: Concrete Decorators
    public class ColorDecorator : ProductAttributeDecorator
    {
        public ColorDecorator(IProductComponent product, ProductAttribute colorAttribute)
            : base(product, colorAttribute)
        {
        }

        public override string GetDescription()
        {
            return $"{_product.GetDescription()}\n✓ Màu sắc: {_attribute.AttributeValue} (+{_attribute.PriceAdjustment:N0}đ)";
        }
    }

    public class MaterialDecorator : ProductAttributeDecorator
    {
        public MaterialDecorator(IProductComponent product, ProductAttribute materialAttribute)
            : base(product, materialAttribute)
        {
        }

        public override string GetDescription()
        {
            return $"{_product.GetDescription()}\n✓ Chất liệu: {_attribute.AttributeValue} (+{_attribute.PriceAdjustment:N0}đ)";
        }
    }

    public class CustomizationDecorator : ProductAttributeDecorator
    {
        public CustomizationDecorator(IProductComponent product, ProductAttribute customAttribute)
            : base(product, customAttribute)
        {
        }

        public override string GetDescription()
        {
            return $"{_product.GetDescription()}\n✓ Tùy chỉnh: {_attribute.AttributeValue} (+{_attribute.PriceAdjustment:N0}đ)";
        }
    }

    // DECORATOR PATTERN: Discount Decorator - Giảm giá theo %
    public class DiscountDecorator : IProductComponent
    {
        private readonly IProductComponent _product;
        private readonly decimal _discountPercent;
        private readonly string _discountLabel;

        public DiscountDecorator(IProductComponent product, decimal discountPercent, string discountLabel = "Khuyến mãi")
        {
            _product = product;
            _discountPercent = Math.Clamp(discountPercent, 0, 100);
            _discountLabel = discountLabel;
        }

        public string GetName() => _product.GetName();
        public decimal GetPrice() => _product.GetPrice() * (1 - _discountPercent / 100);
        public decimal GetDiscountAmount() => _product.GetPrice() * (_discountPercent / 100);
        public string GetDescription()
            => $"{_product.GetDescription()}\n🏷️ {_discountLabel}: -{_discountPercent}%";
    }

    // DECORATOR PATTERN: Tax Decorator - Thuế VAT
    public class TaxDecorator : IProductComponent
    {
        private readonly IProductComponent _product;
        private readonly decimal _taxPercent;

        public TaxDecorator(IProductComponent product, decimal taxPercent = 10)
        {
            _product = product;
            _taxPercent = taxPercent;
        }

        public string GetName() => _product.GetName();
        public decimal GetPrice() => _product.GetPrice() * (1 + _taxPercent / 100);
        public decimal GetTaxAmount() => _product.GetPrice() * (_taxPercent / 100);
        public string GetDescription()
            => $"{_product.GetDescription()}\n📋 VAT {_taxPercent}%: +{GetTaxAmount():N0}đ";
    }

    // DECORATOR PATTERN: Builder để tạo decorated product
    public class DecoratedProductBuilder
    {
        private IProductComponent _product;
        private readonly Product _baseProduct;
        private readonly List<ProductAttribute> _selectedAttributes = new();
        private decimal _discountPercent = 0;
        private string _discountLabel = "Khuyến mãi";
        private decimal _taxPercent = 0;

        public DecoratedProductBuilder(Product baseProduct)
        {
            _baseProduct = baseProduct;
            _product = new BaseProduct(baseProduct);
        }

        public DecoratedProductBuilder WithAttribute(ProductAttribute attribute)
        {
            _selectedAttributes.Add(attribute);

            // Apply decorator dựa vào loại attribute
            _product = attribute.AttributeName.ToLower() switch
            {
                "color" or "màu sắc" => new ColorDecorator(_product, attribute),
                "material" or "chất liệu" or "vật liệu" => new MaterialDecorator(_product, attribute),
                _ => new CustomizationDecorator(_product, attribute)
            };

            return this;
        }

        public DecoratedProductBuilder WithAttributes(IEnumerable<ProductAttribute> attributes)
        {
            foreach (var attr in attributes)
            {
                WithAttribute(attr);
            }
            return this;
        }

        // Áp dụng giảm giá theo % (coupon, promotion, v.v.)
        public DecoratedProductBuilder WithDiscount(decimal discountPercent, string label = "Khuyến mãi")
        {
            _discountPercent = discountPercent;
            _discountLabel = label;
            return this;
        }

        // Áp dụng thuế VAT
        public DecoratedProductBuilder WithTax(decimal taxPercent = 10)
        {
            _taxPercent = taxPercent;
            return this;
        }

        public IProductComponent Build()
        {
            IProductComponent result = _product;
            if (_discountPercent > 0)
                result = new DiscountDecorator(result, _discountPercent, _discountLabel);
            if (_taxPercent > 0)
                result = new TaxDecorator(result, _taxPercent);
            return result;
        }

        // Trả về bảng chi tiết giá từng bước
        public PriceBreakdown GetPriceBreakdown()
        {
            var originalPrice = _baseProduct.BasePrice;
            var productDiscountAmount = _baseProduct.BasePrice - (_baseProduct.DiscountPrice ?? _baseProduct.BasePrice);
            var priceAfterProductDiscount = _baseProduct.DiscountPrice ?? _baseProduct.BasePrice;

            var attributesAdjustment = _selectedAttributes.Sum(a => a.PriceAdjustment);
            var priceAfterAttributes = priceAfterProductDiscount + attributesAdjustment;

            var additionalDiscountAmount = priceAfterAttributes * (_discountPercent / 100);
            var priceAfterDiscount = priceAfterAttributes - additionalDiscountAmount;

            var taxAmount = priceAfterDiscount * (_taxPercent / 100);
            var finalUnitPrice = priceAfterDiscount + taxAmount;

            return new PriceBreakdown
            {
                OriginalPrice = originalPrice,
                ProductDiscountAmount = productDiscountAmount,
                PriceAfterProductDiscount = priceAfterProductDiscount,
                AttributesAdjustment = attributesAdjustment,
                PriceAfterAttributes = priceAfterAttributes,
                AdditionalDiscountPercent = _discountPercent,
                AdditionalDiscountAmount = additionalDiscountAmount,
                AdditionalDiscountLabel = _discountLabel,
                PriceAfterDiscount = priceAfterDiscount,
                TaxPercent = _taxPercent,
                TaxAmount = taxAmount,
                FinalUnitPrice = finalUnitPrice
            };
        }

        public decimal GetFinalPrice() => Build().GetPrice();

        public string GetFullDescription() => Build().GetDescription();

        public List<ProductAttribute> GetSelectedAttributes() => _selectedAttributes;
    }
}

// DTOs for Decorator Pattern
namespace FurnitureShop.API.DTOs
{
    public class ProductConfigurationRequest
    {
        public int ProductId { get; set; }
        public List<int> SelectedAttributeIds { get; set; } = new();
    }

    public class ProductConfigurationResponse
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public decimal BasePrice { get; set; }
        public List<AttributeDto> SelectedAttributes { get; set; } = new();
        public decimal TotalAdjustment { get; set; }
        public decimal FinalPrice { get; set; }
        public string FullDescription { get; set; } = string.Empty;
    }

    public class AttributeDto
    {
        public int AttributeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public decimal PriceAdjustment { get; set; }
    }

    // Bảng chi tiết giá của một sản phẩm (đơn vị)
    public class PriceBreakdown
    {
        public decimal OriginalPrice { get; set; }              // Giá gốc (BasePrice)
        public decimal ProductDiscountAmount { get; set; }      // Giảm giá sẵn có trên sản phẩm
        public decimal PriceAfterProductDiscount { get; set; }  // Giá sau giảm sản phẩm (DiscountPrice)
        public decimal AttributesAdjustment { get; set; }       // Phụ phí các ProductDecorator (màu, chất liệu…)
        public decimal PriceAfterAttributes { get; set; }       // Giá sau khi cộng attributes
        public decimal AdditionalDiscountPercent { get; set; }  // % giảm thêm (coupon, promotion)
        public decimal AdditionalDiscountAmount { get; set; }   // Số tiền giảm thêm
        public string AdditionalDiscountLabel { get; set; } = "";
        public decimal PriceAfterDiscount { get; set; }         // Giá sau tất cả giảm giá
        public decimal TaxPercent { get; set; }                 // % thuế VAT
        public decimal TaxAmount { get; set; }                  // Tiền thuế
        public decimal FinalUnitPrice { get; set; }             // Đơn giá cuối cùng
    }
}