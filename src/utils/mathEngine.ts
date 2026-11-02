import type {
  BadaUdhaarLoan,
  CashLedgerEntry,
  DhobiBatch,
  DhobiItemCounts,
  MilkConfig,
  OverBorrowingAssessment,
  ParsedHinglishCommand,
  ReceiptModalPayload,
  StaffFinancialBreakdown,
  StaffMember,
} from '../types/khata.ts';

export const DHOBI_RATES = {
  shirts: 7,
  trousers: 10,
  sarees_bedsheets: 25,
  heavy_suits: 120,
} as const;

export function calculateStaffFinancials(
  staff: StaffMember,
  ledgerEntries: CashLedgerEntry[],
  loans: BadaUdhaarLoan[],
  daysElapsedThisMonth = 18
): StaffFinancialBreakdown {
  const dailyRate = staff.customDailyPenalty || Math.round(staff.baseSalary / 30);

  let totalAbsences = 0;
  let halfDaysCount = 0;
  let partialSkippedTasksCount = 0;
  let partialTaskCut = 0;
  let overtimeHoursTotal = 0;
  let partyBhattaPay = 0;

  const attendanceRecords = Object.values(staff.attendance || {});
  for (const record of attendanceRecords) {
    if (record.status === 'absent') {
      totalAbsences += 1;
    } else if (record.status === 'half_day') {
      halfDaysCount += 1;
    }

    if (record.skippedTaskIds && record.skippedTaskIds.length > 0) {
      for (const taskId of record.skippedTaskIds) {
        const taskObj = staff.tasks.find((t) => t.id === taskId);
        const penalty = taskObj ? taskObj.skipPenalty : 50;
        partialSkippedTasksCount += 1;
        partialTaskCut += penalty;
      }
    }

    if (record.overtimeHours && record.overtimeHours > 0) {
      overtimeHoursTotal += record.overtimeHours;
    } else if (
      staff.modelType === 'hourly_visit' &&
      record.hoursWorked &&
      staff.standardVisitHours &&
      record.hoursWorked > staff.standardVisitHours
    ) {
      overtimeHoursTotal += record.hoursWorked - staff.standardVisitHours;
    }

    if (record.partyBhatta && record.partyBhatta > 0) {
      partyBhattaPay += record.partyBhatta;
    }
  }

  const paidLeavesQuota = staff.paidLeaveQuota;
  const paidLeavesUsed = Math.min(totalAbsences, paidLeavesQuota);
  const unpaidLeavesCount = Math.max(0, totalAbsences - paidLeavesQuota);
  const unpaidLeaveCut = unpaidLeavesCount * dailyRate;
  const halfDayCut = Math.round(halfDaysCount * (dailyRate * 0.5));
  const totalLeaveAndHalfDayCut = unpaidLeaveCut + halfDayCut;

  const overtimePay = Math.round(overtimeHoursTotal * staff.hourlyOvertimeRate);

  const zeroLeaveBonus =
    staff.zeroLeaveBonusEnabled && totalAbsences === 0 && halfDaysCount === 0
      ? staff.zeroLeaveBonusAmount
      : 0;

  const staffEntries = ledgerEntries.filter((e) => e.staffId === staff.id);
  const chhotaAdvanceTotal = staffEntries
    .filter((e) => e.bucket === 'chhota_advance')
    .reduce((sum, e) => sum + e.amount, 0);

  const reimbursementsTotal = staffEntries
    .filter((e) => e.bucket === 'reimbursement')
    .reduce((sum, e) => sum + e.amount, 0);

  const staffLoans = loans.filter((l) => l.staffId === staff.id && l.balanceRemaining > 0);
  const activeLoanEmiCut = staffLoans.reduce(
    (sum, loan) =>
      sum + (loan.pausedThisMonth ? 0 : Math.min(loan.monthlyEmi, loan.balanceRemaining)),
    0
  );
  const loanBalanceRemaining = staffLoans.reduce((sum, loan) => sum + loan.balanceRemaining, 0);

  const accruedEarnedSoFar = Math.max(
    0,
    Math.round((staff.baseSalary / 30) * daysElapsedThisMonth) -
      totalLeaveAndHalfDayCut -
      partialTaskCut +
      overtimePay +
      partyBhattaPay
  );

  // Exact Formula from Prompt:
  // Net Left to Pay = Base Salary - Unpaid Leave Cut - Partial Task Cut + Overtime/Extra Hours Pay + Party/Guest Bhatta + Home Purchase Reimbursement - Chhota Advance (Current Month) - Bada Udhaar Monthly EMI (+ Zero-Leave Bonus when applicable)
  const netPayableLeft =
    staff.baseSalary -
    totalLeaveAndHalfDayCut -
    partialTaskCut +
    overtimePay +
    partyBhattaPay +
    zeroLeaveBonus +
    reimbursementsTotal -
    chhotaAdvanceTotal -
    activeLoanEmiCut;

  return {
    baseSalary: staff.baseSalary,
    totalAbsences,
    paidLeavesQuota,
    paidLeavesUsed,
    unpaidLeavesCount,
    dailyRate,
    unpaidLeaveCut: totalLeaveAndHalfDayCut,
    halfDaysCount,
    halfDayCut,
    partialSkippedTasksCount,
    partialTaskCut,
    overtimeHoursTotal,
    overtimePay,
    partyBhattaPay,
    zeroLeaveBonus,
    reimbursementsTotal,
    chhotaAdvanceTotal,
    activeLoanEmiCut,
    loanBalanceRemaining,
    accruedEarnedSoFar,
    netPayableLeft,
  };
}

