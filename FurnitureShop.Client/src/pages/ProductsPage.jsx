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
    <div className="product-card" style={{ animation: 'pulse 1.5s infinite' }}>
        <div style={{ width: '100%', paddingBottom: '75%', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: '8px', marginBottom: '12px' }} />
        <div style={{ height: '16px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '80%' }} />
        <div style={{ height: '14px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '8px', width: '50%' }} />
        <div style={{ height: '20px', background: '#f0f0f0', borderRadius: '4px', width: '60%' }} />
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
                .catch(() => { });

            // Fetch product types
            fetch('/api/product-types/stats')
                .then(r => r.json())
                .then(res => {
                    if (res.success) setProductTypes(res.data || []);
                })
                .catch(() => { });

            // Fetch unique colors
            fetch('/api/products/colors')
                .then(r => r.json())
                .then(data => setColors(data || []))
                .catch(() => { });

            // Fetch unique materials
            fetch('/api/products/materials')
                .then(r => r.json())
                .then(data => setMaterials(data || []))
                .catch(() => { });
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
        <div className="app">
            <Navbar />

            <div className="category-hero" style={{ minHeight: '180px' }}>
                <div className="category-hero-bg" style={{ backgroundImage: `url(${DEFAULT_IMAGE})` }} />
                <div className="category-hero-overlay" />
                <div className="category-hero-content">
                    <h1 className="category-hero-title">{pageTitle}</h1>
                </div>
            </div>

            <div className="breadcrumb-container">
                <div className="container">
                    <nav className="breadcrumb">
                        <Link to="/">Trang chủ</Link>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">{breadcrumb}</span>
                    </nav>
                </div>
            </div>

            <section className="category-section">
                <div className="container">
                    {/* Horizontal Filter Bar - chỉ hiện khi xem tất cả sản phẩm & không phải trang featured */}
                    {!isFeaturedPage && (
                        <>
                            {/* Desktop Filter Bar */}
                            <div className="horizontal-filter-bar-desktop">
                                {activePopover && <div className="popover-backdrop" onClick={() => setActivePopover(null)} />}

                                {/* 1. Khoảng giá */}
                                <div className={`filter-item ${activePopover === 'price' ? 'active' : ''}`}>
                                    <button className="filter-button" onClick={() => setActivePopover(activePopover === 'price' ? null : 'price')}>
                                        Khoảng giá {(urlMinPrice || urlMaxPrice) && '•'} ▾
                                    </button>
                                    {activePopover === 'price' && (
                                        <div className="filter-popover">
                                            <h4>Khoảng giá</h4>
                                            <div className="popover-price-inputs">
                                                <input
                                                    type="number"
                                                    placeholder="Tối thiểu (VND)"
                                                    value={priceMin}
                                                    onChange={(e) => setPriceMin(e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder="Tối đa (VND)"
                                                    value={priceMax}
                                                    onChange={(e) => setPriceMax(e.target.value)}
                                                />
                                            </div>
                                            <div className="popover-actions">
                                                <button className="btn-clear" onClick={() => { handleClearPriceFilter(); setActivePopover(null); }}>Xóa</button>
                                                <button className="btn-apply" onClick={() => { handlePriceFilter(); setActivePopover(null); }}>Áp dụng</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 2. Kích thước (DxRxC) */}
                                <div className={`filter-item ${activePopover === 'dimensions' ? 'active' : ''}`}>
                                    <button className="filter-button" onClick={() => setActivePopover(activePopover === 'dimensions' ? null : 'dimensions')}>
                                        Kích thước {(urlMinWidth || urlMaxWidth || urlMinHeight || urlMaxHeight || urlMinDepth || urlMaxDepth) && '•'} ▾
                                    </button>
                                    {activePopover === 'dimensions' && (
                                        <div className="filter-popover dimensions-popover">
                                            <h4>Kích thước sản phẩm (cm)</h4>

                                            <div className="dimension-row">
                                                <label>Chiều Dài (D):</label>
                                                <div className="popover-inputs">
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={widthMin}
                                                        onChange={(e) => handleDimensionChange('minWidth', e.target.value)}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={widthMax}
                                                        onChange={(e) => handleDimensionChange('maxWidth', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="dimension-row">
                                                <label>Chiều Rộng/Sâu (R):</label>
                                                <div className="popover-inputs">
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={depthMin}
                                                        onChange={(e) => handleDimensionChange('minDepth', e.target.value)}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={depthMax}
                                                        onChange={(e) => handleDimensionChange('maxDepth', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="dimension-row">
                                                <label>Chiều Cao (C):</label>
                                                <div className="popover-inputs">
                                                    <input
                                                        type="number"
                                                        placeholder="Min"
                                                        value={heightMin}
                                                        onChange={(e) => handleDimensionChange('minHeight', e.target.value)}
                                                    />
                                                    <span>-</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Max"
                                                        value={heightMax}
                                                        onChange={(e) => handleDimensionChange('maxHeight', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="popover-actions">
                                                <button className="btn-clear" onClick={() => {
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
                                                <button className="btn-apply" onClick={() => setActivePopover(null)}>Đóng</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Màu sắc & Vân gỗ */}
                                <div className={`filter-item ${activePopover === 'color' ? 'active' : ''}`}>
                                    <button className="filter-button" onClick={() => setActivePopover(activePopover === 'color' ? null : 'color')}>
                                        Màu sắc {selectedColor && '•'} ▾
                                    </button>
                                    {activePopover === 'color' && (
                                        <div className="filter-popover color-popover">
                                            <h4>Màu sắc & Vân gỗ</h4>
                                            <div className="popover-swatches">
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
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '50%',
                                                                backgroundColor: hex,
                                                                border: isSelected ? '2px solid #8B4513' : '1px solid #ddd',
                                                                boxShadow: isSelected ? '0 0 0 2px rgba(139, 69, 19, 0.3)' : 'none',
                                                                cursor: 'pointer',
                                                                position: 'relative',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            title={`${col.color} (${col.count})`}
                                                        >
                                                            {isSelected && (
                                                                <span style={{
                                                                    color: col.color.toLowerCase() === 'trắng' || col.color.toLowerCase() === 'tự nhiên' ? '#000' : '#fff',
                                                                    fontSize: '12px',
                                                                    fontWeight: 'bold'
                                                                }}>
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
                                <div className={`filter-item ${activePopover === 'material' ? 'active' : ''}`}>
                                    <button className="filter-button" onClick={() => setActivePopover(activePopover === 'material' ? null : 'material')}>
                                        Chất liệu {selectedMaterial && '•'} ▾
                                    </button>
                                    {activePopover === 'material' && (
                                        <div className="filter-popover list-popover">
                                            <h4>Chất liệu</h4>
                                            <ul>
                                                <li>
                                                    <button
                                                        className={`popover-list-item ${!selectedMaterial ? 'active' : ''}`}
                                                        onClick={() => { handleMaterialChange(''); setActivePopover(null); }}
                                                    >
                                                        Tất cả chất liệu
                                                    </button>
                                                </li>
                                                {materials.map(mat => (
                                                    <li key={mat.material}>
                                                        <button
                                                            className={`popover-list-item ${selectedMaterial === mat.material ? 'active' : ''}`}
                                                            onClick={() => { handleMaterialChange(mat.material); setActivePopover(null); }}
                                                        >
                                                            {mat.material} ({mat.count})
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* 5. Phong cách */}
                                <div className={`filter-item ${activePopover === 'style' ? 'active' : ''}`}>
                                    <button className="filter-button" onClick={() => setActivePopover(activePopover === 'style' ? null : 'style')}>
                                        Phong cách {urlSearch && (urlSearch === 'Tối giản' || urlSearch === 'Scandinavian' || urlSearch === 'Hiện đại' || urlSearch === 'Cổ điển' || urlSearch === 'Indochine') && '•'} ▾
                                    </button>
                                    {activePopover === 'style' && (
                                        <div className="filter-popover style-popover">
                                            <h4>Phong cách thiết kế</h4>
                                            <div className="popover-styles">
                                                {[
                                                    { name: 'Tối giản', label: 'Tối giản (Japandi)' },
                                                    { name: 'Scandinavian', label: 'Bắc Âu (Scandi)' },
                                                    { name: 'Hiện đại', label: 'Hiện đại (Modern)' },
                                                    { name: 'Cổ điển', label: 'Tân cổ điển' },
                                                    { name: 'Indochine', label: 'Đông Dương' }
                                                ].map(styleObj => {
                                                    const isSelected = urlSearch === styleObj.name;
                                                    return (
                                                        <button
                                                            key={styleObj.name}
                                                            className={`style-tag-btn ${isSelected ? 'active' : ''}`}
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

                                {/* Drawer Trigger */}
                                <button className="btn-more-filters" onClick={() => setIsDrawerOpen(true)}>
                                    Lọc Nâng Cao +
                                </button>
                            </div>

                            {/* Mobile Single Filter Trigger Button */}
                            <div className="mobile-filter-trigger-container">
                                <button className="mobile-filter-trigger-btn" onClick={() => setIsDrawerOpen(true)}>
                                    Bộ lọc & Tìm kiếm
                                </button>
                            </div>
                        </>
                    )}

                    {/* Products Grid (No category-layout grid because horizontal bar spans top) */}
                    <div className="category-layout-full">
                        <main className="category-main-full">
                            {/* Toolbar */}
                            <div className="category-toolbar">
                                <div className="toolbar-info">
                                    <span className="products-count">
                                        {selectedCategory && categories.find(c => String(c.categoryId) === selectedCategory) && (
                                            <span className="filter-tag">
                                                DM: {categories.find(c => String(c.categoryId) === selectedCategory).name}
                                                <button onClick={() => handleCategoryChange('')} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {selectedProductType && (
                                            <span className="filter-tag">
                                                Loại: {selectedProductType}
                                                <button onClick={() => handleProductTypeChange('')} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {selectedColor && (
                                            <span className="filter-tag">
                                                Màu: {selectedColor}
                                                <button onClick={() => handleColorChange(null)} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {selectedMaterial && (
                                            <span className="filter-tag">
                                                Chất liệu: {selectedMaterial}
                                                <button onClick={() => handleMaterialChange('')} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {urlSearch && (
                                            <span className="filter-tag">
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
                                                }} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {/* Dimension tags */}
                                        {(urlMinWidth || urlMaxWidth) && (
                                            <span className="filter-tag">
                                                Dài: {urlMinWidth || 0} - {urlMaxWidth || '∞'} cm
                                                <button onClick={() => { setWidthMin(''); setWidthMax(''); debouncedApplyDimensions({ minWidth: '', maxWidth: '' }); }} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {(urlMinDepth || urlMaxDepth) && (
                                            <span className="filter-tag">
                                                Rộng: {urlMinDepth || 0} - {urlMaxDepth || '∞'} cm
                                                <button onClick={() => { setDepthMin(''); setDepthMax(''); debouncedApplyDimensions({ minDepth: '', maxDepth: '' }); }} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        {(urlMinHeight || urlMaxHeight) && (
                                            <span className="filter-tag">
                                                Cao: {urlMinHeight || 0} - {urlMaxHeight || '∞'} cm
                                                <button onClick={() => { setHeightMin(''); setHeightMax(''); debouncedApplyDimensions({ minHeight: '', maxHeight: '' }); }} className="filter-clear">×</button>
                                            </span>
                                        )}
                                        Hiển thị {products.length} / {totalCount} sản phẩm
                                    </span>
                                </div>
                                {!isFeaturedPage && (
                                    <div className="toolbar-sort">
                                        <label>Sắp xếp:</label>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => handleSortChange(e.target.value)}
                                            className="sort-select"
                                        >
                                            <option value="newest">Mới nhất</option>
                                            <option value="price_asc">Giá thấp → cao</option>
                                            <option value="price_desc">Giá cao → thấp</option>
                                            <option value="name">Tên A-Z</option>
                                            <option value="popular">Bán chạy nhất</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Products List - Loading Skeleton */}
                            {productsLoading ? (
                                <div className={`grid ${isFeaturedPage ? 'grid-4' : 'grid-4'}`}>
                                    {[...Array(isFeaturedPage ? 4 : 8)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : products.length === 0 ? (
                                <div className="empty-products">
                                    <p>Chưa có sản phẩm nào khớp với bộ lọc.</p>
                                </div>
                            ) : (
                                <>
                                    <div className={`grid ${isFeaturedPage ? 'grid-4' : 'grid-4'}`}>
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

                                    {/* Pagination Window */}
                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            <button className="pagination-btn"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}>
                                                ← Trước
                                            </button>
                                            <div className="pagination-pages">
                                                {getPaginationRange(currentPage, totalPages).map((pageNum, idx) =>
                                                    pageNum === '...' ? (
                                                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                                                    ) : (
                                                        <button key={pageNum}
                                                            className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                                                            onClick={() => handlePageChange(pageNum)}>
                                                            {pageNum}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            <button className="pagination-btn"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}>
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

            {/* All Filters Slide-out Drawer */}
            <div className={`drawer-overlay ${isDrawerOpen ? 'active' : ''}`} onClick={() => setIsDrawerOpen(false)}>
                <div className={`all-filters-drawer ${isDrawerOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="drawer-header">
                        <h3>Bộ lọc nâng cao</h3>
                        <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>×</button>
                    </div>

                    <div className="drawer-body">
                        {/* 1. Từ khóa tìm kiếm */}
                        <div className="drawer-section">
                            <h4>Từ khóa tìm kiếm</h4>
                            <input
                                type="text"
                                placeholder="Gõ từ khóa..."
                                value={searchVal}
                                onChange={onSearchInputChange}
                                className="drawer-search-input"
                            />
                        </div>

                        {/* 2. Khoảng giá (chỉ hiện trong Drawer trên mobile) */}
                        <div className="drawer-section mobile-only-section">
                            <h4>Khoảng giá (VND)</h4>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="number"
                                    placeholder="Tối thiểu"
                                    value={priceMin}
                                    onChange={(e) => setPriceMin(e.target.value)}
                                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                                />
                                <input
                                    type="number"
                                    placeholder="Tối đa"
                                    value={priceMax}
                                    onChange={(e) => setPriceMax(e.target.value)}
                                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }}
                                />
                            </div>
                            <button
                                onClick={handlePriceFilter}
                                style={{ width: '100%', padding: '8px', background: '#8B4513', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Áp dụng giá
                            </button>
                        </div>

                        {/* 3. Danh mục */}
                        <div className="drawer-section">
                            <h4>Danh mục</h4>
                            <div className="drawer-list-options">
                                <button
                                    className={`drawer-option-btn ${!selectedCategory ? 'active' : ''}`}
                                    onClick={() => handleCategoryChange('')}
                                >
                                    Tất cả danh mục
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.categoryId}
                                        className={`drawer-option-btn ${selectedCategory === String(cat.categoryId) ? 'active' : ''}`}
                                        onClick={() => handleCategoryChange(cat.categoryId)}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4. Loại sản phẩm */}
                        {productTypes.length > 0 && (
                            <div className="drawer-section">
                                <h4>Loại sản phẩm</h4>
                                <div className="drawer-list-options">
                                    <button
                                        className={`drawer-option-btn ${!selectedProductType ? 'active' : ''}`}
                                        onClick={() => handleProductTypeChange('')}
                                    >
                                        Tất cả loại
                                    </button>
                                    {productTypes.map(type => (
                                        <button
                                            key={type.productType}
                                            className={`drawer-option-btn ${selectedProductType === type.productType ? 'active' : ''}`}
                                            onClick={() => handleProductTypeChange(type.productType)}
                                        >
                                            {type.productType} ({type.count})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. Kích thước (mobile only) */}
                        <div className="drawer-section mobile-only-section">
                            <h4>Kích thước (cm)</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#666' }}>Chiều Dài (D):</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" placeholder="Min" value={widthMin} onChange={(e) => handleDimensionChange('minWidth', e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                        <input type="number" placeholder="Max" value={widthMax} onChange={(e) => handleDimensionChange('maxWidth', e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#666' }}>Chiều Rộng (R):</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" placeholder="Min" value={depthMin} onChange={(e) => handleDimensionChange('minDepth', e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                        <input type="number" placeholder="Max" value={depthMax} onChange={(e) => handleDimensionChange('maxDepth', e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '12px', color: '#666' }}>Chiều Cao (C):</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="number" placeholder="Min" value={heightMin} onChange={(e) => handleDimensionChange('minHeight', e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                        <input type="number" placeholder="Max" value={heightMax} onChange={(e) => handleDimensionChange('maxHeight', e.target.value)} style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="drawer-footer">
                        <button className="btn-reset" onClick={() => {
                            setPriceMin(''); setPriceMax('');
                            setSearchVal('');
                            setWidthMin(''); setWidthMax('');
                            setHeightMin(''); setHeightMax('');
                            setDepthMin(''); setDepthMax('');
                            setSearchParams({});
                            setIsDrawerOpen(false);
                        }}>Xóa tất cả</button>
                        <button className="btn-submit" onClick={() => setIsDrawerOpen(false)}>
                            Hiển thị {totalCount} kết quả
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProductsPage;
