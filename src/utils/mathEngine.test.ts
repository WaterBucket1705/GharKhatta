import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStaffFinancials,
  evaluateOverBorrowingRisk,
  calculateDhobiSummary,
  calculateMilkSummary,
  parseHinglishCommandLocal,
} from './mathEngine';
import {
  INITIAL_STAFF,
  INITIAL_CASH_LEDGER,
  INITIAL_LOANS,
  INITIAL_DHOBI_BATCHES,
  INITIAL_MILK_CONFIG,
} from '../data/initialData';

test('Sunita Didi live Net Left to Pay follows exact 3-bucket + paid leave quota formula', () => {
  const sunita = INITIAL_STAFF.find((s) => s.id === 'sunita')!;
  const financials = calculateStaffFinancials(sunita, INITIAL_CASH_LEDGER, INITIAL_LOANS, 18);

  // Sunita Base = 4500, Paid Leaves = 2/2 used (0 cut), Advance = 800, EMI = 500
  assert.equal(financials.baseSalary, 4500);
  assert.equal(financials.paidLeavesUsed, 2);
  assert.equal(financials.unpaidLeavesCount, 0);
  assert.equal(financials.unpaidLeaveCut, 0);
  assert.equal(financials.chhotaAdvanceTotal, 800);
  assert.equal(financials.activeLoanEmiCut, 500);
  assert.equal(financials.netPayableLeft, 3200);
});

test('3rd absence beyond 2 Paid Leaves quota automatically deducts daily rate (Salary / 30)', () => {
  const sunita = structuredClone(INITIAL_STAFF.find((s) => s.id === 'sunita')!);
  sunita.attendance[18] = {
    day: 18,
    status: 'absent',
    loggedBy: 'Mummy (Priya)',
    loggedAt: '9:10 AM',
  };

  const financials = calculateStaffFinancials(sunita, INITIAL_CASH_LEDGER, INITIAL_LOANS, 18);
  assert.equal(financials.totalAbsences, 3);
  assert.equal(financials.paidLeavesUsed, 2);
  assert.equal(financials.unpaidLeavesCount, 1);
  assert.equal(financials.unpaidLeaveCut, 150); // 4500 / 30 = 150
  assert.equal(financials.netPayableLeft, 3050);
});

test('Task-level partial skip deducts flat ₹50 without marking full absence', () => {
  const sunita = structuredClone(INITIAL_STAFF.find((s) => s.id === 'sunita')!);
  sunita.attendance[17] = {
    day: 17,
    status: 'partial_skip',
    skippedTaskIds: ['evening_bartan'],
    loggedBy: 'Dadi',
    loggedAt: '7:30 PM',
  };

  const financials = calculateStaffFinancials(sunita, INITIAL_CASH_LEDGER, INITIAL_LOANS, 18);
  assert.equal(financials.partialTaskCut, 50);
  assert.equal(financials.netPayableLeft, 3150);
});

test('Ramesh Mali hourly overtime and Reverse Udhaar reimbursement add to salary', () => {
  const ramesh = INITIAL_STAFF.find((s) => s.id === 'ramesh')!;
  const financials = calculateStaffFinancials(ramesh, INITIAL_CASH_LEDGER, INITIAL_LOANS, 18);

  // Base 1600 + 1 hr overtime (150) + 350 reimbursement = 2100
  assert.equal(financials.baseSalary, 1600);
  assert.equal(financials.reimbursementsTotal, 350);
  assert.equal(financials.overtimePay, 150);
  assert.equal(financials.netPayableLeft, 2100);
});

test('Over-Borrowing Risk Guardrail triggers when proposed advance exceeds accrued earned so far', () => {
  const sunita = INITIAL_STAFF.find((s) => s.id === 'sunita')!;
  // At 15 days elapsed: accrued = (4500/30)*15 = 2250. Already borrowed = 800.
  const financials = calculateStaffFinancials(sunita, INITIAL_CASH_LEDGER, INITIAL_LOANS, 15);
  assert.equal(financials.accruedEarnedSoFar, 2250);

  const riskCheck = evaluateOverBorrowingRisk(financials, 1900);
  assert.equal(riskCheck.isRisk, true);
  assert.equal(riskCheck.excessAmount, 450); // (800 + 1900) - 2250 = 450
  assert.ok(riskCheck.suggestedThreeMonthEmi > 0);
});

test('Dhobi piece-count tracker accurately computes pending unreturned items and cost', () => {
  const summary = calculateDhobiSummary(INITIAL_DHOBI_BATCHES);
  assert.equal(summary.pendingPiecesCount, 3);
  assert.equal(summary.pendingByCategory.sarees_bedsheets, 1);
  assert.equal(summary.pendingByCategory.shirts, 2);
  assert.match(summary.pendingBreakdownText, /1 Bedsheet\/Saree, 2 Shirts still with Raju Dhobi/);
});

test('Milkman exception calendar computes paused days, extra liters, and side items', () => {
  const summary = calculateMilkSummary(INITIAL_MILK_CONFIG, 30);
  assert.ok(summary.pausedDays >= 2);
  assert.ok(summary.extraDays >= 2);
  assert.equal(summary.sideItemsTotal, 790); // 140 Paneer + 650 Desi Ghee
  assert.ok(summary.grandTotal > 4000);
});

test('Hinglish NLP parser accurately parses all 5 signature voice chips', () => {
  const chip1 = parseHinglishCommandLocal(
    'Sunita didi aaj nahi aayi aur kal ₹500 cylinder ke liye advance liya tha',
    2
  );
  assert.equal(chip1.workerId, 'sunita');
  assert.equal(chip1.actionType, 'absent_and_advance');
  assert.equal(chip1.amount, 500);

  const chip2 = parseHinglishCommandLocal(
    'Ramesh mali bhaiya worked 3.5 hours today and bought ₹300 khad and pots',
    2
  );
  assert.equal(chip2.workerId, 'ramesh');
  assert.equal(chip2.actionType, 'hours_and_reimbursement');
  assert.equal(chip2.hours, 3.5);
  assert.equal(chip2.amount, 300);

  const chip3 = parseHinglishCommandLocal(
    'Raju dhobi ko 16 kapde diye, 12 shirt aur 4 bedsheet',
    2
  );
  assert.equal(chip3.workerId, 'raju');
  assert.equal(chip3.actionType, 'dhobi_give');
  assert.equal(chip3.clothCount, 16);
  assert.equal(chip3.amount, 12 * 7 + 4 * 25); // 84 + 100 = 184

  const chip4 = parseHinglishCommandLocal(
    'Guddu driver did 3 hours overtime last night after 9 PM party',
    2
  );
  assert.equal(chip4.workerId, 'guddu');
  assert.equal(chip4.actionType, 'overtime');
  assert.equal(chip4.hours, 3);
  assert.equal(chip4.amount, 360);

  const chip5 = parseHinglishCommandLocal(
    'Aaj 1 liter extra doodh liya aur 200 rupaye ka paneer',
    2
  );
  assert.equal(chip5.workerId, 'milk');
  assert.equal(chip5.actionType, 'milk_exception');
  assert.equal(chip5.milkExtraLiters, 1);
  assert.equal(chip5.sideItemCost, 200);
});
