import React, { useState } from 'react';
import {
  CheckCircle2,
  Calendar,
  Wallet,
  Share2,
  Plus,
  Shirt,
  Milk,
  UserPlus,
  X,
} from 'lucide-react';
import {
  BadaUdhaarLoan,
  CashLedgerEntry,
  DhobiBatch,
  FamilyMember,
  Language,
  MilkConfig,
  ReceiptModalPayload,
  StaffMember,
  WorkerModelType,
} from '../types/khata';
import {
  calculateDhobiSummary,
  calculateMilkSummary,
  calculateStaffFinancials,
} from '../utils/mathEngine';
import { UI_TEXT } from '../i18n/translations';
import { ActiveTab } from './HeaderAndVoiceBar';

interface DashboardViewProps {
  staffList: StaffMember[];
  cashLedger: CashLedgerEntry[];
  loans: BadaUdhaarLoan[];
  dhobiBatches: DhobiBatch[];
  milkConfig: MilkConfig;
  language: Language;
  activeMember: FamilyMember;
  currentDay: number;
  onMarkAllPresentToday: () => void;
  onQuickMarkAttendance: (
    staffId: string,
    status: 'present' | 'absent' | 'half_day',
    partyBhatta?: number
  ) => void;
  onSelectStaffForCalendar: (staffId: string) => void;
  onSelectStaffForUdhaar: (staffId: string) => void;
  onOpenReceiptModal: (payload: ReceiptModalPayload) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onAddNewStaff: (newStaff: StaffMember) => void;
  onResetDemoData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  staffList,
  cashLedger,
  loans,
  dhobiBatches,
  milkConfig,
  language,
  activeMember,
  currentDay,
  onMarkAllPresentToday,
  onQuickMarkAttendance,
  onSelectStaffForCalendar,
  onSelectStaffForUdhaar,
  onOpenReceiptModal,
  onNavigateTab,
  onAddNewStaff,
  onResetDemoData,
}) => {
  const t = UI_TEXT[language];

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffNameHi, setNewStaffNameHi] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Baby Nanny & Evening Helper');
  const [newStaffSalary, setNewStaffSalary] = useState('6000');
  const [newStaffModel, setNewStaffModel] = useState<WorkerModelType>('fixed_monthly');
  const [newStaffLeaves, setNewStaffLeaves] = useState('2');
  const [newStaffPhone, setNewStaffPhone] = useState('919811009988');
  const [addStaffError, setAddStaffError] = useState('');

  const staffBreakdowns = staffList.map((staff) => ({
    staff,
    fin: calculateStaffFinancials(staff, cashLedger, loans, currentDay),
  }));

  const totalNetPayoutLeft = staffBreakdowns.reduce(
    (sum, item) => sum + (item.staff.settledForMonth ? 0 : item.fin.netPayableLeft),
    0
  );
  const totalBasePayroll = staffBreakdowns.reduce((sum, item) => sum + item.fin.baseSalary, 0);
  const totalAdvancesAndEmiThisMonth = staffBreakdowns.reduce(
    (sum, item) => sum + item.fin.chhotaAdvanceTotal + item.fin.activeLoanEmiCut,
    0
  );
  const totalReimbursementsThisMonth = staffBreakdowns.reduce(
    (sum, item) => sum + item.fin.reimbursementsTotal,
    0
  );

  const dhobiSummary = calculateDhobiSummary(dhobiBatches);
  const milkSummary = calculateMilkSummary(milkConfig, 30);

  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newStaffName.trim();
    const numericSal = parseInt(newStaffSalary, 10) || 0;
    if (!trimmedName) {
      setAddStaffError('Please enter the staff member name.');
      return;
    }
    if (numericSal <= 0) {
      setAddStaffError('Please enter a valid monthly base salary greater than ₹0.');
      return;
    }
    setAddStaffError('');

    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name: trimmedName,
      nameHi: newStaffNameHi.trim() || trimmedName,
      role: newStaffRole.trim() || 'Household Helper',
      roleHi: newStaffRole.trim() || 'घरेलू सहायक',
      phone: newStaffPhone.trim() || '919800000000',
      modelType: newStaffModel,
      baseSalary: numericSal,
      paidLeaveQuota: parseInt(newStaffLeaves, 10) || 2,
      zeroLeaveBonusEnabled: true,
      zeroLeaveBonusAmount: 200,
      standardVisitHours: newStaffModel === 'hourly_visit' ? 3 : undefined,
      hourlyOvertimeRate: 120,
      tasks: [
        {
          id: 'task-1',
          labelEn: 'Morning Primary Duty',
          labelHi: 'सुबह का मुख्य काम',
          skipPenalty: 50,
        },
        {
          id: 'task-2',
          labelEn: 'Evening Duty / Utensils',
          labelHi: 'शाम का काम',
          skipPenalty: 50,
        },
      ],
      attendance: {},
      kyc: {
        maskedAadhaar: 'XXXX-XXXX-7741',
        homeVillage: 'Verified Local Resident',
        emergencyContact: `+${newStaffPhone.trim() || '91 98110 09988'}`,
        policeVerified: true,
        policeVerificationId: `DEL-RWA-2026-${Math.floor(100 + Math.random() * 899)}`,
        neighborReference: `Referred by ${activeMember}`,
        upiId: `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@okaxis`,
        joinedSince: 'November 2026',
      },
    };

    onAddNewStaff(created);
    setNewStaffName('');
    setNewStaffNameHi('');
    setShowAddStaffModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Month-at-a-Glance Hero */}
      <section aria-label="November Household Financial Overview" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-stone-500">
              November 2026 Household Ledger · Day {currentDay} of 30 · Synced with {activeMember} · 100% Free Unlimited Staff
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mt-0.5">
              {t.appSubtitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2.5 min-h-[42px] text-xs font-semibold bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>+ Add Unlimited Staff</span>
            </button>

            <button
              type="button"
              onClick={onMarkAllPresentToday}
              className="px-4 py-2.5 min-h-[42px] text-xs font-semibold bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.markAllPresent} ({currentDay} Nov)</span>
            </button>
          </div>
        </div>

        {/* 4-Column KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-xs font-medium text-stone-500">{t.netPayoutLeftHero}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono-num font-bold text-emerald-700">
                ₹{totalNetPayoutLeft.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-mono-num text-stone-500">
                of ₹{totalBasePayroll.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Includes +₹{totalReimbursementsThisMonth} staff pocket reimbursements
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('udhaar')}
            className="bg-white border border-stone-200 hover:border-amber-500 rounded-2xl p-5 text-left transition-colors flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-stone-500">{t.totalAdvancesHero}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono-num font-bold text-amber-700">
                -₹{totalAdvancesAndEmiThisMonth.toLocaleString('en-IN')}
              </span>
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-stone-500 mt-2">
              Chhota Advances + Auto-cut Bada Udhaar EMIs →
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dhobi_milk')}
            className="bg-white border border-stone-200 hover:border-rose-400 rounded-2xl p-5 text-left transition-colors flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-stone-500">{t.pendingDhobiHero}</span>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span
                className={`text-2xl sm:text-3xl font-mono-num font-bold whitespace-nowrap ${
                  dhobiSummary.pendingPiecesCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {dhobiSummary.pendingPiecesCount} Pending
              </span>
              <Shirt className="w-4 h-4 text-rose-600 shrink-0" />
            </div>
            <p className="text-xs text-rose-700 font-medium mt-2 truncate">
              {dhobiSummary.pendingBreakdownText}
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dhobi_milk')}
            className="bg-white border border-stone-200 hover:border-emerald-600 rounded-2xl p-5 text-left transition-colors flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-stone-500">{t.milkBillHero}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono-num font-bold text-stone-900">
                ₹{milkSummary.grandTotal.toLocaleString('en-IN')}
              </span>
              <Milk className="w-4 h-4 text-emerald-700" />
            </div>
            <p className="text-xs text-stone-500 mt-2">
              {milkSummary.totalLiters}L Milk · {milkSummary.pausedDays}d Paused · +₹
              {milkSummary.sideItemsTotal} Dairy
            </p>
          </button>
        </div>
      </section>

      {/* Today's Quick Attendance Strip */}
      <section
        aria-label="Today Quick Attendance Strip"
        className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Today's Quick Attendance Strip ({currentDay} Nov 2026)
            </h2>
            <p className="text-xs text-stone-500">
              Auto-Present default is active. Only tap an exception if someone is absent, half-day, or did guest party work.
            </p>
          </div>
          <span className="text-xs text-stone-500">
            Audit Stamp: {activeMember}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
          {staffBreakdowns.map(({ staff }) => {
            const todayRecord = staff.attendance[currentDay];
            const currentStatus = todayRecord?.status || 'present';
            return (
              <div
                key={staff.id}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-stone-900">{staff.name}</p>
                    <p className="text-xs text-stone-500">{staff.roleHi}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      currentStatus === 'absent'
                        ? 'text-rose-600'
                        : currentStatus === 'half_day' || currentStatus === 'partial_skip'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {currentStatus === 'present'
                      ? 'Present'
                      : currentStatus === 'absent'
                      ? 'Absent'
                      : currentStatus === 'half_day'
                      ? 'Half-Day'
                      : 'Exception'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onQuickMarkAttendance(staff.id, 'present')}
                    className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      currentStatus === 'present'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickMarkAttendance(staff.id, 'absent')}
                    className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      currentStatus === 'absent'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-stone-300 text-stone-700 hover:bg-rose-50'
                    }`}
                  >
                    Absent
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickMarkAttendance(staff.id, 'half_day')}
                    className={`px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      currentStatus === 'half_day'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-stone-300 text-stone-700 hover:bg-amber-50'
                    }`}
                  >
                    Half-Day
                  </button>
                  <button
                    type="button"
                    onClick={() => onQuickMarkAttendance(staff.id, 'present', 200)}
                    className="px-2.5 py-1.5 min-h-[36px] rounded-lg text-xs font-medium bg-white border border-stone-300 text-emerald-800 hover:bg-emerald-50 transition-colors whitespace-nowrap shrink-0"
                  >
                    +₹200 Party Bhatta
                  </button>
                </div>

                {todayRecord && (
                  <p className="text-[11px] text-stone-500">
                    Added by {todayRecord.loggedBy} · {todayRecord.loggedAt}
                    {todayRecord.partyBhatta ? ` · +₹${todayRecord.partyBhatta} Party Bhatta` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Pre-Loaded + Unlimited Staff Cards with Live "Money Left to Give" Engine */}
      <section aria-label="Household Staff Cards" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-stone-900">
            Household Staff Ledger & Live "Money Left to Give" ({staffList.length} Active Staff)
          </h2>
          <span className="text-xs text-stone-500">
            Formula: Base - Unpaid Leave/Task Cut + OT/Bhatta + Reimbursement - Advance - Loan EMI
          </span>
        </div>

        {staffBreakdowns.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Your Household Khata is Currently Empty
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Add your own household maid, cook, mali, or driver profiles for free, or restore the 4 pre-loaded demo profiles at any time.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
              >
                + Add First Household Staff Profile
              </button>
              <button
                type="button"
                onClick={onResetDemoData}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 transition-colors"
              >
                Restore 4 Demo Staff Profiles
              </button>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {staffBreakdowns.map(({ staff, fin }) => {
            const pctRemaining = Math.max(
              0,
              Math.min(100, Math.round((fin.netPayableLeft / Math.max(1, fin.baseSalary)) * 100))
            );
            const latestLedger = cashLedger
              .filter((e) => e.staffId === staff.id)
              .slice(-1)[0];

            return (
              <article
                key={staff.id}
                className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col justify-between space-y-5"
              >
                {/* Top Identity & Net Left to Pay */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                        <span>
                          {staff.modelType === 'fixed_monthly'
                            ? 'Model 1: Fixed Monthly + Paid Leave Buffer'
                            : 'Model 2: Weekly Visit & Hourly Overtime'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{staff.kyc.neighborReference.split('(')[0]}</span>
                      </div>
                      <h3 className="text-xl font-bold text-stone-900 mt-0.5">
                        {staff.name}{' '}
                        <span className="text-sm font-medium text-stone-500">
                          ({staff.nameHi})
                        </span>
                      </h3>
                      <p className="text-xs text-stone-600">{staff.role}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-stone-500 block">
                        {t.netLeftToGive}
                      </span>
                      <span
                        data-testid={`net-payable-${staff.id}`}
                        className={`text-2xl font-mono-num font-bold ${
                          staff.settledForMonth
                            ? 'text-stone-400 line-through'
                            : fin.netPayableLeft < 0
                            ? 'text-rose-600'
                            : 'text-emerald-700'
                        }`}
                      >
                        ₹{fin.netPayableLeft.toLocaleString('en-IN')}
                      </span>
                      {staff.settledForMonth && (
                        <span className="block text-[11px] font-semibold text-emerald-700">
                          Settled via UPI ({staff.settledDate})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Live Visual Progress Bar for Net Money Left to Give */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>
                        Accrued Earned So Far ({currentDay}d):{' '}
                        <strong className="font-mono-num text-stone-900">
                          ₹{fin.accruedEarnedSoFar.toLocaleString('en-IN')}
                        </strong>
                      </span>
                      <span className="font-mono-num">{pctRemaining}% of Base Remaining</span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 rounded-full ${
                          fin.netPayableLeft < 0
                            ? 'bg-rose-600'
                            : pctRemaining < 35
                            ? 'bg-amber-600'
                            : 'bg-emerald-700'
                        }`}
                        style={{ width: `${Math.max(6, pctRemaining)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Itemized 3-Bucket & Attendance Math Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-xs">
                  <div>
                    <span className="text-stone-500 block">{t.baseSalary}</span>
                    <span className="font-mono-num font-semibold text-stone-900 text-sm">
                      ₹{fin.baseSalary.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 block">
                      {staff.modelType === 'fixed_monthly' ? t.paidLeavesUsed : 'Overtime Hours'}
                    </span>
                    {staff.modelType === 'fixed_monthly' ? (
                      <span
                        className={`font-mono-num font-semibold text-sm ${
                          fin.unpaidLeaveCut > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {fin.paidLeavesUsed}/{fin.paidLeavesQuota} Used{' '}
                        {fin.unpaidLeaveCut > 0 ? `(-₹${fin.unpaidLeaveCut})` : '(₹0 Cut)'}
                      </span>
                    ) : (
                      <span className="font-mono-num font-semibold text-emerald-700 text-sm">
                        +{fin.overtimeHoursTotal}h (+₹{fin.overtimePay})
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-stone-500 block">OT / Bhatta / Bonus</span>
                    <span className="font-mono-num font-semibold text-emerald-700 text-sm">
                      +₹
                      {(
                        fin.overtimePay +
                        fin.partyBhattaPay +
                        fin.zeroLeaveBonus
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Chhota Advance</span>
                    <span className="font-mono-num font-semibold text-amber-700 text-sm">
                      -₹{fin.chhotaAdvanceTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Bada Udhaar EMI</span>
                    <span className="font-mono-num font-semibold text-amber-700 text-sm">
                      -₹{fin.activeLoanEmiCut.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Reimbursement (+Add)</span>
                    <span className="font-mono-num font-semibold text-emerald-700 text-sm">
                      +₹{fin.reimbursementsTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Audit Trail & Task Partial Skip Note */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                  {latestLedger ? (
                    <span>
                      Latest Cash Log:{' '}
                      <strong className="text-stone-800">
                        {latestLedger.bucket === 'reimbursement' ? '+' : '-'}₹{latestLedger.amount}{' '}
                        ({latestLedger.reason})
                      </strong>{' '}
                      · Added by {latestLedger.loggedBy} · {latestLedger.loggedAt}
                    </span>
                  ) : (
                    <span>
                      Paid Leave Buffer:{' '}
                      <strong className="text-emerald-800">
                        {fin.paidLeavesUsed} of {fin.paidLeavesQuota} used
                      </strong>{' '}
                      {fin.zeroLeaveBonus > 0
                        ? `· +₹${fin.zeroLeaveBonus} Zero-Leave Bonus Active`
                        : ''}
                    </span>
                  )}
                  {fin.partialTaskCut > 0 && (
                    <span className="text-rose-600 font-medium">
                      · Task Partial Skip: -₹{fin.partialTaskCut}
                    </span>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectStaffForCalendar(staff.id)}
                    className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {staff.modelType === 'hourly_visit'
                        ? 'Hours & Garden Tasks'
                        : 'Attendance & Tasks'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectStaffForUdhaar(staff.id)}
                    className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                    <span>Log Advance / Kharch</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onOpenReceiptModal({
                        staffName: staff.name,
                        staffNameHi: staff.nameHi,
                        phone: staff.phone,
                        entryTypeLabel: 'Monthly Hisab Summary',
                        entryTypeLabelHi: 'नवंबर हिसाब पर्ची',
                        dateStr: `${currentDay} Nov 2026`,
                        paidLeavesUsed: fin.paidLeavesUsed,
                        paidLeaveQuota: fin.paidLeavesQuota,
                        totalBorrowedThisMonth: fin.chhotaAdvanceTotal,
                        reimbursementsThisMonth: fin.reimbursementsTotal,
                        activeEmiCut: fin.activeLoanEmiCut,
                        netPayableLeft: fin.netPayableLeft,
                        loggedBy: activeMember,
                      })
                    }
                    className="ml-auto px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{t.sendWhatsAppHindiSlip}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        )}
      </section>

      {/* Add Unlimited Staff Profile Modal */}
      {showAddStaffModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-staff-modal-title"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-stone-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Uncapped Free Tier · Unlimited Household Staff
                </p>
                <h3 id="add-staff-modal-title" className="text-lg font-bold text-stone-900">
                  Add New Staff Profile
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Add Staff Modal"
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaffSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Staff Name (e.g. Kamla Didi / Bahadur Security)
                </label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Enter staff name"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Hindi Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={newStaffNameHi}
                    onChange={(e) => setNewStaffNameHi(e.target.value)}
                    placeholder="e.g. कमला दीदी"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    WhatsApp Phone
                  </label>
                  <input
                    type="text"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    placeholder="919811009988"
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Role / Household Work
                </label>
                <input
                  type="text"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  placeholder="e.g. Baby Nanny / Dog Walker / Car Washer"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Base Salary (₹/mo)
                  </label>
                  <input
                    type="number"
                    value={newStaffSalary}
                    onChange={(e) => setNewStaffSalary(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Paid Leaves / Month
                  </label>
                  <input
                    type="number"
                    value={newStaffLeaves}
                    onChange={(e) => setNewStaffLeaves(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Attendance Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffModel('fixed_monthly')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      newStaffModel === 'fixed_monthly'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF8F5] text-stone-700 border-stone-300'
                    }`}
                  >
                    Model 1: Fixed Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStaffModel('hourly_visit')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border ${
                      newStaffModel === 'hourly_visit'
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF8F5] text-stone-700 border-stone-300'
                    }`}
                  >
                    Model 2: Hourly / Visit
                  </button>
                </div>
              </div>

              {addStaffError && (
                <p className="text-xs text-rose-600 font-semibold">{addStaffError}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  Save Staff Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
