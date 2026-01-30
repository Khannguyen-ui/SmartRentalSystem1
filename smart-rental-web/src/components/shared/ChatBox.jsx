import { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import ReactMarkdown from "react-markdown"; // 1. Import thư viện Markdown
import { askAI } from "../../services/aiChatService";

export default function ChatBox() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const nodeRef = useRef(null);
  const chatEndRef = useRef(null); // Ref để tự động cuộn

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Chào bạn 👋 Mình là trợ lý Smart Rental. Bạn cần tìm phòng thế nào? 🏠",
    },
  ]);

  // Tự động cuộn xuống dưới khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const aiReply = await askAI(input);
      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ Hệ thống đang bận, bạn thử lại nhé." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 1. Icon nổi */}
      <Draggable nodeRef={nodeRef}>
        <div
          ref={nodeRef}
          className="fixed z-[99999] cursor-grab active:cursor-grabbing"
          style={{ bottom: "100px", right: "40px", touchAction: "none" }}
        >
          {!open && (
            <div
              onClick={() => setOpen(true)}
              className="group relative flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.2)] border-2 border-green-500 hover:scale-110 transition-all duration-300"
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping"></span>
              <img
                src="https://fpt.ai/static/v3/images/icon-bot.png"
                alt="AI Bot"
                className="w-12 h-12 relative z-10"
                onError={(e) => {
                  e.target.src = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
                }}
              />
            </div>
          )}
        </div>
      </Draggable>

      {/* 2. Cửa sổ Chat */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[380px] h-[580px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col border border-gray-100 z-[100000] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-700 to-green-500 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-full flex items-center justify-center">
                <img src="https://fpt.ai/static/v3/images/icon-bot.png" className="w-6 h-6" alt="bot" />
              </div>
              <div>
                <p className="font-bold text-sm leading-none">Smart Rental AI</p>
                <p className="text-[10px] opacity-90 mt-1">● Đang trực tuyến</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-lg"
            >
              ✕
            </button>
          </div>

          {/* Nội dung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-tr-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                  }`}
                >
                  {/* Sử dụng ReactMarkdown để hiển thị nội dung AI gửi về */}
                  <ReactMarkdown
                    components={{
                      // Tùy chỉnh hiển thị ảnh (bo góc, rộng 100%)
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg my-2 max-w-full h-auto shadow-sm"
                          alt="Phòng trọ"
                        />
                      ),
                      // Tùy chỉnh hiển thị link
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 font-semibold underline hover:text-blue-700"
                        />
                      ),
                      // Tùy chỉnh danh sách
                      ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1" {...props} />,
                      p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-1 text-gray-400 text-[12px] italic ml-2">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                <span className="animate-bounce [animation-delay:0.4s]">.</span>
              </div>
            )}
            <div ref={chatEndRef} /> {/* Điểm neo để cuộn */}
          </div>

          {/* Input gửi tin nhắn */}
          <div className="p-4 bg-white border-t">
            <div className="relative flex items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Nhập nội dung tin nhắn..."
                className="w-full bg-gray-100 border-none rounded-full pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="absolute right-2 w-8 h-8 flex bg-green-600 text-white rounded-full items-center justify-center hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                ➔
              </button>
            </div>
            <p className="text-center text-[9px] text-gray-400 mt-2 uppercase tracking-tighter">
              Powered by SmartRental AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}