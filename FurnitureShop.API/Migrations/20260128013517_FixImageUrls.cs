using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class FixImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 1,
                column: "ImageUrl",
                value: "/images/sofa-da-cao-cap-luxury.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 2,
                column: "ImageUrl",
                value: "/images/sofa-ni-scandinavian.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 3,
                column: "ImageUrl",
                value: "/images/ban-tra-go-oc-cho.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 4,
                column: "ImageUrl",
                value: "/images/giuong-ngu-nem-boc-vai.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 5,
                column: "ImageUrl",
                value: "/images/tu-quan-ao-4-canh.jpg");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 1,
                column: "ImageUrl",
                value: "./wwwroot/images/sofa0-da-cao-cap-luxury.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 2,
                column: "ImageUrl",
                value: "./wwwroot/images/sofa-ni-scandinavian.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 3,
                column: "ImageUrl",
                value: "./wwwroot/images/ban-tra-go-oc-cho.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 4,
                column: "ImageUrl",
                value: "./wwwroot/images/giuong-ngu-nem-boc-vai.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 5,
                column: "ImageUrl",
                value: "./wwwroot/images/tu-quan-ao-4-canh.jpg");
        }
    }
}
