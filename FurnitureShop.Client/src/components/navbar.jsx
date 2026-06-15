// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const formatPrice = (price) => {
    const num = Number(price);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(isNaN(num) ? 0 : num);
};

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Autocomplete suggest states
    const [isSuggestOpen, setIsSuggestOpen] = useState(false);
    const [suggestions, setSuggestions] = useState({ categories: [], products: [] });

    // Fetch root categories on mount
    useEffect(() => {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                const roots = (data || []).filter(c => !c.parentId);
                setCategories(roots);
            })
            .catch(() => {});
    }, []);

    // Autocomplete suggest fetch with 300ms debounce
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSuggestions({ categories: [], products: [] });
            setIsSuggestOpen(false);
            return;
        }

        const timer = setTimeout(() => {
            fetch(`/api/products/suggest?keyword=${encodeURIComponent(searchQuery.trim())}`)
                .then(res => res.json())
                .then(data => {
                    // Safe property casing check (handles both camelCase and PascalCase)
                    const rawCategories = data?.categories || data?.Categories;
                    const rawProducts = data?.products || data?.Products;
                    
                    const safeData = {
                        categories: Array.isArray(rawCategories) ? rawCategories : [],
                        products: Array.isArray(rawProducts) ? rawProducts : []
                    };
                    setSuggestions(safeData);
                    setIsSuggestOpen(true);
                })
                .catch(() => {
                    setSuggestions({ categories: [], products: [] });
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Click outside suggest handler
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.navbar-search-form') && !e.target.closest('.navbar-mobile-search-form')) {
                setIsSuggestOpen(false);
                if (!searchQuery.trim()) {
                    setIsSearchOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchQuery]);

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setIsSuggestOpen(false);
            setSearchQuery('');
            setIsMobileMenuOpen(false);
        }
    };

    const mid = Math.ceil(categories.length / 2);
    const leftCats = categories.slice(0, mid);
    const rightCats = categories.slice(mid);

    return (
        <nav className="navbar">
            {/* Top Bar */}
            <div className="navbar-top">
                <div className="container navbar-top-content">
                    <div className="navbar-top-left">
                        <a href="tel:1900xxxx">📞 1900 1900</a>
                        <a href="/gioi-thieu">Giới thiệu</a>
                        <a href="/khuyen-mai">Khuyến mãi</a>
                    </div>
                    <div className="navbar-top-right">
                        {isAuthenticated() ? (
                            <>
                                {isAdmin() && (
                                    <Link to="/admin/dashboard" className="admin-link">⚙️ Quản trị</Link>
                                )}
                                <Link to="/my-orders" style={{ color: 'inherit', textDecoration: 'none' }}>📦 Đơn hàng</Link>
                                <Link to="/profile" className="user-greeting">👤 {user?.fullName || user?.username}</Link>
                                <button onClick={handleLogout} className="logout-btn-nav">Đăng xuất</button>
                            </>
                        ) : (
                            <Link to="/login">👤 Đăng nhập</Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="navbar-main">
                <div className="container navbar-main-content">
                    {/* Mobile Toggle */}
                    <button
                        className="navbar-mobile-toggle"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        ☰
                    </button>

                    {/* Menu Left */}
                    <div className="navbar-menu">
                        {leftCats.map(cat => (
                            <Link key={cat.categoryId} to={`/category/${cat.categoryId}`}>
                                {cat.name}
                            </Link>
                        ))}
                    </div>

                    {/* Logo */}
                    <Link to="/" className="navbar-logo">
                        Furniture<span>Shop</span>
                    </Link>

                    {/* Menu Right */}
                    <div className="navbar-menu">
                        {rightCats.map(cat => (
                            <Link key={cat.categoryId} to={`/category/${cat.categoryId}`}>
                                {cat.name}
                            </Link>
                        ))}
                    </div>

                    {/* Icons */}
                    <div className="navbar-icons">
                        {isSearchOpen ? (
                            <form onSubmit={handleSearchSubmit} className="navbar-search-form" style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="navbar-search-input"
                                    placeholder="Tìm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    onFocus={() => {
                                        if (searchQuery.trim().length >= 2) setIsSuggestOpen(true);
                                    }}
                                />
                                <button type="submit" className="navbar-search-btn" title="Tìm kiếm">
                                    🔍
                                </button>

                                {/* Autocomplete Dropdown List */}
                                {isSuggestOpen && suggestions && ((suggestions.categories && suggestions.categories.length > 0) || (suggestions.products && suggestions.products.length > 0)) && (
                                    <div className="search-suggest-dropdown">
                                        {suggestions.categories && suggestions.categories.length > 0 && (
                                            <div className="suggest-section">
                                                <h5>Danh mục</h5>
                                                <ul>
                                                    {suggestions.categories.map(cat => {
                                                        const catId = cat.categoryId || cat.CategoryId;
                                                        const catName = cat.name || cat.Name;
                                                        return (
                                                            <li key={catId}>
                                                                <Link
                                                                    to={`/category/${catId}`}
                                                                    onClick={() => {
                                                                        setIsSuggestOpen(false);
                                                                        setIsSearchOpen(false);
                                                                        setSearchQuery('');
                                                                    }}
                                                                >
                                                                    📁 {catName}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                        {suggestions.products && suggestions.products.length > 0 && (
                                            <div className="suggest-section">
                                                <h5>Sản phẩm</h5>
                                                <ul>
                                                    {suggestions.products.map(prod => {
                                                        const prodId = prod.productId || prod.ProductId;
                                                        const prodName = prod.name || prod.Name;
                                                        const baseP = prod.basePrice || prod.BasePrice;
                                                        const discP = prod.discountPrice || prod.DiscountPrice;
                                                        const imgUrl = prod.imageUrl || prod.ImageUrl;
                                                        return (
                                                            <li key={prodId}>
                                                                <Link
                                                                    to={`/product/${prodId}`}
                                                                    onClick={() => {
                                                                        setIsSuggestOpen(false);
                                                                        setIsSearchOpen(false);
                                                                        setSearchQuery('');
                                                                    }}
                                                                    className="suggest-product-item"
                                                                >
                                                                    <img
                                                                        src={imgUrl || DEFAULT_IMAGE}
                                                                        alt={prodName}
                                                                        className="suggest-product-thumb"
                                                                    />
                                                                    <div className="suggest-product-info">
                                                                        <span className="suggest-product-name">{prodName}</span>
                                                                        <span className="suggest-product-price">
                                                                            {formatPrice(discP || baseP || 0)}
                                                                        </span>
                                                                    </div>
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </form>
                        ) : (
                            <span className="navbar-icon" title="Tìm kiếm" onClick={() => setIsSearchOpen(true)}>🔍</span>
                        )}
                        <span className="navbar-icon" title="Yêu thích">♡</span>
                        <Link to="/cart" className="navbar-icon cart-icon" title="Giỏ hàng">
                            🛒
                            {cartCount > 0 && (
                                <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="navbar-mobile-menu">
                    <form onSubmit={handleSearchSubmit} className="navbar-mobile-search-form" style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Tìm sản phẩm..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => {
                                if (searchQuery.trim().length >= 2) setIsSuggestOpen(true);
                            }}
                        />
                        <button type="submit">🔍</button>

                        {/* Autocomplete Dropdown List on Mobile */}
                        {isSuggestOpen && suggestions && ((suggestions.categories && suggestions.categories.length > 0) || (suggestions.products && suggestions.products.length > 0)) && (
                            <div className="search-suggest-dropdown mobile-suggest-dropdown">
                                {suggestions.categories && suggestions.categories.length > 0 && (
                                    <div className="suggest-section">
                                        <h5>Danh mục</h5>
                                        <ul>
                                            {suggestions.categories.map(cat => {
                                                const catId = cat.categoryId || cat.CategoryId;
                                                const catName = cat.name || cat.Name;
                                                return (
                                                    <li key={catId}>
                                                        <Link
                                                            to={`/category/${catId}`}
                                                            onClick={() => {
                                                                    setIsSuggestOpen(false);
                                                                    setIsMobileMenuOpen(false);
                                                                    setSearchQuery('');
                                                            }}
                                                        >
                                                            📁 {catName}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                                {suggestions.products && suggestions.products.length > 0 && (
                                    <div className="suggest-section">
                                        <h5>Sản phẩm</h5>
                                        <ul>
                                            {suggestions.products.map(prod => {
                                                const prodId = prod.productId || prod.ProductId;
                                                const prodName = prod.name || prod.Name;
                                                const baseP = prod.basePrice || prod.BasePrice;
                                                const discP = prod.discountPrice || prod.DiscountPrice;
                                                const imgUrl = prod.imageUrl || prod.ImageUrl;
                                                return (
                                                    <li key={prodId}>
                                                        <Link
                                                            to={`/product/${prodId}`}
                                                            onClick={() => {
                                                                setIsSuggestOpen(false);
                                                                setIsMobileMenuOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                            className="suggest-product-item"
                                                        >
                                                            <img
                                                                src={imgUrl || DEFAULT_IMAGE}
                                                                alt={prodName}
                                                                className="suggest-product-thumb"
                                                            />
                                                            <div className="suggest-product-info">
                                                                <span className="suggest-product-name">{prodName}</span>
                                                                <span className="suggest-product-price">
                                                                    {formatPrice(discP || baseP || 0)}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                    {categories.map(cat => (
                        <Link
                            key={cat.categoryId}
                            to={`/category/${cat.categoryId}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {cat.name}
                        </Link>
                    ))}
                    <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                        🛒 Giỏ hàng ({cartCount})
                    </Link>
                    {isAuthenticated() && isAdmin() && (
                        <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                            ⚙️ Quản trị
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
