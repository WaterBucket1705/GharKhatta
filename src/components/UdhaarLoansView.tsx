import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Share2,
  QrCode,
  PauseCircle,
  PlayCircle,
  X,
} from 'lucide-react';
import {
  BadaUdhaarLoan,
  CashBucketType,
  CashLedgerEntry,
  FamilyMember,
  ReceiptModalPayload,
  StaffMember,
} from '../types/khata';
import {
  calculateStaffFinancials,
  evaluateOverBorrowingRisk,
} from '../utils/mathEngine';
import { InfoPopupButton } from './InfoPopupButton';

interface UdhaarLoansViewProps {
  staffList: StaffMember[];
  selectedStaffId: string;
  onSelectStaffId: (id: string) => void;
  cashLedger: CashLedgerEntry[];
  loans: BadaUdhaarLoan[];
  activeMember: FamilyMember;
  currentDay: number;
  onAddCashEntry: (
    staffId: string,
    bucket: CashBucketType,
    amount: number,
    reason: string
  ) => void;
  onCreateBadaLoan: (
    staffId: string,
    principal: number,
    monthlyEmi: number,
    purpose: string
  ) => void;
  onTogglePauseLoanEmi: (loanId: string) => void;
  onSettleStaffMonth: (staffId: string) => void;
  onOpenReceiptModal: (payload: ReceiptModalPayload) => void;
}

