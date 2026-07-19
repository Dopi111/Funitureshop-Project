using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class FixAdminPasswordHashReal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Ify5IXQpdCwofnU29qjiuOVyWqe0/1GAl8teDWL05lV/jOCmLomuW");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$8K1p/kLpGxOBWlMvSHV4OeQYHsJ1PgXvXdvVm7cS5YvLq8xEYz.Hy");
        }
    }
}