export function evaluateOverBorrowingRisk(
  financials: StaffFinancialBreakdown,
  proposedAdvanceAmount: number
): OverBorrowingAssessment {
  const earnedSoFar = financials.accruedEarnedSoFar;
  const alreadyBorrowed = financials.chhotaAdvanceTotal;
  const totalBorrowedAfter = alreadyBorrowed + proposedAdvanceAmount;
  const projectedNetPayable = financials.netPayableLeft - proposedAdvanceAmount;

  const excessOverEarned = totalBorrowedAfter - earnedSoFar;
  const isRisk =
    proposedAdvanceAmount > 0 && (excessOverEarned > 0 || projectedNetPayable < 0);

  const excessAmount = Math.max(
    excessOverEarned > 0 ? excessOverEarned : 0,
    projectedNetPayable < 0 ? Math.abs(projectedNetPayable) : 0
  );

  const suggestedThreeMonthEmi = Math.ceil((proposedAdvanceAmount || 1) / 3 / 50) * 50;

  return {
    isRisk,
    earnedSoFar,
    alreadyBorrowed,
    proposedAdvance: proposedAdvanceAmount,
    excessAmount,
    projectedNetPayable,
    suggestedThreeMonthEmi,
  };
}

export function calculateDhobiBatchCost(counts: DhobiItemCounts): {
  totalPieces: number;
  batchCost: number;
} {
  const totalPieces =
    counts.shirts + counts.trousers + counts.sarees_bedsheets + counts.heavy_suits;
  const batchCost =
    counts.shirts * DHOBI_RATES.shirts +
    counts.trousers * DHOBI_RATES.trousers +
    counts.sarees_bedsheets * DHOBI_RATES.sarees_bedsheets +
    counts.heavy_suits * DHOBI_RATES.heavy_suits;
  return { totalPieces, batchCost };
}

