import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-[var(--ink)] text-zinc-400 py-28 px-6 md:px-12 border-t border-[var(--ink-soft)] mt-auto font-light">
            <div className="max-w-[1600px] mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-24">
                    {/* Brand Column */}
                    <div className="lg:col-span-5 flex flex-col items-start pr-0 lg:pr-12">
                        <Link to="/" className="text-4xl font-bold tracking-tight text-white uppercase mb-6">
                            Furniture<span className="font-light text-[var(--sand)]">Shop</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-8 max-w-md text-zinc-400 font-light">
                            Khởi nguồn từ sự đam mê cái đẹp và khát khao định hình phong cách sống hiện đại. 
                            Chúng tôi kiến tạo những tác phẩm nội thất cao cấp mang vẻ đẹp bền vững, tinh tế trong từng đường nét.
                        </p>
                        <div className="flex gap-8">
                            {['FB', 'IG', 'YT', 'PT'].map((social) => (
                                <a key={social} href="#" className="text-xs tracking-[0.2em] text-[var(--sand-light)] hover:text-white transition-colors uppercase font-medium">
                                    {social}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Columns Grid Container */}
                    <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
                        {/* Products Column */}
                        <div>
                            <h4 className="text-[10px] tracking-[0.25em] uppercase text-white font-semibold mb-6">Sản phẩm</h4>
                            <div className="flex flex-col gap-4">
                                {['Phòng khách', 'Phòng ngủ', 'Phòng ăn', 'Phòng làm việc', 'Đồ trang trí'].map(link => (
                                    <Link key={link} to="/category/all" className="text-xs text-zinc-400 hover:text-[var(--sand-light)] transition-colors">{link}</Link>
                                ))}
                            </div>
                        </div>

                        {/* Support Column */}
                        <div>
                            <h4 className="text-[10px] tracking-[0.25em] uppercase text-white font-semibold mb-6">Hỗ trợ</h4>
                            <div className="flex flex-col gap-4">
                                {['Giới thiệu', 'Liên hệ', 'Câu hỏi thường gặp', 'Hướng dẫn mua hàng', 'Hệ thống showroom'].map(link => (
                                    <Link key={link} to="/category/all" className="text-xs text-zinc-400 hover:text-[var(--sand-light)] transition-colors">{link}</Link>
                                ))}
                            </div>
                        </div>

                        {/* Policy Column */}
                        <div className="col-span-2 md:col-span-1">
                            <h4 className="text-[10px] tracking-[0.25em] uppercase text-white font-semibold mb-6">Chính sách</h4>
                            <div className="flex flex-col gap-4">
                                {['Chính sách giao hàng', 'Chính sách đổi trả', 'Chính sách bảo hành', 'Chính sách bảo mật'].map(link => (
                                    <Link key={link} to="/category/all" className="text-xs text-zinc-400 hover:text-[var(--sand-light)] transition-colors">{link}</Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Copyright */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-[var(--sand)]/10 text-xs font-light text-zinc-500">
                    <p>© 2026 FurnitureShop. Thiết kế chuẩn vị Editorial Luxury.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <span className="hover:text-white cursor-pointer transition-colors">Điều khoản sử dụng</span>
                        <span className="hover:text-white cursor-pointer transition-colors">Bảo mật thông tin</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
