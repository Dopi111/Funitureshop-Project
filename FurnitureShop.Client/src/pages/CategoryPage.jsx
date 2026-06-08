// src/pages/CategoryPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import '../index.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const CategoryPage = () => {
    const { id } = useParams();
    const [category, setCategory] = useState(null);
    const [productTypes, setProductTypes] = useState([]);
    const [selectedProductType, setSelectedProductType] = useState(null);
    const [products, setProducts] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [sortBy, setSortBy] = useState('newest');
    const pageSize = 12;

    // Fetch category and product types
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setSelectedProductType(null);

                // Fetch all categories for sidebar
                const categoriesResponse = await fetch('/api/categories/all');
                const categoriesData = await categoriesResponse.json();
                setAllCategories(categoriesData || []);

                // Fetch current category
                const categoryResponse = await fetch(`/api/categories/${id}`);
                if (!categoryResponse.ok) {
                    throw new Error('Không tìm thấy danh mục');
                }
                const categoryData = await categoryResponse.json();
                setCategory(categoryData);

                // Fetch ProductTypes for this category
                const productTypesResponse = await fetch(`/api/products/product-types/by-category/${id}`);
                if (productTypesResponse.ok) {
                    const typesData = await productTypesResponse.json();
                    setProductTypes(typesData || []);
                }

                // Fetch products
                await fetchProducts(1, null);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchProducts = async (page = 1, productType = selectedProductType) => {
        try {
            let url = `/api/products?categoryId=${id}&page=${page}&pageSize=${pageSize}`;
            if (productType) {
                url += `&productType=${encodeURIComponent(productType)}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setProducts(data.data || []);
                setTotalPages(data.totalPages || 1);
                setTotalProducts(data.totalCount || 0);
                setCurrentPage(page);
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const handleProductTypeChange = (productType) => {
        setSelectedProductType(productType);
        fetchProducts(1, productType);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchProducts(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Get root categories
    const getRootCategories = () => {
        return allCategories.filter(c => !c.parentId);
    };

    if (loading) {
        return (
            <div className="app">
                <Navbar />
                <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <p>Đang tải danh mục...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="app">
                <Navbar />
                <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <h2>Không tìm thấy danh mục</h2>
                    <p>{error}</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Về trang chủ
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const rootCategories = getRootCategories();

    return (
        <div className="app">
            <Navbar />

            {/* Category Hero Banner */}
            <div className="category-hero">
                <div
                    className="category-hero-bg"
                    style={{
                        backgroundImage: `url(${category.imageUrl || DEFAULT_IMAGE})`
                    }}
                />
                <div className="category-hero-overlay" />
                <div className="category-hero-content">
                    <h1 className="category-hero-title">{category.name}</h1>
                    {category.description && (
                        <p className="category-hero-desc">{category.description}</p>
                    )}
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="breadcrumb-container">
                <div className="container">
                    <nav className="breadcrumb">
                        <Link to="/">Trang chủ</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">{category.name}</span>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <section className="category-section">
                <div className="container">
                    <div className="category-layout">
                        {/* Sidebar */}
                        <aside className="category-sidebar">
                            {/* Root Categories */}
                            <div className="sidebar-section">
                                <h3 className="sidebar-title">Danh mục</h3>
                                <ul className="category-list">
                                    {rootCategories.map(cat => (
                                        <li key={cat.categoryId}>
                                            <Link
                                                to={`/category/${cat.categoryId}`}
                                                className={`category-list-item ${cat.categoryId === parseInt(id) ? 'active' : ''}`}
                                            >
                                                {cat.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* ProductTypes Filter */}
                            {productTypes.length > 0 && (
                                <div className="sidebar-section">
                                    <h3 className="sidebar-title">Loại sản phẩm</h3>
                                    <ul className="category-list">
                                        <li>
                                            <button
                                                className={`category-list-item ${!selectedProductType ? 'active' : ''}`}
                                                onClick={() => handleProductTypeChange(null)}
                                            >
                                                Tất cả
                                                <span className="category-count">
                                                    ({productTypes.reduce((sum, t) => sum + t.count, 0)})
                                                </span>
                                            </button>
                                        </li>
                                        {productTypes.map(type => (
                                            <li key={type.productType}>
                                                <button
                                                    className={`category-list-item ${selectedProductType === type.productType ? 'active' : ''}`}
                                                    onClick={() => handleProductTypeChange(type.productType)}
                                                >
                                                    {type.productType}
                                                    <span className="category-count">({type.count})</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </aside>

                        {/* Products Grid */}
                        <main className="category-main">
                            {/* Toolbar */}
                            <div className="category-toolbar">
                                <div className="toolbar-info">
                                    <span className="products-count">
                                        {selectedProductType && (
                                            <span className="filter-tag">
                                                {selectedProductType}
                                                <button onClick={() => handleProductTypeChange(null)} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        Hiển thị {products.length} / {totalProducts} sản phẩm
                                    </span>
                                </div>
                                <div className="toolbar-sort">
                                    <label>Sắp xếp:</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value);
                                            fetchProducts(1);
                                        }}
                                        className="sort-select"
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="price-low">Giá thấp → cao</option>
                                        <option value="price-high">Giá cao → thấp</option>
                                        <option value="name">Tên A-Z</option>
                                    </select>
                                </div>
                            </div>

                            {/* Products */}
                            {products.length === 0 ? (
                                <div className="empty-products">
                                    <p>Chưa có sản phẩm nào trong danh mục này.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-3">
                                        {products.map(product => (
                                            <ProductCard
                                                key={product.productId}
                                                id={product.productId}
                                                name={product.name}
                                                price={product.discountPrice || product.basePrice}
                                                originalPrice={product.discountPrice ? product.basePrice : null}
                                                category={product.productType}
                                                image={product.images?.[0]?.imageUrl || DEFAULT_IMAGE}
                                                discount={product.discountPrice
                                                    ? Math.round((1 - product.discountPrice / product.basePrice) * 100)
                                                    : null}
                                                isNew={product.isFeatured}
                                            />
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            <button
                                                className="pagination-btn"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                ← Trước
                                            </button>

                                            <div className="pagination-pages">
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <button
                                                        key={i + 1}
                                                        className={`pagination-page ${currentPage === i + 1 ? 'active' : ''}`}
                                                        onClick={() => handlePageChange(i + 1)}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                className="pagination-btn"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Tiếp →
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </main>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default CategoryPage;
