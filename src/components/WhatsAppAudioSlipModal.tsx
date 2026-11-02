import React, { useState, useEffect } from 'react';
import { Volume2, Share2, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { Language, ReceiptModalPayload } from '../types/khata';
import { buildHindiVoiceScript, buildWhatsAppShareText } from '../utils/mathEngine';

interface WhatsAppAudioSlipModalProps {
  payload: ReceiptModalPayload | null;
  language: Language;
  onClose: () => void;
}

export const WhatsAppAudioSlipModal: React.FC<WhatsAppAudioSlipModalProps> = ({
  payload,
  language,
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

  const isHi = language === 'hi';
  const isHinglish = language === 'hinglish';
  const displayStaffName = isHi ? payload.staffNameHi : payload.staffName;
  const displayEntryLabel = isHi ? payload.entryTypeLabelHi : payload.entryTypeLabel;

  const hindiScript = buildHindiVoiceScript(payload);
  const whatsappText = buildWhatsAppShareText(payload);
  const whatsappUrl = `https://wa.me/${payload.phone}?text=${encodeURIComponent(whatsappText)}`;

  const handlePlayHindiAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechNotice('Playing voice transcript below:');
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
        setSpeechNotice('Speaking aloud for staff verification...');
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      setIsSpeaking(true);
      setSpeechNotice('Speaking aloud for staff verification...');
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
              <span>
                {isHi
                  ? 'स्टाफ हिसाब पर्ची'
                  : isHinglish
                  ? 'Staff Hisab Parchi'
                  : 'Staff Verification Slip'}
              </span>
            </p>
            <h2 id="receipt-modal-title" className="text-lg font-bold text-stone-900 mt-0.5">
              {displayStaffName}
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

        {/* Visual Slip in Active Language */}
        <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500 border-b border-stone-200 pb-2">
            <span>{isHi ? `तारीख: ${payload.dateStr}` : `Date: ${payload.dateStr}`}</span>
            <span>{isHi ? `दर्ज किया: ${payload.loggedBy}` : `Logged by ${payload.loggedBy}`}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-600">
                {isHi ? 'विवरण:' : isHinglish ? 'Entry:' : 'Entry Logged:'}
              </span>
              <span className="font-semibold text-stone-900">{displayEntryLabel}</span>
            </div>

            {payload.amountChanged !== undefined && payload.amountChanged > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">
                  {isHi ? 'राशि:' : isHinglish ? 'Rashi (Amount):' : 'Amount:'}
                </span>
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
              <span className="text-stone-600">
                {isHi
                  ? 'इस महीने छुट्टी:'
                  : isHinglish
                  ? 'Paid Chhutti Used:'
                  : 'Paid Leaves Used:'}
              </span>
              <span className="font-mono-num font-medium text-stone-900">
                {payload.paidLeavesUsed} / {payload.paidLeaveQuota}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-600">
                {isHi
                  ? 'कुल एडवांस:'
                  : isHinglish
                  ? 'Total Advance Taken:'
                  : 'Total Advance Taken:'}
              </span>
              <span className="font-mono-num font-medium text-amber-700">
                -₹{payload.totalBorrowedThisMonth.toLocaleString('en-IN')}
              </span>
            </div>

            {payload.activeEmiCut > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">
                  {isHi
                    ? 'मासिक किस्त कटौती:'
                    : isHinglish
                    ? 'Mahine Ki Loan EMI Cut:'
                    : 'Monthly Loan EMI Cut:'}
                </span>
                <span className="font-mono-num font-medium text-amber-700">
                  -₹{payload.activeEmiCut.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {payload.reimbursementsThisMonth > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-stone-600">
                  {isHi
                    ? 'घर के सामान का खर्च:'
                    : isHinglish
                    ? 'Ghar Saman Kharch (+Add):'
                    : 'Home Reimbursement:'}
                </span>
                <span className="font-mono-num font-medium text-emerald-700">
                  +₹{payload.reimbursementsThisMonth.toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-stone-900">
                {isHi
                  ? 'बाकी पगार (अब देना है)'
                  : isHinglish
                  ? 'Baki Pagar (Net Left to Pay)'
                  : 'Net Money Left to Give'}
              </p>
            </div>
            <span className="text-2xl font-mono-num font-bold text-emerald-700">
              ₹{payload.netPayableLeft.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Spoken Audio Script Box */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">
              {isHi ? 'वॉइस नोट स्क्रिप्ट' : 'Spoken Audio Script'}
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
            <span>
              {isHi
                ? 'स्टाफ को आवाज़ में सुनाएं'
                : isHinglish
                ? 'Staff Ko Audio Sunao'
                : 'Play Voice Note for Staff'}
            </span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-3 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-center"
          >
            <Share2 className="w-4 h-4" />
            <span>{isHi ? 'व्हाट्सएप पर भेजें' : 'Send on WhatsApp'}</span>
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