export function calculateDhobiSummary(batches: DhobiBatch[]) {
  let totalGiven = 0;
  let totalReturned = 0;
  let totalCost = 0;
  const pendingByCategory: DhobiItemCounts = {
    shirts: 0,
    trousers: 0,
    sarees_bedsheets: 0,
    heavy_suits: 0,
  };

  for (const b of batches) {
    totalGiven += b.totalGiven;
    totalReturned += b.totalReturned;
    totalCost += b.batchCost;

    pendingByCategory.shirts += Math.max(0, b.givenCounts.shirts - b.returnedCounts.shirts);
    pendingByCategory.trousers += Math.max(
      0,
      b.givenCounts.trousers - b.returnedCounts.trousers
    );
    pendingByCategory.sarees_bedsheets += Math.max(
      0,
      b.givenCounts.sarees_bedsheets - b.returnedCounts.sarees_bedsheets
    );
    pendingByCategory.heavy_suits += Math.max(
      0,
      b.givenCounts.heavy_suits - b.returnedCounts.heavy_suits
    );
  }

  const pendingPiecesCount = Math.max(0, totalGiven - totalReturned);
  const parts: string[] = [];
  if (pendingByCategory.sarees_bedsheets > 0) {
    parts.push(
      `${pendingByCategory.sarees_bedsheets} ${
        pendingByCategory.sarees_bedsheets === 1 ? 'Bedsheet/Saree' : 'Bedsheets/Sarees'
      }`
    );
  }
  if (pendingByCategory.shirts > 0) {
    parts.push(
      `${pendingByCategory.shirts} ${pendingByCategory.shirts === 1 ? 'Shirt' : 'Shirts'}`
    );
  }
  if (pendingByCategory.trousers > 0) {
    parts.push(
      `${pendingByCategory.trousers} ${
        pendingByCategory.trousers === 1 ? 'Trouser' : 'Trousers'
      }`
    );
  }
  if (pendingByCategory.heavy_suits > 0) {
    parts.push(
      `${pendingByCategory.heavy_suits} ${
        pendingByCategory.heavy_suits === 1 ? 'Heavy Suit' : 'Heavy Suits'
      }`
    );
  }

  const pendingBreakdownText =
    parts.length > 0 ? `${parts.join(', ')} still with Raju Dhobi` : 'All clothes returned';

  return {
    totalGiven,
    totalReturned,
    pendingPiecesCount,
    pendingByCategory,
    pendingBreakdownText,
    totalCost,
  };
}

export function calculateMilkSummary(milkConfig: MilkConfig, activeDaysCount = 30) {
  let totalLiters = 0;
  let pausedDays = 0;
  let extraDays = 0;
  let sideItemsTotal = 0;

  for (let d = 1; d <= activeDaysCount; d++) {
    const rec = milkConfig.days[d];
    if (!rec) {
      totalLiters += milkConfig.defaultDailyLiters;
    } else {
      totalLiters += rec.liters;
      if (rec.status === 'paused' || rec.liters === 0) pausedDays += 1;
      if (rec.status === 'extra' || rec.liters > milkConfig.defaultDailyLiters) extraDays += 1;
      if (rec.sideItems && rec.sideItems.length > 0) {
        sideItemsTotal += rec.sideItems.reduce((s, item) => s + item.price, 0);
      }
    }
  }

  const milkCost = Math.round(totalLiters * milkConfig.pricePerLiter);
  const grandTotal = milkCost + sideItemsTotal;

  return {
    totalLiters,
    pausedDays,
    extraDays,
    milkCost,
    sideItemsTotal,
    grandTotal,
  };
}

