import React, { useState, useEffect } from 'react';
import {
  BadaUdhaarLoan,
  CashBucketType,
  CashLedgerEntry,
  ColonyFreeSlot,
  DayAttendanceRecord,
  DhobiBatch,
  DhobiItemCounts,
  FamilyMember,
  Language,
  MilkConfig,
  MilkDayRecord,
  ParsedHinglishCommand,
  ReceiptModalPayload,
  StaffMember,
} from './types/khata';
import {
  INITIAL_CASH_LEDGER,
  INITIAL_COLONY_SLOTS,
  INITIAL_DHOBI_BATCHES,
  INITIAL_LOANS,
  INITIAL_MILK_CONFIG,
  INITIAL_STAFF,
} from './data/initialData';
import {
  calculateDhobiBatchCost,
  calculateStaffFinancials,
} from './utils/mathEngine';
import { ActiveTab, HeaderAndVoiceBar } from './components/HeaderAndVoiceBar';
import { DashboardView } from './components/DashboardView';
import { AttendanceCalendarView } from './components/AttendanceCalendarView';
import { UdhaarLoansView } from './components/UdhaarLoansView';
import { DhobiMilkView } from './components/DhobiMilkView';
import { StaffVaultColonyView } from './components/StaffVaultColonyView';
import { WhatsAppAudioSlipModal } from './components/WhatsAppAudioSlipModal';
import { OfflineIndicator } from './components/PWAInstallButton';

const STORAGE_KEY = 'gharkhata_v1_state';

interface StoredKhataState {
  staffList: StaffMember[];
  cashLedger: CashLedgerEntry[];
  loans: BadaUdhaarLoan[];
  dhobiBatches: DhobiBatch[];
  milkConfig: MilkConfig;
  colonySlots: ColonyFreeSlot[];
  language: Language;
  activeMember: FamilyMember;
  selectedStaffId?: string;
  activeTab?: ActiveTab;
}

function loadSavedState(): Partial<StoredKhataState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<StoredKhataState>;
  } catch {
    return {};
  }
}

