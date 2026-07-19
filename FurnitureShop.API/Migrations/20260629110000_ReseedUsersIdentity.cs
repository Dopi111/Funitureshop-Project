using System;
using FurnitureShop.API.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FurnitureShop.API.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260629110000_ReseedUsersIdentity")]
    public partial class ReseedUsersIdentity : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM [Users])
BEGIN
    DBCC CHECKIDENT ('Users', RESEED, 1);
END
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
