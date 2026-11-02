import React, { useState } from 'react';
import {
  Keyboard,
  Sparkles,
  Check,
  X,
  Calendar,
  Wallet,
  Shirt,
  ShieldCheck,
  Home,
  UserCheck,
  Globe,
  Pencil,
  Plus,
  Trash2,
  Moon,
  Sun,
} from 'lucide-react';
import {
  FamilyMember,
  Language,
  ParsedHinglishCommand,
} from '../types/khata';
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

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = ['My Profile'];

interface HeaderAndVoiceBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  activeMember: FamilyMember;
  setActiveMember: (member: FamilyMember) => void;
  familyMembers: FamilyMember[];
  onRenameActiveMember: (oldName: FamilyMember, newName: FamilyMember) => void;
  onAddFamilyMember: (newName: FamilyMember) => void;
  onDeleteFamilyMember: (nameToDelete: FamilyMember) => void;
  onApplyParsedCommand: (cmd: ParsedHinglishCommand) => void;
  currentDay: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const HeaderAndVoiceBar: React.FC<HeaderAndVoiceBarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  activeMember,
  setActiveMember,
  familyMembers,
  onRenameActiveMember,
  onAddFamilyMember,
  onDeleteFamilyMember,
  onApplyParsedCommand,
  currentDay,
  darkMode,
  onToggleDarkMode,
}) => {
  const t = UI_TEXT[language];
  const [commandInput, setCommandInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [previewCommand, setPreviewCommand] = useState<ParsedHinglishCommand | null>(null);
  const [parserEngineLabel, setParserEngineLabel] = useState<string>('');

  // Edit Own Name & Family Members Modal State
  const [showNameModal, setShowNameModal] = useState(false);
  const [renameInput, setRenameInput] = useState(activeMember);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [nameError, setNameError] = useState('');

  const openEditNameModal = () => {
    setRenameInput(activeMember);
    setNewMemberInput('');
    setNameError('');
    setShowNameModal(true);
  };

  const handleSaveOwnName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = renameInput.trim();
    if (!trimmed) {
      setNameError('Please enter a valid name.');
      return;
    }
    setNameError('');
    onRenameActiveMember(activeMember, trimmed);
    setShowNameModal(false);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemberInput.trim();
    if (!trimmed) {
      setNameError('Please enter a name to add.');
      return;
    }
    setNameError('');
    onAddFamilyMember(trimmed);
    setRenameInput(trimmed);
    setNewMemberInput('');
  };

  const handleParseText = async (textToParse: string) => {
    const trimmed = textToParse.trim();
    if (!trimmed) return;
    setCommandInput(trimmed);
    setIsParsing(true);

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
            ? 'Understood via Gemini High-Thinking Ledger Engine'
            : 'Understood via Instant Hinglish Ledger Engine'
        );
      } else {
        const local = parseHinglishCommandLocal(trimmed, currentDay);
        setPreviewCommand(local);
        setParserEngineLabel('Understood via Instant Hinglish Ledger Engine');
      }
    } catch {
      const local = parseHinglishCommandLocal(trimmed, currentDay);
      setPreviewCommand(local);
      setParserEngineLabel('Understood via Instant Hinglish Ledger Engine');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmPreview = () => {
    if (!previewCommand) return;
    onApplyParsedCommand(previewCommand);
    setPreviewCommand(null);
    setCommandInput('');
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
                const inputEl = document.getElementById('bol-ke-likho-input');
                if (inputEl) inputEl.focus();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 min-h-[38px]"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Bol Ke Likho</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Family Sync & Language Switcher + Compact "Bol Ke Likho" Keyboard Dictation Bar */}
      <section
        aria-label="Family Sync, Language, and Quick Text Entry Bar"
        className="bg-white border-b border-stone-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 space-y-2.5">
          {/* Row 1: Family Member Sync Switcher + Edit My Name + Language Switcher */}
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
                {familyMembers.map((member) => (
                  <option key={member} value={member}>
                    {member}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={openEditNameModal}
                aria-label="Edit My Name or Manage Family Members"
                className="px-2.5 py-1.5 min-h-[34px] rounded-lg bg-[#FAF8F5] hover:bg-emerald-50 border border-stone-300 hover:border-emerald-300 text-stone-700 hover:text-emerald-800 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                <span>Edit My Name</span>
              </button>

              <InfoPopupButton
                title="Family Member Audit & Sync"
                subtitle="Prevent Double-Borrowing"
                description="Every attendance mark, cash advance, reimbursement, or dhobi entry automatically stamps which family member recorded it and at what time."
                bullets={[
                  'Tap "Edit My Name" to customize your own name or add/remove family members.',
                  'Prevents staff from borrowing cash from two family members in the same week without the household knowing.',
                ]}
              />
            </div>

            {/* Dark Mode Toggle + Language Switcher + PWA Install Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onToggleDarkMode}
                aria-label="Toggle Dark Mode"
                aria-pressed={darkMode}
                className="px-3 py-1.5 min-h-[34px] rounded-lg bg-[#FAF8F5] hover:bg-stone-100 border border-stone-300 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Dark Mode</span>
                  </>
                )}
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

          {/* Row 2: Keyboard Dictation Recommendation + Smart Hinglish/Hindi Text Parser */}
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
                  onClick={() => handleParseText(commandInput)}
                  disabled={!commandInput.trim() || isParsing}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isParsing ? 'Understanding...' : 'Understand & Log Text'}</span>
                </button>
              </div>
            </div>

            {/* Keyboard Mic Recommendation Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600 px-1">
              <p className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  <strong className="font-semibold text-stone-800">Tip:</strong> Tap the text box above and use the{' '}
                  <strong className="font-semibold text-emerald-800">Mic icon on your phone keyboard</strong> to speak in Hindi, Hinglish, or English — GharKhata will automatically understand the text!
                </span>
              </p>
              <InfoPopupButton
                title="How to Speak Using Your Keyboard Mic"
                subtitle="Works on iPhone & Android Without App Permissions"
                description="Instead of a browser microphone, use your phone keyboard's built-in voice dictation for instant, accurate Hindi, Hinglish, and English speech-to-text:"
                bullets={[
                  '1. Tap inside the "Bol Ke Likho" text box above so your phone keyboard opens.',
                  '2. Tap the Microphone icon on your keyboard (bottom-right on iPhone or top-right on Android Gboard) and speak naturally.',
                  '3. Tap "Understand & Log Text" (or press Enter) — GharKhata automatically extracts the staff name, attendance, advance amount, or dhobi/milk update.',
                ]}
              />
            </div>

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
                  <p className="text-sm font-bold text-stone-900">
                    {language === 'hi' ? previewCommand.summaryHi : previewCommand.summaryEn}
                  </p>
                  <p className="text-xs font-mono-num font-semibold text-emerald-800">
                    {previewCommand.salaryImpactText}
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

      {/* Edit Own Name & Manage Family Members Modal */}
      {showNameModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-own-name-title"
          onClick={() => setShowNameModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Profile & Family Sync Settings
                </p>
                <h3 id="edit-own-name-title" className="text-lg font-bold text-stone-900">
                  Change Your Name & Family Profiles
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Name Settings Modal"
                onClick={() => setShowNameModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Rename Current Active User */}
            <form onSubmit={handleSaveOwnName} className="space-y-3">
              <label
                htmlFor="rename-own-name-input"
                className="text-xs font-semibold text-stone-700 block"
              >
                Your Active Display Name (Currently: {activeMember})
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="rename-own-name-input"
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="e.g. Aditi Sharma / Mummy (Priya)"
                  className="flex-1 px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                >
                  Save My Name
                </button>
              </div>
            </form>

            {/* 2. Manage Household Family Members List */}
            <div className="space-y-2.5 pt-3 border-t border-stone-100">
              <span className="text-xs font-semibold text-stone-700 block">
                Household Family Members ({familyMembers.length})
              </span>

              <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {familyMembers.map((member) => {
                  const isCurrent = member === activeMember;
                  return (
                    <div
                      key={member}
                      className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMember(member);
                          setRenameInput(member);
                        }}
                        className="font-semibold text-stone-900 hover:text-emerald-800 text-left flex items-center gap-2"
                      >
                        <span>{member}</span>
                        {isCurrent && (
                          <span className="text-[11px] font-medium text-emerald-700">
                            (Active)
                          </span>
                        )}
                      </button>

                      {familyMembers.length > 1 && (
                        <button
                          type="button"
                          aria-label={`Delete family member ${member}`}
                          onClick={() => onDeleteFamilyMember(member)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add New Family Member */}
              <form onSubmit={handleAddMemberSubmit} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  aria-label="New Family Member Name"
                  value={newMemberInput}
                  onChange={(e) => setNewMemberInput(e.target.value)}
                  placeholder="Add another family member (e.g. Rohan / Nani)"
                  className="flex-1 px-3.5 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </form>
            </div>

            {nameError && (
              <p className="text-xs text-rose-600 font-semibold">{nameError}</p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowNameModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