export default function App() {
  const currentDay = 18; // November 18, 2026 active ledger day
  const saved = loadSavedState();

  const [activeTab, setActiveTab] = useState<ActiveTab>(
    saved.activeTab || 'dashboard'
  );
  const [language, setLanguage] = useState<Language>(saved.language || 'en');
  const [activeMember, setActiveMember] = useState<FamilyMember>(
    saved.activeMember || 'Mummy (Priya)'
  );

  const [staffList, setStaffList] = useState<StaffMember[]>(
    saved.staffList && saved.staffList.length > 0 ? saved.staffList : INITIAL_STAFF
  );
  const [cashLedger, setCashLedger] = useState<CashLedgerEntry[]>(
    saved.cashLedger || INITIAL_CASH_LEDGER
  );
  const [loans, setLoans] = useState<BadaUdhaarLoan[]>(
    saved.loans || INITIAL_LOANS
  );
  const [dhobiBatches, setDhobiBatches] = useState<DhobiBatch[]>(
    saved.dhobiBatches || INITIAL_DHOBI_BATCHES
  );
  const [milkConfig, setMilkConfig] = useState<MilkConfig>(
    saved.milkConfig || INITIAL_MILK_CONFIG
  );
  const [colonySlots, setColonySlots] = useState<ColonyFreeSlot[]>(
    saved.colonySlots || INITIAL_COLONY_SLOTS
  );

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    saved.selectedStaffId || 'sunita'
  );
  const [receiptModalPayload, setReceiptModalPayload] =
    useState<ReceiptModalPayload | null>(null);
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  // Sync full state to client-side localStorage automatically for iPhone PWA standalone mode
  useEffect(() => {
    try {
      const payload: StoredKhataState = {
        staffList,
        cashLedger,
        loans,
        dhobiBatches,
        milkConfig,
        colonySlots,
        language,
        activeMember,
        selectedStaffId,
        activeTab,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [
    staffList,
    cashLedger,
    loans,
    dhobiBatches,
    milkConfig,
    colonySlots,
    language,
    activeMember,
    selectedStaffId,
    activeTab,
  ]);

  // Keep state synced if opened across Safari and standalone PWA windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as Partial<StoredKhataState>;
          if (next.staffList) setStaffList(next.staffList);
          if (next.cashLedger) setCashLedger(next.cashLedger);
          if (next.loans) setLoans(next.loans);
          if (next.dhobiBatches) setDhobiBatches(next.dhobiBatches);
          if (next.milkConfig) setMilkConfig(next.milkConfig);
          if (next.colonySlots) setColonySlots(next.colonySlots);
          if (next.language) setLanguage(next.language);
          if (next.activeMember) setActiveMember(next.activeMember);
        } catch {
          // Ignore malformed storage events
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setBannerFeedback(msg);
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  const handleAddNewStaff = (newStaff: StaffMember) => {
    setStaffList((prev) => [...prev, newStaff]);
    setSelectedStaffId(newStaff.id);
    showToast(
      `Added ${newStaff.name} (₹${newStaff.baseSalary.toLocaleString('en-IN')}/mo) to GharKhata (${activeMember})`
    );
  };

  // Mark All Present Today
  const handleMarkAllPresentToday = () => {
    setStaffList((prev) =>
      prev.map((st) => ({
        ...st,
        attendance: {
          ...st.attendance,
          [currentDay]: {
            day: currentDay,
            status: 'present',
            loggedBy: activeMember,
            loggedAt: '08:30 AM',
          },
        },
      }))
    );
    showToast(
      `Marked all ${staffList.length} staff members Present for ${currentDay} Nov 2026 (${activeMember})`
    );
  };

  // Quick Mark Attendance from Dashboard
  const handleQuickMarkAttendance = (
    staffId: string,
    status: 'present' | 'absent' | 'half_day',
    partyBhatta?: number
  ) => {
    let updatedStaff: StaffMember | undefined;

    setStaffList((prev) =>
      prev.map((st) => {
        if (st.id !== staffId) return st;
        const existing = st.attendance[currentDay];
        const nextRec: DayAttendanceRecord = {
          day: currentDay,
          status,
          partyBhatta:
            partyBhatta !== undefined ? partyBhatta : existing?.partyBhatta || 0,
          loggedBy: activeMember,
          loggedAt: '09:10 AM',
        };
        const nextStaff = {
          ...st,
          attendance: {
            ...st.attendance,
            [currentDay]: nextRec,
          },
        };
        updatedStaff = nextStaff;
        return nextStaff;
      })
    );

    if (updatedStaff) {
      const fin = calculateStaffFinancials(updatedStaff, cashLedger, loans, currentDay);
      showToast(
        `Updated ${updatedStaff.name}: ${
          partyBhatta ? `+₹${partyBhatta} Party Bhatta` : status.toUpperCase()
        } · Net Left: ₹${fin.netPayableLeft.toLocaleString('en-IN')}`
      );
    }
  };

  // Update Detailed Day Attendance
  const handleUpdateDayAttendance = (
    staffId: string,
    day: number,
    record: DayAttendanceRecord
  ) => {
    setStaffList((prev) =>
      prev.map((st) =>
        st.id === staffId
          ? {
              ...st,
              attendance: {
                ...st.attendance,
                [day]: record,
              },
            }
          : st
      )
    );
  };

  // Toggle Zero-Leave Bonus
  const handleToggleZeroLeaveBonus = (staffId: string) => {
    setStaffList((prev) =>
      prev.map((st) =>
        st.id === staffId
          ? { ...st, zeroLeaveBonusEnabled: !st.zeroLeaveBonusEnabled }
          : st
      )
    );
  };

  // Garden Checklist Handlers
  const handleAddGardenChecklistItem = (staffId: string, text: string) => {
    setStaffList((prev) =>
      prev.map((st) =>
        st.id === staffId
          ? {
              ...st,
              gardenChecklist: [
                ...(st.gardenChecklist || []),
                {
                  id: `gc-${Date.now()}`,
                  text,
                  completed: false,
                  addedBy: activeMember,
                },
              ],
            }
          : st
      )
    );
  };

  const handleToggleGardenChecklistItem = (staffId: string, itemId: string) => {
    setStaffList((prev) =>
      prev.map((st) =>
        st.id === staffId
          ? {
              ...st,
              gardenChecklist: (st.gardenChecklist || []).map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : st
      )
    );
  };

  // Add Cash Entry (Chhota Advance or Home Reimbursement)
  const handleAddCashEntry = (
    staffId: string,
    bucket: CashBucketType,
    amount: number,
    reason: string
  ) => {
    const newEntry: CashLedgerEntry = {
      id: `led-${Date.now()}`,
      staffId,
      day: currentDay,
      dateStr: `${currentDay} Nov 2026`,
      bucket,
      amount,
      reason,
      loggedBy: activeMember,
      loggedAt: '09:30 AM',
    };
    const nextLedger = [...cashLedger, newEntry];
    setCashLedger(nextLedger);

    const staff = staffList.find((s) => s.id === staffId);
    if (staff) {
      const fin = calculateStaffFinancials(staff, nextLedger, loans, currentDay);
      const isAdd = bucket === 'reimbursement';
      setReceiptModalPayload({
        staffName: staff.name,
        staffNameHi: staff.nameHi,
        phone: staff.phone,
        entryTypeLabel: isAdd ? `Home Reimbursement (${reason})` : `Chhota Advance (${reason})`,
        entryTypeLabelHi: isAdd ? 'घर सामान खर्च (+जुड़ा)' : 'छोटा एडवांस',
        dateStr: `${currentDay} Nov 2026`,
        amountChanged: amount,
        isAddition: isAdd,
        paidLeavesUsed: fin.paidLeavesUsed,
        paidLeaveQuota: fin.paidLeavesQuota,
        totalBorrowedThisMonth: fin.chhotaAdvanceTotal,
        reimbursementsThisMonth: fin.reimbursementsTotal,
        activeEmiCut: fin.activeLoanEmiCut,
        netPayableLeft: fin.netPayableLeft,
        loggedBy: activeMember,
      });
    }
  };

  // Create Bada Udhaar Multi-Month Loan
  const handleCreateBadaLoan = (
    staffId: string,
    principal: number,
    monthlyEmi: number,
    purpose: string
  ) => {
    const newLoan: BadaUdhaarLoan = {
      id: `loan-${Date.now()}`,
      staffId,
      purpose,
      totalPrincipal: principal,
      monthlyEmi,
      balanceRemaining: principal,
      startDate: 'Nov 2026',
      pausedThisMonth: false,
      loggedBy: activeMember,
    };
    const nextLoans = [...loans, newLoan];
    setLoans(nextLoans);

    const staff = staffList.find((s) => s.id === staffId);
    if (staff) {
      const fin = calculateStaffFinancials(staff, cashLedger, nextLoans, currentDay);
      showToast(
        `Created ₹${principal.toLocaleString('en-IN')} Bada Udhaar Loan for ${staff.name} (EMI: ₹${monthlyEmi}/mo) · Net Left: ₹${fin.netPayableLeft.toLocaleString('en-IN')}`
      );
    }
  };

  // Pause / Resume Loan EMI for Festival Month
  const handleTogglePauseLoanEmi = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, pausedThisMonth: !l.pausedThisMonth } : l
      )
    );
  };

  // Settle Staff Month via UPI
  const handleSettleStaffMonth = (staffId: string) => {
    const staff = staffList.find((s) => s.id === staffId);
    if (!staff) return;
    const fin = calculateStaffFinancials(staff, cashLedger, loans, currentDay);

    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              settledForMonth: true,
              settledDate: `${currentDay} Nov 2026`,
              settledUpiRef: `UPI-${Math.floor(100000 + Math.random() * 900000)}`,
            }
          : s
      )
    );

    // Deduct active EMI from loan balance remaining
    setLoans((prev) =>
      prev.map((l) =>
        l.staffId === staffId && !l.pausedThisMonth
          ? {
              ...l,
              balanceRemaining: Math.max(0, l.balanceRemaining - l.monthlyEmi),
            }
          : l
      )
    );

    setReceiptModalPayload({
      staffName: staff.name,
      staffNameHi: staff.nameHi,
      phone: staff.phone,
      entryTypeLabel: 'Full Month Salary Settled via UPI',
      entryTypeLabelHi: 'नवंबर पगार भुगतान पूरा',
      dateStr: `${currentDay} Nov 2026`,
      amountChanged: fin.netPayableLeft,
      isAddition: true,
      paidLeavesUsed: fin.paidLeavesUsed,
      paidLeaveQuota: fin.paidLeavesQuota,
      totalBorrowedThisMonth: fin.chhotaAdvanceTotal,
      reimbursementsThisMonth: fin.reimbursementsTotal,
      activeEmiCut: fin.activeLoanEmiCut,
      netPayableLeft: 0,
      loggedBy: activeMember,
    });
  };

  // Dhobi Handlers
  const handleAddDhobiBatch = (counts: DhobiItemCounts, note: string) => {
    const { totalPieces, batchCost } = calculateDhobiBatchCost(counts);
    const newBatch: DhobiBatch = {
      id: `dhobi-${Date.now()}`,
      givenDate: `${currentDay} Nov 2026`,
      day: currentDay,
      givenCounts: { ...counts },
      returnedCounts: {
        shirts: 0,
        trousers: 0,
        sarees_bedsheets: 0,
        heavy_suits: 0,
      },
      totalGiven: totalPieces,
      totalReturned: 0,
      batchCost,
      note,
      loggedBy: activeMember,
      loggedAt: '09:40 AM',
    };
    setDhobiBatches((prev) => [newBatch, ...prev]);
    showToast(`Logged ${totalPieces} clothes batch to Raju Dhobi (₹${batchCost})`);
  };

  const handleUpdateDhobiBatchReturn = (
    batchId: string,
    returnedCounts: DhobiItemCounts
  ) => {
    setDhobiBatches((prev) =>
      prev.map((b) => {
        if (b.id !== batchId) return b;
        const totalReturned =
          returnedCounts.shirts +
          returnedCounts.trousers +
          returnedCounts.sarees_bedsheets +
          returnedCounts.heavy_suits;
        return {
          ...b,
          returnedCounts,
          totalReturned: Math.min(b.totalGiven, totalReturned),
        };
      })
    );
  };

  // Milk Calendar Handler
  const handleUpdateMilkDay = (day: number, record: MilkDayRecord) => {
    setMilkConfig((prev) => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: record,
      },
    }));
  };

  // Colony Slot Handlers
  const handleToggleReserveSlot = (slotId: string) => {
    setColonySlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, reservedByUser: !s.reservedByUser } : s
      )
    );
  };

  const handleAddColonySlot = (slot: Omit<ColonyFreeSlot, 'id'>) => {
    setColonySlots((prev) => [{ ...slot, id: `slot-${Date.now()}` }, ...prev]);
    showToast(`Published ${slot.workerName}'s open time slot to the Colony Board`);
  };

  // Apply AI Parsed Hinglish Voice/Text Command to Live Khata State
  const handleApplyParsedCommand = (cmd: ParsedHinglishCommand) => {
    if (cmd.actionType === 'dhobi_give' && cmd.clothBreakdown) {
      handleAddDhobiBatch(cmd.clothBreakdown, cmd.note);
      setActiveTab('dhobi_milk');
      return;
    }

    if (cmd.actionType === 'milk_exception') {
      const targetDay = cmd.day || currentDay;
      const existing = milkConfig.days[targetDay];
      const nextLiters =
        milkConfig.defaultDailyLiters + (cmd.milkExtraLiters || 1);
      const nextSideItems = [...(existing?.sideItems || [])];
      if (cmd.sideItemName && cmd.sideItemCost) {
        nextSideItems.push({
          id: `si-${Date.now()}`,
          name: cmd.sideItemName,
          price: cmd.sideItemCost,
        });
      }
      handleUpdateMilkDay(targetDay, {
        day: targetDay,
        status: 'extra',
        liters: nextLiters,
        sideItems: nextSideItems,
        loggedBy: activeMember,
        loggedAt: '08:35 AM',
      });
      setActiveTab('dhobi_milk');
      showToast(`Applied Milk & Dairy update: ${cmd.summaryEn}`);
      return;
    }

    // Staff Ledger / Attendance Action
    const targetStaffId = cmd.workerId || 'sunita';
    const targetStaff =
      staffList.find((s) => s.id === targetStaffId) || staffList[0];

    let nextStaffList = [...staffList];
    let nextCashLedger = [...cashLedger];

    if (cmd.actionType === 'absent_and_advance') {
      nextStaffList = nextStaffList.map((st) =>
        st.id === targetStaff.id
          ? {
              ...st,
              attendance: {
                ...st.attendance,
                [currentDay]: {
                  day: currentDay,
                  status: 'absent',
                  loggedBy: activeMember,
                  loggedAt: '08:35 AM',
                },
              },
            }
          : st
      );
      if (cmd.amount && cmd.amount > 0) {
        nextCashLedger = [
          ...nextCashLedger,
          {
            id: `led-${Date.now()}`,
            staffId: targetStaff.id,
            day: currentDay,
            dateStr: `${currentDay} Nov 2026`,
            bucket: 'chhota_advance',
            amount: cmd.amount,
            reason: cmd.note,
            loggedBy: activeMember,
            loggedAt: '08:35 AM',
          },
        ];
      }
    } else if (cmd.actionType === 'absent') {
      nextStaffList = nextStaffList.map((st) =>
        st.id === targetStaff.id
          ? {
              ...st,
              attendance: {
                ...st.attendance,
                [currentDay]: {
                  day: currentDay,
                  status: 'absent',
                  loggedBy: activeMember,
                  loggedAt: '08:35 AM',
                },
              },
            }
          : st
      );
    } else if (cmd.actionType === 'hours_and_reimbursement') {
      const hrs = cmd.hours || 3.5;
      const ot = Math.max(0, hrs - (targetStaff.standardVisitHours || 3));
      nextStaffList = nextStaffList.map((st) =>
        st.id === targetStaff.id
          ? {
              ...st,
              attendance: {
                ...st.attendance,
                [currentDay]: {
                  day: currentDay,
                  status: 'present',
                  hoursWorked: hrs,
                  overtimeHours: ot,
                  visitNote: cmd.note,
                  loggedBy: activeMember,
                  loggedAt: '08:35 AM',
                },
              },
            }
          : st
      );
      if (cmd.amount && cmd.amount > 0) {
        nextCashLedger = [
          ...nextCashLedger,
          {
            id: `led-${Date.now()}`,
            staffId: targetStaff.id,
            day: currentDay,
            dateStr: `${currentDay} Nov 2026`,
            bucket: 'reimbursement',
            amount: cmd.amount,
            reason: cmd.note,
            loggedBy: activeMember,
            loggedAt: '08:35 AM',
          },
        ];
      }
    } else if (cmd.actionType === 'overtime') {
      const ot = cmd.hours || 3;
      nextStaffList = nextStaffList.map((st) =>
        st.id === targetStaff.id
          ? {
              ...st,
              attendance: {
                ...st.attendance,
                [currentDay]: {
                  day: currentDay,
                  status: 'present',
                  overtimeHours: ot,
                  visitNote: cmd.note,
                  loggedBy: activeMember,
                  loggedAt: '08:35 AM',
                },
              },
            }
          : st
      );
    } else if (cmd.actionType === 'reimbursement') {
      nextCashLedger = [
        ...nextCashLedger,
        {
          id: `led-${Date.now()}`,
          staffId: targetStaff.id,
          day: currentDay,
          dateStr: `${currentDay} Nov 2026`,
          bucket: 'reimbursement',
          amount: cmd.amount || 300,
          reason: cmd.note,
          loggedBy: activeMember,
          loggedAt: '08:35 AM',
        },
      ];
    } else {
      // advance
      nextCashLedger = [
        ...nextCashLedger,
        {
          id: `led-${Date.now()}`,
          staffId: targetStaff.id,
          day: currentDay,
          dateStr: `${currentDay} Nov 2026`,
          bucket: 'chhota_advance',
          amount: cmd.amount || 500,
          reason: cmd.note,
          loggedBy: activeMember,
          loggedAt: '08:35 AM',
        },
      ];
    }

    setStaffList(nextStaffList);
    setCashLedger(nextCashLedger);

    const updatedStaffObj =
      nextStaffList.find((s) => s.id === targetStaff.id) || targetStaff;
    const updatedFin = calculateStaffFinancials(
      updatedStaffObj,
      nextCashLedger,
      loans,
      currentDay
    );

    const isAddition =
      cmd.actionType === 'reimbursement' ||
      cmd.actionType === 'hours_and_reimbursement' ||
      cmd.actionType === 'overtime';

    setReceiptModalPayload({
      staffName: updatedStaffObj.name,
      staffNameHi: updatedStaffObj.nameHi,
      phone: updatedStaffObj.phone,
      entryTypeLabel: cmd.summaryEn,
      entryTypeLabelHi: cmd.summaryHi,
      dateStr: `${currentDay} Nov 2026`,
      amountChanged: cmd.amount,
      isAddition,
      paidLeavesUsed: updatedFin.paidLeavesUsed,
      paidLeaveQuota: updatedFin.paidLeavesQuota,
      totalBorrowedThisMonth: updatedFin.chhotaAdvanceTotal,
      reimbursementsThisMonth: updatedFin.reimbursementsTotal,
      activeEmiCut: updatedFin.activeLoanEmiCut,
      netPayableLeft: updatedFin.netPayableLeft,
      loggedBy: activeMember,
    });
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 pb-20 lg:pb-10">
      <HeaderAndVoiceBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        activeMember={activeMember}
        setActiveMember={setActiveMember}
        onApplyParsedCommand={handleApplyParsedCommand}
        currentDay={currentDay}
      />

      {bannerFeedback && (
        <div
          role="status"
          className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4"
        >
          <div className="p-3 rounded-xl bg-emerald-800 text-white text-xs font-semibold flex items-center justify-between">
            <span>{bannerFeedback}</span>
            <button
              type="button"
              onClick={() => setBannerFeedback(null)}
              className="underline ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            staffList={staffList}
            cashLedger={cashLedger}
            loans={loans}
            dhobiBatches={dhobiBatches}
            milkConfig={milkConfig}
            language={language}
            activeMember={activeMember}
            currentDay={currentDay}
            onMarkAllPresentToday={handleMarkAllPresentToday}
            onQuickMarkAttendance={handleQuickMarkAttendance}
            onSelectStaffForCalendar={(id) => {
              setSelectedStaffId(id);
              setActiveTab('calendar');
            }}
            onSelectStaffForUdhaar={(id) => {
              setSelectedStaffId(id);
              setActiveTab('udhaar');
            }}
            onOpenReceiptModal={setReceiptModalPayload}
            onNavigateTab={setActiveTab}
            onAddNewStaff={handleAddNewStaff}
          />
        )}

        {activeTab === 'calendar' && (
          <AttendanceCalendarView
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            onSelectStaffId={setSelectedStaffId}
            cashLedger={cashLedger}
            loans={loans}
            activeMember={activeMember}
            currentDay={currentDay}
            onUpdateDayAttendance={handleUpdateDayAttendance}
            onToggleZeroLeaveBonus={handleToggleZeroLeaveBonus}
            onAddGardenChecklistItem={handleAddGardenChecklistItem}
            onToggleGardenChecklistItem={handleToggleGardenChecklistItem}
            onOpenReceiptModal={setReceiptModalPayload}
          />
        )}

        {activeTab === 'udhaar' && (
          <UdhaarLoansView
            staffList={staffList}
            selectedStaffId={selectedStaffId}
            onSelectStaffId={setSelectedStaffId}
            cashLedger={cashLedger}
            loans={loans}
            activeMember={activeMember}
            currentDay={currentDay}
            onAddCashEntry={handleAddCashEntry}
            onCreateBadaLoan={handleCreateBadaLoan}
            onTogglePauseLoanEmi={handleTogglePauseLoanEmi}
            onSettleStaffMonth={handleSettleStaffMonth}
            onOpenReceiptModal={setReceiptModalPayload}
          />
        )}

        {activeTab === 'dhobi_milk' && (
          <DhobiMilkView
            dhobiBatches={dhobiBatches}
            milkConfig={milkConfig}
            activeMember={activeMember}
            currentDay={currentDay}
            onAddDhobiBatch={handleAddDhobiBatch}
            onUpdateDhobiBatchReturn={handleUpdateDhobiBatchReturn}
            onUpdateMilkDay={handleUpdateMilkDay}
          />
        )}

        {activeTab === 'vault_colony' && (
          <StaffVaultColonyView
            staffList={staffList}
            colonySlots={colonySlots}
            onToggleReserveSlot={handleToggleReserveSlot}
            onAddColonySlot={handleAddColonySlot}
          />
        )}
      </main>

      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
        <span>
          GharKhata — 100% Free Unlimited Household Staff, Attendance & Udhaar Ledger (Auto-Saved to LocalStorage)
        </span>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.removeItem(STORAGE_KEY);
            } catch {
              // Ignore
            }
            setStaffList(INITIAL_STAFF);
            setCashLedger(INITIAL_CASH_LEDGER);
            setLoans(INITIAL_LOANS);
            setDhobiBatches(INITIAL_DHOBI_BATCHES);
            setMilkConfig(INITIAL_MILK_CONFIG);
            setColonySlots(INITIAL_COLONY_SLOTS);
            showToast('Reset November 2026 household data to initial state');
          }}
          className="text-stone-600 hover:text-stone-900 underline"
        >
          Reset Demo Data
        </button>
      </footer>

      <OfflineIndicator />

      <WhatsAppAudioSlipModal
        payload={receiptModalPayload}
        onClose={() => setReceiptModalPayload(null)}
      />
    </div>
  );
}
