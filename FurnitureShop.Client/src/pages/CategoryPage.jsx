// src/pages/CategoryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import '../index.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const getColorHex = (colorName) => {
    if (!colorName) return '#ccc';
    const cleanName = colorName.toLowerCase().trim();
    const map = {
        'nâu đen': '#3D1C0A', 'nâu': '#8B4513', 'xám nhạt': '#E0E0E0',
        'xám': '#808080', 'trắng': '#FFFFFF', 'đen': '#000000',
        'xanh navy': '#003153', 'tự nhiên': '#D2B48C', 'vàng': '#FFD700',
        'đỏ': '#D93838', 'xanh': '#2E7D32', 'kem': '#FFFDD0'
    };
    return map[cleanName] || '#cccccc';
};

const SkeletonCard = () => (
    <div className="flex flex-col bg-white p-5 shadow-[0_2px_12px_rgba(13,13,13,0.06)] animate-pulse border border-[#E8E4DC]/20">
        <div className="w-full aspect-[3/4] bg-[#F5F2EC] mb-4 animate-shimmer" />
        <div className="h-3.5 bg-[#E8E4DC] mb-2.5 w-1/3" />
        <div className="h-4 bg-[#E8E4DC] mb-3 w-3/4" />
        <div className="h-4 bg-[#E8E4DC] w-1/2 mt-auto" />
    </div>
);

const getPaginationRange = (current, total) => {
    if (total <= 7) return [...Array(total)].map((_, i) => i + 1);
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) range.push(i);
    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
};

const isNumericId = (value) => /^\d+$/.test(value || '');

