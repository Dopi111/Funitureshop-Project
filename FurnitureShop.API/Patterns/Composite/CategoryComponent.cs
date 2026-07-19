using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Composite
{
    // COMPOSITE PATTERN: Component interface
    public interface ICategoryComponent
    {
        int GetId();
        string GetName();
        void Display(int depth = 0);
        int GetProductCount();
        List<ICategoryComponent> GetChildren();
    }

    // COMPOSITE PATTERN: Leaf (Category không có con)
    public class CategoryLeaf : ICategoryComponent
    {
        private readonly Category _category;

        public CategoryLeaf(Category category)
        {
            _category = category;
        }

        public int GetId() => _category.CategoryId;
        public string GetName() => _category.Name;

        public void Display(int depth = 0)
        {
            Console.WriteLine($"{new string('-', depth * 2)} {_category.Name} ({_category.Products.Count} sản phẩm)");
        }

        public int GetProductCount() => _category.Products?.Count ?? 0;

        public List<ICategoryComponent> GetChildren() => new List<ICategoryComponent>();
    }

    // COMPOSITE PATTERN: Composite (Category có children)
    public class CategoryComposite : ICategoryComponent
    {
        private readonly Category _category;
        private readonly List<ICategoryComponent> _children = new();

        public CategoryComposite(Category category)
        {
            _category = category;
        }

        public int GetId() => _category.CategoryId;
        public string GetName() => _category.Name;

        public void Add(ICategoryComponent component)
        {
            _children.Add(component);
        }

        public void Remove(ICategoryComponent component)
        {
            _children.Remove(component);
        }

        public void Display(int depth = 0)
        {
            Console.WriteLine($"{new string('-', depth * 2)} {_category.Name} ({GetProductCount()} sản phẩm)");
            foreach (var child in _children)
            {
                child.Display(depth + 1);
            }
        }

        // Tổng số sản phẩm của category này + tất cả children
        public int GetProductCount()
        {
            int count = _category.Products?.Count ?? 0;
            foreach (var child in _children)
            {
                count += child.GetProductCount();
            }
            return count;
        }

        public List<ICategoryComponent> GetChildren() => _children;
    }

    // COMPOSITE PATTERN: Builder cho category tree
    public class CategoryTreeBuilder
    {
        public static ICategoryComponent BuildTree(List<Category> categories, int? parentId = null)
        {
            // Nếu là root level, tạo một composite ảo
            if (parentId == null)
            {
                var root = new CategoryComposite(new Category { Name = "All Categories" });
                var rootCategories = categories.Where(c => c.ParentId == null).ToList();

                foreach (var category in rootCategories)
                {
                    root.Add(BuildNode(category, categories));
                }

                return root;
            }

            // Tìm category cụ thể
            var targetCategory = categories.FirstOrDefault(c => c.CategoryId == parentId);
            if (targetCategory == null)
                throw new ArgumentException($"Category {parentId} not found");

            return BuildNode(targetCategory, categories);
        }

        private static ICategoryComponent BuildNode(Category category, List<Category> allCategories)
        {
            var children = allCategories.Where(c => c.ParentId == category.CategoryId).ToList();

            if (!children.Any())
            {
                // Leaf node
                return new CategoryLeaf(category);
            }

            // Composite node
            var composite = new CategoryComposite(category);
            foreach (var child in children)
            {
                composite.Add(BuildNode(child, allCategories));
            }

            return composite;
        }
    }
}

// DTOs cho Composite Pattern
namespace FurnitureShop.API.DTOs
{
    public class CategoryTreeDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public int ProductCount { get; set; }
        public List<CategoryTreeDto> Children { get; set; } = new();
    }
}