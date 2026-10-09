import React, { useState } from 'react';
import { X, Mail, Linkedin, Copy, Check, Send, MapPin } from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { profile } = usePortfolio();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const emailAddress = profile?.email || 'rajpandya1131@gmail.com';
  const linkedinUrl = profile?.linkedin || 'https://www.linkedin.com/in/rajpandya-product-management/';
  const linkedinDisplayName = profile?.linkedinName?.trim() && !profile.linkedinName.includes('http') && !profile.linkedinName.includes('linkedin.com')
    ? profile.linkedinName
    : 'Raj Pandya';

  const handleCopy = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(
      subject || `Product Inquiry from ${name || 'Portfolio Visitor'}`
    )}&body=${encodeURIComponent(
      `Hi Raj,\n\n${message}\n\nFrom: ${name} (${email})`
    )}`;
    window.location.href = mailtoUrl;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-[#F7F4ED] border border-[#DED8CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#77736B] hover:text-[#171A18] hover:bg-[#EFE9DC] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#B08D57] font-semibold mb-2">
            <span>Direct Channel</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[#171A18]">
            Let's Start a Conversation
          </h3>
          <p className="text-xs sm:text-sm text-[#77736B] mt-1 leading-relaxed">
            Interested in discussing Product Strategy, Growth funnels, or GenAI experimentation? Reach out directly.
          </p>
        </div>

        {/* Quick Contact Pill Bar */}
        <div className="p-3.5 bg-[#EFE9DC] rounded-xl border border-[#DED8CC] mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-[#171A18] font-medium truncate w-full sm:w-auto">
            <Mail className="w-4 h-4 text-[#B08D57] flex-shrink-0" />
            <span className="truncate">{emailAddress}</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] hover:text-[#171A18] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DED8CC] text-[#171A18] hover:bg-white transition-colors"
            >
              <Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
              <span>{linkedinDisplayName}</span>
            </a>
          </div>
        </div>

        {/* Direct Email Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#171A18] mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-white border border-[#DED8CC] text-[#171A18] focus:outline-none focus:border-[#B08D57] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#171A18] mb-1">
                Your Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="s.jenkins@company.com"
                className="w-full px-3.5 py-2 text-xs rounded-lg bg-white border border-[#DED8CC] text-[#171A18] focus:outline-none focus:border-[#B08D57] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#171A18] mb-1">
              Subject / Role Discussion
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Senior PM Opportunity / Product Advisory"
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-white border border-[#DED8CC] text-[#171A18] focus:outline-none focus:border-[#B08D57] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#171A18] mb-1">
              Message
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share details on your team, project challenge, or how we might collaborate..."
              className="w-full px-3.5 py-2 text-xs rounded-lg bg-white border border-[#DED8CC] text-[#171A18] focus:outline-none focus:border-[#B08D57] transition-colors resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-[#77736B]">
              <MapPin className="w-3 h-3 text-[#B08D57]" />
              <span>Mumbai (IST, GMT+5:30)</span>
            </div>
            <button
              type="submit"
              disabled={sentSuccess}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#171A18] text-[#F7F4ED] hover:bg-[#B08D57] hover:text-[#171A18] transition-colors cursor-pointer"
            >
              <span>{sentSuccess ? 'Launching Email...' : 'Send Message'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
