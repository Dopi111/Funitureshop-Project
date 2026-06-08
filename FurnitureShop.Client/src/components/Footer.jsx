// src/components/Footer.jsx
import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    {/* Brand Column */}
                    <div className="footer-brand">
                        <div className="footer-logo">
                            Furniture<span>Shop</span>
                        </div>
                        <p className="footer-description">
                            Chúng tôi mang đến những sản phẩm nội thất cao cấp,
                            được thiết kế tinh tế, phù hợp với không gian sống hiện đại của bạn.
                        </p>
                        <div className="footer-social">
                            <a href="#" title="Facebook">FB</a>
                            <a href="#" title="Instagram">IG</a>
                            <a href="#" title="Youtube">YT</a>
                            <a href="#" title="Pinterest">PT</a>
                        </div>
                    </div>

                    {/* Products Column */}
                    <div className="footer-column">
                        <h4 className="footer-title">Sản phẩm</h4>
                        <div className="footer-links">
                            <a href="/phong-khach">Phòng khách</a>
                            <a href="/phong-ngu">Phòng ngủ</a>
                            <a href="/phong-an">Phòng ăn</a>
                            <a href="/phong-lam-viec">Phòng làm việc</a>
                            <a href="/trang-tri">Hàng trang trí</a>
                        </div>
                    </div>

                    {/* Support Column */}
                    <div className="footer-column">
                        <h4 className="footer-title">Hỗ trợ</h4>
                        <div className="footer-links">
                            <a href="/gioi-thieu">Giới thiệu</a>
                            <a href="/lien-he">Liên hệ</a>
                            <a href="/cau-hoi-thuong-gap">FAQ</a>
                            <a href="/huong-dan-mua-hang">Hướng dẫn mua hàng</a>
                            <a href="/he-thong-cua-hang">Hệ thống cửa hàng</a>
                        </div>
                    </div>

                    {/* Policy Column */}
                    <div className="footer-column">
                        <h4 className="footer-title">Chính sách</h4>
                        <div className="footer-links">
                            <a href="/chinh-sach-giao-hang">Chính sách giao hàng</a>
                            <a href="/chinh-sach-doi-tra">Chính sách đổi trả</a>
                            <a href="/chinh-sach-bao-hanh">Chính sách bảo hành</a>
                            <a href="/dieu-khoan-su-dung">Điều khoản sử dụng</a>
                            <a href="/bao-mat">Chính sách bảo mật</a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="footer-bottom">
                    <p>© Mẫu thiết kế phần mềm.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
