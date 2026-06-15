// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

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

    // Format price to VND
    const formatPrice = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/products/${id}`);
                if (!response.ok) {
                    throw new Error('Không tìm thấy sản phẩm');
                }
                const data = await response.json();
                setProduct(data);

                // Fetch related products from same category
                if (data.categoryId) {
                    const relatedResponse = await fetch(`/api/products?categoryId=${data.categoryId}&pageSize=4`);
                    if (relatedResponse.ok) {
                        const relatedData = await relatedResponse.json();
                        // Filter out current product
                        const filtered = (relatedData.data || []).filter(p => p.productId !== data.productId);
                        setRelatedProducts(filtered.slice(0, 4));
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleAddToCart = async () => {
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        setAddingToCart(true);
        setCartMessage('');

        try {
            const result = await addToCart(product.productId, quantity);
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
            <div className="app">
                <Navbar />
                <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <p>Đang tải sản phẩm...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="app">
                <Navbar />
                <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p>{error}</p>
                    <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Về trang chủ
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

    return (
        <div className="app">
            <Navbar />

            {/* Breadcrumb */}
            <div className="breadcrumb-container">
                <div className="container">
                    <nav className="breadcrumb">
                        <Link to="/">Trang chủ</Link>
                        <span className="breadcrumb-separator">/</span>
                        {product.category && (
                            <>
                                <Link to={`/category/${product.categoryId}`}>{product.category.name}</Link>
                                <span className="breadcrumb-separator">/</span>
                            </>
                        )}
                        <span className="breadcrumb-current">{product.name}</span>
                    </nav>
                </div>
            </div>

            {/* Product Detail Section */}
            <section className="product-detail-section">
                <div className="container">
                    <div className="product-detail-grid">
                        {/* Image Gallery */}
                        <div className="product-gallery">
                            <div className="gallery-main">
                                <img
                                    src={images[selectedImage]}
                                    alt={product.name}
                                    className="gallery-main-image"
                                />
                                {discountPercent && (
                                    <span className="product-badge-large">-{discountPercent}%</span>
                                )}
                            </div>
                            {images.length > 1 && (
                                <div className="gallery-thumbnails">
                                    {images.map((img, index) => (
                                        <button
                                            key={index}
                                            className={`gallery-thumbnail ${index === selectedImage ? 'active' : ''}`}
                                            onClick={() => setSelectedImage(index)}
                                        >
                                            <img src={img} alt={`${product.name} ${index + 1}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="product-detail-info">
                            <h1 className="product-detail-name">{product.name}</h1>

                            <div className="product-detail-price">
                                <span className="price-current">
                                    {formatPrice(product.discountPrice || product.basePrice)}
                                </span>
                                {product.discountPrice && (
                                    <span className="price-original">
                                        {formatPrice(product.basePrice)}
                                    </span>
                                )}
                            </div>

                            {/* Product Meta */}
                            <div className="product-meta">
                                {product.sku && (
                                    <div className="meta-item">
                                        <span className="meta-label">Mã sản phẩm:</span>
                                        <span className="meta-value">{product.sku}</span>
                                    </div>
                                )}
                                {product.category && (
                                    <div className="meta-item">
                                        <span className="meta-label">Danh mục:</span>
                                        <Link to={`/category/${product.categoryId}`} className="meta-link">
                                            {product.category.name}
                                        </Link>
                                    </div>
                                )}
                                <div className="meta-item">
                                    <span className="meta-label">Tình trạng:</span>
                                    <span className={`stock-status ${product.stockQuantity > 0 ? 'in-stock' : 'out-stock'}`}>
                                        {product.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                                    </span>
                                </div>
                            </div>

                            {/* Color Selection (Visual Swatch) */}
                            {product.color && (
                                <div style={{ margin: '1.5rem 0' }}>
                                    <span style={{ fontWeight: '600', display: 'inline-block', marginBottom: '8px' }}>
                                        Màu sắc:
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                backgroundColor: getColorHex(product.color),
                                                border: '2px solid #8B4513',
                                                boxShadow: '0 0 0 2px rgba(139, 69, 19, 0.3)',
                                                cursor: 'default',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title={product.color}
                                        >
                                            <span style={{
                                                color: product.color.toLowerCase() === 'trắng' || product.color.toLowerCase() === 'tự nhiên' ? '#000' : '#fff',
                                                fontSize: '12px',
                                                fontWeight: 'bold'
                                            }}>✓</span>
                                        </div>
                                        <span style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>
                                            {product.color}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Quantity & Add to Cart */}
                            <div className="product-actions-detail">
                                <div className="quantity-selector">
                                    <button
                                        className="qty-btn"
                                        onClick={() => handleQuantityChange(-1)}
                                        disabled={quantity <= 1}
                                    >
                                        −
                                    </button>
                                    <span className="qty-value">{quantity}</span>
                                    <button
                                        className="qty-btn"
                                        onClick={() => handleQuantityChange(1)}
                                        disabled={quantity >= product.stockQuantity}
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="btn btn-primary btn-add-cart"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || product.stockQuantity === 0}
                                >
                                    {addingToCart ? 'Đang thêm...' : 'Mua ngay'}
                                </button>
                            </div>

                            {cartMessage && (
                                <div className={`cart-message ${cartMessage.includes('✓') ? 'success' : 'error'}`}>
                                    {cartMessage}
                                </div>
                            )}

                            {/* Member Discount Banner */}
                            <div className="member-discount-banner">
                                <span>🎁 Giảm 5% khi đăng ký thành viên</span>
                                <Link to="/register">Đăng ký ngay</Link>
                            </div>

                            {/* Warranty & Shipping Tabs */}
                            <div className="info-tabs">
                                <div className="tabs-header">
                                    <button
                                        className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('description')}
                                    >
                                        Mô tả
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'warranty' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('warranty')}
                                    >
                                        Bảo hành
                                    </button>
                                    <button
                                        className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('shipping')}
                                    >
                                        Vận chuyển
                                    </button>
                                </div>
                                <div className="tabs-content">
                                    {activeTab === 'description' && (
                                        <div className="tab-panel">
                                            <p>{product.description || 'Chưa có mô tả sản phẩm.'}</p>

                                            {/* Product Specifications */}
                                            {(product.material || product.color || product.width) && (
                                                <div className="product-specs">
                                                    <h4>Thông số kỹ thuật</h4>
                                                    <table className="specs-table">
                                                        <tbody>
                                                            {product.material && (
                                                                <tr>
                                                                    <td>Chất liệu</td>
                                                                    <td>{product.material}</td>
                                                                </tr>
                                                            )}
                                                            {product.color && (
                                                                <tr>
                                                                    <td>Màu sắc</td>
                                                                    <td>{product.color}</td>
                                                                </tr>
                                                            )}
                                                            {(product.width || product.height || product.depth) && (
                                                                <tr>
                                                                    <td>Kích thước (R x C x S)</td>
                                                                    <td>{product.width || '-'} x {product.height || '-'} x {product.depth || '-'} cm</td>
                                                                </tr>
                                                            )}
                                                            {product.weight && (
                                                                <tr>
                                                                    <td>Trọng lượng</td>
                                                                    <td>{product.weight} kg</td>
                                                                </tr>
                                                            )}
                                                            {product.brand && (
                                                                <tr>
                                                                    <td>Thương hiệu</td>
                                                                    <td>{product.brand}</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'warranty' && (
                                        <div className="tab-panel">
                                            <p><strong>Bảo hành 12 tháng</strong> cho các trường hợp có lỗi về kỹ thuật trong quá trình sản xuất hay lắp đặt.</p>
                                            <p>Hotline hỗ trợ: <a href="tel:1800123456">1800 123 456</a></p>
                                            <p className="warranty-note">
                                                <strong>Lưu ý:</strong> Không bảo hành cho các trường hợp sử dụng không đúng cách,
                                                tự ý sửa chữa, hoặc sản phẩm bị hư hỏng do tác động bên ngoài.
                                            </p>
                                        </div>
                                    )}
                                    {activeTab === 'shipping' && (
                                        <div className="tab-panel">
                                            <h4>Giao hàng tận nơi</h4>
                                            <ul className="shipping-info">
                                                <li>Miễn phí giao hàng nội thành TP.HCM và Hà Nội cho đơn hàng từ 5 triệu đồng</li>
                                                <li>Giao hàng toàn quốc với phí ship ưu đãi</li>
                                                <li>Thời gian giao hàng: 3-7 ngày làm việc</li>
                                                <li>Dịch vụ lắp đặt tận nơi (có phí)</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="section related-products-section">
                    <div className="container">
                        <div className="section-header">
                            <h2 className="section-title">Có thể bạn cũng thích</h2>
                        </div>
                        <div className="grid grid-4">
                            {relatedProducts.map(p => (
                                <ProductCard
                                    key={p.productId}
                                    id={p.productId}
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
