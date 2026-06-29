// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useDwellTime } from '../hooks/useDwellTime';
import '../index.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const getColorHex = (colorName) => {
    if (!colorName) return '#ccc';
    const cleanName = colorName.toLowerCase().trim();
    const map = {
        'nâu đen': '#3D1C0A', 'nâu': '#8B4513', 'xám nhạt': '#E0E0E0',
        'xám': '#808080', 'xám nhạc': '#E0E0E0', 'trắng': '#FFFFFF',
        'đen': '#000000', 'xanh navy': '#003153', 'tự nhiên': '#D2B48C',
        'vàng': '#FFD700', 'đỏ': '#D93838', 'xanh': '#2E7D32', 'kem': '#FFFDD0'
    };
    return map[cleanName] || '#cccccc';
};

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState('description');
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState('');

    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { toggleWishlist, isWishlisted } = useWishlist();

    useDwellTime(id, !loading);

    const formatPrice = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await fetch(`/api/products/${id}`);
                if (!response.ok) {
                    throw new Error('Không tìm thấy sản phẩm');
                }
                const raw = await response.json();
                const data = raw.data || raw;
                setProduct(data);

                // Update recently viewed
                try {
                    const storedRv = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
                    const prodId = data.productId || data.id;
                    const newRvItem = {
                        id: prodId,
                        name: data.name,
                        price: data.discountPrice || data.basePrice,
                        originalPrice: data.discountPrice ? data.basePrice : null,
                        image: data.images?.[0]?.imageUrl || DEFAULT_IMAGE,
                        category: data.category?.name || ''
                    };
                    const filteredRv = storedRv.filter(item => item.id !== prodId);
                    filteredRv.unshift(newRvItem);
                    localStorage.setItem('recentlyViewed', JSON.stringify(filteredRv.slice(0, 10)));
                } catch (e) {
                    console.error('Error updating recently viewed', e);
                }

                // Fetch related products
                if (data.categoryId) {
                    const relatedResponse = await fetch(`/api/products?categoryId=${data.categoryId}&pageSize=5`);
                    if (relatedResponse.ok) {
                        const relatedRaw = await relatedResponse.json();
                        const relatedList = relatedRaw.data || relatedRaw.items || [];
                        const filtered = (Array.isArray(relatedList) ? relatedList : []).filter(p => (p.productId || p.id) !== (data.productId || data.id));
                        setRelatedProducts(filtered.slice(0, 4));
                    }
                }
            } catch (err) {
                setError(err.message || 'Lỗi tải sản phẩm');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        setAddingToCart(true);
        setCartMessage('');

        try {
            const result = await addToCart(product.productId || product.id, quantity);
            if (result.success) {
                setCartMessage('✓ Đã thêm vào giỏ hàng');
                setTimeout(() => setCartMessage(''), 3000);
            } else {
                setCartMessage(result.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            setCartMessage('Có lỗi xảy ra');
        } finally {
            setAddingToCart(false);
        }
    };

    const handleQuantityChange = (delta) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= (product?.stockQuantity || 10)) {
            setQuantity(newQty);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-7xl mx-auto w-full px-6 py-32 flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-2 border-[#C9A87C] border-t-transparent animate-spin" />
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#8A8278]">Đang tải tác phẩm...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col">
                <Navbar />
                <div className="max-w-7xl mx-auto w-full px-6 py-32 flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-16 h-16 bg-[#FFEBEE] text-[#C62828] rounded-full flex items-center justify-center text-2xl font-bold">⚠️</div>
                    <h2 className="text-3xl font-light tracking-tight uppercase">Không Tìm Thấy Sản Phẩm</h2>
                    <p className="text-sm text-[#8A8278] max-w-md">{error || 'Sản phẩm này không tồn tại hoặc đã bị ẩn.'}</p>
                    <Link to="/products" className="rounded-full py-4 px-8 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all">
                        ← Về cửa hàng
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const images = product.images?.length > 0
        ? product.images.map(img => img.imageUrl)
        : [DEFAULT_IMAGE];

    const discountPercent = product.discountPrice
        ? Math.round((1 - product.discountPrice / product.basePrice) * 100)
        : null;

    const prodId = product.productId || product.id;
    const isSaved = isWishlisted ? isWishlisted(prodId) : false;

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white">
            <Navbar />

            {/* Editorial Breadcrumb */}
            <div className="border-b border-[#E8E4DC] bg-[#FDFBF7]">
                <nav className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-4 text-[11px] font-semibold uppercase tracking-widest text-[#8A8278] flex items-center gap-2 flex-wrap">
                    <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <Link to="/products" className="hover:text-black transition-colors">Sản phẩm</Link>
                    {product.category && (
                        <>
                            <span>/</span>
                            <Link to={`/category/${product.category?.slug || product.categoryId}`} className="hover:text-black transition-colors">{product.category.name}</Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-[#0D0D0D] underline underline-offset-4">{product.name}</span>
                </nav>
            </div>

            {/* Split-Screen 55/45 Layout Architecture */}
            <main className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                {/* Left Column (55% -> col-span-7) Sticky Gallery */}
                <div className="lg:col-span-7 sticky top-28 space-y-4">
                    <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full bg-[#F5F2EC] rounded-3xl overflow-hidden border border-[#E8E4DC] shadow-xs group">
                        <img 
                            src={images[selectedImage] || DEFAULT_IMAGE} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        {discountPercent && (
                            <span className="absolute top-6 left-6 bg-[#C62828] text-white text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-md">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>

                    {/* Thumbnails Strip */}
                    {images.length > 1 && (
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border transition-all cursor-pointer flex-shrink-0 ${
                                        selectedImage === idx ? 'border-2 border-[#0D0D0D] scale-95 shadow-md' : 'border-[#E8E4DC] opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column (45% -> col-span-5) Typography Core & CTA */}
                <div className="lg:col-span-5 flex flex-col space-y-8">
                    <div className="space-y-4 border-b border-[#E8E4DC] pb-8">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#C9A87C] inline-block bg-[#C9A87C]/10 px-3 py-1 rounded-full">
                            {product.category?.name || 'Nội thất độc bản'}
                        </span>
                        
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight text-[#0D0D0D] leading-tight">
                            {product.name}
                        </h1>

                        <div className="flex items-baseline gap-4 pt-2">
                            <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-[#0D0D0D]">
                                {formatPrice(product.discountPrice || product.basePrice)}
                            </span>
                            {product.discountPrice && (
                                <span className="text-base font-light text-[#8A8278] line-through tabular-nums">
                                    {formatPrice(product.basePrice)}
                                </span>
                            )}
                        </div>

                        <p className="text-xs font-medium uppercase tracking-wider text-[#2E7D32] flex items-center gap-2 pt-1">
                            <span className="w-2 h-2 rounded-full bg-[#2E7D32] animate-pulse" />
                            {product.stockQuantity > 0 ? `Sẵn sàng bàn giao (${product.stockQuantity} sản phẩm trong kho)` : 'Tạm hết hàng'}
                        </p>
                    </div>

                    {/* Attributes */}
                    {(product.color || product.material) && (
                        <div className="space-y-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#8A8278]">Đặc tính vật liệu</span>
                            <div className="flex flex-wrap gap-2.5">
                                {product.color && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F2EC] rounded-full border border-[#E8E4DC] text-xs font-medium">
                                        <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: getColorHex(product.color) }} />
                                        <span>Màu sắc: {product.color}</span>
                                    </div>
                                )}
                                {product.material && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F2EC] rounded-full border border-[#E8E4DC] text-xs font-medium">
                                        <span>🪵 Chất liệu: {product.material}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quantity & Button-in-Button CTA Architecture */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-widest text-[#8A8278]">Số lượng</span>
                            <div className="inline-flex items-center border border-[#E8E4DC] bg-white rounded-full p-1 shadow-2xs">
                                <button 
                                    onClick={() => handleQuantityChange(-1)} 
                                    disabled={quantity <= 1} 
                                    className="w-9 h-9 rounded-full hover:bg-[#F5F2EC] flex items-center justify-center text-base font-medium transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                    −
                                </button>
                                <span className="w-10 text-center text-xs font-bold tabular-nums">{quantity}</span>
                                <button 
                                    onClick={() => handleQuantityChange(1)} 
                                    disabled={quantity >= (product?.stockQuantity || 10)} 
                                    className="w-9 h-9 rounded-full hover:bg-[#F5F2EC] flex items-center justify-center text-base font-medium transition-colors disabled:opacity-30 cursor-pointer"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Doppelrand CTA Architecture */}
                        <div className="p-1.5 rounded-full bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/40 shadow-lg mt-4">
                            <div className="flex items-center gap-2 bg-[#0D0D0D] p-1.5 rounded-full">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || product.stockQuantity <= 0}
                                    className="flex-1 py-4 px-6 rounded-full bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {addingToCart ? (
                                        <span>⏳ Đang thêm...</span>
                                    ) : product.stockQuantity <= 0 ? (
                                        <span>🚫 Hết hàng</span>
                                    ) : (
                                        <>
                                            <span>Thêm vào giỏ</span>
                                            <span>—</span>
                                            <span className="tabular-nums font-bold">{formatPrice((product.discountPrice || product.basePrice) * quantity)}</span>
                                        </>
                                    )}
                                </button>

                                {/* Wishlist Haptic Button */}
                                <button
                                    onClick={() => toggleWishlist && toggleWishlist({
                                        id: prodId,
                                        name: product.name,
                                        price: product.discountPrice || product.basePrice,
                                        originalPrice: product.discountPrice ? product.basePrice : null,
                                        category: product.category?.name || '',
                                        image: images[0] || DEFAULT_IMAGE
                                    })}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all active:scale-90 cursor-pointer ${
                                        isSaved ? 'bg-[#C62828] text-white shadow-md' : 'bg-[#262626] text-[#E8E4DC] hover:bg-white hover:text-[#C62828]'
                                    }`}
                                    title={isSaved ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
                                >
                                    {isSaved ? '♥' : '♡'}
                                </button>
                            </div>
                        </div>

                        {cartMessage && (
                            <p className="text-center text-xs font-semibold text-[#2E7D32] pt-2 animate-fade-up">{cartMessage}</p>
                        )}
                    </div>

                    {/* Pill-Style Tabs Section */}
                    <div className="pt-6 space-y-6">
                        <div className="flex gap-2 border-b border-[#E8E4DC]">
                            {[
                                { id: 'description', label: 'Mô tả nghệ thuật' },
                                { id: 'specs', label: 'Thông số kỹ thuật' },
                                { id: 'warranty', label: 'Bảo hành' },
                                { id: 'shipping', label: 'Vận chuyển' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-3 px-1 text-xs uppercase tracking-wider font-semibold transition-all relative cursor-pointer ${
                                        activeTab === tab.id ? 'text-[#0D0D0D]' : 'text-[#8A8278] hover:text-[#0D0D0D]'
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0D0D0D]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="text-xs leading-relaxed text-[#5A5A5A] min-h-[120px]">
                            {activeTab === 'description' && (
                                <div className="space-y-3 animate-fade-up">
                                    <p>{product.description || 'Sản phẩm nội thất độc bản được chế tác bởi nghệ nhân, mang lại không gian sống tinh tế và vượt thời gian.'}</p>
                                    <p>Từng chi tiết vật liệu được tinh tuyển kỹ lưỡng, đảm bảo sự bền bỉ cùng vẻ đẹp nguyên bản qua nhiều thập kỷ sử dụng.</p>
                                </div>
                            )}
                            {activeTab === 'specs' && (
                                <div className="grid grid-cols-2 gap-4 border border-[#E8E4DC] rounded-2xl p-5 bg-[#FDFBF7]">
                                    <div><span className="text-[#8A8278] block text-[10px] uppercase">Mã sản phẩm</span><span className="font-mono font-bold text-black">{product.sku || `FNS-${prodId}`}</span></div>
                                    <div><span className="text-[#8A8278] block text-[10px] uppercase">Xuất xứ</span><span className="font-medium text-black">Việt Nam</span></div>
                                    <div><span className="text-[#8A8278] block text-[10px] uppercase">Trọng lượng dự kiến</span><span className="font-medium text-black">{product.weight ? `${product.weight} kg` : '—'}</span></div>
                                    <div><span className="text-[#8A8278] block text-[10px] uppercase">Tình trạng</span><span className="text-[#2E7D32] font-semibold">Mới 100%</span></div>
                                </div>
                            )}
                            {activeTab === 'warranty' && (
                                <div className="space-y-2 text-[#4A4A4A]">
                                    <p><strong className="font-semibold text-black">Bảo hành 12 tháng</strong> cho cấu trúc khung và kỹ thuật ghép nối.</p>
                                    <p>Hỗ trợ bảo trì trọn đời. Hotline CSKH: <a href="tel:1800123456" className="underline font-semibold text-[#C9A87C]">1800 123 456</a></p>
                                </div>
                            )}
                            {activeTab === 'shipping' && (
                                <div className="space-y-2 text-[#4A4A4A]">
                                    <p>🚚 Miễn phí giao hàng nội thành TP.HCM & Hà Nội cho đơn hàng từ 5,000,000đ.</p>
                                    <p>📦 Đóng kiện gỗ chuyên dụng chống trầy xước và va đập cho các đơn vận chuyển tỉnh.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Related Products Carousel / Grid */}
            {relatedProducts.length > 0 && (
                <section className="bg-[#F5F2EC] border-t border-[#E8E4DC] py-20 px-6 sm:px-12 mt-16">
                    <div className="max-w-7xl mx-auto space-y-10">
                        <div className="flex items-end justify-between">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#C9A87C]">Gợi ý đồng điệu</span>
                                <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tight text-[#0D0D0D]">Có Thể Bạn Cũng Thích</h2>
                            </div>
                            <Link to="/products" className="text-xs font-semibold uppercase tracking-widest hover:underline text-[#0D0D0D]">Xem toàn bộ →</Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                            {relatedProducts.map(p => (
                                <ProductCard
                                    key={p.productId || p.id}
                                    id={p.productId || p.id}
                                    name={p.name}
                                    price={p.discountPrice || p.basePrice}
                                    originalPrice={p.discountPrice ? p.basePrice : null}
                                    category={p.category?.name}
                                    image={p.images?.[0]?.imageUrl || DEFAULT_IMAGE}
                                    discount={p.discountPrice ? Math.round((1 - p.discountPrice / p.basePrice) * 100) : null}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
};

export default ProductDetail;
