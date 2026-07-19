// src/components/ChatbotWidget.jsx
// Chatbot AI nổi (floating widget) cho FurnitureShop — hiển thị ở mọi trang.
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';

// ====== CẤU HÌNH AI ======
const AI_API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;
const AI_BASE_URL = 'https://sv.devquote.shop/v1';
const AI_MODEL = 'claude-haiku-4-5';

// System prompt định hình vai trò của bot
const SYSTEM_PROMPT = `Bạn là FurnitureBot, trợ lý tư vấn nội thất thông minh của FurnitureShop.

Thông tin về shop:
- Tên: FurnitureShop — thương hiệu nội thất cao cấp Việt Nam
- Chuyên: sofa, giường, bàn ghế, tủ, nội thất phòng khách/ngủ/ăn/làm việc
- Website: http://localhost:5173
- Chính sách: Đổi trả 30 ngày, bảo hành 12 tháng, giao hàng toàn quốc
- Thanh toán: COD, chuyển khoản, VNPay

Quy tắc trả lời:
1. Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp
2. Khi tư vấn sản phẩm: nêu tên, giá, chất liệu, ưu điểm
3. Giá hiển thị định dạng VND (ví dụ: 15.000.000đ)
4. Nếu được cung cấp dữ liệu sản phẩm từ API, hãy tư vấn dựa trên đó
5. Nếu được cung cấp dữ liệu đơn hàng, hỗ trợ tra cứu đơn hàng
6. Câu trả lời ngắn gọn (tối đa 150 từ), dùng emoji phù hợp
7. Luôn kết thúc bằng câu hỏi gợi mở hoặc CTA (ví dụ: "Bạn muốn xem thêm sản phẩm không?")`;

// Gợi ý câu hỏi hiển thị khi mới mở chat
const QUICK_SUGGESTIONS = [
    'Sofa nào đang giảm giá?',
    'Tư vấn nội thất phòng ngủ',
    'Cách theo dõi đơn hàng?',
    'Chính sách đổi trả?',
];

