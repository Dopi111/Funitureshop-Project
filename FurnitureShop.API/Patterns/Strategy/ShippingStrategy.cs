using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Strategy
{
    // STRATEGY PATTERN: Context data
    public class ShippingContext
    {
        public string DestinationCity { get; set; } = string.Empty;
        public string DestinationDistrict { get; set; } = string.Empty;
        public decimal TotalWeight { get; set; } // kg
        public decimal TotalVolume { get; set; } // m³
        public decimal Distance { get; set; } = 0; // km
        public int ItemCount { get; set; }
    }

    // STRATEGY PATTERN: Strategy interface
    public interface IShippingStrategy
    {
        string GetStrategyName();
        decimal CalculateShippingFee(ShippingContext context);
        bool IsApplicable(ShippingContext context);
        int GetEstimatedDeliveryDays();
    }

    // STRATEGY PATTERN: Concrete Strategy - Giao hàng nội thành
    public class LocalShippingStrategy : IShippingStrategy
    {
        private readonly ShippingMethod _method;
        private readonly List<string> _localCities = new() { "TP.HCM", "HCM", "Ho Chi Minh" };

        public LocalShippingStrategy(ShippingMethod method)
        {
            _method = method;
        }

        public string GetStrategyName() => "Local Shipping";

        public decimal CalculateShippingFee(ShippingContext context)
        {
            decimal fee = _method.BaseFee;

            // Phí theo trọng lượng
            if (_method.FeePerKg.HasValue && context.TotalWeight > 0)
            {
                fee += context.TotalWeight * _method.FeePerKg.Value;
            }

            // Phí theo thể tích (nội thất thường tính theo thể tích)
            if (_method.FeePerCubicMeter.HasValue && context.TotalVolume > 0)
            {
                fee += context.TotalVolume * _method.FeePerCubicMeter.Value;
            }

            // Miễn phí ship nội thành nếu đơn nhỏ
            if (context.ItemCount == 1 && context.TotalVolume < 0.1m)
            {
                fee *= 0.5m; // Giảm 50%
            }

            return Math.Round(fee, 0);
        }

        public bool IsApplicable(ShippingContext context)
        {
            return _localCities.Any(city =>
                context.DestinationCity.Contains(city, StringComparison.OrdinalIgnoreCase));
        }

        public int GetEstimatedDeliveryDays() => _method.EstimatedDeliveryDays;
    }

    // STRATEGY PATTERN: Concrete Strategy - Giao hàng liên tỉnh
    public class RegionalShippingStrategy : IShippingStrategy
    {
        private readonly ShippingMethod _method;
        private readonly List<string> _regionalCities = new()
        {
            "Binh Duong", "Dong Nai", "Long An", "Ba Ria Vung Tau",
            "Tien Giang", "Ben Tre", "Can Tho", "An Giang"
        };

        public RegionalShippingStrategy(ShippingMethod method)
        {
            _method = method;
        }

        public string GetStrategyName() => "Regional Shipping";

        public decimal CalculateShippingFee(ShippingContext context)
        {
            decimal fee = _method.BaseFee;

            // Phí cơ bản cao hơn
            if (_method.FeePerKg.HasValue)
            {
                fee += context.TotalWeight * _method.FeePerKg.Value;
            }

            if (_method.FeePerCubicMeter.HasValue)
            {
                fee += context.TotalVolume * _method.FeePerCubicMeter.Value;
            }

            // Phụ phí vùng xa (giả định)
            if (context.Distance > 100)
            {
                fee += (context.Distance - 100) * 1000; // 1000đ/km sau 100km
            }

            // Phí xử lý hàng cồng kềnh
            if (context.TotalVolume > 1.0m)
            {
                fee += 200000; // Phụ phí 200k cho hàng quá cồng kềnh
            }

            return Math.Round(fee, 0);
        }

        public bool IsApplicable(ShippingContext context)
        {
            return _regionalCities.Any(city =>
                context.DestinationCity.Contains(city, StringComparison.OrdinalIgnoreCase));
        }

        public int GetEstimatedDeliveryDays() => _method.EstimatedDeliveryDays;
    }

    // STRATEGY PATTERN: Concrete Strategy - Giao hàng toàn quốc
    public class NationalShippingStrategy : IShippingStrategy
    {
        private readonly ShippingMethod _method;

        public NationalShippingStrategy(ShippingMethod method)
        {
            _method = method;
        }

        public string GetStrategyName() => "National Shipping";

        public decimal CalculateShippingFee(ShippingContext context)
        {
            decimal fee = _method.BaseFee;

            // Phí theo trọng lượng và thể tích
            if (_method.FeePerKg.HasValue)
            {
                fee += context.TotalWeight * _method.FeePerKg.Value;
            }

            if (_method.FeePerCubicMeter.HasValue)
            {
                fee += context.TotalVolume * _method.FeePerCubicMeter.Value;
            }

            // Phụ phí khoảng cách
            if (context.Distance > 500)
            {
                fee += 300000; // Phụ phí vùng xa
            }

            // Phụ phí hàng cồng kềnh
            if (context.TotalVolume > 0.5m)
            {
                fee += context.TotalVolume * 100000; // 100k/m³
            }

            return Math.Round(fee, 0);
        }

        public bool IsApplicable(ShippingContext context)
        {
            // Áp dụng cho tất cả các địa chỉ không thuộc local/regional
            return true; // Default fallback
        }

        public int GetEstimatedDeliveryDays() => _method.EstimatedDeliveryDays;
    }

    // STRATEGY PATTERN: Context class
    public class ShippingCalculator
    {
        private readonly List<IShippingStrategy> _strategies = new();

        public void AddStrategy(IShippingStrategy strategy)
        {
            _strategies.Add(strategy);
        }

        // Xóa tất cả strategies đã đăng ký (dùng trước khi load lại từ DB)
        public void Clear()
        {
            _strategies.Clear();
        }

        public (decimal fee, IShippingStrategy? strategy) CalculateBestShippingFee(ShippingContext context)
        {
            // Tìm strategy phù hợp nhất (ưu tiên local > regional > national)
            var applicableStrategies = _strategies
                .Where(s => s.IsApplicable(context))
                .ToList();

            if (!applicableStrategies.Any())
            {
                return (0, null);
            }

            // Chọn strategy với phí thấp nhất
            var bestStrategy = applicableStrategies
                .OrderBy(s => s.CalculateShippingFee(context))
                .First();

            var fee = bestStrategy.CalculateShippingFee(context);

            return (fee, bestStrategy);
        }

        public List<(IShippingStrategy strategy, decimal fee)> GetAllAvailableOptions(ShippingContext context)
        {
            return _strategies
                .Where(s => s.IsApplicable(context))
                .Select(s => (strategy: s, fee: s.CalculateShippingFee(context)))
                .OrderBy(x => x.fee)
                .ToList();
        }
    }
}