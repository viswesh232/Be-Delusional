import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './ChatBot.css';

// ── FAQ engine ──────────────────────────────────────────────────────────────
const FAQ = [
    {
        keys: ['size', 'fit', 'measurement', 'how to choose size', 'size guide', 'fitting', 'oversized'],
        answer: '📏 Check the **Size Guide** button on any product page for chest, length, and shoulder measurements. For an oversized streetwear silhouette, order your standard size. For a snugger fit, size down!',
        chips: ['Show products', 'Exchange policy', 'Track my order'],
    },
    {
        keys: ['return', 'exchange', 'size exchange', 'refund', 'wrong size', 'too tight', 'too loose'],
        answer: '↩️ We provide a **7-Day Easy Size Exchange** guarantee! Go to **My Orders**, select your delivered garment, and click **"Exchange Size"** to request a new size in seconds.',
        chips: ['Exchange policy', 'Go to My Orders', 'Contact support'],
    },
    {
        keys: ['fabric', 'material', 'cotton', 'gsm', 'wash', 'care', 'washing', 'shrink'],
        answer: '🌿 All our tees & hoodies are made of **heavyweight 240+ GSM combed cotton**, pre-shrunk to retain their shape. Wash cold and line dry in the shade for long-lasting quality!',
        chips: ['Size guide', 'Show products', 'Delivery time?'],
    },
    {
        keys: ['track', 'order status', 'where is my order', 'order id', 'tracking number'],
        answer: '🔍 You can track your order in **My Orders** section after logging in. A tracking link is also sent to your registered email after dispatch.',
        chips: ['Go to My Orders', 'Contact support', 'Delivery time?'],
    },
    {
        keys: ['contact', 'phone', 'call', 'email support', 'reach', 'customer care', 'help'],
        answer: '📞 Our team is available **Mon–Sat, 10 AM – 6 PM**.\n📱 Call: **+91 81796 06489**\nOr use our Contact page for email support.',
        chips: ['Talk to agent', 'Return policy', 'Show products'],
    },
    {
        keys: ['discount', 'coupon', 'offer', 'promo', 'sale', 'deal', 'code'],
        answer: '🎁 We run seasonal offers and deals! **Sign up** on our website and follow us on social media to be the first to know about exclusive discounts.',
        chips: ['Show products', 'Delivery time?', 'Contact support'],
    },
    {
        keys: ['minimum order', 'free delivery', 'free shipping', 'delivery charge'],
        answer: '🚚 There\'s **no minimum order amount**! Shipping charges (if any) are calculated at checkout based on your delivery location.',
        chips: ['Show products', 'Payment options', 'Return policy'],
    },
    {
        keys: ['account', 'sign up', 'register', 'login', 'password', 'forgot password'],
        answer: '👤 Click **Login / Sign Up** in the top-right corner. Creating an account lets you track orders, get faster checkout, and access your order history!',
        chips: ['Track my order', 'Show products', 'Delivery time?'],
    },
    {
        keys: ['product', 'show', 'browse', 'menu', 'what do you sell', 'items', 'list'],
        answer: '__SHOW_PRODUCTS__',
        chips: ['Delivery time?', 'Payment options', 'Return policy'],
    },
    {
        keys: ['hello', 'hi', 'hey', 'hii', 'namaste', 'good morning', 'good evening', 'howdy'],
        answer: '👋 Hello! Welcome to **True Eats**! I\'m here to help you with any questions about our products, delivery, returns, or payments. What can I help you with?',
        chips: ['Show products', 'Delivery time?', 'Track my order'],
    },
    {
        keys: ['thanks', 'thank you', 'thankyou', 'thx', 'great', 'awesome', 'perfect'],
        answer: '😊 You\'re so welcome! Is there anything else I can help you with? We want your True Eats experience to be absolutely amazing! 🌿',
        chips: ['Show products', 'Delivery time?', 'Return policy'],
    },
    {
        keys: ['bye', 'goodbye', 'see you', 'take care', 'cya'],
        answer: '👋 Goodbye! Thanks for visiting **True Eats**. Have a wonderful day and we look forward to serving you again! 🌿',
        chips: ['Show products', 'Delivery time?'],
    },
    {
        keys: ['agent', 'human', 'real person', 'talk to someone'],
        answer: '__LIVE_AGENT__',
        chips: ['Contact support', 'Return policy'],
    },
    {
        keys: ['order', 'my orders', 'orders page'],
        answer: '__GO_ORDERS__',
        chips: ['Track my order', 'Delivery time?'],
    },
];

const DEFAULT_CHIPS = ['Show products', 'Delivery time?', 'Track my order', 'Return policy', 'Contact support'];
const FALLBACK = { answer: "🤔 I didn't quite catch that! Could you rephrase? You can also pick one of the options below, or **talk to our team** for detailed help.", chips: DEFAULT_CHIPS };

const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const ts = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

function getReply(text) {
    const lower = text.toLowerCase();
    for (const faq of FAQ) {
        if (faq.keys.some(k => lower.includes(k))) return faq;
    }
    return FALLBACK;
}