// Định dạng số tiền sang VND
const formatVND = (value) => {
    if (value == null) return '';
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
};

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Xin chào! 🛋️ Tôi là FurnitureBot, trợ lý tư vấn nội thất của FurnitureShop. Tôi có thể giúp gì cho bạn?' },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Lấy dữ liệu ngữ cảnh (sản phẩm / đơn hàng) để đính kèm vào prompt
    const buildContext = async (userText) => {
        let context = '';
        const lower = userText.toLowerCase();

        // Nếu hỏi về sản phẩm → fetch sản phẩm liên quan
        const productKeywords = ['sofa', 'giường', 'bàn', 'ghế', 'tủ', 'kệ', 'nội thất', 'sản phẩm', 'giảm giá', 'sale', 'giá', 'mẫu'];
        if (productKeywords.some((k) => lower.includes(k))) {
            try {
                // Tách từ khóa tìm kiếm đơn giản
                const keyword = userText.replace(/[?.,!]/g, '').trim();
                const res = await fetch(`/api/products?search=${encodeURIComponent(keyword)}&pageSize=3`);
                if (res.ok) {
                    const data = await res.json();
                    const products = data.data || data.items || [];
                    if (products.length > 0) {
                        context += '\n\n[DỮ LIỆU SẢN PHẨM TỪ HỆ THỐNG]:\n';
                        products.forEach((p) => {
                            const price = p.discountPrice || p.basePrice;
                            context += `- ${p.name} | Giá: ${formatVND(price)}${p.discountPrice ? ` (gốc ${formatVND(p.basePrice)})` : ''} | Chất liệu: ${p.material || 'N/A'} | Màu: ${p.color || 'N/A'} | Còn: ${p.stockQuantity ?? 'N/A'} sản phẩm\n`;
                        });
                    }
                }
            } catch (e) {
                console.error('Lỗi fetch sản phẩm:', e);
            }
        }

        // Nếu đã đăng nhập và hỏi về đơn hàng → fetch đơn hàng của user
        const orderKeywords = ['đơn hàng', 'đơn của tôi', 'theo dõi', 'giao hàng', 'order', 'mua', 'vận chuyển'];
        if (orderKeywords.some((k) => lower.includes(k))) {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const userId = user.userId || user.id;
                    if (userId) {
                        const res = await fetch(`/api/orders/user/${userId}`);
                        if (res.ok) {
                            const data = await res.json();
                            const orders = data.data || data || [];
                            const list = Array.isArray(orders) ? orders : orders.data || [];
                            if (list.length > 0) {
                                context += '\n\n[ĐƠN HÀNG CỦA KHÁCH]:\n';
                                list.slice(0, 3).forEach((o) => {
                                    context += `- Đơn ${o.orderNumber || o.orderId} | Trạng thái: ${o.statusName || o.status} | Tổng: ${formatVND(o.totalAmount)} | Ngày: ${o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}\n`;
                                });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Lỗi fetch đơn hàng:', e);
            }
        }

        return context;
    };

    // Gửi tin nhắn tới AI
    const sendMessage = async (text) => {
        const userText = (text ?? input).trim();
        if (!userText || loading) return;

        if (!AI_API_KEY) {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Thiếu cấu hình chatbot. Vui lòng thiết lập `VITE_CHATBOT_API_KEY` trong file `.env`.' },
            ]);
            return;
        }

        const userMsg = { role: 'user', content: userText };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Đính kèm ngữ cảnh sản phẩm / đơn hàng nếu có
            const context = await buildContext(userText);

            // Giữ tối đa 10 tin nhắn gần nhất làm history
            const history = [...messages, userMsg].slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${AI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT + context },
                        ...history,
                    ],
                    max_tokens: 800,
                    temperature: 0.7,
                }),
            });

            if (!res.ok) throw new Error('AI response not ok');

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi chưa hiểu ý bạn. Bạn thử hỏi lại nhé! 😊';
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        } catch (e) {
            console.error('Lỗi gọi AI:', e);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Xin lỗi, hệ thống đang bận. Bạn vui lòng thử lại sau ít phút nhé! 🙏' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Chỉ hiện gợi ý khi mới bắt đầu (chưa có tin user nào)
    const showSuggestions = messages.filter((m) => m.role === 'user').length === 0;

    return (
        <>
            {/* ====== FLOATING BUTTON ====== */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Mở trợ lý tư vấn"
                className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-300 hover:scale-110 max-[480px]:h-12 max-[480px]:w-12"
                style={{ backgroundColor: 'var(--sand, #C9A87C)' }}
            >
                {/* Hiệu ứng pulse ring khi chưa mở */}
                {!isOpen && (
                    <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-40"
                        style={{ backgroundColor: 'var(--sand, #C9A87C)' }}
                    />
                )}
                {isOpen ? (
                    <X className="relative h-6 w-6 text-white" />
                ) : (
                    <MessageCircle className="relative h-6 w-6 text-white" />
                )}
            </button>

            {/* ====== CHAT WINDOW ====== */}
            <div
                className="fixed bottom-24 right-6 z-[9999] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 ease-out max-[480px]:right-3 max-[480px]:left-3 max-[480px]:w-auto"
                style={{
                    width: '380px',
                    height: '520px',
                    maxHeight: 'calc(100vh - 120px)',
                    transformOrigin: 'bottom right',
                    opacity: isOpen ? 1 : 0,
                    transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(20px)',
                    pointerEvents: isOpen ? 'auto' : 'none',
                    border: '1px solid var(--mist, #E8E4DC)',
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 text-white"
                    style={{ background: 'linear-gradient(135deg, #0D0D0D 0%, #1a1a1a 100%)' }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🛋️</span>
                        <div>
                            <p className="text-sm font-semibold leading-tight">FurnitureBot</p>
                            <p className="text-[11px] leading-tight" style={{ color: 'var(--sand-light, #E6D5BC)' }}>
                                Trợ lý tư vấn nội thất
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} aria-label="Đóng" className="rounded-full p-1 hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-4" style={{ backgroundColor: 'var(--cream, #FDFBF7)' }}>
                    {messages.map((msg, i) => (
                        <div key={i} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className="max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed"
                                style={
                                    msg.role === 'user'
                                        ? { backgroundColor: 'var(--sand, #C9A87C)', color: '#fff', borderBottomRightRadius: 4 }
                                        : { backgroundColor: '#fff', color: 'var(--ink, #0D0D0D)', border: '1px solid var(--mist, #E8E4DC)', borderBottomLeftRadius: 4 }
                                }
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {/* Loading 3 chấm nhảy */}
                    {loading && (
                        <div className="mb-3 flex justify-start">
                            <div className="flex gap-1 rounded-2xl bg-white px-4 py-3" style={{ border: '1px solid var(--mist, #E8E4DC)' }}>
                                {[0, 1, 2].map((d) => (
                                    <span
                                        key={d}
                                        className="h-2 w-2 animate-bounce rounded-full"
                                        style={{ backgroundColor: 'var(--sand, #C9A87C)', animationDelay: `${d * 0.15}s` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Gợi ý câu hỏi nhanh */}
                    {showSuggestions && !loading && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {QUICK_SUGGESTIONS.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => sendMessage(q)}
                                    className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs transition-colors hover:bg-[var(--sand-light,#E6D5BC)]"
                                    style={{ border: '1px solid var(--sand, #C9A87C)', color: 'var(--ink, #0D0D0D)' }}
                                >
                                    <Sparkles className="h-3 w-3" style={{ color: 'var(--sand, #C9A87C)' }} />
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex items-center gap-2 border-t px-3 py-2.5" style={{ borderColor: 'var(--mist, #E8E4DC)', backgroundColor: '#fff' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập câu hỏi..."
                        className="flex-1 rounded-full px-4 py-2 text-sm outline-none"
                        style={{ backgroundColor: 'var(--cream, #FDFBF7)', border: '1px solid var(--mist, #E8E4DC)' }}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        aria-label="Gửi"
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-opacity disabled:opacity-40"
                        style={{ backgroundColor: 'var(--sand, #C9A87C)' }}
                    >
                        <Send className="h-4 w-4 text-white" />
                    </button>
                </div>
            </div>
        </>
    );
}
