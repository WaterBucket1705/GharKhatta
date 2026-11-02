import React, { useState, useEffect } from 'react';
import { RotateCcw, Trash2, CheckCircle2 } from 'lucide-react';
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
import {
  ActiveTab,
  HeaderAndVoiceBar,
  TAB_TO_PATH,
  pathToTab,
} from './components/HeaderAndVoiceBar';
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

function getFreshDemoDefaults(): StoredKhataState {
  return {
    staffList: structuredClone(INITIAL_STAFF),
    cashLedger: structuredClone(INITIAL_CASH_LEDGER),
    loans: structuredClone(INITIAL_LOANS),
    dhobiBatches: structuredClone(INITIAL_DHOBI_BATCHES),
    milkConfig: structuredClone(INITIAL_MILK_CONFIG),
    colonySlots: structuredClone(INITIAL_COLONY_SLOTS),
    language: 'en',
    activeMember: 'Mummy (Priya)',
    selectedStaffId: 'sunita',
    activeTab: 'dashboard',
  };
}

function loadSavedState(): StoredKhataState {
  const defaults = getFreshDemoDefaults();
  if (typeof window === 'undefined') return defaults;
  try {
    const urlTab = pathToTab(window.location.pathname);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...defaults,
        activeTab: urlTab || defaults.activeTab,
      };
    }
    const parsed = JSON.parse(raw) as Partial<StoredKhataState>;
    const resolvedTab =
      window.location.pathname !== '/' && urlTab
        ? urlTab
        : urlTab || parsed.activeTab || defaults.activeTab;
    return {
      staffList: Array.isArray(parsed.staffList) ? parsed.staffList : defaults.staffList,
      cashLedger: Array.isArray(parsed.cashLedger) ? parsed.cashLedger : defaults.cashLedger,
      loans: Array.isArray(parsed.loans) ? parsed.loans : defaults.loans,
      dhobiBatches: Array.isArray(parsed.dhobiBatches)
        ? parsed.dhobiBatches
        : defaults.dhobiBatches,
      milkConfig: parsed.milkConfig ? parsed.milkConfig : defaults.milkConfig,
      colonySlots: Array.isArray(parsed.colonySlots)
        ? parsed.colonySlots
        : defaults.colonySlots,
      language: parsed.language || defaults.language,
      activeMember: parsed.activeMember || defaults.activeMember,
      selectedStaffId: parsed.selectedStaffId || defaults.selectedStaffId,
      activeTab: resolvedTab,
    };
  } catch {
    return defaults;
  }
}

export default function App() {
  const currentDay = 18; // November 18, 2026 active ledger day
  const [initial] = useState<StoredKhataState>(() => loadSavedState());

  const [resetVersion, setResetVersion] = useState<number>(0);
  const [activeTab, setActiveTabState] = useState<ActiveTab>(
    initial.activeTab || 'dashboard'
  );

  const setActiveTab = (nextTab: ActiveTab) => {
    setActiveTabState(nextTab);
    if (typeof window !== 'undefined') {
      const targetPath = TAB_TO_PATH[nextTab] || '/';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ tab: nextTab }, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const matched = pathToTab(window.location.pathname);
      if (matched) {
        setActiveTabState(matched);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [activeMember, setActiveMember] = useState<FamilyMember>(
    initial.activeMember
  );

  const [staffList, setStaffList] = useState<StaffMember[]>(initial.staffList);
  const [cashLedger, setCashLedger] = useState<CashLedgerEntry[]>(
    initial.cashLedger
  );
  const [loans, setLoans] = useState<BadaUdhaarLoan[]>(initial.loans);
  const [dhobiBatches, setDhobiBatches] = useState<DhobiBatch[]>(
    initial.dhobiBatches
  );
  const [milkConfig, setMilkConfig] = useState<MilkConfig>(initial.milkConfig);
  const [colonySlots, setColonySlots] = useState<ColonyFreeSlot[]>(
    initial.colonySlots
  );

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initial.selectedStaffId || 'sunita'
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
    setTimeout(() => setBannerFeedback(null), 4500);
  };

  // Full Reset to Fresh Demo Defaults
  const handleResetDemoData = () => {
    const fresh = getFreshDemoDefaults();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // Ignore
    }
    setStaffList(fresh.staffList);
    setCashLedger(fresh.cashLedger);
    setLoans(fresh.loans);
    setDhobiBatches(fresh.dhobiBatches);
    setMilkConfig(fresh.milkConfig);
    setColonySlots(fresh.colonySlots);
    setLanguage(fresh.language);
    setActiveMember(fresh.activeMember);
    setSelectedStaffId('sunita');
    setActiveTab('dashboard');
    setReceiptModalPayload(null);
    setResetVersion((v) => v + 1);
    showToast(
      'Demo data reset! Restored all 4 household staff, udhaar ledgers, dhobi batches & milk calendar to initial November 2026 state.'
    );
  };

  // Clear All Demo Data to Blank Slate (for starting fresh with user's own staff)
  const handleClearAllDemoData = () => {
    const emptyMilk: MilkConfig = {
      vendorName: 'Daily Milk & Water Supply',
      milkType: 'Buffalo / Cow Milk',
      defaultDailyLiters: 2.0,
      pricePerLiter: 70,
      days: {},
    };
    setStaffList([]);
    setCashLedger([]);
    setLoans([]);
    setDhobiBatches([]);
    setMilkConfig(emptyMilk);
    setColonySlots([]);
    setSelectedStaffId('');
    setActiveTab('dashboard');
    setReceiptModalPayload(null);
    setResetVersion((v) => v + 1);
    showToast(
      'Cleared all demo data! Your khata is now empty — tap "+ Add Unlimited Staff" to add your own household helpers.'
    );
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
    if (!targetStaff) return;

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
        onResetDemoData={handleResetDemoData}
        currentDay={currentDay}
      />

      {bannerFeedback && (
        <div
          role="status"
          data-testid="status-toast-banner"
          className="fixed bottom-16 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50"
        >
          <div className="p-3.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold shadow-xl flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{bannerFeedback}</span>
            </span>
            <button
              type="button"
              onClick={() => setBannerFeedback(null)}
              className="underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main key={resetVersion} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
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
            onResetDemoData={handleResetDemoData}
          />
        )}

        {activeTab === 'calendar' && staffList.length > 0 && (
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

        {activeTab === 'udhaar' && staffList.length > 0 && (
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

      <footer className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <span>
          GharKhata — 100% Free Unlimited Household Staff, Attendance & Udhaar Ledger (Auto-Saved to LocalStorage)
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetDemoData}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-200/80 hover:bg-stone-300 text-stone-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data (Restore Defaults)</span>
          </button>
          <button
            type="button"
            onClick={handleClearAllDemoData}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Demo Data (Start Empty)</span>
          </button>
        </div>
      </footer>

      <OfflineIndicator />

      <WhatsAppAudioSlipModal
        payload={receiptModalPayload}
        onClose={() => setReceiptModalPayload(null)}
      />
    </div>
  );
}
