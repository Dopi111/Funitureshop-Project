using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Factory
{
    // FACTORY METHOD PATTERN: Product interface
    public interface IFurnitureProduct
    {
        string GetProductType();
        string GetDescription();
        decimal CalculateShippingWeight();
        List<string> GetRequiredAttributes();
        bool ValidateDimensions(decimal? width, decimal? height, decimal? depth);
    }

    // FACTORY METHOD PATTERN: Abstract Creator
    public abstract class FurnitureProductCreator
    {
        public abstract IFurnitureProduct CreateProduct(Product product);

        // Template method
        public Product BuildProduct(Product baseProduct)
        {
            var furnitureProduct = CreateProduct(baseProduct);
            
            // Validate dimensions
            if (!furnitureProduct.ValidateDimensions(
                baseProduct.Width, baseProduct.Height, baseProduct.Depth))
            {
                throw new ArgumentException($"Invalid dimensions for {furnitureProduct.GetProductType()}");
            }

            return baseProduct;
        }
    }

    // FACTORY METHOD PATTERN: Concrete Products
    public class TableProduct : IFurnitureProduct
    {
        private readonly Product _product;

        public TableProduct(Product product)
        {
            _product = product;
            _product.ProductType = "Table";
        }

        public string GetProductType() => "Bàn";

        public string GetDescription() =>
            $"Bàn {_product.Name} - Kích thước: {_product.Width}x{_product.Depth}x{_product.Height}cm";

        public decimal CalculateShippingWeight()
        {
            // Bàn thường nặng, ước tính dựa trên thể tích
            var volume = _product.CalculateVolume();
            return volume * 200; // 200kg/m³ (gỗ trung bình)
        }

        public List<string> GetRequiredAttributes() =>
            new() { "Material", "Color", "TableTop Type" };

        public bool ValidateDimensions(decimal? width, decimal? height, decimal? depth)
        {
            // Bàn phải có chiều rộng và sâu hợp lý
            return width.HasValue && width > 50 && width < 300 &&
                   depth.HasValue && depth > 50 && depth < 200 &&
                   height.HasValue && height > 40 && height < 120;
        }
    }

    public class ChairProduct : IFurnitureProduct
    {
        private readonly Product _product;

        public ChairProduct(Product product)
        {
            _product = product;
            _product.ProductType = "Chair";
        }

        public string GetProductType() => "Ghế";

        public string GetDescription() =>
            $"Ghế {_product.Name} - Chiều cao: {_product.Height}cm";

        public decimal CalculateShippingWeight()
        {
            var volume = _product.CalculateVolume();
            return volume * 150; // 150kg/m³ (ghế nhẹ hơn bàn)
        }

        public List<string> GetRequiredAttributes() =>
            new() { "Material", "Color", "Cushion Type", "Armrest" };

        public bool ValidateDimensions(decimal? width, decimal? height, decimal? depth)
        {
            return width.HasValue && width > 30 && width < 100 &&
                   height.HasValue && height > 60 && height < 150 &&
                   depth.HasValue && depth > 30 && depth < 100;
        }
    }

    public class SofaProduct : IFurnitureProduct
    {
        private readonly Product _product;

        public SofaProduct(Product product)
        {
            _product = product;
            _product.ProductType = "Sofa";
        }

        public string GetProductType() => "Sofa";

        public string GetDescription() =>
            $"Sofa {_product.Name} - {_product.Width}cm ({GetSeatingCapacity()} chỗ ngồi)";

        public decimal CalculateShippingWeight()
        {
            var volume = _product.CalculateVolume();
            return volume * 180; // 180kg/m³
        }

        public List<string> GetRequiredAttributes() =>
            new() { "Fabric", "Color", "Cushion Firmness", "Leg Style" };

        public bool ValidateDimensions(decimal? width, decimal? height, decimal? depth)
        {
            return width.HasValue && width > 120 && width < 400 &&
                   height.HasValue && height > 60 && height < 120 &&
                   depth.HasValue && depth > 70 && depth < 150;
        }

        private string GetSeatingCapacity()
        {
            if (!_product.Width.HasValue) return "N/A";
            
            if (_product.Width < 160) return "2";
            if (_product.Width < 220) return "3";
            return "4+";
        }
    }

    public class BedProduct : IFurnitureProduct
    {
        private readonly Product _product;

        public BedProduct(Product product)
        {
            _product = product;
            _product.ProductType = "Bed";
        }

        public string GetProductType() => "Giường";

        public string GetDescription() =>
            $"Giường {_product.Name} - Size: {GetBedSize()}";

        public decimal CalculateShippingWeight()
        {
            var volume = _product.CalculateVolume();
            return volume * 250; // 250kg/m³ (giường nặng)
        }

        public List<string> GetRequiredAttributes() =>
            new() { "Material", "Color", "Mattress Included", "Storage" };

        public bool ValidateDimensions(decimal? width, decimal? height, decimal? depth)
        {
            return width.HasValue && width > 90 && width < 220 &&
                   depth.HasValue && depth > 180 && depth < 220 &&
                   height.HasValue && height > 30 && height < 150;
        }

        private string GetBedSize()
        {
            if (!_product.Width.HasValue) return "N/A";
            
            return _product.Width switch
            {
                < 100 => "Single (90cm)",
                < 130 => "Twin (120cm)",
                < 150 => "Queen (140cm)",
                < 170 => "King (160cm)",
                _ => "Super King (180cm+)"
            };
        }
    }

    // FACTORY METHOD PATTERN: Concrete Creators
    public class TableCreator : FurnitureProductCreator
    {
        public override IFurnitureProduct CreateProduct(Product product)
        {
            return new TableProduct(product);
        }
    }

    public class ChairCreator : FurnitureProductCreator
    {
        public override IFurnitureProduct CreateProduct(Product product)
        {
            return new ChairProduct(product);
        }
    }

    public class SofaCreator : FurnitureProductCreator
    {
        public override IFurnitureProduct CreateProduct(Product product)
        {
            return new SofaProduct(product);
        }
    }

    public class BedCreator : FurnitureProductCreator
    {
        public override IFurnitureProduct CreateProduct(Product product)
        {
            return new BedProduct(product);
        }
    }

    // FACTORY METHOD PATTERN: Factory class
    public class ProductFactory
    {
        private readonly Dictionary<string, FurnitureProductCreator> _creators = new()
        {
            { "Table", new TableCreator() },
            { "Chair", new ChairCreator() },
            { "Sofa", new SofaCreator() },
            { "Bed", new BedCreator() }
        };

        public IFurnitureProduct CreateProduct(Product product)
        {
            if (string.IsNullOrEmpty(product.ProductType))
            {
                throw new ArgumentException("Product type is required");
            }

            if (!_creators.ContainsKey(product.ProductType))
            {
                throw new ArgumentException($"Unknown product type: {product.ProductType}");
            }

            var creator = _creators[product.ProductType];
            return creator.CreateProduct(product);
        }

        public Product BuildProduct(string productType, Product baseProduct)
        {
            baseProduct.ProductType = productType;
            
            if (!_creators.ContainsKey(productType))
            {
                throw new ArgumentException($"Unknown product type: {productType}");
            }

            var creator = _creators[productType];
            return creator.BuildProduct(baseProduct);
        }

        public List<string> GetAvailableProductTypes()
        {
            return _creators.Keys.ToList();
        }
    }
}