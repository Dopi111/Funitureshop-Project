using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Iterator
{
    /// <summary>
    /// ITERATOR PATTERN - Duyệt cây danh mục nội thất đa cấp
    ///
    /// Vấn đề: Danh mục nội thất có cấu trúc cây phân cấp nhiều tầng:
    ///   Phòng Khách → Sofa → Sofa Da / Sofa Vải
    ///   Phòng Ngủ  → Giường / Tủ Quần Áo
    ///
    ///   Controller cần duyệt danh mục để: hiển thị Breadcrumb (DFS)
    ///   hoặc render Mega Menu theo từng tầng (BFS) — nhưng không nên
    ///   biết chi tiết cách cây được lưu trữ nội bộ.
    ///
    /// Giải pháp: Iterator Pattern tách biệt "thuật toán duyệt" khỏi
    ///   "cấu trúc dữ liệu". Controller chỉ cần gọi HasNext() / Next().
    ///
    /// Lợi ích:
    ///   - Che giấu cấu trúc bên trong (Encapsulation)
    ///   - Dễ đổi chiến lược duyệt (DFS ↔ BFS) mà không sửa Controller
    ///   - Tuân thủ Open/Closed Principle
    /// </summary>

    // =========================================================================
    // INTERFACE: Hợp đồng cho mọi Iterator danh mục
    // =========================================================================
    public interface ICategoryIterator
    {
        /// <summary>Kiểm tra còn phần tử tiếp theo không?</summary>
        bool HasNext();

        /// <summary>Trả về phần tử tiếp theo và tiến con trỏ lên 1</summary>
        Category Next();

        /// <summary>Đặt lại con trỏ về đầu để duyệt lại từ đầu</summary>
        void Reset();
    }

    // =========================================================================
    // CONCRETE ITERATOR 1: DFS — Depth-First Search (Đi sâu theo nhánh)
    // =========================================================================
    /// <summary>
    /// Duyệt theo chiều sâu (DFS - Stack-based):
    /// Phòng Khách → Sofa → Sofa Da → Sofa Vải → Bàn Trà → Phòng Ngủ → ...
    ///
    /// Dùng cho: Breadcrumb navigation, tìm đường dẫn danh mục đầy đủ.
    /// </summary>
    public class CategoryDFSIterator : ICategoryIterator
    {
        // Stack dùng để đi sâu theo nhánh (LIFO - vào sau ra trước)
        private readonly Stack<Category> _stack = new();

        // Lưu danh sách gốc để hỗ trợ Reset()
        private readonly List<Category> _roots;

        public CategoryDFSIterator(List<Category> rootCategories)
        {
            _roots = rootCategories;
            // Đẩy các danh mục gốc vào Stack theo thứ tự ngược để duyệt đúng thứ tự
            foreach (var root in Enumerable.Reverse(rootCategories))
                _stack.Push(root);
        }

        public bool HasNext() => _stack.Count > 0;

        public Category Next()
        {
            if (!HasNext())
                throw new InvalidOperationException("Không còn phần tử nào để duyệt.");

            // Lấy phần tử đầu Stack
            var current = _stack.Pop();

            // Đẩy tất cả con của phần tử hiện tại vào Stack (theo thứ tự ngược)
            // để khi Pop ra sẽ duyệt theo thứ tự đúng
            if (current.Children != null)
            {
                foreach (var child in Enumerable.Reverse(current.Children))
                    _stack.Push(child);
            }

            return current;
        }

        public void Reset()
        {
            _stack.Clear();
            foreach (var root in Enumerable.Reverse(_roots))
                _stack.Push(root);
        }
    }

    // =========================================================================
    // CONCRETE ITERATOR 2: BFS — Breadth-First Search (Quét từng tầng)
    // =========================================================================
    /// <summary>
    /// Duyệt theo chiều rộng (BFS - Queue-based):
    /// Tầng 1: Phòng Khách → Phòng Ngủ → Phòng Ăn
    /// Tầng 2: Sofa → Bàn Trà → Kệ TV → Giường → Tủ Quần Áo
    /// Tầng 3: Sofa Da → Sofa Vải → ...
    ///
    /// Dùng cho: Render Mega Menu phân tầng, hiển thị toàn bộ cây theo độ sâu.
    /// </summary>
    public class CategoryBFSIterator : ICategoryIterator
    {
        // Queue dùng để quét từng tầng (FIFO - vào trước ra trước)
        private readonly Queue<Category> _queue = new();

        // Lưu danh sách gốc để hỗ trợ Reset()
        private readonly List<Category> _roots;

        public CategoryBFSIterator(List<Category> rootCategories)
        {
            _roots = rootCategories;
            // Đưa tất cả danh mục gốc vào Queue
            foreach (var root in rootCategories)
                _queue.Enqueue(root);
        }

        public bool HasNext() => _queue.Count > 0;

        public Category Next()
        {
            if (!HasNext())
                throw new InvalidOperationException("Không còn phần tử nào để duyệt.");

            // Lấy phần tử đầu Queue
            var current = _queue.Dequeue();

            // Đưa tất cả con vào cuối Queue (đảm bảo quét hết tầng hiện tại trước)
            if (current.Children != null)
            {
                foreach (var child in current.Children)
                    _queue.Enqueue(child);
            }

            return current;
        }

        public void Reset()
        {
            _queue.Clear();
            foreach (var root in _roots)
                _queue.Enqueue(root);
        }
    }

    // =========================================================================
    // AGGREGATE: Tập hợp danh mục có khả năng tạo Iterator
    // =========================================================================
    /// <summary>
    /// CategoryCollection đóng vai trò là "Iterable Aggregate".
    /// Nhận danh sách danh mục phẳng từ DB, tự động xây cây phân cấp,
    /// sau đó cung cấp các Iterator tương ứng theo chiến lược yêu cầu.
    /// </summary>
    public class CategoryCollection
    {
        private readonly List<Category> _rootCategories;

        /// <summary>
        /// Nhận danh sách PHẲNG (flat list) các danh mục từ DB,
        /// tự xây dựng cấu trúc cây dựa trên ParentId.
        /// </summary>
        public CategoryCollection(List<Category> flatCategories)
        {
            // Tạo lookup theo CategoryId để tra cứu O(1)
            var lookup = flatCategories.ToDictionary(c => c.CategoryId);

            // Gán Children cho từng Category dựa trên ParentId
            foreach (var cat in flatCategories)
            {
                cat.Children = flatCategories
                    .Where(c => c.ParentId == cat.CategoryId)
                    .OrderBy(c => c.DisplayOrder)
                    .ToList();
            }

            // Chỉ giữ lại danh mục gốc (không có cha)
            _rootCategories = flatCategories
                .Where(c => c.ParentId == null)
                .OrderBy(c => c.DisplayOrder)
                .ToList();
        }

        /// <summary>Tạo Iterator duyệt theo chiều sâu (DFS) — dùng cho Breadcrumb</summary>
        public ICategoryIterator CreateDFSIterator()
            => new CategoryDFSIterator(_rootCategories);

        /// <summary>Tạo Iterator duyệt theo chiều rộng (BFS) — dùng cho Mega Menu</summary>
        public ICategoryIterator CreateBFSIterator()
            => new CategoryBFSIterator(_rootCategories);
    }

    // =========================================================================
    // HELPER: Kết quả trả về cho API
    // =========================================================================
    public class CategoryTreeNode
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public int? ParentId { get; set; }
        public int Level { get; set; }       // Độ sâu trong cây (0 = root)
        public int DisplayOrder { get; set; }
        public string? ImageUrl { get; set; }
        public List<CategoryTreeNode> Children { get; set; } = new();
    }

    /// <summary>
    /// Extension method: Sử dụng Iterator để duyệt cây và trả về danh sách phẳng có thứ tự.
    /// </summary>
    public static class CategoryIteratorExtensions
    {
        /// <summary>Duyệt toàn bộ cây bằng chiến lược đã chọn, trả về danh sách phẳng có thứ tự</summary>
        public static List<CategoryTreeNode> ToOrderedList(
            this ICategoryIterator iterator,
            int level = 0)
        {
            var result = new List<CategoryTreeNode>();
            while (iterator.HasNext())
            {
                var cat = iterator.Next();
                result.Add(new CategoryTreeNode
                {
                    CategoryId = cat.CategoryId,
                    Name = cat.Name,
                    Slug = cat.Slug,
                    ParentId = cat.ParentId,
                    DisplayOrder = cat.DisplayOrder,
                    ImageUrl = cat.ImageUrl,
                    Level = level
                });
            }
            return result;
        }
    }
}
