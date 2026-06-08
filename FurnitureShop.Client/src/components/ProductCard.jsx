// src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({
    id,
    name,
    price,
    originalPrice,
    category,
    image,
    discount,
    isNew
}) => {
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Format price to VND
    const formatPrice = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const handleAddToCart = async () => {
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const result = await addToCart(id, 1);
            if (result.success) {
                setMessage('✓ Đã thêm');
                setTimeout(() => setMessage(''), 2000);
            } else {
                setMessage(result.message || 'Lỗi');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Có lỗi xảy ra');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-card">
            <div className="product-image-wrapper">
                <img
                    src={image}
                    alt={name}
                    className="product-image"
                />

                {/* Wishlist Button */}
                <button className="product-wishlist" title="Thêm vào yêu thích">
                    ♡
                </button>

                {/* Badge */}
                {discount && (
                    <span className="product-badge">-{discount}%</span>
                )}
                {isNew && !discount && (
                    <span className="product-badge" style={{ backgroundColor: '#2ecc71' }}>Mới</span>
                )}
            </div>

            <div className="product-info">
                {category && (
                    <span className="product-category">{category}</span>
                )}
                <h3 className="product-name">{name}</h3>
                <div className="product-price">
                    {formatPrice(price)}
                    {originalPrice && (
                        <span className="product-price-original">
                            {formatPrice(originalPrice)}
                        </span>
                    )}
                </div>

                <div className="product-actions">
                    <button
                        className={`product-action-btn ${loading ? 'loading' : ''} ${message ? 'has-message' : ''}`}
                        onClick={handleAddToCart}
                        disabled={loading}
                    >
                        {loading ? '...' : message || 'Thêm vào giỏ'}
                    </button>
                    <Link to={`/product/${id}`} className="product-action-btn">Xem thêm</Link>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;