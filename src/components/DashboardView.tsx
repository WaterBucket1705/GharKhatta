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
import { InfoPopupButton } from './InfoPopupButton';

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
    <div className="space-y-6">
      {/* Month-at-a-Glance Hero */}
      <section aria-label="November Household Financial Overview" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-stone-500">
                Nov 2026 · Day {currentDay}/30 · {activeMember}
              </p>
              <InfoPopupButton
                title="Live Household Salary & Udhaar Engine"
                subtitle="November 2026 Overview"
                formula="Net Left to Pay = Base Salary - Unpaid Leave Cut - Partial Task Cut + Overtime/Party Bhatta + Zero-Leave Bonus + Reimbursements - Chhota Advance - Bada Udhaar EMI"
                description="GharKhata automatically calculates how much salary remains to be paid on the 1st of the month across all household staff."
                breakdownItems={[
                  { label: 'Total Monthly Base Payroll', value: `₹${totalBasePayroll.toLocaleString('en-IN')}` },
                  { label: 'Advances & Loan EMIs Cut', value: `-₹${totalAdvancesAndEmiThisMonth.toLocaleString('en-IN')}`, highlight: 'amber' },
                  { label: 'Staff Pocket Reimbursements', value: `+₹${totalReimbursementsThisMonth.toLocaleString('en-IN')}`, highlight: 'emerald' },
                  { label: 'Net Remaining Payout', value: `₹${totalNetPayoutLeft.toLocaleString('en-IN')}`, highlight: 'emerald' },
                ]}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 mt-0.5">
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
          <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-stone-500">{t.netPayoutLeftHero}</span>
              <InfoPopupButton
                title="Net Staff Payout Remaining"
                subtitle="1st-of-Month Final Liability"
                formula="Base - Unpaid Leaves - Task Skips + OT/Bhatta + Reimbursements - Advances - Loan EMI"
                description="Live sum of remaining salary to pay across all unsettled household staff for November 2026."
                breakdownItems={[
                  { label: 'Base Monthly Payroll', value: `₹${totalBasePayroll.toLocaleString('en-IN')}` },
                  { label: 'Home Reimbursements (+Add)', value: `+₹${totalReimbursementsThisMonth.toLocaleString('en-IN')}`, highlight: 'emerald' },
                  { label: 'Advances & Loan EMIs (-Cut)', value: `-₹${totalAdvancesAndEmiThisMonth.toLocaleString('en-IN')}`, highlight: 'amber' },
                  { label: 'Net Left to Pay', value: `₹${totalNetPayoutLeft.toLocaleString('en-IN')}`, highlight: 'emerald' },
                ]}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono-num font-bold text-emerald-700">
                ₹{totalNetPayoutLeft.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-mono-num text-stone-500">
                of ₹{totalBasePayroll.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('udhaar')}
            className="bg-white border border-stone-200 hover:border-amber-500 rounded-2xl p-4 text-left transition-colors flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-stone-500">{t.totalAdvancesHero}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono-num font-bold text-amber-700">
                -₹{totalAdvancesAndEmiThisMonth.toLocaleString('en-IN')}
              </span>
              <Wallet className="w-4 h-4 text-amber-600" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dhobi_milk')}
            className="bg-white border border-stone-200 hover:border-rose-400 rounded-2xl p-4 text-left transition-colors flex flex-col justify-between"
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
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('dhobi_milk')}
            className="bg-white border border-stone-200 hover:border-emerald-600 rounded-2xl p-4 text-left transition-colors flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-stone-500">{t.milkBillHero}</span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-mono-num font-bold text-stone-900">
                ₹{milkSummary.grandTotal.toLocaleString('en-IN')}
              </span>
              <Milk className="w-4 h-4 text-emerald-700" />
            </div>
          </button>
        </div>
      </section>

      {/* Today's Quick Attendance Strip */}
      <section
        aria-label="Today Quick Attendance Strip"
        className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-stone-900">
              Today's Quick Attendance ({currentDay} Nov)
            </h2>
            <InfoPopupButton
              title="Auto-Present Attendance Rule"
              subtitle="Zero Daily Friction"
              description="All staff default to Present every morning. You only need to tap a button below when someone is Absent, takes a Half-Day, or earns +₹200 Guest Party Bhatta."
              bullets={[
                'First 2 absences in a month use the Paid Leave Quota (₹0 salary cut).',
                'From the 3rd absence onwards, 1 day salary (Base ÷ 30) is automatically deducted.',
                'Tap any staff card to open the full 30-day calendar for partial task skips (-₹50) or overtime hours.',
              ]}
            />
          </div>
          <span className="text-xs text-stone-500">
            By {activeMember}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {staffBreakdowns.map(({ staff }) => {
            const todayRecord = staff.attendance[currentDay];
            const currentStatus = todayRecord?.status || 'present';
            return (
              <div
                key={staff.id}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 flex flex-col justify-between gap-2.5"
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
                    +₹200 Bhatta
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pre-Loaded + Unlimited Staff Cards with Live "Money Left to Give" Engine */}
      <section aria-label="Household Staff Cards" className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Household Staff ({staffList.length})
            </h2>
            <InfoPopupButton
              title="How 'Net Left to Give' is Calculated"
              subtitle="Live Salary Math Formula"
              formula="Net Left = Base - Unpaid Leave Cut - Task Skip Cut + OT/Bhatta + Zero-Leave Bonus + Reimbursements - Chhota Advance - Monthly Loan EMI"
              description="Tap the (?) icon next to any staff member's Net Left amount to inspect their exact rupee breakdown."
            />
          </div>
        </div>

        {staffBreakdowns.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
            <h3 className="text-base font-bold text-stone-900">
              Your Household Khata is Currently Empty
            </h3>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {staffBreakdowns.map(({ staff, fin }) => {
              const pctRemaining = Math.max(
                0,
                Math.min(100, Math.round((fin.netPayableLeft / Math.max(1, fin.baseSalary)) * 100))
              );

              return (
                <article
                  key={staff.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  {/* Top Identity & Net Left to Pay */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-stone-900">
                          {staff.name}{' '}
                          <span className="text-xs font-medium text-stone-500">
                            ({staff.nameHi})
                          </span>
                        </h3>
                        <p className="text-xs text-stone-500">{staff.role}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs font-medium text-stone-500">
                            {t.netLeftToGive}
                          </span>
                          <InfoPopupButton
                            title={`${staff.name} — Salary Breakdown`}
                            subtitle={
                              staff.modelType === 'fixed_monthly'
                                ? 'Model 1: Fixed Monthly + Paid Leave Quota'
                                : 'Model 2: Hourly / Visit + Overtime'
                            }
                            formula="Base - Unpaid Leave/Task Cut + OT/Bhatta/Bonus + Reimbursements - Advance - Loan EMI"
                            description={`Exact calculation for ${staff.name} as of ${currentDay} Nov 2026:`}
                            breakdownItems={[
                              {
                                label: 'Base Monthly Salary',
                                value: `₹${fin.baseSalary.toLocaleString('en-IN')}`,
                              },
                              {
                                label: `Paid Leaves Used (${fin.paidLeavesUsed}/${fin.paidLeavesQuota} quota)`,
                                value: fin.unpaidLeaveCut > 0 ? `-₹${fin.unpaidLeaveCut}` : '₹0 Cut',
                                highlight: fin.unpaidLeaveCut > 0 ? 'rose' : 'emerald',
                              },
                              {
                                label: 'Task Partial Skip Cut',
                                value: `-₹${fin.partialTaskCut}`,
                                highlight: fin.partialTaskCut > 0 ? 'rose' : 'neutral',
                              },
                              {
                                label: 'Overtime + Party Bhatta + Zero-Leave Bonus',
                                value: `+₹${(fin.overtimePay + fin.partyBhattaPay + fin.zeroLeaveBonus).toLocaleString('en-IN')}`,
                                highlight: 'emerald',
                              },
                              {
                                label: 'Home Purchase Reimbursements (+Add)',
                                value: `+₹${fin.reimbursementsTotal.toLocaleString('en-IN')}`,
                                highlight: 'emerald',
                              },
                              {
                                label: 'Chhota Advance Taken (-Deduct)',
                                value: `-₹${fin.chhotaAdvanceTotal.toLocaleString('en-IN')}`,
                                highlight: 'amber',
                              },
                              {
                                label: 'Bada Udhaar Monthly EMI (-Deduct)',
                                value: `-₹${fin.activeLoanEmiCut.toLocaleString('en-IN')}`,
                                highlight: 'amber',
                              },
                              {
                                label: 'Net Money Left to Give',
                                value: `₹${fin.netPayableLeft.toLocaleString('en-IN')}`,
                                highlight: 'emerald',
                              },
                            ]}
                          />
                        </div>
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
                          Earned ({currentDay}d):{' '}
                          <strong className="font-mono-num text-stone-900">
                            ₹{fin.accruedEarnedSoFar.toLocaleString('en-IN')}
                          </strong>
                        </span>
                        <span className="font-mono-num">{pctRemaining}% Left</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
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

                  {/* Compact 3-Metric Summary Strip */}
                  <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-xs">
                    <div>
                      <span className="text-stone-500 block">{t.baseSalary}</span>
                      <span className="font-mono-num font-semibold text-stone-900">
                        ₹{fin.baseSalary.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-stone-500 block">
                        {staff.modelType === 'fixed_monthly' ? 'Leaves / Cuts' : 'Overtime'}
                      </span>
                      {staff.modelType === 'fixed_monthly' ? (
                        <span
                          className={`font-mono-num font-semibold ${
                            fin.unpaidLeaveCut + fin.partialTaskCut > 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {fin.paidLeavesUsed}/{fin.paidLeavesQuota}{' '}
                          {fin.unpaidLeaveCut + fin.partialTaskCut > 0
                            ? `(-₹${fin.unpaidLeaveCut + fin.partialTaskCut})`
                            : '(₹0 Cut)'}
                        </span>
                      ) : (
                        <span className="font-mono-num font-semibold text-emerald-700">
                          +{fin.overtimeHoursTotal}h (+₹{fin.overtimePay})
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-stone-500 block">Advance & EMI</span>
                      <span className="font-mono-num font-semibold text-amber-700">
                        -₹{(fin.chhotaAdvanceTotal + fin.activeLoanEmiCut).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectStaffForCalendar(staff.id)}
                      className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {staff.modelType === 'hourly_visit'
                          ? 'Hours & Garden'
                          : 'Attendance'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectStaffForUdhaar(staff.id)}
                      className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-semibold bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-700" />
                      <span>Add Advance</span>
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
