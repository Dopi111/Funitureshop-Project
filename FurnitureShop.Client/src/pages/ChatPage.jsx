import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ArrowLeft, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';

const AI_API_KEY = import.meta.env.VITE_CHATBOT_API_KEY;
const AI_BASE_URL = 'https://sv.devquote.shop/v1';
const AI_MODEL = 'claude-haiku-4-5';

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
6. Câu trả lời chi tiết hơn widget (tối đa 300 từ), dùng emoji phù hợp
7. Luôn kết thúc bằng câu hỏi gợi mở hoặc CTA`;

const QUICK_SUGGESTIONS = [
    'Sofa nào đang giảm giá?',
    'Tư vấn nội thất phòng ngủ',
    'Tư vấn nội thất phòng khách',
    'Cách theo dõi đơn hàng?',
    'Chính sách đổi trả như thế nào?',
    'Sản phẩm bán chạy nhất?',
];

const formatVND = (value) => {
    if (value == null) return '';
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
};

export default function ChatPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Xin chào! 🛋️ Tôi là FurnitureBot, trợ lý tư vấn nội thất của FurnitureShop.\n\nTôi có thể giúp bạn:\n• Tư vấn chọn nội thất phù hợp\n• Tra cứu sản phẩm & giá cả\n• Theo dõi đơn hàng\n• Giải đáp chính sách mua hàng\n\nBạn cần hỗ trợ gì hôm nay?',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const buildContext = async (userText) => {
        let context = '';
        const lower = userText.toLowerCase();

        const productKeywords = ['sofa', 'giường', 'bàn', 'ghế', 'tủ', 'kệ', 'nội thất', 'sản phẩm', 'giảm giá', 'sale', 'giá', 'mẫu', 'bán chạy'];
        if (productKeywords.some((k) => lower.includes(k))) {
            try {
                const keyword = userText.replace(/[?.,!]/g, '').trim();
                const res = await fetch(`/api/products?search=${encodeURIComponent(keyword)}&pageSize=5`);
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
                                list.slice(0, 5).forEach((o) => {
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
            const context = await buildContext(userText);
            const history = [...messages, userMsg].slice(-20).map((m) => ({
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
                    max_tokens: 1200,
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

    const showSuggestions = messages.filter((m) => m.role === 'user').length === 0;

    return (
        <div className="flex flex-col min-h-screen bg-[var(--stone,#F5F2EC)] text-[var(--ink-text,#0D0D0D)]">
            <Navbar />

            <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8 gap-4">
                {/* Page header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm text-[var(--ghost,#8A8278)] hover:text-[var(--ink,#0D0D0D)] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại
                    </button>
                    <div className="flex items-center gap-3 ml-2">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{ backgroundColor: 'var(--sand,#C9A87C)' }}
                        >
                            <Bot className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold leading-tight">FurnitureBot</h1>
                            <p className="text-xs text-[var(--ghost,#8A8278)]">Trợ lý tư vấn nội thất AI</p>
                        </div>
                    </div>
                </div>

                {/* Chat container */}
                <div
                    className="flex flex-1 flex-col rounded-2xl overflow-hidden shadow-lg"
                    style={{ border: '1px solid var(--mist,#E8E4DC)', minHeight: '60vh' }}
                >
                    {/* Messages area */}
                    <div
                        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
                        style={{ backgroundColor: 'var(--cream,#FDFBF7)' }}
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                                {msg.role === 'assistant' && (
                                    <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                                        style={{ backgroundColor: 'var(--sand,#C9A87C)' }}
                                    >
                                        🛋️
                                    </div>
                                )}
                                <div
                                    className="max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed"
                                    style={
                                        msg.role === 'user'
                                            ? {
                                                backgroundColor: 'var(--sand,#C9A87C)',
                                                color: '#fff',
                                                borderBottomRightRadius: 4,
                                            }
                                            : {
                                                backgroundColor: '#fff',
                                                color: 'var(--ink,#0D0D0D)',
                                                border: '1px solid var(--mist,#E8E4DC)',
                                                borderBottomLeftRadius: 4,
                                            }
                                    }
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Loading */}
                        {loading && (
                            <div className="flex justify-start items-end gap-2">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                                    style={{ backgroundColor: 'var(--sand,#C9A87C)' }}
                                >
                                    🛋️
                                </div>
                                <div
                                    className="flex gap-1 rounded-2xl bg-white px-4 py-3"
                                    style={{ border: '1px solid var(--mist,#E8E4DC)' }}
                                >
                                    {[0, 1, 2].map((d) => (
                                        <span
                                            key={d}
                                            className="h-2 w-2 animate-bounce rounded-full"
                                            style={{
                                                backgroundColor: 'var(--sand,#C9A87C)',
                                                animationDelay: `${d * 0.15}s`,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quick suggestions */}
                        {showSuggestions && !loading && (
                            <div className="pt-2">
                                <p className="text-xs text-[var(--ghost,#8A8278)] mb-3 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" style={{ color: 'var(--sand,#C9A87C)' }} />
                                    Gợi ý câu hỏi
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_SUGGESTIONS.map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => sendMessage(q)}
                                            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs transition-colors hover:bg-[var(--sand-light,#E6D5BC)]"
                                            style={{
                                                border: '1px solid var(--sand,#C9A87C)',
                                                color: 'var(--ink,#0D0D0D)',
                                            }}
                                        >
                                            <Sparkles className="h-3 w-3" style={{ color: 'var(--sand,#C9A87C)' }} />
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input area */}
                    <div
                        className="flex items-end gap-3 px-4 py-3 border-t"
                        style={{ borderColor: 'var(--mist,#E8E4DC)', backgroundColor: '#fff' }}
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi... (Enter để gửi, Shift+Enter xuống dòng)"
                            rows={1}
                            className="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none leading-relaxed"
                            style={{
                                backgroundColor: 'var(--cream,#FDFBF7)',
                                border: '1px solid var(--mist,#E8E4DC)',
                                maxHeight: '120px',
                                overflowY: 'auto',
                            }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            aria-label="Gửi"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-40 hover:opacity-90 active:scale-95"
                            style={{ backgroundColor: 'var(--sand,#C9A87C)' }}
                        >
                            <Send className="h-4 w-4 text-white" />
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-[var(--ghost,#8A8278)]">
                    FurnitureBot được hỗ trợ bởi AI · Thông tin mang tính tham khảo
                </p>
            </main>

            <Footer />
        </div>
    );
}
