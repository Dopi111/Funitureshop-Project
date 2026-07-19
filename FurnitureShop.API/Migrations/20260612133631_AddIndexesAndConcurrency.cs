using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexesAndConcurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_CategoryId",
                table: "Products");

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Products",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_BasePrice",
                table: "Products",
                column: "BasePrice");

            migrationBuilder.CreateIndex(
                name: "IX_Products_CategoryId_IsActive_CreatedAt",
                table: "Products",
                columns: new[] { "CategoryId", "IsActive", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Products_IsFeatured",
                table: "Products",
                column: "IsFeatured");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Material",
                table: "Products",
                column: "Material");

            migrationBuilder.CreateIndex(
                name: "IX_Products_ProductType",
                table: "Products",
                column: "ProductType");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status",
                table: "Orders",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_BasePrice",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_CategoryId_IsActive_CreatedAt",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_IsFeatured",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_Material",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_ProductType",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Orders_Status",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Products");

            migrationBuilder.CreateIndex(
                name: "IX_Products_CategoryId",
                table: "Products",
                column: "CategoryId");
        }
    }
}
