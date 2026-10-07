import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  ArrowUpRight, 
  Bot, 
  User, 
  ChevronDown,
  HelpCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Minimize2,
  Maximize2,
  FastForward
} from 'lucide-react';
import { chatService, ChatMessage } from '../services/chatService';

interface PortfolioChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  currentPath: string;
}

const DEFAULT_STARTER_QUESTIONS = [
  "What is Raj's background and key expertise?",
  "Tell me about the Godrej Properties CRO case study",
  "What AI projects has Raj built (e.g. PulseReel)?",
  "What measurable metrics and GMV has Raj driven?",
  "How can I get in touch with Raj?"
];

export const PortfolioChatbot: React.FC<PortfolioChatbotProps> = ({
  isOpen,
  onClose,
  onOpen,
  currentPath
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I am **Raj Pandya's Portfolio AI**.\n\nAsk me anything about Raj's **case studies**, **growth metrics**, **product frameworks**, or **career background**.",
      suggestedQuestions: DEFAULT_STARTER_QUESTIONS.slice(0, 3),
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeReplyRef = useRef<{ reply: string; suggestedQuestions: string[] } | null>(null);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isTyping, typingText, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, isMinimized]);

  // Clean up typing animation interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Immediately finishes typing and commits the message
  const finishTypingImmediately = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (activeReplyRef.current) {
      const { reply, suggestedQuestions } = activeReplyRef.current;
      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: reply,
        suggestedQuestions,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, modelMessage]);
      activeReplyRef.current = null;
    }

    setIsTyping(false);
    setTypingText('');
  };

  // Start animated typing output
  const startTypingAnimation = (reply: string, suggestedQuestions: string[]) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    activeReplyRef.current = { reply, suggestedQuestions };
    setIsTyping(true);
    setTypingText('');

    const totalLength = reply.length;
    // Responsive timing: around 1.5 - 3 seconds total typing duration
    const stepInterval = 16; // 60fps-like ticks
    const targetDurationMs = Math.min(2600, Math.max(900, totalLength * 2.2));
    const totalSteps = Math.max(1, Math.floor(targetDurationMs / stepInterval));
    const charsPerStep = Math.max(2, Math.ceil(totalLength / totalSteps));

    let currentIndex = 0;

    typingIntervalRef.current = setInterval(() => {
      currentIndex += charsPerStep;
      if (currentIndex >= totalLength) {
        finishTypingImmediately();
      } else {
        setTypingText(reply.slice(0, currentIndex));
      }
    }, stepInterval);
  };

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || input).trim();
    if (!textToSend || isLoading) return;

    // If typing was in progress, complete it instantly before starting new turn
    if (isTyping) {
      finishTypingImmediately();
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);

    // Format for backend Gemini endpoint
    const apiPayload = updatedHistory
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role,
        content: m.content
      }));

    // If it's the first message, include it
    if (apiPayload.length === 0) {
      apiPayload.push({ role: 'user', content: textToSend });
    }

    try {
      const response = await chatService.sendMessage(apiPayload, currentPath);

      if (response.success && response.reply) {
        setIsLoading(false);
        startTypingAnimation(response.reply, response.suggestedQuestions || []);
      } else {
        setIsLoading(false);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'model',
          content: response.error || "I apologize, but I couldn't reach the portfolio database right now. Please try again or reach out to Raj directly.",
          suggestedQuestions: DEFAULT_STARTER_QUESTIONS.slice(0, 2),
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'model',
        content: "An unexpected error occurred while communicating with the AI assistant. Please try asking again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleResetConversation = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    activeReplyRef.current = null;
    setIsTyping(false);
    setTypingText('');
    setIsLoading(false);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: "Conversation refreshed. I am ready to answer any questions about Raj Pandya's case studies, career experience, and skills.",
        suggestedQuestions: DEFAULT_STARTER_QUESTIONS,
        timestamp: Date.now()
      }
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper to render markdown-like formatting (bold, headers, bullet points)
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={index} className="h-1" />;

          // Heading 3 ###
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={index} className="font-serif font-bold text-base text-[#171A18] dark:text-[#EFE9DC] mt-2 mb-1">
                {trimmed.replace(/^###\s+/, '')}
              </h4>
            );
          }

          // Horizontal rule ---
          if (trimmed === '---') {
            return <hr key={index} className="border-[#DED8CC] dark:border-[#383C39] my-2" />;
          }

          // Bullet points (* or -)
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletContent = trimmed.replace(/^(\*|-|•)\s+/, '');
            return (
              <div key={index} className="flex items-start gap-2 pl-2">
                <span className="text-[#B08D57] font-bold mt-1 text-xs">•</span>
                <span className="flex-1">
                  {renderInlineFormatting(bulletContent)}
                </span>
              </div>
            );
          }

          return <p key={index}>{renderInlineFormatting(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Helper to render inline **bold**
  const renderInlineFormatting = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[#171A18] dark:text-[#F7F4ED]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom-Right) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
          >
            {/* Subtle Pill Prompt */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpen}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#171A18] text-[#F7F4ED] shadow-xl border border-[#B08D57]/40 hover:border-[#B08D57] text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer group"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B08D57] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B08D57]"></span>
              </span>
              <span>Ask Raj&apos;s Portfolio AI</span>
              <Sparkles className="w-3.5 h-3.5 text-[#B08D57] group-hover:rotate-12 transition-transform" />
            </motion.button>

            {/* Main Circular Button */}
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={onOpen}
              aria-label="Open Portfolio AI Chat"
              className="w-14 h-14 rounded-full bg-[#171A18] text-[#F7F4ED] border-2 border-[#B08D57] shadow-2xl flex items-center justify-center cursor-pointer hover:shadow-[#B08D57]/20 transition-all duration-300 relative group"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#B08D57]/20 to-transparent pointer-events-none" />
              <Sparkles className="w-6 h-6 text-[#B08D57] group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#171A18]" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT DRAWER / MODAL WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '72px' : '620px'
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-w-[480px] bg-[#FAF8F3] dark:bg-[#1E2220] rounded-2xl shadow-2xl border border-[#DED8CC] dark:border-[#383C39] flex flex-col overflow-hidden transition-[height] duration-250`}
          >
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#171A18] text-[#F7F4ED] flex items-center justify-between border-b border-[#B08D57]/30 select-none">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-full bg-[#272B28] border border-[#B08D57] flex items-center justify-center text-[#B08D57]">
                  <Sparkles className="w-4 h-4" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#171A18]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-sm tracking-wide text-[#F7F4ED]">
                      Raj Pandya Portfolio AI
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#B08D57]/20 text-[#B08D57] uppercase tracking-wider">
                      Gemini
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A6A29A] flex items-center gap-1.5 font-sans">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-ping' : isTyping ? 'bg-[#B08D57] animate-pulse' : 'bg-emerald-400'}`} />
                    {isLoading ? 'Thinking & analyzing...' : isTyping ? 'AI is typing response...' : 'Executive Product Assistant'}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1 text-[#A6A29A]">
                <button
                  type="button"
                  onClick={handleResetConversation}
                  title="Reset conversation"
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Maximize" : "Minimize"}
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  title="Close chat"
                  className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body: Messages Thread (Hidden when minimized) */}
            {!isMinimized && (
              <>
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F7F4ED] dark:bg-[#1A1D1B] scrollbar-thin scrollbar-thumb-[#DED8CC]">
                  {messages.map((message) => {
                    const isUser = message.role === 'user';
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${
                            isUser
                              ? 'bg-[#171A18] text-[#F7F4ED] rounded-br-xs'
                              : 'bg-white dark:bg-[#232724] text-[#171A18] dark:text-[#EFE9DC] border border-[#DED8CC] dark:border-[#383C39] rounded-bl-xs'
                          }`}
                        >
                          {isUser ? (
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            renderFormattedText(message.content)
                          )}
                        </div>

                        {/* Suggested Follow-up Questions Chips */}
                        {!isUser && message.suggestedQuestions && message.suggestedQuestions.length > 0 && (
                          <div className="mt-2 pl-1 space-y-1.5 max-w-[95%]">
                            <p className="text-[11px] font-semibold tracking-wider uppercase text-[#77736B] flex items-center gap-1">
                              <HelpCircle className="w-3 h-3 text-[#B08D57]" />
                              Suggested Questions:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {message.suggestedQuestions.map((question, qIdx) => (
                                <button
                                  key={qIdx}
                                  onClick={() => handleSend(question)}
                                  disabled={isLoading}
                                  className="text-left text-xs px-3 py-1.5 rounded-full bg-white dark:bg-[#232724] hover:bg-[#EFE9DC] dark:hover:bg-[#2C312E] text-[#171A18] dark:text-[#EFE9DC] border border-[#DED8CC] dark:border-[#383C39] hover:border-[#B08D57] transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 group"
                                >
                                  <span>{question}</span>
                                  <ArrowUpRight className="w-3 h-3 text-[#B08D57] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Active Typing Message Stream */}
                  {isTyping && (
                    <div className="flex flex-col items-start space-y-1.5 animate-in fade-in duration-200">
                      <div className="max-w-[88%] rounded-2xl px-4 py-3 shadow-sm bg-white dark:bg-[#232724] text-[#171A18] dark:text-[#EFE9DC] border border-[#B08D57]/50 dark:border-[#B08D57]/50 rounded-bl-xs">
                        <div>
                          {renderFormattedText(typingText)}
                          <span className="inline-block w-1.5 h-4 ml-1 bg-[#B08D57] rounded-xs animate-pulse align-middle" />
                        </div>

                        {/* Typing Action Bar */}
                        <div className="mt-3 pt-2 border-t border-[#DED8CC]/60 dark:border-[#383C39]/60 flex items-center justify-between text-[11px] text-[#A6A29A]">
                          <span className="flex items-center gap-1.5 text-[#B08D57] font-medium text-[10px]">
                            <Sparkles className="w-3 h-3 animate-spin" />
                            <span>AI is typing live response...</span>
                          </span>
                          <button
                            type="button"
                            onClick={finishTypingImmediately}
                            className="px-2 py-0.5 rounded bg-[#FAF8F3] dark:bg-[#1A1D1B] border border-[#DED8CC] dark:border-[#383C39] hover:border-[#B08D57] hover:text-[#B08D57] text-[#77736B] dark:text-[#A6A29A] transition-colors cursor-pointer flex items-center gap-1 font-sans text-[10px]"
                            title="Skip to end of response"
                          >
                            <span>Skip typing</span>
                            <FastForward className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Typing Animation State: Thinking & preparing response */}
                  {isLoading && (
                    <div className="flex items-start gap-2 animate-in fade-in duration-200">
                      <div className="bg-white dark:bg-[#232724] border border-[#DED8CC] dark:border-[#383C39] rounded-2xl rounded-bl-xs px-4 py-3 shadow-sm flex items-center gap-3">
                        <div className="flex space-x-1.5">
                          <div className="w-2 h-2 rounded-full bg-[#B08D57] animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[#B08D57] animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-[#B08D57] animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-[#171A18] dark:text-[#EFE9DC] font-medium tracking-tight">
                            Raj&apos;s Portfolio AI is typing...
                          </span>
                          <span className="text-[10px] text-[#A6A29A]">
                            Analyzing portfolio &amp; metrics
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white dark:bg-[#202422] border-t border-[#DED8CC] dark:border-[#383C39]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-end gap-2"
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about Raj's case studies, metrics, skills..."
                      rows={1}
                      disabled={isLoading}
                      className="flex-1 resize-none max-h-24 px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F7F4ED] dark:bg-[#1A1D1B] border border-[#DED8CC] dark:border-[#383C39] focus:outline-none focus:border-[#B08D57] focus:ring-1 focus:ring-[#B08D57] text-[#171A18] dark:text-[#F7F4ED] placeholder-[#A6A29A] leading-relaxed transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-2.5 rounded-xl bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] disabled:opacity-40 disabled:hover:bg-[#171A18] transition-colors shadow-sm cursor-pointer flex-shrink-0"
                      title="Send message (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#A6A29A] px-1 font-sans">
                    <span>{isTyping ? 'Press Enter to submit and skip typing' : 'Press Enter to send'}</span>
                    <span>{isTyping ? 'AI Typing Active' : 'Executive AI Assistant'}</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
