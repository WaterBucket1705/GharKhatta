import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Check,
  X,
  Calendar,
  Wallet,
  Shirt,
  ShieldCheck,
  Home,
  ArrowRight,
  UserCheck,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  FamilyMember,
  Language,
  ParsedHinglishCommand,
} from '../types/khata';
import { HINGLISH_DEMO_CHIPS } from '../data/initialData';
import { UI_TEXT } from '../i18n/translations';
import { parseHinglishCommandLocal } from '../utils/mathEngine';
import { PWAInstallButton } from './PWAInstallButton';
import { InfoPopupButton } from './InfoPopupButton';

export type ActiveTab = 'dashboard' | 'calendar' | 'udhaar' | 'dhobi_milk' | 'vault_colony';

export const TAB_TO_PATH: Record<ActiveTab, string> = {
  dashboard: '/',
  calendar: '/attendance',
  udhaar: '/udhaar',
  dhobi_milk: '/utilities',
  vault_colony: '/vault',
};

export function pathToTab(pathname: string): ActiveTab | null {
  const clean = pathname.replace(/\/+$/, '') || '/';
  switch (clean) {
    case '/':
      return 'dashboard';
    case '/attendance':
      return 'calendar';
    case '/udhaar':
      return 'udhaar';
    case '/utilities':
      return 'dhobi_milk';
    case '/vault':
      return 'vault_colony';
    default:
      return null;
  }
}

interface HeaderAndVoiceBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  activeMember: FamilyMember;
  setActiveMember: (member: FamilyMember) => void;
  onApplyParsedCommand: (cmd: ParsedHinglishCommand) => void;
  onResetDemoData: () => void;
  currentDay: number;
}

const FAMILY_MEMBERS: FamilyMember[] = ['Mummy (Priya)', 'Papa (Anurag)', 'Dadi'];

