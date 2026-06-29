namespace FurnitureShop.API.DTOs
{
    /// <summary>
    /// Kết quả báo cáo Click-Per-Sale: tỷ lệ chuyển đổi từ lượt xem sang đơn hàng.
    /// </summary>
    public class ClickToSaleReportDto
    {
        public int ProductId { get; set; }

        public string ProductName { get; set; } = string.Empty;

        public string? SKU { get; set; }

        /// <summary>Tổng lượt click xem sản phẩm (từ ProductViews).</summary>
        public int TotalViews { get; set; }

        /// <summary>Tổng số lượng đã bán thành công (sum Quantity từ OrderDetails).</summary>
        public int TotalUnitsSold { get; set; }

        /// <summary>
        /// Số lượt click trung bình để bán được 1 sản phẩm.
        /// Công thức: TotalViews / TotalUnitsSold.
        /// Null nếu chưa bán được lần nào (tránh chia cho 0).
        /// </summary>
        public double? ClicksPerSale { get; set; }

        /// <summary>
        /// Tỷ lệ chuyển đổi (%) = TotalUnitsSold / TotalViews * 100.
        /// Dễ đọc hơn ClicksPerSale cho non-technical stakeholders.
        /// </summary>
        public double? ConversionRatePercent { get; set; }

        /// <summary>Thứ hạng trong báo cáo (1 = dễ bán nhất).</summary>
        public int Rank { get; set; }
    }
}
