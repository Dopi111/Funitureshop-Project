// src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import orderService from '../../services/orderService';
import '../../index.css';

const AdminOrders = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [processingOrder, setProcessingOrder] = useState(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [availableTransitions, setAvailableTransitions] = useState([]);
    const [stateDescription, setStateDescription] = useState('');
    const pageSize = 10;

    const orderStatuses = {
        1: { label: 'Chờ xác nhận', class: 'pending', icon: '⏳' },
        2: { label: 'Đang xử lý', class: 'processing', icon: '🔄' },
        3: { label: 'Đang giao hàng', class: 'shipped', icon: '🚚' },
        4: { label: 'Hoàn thành', class: 'completed', icon: '✅' },
        5: { label: 'Đã hủy', class: 'cancelled', icon: '❌' }
    };

    // Fetch orders with orderService
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const result = await orderService.getAllOrders(currentPage, pageSize, statusFilter || null);

            if (!result.success) {
                setError(result.message || 'Không thể tải danh sách đơn hàng');
                setOrders([]);
                return;
            }

            // API returns { data: [...], totalPages, ... } wrapped by apiClient normalization
            // result.data contains the full response, so we need result.data.data for orders array
            let ordersArray = result.data?.data || [];
            let totalPagesFromApi = result.data?.totalPages || 1;

            // Client-side search filter
            let filteredOrders = ordersArray;
            if (searchTerm) {
                filteredOrders = filteredOrders.filter(o =>
                    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.shippingFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.shippingPhone?.includes(searchTerm)
                );
            }

            setOrders(Array.isArray(filteredOrders) ? filteredOrders : []);
            setTotalPages(totalPagesFromApi);
            setError(null);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchOrders();
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const viewOrderDetail = async (orderId) => {
        try {
            const result = await orderService.getOrderById(orderId);
            if (result.success && result.data) {
                setSelectedOrder(result.data);
                // Set undo/redo flags from order data if available, otherwise default to false
                setCanUndo(result.data?.canUndo ?? false);
                setCanRedo(result.data?.canRedo ?? false);
                
                // Load available transitions and state description
                try {
                    const stateResult = await orderService.getOrderState(orderId);
                    if (stateResult.success) {
                        setStateDescription(stateResult.data?.description ?? '');
                        setAvailableTransitions(stateResult.data?.availableTransitions ?? []);
                    }
                } catch (err) {
                    console.warn('Could not load order state info:', err);
                }
                
                setShowDetailModal(true);
            } else {
                alert(result.message || 'Không thể tải chi tiết đơn hàng');
            }
        } catch (err) {
            alert('Không thể tải chi tiết đơn hàng');
        }
    };

    const closeDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    const handleTransitionState = async (orderId) => {
        if (!selectedOrder) return;

        const currentStatus = selectedOrder.status;

        // Determine which command to execute based on current status
        let commandFn;
        let actionLabel;

        if (currentStatus === 1) {
            // Pending → Processing (Confirm)
            commandFn = () => orderService.confirmOrder(orderId, user?.fullName || 'Admin');
            actionLabel = 'xác nhận';
        } else if (currentStatus === 2) {
            // Processing → Shipped (Ship)
            commandFn = () => orderService.shipOrder(orderId, user?.fullName || 'Admin');
            actionLabel = 'giao hàng';
        } else {
            alert('Không thể chuyển trạng thái cho đơn hàng này');
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} đơn hàng này?`)) {
            return;
        }

        setProcessingOrder(orderId);
        try {
            const result = await commandFn();

            if (!result.success) {
                alert(result.message || 'Không thể cập nhật trạng thái đơn hàng');
                return;
            }

            // Update undo/redo flags from response
            setCanUndo(result.data?.canUndo ?? false);
            setCanRedo(result.data?.canRedo ?? false);

            await fetchOrders();
            await viewOrderDetail(orderId);
        } catch (err) {
            alert('Lỗi: ' + (err.message || 'Không thể cập nhật trạng thái'));
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleCancelOrder = async (orderId) => {
        const reason = window.prompt('Nhập lý do hủy đơn hàng:');
        if (reason === null) return;

        setProcessingOrder(orderId);
        try {
            const result = await orderService.cancelOrder(
                orderId,
                reason || 'Hủy bởi Admin',
                user?.fullName || 'Admin'
            );

            if (!result.success) {
                alert(result.message || 'Không thể hủy đơn hàng');
                return;
            }

            // Update undo/redo flags from response
            setCanUndo(result.data?.canUndo ?? false);
            setCanRedo(result.data?.canRedo ?? false);

            await fetchOrders();
            await viewOrderDetail(orderId);
        } catch (err) {
            alert('Lỗi: ' + (err.message || 'Không thể hủy đơn hàng'));
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleUndoCommand = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn hoàn tác thao tác cuối cùng?')) {
            return;
        }

        setProcessingOrder(orderId);
        try {
            const result = await orderService.undoCommand(orderId, user?.fullName || 'Admin');

            if (!result.success) {
                alert(result.message || 'Không thể hoàn tác');
                return;
            }

            setCanUndo(result.data?.canUndo ?? false);
            setCanRedo(result.data?.canRedo ?? false);

            await fetchOrders();
            await viewOrderDetail(orderId);
        } catch (err) {
            alert('Lỗi: ' + (err.message || 'Không thể hoàn tác'));
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleRedoCommand = async (orderId) => {
        if (!window.confirm('Bạn có chắc chắn muốn làm lại thao tác?')) {
            return;
        }

        setProcessingOrder(orderId);
        try {
            const result = await orderService.redoCommand(orderId, user?.fullName || 'Admin');

            if (!result.success) {
                alert(result.message || 'Không thể làm lại');
                return;
            }

            setCanUndo(result.data?.canUndo ?? false);
            setCanRedo(result.data?.canRedo ?? false);

            await fetchOrders();
            await viewOrderDetail(orderId);
        } catch (err) {
            alert('Lỗi: ' + (err.message || 'Không thể làm lại'));
        } finally {
            setProcessingOrder(null);
        }
    };

    const getNextStatusLabel = (currentStatus) => {
        const nextStatusMap = {
            1: 'Xác nhận đơn',
            2: 'Giao hàng',
            3: 'Hoàn thành'
        };
        return nextStatusMap[currentStatus] || null;
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-header">
                    <h1>Quản lý đơn hàng</h1>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã đơn, tên, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="admin-filter-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            {Object.entries(orderStatuses).map(([key, value]) => (
                                <option key={key} value={key}>
                                    {value.icon} {value.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="admin-table-container">
                    {loading ? (
                        <div className="admin-loading">
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th>SĐT</th>
                                        <th>Tổng tiền</th>
                                        <th>Thanh toán</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày đặt</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center">
                                                Không có đơn hàng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.orderId}>
                                                <td>
                                                    <span className="order-number">{order.orderNumber}</span>
                                                </td>
                                                <td>{order.shippingFullName}</td>
                                                <td>{order.shippingPhone}</td>
                                                <td className="price-cell">{formatPrice(order.totalAmount)}</td>
                                                <td>
                                                    <span className={`payment-badge ${order.isPaid ? 'paid' : 'unpaid'}`}>
                                                        {order.isPaid ? '✓ Đã TT' : '○ Chưa TT'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`order-status-badge ${orderStatuses[order.status]?.class || ''}`}>
                                                        {orderStatuses[order.status]?.icon} {orderStatuses[order.status]?.label || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(order.createdAt)}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => viewOrderDetail(order.orderId)}
                                                            className="btn-action btn-view"
                                                            title="Xem chi tiết"
                                                        >
                                                            👁️
                                                        </button>
                                                        {order.status < 4 && (
                                                            <button
                                                                onClick={() => handleTransitionState(order.orderId)}
                                                                className="btn-action btn-next"
                                                                title={getNextStatusLabel(order.status)}
                                                                disabled={processingOrder === order.orderId}
                                                            >
                                                                ➡️
                                                            </button>
                                                        )}
                                                        {order.status < 3 && (
                                                            <button
                                                                onClick={() => handleCancelOrder(order.orderId)}
                                                                className="btn-action btn-delete"
                                                                title="Hủy đơn"
                                                                disabled={processingOrder === order.orderId}
                                                            >
                                                                ❌
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="admin-pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        ← Trước
                                    </button>
                                    <span className="pagination-info">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        Sau →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Order Detail Modal */}
            {showDetailModal && selectedOrder && (
                <div className="modal-overlay" onClick={closeDetailModal}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi tiết đơn hàng #{selectedOrder.orderNumber}</h2>
                            <button onClick={closeDetailModal} className="modal-close">&times;</button>
                        </div>

                        <div className="order-detail-content">
                            {/* Order Status */}
                            <div className="order-status-section">
                                <span className={`order-status-badge large ${orderStatuses[selectedOrder.status]?.class || ''}`}>
                                    {orderStatuses[selectedOrder.status]?.icon} {orderStatuses[selectedOrder.status]?.label}
                                </span>
                                {stateDescription && (
                                    <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                        {stateDescription}
                                    </p>
                                )}
                                {selectedOrder.status < 4 && (
                                    <div className="order-actions">
                                        <button
                                            onClick={() => handleTransitionState(selectedOrder.orderId)}
                                            className="btn btn-primary btn-sm"
                                            disabled={processingOrder === selectedOrder.orderId}
                                        >
                                            {getNextStatusLabel(selectedOrder.status)}
                                        </button>
                                        {selectedOrder.status < 3 && (
                                            <button
                                                onClick={() => handleCancelOrder(selectedOrder.orderId)}
                                                className="btn btn-outline btn-sm btn-danger"
                                                disabled={processingOrder === selectedOrder.orderId}
                                            >
                                                Hủy đơn
                                            </button>
                                        )}
                                        {canUndo && (
                                            <button
                                                onClick={() => handleUndoCommand(selectedOrder.orderId)}
                                                className="btn btn-outline btn-sm"
                                                disabled={processingOrder === selectedOrder.orderId}
                                                title="Hoàn tác thao tác cuối cùng"
                                            >
                                                ↶ Hoàn tác
                                            </button>
                                        )}
                                        {canRedo && (
                                            <button
                                                onClick={() => handleRedoCommand(selectedOrder.orderId)}
                                                className="btn btn-outline btn-sm"
                                                disabled={processingOrder === selectedOrder.orderId}
                                                title="Làm lại thao tác"
                                            >
                                                ↷ Làm lại
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Customer Info */}
                            <div className="order-section">
                                <h3>Thông tin giao hàng</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Người nhận:</span>
                                        <span className="info-value">{selectedOrder.shippingFullName}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Số điện thoại:</span>
                                        <span className="info-value">{selectedOrder.shippingPhone}</span>
                                    </div>
                                    <div className="info-item full-width">
                                        <span className="info-label">Địa chỉ:</span>
                                        <span className="info-value">
                                            {selectedOrder.shippingAddress}
                                            {selectedOrder.shippingWard && `, ${selectedOrder.shippingWard}`}
                                            {selectedOrder.shippingDistrict && `, ${selectedOrder.shippingDistrict}`}
                                            {selectedOrder.shippingCity && `, ${selectedOrder.shippingCity}`}
                                        </span>
                                    </div>
                                    {selectedOrder.notes && (
                                        <div className="info-item full-width">
                                            <span className="info-label">Ghi chú:</span>
                                            <span className="info-value">{selectedOrder.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="order-section">
                                <h3>Sản phẩm đặt mua</h3>
                                <table className="order-items-table">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Đơn giá</th>
                                            <th>SL</th>
                                            <th>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.orderDetails?.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="order-item-name">
                                                        {item.productName}
                                                        {item.productSku && <span className="sku">SKU: {item.productSku}</span>}
                                                    </div>
                                                </td>
                                                <td>{formatPrice(item.unitPrice)}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatPrice(item.totalPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="3" className="text-right">Tạm tính:</td>
                                            <td>{formatPrice(selectedOrder.subTotal)}</td>
                                        </tr>
                                        <tr>
                                            <td colSpan="3" className="text-right">Phí vận chuyển:</td>
                                            <td>{formatPrice(selectedOrder.shippingFee)}</td>
                                        </tr>
                                        <tr className="total-row">
                                            <td colSpan="3" className="text-right"><strong>Tổng cộng:</strong></td>
                                            <td><strong>{formatPrice(selectedOrder.totalAmount)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Payment Info */}
                            <div className="order-section">
                                <h3>Thông tin thanh toán</h3>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Phương thức:</span>
                                        <span className="info-value">{selectedOrder.paymentMethod || 'COD'}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Trạng thái:</span>
                                        <span className={`payment-badge ${selectedOrder.isPaid ? 'paid' : 'unpaid'}`}>
                                            {selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </span>
                                    </div>
                                    {selectedOrder.paidAt && (
                                        <div className="info-item">
                                            <span className="info-label">Ngày TT:</span>
                                            <span className="info-value">{formatDate(selectedOrder.paidAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
                            {selectedOrder.statusHistories && selectedOrder.statusHistories.length > 0 && (
                                <div className="order-section">
                                    <h3>Lịch sử đơn hàng</h3>
                                    <div className="order-timeline">
                                        {selectedOrder.statusHistories.map((history, index) => (
                                            <div key={index} className="timeline-item">
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-content">
                                                    <span className="timeline-status">
                                                        {orderStatuses[history.toStatus]?.label || `Trạng thái ${history.toStatus}`}
                                                    </span>
                                                    <span className="timeline-date">{formatDate(history.changedAt)}</span>
                                                    {history.notes && <span className="timeline-notes">{history.notes}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