export function parseHinglishCommandLocal(
  rawText: string,
  currentDay = 2
): ParsedHinglishCommand {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Check for Dhobi / Clothes
  if (
    lower.includes('dhobi') ||
    lower.includes('kapde') ||
    lower.includes('shirt') ||
    lower.includes('bedsheet')
  ) {
    const shirtMatch = lower.match(/(\d+)\s*(shirt|kurta)/i);
    const bedsheetMatch = lower.match(/(\d+)\s*(bedsheet|saree|chaddar)/i);
    const trouserMatch = lower.match(/(\d+)\s*(trouser|pant)/i);
    const totalMatch = lower.match(/(\d+)\s*kapde/i);

    const shirts = shirtMatch ? parseInt(shirtMatch[1], 10) : 12;
    const sarees_bedsheets = bedsheetMatch ? parseInt(bedsheetMatch[1], 10) : 4;
    const trousers = trouserMatch ? parseInt(trouserMatch[1], 10) : 0;
    const heavy_suits = 0;

    const breakdown: DhobiItemCounts = {
      shirts,
      trousers,
      sarees_bedsheets,
      heavy_suits,
    };
    const { totalPieces, batchCost } = calculateDhobiBatchCost(breakdown);
    const finalCount = totalPieces > 0 ? totalPieces : totalMatch ? parseInt(totalMatch[1], 10) : 16;

    return {
      workerId: 'raju',
      workerName: 'Raju Dhobi',
      actionType: 'dhobi_give',
      day: currentDay,
      clothCount: finalCount,
      clothBreakdown: breakdown,
      amount: batchCost,
      note: `${shirts} Shirts/Kurtas, ${sarees_bedsheets} Bedsheets given for ironing`,
      summaryEn: `Log ${finalCount} clothes to Raju Dhobi (${shirts} Shirts @ ₹7, ${sarees_bedsheets} Bedsheets @ ₹25)`,
      summaryHi: `राजू धोबी को ${finalCount} कपड़े दिए (${shirts} शर्ट, ${sarees_bedsheets} बेडशीट) • कुल ₹${batchCost}`,
      salaryImpactText: `+₹${batchCost} Dhobi Ironing Batch (${finalCount} pcs pending return)`,
    };
  }

  // 2. Check for Milk / Dairy / Paneer / Ghee
  if (
    lower.includes('doodh') ||
    lower.includes('milk') ||
    lower.includes('paneer') ||
    lower.includes('ghee') ||
    lower.includes('liter')
  ) {
    const literMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:liter|litre|l\b)/i);
    const extraLiters = literMatch ? parseFloat(literMatch[1]) : 1;

    let sideItemName: string | undefined;
    let sideItemCost = 0;
    if (lower.includes('paneer')) {
      sideItemName = 'Fresh Malai Paneer';
      const rupeeMatch = lower.match(/(\d+)\s*(?:rupaye|rs|₹)/i) || lower.match(/₹\s*(\d+)/i);
      sideItemCost = rupeeMatch ? parseInt(rupeeMatch[1], 10) : 200;
    } else if (lower.includes('ghee')) {
      sideItemName = 'Desi Ghee';
      const rupeeMatch = lower.match(/(\d+)\s*(?:rupaye|rs|₹)/i) || lower.match(/₹\s*(\d+)/i);
      sideItemCost = rupeeMatch ? parseInt(rupeeMatch[1], 10) : 650;
    }

    const extraMilkCost = Math.round(extraLiters * 70);
    const totalAdded = extraMilkCost + sideItemCost;

    return {
      workerId: 'milk',
      workerName: 'Bhola Dairy & Milk',
      actionType: 'milk_exception',
      day: currentDay,
      milkExtraLiters: extraLiters,
      sideItemName,
      sideItemCost,
      amount: totalAdded,
      note: `+${extraLiters}L Extra Milk${sideItemName ? ` + ₹${sideItemCost} ${sideItemName}` : ''}`,
      summaryEn: `Add +${extraLiters}L Extra Buffalo Milk (₹${extraMilkCost})${
        sideItemName ? ` + ${sideItemName} (₹${sideItemCost})` : ''
      }`,
      summaryHi: `आज +${extraLiters} लीटर एक्स्ट्रा दूध${
        sideItemName ? ` और ₹${sideItemCost} का पनीर/घी` : ''
      } जोड़ा गया`,
      salaryImpactText: `+₹${totalAdded} added to November Dairy Bill`,
    };
  }

  // 3. Identify Staff Member
  let workerId = 'sunita';
  let workerName = 'Sunita Didi';
  if (lower.includes('ramesh') || lower.includes('mali')) {
    workerId = 'ramesh';
    workerName = 'Ramesh Bhaiya (Mali)';
  } else if (lower.includes('guddu') || lower.includes('driver')) {
    workerId = 'guddu';
    workerName = 'Guddu Verma (Driver)';
  } else if (lower.includes('rekha') || lower.includes('cook') || lower.includes('mausi')) {
    workerId = 'rekha';
    workerName = 'Rekha Mausi (Cook)';
  }

  // Extract hours & rupee amounts
  const hoursMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hr|hrs|ghante)/i);
  const hours = hoursMatch ? parseFloat(hoursMatch[1]) : undefined;

  const amountMatches = [...lower.matchAll(/(?:₹\s*(\d+)|(\d+)\s*(?:rupaye|rs|advance|khad|pots|cylinder))/gi)];
  let amount = 0;
  if (amountMatches.length > 0) {
    const m = amountMatches[0];
    amount = parseInt(m[1] || m[2], 10);
  } else {
    const fallbackNum = lower.match(/\b(\d{3,5})\b/);
    if (fallbackNum) amount = parseInt(fallbackNum[1], 10);
  }

  // Case A: Ramesh Mali worked hours + bought khad/pots reimbursement
  if (
    workerId === 'ramesh' &&
    hours &&
    (lower.includes('bought') || lower.includes('khad') || lower.includes('pot'))
  ) {
    const extraHours = Math.max(0, hours - 3);
    const overtimeAdd = Math.round(extraHours * 150);
    return {
      workerId,
      workerName,
      actionType: 'hours_and_reimbursement',
      day: currentDay,
      hours,
      amount: amount || 300,
      note: `Worked ${hours} hrs + Bought khad & pots (₹${amount || 300})`,
      summaryEn: `Log ${hours} hrs gardening visit (+${extraHours}h OT = +₹${overtimeAdd}) & +₹${
        amount || 300
      } Home Purchase Reimbursement`,
      summaryHi: `रमेश माली: ${hours} घंटे काम और ₹${amount || 300} खाद/गमले का खर्च पगार में जोड़ा गया`,
      salaryImpactText: `+₹${(amount || 300) + overtimeAdd} Added to Net Payable (Reimbursement + OT)`,
    };
  }

  // Case B: Driver / Staff Overtime
  if (lower.includes('overtime') || (workerId === 'guddu' && hours)) {
    const otHours = hours || 3;
    const rate = workerId === 'guddu' ? 120 : 150;
    const otPay = Math.round(otHours * rate);
    return {
      workerId,
      workerName,
      actionType: 'overtime',
      day: currentDay,
      hours: otHours,
      amount: otPay,
      note: `${otHours} hrs overtime after 9 PM party`,
      summaryEn: `Log ${otHours} hours overtime for ${workerName} @ ₹${rate}/hr`,
      summaryHi: `${workerName}: ${otHours} घंटे ओवरटाइम (+₹${otPay}) पगार में जोड़ा गया`,
      salaryImpactText: `+₹${otPay} Overtime Added to Net Payable`,
    };
  }

  // Case C: Absent + Advance (e.g., Sunita didi aaj nahi aayi aur kal ₹500 cylinder ke liye advance liya tha)
  const isAbsent =
    lower.includes('nahi aayi') ||
    lower.includes('nahi aaya') ||
    lower.includes('absent') ||
    lower.includes('chhutti');
  const isAdvance =
    lower.includes('advance') ||
    lower.includes('udhaar') ||
    lower.includes('liya') ||
    lower.includes('cylinder');

  if (isAbsent && isAdvance && amount > 0) {
    return {
      workerId,
      workerName,
      actionType: 'absent_and_advance',
      day: currentDay,
      amount,
      note: 'Absent today + Cash advance for gas cylinder',
      summaryEn: `Mark Absent on ${currentDay} Nov (Paid Leave Quota Check) & Deduct ₹${amount} Chhota Advance`,
      summaryHi: `सुनीता दीदी: आज की छुट्टी और ₹${amount} सिलेंडर एडवांस नोट किया गया`,
      salaryImpactText: `-₹${amount} Chhota Advance deducted from November Net Payable`,
    };
  }

  if (isAbsent) {
    return {
      workerId,
      workerName,
      actionType: 'absent',
      day: currentDay,
      note: 'Marked full-day absent via voice ledger',
      summaryEn: `Mark ${workerName} Absent on ${currentDay} Nov`,
      summaryHi: `${workerName} की आज (${currentDay} नवंबर) की छुट्टी दर्ज की गई`,
      salaryImpactText: `Uses 1 Leave (₹0 cut if within 2 Paid Leaves quota)`,
    };
  }

  if (
    lower.includes('reimburse') ||
    lower.includes('bought') ||
    lower.includes('khad') ||
    lower.includes('petrol') ||
    lower.includes('parking')
  ) {
    const reimbAmt = amount || 300;
    return {
      workerId,
      workerName,
      actionType: 'reimbursement',
      day: currentDay,
      amount: reimbAmt,
      note: 'Home purchase reimbursement from pocket',
      summaryEn: `Add +₹${reimbAmt} Home Purchase Reimbursement for ${workerName}`,
      summaryHi: `${workerName} के घर के सामान के ₹${reimbAmt} पगार में जोड़े गए`,
      salaryImpactText: `+₹${reimbAmt} Added to Net Payable (Reverse Udhaar)`,
    };
  }

  // Default: Cash Advance
  const advAmount = amount || 500;
  return {
    workerId,
    workerName,
    actionType: 'advance',
    day: currentDay,
    amount: advAmount,
    note: text,
    summaryEn: `Log ₹${advAmount} Chhota Advance for ${workerName}`,
    summaryHi: `${workerName} का ₹${advAmount} एडवांस खाते में दर्ज किया गया`,
    salaryImpactText: `-₹${advAmount} deducted from current month Net Payable`,
  };
}

