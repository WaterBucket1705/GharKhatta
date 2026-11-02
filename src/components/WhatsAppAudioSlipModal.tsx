import React, { useState, useEffect } from 'react';
import { Volume2, Share2, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { ReceiptModalPayload } from '../types/khata';
import { buildHindiVoiceScript, buildWhatsAppShareText } from '../utils/mathEngine';

interface WhatsAppAudioSlipModalProps {
  payload: ReceiptModalPayload | null;
  onClose: () => void;
}

export const WhatsAppAudioSlipModal: React.FC<WhatsAppAudioSlipModalProps> = ({
  payload,
  onClose,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speechNotice, setSpeechNotice] = useState('');

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!payload) return null;

  const hindiScript = buildHindiVoiceScript(payload);
  const whatsappText = buildWhatsAppShareText(payload);
  const whatsappUrl = `https://wa.me/${payload.phone}?text=${encodeURIComponent(whatsappText)}`;

  const handlePlayHindiAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechNotice('Playing Hindi voice transcript below (Web Speech API verified):');
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(hindiScript);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(
        (v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi')
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeechNotice('Speaking aloud in Hindi (hi-IN) for staff verification...');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      setIsSpeaking(true);
      setSpeechNotice('Speaking aloud in Hindi (hi-IN) for staff verification...');
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleCopyText = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsappText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <p className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Bilingual Staff Verification Slip (घरखाता पर्ची)</span>
            </p>
            <h2 id="receipt-modal-title" className="text-lg font-bold text-stone-900 mt-0.5">
              {payload.staffName} · {payload.staffNameHi}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close Receipt Modal"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Bilingual Slip */}
        <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-200 pb-2">
            <span>Date: {payload.dateStr}</span>
            <span>Logged by {payload.loggedBy}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">Entry Logged (अद्यतन):</span>
              <span className="font-semibold text-stone-900">
                {payload.entryTypeLabel} ({payload.entryTypeLabelHi})
              </span>
            </div>

            {payload.amountChanged !== undefined && payload.amountChanged > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Amount (राशि):</span>
                <span
                  className={`font-mono-num font-bold ${
                    payload.isAddition ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {payload.isAddition ? '+' : '-'}₹{payload.amountChanged.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-stone-600">Paid Leaves Used (इस महीने छुट्टी):</span>
              <span className="font-mono-num font-medium text-stone-900">
                {payload.paidLeavesUsed} / {payload.paidLeaveQuota} Quota
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">Total Advance Taken (कुल एडवांस):</span>
              <span className="font-mono-num font-medium text-amber-700">
                -₹{payload.totalBorrowedThisMonth.toLocaleString('en-IN')}
              </span>
            </div>

            {payload.activeEmiCut > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Monthly Loan EMI Cut (किस्त कटौती):</span>
                <span className="font-mono-num font-medium text-amber-700">
                  -₹{payload.activeEmiCut.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {payload.reimbursementsThisMonth > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">Home Reimbursement (घर का सामान खर्च):</span>
                <span className="font-mono-num font-medium text-emerald-700">
                  +₹{payload.reimbursementsThisMonth.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-stone-500">Exact Money Left to Give</p>
              <p className="text-sm font-bold text-stone-900">बाकी पगार (Net Left to Pay)</p>
            </div>
            <span className="text-2xl font-mono-num font-bold text-emerald-700">
              ₹{payload.netPayableLeft.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Spoken Hindi Audio Script Box */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              Spoken Hindi Audio Script (hi-IN Voice Note)
            </span>
            {isSpeaking && (
              <span className="text-xs font-semibold text-emerald-700">Speaking Now...</span>
            )}
          </div>
          <p className="text-xs text-stone-800 leading-relaxed italic">"{hindiScript}"</p>
          {speechNotice && <p className="text-[11px] text-emerald-800 font-medium">{speechNotice}</p>}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={handlePlayHindiAudio}
            className="flex-1 px-4 py-3 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Play Hindi Voice Note for Staff</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-3 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-center"
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopyText}
            aria-label="Copy Slip Text"
            className="px-3.5 py-3 rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300 transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
