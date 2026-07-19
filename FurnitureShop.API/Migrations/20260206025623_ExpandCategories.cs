using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class ExpandCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 1,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Nội thất phòng khách sang trọng", "/images/categories/phong-khach.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 2,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Nội thất phòng ngủ êm ái", "/images/categories/phong-ngu.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 3,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Nội thất phòng ăn tinh tế", "/images/categories/phong-an.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 4,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Sofa các loại", "/images/categories/sofa.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 5,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Bàn nước, bàn trà", "/images/categories/ban-tra.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 6,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Giường ngủ các loại", "/images/categories/giuong.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 7,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { "Tủ đựng quần áo", "/images/categories/tu-quan-ao.jpg" });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "CategoryId", "CreatedAt", "Description", "DisplayOrder", "ImageUrl", "IsActive", "Name", "ParentId", "Slug", "UpdatedAt" },
                values: new object[,]
                {
                    { 10, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Nội thất văn phòng tại nhà", 4, "/images/categories/phong-lam-viec.jpg", true, "Phòng Làm Việc", null, "phong-lam-viec", null },
                    { 11, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Ghế đọc sách, ghế nghỉ", 3, "/images/categories/ghe-thu-gian.jpg", true, "Ghế Thư Giãn", 1, "ghe-thu-gian", null },
                    { 12, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Kệ tivi, tủ tivi", 4, "/images/categories/tu-tivi.jpg", true, "Tủ Tivi", 1, "tu-tivi", null },
                    { 13, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Kệ sách, kệ trang trí", 5, "/images/categories/ke-trang-tri.jpg", true, "Kệ Trang Trí", 1, "ke-trang-tri", null },
                    { 14, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Bàn phấn, gương", 3, "/images/categories/ban-trang-diem.jpg", true, "Bàn Trang Điểm", 2, "ban-trang-diem", null },
                    { 15, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Tab đầu giường", 4, "/images/categories/tu-dau-giuong.jpg", true, "Tủ Đầu Giường", 2, "tu-dau-giuong", null },
                    { 16, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Bàn ăn các loại", 1, "/images/categories/ban-an.jpg", true, "Bàn Ăn", 3, "ban-an", null },
                    { 17, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Ghế ăn, ghế bar", 2, "/images/categories/ghe-an.jpg", true, "Ghế Ăn", 3, "ghe-an", null },
                    { 18, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Tủ rượu, tủ bày đồ", 3, "/images/categories/tu-ruou.jpg", true, "Tủ Rượu", 3, "tu-ruou", null }
                });

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 1,
                column: "ImageUrl",
                value: "/images/products/sofa-da-cao-cap-luxury.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 2,
                column: "ImageUrl",
                value: "/images/products/sofa-ni-scandinavian.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 3,
                column: "ImageUrl",
                value: "/images/products/ban-tra-go-oc-cho.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 4,
                column: "ImageUrl",
                value: "/images/products/giuong-ngu-nem-boc-vai.jpg");

            migrationBuilder.UpdateData(
                table: "ProductImages",
                keyColumn: "ImageId",
                keyValue: 5,
                column: "ImageUrl",
                value: "/images/products/tu-quan-ao-4-canh.jpg");

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "CategoryId", "CreatedAt", "Description", "DisplayOrder", "ImageUrl", "IsActive", "Name", "ParentId", "Slug", "UpdatedAt" },
                values: new object[,]
                {
                    { 19, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Bàn văn phòng, bàn máy tính", 1, "/images/categories/ban-lam-viec.jpg", true, "Bàn Làm Việc", 10, "ban-lam-viec", null },
                    { 20, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Ghế xoay, ghế công thái học", 2, "/images/categories/ghe-van-phong.jpg", true, "Ghế Văn Phòng", 10, "ghe-van-phong", null },
                    { 21, new DateTime(2026, 1, 20, 0, 0, 0, 0, DateTimeKind.Utc), "Tủ đựng tài liệu", 3, "/images/categories/tu-ho-so.jpg", true, "Tủ Hồ Sơ", 10, "tu-ho-so", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 10);

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 1,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/phong-khach.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 2,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/phong-ngu.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 3,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/phong-an.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 4,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/sofa.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 5,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/ban-nuoc.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 6,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/giuong.jpg" });

            migrationBuilder.UpdateData(
                table: "Categories",
                keyColumn: "CategoryId",
                keyValue: 7,
                columns: new[] { "Description", "ImageUrl" },
                values: new object[] { null, "/images/tu-quan-ao.jpg" });

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
    }
}