export const HeaderAndVoiceBar: React.FC<HeaderAndVoiceBarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  activeMember,
  setActiveMember,
  onApplyParsedCommand,
  onResetDemoData,
  currentDay,
}) => {
  const t = UI_TEXT[language];
  const [commandInput, setCommandInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [previewCommand, setPreviewCommand] = useState<ParsedHinglishCommand | null>(null);
  const [parserEngineLabel, setParserEngineLabel] = useState<string>('');
  const [voiceStatusMsg, setVoiceStatusMsg] = useState<string>('');
  const [showDemoChips, setShowDemoChips] = useState(false);

  const handleParseText = async (textToParse: string) => {
    const trimmed = textToParse.trim();
    if (!trimmed) return;
    setCommandInput(trimmed);
    setIsParsing(true);
    setVoiceStatusMsg('');

    try {
      const response = await fetch('/api/parse-hinglish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, currentDay }),
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewCommand(data.parsed);
        setParserEngineLabel(
          data.engine === 'gemini-4-argon-high-thinking'
            ? 'Parsed via Gemini High-Thinking Ledger Engine'
            : 'Parsed via Instant Hinglish Ledger Engine'
        );
      } else {
        const local = parseHinglishCommandLocal(trimmed, currentDay);
        setPreviewCommand(local);
        setParserEngineLabel('Parsed via Instant Hinglish Ledger Engine');
      }
    } catch {
      const local = parseHinglishCommandLocal(trimmed, currentDay);
      setPreviewCommand(local);
      setParserEngineLabel('Parsed via Instant Hinglish Ledger Engine');
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleMic = () => {
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setShowDemoChips(true);
      const sample = HINGLISH_DEMO_CHIPS[0].text;
      setVoiceStatusMsg('Browser mic unavailable in sandbox — loaded voice sample:');
      handleParseText(sample);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognitionAPI as any)();
      recognition.lang = 'hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceStatusMsg('Listening in Hindi / Hinglish... Speak now');
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        setIsListening(false);
        if (transcript) {
          setVoiceStatusMsg(`Heard: "${transcript}"`);
          handleParseText(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setShowDemoChips(true);
        setVoiceStatusMsg('Mic permission declined — tap any 1-click Demo Voice Chip below');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setShowDemoChips(true);
      handleParseText(HINGLISH_DEMO_CHIPS[0].text);
    }
  };

  const handleConfirmPreview = () => {
    if (!previewCommand) return;
    onApplyParsedCommand(previewCommand);
    setPreviewCommand(null);
    setCommandInput('');
    setShowDemoChips(false);
  };

  const navItems: {
    id: ActiveTab;
    path: string;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'dashboard', path: '/', label: t.navDashboard, shortLabel: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'calendar', path: '/attendance', label: t.navCalendar, shortLabel: 'Attendance', icon: <Calendar className="w-4 h-4" /> },
    { id: 'udhaar', path: '/udhaar', label: t.navUdhaar, shortLabel: 'Udhaar', icon: <Wallet className="w-4 h-4" /> },
    { id: 'dhobi_milk', path: '/utilities', label: t.navDhobiMilk, shortLabel: 'Utilities', icon: <Shirt className="w-4 h-4" /> },
    { id: 'vault_colony', path: '/vault', label: t.navVaultColony, shortLabel: 'ID Vault', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Top Bar Contract: Zone 1 Brand Wordmark | Zone 2 Single-line Route Links | Zone 3 1 Primary CTA */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-14">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
          >
            {t.appName}
          </a>

          <nav
            aria-label="Primary Page Navigation"
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-stone-600"
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.path}
                aria-current={activeTab === item.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                }}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  activeTab === item.id
                    ? 'border-emerald-700 text-emerald-800 font-semibold'
                    : 'border-transparent text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowDemoChips((prev) => !prev);
                const inputEl = document.getElementById('bol-ke-likho-input');
                if (inputEl) inputEl.focus();
                handleToggleMic();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 min-h-[38px]"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Bol Ke Likho</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Family Sync & Language Switcher + Compact "Bol Ke Likho" Voice Command Bar */}
      <section
        aria-label="Family Sync, Language, and Voice Command Bar"
        className="bg-white border-b border-stone-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 space-y-2.5">
          {/* Row 1: Family Member Sync Switcher + Language Switcher + Info Tooltip */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="family-member-select"
                className="text-xs font-medium text-stone-600 flex items-center gap-1.5 whitespace-nowrap"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Logged in as:</span>
              </label>

              <select
                id="family-member-select"
                aria-label="Logged in as Family Member"
                value={activeMember}
                onChange={(e) => setActiveMember(e.target.value as FamilyMember)}
                className="px-3 py-1.5 min-h-[36px] text-xs font-semibold bg-[#FAF8F5] border border-stone-300 rounded-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              >
                {FAMILY_MEMBERS.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>

              <InfoPopupButton
                title="Family Member Audit & Sync"
                subtitle="Prevent Double-Borrowing"
                description="Every attendance mark, cash advance, reimbursement, or dhobi entry automatically stamps which family member recorded it and at what time."
                bullets={[
                  'Prevents staff from taking ₹500 from Mummy in the morning and ₹500 from Papa in the evening without the household knowing.',
                  'All entries are automatically saved to your device storage (LocalStorage) for instant offline access.',
                ]}
              />
            </div>

            {/* Language Switcher + PWA Install Button + Reset Demo Data */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onResetDemoData}
                className="px-3 py-1.5 min-h-[34px] rounded-lg bg-[#FAF8F5] hover:bg-rose-50 border border-stone-300 hover:border-rose-300 text-stone-700 hover:text-rose-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Reset Demo Data
              </button>
              <PWAInstallButton />
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-400" />
                <div
                  role="group"
                  aria-label="Language Switcher"
                  className="inline-flex items-center gap-1 p-0.5 bg-stone-100 rounded-lg"
                >
                  {(
                    [
                      { code: 'en', label: 'English' },
                      { code: 'hinglish', label: 'Hinglish' },
                      { code: 'hi', label: 'हिंदी' },
                    ] as const
                  ).map((langObj) => (
                    <button
                      key={langObj.code}
                      type="button"
                      onClick={() => setLanguage(langObj.code)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        language === langObj.code
                          ? 'bg-stone-900 text-white font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {langObj.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Compact "Bol Ke Likho" Voice & Text Parser + Toggleable Demo Chips */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <label htmlFor="bol-ke-likho-input" className="sr-only">
                  {t.bolKeLikhoTitle}
                </label>
                <input
                  id="bol-ke-likho-input"
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleParseText(commandInput);
                  }}
                  placeholder={t.bolKeLikhoPlaceholder}
                  className="w-full pl-3.5 pr-10 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                />
                {commandInput && (
                  <button
                    type="button"
                    aria-label="Clear command input"
                    onClick={() => {
                      setCommandInput('');
                      setPreviewCommand(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  aria-label="Record Hinglish Voice Command"
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                    isListening
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>{isListening ? 'Stop' : 'Mic'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleParseText(commandInput)}
                  disabled={!commandInput.trim() || isParsing}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isParsing ? 'Parsing...' : 'Parse Entry'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDemoChips((prev) => !prev)}
                  aria-expanded={showDemoChips}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 border border-stone-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  <span>Voice Examples</span>
                  {showDemoChips ? (
                    <ChevronUp className="w-3.5 h-3.5 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  )}
                </button>
              </div>
            </div>

            {voiceStatusMsg && (
              <p className="text-xs text-emerald-800 font-medium">{voiceStatusMsg}</p>
            )}

            {/* Toggleable 5 Realistic 1-Tap Hinglish Demo Voice Chips */}
            {showDemoChips && (
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200">
                <span className="text-xs font-semibold text-stone-500 whitespace-nowrap shrink-0 mr-1">
                  Tap a sample Hinglish voice command:
                </span>
                {HINGLISH_DEMO_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleParseText(chip.text)}
                    className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-emerald-50 hover:border-emerald-600 text-stone-700 hover:text-emerald-900 border border-stone-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                  >
                    <span>"{chip.label}"</span>
                    <ArrowRight className="w-3 h-3 text-stone-400" />
                  </button>
                ))}
              </div>
            )}

            {/* Confirmation Preview Card */}
            {previewCommand && (
              <div
                role="region"
                aria-label="AI Parsed Ledger Confirmation Preview"
                className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-900">
                    <span className="font-semibold">Confirmation Preview: {previewCommand.workerName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Date: {previewCommand.day} Nov 2026</span>
                    <span aria-hidden="true">·</span>
                    <span>Logged by {activeMember}</span>
                    {parserEngineLabel && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700">{parserEngineLabel}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-bold text-stone-900">{previewCommand.summaryEn}</p>
                  <p className="text-xs text-stone-700">
                    {previewCommand.summaryHi} ·{' '}
                    <span className="font-mono-num font-semibold text-emerald-800">
                      {previewCommand.salaryImpactText}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewCommand(null)}
                    className="px-3 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 whitespace-nowrap shrink-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPreview}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Apply to Khata</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Bottom Navigation Bar (Multi-Page Router Tabs) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 grid grid-cols-5 items-center h-14 px-1"
      >
        {navItems.map((item) => (
          <a
            key={item.id}
            href={item.path}
            aria-label={item.label}
            aria-current={activeTab === item.id ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(item.id);
            }}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              activeTab === item.id ? 'text-emerald-700 font-semibold' : 'text-stone-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
              {item.shortLabel}
            </span>
          </a>
        ))}
      </nav>
    </>
  );
};
