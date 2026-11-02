import React, { useState } from 'react';
import {
  Check,
  Clock,
  Sparkles,
  Share2,
  Plus,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  AttendanceStatus,
  BadaUdhaarLoan,
  CashLedgerEntry,
  DayAttendanceRecord,
  FamilyMember,
  ReceiptModalPayload,
  StaffMember,
} from '../types/khata';
import { calculateStaffFinancials } from '../utils/mathEngine';

interface AttendanceCalendarViewProps {
  staffList: StaffMember[];
  selectedStaffId: string;
  onSelectStaffId: (id: string) => void;
  cashLedger: CashLedgerEntry[];
  loans: BadaUdhaarLoan[];
  activeMember: FamilyMember;
  currentDay: number;
  onUpdateDayAttendance: (staffId: string, day: number, record: DayAttendanceRecord) => void;
  onToggleZeroLeaveBonus: (staffId: string) => void;
  onAddGardenChecklistItem: (staffId: string, text: string) => void;
  onToggleGardenChecklistItem: (staffId: string, itemId: string) => void;
  onOpenReceiptModal: (payload: ReceiptModalPayload) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  staffList,
  selectedStaffId,
  onSelectStaffId,
  cashLedger,
  loans,
  activeMember,
  currentDay,
  onUpdateDayAttendance,
  onToggleZeroLeaveBonus,
  onAddGardenChecklistItem,
  onToggleGardenChecklistItem,
  onOpenReceiptModal,
}) => {
  const staff = staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  const [selectedDay, setSelectedDay] = useState<number>(currentDay);
  const [newGardenNote, setNewGardenNote] = useState('');

  const fin = calculateStaffFinancials(staff, cashLedger, loans, currentDay);
  const dayRecord: DayAttendanceRecord = staff.attendance[selectedDay] || {
    day: selectedDay,
    status: 'present',
    skippedTaskIds: [],
    partyBhatta: 0,
    hoursWorked: staff.standardVisitHours || 3,
    overtimeHours: 0,
    loggedBy: activeMember,
    loggedAt: '09:00 AM',
  };

  const handleStatusChange = (status: AttendanceStatus) => {
    const nowTime = '09:15 AM';
    const updated: DayAttendanceRecord = {
      ...dayRecord,
      day: selectedDay,
      status,
      loggedBy: activeMember,
      loggedAt: nowTime,
    };
    onUpdateDayAttendance(staff.id, selectedDay, updated);
  };

  const handleToggleSkippedTask = (taskId: string) => {
    const currentSkipped = dayRecord.skippedTaskIds || [];
    const exists = currentSkipped.includes(taskId);
    const nextSkipped = exists
      ? currentSkipped.filter((id) => id !== taskId)
      : [...currentSkipped, taskId];

    const updated: DayAttendanceRecord = {
      ...dayRecord,
      day: selectedDay,
      status: nextSkipped.length > 0 ? 'partial_skip' : 'present',
      skippedTaskIds: nextSkipped,
      loggedBy: activeMember,
      loggedAt: '09:20 AM',
    };
    onUpdateDayAttendance(staff.id, selectedDay, updated);
  };

  const handleAddPartyBhatta = (amount: number) => {
    const nextBhatta = dayRecord.partyBhatta === amount ? 0 : amount;
    const updated: DayAttendanceRecord = {
      ...dayRecord,
      day: selectedDay,
      partyBhatta: nextBhatta,
      partyNote: nextBhatta > 0 ? 'Extra dishes & guest cooking bonus' : undefined,
      loggedBy: activeMember,
      loggedAt: '09:25 AM',
    };
    onUpdateDayAttendance(staff.id, selectedDay, updated);
  };

  const handleUpdateHoursOrOvertime = (hoursWorked: number, overtimeHours: number) => {
    const updated: DayAttendanceRecord = {
      ...dayRecord,
      day: selectedDay,
      status: 'present',
      checkInTime: dayRecord.checkInTime || '09:00 AM',
      checkOutTime: hoursWorked >= 4 ? '01:00 PM' : '12:30 PM',
      hoursWorked,
      overtimeHours,
      loggedBy: activeMember,
      loggedAt: '12:35 PM',
    };
    onUpdateDayAttendance(staff.id, selectedDay, updated);
  };

  return (
    <div className="space-y-6">
      {/* Staff Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-4">
        <div
          role="group"
          aria-label="Select Staff Member for Attendance Calendar"
          className="flex flex-wrap items-center gap-2"
        >
          {staffList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectStaffId(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                s.id === staff.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-[#FAF8F5] text-stone-700 hover:bg-stone-200 border border-stone-200'
              }`}
            >
              {s.name} ({s.modelType === 'hourly_visit' ? 'Hourly/Visit' : 'Monthly Fixed'})
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onOpenReceiptModal({
              staffName: staff.name,
              staffNameHi: staff.nameHi,
              phone: staff.phone,
              entryTypeLabel: `Day ${selectedDay} Nov Attendance Update`,
              entryTypeLabelHi: `${selectedDay} नवंबर हाज़िरी अपडेट`,
              dateStr: `${selectedDay} Nov 2026`,
              paidLeavesUsed: fin.paidLeavesUsed,
              paidLeaveQuota: fin.paidLeavesQuota,
              totalBorrowedThisMonth: fin.chhotaAdvanceTotal,
              reimbursementsThisMonth: fin.reimbursementsTotal,
              activeEmiCut: fin.activeLoanEmiCut,
              netPayableLeft: fin.netPayableLeft,
              loggedBy: activeMember,
            })
          }
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Send WhatsApp + Hindi Voice Slip</span>
        </button>
      </div>

      {/* Live Salary Calculation Breakdown Bar */}
      <section
        aria-label="Live Salary Calculation Breakdown Bar"
        className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              {staff.name} — Live Salary Calculation Breakdown (Nov 2026)
            </h2>
            <p className="text-xs text-stone-500">
              {staff.modelType === 'fixed_monthly'
                ? `Paid Leave Quota Engine: First ${staff.paidLeaveQuota} absences = ₹0 Cut · Leave #${
                    staff.paidLeaveQuota + 1
                  }+ deducts ₹${fin.dailyRate}/day`
                : `Hourly & Weekly Visit Engine: Standard shift ${staff.standardVisitHours} hrs · Extra hours auto-multiply @ +₹${staff.hourlyOvertimeRate}/hr`}
            </p>
          </div>

          {staff.modelType === 'fixed_monthly' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onToggleZeroLeaveBonus(staff.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  staff.zeroLeaveBonusEnabled
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                    : 'bg-stone-100 border-stone-300 text-stone-600'
                }`}
              >
                Zero-Leave Punctuality Bonus (+₹{staff.zeroLeaveBonusAmount}):{' '}
                {staff.zeroLeaveBonusEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
            <span className="text-stone-500 block">Base Salary</span>
            <span className="text-base font-mono-num font-bold text-stone-900">
              ₹{fin.baseSalary.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
            <span className="text-stone-500 block">Paid Leaves Quota</span>
            <span className="text-base font-mono-num font-bold text-emerald-700">
              {fin.paidLeavesUsed} / {fin.paidLeavesQuota} (₹0 Cut)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
            <span className="text-stone-500 block">Unpaid / Half-Day Cut</span>
            <span className="text-base font-mono-num font-bold text-rose-600">
              -₹{fin.unpaidLeaveCut.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
            <span className="text-stone-500 block">Partial Task Skip Cut</span>
            <span className="text-base font-mono-num font-bold text-rose-600">
              -₹{fin.partialTaskCut.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
            <span className="text-stone-500 block">OT + Bhatta + Bonus</span>
            <span className="text-base font-mono-num font-bold text-emerald-700">
              +₹{(fin.overtimePay + fin.partyBhattaPay + fin.zeroLeaveBonus).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
            <span className="text-stone-500 block">Advances & EMI Cut</span>
            <span className="text-base font-mono-num font-bold text-amber-700">
              -₹{(fin.chhotaAdvanceTotal + fin.activeLoanEmiCut).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
            <span className="text-emerald-900 font-semibold block">Net Left to Pay</span>
            <span
              data-testid="calendar-net-payable"
              className="text-lg font-mono-num font-bold text-emerald-800"
            >
              ₹{fin.netPayableLeft.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </section>

      {/* Main Split: 30-Day Monthly Calendar Grid + Selected Date Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive 30-Day Calendar Grid */}
        <div className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">
              November 2026 Attendance Grid (Tap any date)
            </h3>
            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span>Present (Auto)</span>
              <span>·</span>
              <span className="text-rose-600 font-medium">Absent</span>
              <span>·</span>
              <span className="text-amber-700 font-medium">Task Skip / Half-Day</span>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-stone-500 pb-1">
            {WEEKDAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Nov 1, 2026 starts on Sunday */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 30 }, (_, idx) => idx + 1).map((dayNum) => {
              const rec = staff.attendance[dayNum];
              const st = rec?.status || (dayNum <= currentDay ? 'present' : 'present');
              const isSelected = selectedDay === dayNum;
              const hasOtOrBhatta =
                (rec?.overtimeHours && rec.overtimeHours > 0) ||
                (rec?.partyBhatta && rec.partyBhatta > 0);

              let cellBg = 'bg-[#FAF8F5] text-stone-800 border-stone-200';
              if (st === 'absent') {
                cellBg = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
              } else if (st === 'half_day' || st === 'partial_skip') {
                cellBg = 'bg-amber-50 text-amber-900 border-amber-300 font-semibold';
              } else if (hasOtOrBhatta) {
                cellBg = 'bg-emerald-50 text-emerald-900 border-emerald-400 font-semibold';
              }

              return (
                <button
                  key={dayNum}
                  type="button"
                  aria-label={`Day ${dayNum} November`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`min-h-[58px] p-1.5 rounded-xl border transition-all flex flex-col items-center justify-between ${cellBg} ${
                    isSelected ? 'ring-2 ring-stone-900 border-stone-900' : 'hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs font-mono-num">{dayNum}</span>
                  <span className="text-[10px] leading-tight truncate max-w-full">
                    {st === 'absent'
                      ? 'Absent'
                      : st === 'half_day'
                      ? 'Half-Day'
                      : st === 'partial_skip'
                      ? `-₹${(rec?.skippedTaskIds?.length || 1) * 50}`
                      : rec?.partyBhatta
                      ? `+₹${rec.partyBhatta}`
                      : rec?.overtimeHours
                      ? `+${rec.overtimeHours}h OT`
                      : dayNum <= currentDay
                      ? 'Present'
                      : 'Auto'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Day Exception & Task/Hours Controls */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-5 space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-stone-500">
                Selected Date · Logged by {dayRecord.loggedBy}
              </span>
              <h3 className="text-lg font-bold text-stone-900">
                {selectedDay} November 2026 — {staff.name}
              </h3>
            </div>
            <span className="text-xs font-mono-num text-stone-500">{dayRecord.loggedAt}</span>
          </div>

          {/* Attendance Status Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 block">
              1. Attendance Status (Auto-Present Default)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('present')}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  dayRecord.status === 'present'
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Present (Full Day)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('absent')}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  dayRecord.status === 'absent'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-rose-50'
                }`}
              >
                Absent (Full Day)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('half_day')}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  dayRecord.status === 'half_day'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-amber-50'
                }`}
              >
                Half-Day (50% Cut)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('late')}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                  dayRecord.status === 'late'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Late Arrival (30m+)
              </button>
            </div>
          </div>

          {/* Task-Level Partial Skip Checklist */}
          <div className="space-y-2 pt-2 border-t border-stone-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700">
                2. Task-Level Partial Skip (Uncheck skipped task for flat -₹50 cut)
              </label>
            </div>
            <div className="space-y-2">
              {staff.tasks.map((task) => {
                const isSkipped = (dayRecord.skippedTaskIds || []).includes(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleToggleSkippedTask(task.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-colors flex items-center justify-between ${
                      isSkipped
                        ? 'bg-rose-50/80 border-rose-300 text-rose-900'
                        : 'bg-[#FAF8F5] border-stone-200 text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isSkipped ? (
                        <Square className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <CheckSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-semibold">{task.labelEn}</p>
                        <p className="text-[11px] text-stone-500">{task.labelHi}</p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-mono-num font-semibold ${
                        isSkipped ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {isSkipped ? `-₹${task.skipPenalty} Skipped` : 'Done'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guest / Party Bhatta & Overtime Hours */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <label className="text-xs font-semibold text-stone-700 block">
              3. Guest / Party Bhatta & Overtime Hours
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddPartyBhatta(200)}
                className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  dayRecord.partyBhatta === 200
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-[#FAF8F5] text-stone-800 border-stone-300 hover:bg-emerald-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+₹200 Guest Party Bhatta</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPartyBhatta(150)}
                className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  dayRecord.partyBhatta === 150
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-[#FAF8F5] text-stone-800 border-stone-300 hover:bg-emerald-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+₹150 Extra Bartan</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddPartyBhatta(250)}
                className={`px-3 py-2 min-h-[40px] rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  dayRecord.partyBhatta === 250
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-[#FAF8F5] text-stone-800 border-stone-300 hover:bg-emerald-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+₹250 Dinner Party Bhatta</span>
              </button>
            </div>

            {/* Hourly & Overtime Selector */}
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Overtime / Visit Hours (@ +₹{staff.hourlyOvertimeRate}/hr)
                  </span>
                </span>
                <span className="font-mono-num font-bold text-emerald-700">
                  +{dayRecord.overtimeHours || 0} hrs (+₹
                  {Math.round((dayRecord.overtimeHours || 0) * staff.hourlyOvertimeRate)})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((otHrs) => (
                  <button
                    key={otHrs}
                    type="button"
                    onClick={() =>
                      handleUpdateHoursOrOvertime(
                        (staff.standardVisitHours || 3) + otHrs,
                        otHrs
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono-num font-semibold border transition-colors ${
                      (dayRecord.overtimeHours || 0) === otHrs
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    {otHrs === 0 ? '0h OT' : `+${otHrs}h OT`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Garden / Visit Checklist for Hourly Staff (Ramesh Mali) */}
          {staff.gardenChecklist && (
            <div className="space-y-2.5 pt-2 border-t border-stone-100">
              <label className="text-xs font-semibold text-stone-700 block">
                4. Next Visit Plant & Garden Checklist ({staff.name})
              </label>
              <div className="space-y-1.5">
                {staff.gardenChecklist.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onToggleGardenChecklistItem(staff.id, item.id)}
                    className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-left flex items-center justify-between gap-2 text-xs"
                  >
                    <span
                      className={`flex items-center gap-2 ${
                        item.completed ? 'line-through text-stone-400' : 'text-stone-800 font-medium'
                      }`}
                    >
                      <Check
                        className={`w-3.5 h-3.5 ${
                          item.completed ? 'text-emerald-700' : 'text-stone-300'
                        }`}
                      />
                      {item.text}
                    </span>
                    <span className="text-[10px] text-stone-400 shrink-0">{item.addedBy}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGardenNote}
                  onChange={(e) => setNewGardenNote(e.target.value)}
                  placeholder="Add next Sunday task (e.g. Neem spray on roses)"
                  className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newGardenNote.trim()) return;
                    onAddGardenChecklistItem(staff.id, newGardenNote.trim());
                    setNewGardenNote('');
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