function bold(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
}

const STORAGE_KEY = 'trueeats_chat_v2';

// ── Component ────────────────────────────────────────────────────────────────
export default function ChatBot() {
    const navigate = useNavigate();
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [messages, setMessages] = useState(() => {
        try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
    });
    const [chips, setChips] = useState(DEFAULT_CHIPS);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [unread, setUnread] = useState(0);
    const [products, setProducts] = useState([]);
    const [phase, setPhase] = useState('chat'); // 'greeting' | 'awaitName' | 'chat'
    const [userName, setUserName] = useState(() => localStorage.getItem('trueeats_chat_name') || '');
    const [soundOn, setSoundOn] = useState(true);
    const audioRef = useRef(null);

    // Init messages
    useEffect(() => {
        if (!messages) {
            if (userName) {
                setMessages([{
                    from: 'bot', type: 'text',
                    text: `👋 Welcome back, **${userName}**! Great to see you again at True Eats 🌿 How can I help you today?`,
                    time: ts(), chips: DEFAULT_CHIPS,
                }]);
            } else {
                setMessages([{
                    from: 'bot', type: 'text',
                    text: '👋 Hi there! I\'m the **True Eats** assistant. Before we start — what\'s your name?',
                    time: ts(), chips: [],
                }]);
                setPhase('awaitName');
            }
        }
    }, []); // eslint-disable-line

    // Persist messages
    useEffect(() => {
        if (messages) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))); } catch {}
        }
    }, [messages]);

    // Scroll to bottom
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

    // Focus input
    useEffect(() => {
        if (open && !minimized) {
            setUnread(0);
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open, minimized]);

    // Fetch products
    useEffect(() => {
        API.get('/products').then(r => setProducts(r.data || [])).catch(() => {});
    }, []);

    const pushMsg = useCallback((msg) => {
        setMessages(m => [...(m || []), msg]);
    }, []);

    const playSound = useCallback(() => {
        if (!soundOn) return;
        try { const a = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA...'); a.volume = 0.3; a.play().catch(() => {}); } catch {}
    }, [soundOn]);

    const botReply = useCallback((faq) => {
        setTyping(true);
        const delay = 700 + Math.min(faq.answer.length * 3, 1200);

        setTimeout(() => {
            setTyping(false);
            const newChips = faq.chips || DEFAULT_CHIPS;
            setChips(newChips);

            if (faq.answer === '__SHOW_PRODUCTS__') {
                if (products.length === 0) {
                    pushMsg({ from: 'bot', type: 'text', text: '🛒 Fetching our products... please check the **Products section** on our home page!', time: ts(), chips: newChips });
                } else {
                    pushMsg({ from: 'bot', type: 'text', text: '🛒 Here are some of our products! Click any to view details:', time: ts(), chips: newChips });
                    pushMsg({ from: 'bot', type: 'products', items: products.slice(0, 4), time: ts() });
                }
            } else if (faq.answer === '__LIVE_AGENT__') {
                pushMsg({ from: 'bot', type: 'text', text: '🧑‍💼 I\'ll connect you to our team! Click below to open the **Contact page** where you can send a message or call us directly.', time: ts(), chips: newChips });
                pushMsg({ from: 'bot', type: 'action', actions: [{ label: '📞 Contact Our Team', to: '/contact' }], time: ts() });
            } else if (faq.answer === '__GO_ORDERS__') {
                pushMsg({ from: 'bot', type: 'text', text: '📋 You can view and track all your orders on the **My Orders** page. You\'ll need to be logged in to access it.', time: ts(), chips: newChips });
                pushMsg({ from: 'bot', type: 'action', actions: [{ label: '📦 Go to My Orders', to: '/orders' }], time: ts() });
            } else {
                pushMsg({ from: 'bot', type: 'text', text: faq.answer, time: ts(), chips: newChips });
            }
            if (!open) setUnread(u => u + 1);
        }, delay);
    }, [products, open, pushMsg]);

    const send = useCallback((text) => {
        const t = (text || input).trim();
        if (!t) return;
        setInput('');

        const userMsg = { from: 'user', type: 'text', text: t, time: ts() };
        pushMsg(userMsg);

        if (phase === 'awaitName') {
            const name = t.split(' ')[0];
            setUserName(name);
            localStorage.setItem('trueeats_chat_name', name);
            setPhase('chat');
            setTimeout(() => {
                setTyping(true);
                setTimeout(() => {
                    setTyping(false);
                    setChips(DEFAULT_CHIPS);
                    pushMsg({
                        from: 'bot', type: 'text',
                        text: `✨ Nice to meet you, **${name}**! I\'m here to help you with anything about True Eats — products, delivery, orders, payments and more. What would you like to know?`,
                        time: ts(), chips: DEFAULT_CHIPS,
                    });
                }, 900);
            }, 300);
            return;
        }

        // Special chip shortcuts
        if (t === 'Go to My Orders') { navigate('/orders'); return; }
        if (t === 'Talk to agent') { navigate('/contact'); return; }

        const faq = getReply(t);
        botReply(faq);
    }, [input, phase, pushMsg, botReply, navigate]);

    const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    const clearChat = () => {
        localStorage.removeItem(STORAGE_KEY);
        setMessages(null);
        setPhase(userName ? 'chat' : 'awaitName');
        setChips(userName ? DEFAULT_CHIPS : []);
        setTimeout(() => setMessages([{
            from: 'bot', type: 'text',
            text: userName ? `👋 Hi **${userName}**! Chat cleared. How can I help you today?` : '👋 Hi! What\'s your name?',
            time: ts(), chips: userName ? DEFAULT_CHIPS : [],
        }]), 100);
    };

    if (!messages) return null;

    return (
        <>
            {/* FAB */}
            <button
                className={`cb-fab${open ? ' cb-fab--open' : ''}`}
                onClick={() => { setOpen(o => !o); setMinimized(false); }}
                aria-label="Open chat support"
            >
                <span className="cb-fab-ring" />
                {open
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z"/></svg>
                }
                {!open && unread > 0 && <span className="cb-badge">{unread}</span>}
                {!open && <span className="cb-fab-label">Help</span>}
            </button>

            {/* Panel */}
            <div className={`cb-panel${open ? ' cb-panel--open' : ''}${minimized ? ' cb-panel--min' : ''}`}>
                {/* Header */}
                <div className="cb-header">
                    <div className="cb-header-left">
                        <div className="cb-avatar-wrap">
                            <div className="cb-avatar">🌿</div>
                            <div className="cb-online-dot" />
                        </div>
                        <div>
                            <div className="cb-header-name">True Eats Support</div>
                            <div className="cb-header-sub">
                                <span className="cb-status-dot" />
                                {typing ? 'Typing…' : 'Online · Replies instantly'}
                            </div>
                        </div>
                    </div>
                    <div className="cb-header-actions">
                        <button className="cb-icon-btn" title={soundOn ? 'Mute' : 'Unmute'} onClick={() => setSoundOn(s => !s)}>
                            {soundOn
                                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                                : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                            }
                        </button>
                        <button className="cb-icon-btn" title="Clear chat" onClick={clearChat}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                        <button className="cb-icon-btn" title={minimized ? 'Expand' : 'Minimise'} onClick={() => setMinimized(m => !m)}>
                            {minimized
                                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
                                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
                            }
                        </button>
                        <button className="cb-icon-btn cb-close" title="Close" onClick={() => setOpen(false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                    </div>
                </div>

                {!minimized && (
                    <>
                        {/* Messages */}
                        <div className="cb-messages">
                            {messages.map((m, i) => (
                                <div key={i}>
                                    {m.type === 'text' && (
                                        <div className={`cb-msg cb-msg--${m.from}`}>
                                            {m.from === 'bot' && <div className="cb-msg-avatar">🌿</div>}
                                            <div>
                                                <div className="cb-bubble" dangerouslySetInnerHTML={{ __html: bold(m.text) }} />
                                                <div className={`cb-time cb-time--${m.from}`}>{m.time}</div>
                                            </div>
                                        </div>
                                    )}
                                    {m.type === 'products' && (
                                        <div className="cb-product-row">
                                            {m.items.map(p => (
                                                <button key={p._id} className="cb-product-card" onClick={() => navigate(`/product/${p._id}`)}>
                                                    {p.images?.[0] || p.image
                                                        ? <img src={p.images?.[0] || p.image} alt={p.name} />
                                                        : <div className="cb-product-placeholder">📦</div>
                                                    }
                                                    <div className="cb-product-name">{p.name}</div>
                                                    <div className="cb-product-price">{fmt(p.price)}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {m.type === 'action' && (
                                        <div className="cb-action-row">
                                            {m.actions.map(a => (
                                                <button key={a.label} className="cb-action-btn" onClick={() => navigate(a.to)}>
                                                    {a.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {typing && (
                                <div className="cb-msg cb-msg--bot">
                                    <div className="cb-msg-avatar">🌿</div>
                                    <div className="cb-bubble cb-typing"><span /><span /><span /></div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Quick chips */}
                        {chips.length > 0 && (
                            <div className="cb-chips-wrap">
                                <div className="cb-chips">
                                    {chips.map(c => (
                                        <button key={c} className="cb-chip" onClick={() => send(c)}>{c}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="cb-footer">
                            <div className="cb-input-row">
                                <input
                                    ref={inputRef}
                                    className="cb-input"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKey}
                                    placeholder={phase === 'awaitName' ? 'Enter your name…' : 'Type your message…'}
                                    maxLength={300}
                                />
                                <button className="cb-send" onClick={() => send()} disabled={!input.trim()}>
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
                                </button>
                            </div>
                            {input.length > 200 && (
                                <div className="cb-charcount">{input.length}/300</div>
                            )}
                            <div className="cb-powered">Powered by True Eats AI · <span onClick={() => navigate('/contact')}>Get human help</span></div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
