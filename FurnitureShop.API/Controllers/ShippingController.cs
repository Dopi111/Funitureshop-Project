using FurnitureShop.API.Patterns.Facade;
using FurnitureShop.API.Patterns.Strategy;
using FurnitureShop.API.Models;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/shipping")]
    public class ShippingController : ControllerBase
    {
        private readonly CheckoutFacade _checkoutFacade;
        private readonly AppDbContext _context;

        public ShippingController(CheckoutFacade checkoutFacade, AppDbContext context)
        {
            _checkoutFacade = checkoutFacade;
            _context = context;
        }

        [HttpPost("options")]
        public async Task<IActionResult> GetOptions([FromBody] ShippingOptionsRequest request)
        {
            var options = await _checkoutFacade.GetShippingOptionsAsync(request.ProductIds, request.ShippingInfo);
            return Ok(new { success = true, data = options });
        }

        [HttpPost("calculate-best")]
        public async Task<IActionResult> CalculateBest([FromBody] ShippingCalculationRequest request)
        {
            var methods = await _context.ShippingMethods
                .Where(sm => sm.IsActive)
                .ToListAsync();

            if (!methods.Any())
            {
                return BadRequest(new { success = false, message = "No active shipping methods" });
            }

            var calculator = BuildCalculator(methods);
            var context = BuildContext(request);
            var (fee, strategy) = calculator.CalculateBestShippingFee(context);

            if (strategy == null)
            {
                return BadRequest(new { success = false, message = "No applicable shipping strategy" });
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    fee,
                    strategy = strategy.GetStrategyName(),
                    estimatedDays = strategy.GetEstimatedDeliveryDays()
                }
            });
        }

        [HttpPost("calculate-all")]
        public async Task<IActionResult> CalculateAll([FromBody] ShippingCalculationRequest request)
        {
            var methods = await _context.ShippingMethods
                .Where(sm => sm.IsActive)
                .ToListAsync();

            if (!methods.Any())
            {
                return BadRequest(new { success = false, message = "No active shipping methods" });
            }

            var calculator = BuildCalculator(methods);
            var context = BuildContext(request);
            var options = calculator.GetAllAvailableOptions(context);

            return Ok(new
            {
                success = true,
                data = options.Select(o => new
                {
                    strategy = o.strategy.GetStrategyName(),
                    fee = o.fee,
                    estimatedDays = o.strategy.GetEstimatedDeliveryDays()
                })
            });
        }

        private static ShippingCalculator BuildCalculator(List<ShippingMethod> methods)
        {
            var calculator = new ShippingCalculator();

            var local = methods.FirstOrDefault(m => m.Code == "LOCAL");
            if (local != null)
            {
                calculator.AddStrategy(new LocalShippingStrategy(local));
            }

            var regional = methods.FirstOrDefault(m => m.Code == "REGIONAL");
            if (regional != null)
            {
                calculator.AddStrategy(new RegionalShippingStrategy(regional));
            }

            var national = methods.FirstOrDefault(m => m.Code == "NATIONAL");
            if (national != null)
            {
                calculator.AddStrategy(new NationalShippingStrategy(national));
            }

            return calculator;
        }

        private static ShippingContext BuildContext(ShippingCalculationRequest request)
        {
            return new ShippingContext
            {
                DestinationCity = request.DestinationCity,
                DestinationDistrict = request.DestinationDistrict,
                TotalWeight = request.TotalWeight,
                TotalVolume = request.TotalVolume,
                Distance = request.Distance,
                ItemCount = request.ItemCount
            };
        }
    }

    public class ShippingCalculationRequest
    {
        public string DestinationCity { get; set; } = string.Empty;
        public string DestinationDistrict { get; set; } = string.Empty;
        public decimal TotalWeight { get; set; }
        public decimal TotalVolume { get; set; }
        public decimal Distance { get; set; }
        public int ItemCount { get; set; }
    }
}
