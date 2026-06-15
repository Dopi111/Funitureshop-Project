using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCategoryImageUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 1,
                column: "ImageUrl",
                value: "/images/phong-khach.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 2,
                column: "ImageUrl",
                value: "/images/phong-ngu.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 3,
                column: "ImageUrl",
                value: "/images/phong-an.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 4,
                column: "ImageUrl",
                value: "/images/sofa.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 5,
                columns: new[] { "ImageUrl", "Name", "Slug" },
                values: new object[] { "/images/ban-nuoc.jpg", "Bàn Trà", "ban-tra" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 6,
                column: "ImageUrl",
                value: "/images/giuong.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 7,
                column: "ImageUrl",
                value: "/images/tu-quan-ao.jpg");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 1,
                column: "ImageUrl",
                value: "./wwwroot/images/phong-khach.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 2,
                column: "ImageUrl",
                value: "./wwwroot/images/phong-ngu.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 3,
                column: "ImageUrl",
                value: "./wwwroot/images/phong-an.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 4,
                column: "ImageUrl",
                value: "./wwwroot/images/sofa.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 5,
                columns: new[] { "ImageUrl", "Name", "Slug" },
                values: new object[] { "./wwwroot/images/ban-nuoc.jpg", "Bàn Nước", "ban-nuoc" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 6,
                column: "ImageUrl",
                value: "./wwwroot/images/giuong.jpg");

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 7,
                column: "ImageUrl",
                value: "./wwwroot/images/tu-quan-ao.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 1,
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 2,
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 3,
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 4,
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1505691722718-4684375e797d");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 5,
                column: "ImageUrl",
                value: "https://images.unsplash.com/photo-1595428774223-ef52624120ec");
        }
    }
}