const CategoryPage = () => {
    const { id: categoryParam } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [category, setCategory] = useState(null);
    const [productTypes, setProductTypes] = useState([]);
    const [colors, setColors] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resolvedCategoryId, setResolvedCategoryId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Filter params
    const selectedProductType = searchParams.get('productType') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const selectedColor = searchParams.get('color') || '';
    const selectedMaterial = searchParams.get('material') || '';
    const urlSearch = searchParams.get('search') || '';

    const [searchVal, setSearchVal] = useState(urlSearch);
    const [inputMinPrice, setInputMinPrice] = useState(minPrice);
    const [inputMaxPrice, setInputMaxPrice] = useState(maxPrice);

    const pageSize = 12;

    // Fetch category metadata
    useEffect(() => {
        const fetchMeta = async () => {
            try {
                setLoading(true);
                const catRes = await fetch(
                    isNumericId(categoryParam)
                        ? `/api/categories/${categoryParam}`
                        : `/api/categories/by-slug/${encodeURIComponent(categoryParam)}`
                );

                if (!catRes.ok) throw new Error('Không tìm thấy thông tin danh mục');
                const catData = await catRes.json();
                setCategory(catData);
                setResolvedCategoryId(catData.categoryId);

                const [typesRes, colsRes, matsRes] = await Promise.all([
                    fetch(`/api/products/product-types?categoryId=${catData.categoryId}`),
                    fetch(`/api/products/colors?categoryId=${catData.categoryId}`),
                    fetch(`/api/products/materials?categoryId=${catData.categoryId}`)
                ]);

                if (typesRes.ok) setProductTypes(await typesRes.json() || []);
                if (colsRes.ok) setColors(await colsRes.json() || []);
                if (matsRes.ok) setMaterials(await matsRes.json() || []);
            } catch (err) {
                setError(err.message);
                setResolvedCategoryId(null);
            } finally {
                setLoading(false);
            }
        };
        fetchMeta();
    }, [categoryParam]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        try {
            setProductsLoading(true);
            const params = new URLSearchParams({ categoryId: resolvedCategoryId, page: currentPage, pageSize, sortBy });
            if (selectedProductType) params.append('productType', selectedProductType);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (selectedColor) params.append('color', selectedColor);
            if (selectedMaterial) params.append('material', selectedMaterial);
            if (urlSearch) params.append('search', urlSearch);

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            setProducts(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalProducts(data.totalCount || 0);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setProductsLoading(false);
        }
    }, [resolvedCategoryId, currentPage, pageSize, sortBy, selectedProductType, minPrice, maxPrice, selectedColor, selectedMaterial, urlSearch]);

    useEffect(() => {
        if (resolvedCategoryId && !loading) fetchProducts();
    }, [resolvedCategoryId, loading, fetchProducts]);

    // Handlers
    const updateFilter = (newParams) => {
        const next = new URLSearchParams(searchParams);
        Object.entries(newParams).forEach(([k, v]) => {
            if (v === null || v === '' || v === undefined) next.delete(k);
            else next.set(k, v);
        });
        next.delete('page');
        setCurrentPage(1);
        setSearchParams(next);
    };

    const handleSearchChange = (e) => {
        setSearchVal(e.target.value);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        updateFilter({ search: searchVal });
    };

    const handleResetAll = () => {
        setSearchVal('');
        setInputMinPrice('');
        setInputMaxPrice('');
        setSearchParams(new URLSearchParams());
        setCurrentPage(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-7xl mx-auto w-full px-6 py-24 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-7xl mx-auto w-full px-6 py-32 flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 bg-[#FFEBEE] text-[#C62828] rounded-full flex items-center justify-center text-2xl font-bold">⚠️</div>
                    <h2 className="text-3xl font-light tracking-tight uppercase">Không Tìm Thấy Danh Mục</h2>
                    <p className="text-sm text-[#8A8278] max-w-md">{error || 'Danh mục này không tồn tại.'}</p>
                    <Link to="/" className="rounded-full py-4 px-8 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all">
                        ← Về trang chủ
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const activeFiltersCount = [selectedProductType, minPrice || maxPrice, selectedColor, selectedMaterial, urlSearch].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white relative">
            <Navbar />

            {/* Editorial Hero Banner */}
            <div className="relative bg-[#0D0D0D] text-[#FDFBF7] overflow-hidden py-16 sm:py-24 px-6 sm:px-12 md:px-16 lg:px-24">
                <img 
                    src={category.imageUrl || DEFAULT_IMAGE} 
                    alt={category.name} 
                    className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105 transition-transform duration-[10s]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent" />

                <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-start">
                    <nav className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#C9A87C] mb-6 font-semibold">
                        <Link to="/" className="hover:text-white transition-colors">Trang chủ</Link>
                        <span>/</span>
                        <Link to="/products" className="hover:text-white transition-colors">Danh mục</Link>
                        <span>/</span>
                        <span className="text-white underline underline-offset-4">{category.name}</span>
                    </nav>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight uppercase leading-none mb-4">
                        {category.name}
                    </h1>

                    {category.description && (
                        <p className="text-sm sm:text-base text-[#E8E4DC] max-w-2xl font-light leading-relaxed">
                            {category.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Sticky Sort & Filter Toolbar */}
            <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E8E4DC] py-4 px-6 sm:px-12 md:px-16 lg:px-24 shadow-xs">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Search & Active tags */}
                    <div className="flex items-center gap-4 flex-wrap">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <input
                                type="text"
                                value={searchVal}
                                onChange={handleSearchChange}
                                placeholder="Tìm trong danh mục..."
                                className="w-56 sm:w-64 py-2 px-4 pl-9 bg-white border border-[#E8E4DC] rounded-full text-xs text-[#0D0D0D] placeholder:text-[#8A8278] focus:outline-none focus:border-[#0D0D0D] transition-colors"
                            />
                            <span className="absolute left-3.5 top-2.5 text-[#8A8278] text-xs">🔍</span>
                        </form>

                        {activeFiltersCount > 0 && (
                            <button
                                onClick={handleResetAll}
                                className="text-[11px] uppercase tracking-widest font-semibold text-[#C62828] hover:underline transition-colors cursor-pointer"
                            >
                                Xóa bộ lọc ({activeFiltersCount})
                            </button>
                        )}
                    </div>

                    {/* Right: Sort & Filter Drawer toggle */}
                    <div className="flex items-center gap-3">
                        <select
                            value={sortBy}
                            onChange={(e) => updateFilter({ sortBy: e.target.value })}
                            className="bg-white border border-[#E8E4DC] hover:border-[#0D0D0D] rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#0D0D0D] cursor-pointer focus:outline-none transition-colors"
                        >
                            <option value="newest">✨ Mới nhất</option>
                            <option value="price_asc">↑ Giá tăng dần</option>
                            <option value="price_desc">↓ Giá giảm dần</option>
                            <option value="name_asc">A-Z Tên sản phẩm</option>
                        </select>

                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                                activeFiltersCount > 0 
                                    ? 'bg-[#0D0D0D] text-[#FDFBF7]' 
                                    : 'bg-white border border-[#E8E4DC] hover:border-[#0D0D0D] text-[#0D0D0D]'
                            }`}
                        >
                            <span>⚙ Bộ lọc</span>
                            {activeFiltersCount > 0 && (
                                <span className="bg-[#C9A87C] text-[#0D0D0D] w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Subcategory Pills */}
            {productTypes.length > 0 && (
                <div className="bg-[#F5F2EC] border-b border-[#E8E4DC] py-3 px-6 sm:px-12 md:px-16 lg:px-24">
                    <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => updateFilter({ productType: null })}
                            className={`py-1.5 px-4 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                !selectedProductType ? 'bg-[#0D0D0D] text-white font-semibold' : 'bg-white text-[#8A8278] hover:text-black'
                            }`}
                        >
                            Tất cả
                        </button>
                        {productTypes.map(pt => (
                            <button
                                key={pt.productType}
                                onClick={() => updateFilter({ productType: selectedProductType === pt.productType ? null : pt.productType })}
                                className={`py-1.5 px-4 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                    selectedProductType === pt.productType ? 'bg-[#0D0D0D] text-white font-semibold' : 'bg-white text-[#8A8278] hover:text-black'
                                }`}
                            >
                                {pt.productType} ({pt.count})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Product Grid Area */}
            <section className="max-w-7xl mx-auto w-full px-6 sm:px-12 md:px-16 lg:px-24 py-16 flex-1">
                {productsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                        {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-24 bg-white border border-[#E8E4DC] p-12 max-w-xl mx-auto space-y-4 rounded-2xl shadow-xs">
                        <div className="text-4xl">🛋️</div>
                        <h3 className="text-xl font-medium uppercase tracking-tight">Không tìm thấy sản phẩm</h3>
                        <p className="text-xs text-[#8A8278] leading-relaxed">
                            Hiện không có sản phẩm nào phù hợp với bộ lọc bạn đã chọn trong danh mục này.
                        </p>
                        <button
                            onClick={handleResetAll}
                            className="rounded-full py-3 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-[11px] font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all cursor-pointer"
                        >
                            Xóa bộ lọc để xem lại
                        </button>
                    </div>
                ) : (
                    <div className="space-y-16">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                            {products.map(product => (
                                <ProductCard
                                    key={product.productId}
                                    id={product.productId}
                                    name={product.name}
                                    price={product.discountPrice || product.basePrice}
                                    originalPrice={product.discountPrice ? product.basePrice : null}
                                    category={category.name}
                                    image={product.images?.[0]?.imageUrl || DEFAULT_IMAGE}
                                    discount={product.discountPrice ? Math.round((1 - product.discountPrice / product.basePrice) * 100) : null}
                                    isNew={product.isFeatured}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-8 border-t border-[#E8E4DC]">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-full border border-[#E8E4DC] bg-white text-xs font-semibold disabled:opacity-30 hover:border-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    ← Trước
                                </button>
                                {getPaginationRange(currentPage, totalPages).map((p, idx) => (
                                    p === '...' ? (
                                        <span key={idx} className="px-2 text-xs text-[#8A8278]">...</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                                                currentPage === p ? 'bg-[#0D0D0D] text-[#FDFBF7]' : 'bg-white border border-[#E8E4DC] hover:border-[#0D0D0D] text-[#0D0D0D]'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-full border border-[#E8E4DC] bg-white text-xs font-semibold disabled:opacity-30 hover:border-[#0D0D0D] transition-colors cursor-pointer"
                                >
                                    Sau →
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Slide-over Filter Drawer */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden animate-fade-up">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setIsDrawerOpen(false)} />

                    <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                        <div className="w-screen max-w-md bg-white text-[#0D0D0D] flex flex-col shadow-2xl overflow-y-auto">
                            <div className="p-6 border-b border-[#E8E4DC] flex items-center justify-between sticky top-0 bg-white z-10">
                                <h3 className="text-base font-semibold uppercase tracking-widest">Bộ lọc nâng cao</h3>
                                <button onClick={() => setIsDrawerOpen(false)} className="text-xl p-2 hover:opacity-70 cursor-pointer">✕</button>
                            </div>

                            <div className="p-6 space-y-8 flex-1">
                                {/* Price Range */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8278]">Khoảng giá (VNĐ)</h4>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={inputMinPrice}
                                            onChange={(e) => setInputMinPrice(e.target.value)}
                                            placeholder="Từ 0đ"
                                            className="w-1/2 py-2.5 px-3 border border-[#E8E4DC] rounded-xl text-xs focus:border-[#0D0D0D] focus:outline-none tabular-nums"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            value={inputMaxPrice}
                                            onChange={(e) => setInputMaxPrice(e.target.value)}
                                            placeholder="Đến 50,000,000đ"
                                            className="w-1/2 py-2.5 px-3 border border-[#E8E4DC] rounded-xl text-xs focus:border-[#0D0D0D] focus:outline-none tabular-nums"
                                        />
                                    </div>
                                    <button 
                                        onClick={() => updateFilter({ minPrice: inputMinPrice, maxPrice: inputMaxPrice })}
                                        className="w-full py-2 bg-[#F5F2EC] hover:bg-[#0D0D0D] hover:text-white text-[11px] font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                                    >
                                        Áp dụng giá
                                    </button>
                                </div>

                                {/* Colors */}
                                {colors.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8278]">Màu sắc & chất liệu</h4>
                                        <div className="flex flex-wrap gap-2.5">
                                            {colors.map(col => {
                                                const hex = getColorHex(col.color);
                                                const isSel = selectedColor === col.color;
                                                return (
                                                    <button
                                                        key={col.color}
                                                        onClick={() => updateFilter({ color: isSel ? null : col.color })}
                                                        className={`w-9 h-9 rounded-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${
                                                            isSel ? 'ring-2 ring-offset-2 ring-[#0D0D0D]' : 'border border-[#E8E4DC]'
                                                        }`}
                                                        style={{ backgroundColor: hex }}
                                                        title={`${col.color} (${col.count})`}
                                                    >
                                                        {isSel && <span className={`text-xs font-bold ${col.color.toLowerCase() === 'trắng' ? 'text-black' : 'text-white'}`}>✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Materials */}
                                {materials.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8278]">Chất liệu gỗ / nệm</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {materials.map(mat => (
                                                <button
                                                    key={mat.material}
                                                    onClick={() => updateFilter({ material: selectedMaterial === mat.material ? null : mat.material })}
                                                    className={`py-2 px-3.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                                        selectedMaterial === mat.material ? 'bg-[#0D0D0D] text-white font-semibold' : 'bg-[#F5F2EC] text-[#0D0D0D] hover:bg-[#E8E4DC]'
                                                    }`}
                                                >
                                                    {mat.material} ({mat.count})
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-[#E8E4DC] bg-[#FDFBF7] flex gap-3 sticky bottom-0">
                                <button onClick={handleResetAll} className="w-1/2 py-3.5 rounded-full border border-[#E8E4DC] bg-white hover:border-[#0D0D0D] text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors">
                                    Xóa hết
                                </button>
                                <button onClick={() => setIsDrawerOpen(false)} className="w-1/2 py-3.5 rounded-full bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] text-xs font-semibold uppercase tracking-wider cursor-pointer transition-all">
                                    Xem kết quả
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default CategoryPage;
