export type Language = 'en' | 'hinglish' | 'hi';

export type FamilyMember = 'Mummy (Priya)' | 'Papa (Anurag)' | 'Dadi';

export type WorkerModelType = 'fixed_monthly' | 'hourly_visit';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'late'
  | 'partial_skip';

export interface StaffTask {
  id: string;
  labelEn: string;
  labelHi: string;
  skipPenalty: number; // default ₹50 flat adjustment when skipped
}

export interface DayAttendanceRecord {
  day: number; // 1..30 (November)
  status: AttendanceStatus;
  lateMinutes?: number;
  skippedTaskIds?: string[]; // Tasks skipped on that day
  partyBhatta?: number; // e.g. +150 or +250
  partyNote?: string;
  hoursWorked?: number; // For hourly/per-visit staff
  checkInTime?: string;
  checkOutTime?: string;
  overtimeHours?: number;
  visitNote?: string;
  loggedBy: FamilyMember;
  loggedAt: string;
}

export type CashBucketType =
  | 'chhota_advance'
  | 'bada_udhaar_loan'
  | 'reimbursement';

export interface CashLedgerEntry {
  id: string;
  staffId: string;
  day: number;
  dateStr: string;
  bucket: CashBucketType;
  amount: number;
  reason: string;
  loggedBy: FamilyMember;
  loggedAt: string;
}

export interface BadaUdhaarLoan {
  id: string;
  staffId: string;
  purpose: string;
  totalPrincipal: number;
  monthlyEmi: number;
  balanceRemaining: number;
  startDate: string;
  pausedThisMonth: boolean;
  pauseReason?: string;
  loggedBy: FamilyMember;
}

export interface GardenChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  addedBy: FamilyMember;
}

export interface StaffMember {
  id: string;
  name: string;
  nameHi: string;
  role: string;
  roleHi: string;
  phone: string;
  modelType: WorkerModelType;
  baseSalary: number; // e.g., 4500 for fixed, 1600 for 4 Sunday visits
  paidLeaveQuota: number; // default 2
  customDailyPenalty?: number; // optional override for Salary / 30
  zeroLeaveBonusEnabled: boolean;
  zeroLeaveBonusAmount: number; // default ₹200
  standardVisitHours?: number; // e.g. 3 hrs per Sunday visit
  hourlyOvertimeRate: number; // e.g., ₹150/hr for Mali, ₹120/hr for Driver
  tasks: StaffTask[];
  attendance: Record<number, DayAttendanceRecord>;
  gardenChecklist?: GardenChecklistItem[];
  settledForMonth?: boolean;
  settledDate?: string;
  settledUpiRef?: string;
  // KYC & Reference Vault
  kyc: {
    maskedAadhaar: string;
    homeVillage: string;
    emergencyContact: string;
    policeVerified: boolean;
    policeVerificationId: string;
    neighborReference: string;
    upiId: string;
    joinedSince: string;
  };
}

export interface StaffFinancialBreakdown {
  baseSalary: number;
  totalAbsences: number;
  paidLeavesQuota: number;
  paidLeavesUsed: number;
  unpaidLeavesCount: number;
  dailyRate: number;
  unpaidLeaveCut: number;
  halfDaysCount: number;
  halfDayCut: number;
  partialSkippedTasksCount: number;
  partialTaskCut: number;
  overtimeHoursTotal: number;
  overtimePay: number;
  partyBhattaPay: number;
  zeroLeaveBonus: number;
  reimbursementsTotal: number;
  chhotaAdvanceTotal: number;
  activeLoanEmiCut: number;
  loanBalanceRemaining: number;
  accruedEarnedSoFar: number;
  netPayableLeft: number;
}

export interface OverBorrowingAssessment {
  isRisk: boolean;
  earnedSoFar: number;
  alreadyBorrowed: number;
  proposedAdvance: number;
  excessAmount: number;
  projectedNetPayable: number;
  suggestedThreeMonthEmi: number;
}

export interface DhobiItemCounts {
  shirts: number; // @ ₹7
  trousers: number; // @ ₹10
  sarees_bedsheets: number; // @ ₹25
  heavy_suits: number; // @ ₹120
}

export interface DhobiBatch {
  id: string;
  givenDate: string;
  day: number;
  givenCounts: DhobiItemCounts;
  returnedCounts: DhobiItemCounts;
  totalGiven: number;
  totalReturned: number;
  batchCost: number;
  note?: string;
  loggedBy: FamilyMember;
  loggedAt: string;
}

export interface MilkSideItem {
  id: string;
  name: string;
  price: number;
}

export interface MilkDayRecord {
  day: number;
  status: 'default' | 'paused' | 'extra';
  liters: number; // 0 if paused, 2.0 if default, 3.0 if +1L extra
  sideItems: MilkSideItem[];
  loggedBy: FamilyMember;
  loggedAt?: string;
}

export interface MilkConfig {
  vendorName: string;
  milkType: string;
  defaultDailyLiters: number;
  pricePerLiter: number;
  days: Record<number, MilkDayRecord>;
}

export interface ColonyFreeSlot {
  id: string;
  workerName: string;
  role: string;
  phone: string;
  timeSlot: string;
  daysAvailable: string;
  blockLocation: string;
  expectedRate: string;
  referredByNeighbor: string;
  policeVerified: boolean;
  rating: string;
  reservedByUser?: boolean;
}

export interface ParsedHinglishCommand {
  workerId: string;
  workerName: string;
  actionType:
    | 'absent_and_advance'
    | 'absent'
    | 'half_day'
    | 'advance'
    | 'reimbursement'
    | 'hours_and_reimbursement'
    | 'overtime'
    | 'party_bhatta'
    | 'dhobi_give'
    | 'milk_exception';
  day: number;
  amount?: number;
  hours?: number;
  clothCount?: number;
  clothBreakdown?: DhobiItemCounts;
  milkExtraLiters?: number;
  sideItemName?: string;
  sideItemCost?: number;
  note: string;
  summaryEn: string;
  summaryHi: string;
  salaryImpactText: string;
}

export interface ReceiptModalPayload {
  staffName: string;
  staffNameHi: string;
  phone: string;
  entryTypeLabel: string;
  entryTypeLabelHi: string;
  dateStr: string;
  amountChanged?: number;
  isAddition?: boolean;
  paidLeavesUsed: number;
  paidLeaveQuota: number;
  totalBorrowedThisMonth: number;
  reimbursementsThisMonth: number;
  activeEmiCut: number;
  netPayableLeft: number;
  loggedBy: FamilyMember;
  customHindiSpeech?: string;
}