export const UdhaarLoansView: React.FC<UdhaarLoansViewProps> = ({
  staffList,
  selectedStaffId,
  onSelectStaffId,
  cashLedger,
  loans,
  activeMember,
  currentDay,
  onAddCashEntry,
  onCreateBadaLoan,
  onTogglePauseLoanEmi,
  onSettleStaffMonth,
  onOpenReceiptModal,
}) => {
  const [activeBucketTab, setActiveBucketTab] = useState<
    'all' | 'chhota_advance' | 'bada_udhaar_loan' | 'reimbursement'
  >('all');
  const [entryBucket, setEntryBucket] = useState<CashBucketType>('chhota_advance');
  const [amountInput, setAmountInput] = useState<string>('1200');
  const [reasonInput, setReasonInput] = useState<string>('Gas cylinder & rashan cash');
  const [emiInput, setEmiInput] = useState<string>('1000');
  const [formError, setFormError] = useState<string>('');
  const [settlementStaffId, setSettlementStaffId] = useState<string | null>(null);

  const selectedStaff =
    staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  const fin = calculateStaffFinancials(selectedStaff, cashLedger, loans, currentDay);

  const numericAmount = parseFloat(amountInput) || 0;
  const riskAssessment =
    entryBucket === 'chhota_advance'
      ? evaluateOverBorrowingRisk(fin, numericAmount)
      : null;

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount || numericAmount <= 0) {
      setFormError('Please enter a valid rupee amount greater than ₹0.');
      return;
    }
    if (!reasonInput.trim()) {
      setFormError('Please enter a short note or reason for the ledger.');
      return;
    }
    setFormError('');

    if (entryBucket === 'bada_udhaar_loan') {
      const emiVal = parseFloat(emiInput) || Math.ceil(numericAmount / 6 / 100) * 100;
      onCreateBadaLoan(selectedStaff.id, numericAmount, emiVal, reasonInput.trim());
    } else {
      onAddCashEntry(selectedStaff.id, entryBucket, numericAmount, reasonInput.trim());
    }

    setAmountInput('');
    setReasonInput('');
  };

  const handleConvertExcessToThreeMonthLoan = () => {
    if (!numericAmount || numericAmount <= 0) return;
    const emi = Math.ceil(numericAmount / 3 / 50) * 50;
    onCreateBadaLoan(
      selectedStaff.id,
      numericAmount,
      emi,
      `${reasonInput.trim() || 'Advance'} (Converted to 3-Month EMI Loan)`
    );
    setAmountInput('');
  };

  const handleProceedRollOverAdvance = () => {
    if (!numericAmount || numericAmount <= 0) return;
    onAddCashEntry(
      selectedStaff.id,
      'chhota_advance',
      numericAmount,
      `${reasonInput.trim() || 'Advance'} (Roll-over approved)`
    );
    setAmountInput('');
  };

  const filteredLedger = cashLedger.filter((entry) => {
    if (activeBucketTab === 'all') return true;
    return entry.bucket === activeBucketTab;
  });

  const settlementStaff = settlementStaffId
    ? staffList.find((s) => s.id === settlementStaffId) || null
    : null;
  const settlementFin = settlementStaff
    ? calculateStaffFinancials(settlementStaff, cashLedger, loans, currentDay)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Staff Selector + 3-Bucket Info Popup */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            3-Bucket Udhaar & 1st-of-Month UPI Settlement
          </h2>
          <InfoPopupButton
            title="The 3-Bucket Household Cash Engine"
            subtitle="Zero Salary Confusion"
            description="GharKhata separates household staff cash flows into 3 distinct buckets so advances, long-term loans, and errands never get mixed up:"
            bullets={[
              '1. Chhota Advance: Mid-month cash borrowed (e.g. ₹500 for gas cylinder). Deducted 100% from this month’s remaining salary.',
              '2. Bada Udhaar Loan: Multi-month interest-free loan (e.g. ₹12,000 for school admission) with a fixed monthly auto-cut EMI.',
              '3. Home Reimbursement: Reverse Udhaar when staff spends from their own pocket (e.g. ₹350 for pots/khad). Added in green (+₹) to their salary.',
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {staffList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStaffId(s.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                s.id === selectedStaff.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-[#FAF8F5] text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Grid: Left = 3-Bucket Logger + Over-Borrowing Risk Guardrail | Right = Bada Udhaar Loan Progress Cards & Settlement */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: 3-Bucket Cash Logger */}
        <div className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <span className="text-xs font-medium text-stone-500">
                {selectedStaff.name} · By {activeMember}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Log Advance, Loan or Reimbursement
              </h3>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-stone-500">Earned ({currentDay}d)</span>
                <InfoPopupButton
                  title="Accrued Earnings & Over-Borrowing Guardrail"
                  formula={`Accrued Earned = (Base ₹${fin.baseSalary} ÷ 30) × ${currentDay} days - Leave/Task Cuts + OT/Bhatta`}
                  description={`Up to Day ${currentDay}, ${selectedStaff.name} has earned ₹${fin.accruedEarnedSoFar.toLocaleString('en-IN')}. If a proposed Chhota Advance pushes total borrowing above accrued earnings or reduces Net Left to Pay below ₹0, the Over-Borrowing Guardrail warns you immediately.`}
                />
              </div>
              <span className="text-base font-mono-num font-bold text-stone-900">
                ₹{fin.accruedEarnedSoFar.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Bucket Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEntryBucket('chhota_advance');
                setAmountInput('1200');
                setReasonInput('Gas cylinder refill cash');
              }}
              className={`p-3 rounded-xl border text-left transition-colors ${
                entryBucket === 'chhota_advance'
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : 'bg-[#FAF8F5] border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <p className="text-xs font-bold">1. Chhota Advance</p>
              <p className="text-[11px] text-stone-500 mt-0.5">-100% This Month</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryBucket('bada_udhaar_loan');
                setAmountInput('6000');
                setEmiInput('1000');
                setReasonInput('School admission interest-free loan');
              }}
              className={`p-3 rounded-xl border text-left transition-colors ${
                entryBucket === 'bada_udhaar_loan'
                  ? 'bg-amber-50 border-amber-500 text-amber-950'
                  : 'bg-[#FAF8F5] border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <p className="text-xs font-bold">2. Bada Udhaar</p>
              <p className="text-[11px] text-stone-500 mt-0.5">Multi-Month EMI</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setEntryBucket('reimbursement');
                setAmountInput('350');
                setReasonInput('Bought vermicompost & pots from pocket');
              }}
              className={`p-3 rounded-xl border text-left transition-colors ${
                entryBucket === 'reimbursement'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                  : 'bg-[#FAF8F5] border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <p className="text-xs font-bold">3. Reimbursement</p>
              <p className="text-[11px] text-stone-500 mt-0.5">+Add to Salary</p>
            </button>
          </div>

          <form onSubmit={handleQuickLogSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="udhaar-amount-input"
                  className="text-xs font-semibold text-stone-700 block mb-1"
                >
                  Amount (₹)
                </label>
                <input
                  id="udhaar-amount-input"
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {entryBucket === 'bada_udhaar_loan' ? (
                <div>
                  <label
                    htmlFor="udhaar-emi-input"
                    className="text-xs font-semibold text-stone-700 block mb-1"
                  >
                    Monthly Auto-Cut EMI (₹/mo)
                  </label>
                  <input
                    id="udhaar-emi-input"
                    type="number"
                    value={emiInput}
                    onChange={(e) => setEmiInput(e.target.value)}
                    placeholder="e.g. 1000"
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Quick Presets
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[300, 500, 1200, 2500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmountInput(String(preset))}
                        className="px-2.5 py-2 rounded-lg text-xs font-mono-num font-semibold bg-[#FAF8F5] hover:bg-stone-200 border border-stone-300 text-stone-800"
                      >
                        ₹{preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="udhaar-reason-input"
                className="text-xs font-semibold text-stone-700 block mb-1"
              >
                Reason / Purpose
              </label>
              <input
                id="udhaar-reason-input"
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Gas cylinder refill / Vermicompost & pots"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {formError && <p className="text-xs text-rose-600 font-semibold">{formError}</p>}

            {/* Live "Over-Borrowing Risk" Guardrail Banner */}
            {riskAssessment && riskAssessment.isRisk && (
              <div
                role="alert"
                data-testid="over-borrowing-warning"
                className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-rose-900">
                      Live Over-Borrowing Risk Guardrail Triggered
                    </p>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      <strong>{selectedStaff.name}</strong> earned{' '}
                      <strong className="font-mono-num">
                        ₹{riskAssessment.earnedSoFar.toLocaleString('en-IN')}
                      </strong>{' '}
                      so far and borrowed{' '}
                      <strong className="font-mono-num">
                        ₹{riskAssessment.alreadyBorrowed.toLocaleString('en-IN')}
                      </strong>
                      . Giving{' '}
                      <strong className="font-mono-num">
                        ₹{riskAssessment.proposedAdvance.toLocaleString('en-IN')}
                      </strong>{' '}
                      exceeds accrued earnings by{' '}
                      <strong className="font-mono-num">
                        ₹{riskAssessment.excessAmount.toLocaleString('en-IN')}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConvertExcessToThreeMonthLoan}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    Convert Excess into 3-Month EMI Loan (₹{riskAssessment.suggestedThreeMonthEmi}/mo)
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedRollOverAdvance}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-rose-800 border border-rose-300 hover:bg-rose-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    Proceed & Roll Over to Next Month
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                entryBucket === 'reimbursement'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-stone-900 hover:bg-stone-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {entryBucket === 'reimbursement'
                  ? `+₹${numericAmount || 0} Add to Salary (Reimbursement)`
                  : entryBucket === 'bada_udhaar_loan'
                  ? `Create ₹${numericAmount || 0} Multi-Month Loan`
                  : `Log -₹${numericAmount || 0} Chhota Advance for ${selectedStaff.name}`}
              </span>
            </button>
          </form>
        </div>

        {/* Right 6 Cols: Bada Udhaar Multi-Month EMI Loan Tracker Cards + 1st-of-Month Settlement */}
        <div className="lg:col-span-6 space-y-6">
          {/* Active Multi-Month Loans */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  Bada Udhaar (Multi-Month EMI Tracker)
                </h3>
                <InfoPopupButton
                  title="Bada Udhaar & Festival EMI Pause"
                  subtitle="Interest-Free Household Loans"
                  description="Tracks large multi-month advances (such as school fees or village medical loans). Each month's EMI is automatically deducted from salary unless you tap 'Pause EMI 1 Month' for a festival buffer."
                />
              </div>
            </div>

            <div className="space-y-3">
              {loans.map((loan) => {
                const staffMember = staffList.find((s) => s.id === loan.staffId);
                const paidSoFar = Math.max(0, loan.totalPrincipal - loan.balanceRemaining);
                const pctPaid = Math.min(
                  100,
                  Math.round((paidSoFar / Math.max(1, loan.totalPrincipal)) * 100)
                );
                const monthsLeft = Math.ceil(
                  loan.balanceRemaining / Math.max(1, loan.monthlyEmi)
                );

                return (
                  <div
                    key={loan.id}
                    className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-stone-900">
                          {staffMember?.name || loan.staffId} — {loan.purpose}
                        </p>
                        <p className="text-xs text-stone-500">
                          Started {loan.startDate} · {loan.loggedBy}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onTogglePauseLoanEmi(loan.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                          loan.pausedThisMonth
                            ? 'bg-amber-100 border-amber-400 text-amber-900'
                            : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {loan.pausedThisMonth ? (
                          <>
                            <PlayCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Festival Pause (₹0 Cut) · Resume</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                            <span>Pause EMI 1 Month</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-stone-500 block">Principal</span>
                        <span className="font-mono-num font-bold text-stone-900">
                          ₹{loan.totalPrincipal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Monthly EMI</span>
                        <span className="font-mono-num font-bold text-amber-700">
                          {loan.pausedThisMonth
                            ? '₹0 (Paused)'
                            : `-₹${loan.monthlyEmi.toLocaleString('en-IN')}/mo`}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Balance Left</span>
                        <span className="font-mono-num font-bold text-stone-900">
                          ₹{loan.balanceRemaining.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Months Left</span>
                        <span className="font-mono-num font-bold text-emerald-700">
                          {monthsLeft} mos
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-700 rounded-full transition-all"
                        style={{ width: `${pctPaid}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Click Month-End UPI Settlement Panel */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-stone-900">
                1st-of-Month UPI Settlement
              </h3>
              <InfoPopupButton
                title="1-Click Month-End UPI Settlement"
                description="Settles the net remaining salary via UPI, automatically deducts this month's active EMI from the Bada Udhaar loan balance, and generates a bilingual WhatsApp + spoken Hindi voice slip."
              />
            </div>

            <div className="space-y-2.5">
              {staffList.map((s) => {
                const sf = calculateStaffFinancials(s, cashLedger, loans, currentDay);
                return (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-stone-900">{s.name}</p>
                      <p className="text-xs text-stone-500 font-mono-num">
                        UPI: {s.kyc.upiId} · Net Left: ₹{sf.netPayableLeft.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {s.settledForMonth ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Paid & Settled</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSettlementStaffId(s.id)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Settle ₹{sf.netPayableLeft.toLocaleString('en-IN')}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 3-Bucket Cash Ledger Table with Filter Tabs */}
      <section
        aria-label="3-Bucket Cash Ledger History"
        className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-stone-900">
            Household Cash & Reimbursement Audit Ledger
          </h3>

          <div
            role="group"
            aria-label="Filter Cash Ledger by Bucket"
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-stone-100 rounded-xl"
          >
            {(
              [
                { id: 'all', label: 'All Entries' },
                { id: 'chhota_advance', label: 'Chhota Advance (-Deduct)' },
                { id: 'reimbursement', label: 'Home Purchase (+Add to Salary)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBucketTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeBucketTab === tab.id
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold">Staff Member</th>
                <th className="py-2.5 px-3 font-semibold">Bucket Type</th>
                <th className="py-2.5 px-3 font-semibold">Reason / Item</th>
                <th className="py-2.5 px-3 font-semibold">Audit Trail</th>
                <th className="py-2.5 px-3 font-semibold text-right">Salary Impact</th>
                <th className="py-2.5 px-3 font-semibold text-right">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLedger.map((entry) => {
                const st = staffList.find((s) => s.id === entry.staffId) || staffList[0];
                const stFin = calculateStaffFinancials(st, cashLedger, loans, currentDay);
                const isAdd = entry.bucket === 'reimbursement';
                return (
                  <tr key={entry.id} className="hover:bg-stone-50/80">
                    <td className="py-3 px-3 font-mono-num text-stone-600 whitespace-nowrap">
                      {entry.dateStr}
                    </td>
                    <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">
                      {st.name}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          isAdd ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isAdd
                          ? 'Home Reimbursement (+Add)'
                          : 'Chhota Advance (-Deduct)'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-700">{entry.reason}</td>
                    <td className="py-3 px-3 text-stone-500 whitespace-nowrap">
                      Added by {entry.loggedBy} · {entry.loggedAt}
                    </td>
                    <td
                      className={`py-3 px-3 font-mono-num font-bold text-right whitespace-nowrap ${
                        isAdd ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isAdd ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenReceiptModal({
                            staffName: st.name,
                            staffNameHi: st.nameHi,
                            phone: st.phone,
                            entryTypeLabel: isAdd ? 'Home Reimbursement' : 'Chhota Advance',
                            entryTypeLabelHi: isAdd ? 'घर सामान खर्च' : 'छोटा एडवांस',
                            dateStr: entry.dateStr,
                            amountChanged: entry.amount,
                            isAddition: isAdd,
                            paidLeavesUsed: stFin.paidLeavesUsed,
                            paidLeaveQuota: stFin.paidLeavesQuota,
                            totalBorrowedThisMonth: stFin.chhotaAdvanceTotal,
                            reimbursementsThisMonth: stFin.reimbursementsTotal,
                            activeEmiCut: stFin.activeLoanEmiCut,
                            netPayableLeft: stFin.netPayableLeft,
                            loggedBy: entry.loggedBy,
                          })
                        }
                        className="text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Hindi Slip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 1-Click Month-End UPI Settlement Modal */}
      {settlementStaff && settlementFin && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upi-settlement-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <p className="text-xs font-medium text-emerald-700">
                  1st-of-Month UPI Settlement & Payslip
                </p>
                <h3 id="upi-settlement-title" className="text-lg font-bold text-stone-900">
                  Settle {settlementStaff.name} ({settlementStaff.nameHi})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSettlementStaffId(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Base Salary:</span>
                <span className="font-mono-num font-semibold">
                  ₹{settlementFin.baseSalary.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Unpaid Leave & Task Cuts:</span>
                <span className="font-mono-num font-semibold text-rose-600">
                  -₹{(settlementFin.unpaidLeaveCut + settlementFin.partialTaskCut).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Overtime, Party Bhatta & Bonus:</span>
                <span className="font-mono-num font-semibold text-emerald-700">
                  +₹
                  {(
                    settlementFin.overtimePay +
                    settlementFin.partyBhattaPay +
                    settlementFin.zeroLeaveBonus
                  ).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Home Purchase Reimbursement:</span>
                <span className="font-mono-num font-semibold text-emerald-700">
                  +₹{settlementFin.reimbursementsTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Chhota Advance Taken:</span>
                <span className="font-mono-num font-semibold text-amber-700">
                  -₹{settlementFin.chhotaAdvanceTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Bada Udhaar Monthly EMI Cut:</span>
                <span className="font-mono-num font-semibold text-amber-700">
                  -₹{settlementFin.activeLoanEmiCut.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-stone-900 text-sm">Final UPI Payout:</span>
                <span className="text-xl font-mono-num font-bold text-emerald-700">
                  ₹{settlementFin.netPayableLeft.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  Verified UPI ID: <span className="font-mono-num">{settlementStaff.kyc.upiId}</span>
                </p>
                <p className="text-[11px] text-stone-500">
                  Carries forward remaining loan balance automatically
                </p>
              </div>
              <QrCode className="w-8 h-8 text-stone-700" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSettlementStaffId(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSettleStaffMonth(settlementStaff.id);
                  setSettlementStaffId(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Paid & Generate Hindi Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