export function buildHindiVoiceScript(payload: ReceiptModalPayload): string {
  if (payload.customHindiSpeech) return payload.customHindiSpeech;
  const actionPhrase = payload.amountChanged
    ? payload.isAddition
      ? `aapke khate mein ₹${payload.amountChanged.toLocaleString('en-IN')} jode gaye hain`
      : `aapka ₹${payload.amountChanged.toLocaleString('en-IN')} ${payload.entryTypeLabelHi} note kiya gaya hai`
    : `aapki haziri (${payload.entryTypeLabelHi}) update ki gayi hai`;

  return `Namaste ${payload.staffName}. GharKhata hisab update: Aaj ${payload.dateStr} ko ${actionPhrase}. Iss mahine aapki ${payload.paidLeavesUsed} chhutti ho chuki hain aur kul advance ₹${payload.totalBorrowedThisMonth.toLocaleString('en-IN')} hai. Abhi aapki baki pagar ₹${payload.netPayableLeft.toLocaleString('en-IN')} bachi hai. Dhanyavaad.`;
}

export function buildWhatsAppShareText(payload: ReceiptModalPayload): string {
  const lines = [
    `*GharKhata (घरखाता) — Official Hisab Slip*`,
    `--------------------------------`,
    `👤 *Staff:* ${payload.staffName} (${payload.staffNameHi})`,
    `📅 *Date:* ${payload.dateStr}`,
    `📝 *Update:* ${payload.entryTypeLabel} (${payload.entryTypeLabelHi})`,
    payload.amountChanged
      ? `💵 *Amount:* ${payload.isAddition ? '+' : '-'}₹${payload.amountChanged.toLocaleString('en-IN')}`
      : null,
    `🍃 *Leaves Used:* ${payload.paidLeavesUsed} / ${payload.paidLeaveQuota} Paid Quota`,
    `💳 *Chhota Advance Taken:* ₹${payload.totalBorrowedThisMonth.toLocaleString('en-IN')}`,
    payload.activeEmiCut > 0
      ? `🏦 *Bada Udhaar EMI Cut:* ₹${payload.activeEmiCut.toLocaleString('en-IN')}/mo`
      : null,
    payload.reimbursementsThisMonth > 0
      ? `🌱 *Home Purchase Reimbursement:* +₹${payload.reimbursementsThisMonth.toLocaleString('en-IN')}`
      : null,
    `--------------------------------`,
    `✅ *NET MONEY LEFT TO GIVE (बाकी पगार): ₹${payload.netPayableLeft.toLocaleString('en-IN')}*`,
    `--------------------------------`,
    `_Logged by ${payload.loggedBy} via GharKhata_`,
  ].filter(Boolean);

  return lines.join('\n');
}
