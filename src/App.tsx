import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, UserPlus } from 'lucide-react';
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
  calculateDhobiBatchCost,
  calculateStaffFinancials,
} from './utils/mathEngine';
import {
  ActiveTab,
  DEFAULT_FAMILY_MEMBERS,
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

const STORAGE_KEY = 'gharkhata_v2_clean_state';
const LEGACY_DEMO_STORAGE_KEY = 'gharkhata_v1_state';

interface StoredKhataState {
  staffList: StaffMember[];
  cashLedger: CashLedgerEntry[];
  loans: BadaUdhaarLoan[];
  dhobiBatches: DhobiBatch[];
  milkConfig: MilkConfig;
  colonySlots: ColonyFreeSlot[];
  language: Language;
  activeMember: FamilyMember;
  familyMembers: FamilyMember[];
  selectedStaffId?: string;
  activeTab?: ActiveTab;
  darkMode?: boolean;
}

function getCleanInitialState(): StoredKhataState {
  return {
    staffList: [],
    cashLedger: [],
    loans: [],
    dhobiBatches: [],
    milkConfig: {
      vendorName: 'Daily Milk & Water Supply',
      milkType: 'Milk',
      defaultDailyLiters: 0,
      pricePerLiter: 70,
      days: {},
    },
    colonySlots: [],
    language: 'en',
    activeMember: 'My Profile',
    familyMembers: [...DEFAULT_FAMILY_MEMBERS],
    selectedStaffId: '',
    activeTab: 'dashboard',
    darkMode: false,
  };
}

function loadSavedState(): StoredKhataState {
  const defaults = getCleanInitialState();
  if (typeof window === 'undefined') return defaults;
  try {
    // Remove legacy demo localStorage if present
    window.localStorage.removeItem(LEGACY_DEMO_STORAGE_KEY);
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
      familyMembers:
        Array.isArray(parsed.familyMembers) && parsed.familyMembers.length > 0
          ? parsed.familyMembers
          : defaults.familyMembers,
      selectedStaffId: parsed.selectedStaffId || defaults.selectedStaffId,
      activeTab: resolvedTab,
      darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : false,
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
  const [darkMode, setDarkMode] = useState<boolean>(Boolean(initial.darkMode));
  const [activeMember, setActiveMember] = useState<FamilyMember>(
    initial.activeMember
  );
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initial.familyMembers
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark-theme', darkMode);
    }
  }, [darkMode]);

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
    initial.selectedStaffId || ''
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
        familyMembers,
        selectedStaffId,
        activeTab,
        darkMode,
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
    familyMembers,
    selectedStaffId,
    activeTab,
    darkMode,
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
          if (next.familyMembers) setFamilyMembers(next.familyMembers);
          if (typeof next.darkMode === 'boolean') setDarkMode(next.darkMode);
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

  // Rename Own Profile / Active Family Member
  const handleRenameActiveMember = (oldName: FamilyMember, newName: FamilyMember) => {
    setFamilyMembers((prev) => {
      const updated = prev.map((m) => (m === oldName ? newName : m));
      return Array.from(new Set(updated));
    });
    setActiveMember(newName);
    showToast(`Updated your display name to "${newName}"`);
  };

  // Add Family Member
  const handleAddFamilyMember = (newName: FamilyMember) => {
    setFamilyMembers((prev) =>
      prev.includes(newName) ? prev : [...prev, newName]
    );
    setActiveMember(newName);
    showToast(`Added "${newName}" and switched active profile`);
  };

  // Delete Family Member
  const handleDeleteFamilyMember = (nameToDelete: FamilyMember) => {
    setFamilyMembers((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((m) => m !== nameToDelete);
      if (activeMember === nameToDelete && next.length > 0) {
        setActiveMember(next[0]);
      }
      return next;
    });
    showToast(`Removed "${nameToDelete}" from family list`);
  };

  // Clear All Data to Blank Slate
  const handleClearAllData = () => {
    const clean = getCleanInitialState();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch {
      // Ignore
    }
    setStaffList([]);
    setCashLedger([]);
    setLoans([]);
    setDhobiBatches([]);
    setMilkConfig(clean.milkConfig);
    setColonySlots([]);
    setSelectedStaffId('');
    setActiveTab('dashboard');
    setReceiptModalPayload(null);
    setResetVersion((v) => v + 1);
    showToast(
      'Cleared all records! Your khata is now a clean sheet.'
    );
  };

  const handleAddNewStaff = (newStaff: StaffMember) => {
    setStaffList((prev) => [...prev, newStaff]);
    setSelectedStaffId(newStaff.id);
    showToast(
      `Added ${newStaff.name} (₹${newStaff.baseSalary.toLocaleString('en-IN')}/mo) to GharKhata (${activeMember})`
    );
  };

  const handleUpdateStaffMember = (updatedStaff: StaffMember) => {
    setStaffList((prev) =>
      prev.map((st) => (st.id === updatedStaff.id ? updatedStaff : st))
    );
    showToast(`Updated KYC & verification details for ${updatedStaff.name}`);
  };

  const handleDeleteStaffMember = (staffId: string) => {
    const target = staffList.find((s) => s.id === staffId);
    setStaffList((prev) => {
      const remaining = prev.filter((s) => s.id !== staffId);
      if (selectedStaffId === staffId) {
        setSelectedStaffId(remaining[0]?.id || '');
      }
      return remaining;
    });
    if (target) {
      showToast(`Deleted ${target.name} from GharKhata & KYC Vault`);
    }
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

  const handleUpdateMilkSettings = (
    defaultDailyLiters: number,
    pricePerLiter: number
  ) => {
    setMilkConfig((prev) => ({
      ...prev,
      defaultDailyLiters,
      pricePerLiter,
    }));
    showToast(
      `Updated daily milk default to ${defaultDailyLiters}L/day @ ₹${pricePerLiter}/L`
    );
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

  const handleUpdateColonySlot = (updatedSlot: ColonyFreeSlot) => {
    setColonySlots((prev) =>
      prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s))
    );
    showToast(`Updated Colony Board slot for ${updatedSlot.workerName}`);
  };

  const handleDeleteColonySlot = (slotId: string) => {
    setColonySlots((prev) => prev.filter((s) => s.id !== slotId));
    showToast('Removed slot listing from the Colony Board');
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
    let nextStaffList = [...staffList];
    const targetStaffId = cmd.workerId || '';
    let targetStaff =
      nextStaffList.find(
        (s) =>
          s.id === targetStaffId ||
          s.name.toLowerCase().includes((cmd.workerName || '').toLowerCase())
      ) || nextStaffList[0];

    // If starting from a clean sheet with no staff yet, auto-create the staff profile
    if (!targetStaff) {
      const workerName = cmd.workerName?.trim() || 'Household Helper';
      targetStaff = {
        id: `staff-${Date.now()}`,
        name: workerName,
        nameHi: workerName,
        role: 'Household Staff',
        roleHi: 'Household Staff',
        phone: '',
        modelType:
          cmd.actionType === 'hours_and_reimbursement'
            ? 'hourly_visit'
            : 'fixed_monthly',
        baseSalary: 5000,
        paidLeaveQuota: 2,
        zeroLeaveBonusEnabled: true,
        zeroLeaveBonusAmount: 200,
        standardVisitHours: 3,
        hourlyOvertimeRate: 120,
        tasks: [
          {
            id: 'task-1',
            labelEn: 'Morning Primary Duty',
            labelHi: 'Morning Primary Duty',
            skipPenalty: 50,
          },
          {
            id: 'task-2',
            labelEn: 'Evening Duty',
            labelHi: 'Evening Duty',
            skipPenalty: 50,
          },
        ],
        attendance: {},
        kyc: {
          maskedAadhaar: 'Not Added Yet',
          homeVillage: 'Not Added Yet',
          emergencyContact: 'Not Added Yet',
          policeVerified: false,
          policeVerificationId: 'PENDING-VERIFICATION',
          neighborReference: `Added by ${activeMember}`,
          upiId: `${workerName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
          joinedSince: 'November 2026',
        },
      };
      nextStaffList = [targetStaff];
      setSelectedStaffId(targetStaff.id);
    }

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
    <div
      id="top"
      data-theme={darkMode ? 'dark' : 'light'}
      className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900 pb-20 lg:pb-10 transition-colors"
    >
      <HeaderAndVoiceBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        activeMember={activeMember}
        setActiveMember={setActiveMember}
        familyMembers={familyMembers}
        onRenameActiveMember={handleRenameActiveMember}
        onAddFamilyMember={handleAddFamilyMember}
        onDeleteFamilyMember={handleDeleteFamilyMember}
        onApplyParsedCommand={handleApplyParsedCommand}
        currentDay={currentDay}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
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
          />
        )}

        {activeTab === 'calendar' &&
          (staffList.length > 0 ? (
            <AttendanceCalendarView
              staffList={staffList}
              selectedStaffId={selectedStaffId}
              onSelectStaffId={setSelectedStaffId}
              cashLedger={cashLedger}
              loans={loans}
              language={language}
              activeMember={activeMember}
              currentDay={currentDay}
              onUpdateDayAttendance={handleUpdateDayAttendance}
              onToggleZeroLeaveBonus={handleToggleZeroLeaveBonus}
              onAddGardenChecklistItem={handleAddGardenChecklistItem}
              onToggleGardenChecklistItem={handleToggleGardenChecklistItem}
              onOpenReceiptModal={setReceiptModalPayload}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-3">
              <h2 className="text-base font-bold text-stone-900">
                No Household Staff Added Yet
              </h2>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Add your first household staff member on the Home Dashboard or ID Vault to manage their 30-day attendance calendar and paid leave quota.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Go to Home Dashboard to Add Staff</span>
              </button>
            </div>
          ))}

        {activeTab === 'udhaar' &&
          (staffList.length > 0 ? (
            <UdhaarLoansView
              staffList={staffList}
              selectedStaffId={selectedStaffId}
              onSelectStaffId={setSelectedStaffId}
              cashLedger={cashLedger}
              loans={loans}
              language={language}
              activeMember={activeMember}
              currentDay={currentDay}
              onAddCashEntry={handleAddCashEntry}
              onCreateBadaLoan={handleCreateBadaLoan}
              onTogglePauseLoanEmi={handleTogglePauseLoanEmi}
              onSettleStaffMonth={handleSettleStaffMonth}
              onOpenReceiptModal={setReceiptModalPayload}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-3">
              <h2 className="text-base font-bold text-stone-900">
                No Household Staff Added Yet
              </h2>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Add your first household staff member on the Home Dashboard or ID Vault to log cash advances, multi-month loans, or reimbursements.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Go to Home Dashboard to Add Staff</span>
              </button>
            </div>
          ))}

        {activeTab === 'dhobi_milk' && (
          <DhobiMilkView
            dhobiBatches={dhobiBatches}
            milkConfig={milkConfig}
            activeMember={activeMember}
            currentDay={currentDay}
            onAddDhobiBatch={handleAddDhobiBatch}
            onUpdateDhobiBatchReturn={handleUpdateDhobiBatchReturn}
            onUpdateMilkDay={handleUpdateMilkDay}
            onUpdateMilkSettings={handleUpdateMilkSettings}
          />
        )}

        {activeTab === 'vault_colony' && (
          <StaffVaultColonyView
            staffList={staffList}
            colonySlots={colonySlots}
            language={language}
            activeMember={activeMember}
            onAddNewStaff={handleAddNewStaff}
            onUpdateStaffMember={handleUpdateStaffMember}
            onDeleteStaffMember={handleDeleteStaffMember}
            onToggleReserveSlot={handleToggleReserveSlot}
            onAddColonySlot={handleAddColonySlot}
            onUpdateColonySlot={handleUpdateColonySlot}
            onDeleteColonySlot={handleDeleteColonySlot}
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
            onClick={handleClearAllData}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data (Start Fresh)</span>
          </button>
        </div>
      </footer>

      <OfflineIndicator />

      <WhatsAppAudioSlipModal
        payload={receiptModalPayload}
        language={language}
        onClose={() => setReceiptModalPayload(null)}
      />
    </div>
  );
}
