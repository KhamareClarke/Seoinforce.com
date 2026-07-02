'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';

type Message = {
  id: number;
  type: 'user' | 'assistant';
  content: string;
};

const INITIAL: Message = {
  id: 1,
  type: 'assistant',
  content: 'Hi! Need a free SEO audit or help planning your rankings strategy?',
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = () => {
    if (!input.trim() || typing) return;
    const userMsg: Message = { id: Date.now(), type: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'assistant',
          content: 'Happy to help. Would you like a free SEO audit, or would you prefer to book a strategy call with our team?',
        },
      ]);
      setTyping(false);
    }, 1400);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open chat"
        className="fixed z-[80] bottom-6 right-6 h-14 w-14 rounded-full bg-[#FFD700] border-2 border-[#FFD700]/70 shadow-[0_4px_28px_rgba(255,215,0,0.5)] hover:bg-[#FFF44F] hover:scale-110 hover:shadow-[0_8px_40px_rgba(255,215,0,0.65)] flex items-center justify-center transition-all duration-200 overflow-hidden"
      >
        <img src="/logo.svg" alt="Chat" className="h-10 w-10 rounded-full object-cover" />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed z-[90] w-[360px] rounded-3xl border-2 border-[#FFD700]/25 bg-[#1a1a1e] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_60px_rgba(255,215,0,0.08),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden flex flex-col"
          style={{ bottom: '94px', right: '24px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] bg-[#111114]">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 rounded-full overflow-hidden border-2 border-[#FFD700]/40 flex items-center justify-center bg-[#FFD700]/10">
                <img src="/logo.svg" alt="SEOInForce" className="h-6 w-6 object-cover" />
              </span>
              <div>
                <p className="font-sans text-[14px] font-bold text-white leading-tight">SEOInForce</p>
                <p className="font-sans text-[11px] text-emerald-400/80 font-semibold">● Online Now</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/80 transition-colors rounded-xl hover:bg-white/[0.07]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`max-w-[88%] w-fit font-sans text-[13px] rounded-2xl px-4 py-3 leading-[1.6] font-medium ${
                  msg.type === 'assistant'
                    ? 'bg-[#0a0a0c] border border-white/[0.08] text-white/75'
                    : 'bg-[#FFD700]/15 border border-[#FFD700]/30 text-white/90 ml-auto'
                }`}
              >
                {msg.content}
              </div>
            ))}
            {typing && (
              <div className="bg-[#0a0a0c] border border-white/[0.08] rounded-2xl px-4 py-3.5 w-fit">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#FFD700]/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/[0.07] bg-[#111114]">
            <div className="flex gap-2.5">
              <input
                type="text"
                placeholder="Ask a question…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                disabled={typing}
                className="flex-1 bg-[#1a1a1e] border-2 border-white/[0.09] text-white/90 placeholder:text-white/25 rounded-xl px-4 py-2.5 font-sans text-[13px] font-medium focus:outline-none focus:border-[#FFD700]/40 disabled:opacity-50 transition-colors"
              />
              <button
                onClick={send}
                disabled={!input.trim() || typing}
                aria-label="Send"
                className="p-3 rounded-xl bg-[#FFD700] text-black hover:bg-[#FFF44F] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 shadow-[0_2px_12px_rgba(255,215,0,0.35)] hover:shadow-[0_4px_20px_rgba(255,215,0,0.5)]"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
