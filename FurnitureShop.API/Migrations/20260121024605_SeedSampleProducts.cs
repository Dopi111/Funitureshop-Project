using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedSampleProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "ProductId", "BasePrice", "Brand", "CategoryId", "CollectionId", "Color", "CreatedAt", "Depth", "Description", "DiscountPrice", "Height", "IsActive", "IsFeatured", "Material", "Name", "ProductType", "SKU", "Slug", "StockQuantity", "UpdatedAt", "ViewCount", "Weight", "Width" },
                values: new object[,]
                {
                    { 1, 25000000m, "LuxuryHome", 4, null, "Nâu đen", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 95m, "Sofa da bò thật nhập khẩu từ Ý, khung gỗ sồi chắc chắn.", null, 85m, true, true, "Da bò Ý", "Sofa Da Cao Cấp Luxury", "Sofa", "SOFA-LUX-001", "sofa-da-cao-cap-luxury", 10, null, 0, 85m, 220m },
                    { 2, 12000000m, "ModernLife", 4, null, "Xám nhạc", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 85m, "Sofa nỉ mềm mại, màu sắc trung tính phù hợp không gian hiện đại.", null, 80m, true, false, "Nỉ cao cấp", "Sofa Nỉ Phong Cách Scandinavian", "Sofa", "SOFA-SCA-002", "sofa-ni-scandinavian", 15, null, 0, 60m, 180m },
                    { 3, 8500000m, "NatureWood", 5, null, "Tự nhiên", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 60m, "Bàn trà làm từ gỗ óc chó tự nhiên, vân gỗ đẹp mắt.", null, 45m, true, true, "Gỗ óc chó", "Bàn Trà Gỗ Óc Chó", "Table", "TABLE-WAL-003", "ban-tra-go-oc-cho", 20, null, 0, 25m, 120m },
                    { 4, 18000000m, "SleepWell", 6, null, "Xanh navy", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 200m, "Giường ngủ êm ái với đầu giường bọc vải nhung sang trọng.", null, 110m, true, false, "Vải nhung, gỗ thông", "Giường Ngủ Nệm Bọc Vải", "Bed", "BED-VEL-004", "giuong-ngu-nem-boc-vai", 5, null, 0, 120m, 180m },
                    { 5, 15000000m, "ModernLife", 7, null, "Trắng", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 60m, "Tủ quần áo rộng rãi, thiết kế tối giản tích hợp gương soi.", null, 220m, true, false, "Gỗ công nghiệp MDF", "Tủ Quần Áo 4 Cánh Hiện Đại", "Wardrobe", "WARD-MOD-005", "tu-quan-ao-4-canh", 8, null, 0, 180m, 200m }
                });

            migrationBuilder.InsertData(
                table: "ProductAttributes",
                columns: new[] { "AttributeId", "AttributeName", "AttributeValue", "CreatedAt", "DisplayOrder", "ImageUrl", "IsAvailable", "PriceAdjustment", "ProductId" },
                values: new object[,]
                {
                    { 1, "Bảo hành", "24 tháng", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, null, true, 0m, 1 },
                    { 2, "Độ cứng", "Vừa phải", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, null, true, 0m, 1 },
                    { 3, "Kích thước đệm", "1m8 x 2m", new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, null, true, 0m, 4 }
                });

            migrationBuilder.InsertData(
                table: "ProductImages",
                columns: new[] { "ImageId", "AltText", "CreatedAt", "DisplayOrder", "ImageUrl", "IsPrimary", "ProductId" },
                values: new object[,]
                {
                    { 1, null, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, "https://images.unsplash.com/photo-1555041469-a586c61ea9bc", true, 1 },
                    { 2, null, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e", true, 2 },
                    { 3, null, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, "https://images.unsplash.com/photo-1533090161767-e6ffed986c88", true, 3 },
                    { 4, null, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, "https://images.unsplash.com/photo-1505691722718-4684375e797d", true, 4 },
                    { 5, null, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), 0, "https://images.unsplash.com/photo-1595428774223-ef52624120ec", true, 5 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ProductAttributes",
                keyColumn: "AttributeId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ProductAttributes",
                keyColumn: "AttributeId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ProductAttributes",
                keyColumn: "AttributeId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "ProductId",
                keyValue: 5);
        }
    }
}
