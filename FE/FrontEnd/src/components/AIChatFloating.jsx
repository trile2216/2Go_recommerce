import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { askChatbot } from '../service/home/api.chatbot';
import './AIChatFloating.css';

const STORAGE_KEY = '2go_chatbot_history';
const MAX_HISTORY = 50;

const QUICK_SUGGESTIONS = [
  'Phí đăng bài?',
  'Cách mua hàng an toàn?',
  'Escrow là gì?',
  'Chatbot có thể làm gì?',
];

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function buildContext(messages) {
  const recent = messages.slice(-6);
  if (recent.length === 0) return null;
  return recent
    .map((m) => `${m.role === 'user' ? 'Người dùng' : 'Bot'}: ${m.text}`)
    .join('\n');
}

export default function AIChatFloating() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load history from localStorage ───────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // ── Save history to localStorage ─────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [messages]);

  // ── Auto-scroll to bottom ────────────────────────────────
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // ── Focus input when opening ─────────────────────────────
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 350);
    }
  }, [isOpen]);

  // ── Toggle chat window ───────────────────────────────────
  const handleToggle = useCallback(() => {
    if (isOpen) {
      setIsClosing(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 250);
    } else {
      setIsOpen(true);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  // ── Send message ─────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const question = (text || inputValue).trim();
    if (!question) return;

    const userMsg = { role: 'user', text: question, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const context = buildContext([...messages, userMsg]);
      const data = await askChatbot(question, context);

      const botMsg = {
        role: 'bot',
        text: data.answer,
        ts: Date.now(),
        suggestions: data.suggestions || null,
        source: data.source,
      };
      setMessages((prev) => [...prev, botMsg]);

      if (!isOpen) setHasNewMessage(true);
    } catch {
      const errorMsg = {
        role: 'bot',
        text: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, messages, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleProductClick = (listingId) => {
    navigate(`/listings/${listingId}`);
  };

  const formatPrice = (price) => {
    if (price == null) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Chat Window ──────────────────────────────── */}
      {isOpen && (
        <div className={`ai-chat-window ${isClosing ? 'ai-chat-window--closing' : ''}`}>
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-avatar">
              <Bot size={20} />
            </div>
            <div className="ai-chat-header-info">
              <div className="ai-chat-header-name">2GO AI Assistant</div>
              <div className="ai-chat-header-status">Luôn sẵn sàng hỗ trợ bạn</div>
            </div>
            <button className="ai-chat-header-close" onClick={handleToggle} title="Đóng">
              <X size={18} />
            </button>
          </div>

          {/* Quick Suggestions */}
          {messages.length === 0 && (
            <div className="ai-chat-suggestions">
              {QUICK_SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  className="ai-chat-suggestion-chip"
                  onClick={() => handleSend(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Body */}
          <div className="ai-chat-body" ref={bodyRef}>
            {/* Welcome */}
            {messages.length === 0 && (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">
                  <Bot size={26} />
                </div>
                <h4>Xin chào! 👋</h4>
                <p>
                  Mình là trợ lý AI của 2GO. Hãy hỏi mình bất cứ điều gì về mua bán đồ cũ nhé!
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i} className={`ai-chat-msg ai-chat-msg--${msg.role}`}>
                <div className="ai-chat-msg-avatar">
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div>
                  <div className="ai-chat-msg-bubble">
                    {msg.text}
                    {/* Product suggestions */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="ai-chat-suggestions-list">
                        {msg.suggestions.map((s) => (
                          <div
                            key={s.listingId}
                            className="ai-chat-product-card"
                            onClick={() => handleProductClick(s.listingId)}
                          >
                            <div className="ai-chat-product-info">
                              <div className="ai-chat-product-title">{s.title}</div>
                              <div className="ai-chat-product-meta">
                                {s.condition && <span>{s.condition}</span>}
                                {s.brand && <span> · {s.brand}</span>}
                              </div>
                            </div>
                            <div className="ai-chat-product-price">{formatPrice(s.price)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ai-chat-msg-time">{formatTime(msg.ts)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="ai-chat-typing">
                <div className="ai-chat-typing-avatar">
                  <Bot size={14} />
                </div>
                <div className="ai-chat-typing-dots">
                  <span className="ai-chat-typing-dot" />
                  <span className="ai-chat-typing-dot" />
                  <span className="ai-chat-typing-dot" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="ai-chat-footer">
            <input
              ref={inputRef}
              className="ai-chat-input"
              type="text"
              placeholder="Nhập câu hỏi..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
            />
            <button
              className="ai-chat-send-btn"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              title="Gửi"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── Floating Action Button ───────────────────── */}
      <button
        className={`ai-chat-fab ${isOpen ? 'ai-chat-fab--open' : ''}`}
        onClick={handleToggle}
        title={isOpen ? 'Đóng chat' : 'Chat với AI'}
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
        {!isOpen && hasNewMessage && <span className="ai-chat-fab-badge">!</span>}
      </button>
    </>
  );
}
