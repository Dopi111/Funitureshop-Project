// src/pages/ProductsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import '../index.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const getColorHex = (colorName) => {
    if (!colorName) return '#ccc';
    const cleanName = colorName.toLowerCase().trim();
    const map = {
        'nâu đen': '#3D1C0A',
        'nâu': '#8B4513',
        'xám nhạt': '#E0E0E0',
        'xám': '#808080',
        'xám nhạc': '#E0E0E0',
        'trắng': '#FFFFFF',
        'đen': '#000000',
        'xanh navy': '#003153',
        'tự nhiên': '#D2B48C',
        'vàng': '#FFD700',
        'đỏ': '#D93838',
        'xanh': '#2E7D32',
        'kem': '#FFFDD0'
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
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i);
    }
    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
};

const ProductsPage = () => {
    const location = useLocation();
    const isFeaturedPage = location.pathname === '/products';

    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Dropdown popover & Drawer states
    const [activePopover, setActivePopover] = useState(null); // 'price' | 'dimensions' | 'color' | 'material' | 'style' | null
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Filter states
    const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
    const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');

    // Dimensions states
    const [widthMin, setWidthMin] = useState(searchParams.get('minWidth') || '');
    const [widthMax, setWidthMax] = useState(searchParams.get('maxWidth') || '');
    const [heightMin, setHeightMin] = useState(searchParams.get('minHeight') || '');
    const [heightMax, setHeightMax] = useState(searchParams.get('maxHeight') || '');
    const [depthMin, setDepthMin] = useState(searchParams.get('minDepth') || '');
    const [depthMax, setDepthMax] = useState(searchParams.get('maxDepth') || '');

    const selectedCategory = searchParams.get('categoryId') || '';
    const selectedProductType = searchParams.get('productType') || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const urlMinPrice = searchParams.get('minPrice') || '';
    const urlMaxPrice = searchParams.get('maxPrice') || '';
    const selectedColor = searchParams.get('color') || '';
    const selectedMaterial = searchParams.get('material') || '';
    const urlSearch = searchParams.get('search') || '';

    // Dimensions URL values
    const urlMinWidth = searchParams.get('minWidth') || '';
    const urlMaxWidth = searchParams.get('maxWidth') || '';
    const urlMinHeight = searchParams.get('minHeight') || '';
    const urlMaxHeight = searchParams.get('maxHeight') || '';
    const urlMinDepth = searchParams.get('minDepth') || '';
    const urlMaxDepth = searchParams.get('maxDepth') || '';

    const [searchVal, setSearchVal] = useState(urlSearch);
    const pageSize = 12;

    // Scroll Lock when Drawer is open
    useEffect(() => {
        if (isDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isDrawerOpen]);

    // Sync state with URL search param
    useEffect(() => {
        setSearchVal(urlSearch);
    }, [urlSearch]);

    // Sync prices with URL price params
    useEffect(() => {
        setPriceMin(urlMinPrice);
        setPriceMax(urlMaxPrice);
    }, [urlMinPrice, urlMaxPrice]);

    // Sync dimensions with URL parameters
    useEffect(() => {
        setWidthMin(urlMinWidth);
        setWidthMax(urlMaxWidth);
        setHeightMin(urlMinHeight);
        setHeightMax(urlMaxHeight);
        setDepthMin(urlMinDepth);
        setDepthMax(urlMaxDepth);
    }, [urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth]);

    // Custom debounce
    const debounce = (func, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    // Debounced search logic (400ms)
    const debouncedSetSearchParams = useCallback(
        debounce((value) => {
            const params = {};
            if (selectedCategory) params.categoryId = selectedCategory;
            if (selectedProductType) params.productType = selectedProductType;
            if (sortBy !== 'newest') params.sortBy = sortBy;
            if (urlMinPrice) params.minPrice = urlMinPrice;
            if (urlMaxPrice) params.maxPrice = urlMaxPrice;
            if (selectedColor) params.color = selectedColor;
            if (selectedMaterial) params.material = selectedMaterial;
            
            // Dimensions
            if (urlMinWidth) params.minWidth = urlMinWidth;
            if (urlMaxWidth) params.maxWidth = urlMaxWidth;
            if (urlMinHeight) params.minHeight = urlMinHeight;
            if (urlMaxHeight) params.maxHeight = urlMaxHeight;
            if (urlMinDepth) params.minDepth = urlMinDepth;
            if (urlMaxDepth) params.maxDepth = urlMaxDepth;

            if (value) params.search = value;
            setSearchParams(params);
        }, 400),
        [selectedCategory, selectedProductType, sortBy, urlMinPrice, urlMaxPrice, selectedColor, selectedMaterial, urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth, setSearchParams]
    );

    const onSearchInputChange = (e) => {
        const val = e.target.value;
        setSearchVal(val);
        debouncedSetSearchParams(val);
    };

    // Debounced dimensions update (300ms as requested)
    const debouncedApplyDimensions = useCallback(
        debounce((newParams) => {
            const params = {};
            if (selectedCategory) params.categoryId = selectedCategory;
            if (selectedProductType) params.productType = selectedProductType;
            if (sortBy !== 'newest') params.sortBy = sortBy;
            if (urlMinPrice) params.minPrice = urlMinPrice;
            if (urlMaxPrice) params.maxPrice = urlMaxPrice;
            if (selectedColor) params.color = selectedColor;
            if (selectedMaterial) params.material = selectedMaterial;
            if (urlSearch) params.search = urlSearch;

            // Merge current URL params with newly changed dimensions
            const minW = newParams.minWidth !== undefined ? newParams.minWidth : urlMinWidth;
            const maxW = newParams.maxWidth !== undefined ? newParams.maxWidth : urlMaxWidth;
            const minH = newParams.minHeight !== undefined ? newParams.minHeight : urlMinHeight;
            const maxH = newParams.maxHeight !== undefined ? newParams.maxHeight : urlMaxHeight;
            const minD = newParams.minDepth !== undefined ? newParams.minDepth : urlMinDepth;
            const maxD = newParams.maxDepth !== undefined ? newParams.maxDepth : urlMaxDepth;

            if (minW) params.minWidth = minW;
            if (maxW) params.maxWidth = maxW;
            if (minH) params.minHeight = minH;
            if (maxH) params.maxHeight = maxH;
            if (minD) params.minDepth = minD;
            if (maxD) params.maxDepth = maxD;

            setSearchParams(params);
        }, 300),
        [selectedCategory, selectedProductType, sortBy, urlMinPrice, urlMaxPrice, selectedColor, selectedMaterial, urlSearch, urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth, setSearchParams]
    );

    const handleDimensionChange = (key, val) => {
        if (key === 'minWidth') setWidthMin(val);
        if (key === 'maxWidth') setWidthMax(val);
        if (key === 'minHeight') setHeightMin(val);
        if (key === 'maxHeight') setHeightMax(val);
        if (key === 'minDepth') setDepthMin(val);
        if (key === 'maxDepth') setDepthMax(val);

        debouncedApplyDimensions({ [key]: val });
    };

    // Fetch initial filter lists
    useEffect(() => {
        if (!isFeaturedPage) {
            // Fetch root categories
            fetch('/api/categories/all')
                .then(r => r.json())
                .then(data => setCategories((data || []).filter(c => c.isActive && !c.parentId)))
                .catch(() => {});

            // Fetch product types
            fetch('/api/product-types/stats')
                .then(r => r.json())
                .then(res => {
                    if (res.success) setProductTypes(res.data || []);
                })
                .catch(() => {});

            // Fetch unique colors
            fetch('/api/products/colors')
                .then(r => r.json())
                .then(data => setColors(data || []))
                .catch(() => {});

            // Fetch unique materials
            fetch('/api/products/materials')
                .then(r => r.json())
                .then(data => setMaterials(data || []))
                .catch(() => {});
        }
    }, [isFeaturedPage]);

    // Fetch products
    const fetchProducts = useCallback(async (
        page = 1,
        catId = selectedCategory,
        productType = selectedProductType,
        sort = sortBy,
        minP = urlMinPrice,
        maxP = urlMaxPrice,
        colorVal = selectedColor,
        materialVal = selectedMaterial,
        searchValStr = urlSearch,
        minW = urlMinWidth,
        maxW = urlMaxWidth,
        minH = urlMinHeight,
        maxH = urlMaxHeight,
        minD = urlMinDepth,
        maxD = urlMaxDepth
    ) => {
        try {
            setProductsLoading(true);
            const params = new URLSearchParams({ page, pageSize, sortBy: sort });
            if (isFeaturedPage) {
                params.append('isFeatured', 'true');
            } else {
                if (catId) params.append('categoryId', catId);
                if (productType) params.append('productType', productType);
                if (minP) params.append('minPrice', minP);
                if (maxP) params.append('maxPrice', maxP);
                if (colorVal) params.append('color', colorVal);
                if (materialVal) params.append('material', materialVal);
                if (searchValStr) params.append('search', searchValStr);

                // Kích thước
                if (minW) params.append('minWidth', minW);
                if (maxW) params.append('maxWidth', maxW);
                if (minH) params.append('minHeight', minH);
                if (maxH) params.append('maxHeight', maxH);
                if (minD) params.append('minDepth', minD);
                if (maxD) params.append('maxDepth', maxD);
            }

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();
            setProducts(data.data || []);
            setTotalPages(data.totalPages || 1);
            setTotalCount(data.totalCount || 0);
            setCurrentPage(page);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setProductsLoading(false);
            setLoading(false);
        }
    }, [isFeaturedPage, selectedCategory, selectedProductType, sortBy, urlMinPrice, urlMaxPrice, selectedColor, selectedMaterial, urlSearch, urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth]);

    // Fetch products on filter changes
    useEffect(() => {
        fetchProducts(currentPage, selectedCategory, selectedProductType, sortBy, urlMinPrice, urlMaxPrice, selectedColor, selectedMaterial, urlSearch, urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth);
    }, [currentPage, selectedCategory, selectedProductType, sortBy, urlMinPrice, urlMaxPrice, selectedColor, selectedMaterial, urlSearch, urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth, fetchProducts]);

    const handleCategoryChange = (catId) => {
        const params = {};
        if (catId) params.categoryId = catId;
        if (selectedProductType) params.productType = selectedProductType;
        if (sortBy !== 'newest') params.sortBy = sortBy;
        if (urlMinPrice) params.minPrice = urlMinPrice;
        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
        if (selectedColor) params.color = selectedColor;
        if (selectedMaterial) params.material = selectedMaterial;
        if (urlSearch) params.search = urlSearch;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handleProductTypeChange = (productType) => {
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (productType) params.productType = productType;
        if (sortBy !== 'newest') params.sortBy = sortBy;
        if (urlMinPrice) params.minPrice = urlMinPrice;
        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
        if (selectedColor) params.color = selectedColor;
        if (selectedMaterial) params.material = selectedMaterial;
        if (urlSearch) params.search = urlSearch;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handleSortChange = (newSort) => {
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedProductType) params.productType = selectedProductType;
        if (newSort !== 'newest') params.sortBy = newSort;
        if (urlMinPrice) params.minPrice = urlMinPrice;
        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
        if (selectedColor) params.color = selectedColor;
        if (selectedMaterial) params.material = selectedMaterial;
        if (urlSearch) params.search = urlSearch;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handlePriceFilter = () => {
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedProductType) params.productType = selectedProductType;
        if (sortBy !== 'newest') params.sortBy = sortBy;
        if (priceMin) params.minPrice = priceMin;
        if (priceMax) params.maxPrice = priceMax;
        if (selectedColor) params.color = selectedColor;
        if (selectedMaterial) params.material = selectedMaterial;
        if (urlSearch) params.search = urlSearch;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handleClearPriceFilter = () => {
        setPriceMin('');
        setPriceMax('');
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedProductType) params.productType = selectedProductType;
        if (sortBy !== 'newest') params.sortBy = sortBy;
        if (selectedColor) params.color = selectedColor;
        if (selectedMaterial) params.material = selectedMaterial;
        if (urlSearch) params.search = urlSearch;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handleColorChange = (color) => {
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedProductType) params.productType = selectedProductType;
        if (sortBy !== 'newest') params.sortBy = sortBy;
        if (urlMinPrice) params.minPrice = urlMinPrice;
        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
        if (selectedMaterial) params.material = selectedMaterial;
        if (urlSearch) params.search = urlSearch;
        if (color) params.color = color;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handleMaterialChange = (material) => {
        const params = {};
        if (selectedCategory) params.categoryId = selectedCategory;
        if (selectedProductType) params.productType = selectedProductType;
        if (sortBy !== 'newest') params.sortBy = sortBy;
        if (urlMinPrice) params.minPrice = urlMinPrice;
        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
        if (selectedColor) params.color = selectedColor;
        if (urlSearch) params.search = urlSearch;
        if (material) params.material = material;

        // Keep dimensions
        if (urlMinWidth) params.minWidth = urlMinWidth;
        if (urlMaxWidth) params.maxWidth = urlMaxWidth;
        if (urlMinHeight) params.minHeight = urlMinHeight;
        if (urlMaxHeight) params.maxHeight = urlMaxHeight;
        if (urlMinDepth) params.minDepth = urlMinDepth;
        if (urlMaxDepth) params.maxDepth = urlMaxDepth;

        setSearchParams(params);
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            fetchProducts(page, selectedCategory, selectedProductType, sortBy, urlMinPrice, urlMaxPrice, selectedColor, selectedMaterial, urlSearch, urlMinWidth, urlMaxWidth, urlMinHeight, urlMaxHeight, urlMinDepth, urlMaxDepth);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const pageTitle = isFeaturedPage ? 'Sản phẩm nổi bật' : 'Tất cả sản phẩm';
    const breadcrumb = isFeaturedPage ? 'Sản phẩm nổi bật' : 'Sản phẩm';

    return (
        <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
            <Navbar />

            {/* Dark Hero Banner */}
            <div className="h-[22vh] min-h-[180px] flex items-center justify-center bg-[#0D0D0D] relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${DEFAULT_IMAGE})` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0D0D]/60" />
                <div className="relative z-10 text-center px-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A87C] font-semibold mb-2 block">Premium Collection</span>
                    <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-[#FDFBF7] uppercase">{pageTitle}</h1>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="bg-[#F5F2EC] py-4 border-b border-[#E8E4DC]">
                <div className="max-w-[1440px] mx-auto px-6">
                    <nav className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#8A8278]">
                        <Link to="/" className="hover:text-[#0D0D0D] transition-colors">Trang chủ</Link>
                        <span className="text-[#E8E4DC]">/</span>
                        <span className="text-[#0D0D0D] font-medium">{breadcrumb}</span>
                    </nav>
                </div>
            </div>

            <section className="flex-1 py-12 md:py-16">
                <div className="max-w-[1440px] mx-auto px-6">
                    
                    {/* Horizontal Filter Bar (Desktop only) */}
                    {!isFeaturedPage && (
                        <>
                            <div className="hidden lg:flex flex-wrap items-center justify-between gap-6 mb-8 relative">
                                <div className="flex flex-wrap items-center gap-3">
                                    {activePopover && <div className="fixed inset-0 z-20" onClick={() => setActivePopover(null)} />}

                                    {/* 1. Khoảng giá */}
                                    <div className="relative">
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold tracking-wider uppercase border rounded-full bg-white hover:border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                                                (urlMinPrice || urlMaxPrice) ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'text-[#0D0D0D] border-[#E8E4DC]'
                                            }`} 
                                            onClick={() => setActivePopover(activePopover === 'price' ? null : 'price')}
                                        >
                                            Khoảng giá {(urlMinPrice || urlMaxPrice) && '•'} <span className="text-[10px] opacity-60">▼</span>
                                        </button>
                                        {activePopover === 'price' && (
                                            <div className="absolute left-0 mt-3 z-30 bg-white border border-[#E8E4DC] p-6 w-[300px] shadow-[0_12px_32px_rgba(13,13,13,0.12)]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] mb-4">Khoảng giá</h4>
                                                <div className="flex gap-2 mb-4">
                                                    <input
                                                        type="number"
                                                        placeholder="Tối thiểu (VND)"
                                                        value={priceMin}
                                                        onChange={(e) => setPriceMin(e.target.value)}
                                                        className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Tối đa (VND)"
                                                        value={priceMax}
                                                        onChange={(e) => setPriceMax(e.target.value)}
                                                        className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2 border-t border-[#E8E4DC] pt-4">
                                                    <button className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#8A8278] hover:text-[#0D0D0D] cursor-pointer" onClick={() => { handleClearPriceFilter(); setActivePopover(null); }}>Xóa</button>
                                                    <button className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer" onClick={() => { handlePriceFilter(); setActivePopover(null); }}>Áp dụng</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Kích thước */}
                                    <div className="relative">
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold tracking-wider uppercase border rounded-full bg-white hover:border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                                                (urlMinWidth || urlMaxWidth || urlMinHeight || urlMaxHeight || urlMinDepth || urlMaxDepth) ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'text-[#0D0D0D] border-[#E8E4DC]'
                                            }`}
                                            onClick={() => setActivePopover(activePopover === 'dimensions' ? null : 'dimensions')}
                                        >
                                            Kích thước {(urlMinWidth || urlMaxWidth || urlMinHeight || urlMaxHeight || urlMinDepth || urlMaxDepth) && '•'} <span className="text-[10px] opacity-60">▼</span>
                                        </button>
                                        {activePopover === 'dimensions' && (
                                            <div className="absolute left-0 mt-3 z-30 bg-white border border-[#E8E4DC] p-6 w-[340px] shadow-[0_12px_32px_rgba(13,13,13,0.12)]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] mb-4">Kích thước sản phẩm (cm)</h4>
                                                
                                                <div className="flex flex-col gap-3 mb-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <label className="text-[11px] uppercase tracking-wider font-medium text-[#8A8278] w-[90px]">Chiều Dài (D):</label>
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <input type="number" placeholder="Min" value={widthMin} onChange={(e) => handleDimensionChange('minWidth', e.target.value)} className="w-[80px] px-2.5 py-1.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]" />
                                                            <span className="text-[#8A8278]">-</span>
                                                            <input type="number" placeholder="Max" value={widthMax} onChange={(e) => handleDimensionChange('maxWidth', e.target.value)} className="w-[80px] px-2.5 py-1.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4">
                                                        <label className="text-[11px] uppercase tracking-wider font-medium text-[#8A8278] w-[90px]">Chiều Rộng (R):</label>
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <input type="number" placeholder="Min" value={depthMin} onChange={(e) => handleDimensionChange('minDepth', e.target.value)} className="w-[80px] px-2.5 py-1.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]" />
                                                            <span className="text-[#8A8278]">-</span>
                                                            <input type="number" placeholder="Max" value={depthMax} onChange={(e) => handleDimensionChange('maxDepth', e.target.value)} className="w-[80px] px-2.5 py-1.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-4">
                                                        <label className="text-[11px] uppercase tracking-wider font-medium text-[#8A8278] w-[90px]">Chiều Cao (C):</label>
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <input type="number" placeholder="Min" value={heightMin} onChange={(e) => handleDimensionChange('minHeight', e.target.value)} className="w-[80px] px-2.5 py-1.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]" />
                                                            <span className="text-[#8A8278]">-</span>
                                                            <input type="number" placeholder="Max" value={heightMax} onChange={(e) => handleDimensionChange('maxHeight', e.target.value)} className="w-[80px] px-2.5 py-1.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2 border-t border-[#E8E4DC] pt-4">
                                                    <button className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#8A8278] hover:text-[#0D0D0D] cursor-pointer" onClick={() => {
                                                        setWidthMin(''); setWidthMax('');
                                                        setHeightMin(''); setHeightMax('');
                                                        setDepthMin(''); setDepthMax('');
                                                        debouncedApplyDimensions({
                                                            minWidth: '', maxWidth: '',
                                                            minHeight: '', maxHeight: '',
                                                            minDepth: '', maxDepth: ''
                                                        });
                                                        setActivePopover(null);
                                                    }}>Xóa</button>
                                                    <button className="px-4 py-1.5 text-[10px] uppercase font-bold tracking-wider bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] cursor-pointer" onClick={() => setActivePopover(null)}>Đóng</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. Màu sắc & Vân gỗ */}
                                    <div className="relative">
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold tracking-wider uppercase border rounded-full bg-white hover:border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                                                selectedColor ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'text-[#0D0D0D] border-[#E8E4DC]'
                                            }`}
                                            onClick={() => setActivePopover(activePopover === 'color' ? null : 'color')}
                                        >
                                            Màu sắc {selectedColor && '•'} <span className="text-[10px] opacity-60">▼</span>
                                        </button>
                                        {activePopover === 'color' && (
                                            <div className="absolute left-0 mt-3 z-30 bg-white border border-[#E8E4DC] p-6 w-[280px] shadow-[0_12px_32px_rgba(13,13,13,0.12)]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] mb-4">Màu sắc & Vân gỗ</h4>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {colors.map(col => {
                                                        const hex = getColorHex(col.color);
                                                        const isSelected = selectedColor === col.color;
                                                        return (
                                                            <button
                                                                key={col.color}
                                                                onClick={() => {
                                                                    handleColorChange(isSelected ? null : col.color);
                                                                    setActivePopover(null);
                                                                }}
                                                                className={`w-8 h-8 rounded-full border cursor-pointer relative flex items-center justify-center transition-transform hover:scale-110 ${
                                                                    isSelected ? 'border-[#C9A87C] ring-2 ring-[#C9A87C]/30' : 'border-[#E8E4DC]'
                                                                }`}
                                                                style={{ backgroundColor: hex }}
                                                                title={`${col.color} (${col.count})`}
                                                            >
                                                                {isSelected && (
                                                                    <span className={`text-[10px] font-bold ${
                                                                        (col.color.toLowerCase() === 'trắng' || col.color.toLowerCase() === 'tự nhiên' || col.color.toLowerCase() === 'kem') ? 'text-[#0D0D0D]' : 'text-white'
                                                                    }`}>
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 4. Chất liệu */}
                                    <div className="relative">
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold tracking-wider uppercase border rounded-full bg-white hover:border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                                                selectedMaterial ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'text-[#0D0D0D] border-[#E8E4DC]'
                                            }`}
                                            onClick={() => setActivePopover(activePopover === 'material' ? null : 'material')}
                                        >
                                            Chất liệu {selectedMaterial && '•'} <span className="text-[10px] opacity-60">▼</span>
                                        </button>
                                        {activePopover === 'material' && (
                                            <div className="absolute left-0 mt-3 z-30 bg-white border border-[#E8E4DC] w-[260px] shadow-[0_12px_32px_rgba(13,13,13,0.12)]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] p-5 pb-2 border-b border-[#E8E4DC]/40">Chất liệu</h4>
                                                <ul className="max-h-[250px] overflow-y-auto py-2">
                                                    <li>
                                                        <button
                                                            className={`w-full text-left px-5 py-2.5 text-xs transition-colors cursor-pointer hover:bg-[#F5F2EC] ${!selectedMaterial ? 'font-semibold text-[#C9A87C]' : 'text-[#8A8278]'}`}
                                                            onClick={() => { handleMaterialChange(''); setActivePopover(null); }}
                                                        >
                                                            Tất cả chất liệu
                                                        </button>
                                                    </li>
                                                    {materials.map(mat => (
                                                        <li key={mat.material}>
                                                            <button
                                                                className={`w-full text-left px-5 py-2.5 text-xs transition-colors cursor-pointer hover:bg-[#F5F2EC] flex items-center justify-between ${
                                                                    selectedMaterial === mat.material ? 'font-semibold text-[#C9A87C] bg-[#F5F2EC]/40' : 'text-[#0D0D0D]'
                                                                }`}
                                                                onClick={() => { handleMaterialChange(mat.material); setActivePopover(null); }}
                                                            >
                                                                <span>{mat.material}</span>
                                                                <span className="text-[10px] text-[#8A8278]">({mat.count})</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* 5. Phong cách */}
                                    <div className="relative">
                                        <button 
                                            className={`px-5 py-2.5 text-xs font-semibold tracking-wider uppercase border rounded-full bg-white hover:border-[#0D0D0D] transition-all cursor-pointer flex items-center gap-1.5 ${
                                                (urlSearch && (urlSearch === 'Tối giản' || urlSearch === 'Scandinavian' || urlSearch === 'Hiện đại' || urlSearch === 'Cổ điển' || urlSearch === 'Indochine')) ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'text-[#0D0D0D] border-[#E8E4DC]'
                                            }`}
                                            onClick={() => setActivePopover(activePopover === 'style' ? null : 'style')}
                                        >
                                            Phong cách {urlSearch && (urlSearch === 'Tối giản' || urlSearch === 'Scandinavian' || urlSearch === 'Hiện đại' || urlSearch === 'Cổ điển' || urlSearch === 'Indochine') && '•'} <span className="text-[10px] opacity-60">▼</span>
                                        </button>
                                        {activePopover === 'style' && (
                                            <div className="absolute left-0 mt-3 z-30 bg-white border border-[#E8E4DC] p-5 w-[260px] shadow-[0_12px_32px_rgba(13,13,13,0.12)]">
                                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0D0D0D] mb-3">Phong cách</h4>
                                                <div className="flex flex-col gap-1.5">
                                                    {[
                                                        { name: 'Tối giản', label: 'Tối giản (Japandi)' },
                                                        { name: 'Scandinavian', label: 'Bắc Âu (Scandi)' },
                                                        { name: 'Hiện đại', label: 'Hiện đại (Modern)' },
                                                        { name: 'Cổ điển', label: 'Cổ điển' },
                                                        { name: 'Indochine', label: 'Đông Dương (Indochine)' }
                                                    ].map(styleObj => {
                                                        const isSelected = urlSearch === styleObj.name;
                                                        return (
                                                            <button
                                                                key={styleObj.name}
                                                                className={`w-full text-left px-3 py-2 text-xs transition-all cursor-pointer border hover:border-[#0d0d0d] ${
                                                                    isSelected ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'bg-transparent text-[#0D0D0D] border-[#E8E4DC]'
                                                                }`}
                                                                onClick={() => {
                                                                    const params = {};
                                                                    if (selectedCategory) params.categoryId = selectedCategory;
                                                                    if (selectedProductType) params.productType = selectedProductType;
                                                                    if (sortBy !== 'newest') params.sortBy = sortBy;
                                                                    if (urlMinPrice) params.minPrice = urlMinPrice;
                                                                    if (urlMaxPrice) params.maxPrice = urlMaxPrice;
                                                                    if (selectedColor) params.color = selectedColor;
                                                                    if (selectedMaterial) params.material = selectedMaterial;
                                                                    
                                                                    // Keep dimensions
                                                                    if (urlMinWidth) params.minWidth = urlMinWidth;
                                                                    if (urlMaxWidth) params.maxWidth = urlMaxWidth;
                                                                    if (urlMinHeight) params.minHeight = urlMinHeight;
                                                                    if (urlMaxHeight) params.maxHeight = urlMaxHeight;
                                                                    if (urlMinDepth) params.minDepth = urlMinDepth;
                                                                    if (urlMaxDepth) params.maxDepth = urlMaxDepth;

                                                                    if (!isSelected) {
                                                                        params.search = styleObj.name;
                                                                        setSearchVal(styleObj.name);
                                                                    } else {
                                                                        setSearchVal('');
                                                                    }
                                                                    setSearchParams(params);
                                                                    setActivePopover(null);
                                                                }}
                                                            >
                                                                {styleObj.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    className="px-5 py-2.5 text-xs font-bold tracking-wider uppercase border border-[#0d0d0d] bg-[#0d0d0d] text-[#FDFBF7] hover:bg-transparent hover:text-[#0d0d0d] transition-all cursor-pointer" 
                                    onClick={() => setIsDrawerOpen(true)}
                                >
                                    🎨 Thêm bộ lọc +
                                </button>
                            </div>

                            {/* Mobile Filters Trigger */}
                            <div className="lg:hidden mb-6">
                                <button 
                                    className="w-full py-3.5 text-xs font-bold tracking-widest uppercase bg-[#0D0D0D] text-[#FDFBF7] flex items-center justify-center gap-2 hover:bg-[#C9A87C] hover:text-[#0d0d0d] transition-all cursor-pointer" 
                                    onClick={() => setIsDrawerOpen(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="4" y1="21" x2="4" y2="14" />
                                        <line x1="4" y1="10" x2="4" y2="3" />
                                        <line x1="12" y1="21" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12" y2="3" />
                                        <line x1="20" y1="21" x2="20" y2="16" />
                                        <line x1="20" y1="12" x2="20" y2="3" />
                                        <line x1="1" y1="14" x2="7" y2="14" />
                                        <line x1="9" y1="8" x2="15" y2="8" />
                                        <line x1="17" y1="16" x2="23" y2="16" />
                                    </svg>
                                    Bộ lọc & Tìm kiếm
                                </button>
                            </div>
                        </>
                    )}

                    {/* Toolbar and Results Info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E8E4DC]">
                        {/* Active Filter Badges */}
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                            {selectedCategory && categories.find(c => String(c.categoryId) === selectedCategory) && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Danh mục: {categories.find(c => String(c.categoryId) === selectedCategory).name}
                                    <button onClick={() => handleCategoryChange('')} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {selectedProductType && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Loại: {selectedProductType}
                                    <button onClick={() => handleProductTypeChange('')} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {selectedColor && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Màu: {selectedColor}
                                    <button onClick={() => handleColorChange(null)} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {selectedMaterial && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Chất liệu: {selectedMaterial}
                                    <button onClick={() => handleMaterialChange('')} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {urlSearch && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Tìm kiếm: "{urlSearch}"
                                    <button onClick={() => {
                                        setSearchVal('');
                                        const params = {};
                                        if (selectedCategory) params.categoryId = selectedCategory;
                                        if (selectedProductType) params.productType = selectedProductType;
                                        if (sortBy !== 'newest') params.sortBy = sortBy;
                                        if (urlMinPrice) params.minPrice = urlMinPrice;
                                        if (urlMaxPrice) params.maxPrice = urlMaxPrice;
                                        if (selectedColor) params.color = selectedColor;
                                        if (selectedMaterial) params.material = selectedMaterial;
                                        setSearchParams(params);
                                    }} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {(urlMinWidth || urlMaxWidth) && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Dài: {urlMinWidth || 0} - {urlMaxWidth || '∞'} cm
                                    <button onClick={() => { setWidthMin(''); setWidthMax(''); debouncedApplyDimensions({ minWidth: '', maxWidth: '' }); }} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {(urlMinDepth || urlMaxDepth) && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Rộng: {urlMinDepth || 0} - {urlMaxDepth || '∞'} cm
                                    <button onClick={() => { setDepthMin(''); setDepthMax(''); debouncedApplyDimensions({ minDepth: '', maxDepth: '' }); }} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            {(urlMinHeight || urlMaxHeight) && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F2EC] text-[#0D0D0D] text-[10px] uppercase tracking-wider font-semibold border border-[#E8E4DC]">
                                    Cao: {urlMinHeight || 0} - {urlMaxHeight || '∞'} cm
                                    <button onClick={() => { setHeightMin(''); setHeightMax(''); debouncedApplyDimensions({ minHeight: '', maxHeight: '' }); }} className="text-[#8A8278] hover:text-red-500 font-bold ml-1 cursor-pointer">×</button>
                                </span>
                            )}
                            
                            <span className="text-[#8A8278] tracking-wide text-xs">
                                Hiển thị <span className="font-semibold text-[#0D0D0D]">{products.length}</span> / {totalCount} sản phẩm
                            </span>
                        </div>

                        {/* Sort Dropdown */}
                        {!isFeaturedPage && (
                            <div className="flex items-center gap-3.5 self-end md:self-auto">
                                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278]">Sắp xếp:</span>
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        className="appearance-none bg-white border border-[#E8E4DC] px-5 py-2 text-xs font-semibold tracking-wider uppercase text-[#0D0D0D] pr-10 focus:outline-none focus:border-[#0d0d0d] rounded-none cursor-pointer"
                                    >
                                        <option value="newest">Mới nhất</option>
                                        <option value="price_asc">Giá thấp → cao</option>
                                        <option value="price_desc">Giá cao → thấp</option>
                                        <option value="name">Tên A-Z</option>
                                        <option value="popular">Bán chạy nhất</option>
                                    </select>
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] text-[#8A8278]">▼</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Products Grid / States */}
                    {productsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                            {[...Array(isFeaturedPage ? 4 : 12)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-24 bg-white border border-[#E8E4DC] flex flex-col items-center justify-center px-6">
                            <svg className="text-[#8A8278]/40 mb-4 animate-spin-slow" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                            <h3 className="text-base uppercase tracking-wider font-semibold text-[#0d0d0d] mb-1.5">Không tìm thấy sản phẩm</h3>
                            <p className="text-sm text-[#8A8278] max-w-sm">Chưa có sản phẩm nào khớp với bộ lọc của bạn. Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-up">
                                {products.map(product => (
                                    <ProductCard
                                        key={product.productId}
                                        id={product.productId}
                                        name={product.name}
                                        price={product.discountPrice || product.basePrice}
                                        originalPrice={product.discountPrice ? product.basePrice : null}
                                        category={product.category?.name || product.productType}
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
                                <div className="flex items-center justify-center gap-6 mt-16 pt-8 border-t border-[#E8E4DC]/60">
                                    <button 
                                        className="text-xs font-bold uppercase tracking-wider text-[#8A8278] hover:text-[#0d0d0d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        ← Trước
                                    </button>
                                    <div className="flex items-center gap-2">
                                        {getPaginationRange(currentPage, totalPages).map((pageNum, idx) =>
                                            pageNum === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="text-xs text-[#8A8278] px-1">...</span>
                                            ) : (
                                                <button 
                                                    key={pageNum}
                                                    className={`w-9 h-9 flex items-center justify-center text-xs font-semibold rounded-full transition-all cursor-pointer ${
                                                        currentPage === pageNum 
                                                            ? 'bg-[#0D0D0D] text-[#FDFBF7]' 
                                                            : 'border border-[#E8E4DC] text-[#8A8278] hover:border-[#0D0D0D] hover:text-[#0D0D0D]'
                                                    }`}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        )}
                                    </div>
                                    <button 
                                        className="text-xs font-bold uppercase tracking-wider text-[#8A8278] hover:text-[#0d0d0d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Tiếp →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* All Filters Slide-out Drawer */}
            <div 
                className={`fixed inset-0 z-50 bg-[#0D0D0D]/60 backdrop-blur-xs transition-opacity duration-300 ${
                    isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`} 
                onClick={() => setIsDrawerOpen(false)}
            >
                <div 
                    className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transition-transform duration-[400ms] cubic-bezier(0.16, 1, 0.3, 1) ${
                        isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`} 
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b border-[#E8E4DC]">
                        <h3 className="text-base uppercase tracking-wider font-semibold text-[#0d0d0d]">Bộ lọc nâng cao</h3>
                        <button className="text-2xl text-[#8A8278] hover:text-[#0D0D0D] transition-colors cursor-pointer" onClick={() => setIsDrawerOpen(false)}>×</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* 1. Từ khóa tìm kiếm */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8278]">Từ khóa tìm kiếm</h4>
                            <input
                                type="text"
                                placeholder="Gõ từ khóa..."
                                value={searchVal}
                                onChange={onSearchInputChange}
                                className="w-full px-4 py-3 text-sm border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]"
                            />
                        </div>

                        {/* 2. Khoảng giá (Drawer version) */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8278]">Khoảng giá (VND)</h4>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Tối thiểu"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    className="w-1/2 px-4 py-2.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]"
                                />
                                <input
                                    type="number"
                                    placeholder="Tối đa"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    className="w-1/2 px-4 py-2.5 text-xs border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D]"
                                />
                            </div>
                            <button
                                onClick={handlePriceFilter}
                                className="w-full py-3 text-xs font-bold uppercase tracking-widest bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all cursor-pointer"
                            >
                                Áp dụng giá
                            </button>
                        </div>

                        {/* 3. Danh mục */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8278]">Danh mục</h4>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className={`px-4 py-2 text-xs border cursor-pointer ${
                                        !selectedCategory ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'bg-transparent text-[#0D0D0D] border-[#E8E4DC]'
                                    }`}
                                    onClick={() => handleCategoryChange('')}
                                >
                                    Tất cả danh mục
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.categoryId}
                                        className={`px-4 py-2 text-xs border cursor-pointer ${
                                            selectedCategory === String(cat.categoryId) ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'bg-transparent text-[#0D0D0D] border-[#E8E4DC]'
                                        }`}
                                        onClick={() => handleCategoryChange(cat.categoryId)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4. Loại sản phẩm */}
                        {productTypes.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8278]">Loại sản phẩm</h4>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className={`px-4 py-2 text-xs border cursor-pointer ${
                                            !selectedProductType ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'bg-transparent text-[#0D0D0D] border-[#E8E4DC]'
                                        }`}
                                        onClick={() => handleProductTypeChange('')}
                                    >
                                        Tất cả loại
                                    </button>
                                    {productTypes.map(type => (
                                        <button
                                            key={type.productType}
                                            className={`px-4 py-2 text-xs border cursor-pointer ${
                                                selectedProductType === type.productType ? 'bg-[#0D0D0D] text-[#FDFBF7] border-[#0D0D0D]' : 'bg-transparent text-[#0D0D0D] border-[#E8E4DC]'
                                            }`}
                                            onClick={() => handleProductTypeChange(type.productType)}
                                        >
                                            {type.productType} ({type.count})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. Kích thước (Drawer version) */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8A8278]">Kích thước (cm)</h4>
                            <div className="space-y-3.5">
                                <div>
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8278] block mb-1">Chiều Dài (D):</label>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Min" value={widthMin} onChange={(e) => handleDimensionChange('minWidth', e.target.value)} className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC]" />
                                        <input type="number" placeholder="Max" value={widthMax} onChange={(e) => handleDimensionChange('maxWidth', e.target.value)} className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8278] block mb-1">Chiều Rộng (R):</label>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Min" value={depthMin} onChange={(e) => handleDimensionChange('minDepth', e.target.value)} className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC]" />
                                        <input type="number" placeholder="Max" value={depthMax} onChange={(e) => handleDimensionChange('maxDepth', e.target.value)} className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8278] block mb-1">Chiều Cao (C):</label>
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Min" value={heightMin} onChange={(e) => handleDimensionChange('minHeight', e.target.value)} className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC]" />
                                        <input type="number" placeholder="Max" value={heightMax} onChange={(e) => handleDimensionChange('maxHeight', e.target.value)} className="w-1/2 px-3 py-2 text-xs border border-[#E8E4DC]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#E8E4DC] flex gap-4">
                        <button 
                            className="w-1/2 py-3 text-xs font-bold uppercase tracking-widest border border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#F5F2EC] transition-all cursor-pointer text-center" 
                            onClick={() => {
                                setPriceMin(''); setPriceMax('');
                                setSearchVal('');
                                setWidthMin(''); setWidthMax('');
                                setHeightMin(''); setHeightMax('');
                                setDepthMin(''); setDepthMax('');
                                setSearchParams({});
                                setIsDrawerOpen(false);
                            }}
                        >
                            Xóa tất cả
                        </button>
                        <button 
                            className="w-1/2 py-3 text-xs font-bold uppercase tracking-widest bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all cursor-pointer text-center" 
                            onClick={() => setIsDrawerOpen(false)}
                        >
                            Hiển thị {totalCount}
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProductsPage;
