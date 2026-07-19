namespace FurnitureShop.API.DTOs
{
    /// <summary>
    /// DTO trả về thông tin sản phẩm + số lượt xem trong khoảng thời gian thống kê.
    /// </summary>
    public class TopViewedProductDto
    {
        public int ProductId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? SKU { get; set; }

        /// <summary>
        /// URL ảnh thumbnail (lấy từ ProductImages nơi IsPrimary = true).
        /// </summary>
        public string? Thumbnail { get; set; }

        public decimal BasePrice { get; set; }
        public decimal? DiscountPrice { get; set; }

        /// <summary>
        /// Số lượt click xem trong khoảng thời gian được lọc.
        /// </summary>
        public int ViewCount { get; set; }
    }
}
