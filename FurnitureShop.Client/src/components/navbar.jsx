import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Search, Heart, ShoppingBag, Menu, X, ChevronDown, User, LogOut } from 'lucide-react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';
const MEGA_MENU_BANNER = 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80';

const formatPrice = (price) => {
    const num = Number(price);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(isNaN(num) ? 0 : num);
};

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { cartCount } = useCart();
    const { wishlist } = useWishlist();
    const wishlistCount = wishlist?.length || 0;
    const navigate = useNavigate();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Autocomplete suggest states
    const [isSuggestOpen, setIsSuggestOpen] = useState(false);
    const [suggestions, setSuggestions] = useState({ categories: [], products: [] });
    const megaMenuTimeout = useRef(null);
    const searchRef = useRef(null);
    const userMenuRef = useRef(null);

    // Fetch all categories on mount
    useEffect(() => {
        fetch('/api/categories/all')
            .then(res => res.json())
            .then(data => {
                const all = Array.isArray(data) ? data : [];
                if (all.length === 0) throw new Error();
                setAllCategories(all);
                const roots = all.filter(c => !c.parentId && c.isActive);
                setCategories(roots);
            })
            .catch(() => {
                // Fallback elegant category list
                const mockCats = [
                    { categoryId: 'living', name: 'Phòng Khách', isActive: true, parentId: null },
                    { categoryId: 'bedroom', name: 'Phòng Ngủ', isActive: true, parentId: null },
                    { categoryId: 'dining', name: 'Phòng Ăn', isActive: true, parentId: null },
                    { categoryId: 'office', name: 'Làm Việc', isActive: true, parentId: null }
                ];
                setAllCategories(mockCats);
                setCategories(mockCats);
            });
    }, []);

    // Autocomplete suggest fetch with debounce
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
                    const rawCategories = data?.categories || data?.Categories;
                    const rawProducts = data?.products || data?.Products;
                    setSuggestions({
                        categories: Array.isArray(rawCategories) ? rawCategories : [],
                        products: Array.isArray(rawProducts) ? rawProducts : []
                    });
                    setIsSuggestOpen(true);
                })
                .catch(() => {
                    setSuggestions({ categories: [], products: [] });
                });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Click outside handler for search and user dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsSuggestOpen(false);
                if (!searchQuery.trim()) setIsSearchOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserDropdownOpen(false);
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

    const handleMegaMenuEnter = () => {
        clearTimeout(megaMenuTimeout.current);
        setIsMegaMenuOpen(true);
    };

    const handleMegaMenuLeave = () => {
        megaMenuTimeout.current = setTimeout(() => setIsMegaMenuOpen(false), 150);
    };

    const activeCategories = allCategories.filter(c => c.isActive);

    return (
        <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 md:px-8">
            <nav className="w-full max-w-[1440px] bg-white/80 backdrop-blur-xl border border-[var(--mist)] rounded-full px-8 py-3 flex items-center justify-between shadow-sm relative transition-all duration-300">
                {/* Brand Logo */}
                <Link to="/" className="text-xl font-bold tracking-tight text-[var(--ink)] uppercase flex-shrink-0 flex items-center gap-1">
                  Furniture<span className="font-light text-[var(--sand)]">Shop</span>
                </Link>

                {/* Desktop Center Links */}
                <div className="hidden lg:flex items-center gap-8">
                    {categories.slice(0, 4).map(cat => (
                        <Link 
                            key={cat.categoryId} 
                            to={`/category/${cat.slug || cat.categoryId}`} 
                            className="text-[11px] tracking-[0.2em] uppercase font-medium text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors py-2"
                        >
                            {cat.name}
                        </Link>
                    ))}
                    <div 
                        className="flex items-center gap-1 cursor-pointer text-[11px] tracking-[0.2em] uppercase font-medium text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors py-2"
                        onMouseEnter={handleMegaMenuEnter}
                        onMouseLeave={handleMegaMenuLeave}
                    >
                        <span>Sản phẩm</span>
                        <ChevronDown size={12} className={`transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {/* Right Icons */}
                <div className="flex items-center gap-4 md:gap-6">
                    {/* Search Desktop */}
                    <div className="hidden md:block relative" ref={searchRef}>
                        {isSearchOpen ? (
                            <form onSubmit={handleSearchSubmit} className="flex items-center border-b border-[var(--ink)] pb-1 transition-all duration-300">
                                <input
                                    type="text"
                                    className="bg-transparent border-none outline-none text-xs w-48 text-[var(--ink-text)] placeholder:text-[var(--ghost)] font-light"
                                    placeholder="Tìm sản phẩm..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                                <button type="submit" className="text-[var(--ink)] ml-2">
                                    <Search size={16} strokeWidth={1.5} />
                                </button>
                            </form>
                        ) : (
                            <button onClick={() => setIsSearchOpen(true)} className="text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors p-1">
                                <Search size={18} strokeWidth={1.5} />
                            </button>
                        )}

                        {/* Suggestions Dropdown */}
                        {isSuggestOpen && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
                            <div className="absolute top-full right-0 mt-4 w-80 bg-white border border-[var(--mist)] rounded-2xl shadow-xl p-6 flex flex-col gap-4 max-h-[70vh] overflow-y-auto z-50">
                                {suggestions.categories.length > 0 && (
                                    <div>
                                        <span className="block text-[9px] tracking-widest uppercase text-[var(--ghost)] mb-2 font-medium">Danh mục</span>
                                        <div className="flex flex-col gap-2">
                                            {suggestions.categories.map(cat => (
                                                <Link 
                                                    key={cat.categoryId} 
                                                    to={`/category/${cat.slug || cat.categoryId}`} 
                                                    onClick={() => { setIsSuggestOpen(false); setIsSearchOpen(false); setSearchQuery(''); }}
                                                    className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)]"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {suggestions.products.length > 0 && (
                                    <div>
                                        <span className="block text-[9px] tracking-widest uppercase text-[var(--ghost)] mb-2 font-medium">Sản phẩm</span>
                                        <div className="flex flex-col gap-3">
                                            {suggestions.products.map(prod => (
                                                <Link 
                                                    key={prod.productId} 
                                                    to={`/product/${prod.productId}`} 
                                                    onClick={() => { setIsSuggestOpen(false); setIsSearchOpen(false); setSearchQuery(''); }}
                                                    className="flex items-center gap-3 group"
                                                >
                                                    <div className="w-10 h-10 bg-[var(--stone)] overflow-hidden rounded-md flex-shrink-0">
                                                        <img src={prod.imageUrl || DEFAULT_IMAGE} alt={prod.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-xs font-medium text-[var(--ink-text)] group-hover:text-[var(--sand)] transition-colors line-clamp-1">{prod.name}</span>
                                                        <span className="text-[10px] text-[var(--ghost)]">{formatPrice(prod.discountPrice || prod.basePrice)}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Wishlist */}
                    <Link to="/wishlist" className="text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors p-1 hidden md:block relative">
                        <Heart size={18} strokeWidth={1.5} />
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[#C62828] text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {wishlistCount > 99 ? '99+' : wishlistCount}
                            </span>
                        )}
                    </Link>

                    {/* Cart */}
                    <Link to="/cart" className="text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors p-1 relative">
                        <ShoppingBag size={18} strokeWidth={1.5} />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[var(--ink)] text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                                {cartCount > 99 ? '99+' : cartCount}
                            </span>
                        )}
                    </Link>

                    {/* User profile dropdown */}
                    <div className="relative" ref={userMenuRef}>
                        <button 
                            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                            className="text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors p-1 flex items-center gap-1"
                        >
                            <User size={18} strokeWidth={1.5} />
                        </button>
                        {isUserDropdownOpen && (
                            <div className="absolute top-full right-0 mt-4 w-48 bg-white border border-[var(--mist)] rounded-2xl shadow-xl py-3 flex flex-col gap-1 z-50">
                                {(isAdmin?.() || user?.role === 'Admin' || user?.role === 1 || user?.role === '1') && (
                                    <Link to="/admin/overview" className="px-5 py-2 text-xs text-[#C9A87C] hover:bg-[var(--stone)] hover:text-[#0D0D0D] transition-colors font-bold flex items-center gap-1.5">⚡ Quản trị Cockpit</Link>
                                )}
                                {isAuthenticated() ? (
                                    <>
                                        <Link to="/my-orders" className="px-5 py-2 text-xs text-[var(--ink-text)] hover:bg-[var(--stone)] transition-colors">Đơn hàng của tôi</Link>
                                        <Link to="/profile" className="px-5 py-2 text-xs text-[var(--ink-text)] hover:bg-[var(--stone)] transition-colors">Tài khoản</Link>
                                        <div className="border-t border-[var(--mist)] my-1"></div>
                                        <button 
                                            onClick={handleLogout}
                                            className="px-5 py-2 text-xs text-red-500 hover:bg-[var(--stone)] text-left flex items-center gap-2 transition-colors w-full"
                                        >
                                            <LogOut size={12} /> Đăng xuất
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" className="px-5 py-2 text-xs text-[var(--ink-text)] hover:bg-[var(--stone)] transition-colors">Đăng nhập</Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Mobile menu toggle */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                        className="lg:hidden text-[var(--ink-text)] p-1 hover:text-[var(--sand)] transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
                    </button>
                </div>

                {/* Mega Menu Dropdown */}
                {isMegaMenuOpen && (
                    <div 
                        className="absolute top-[120%] left-0 right-0 bg-white/95 backdrop-blur-xl border border-[var(--mist)] rounded-3xl shadow-xl p-8 flex gap-12 z-50 transition-all duration-300"
                        onMouseEnter={handleMegaMenuEnter}
                        onMouseLeave={handleMegaMenuLeave}
                    >
                        <div className="flex-1 grid grid-cols-4 gap-6">
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] tracking-widest uppercase text-[var(--ghost)] font-medium">Phòng Khách</span>
                                <Link to="/category/sofa" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Sofa</Link>
                                <Link to="/category/armchair" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Armchair</Link>
                                <Link to="/category/ban-tra" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Bàn trà</Link>
                                <Link to="/category/ke-tivi" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Kệ tivi</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] tracking-widest uppercase text-[var(--ghost)] font-medium">Phòng Ngủ</span>
                                <Link to="/category/giuong" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Giường ngủ</Link>
                                <Link to="/category/tu-ao" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Tủ quần áo</Link>
                                <Link to="/category/ban-trang-diem" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Bàn trang điểm</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] tracking-widest uppercase text-[var(--ghost)] font-medium">Phòng Ăn</span>
                                <Link to="/category/ban-an" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Bàn ăn</Link>
                                <Link to="/category/ghe-an" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Ghế ăn</Link>
                                <Link to="/category/tu-chen" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Tủ chén bát</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                <span className="text-[10px] tracking-widest uppercase text-[var(--ghost)] font-medium">Làm Việc & Khác</span>
                                <Link to="/category/ban-lam-viec" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Bàn làm việc</Link>
                                <Link to="/category/ghe-van-phong" className="text-xs text-[var(--ink-text)] hover:text-[var(--sand)] transition-colors">Ghế xoay</Link>
                                <Link to="/category/all" className="text-xs text-[var(--sand)] font-medium hover:underline">Tất cả sản phẩm →</Link>
                            </div>
                        </div>
                        
                        <div className="w-[280px] shrink-0 relative aspect-[4/3] overflow-hidden rounded-2xl group">
                            <img src={MEGA_MENU_BANNER} alt="Featured" className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                            <div className="absolute inset-x-0 bottom-0 p-6 text-white flex flex-col justify-end">
                                <span className="block text-[9px] tracking-widest uppercase mb-1 text-[var(--sand-light)] font-medium">Bộ Sưu Tập Nổi Bật</span>
                                <h3 className="text-lg font-medium tracking-tight mb-3">Hùng King 2026</h3>
                                <Link to="/category/all" className="text-[10px] uppercase tracking-widest font-medium border-b border-white/60 pb-0.5 hover:border-white transition-colors self-start" onClick={() => setIsMegaMenuOpen(false)}>
                                    Khám phá ngay
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Mobile Menu Fullscreen Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-white z-40 lg:hidden flex flex-col pt-24 px-8 pb-12 overflow-y-auto">
                    <div className="flex flex-col gap-6 mb-12">
                        {categories.map(cat => (
                            <Link 
                                key={cat.categoryId} 
                                to={`/category/${cat.slug || cat.categoryId}`} 
                                onClick={() => setIsMobileMenuOpen(false)} 
                                className="text-2xl text-[var(--ink-text)] font-semibold tracking-tight hover:text-[var(--sand)]"
                            >
                                {cat.name}
                            </Link>
                        ))}
                        <Link 
                            to="/category/all" 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="text-2xl text-[var(--ink-text)] font-semibold tracking-tight hover:text-[var(--sand)]"
                        >
                            Tất Cả Sản Phẩm
                        </Link>
                    </div>

                    <div className="mt-auto border-t border-[var(--mist)] pt-8 flex flex-col gap-4 text-sm text-[var(--ghost)] font-light">
                        <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-[var(--ink-text)] font-medium flex items-center gap-2">
                            <span>❤️ Sản phẩm yêu thích</span>
                            {wishlistCount > 0 && <span className="bg-[#C62828] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{wishlistCount}</span>}
                        </Link>
                        <Link to="/gioi-thieu" onClick={() => setIsMobileMenuOpen(false)}>Giới thiệu</Link>
                        <Link to="/khuyen-mai" onClick={() => setIsMobileMenuOpen(false)}>Khuyến mãi</Link>
                        <a href="tel:19001900">📞 Hỗ trợ: 1900 1900</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Navbar;
