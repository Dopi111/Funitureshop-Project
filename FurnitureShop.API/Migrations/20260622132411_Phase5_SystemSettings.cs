using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_SystemSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SystemSettings",
                columns: table => new
                {
                    Key = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SystemSettings", x => x.Key);
                });

            migrationBuilder.InsertData(
                table: "SystemSettings",
                columns: new[] { "Key", "Description", "UpdatedAt", "Value" },
                values: new object[,]
                {
                    { "Address", "Địa chỉ Showroom", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "123 Quận 1, TP.HCM" },
                    { "BannerUrl", "Banner Trang chủ", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "https://example.com/banner.jpg" },
                    { "Hotline", "Số điện thoại CSKH", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "1900 1234" },
                    { "ReturnPolicyDays", "Số ngày cho phép trả hàng", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "7" },
                    { "StoreName", "Tên cửa hàng", new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "FurnitureShop" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SystemSettings");
        }
    }
}
