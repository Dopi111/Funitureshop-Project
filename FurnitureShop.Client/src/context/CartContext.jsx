// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/apiService';

const CartContext = createContext(null);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cartCount, setCartCount] = useState(0);

    // Fetch giỏ hàng khi user đăng nhập
    const fetchCart = useCallback(async () => {
        if (!isAuthenticated() || !user?.userId) {
            setCart(null);
            setCartCount(0);
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.getCart(user.userId);
            if (response.success) {
                setCart(response.data);
                setCartCount(response.data.totalItems || 0);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    // Fetch cart khi user thay đổi
    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Thêm sản phẩm vào giỏ
    const addToCart = async (productId, quantity = 1) => {
        if (!isAuthenticated() || !user?.userId) {
            return { success: false, message: 'Vui lòng đăng nhập để thêm vào giỏ hàng' };
        }

        try {
            const response = await apiService.addToCart(user.userId, productId, quantity);
            if (response.success) {
                setCartCount(response.cartSummary?.totalItems || cartCount + quantity);
                await fetchCart(); // Refresh cart
            }
            return response;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, message: 'Có lỗi xảy ra khi thêm vào giỏ hàng' };
        }
    };

    // Cập nhật số lượng
    const updateQuantity = async (cartItemId, quantity) => {
        if (!isAuthenticated() || !user?.userId) return;

        try {
            const response = await apiService.updateCartItem(user.userId, cartItemId, quantity);
            if (response.success) {
                setCartCount(response.cartSummary?.totalItems || 0);
                await fetchCart();
            }
            return response;
        } catch (error) {
            console.error('Error updating cart:', error);
            return { success: false, message: 'Có lỗi xảy ra khi cập nhật giỏ hàng' };
        }
    };

    // Xóa sản phẩm khỏi giỏ
    const removeItem = async (cartItemId) => {
        if (!isAuthenticated() || !user?.userId) return;

        try {
            const response = await apiService.removeFromCart(user.userId, cartItemId);
            if (response.success) {
                setCartCount(response.cartSummary?.totalItems || 0);
                await fetchCart();
            }
            return response;
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, message: 'Có lỗi xảy ra khi xóa sản phẩm' };
        }
    };

    // Xóa toàn bộ giỏ hàng
    const clearCart = async () => {
        if (!isAuthenticated() || !user?.userId) return;

        try {
            const response = await apiService.clearCart(user.userId);
            if (response.success) {
                setCart(null);
                setCartCount(0);
            }
            return response;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, message: 'Có lỗi xảy ra khi xóa giỏ hàng' };
        }
    };

    const value = {
        cart,
        cartCount,
        loading,
        fetchCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
