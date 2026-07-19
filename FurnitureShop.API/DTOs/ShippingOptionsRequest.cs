namespace FurnitureShop.API.DTOs
{
    public class ShippingOptionsRequest
    {
        public List<int> ProductIds { get; set; } = new();
        public ShippingInfoDto ShippingInfo { get; set; } = new();
    }
}
