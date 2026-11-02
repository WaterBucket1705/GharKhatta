import React, { useState } from 'react';
import {
  Shirt,
  Milk,
  CheckCircle2,
  Plus,
  Minus,
  AlertTriangle,
} from 'lucide-react';
import {
  DhobiBatch,
  DhobiItemCounts,
  FamilyMember,
  MilkConfig,
  MilkDayRecord,
} from '../types/khata';
import {
  calculateDhobiBatchCost,
  calculateDhobiSummary,
  calculateMilkSummary,
  DHOBI_RATES,
} from '../utils/mathEngine';
import { InfoPopupButton } from './InfoPopupButton';

interface DhobiMilkViewProps {
  dhobiBatches: DhobiBatch[];
  milkConfig: MilkConfig;
  activeMember: FamilyMember;
  currentDay: number;
  onAddDhobiBatch: (counts: DhobiItemCounts, note: string) => void;
  onUpdateDhobiBatchReturn: (batchId: string, returnedCounts: DhobiItemCounts) => void;
  onUpdateMilkDay: (day: number, record: MilkDayRecord) => void;
  onUpdateMilkSettings: (defaultDailyLiters: number, pricePerLiter: number) => void;
}

export const DhobiMilkView: React.FC<DhobiMilkViewProps> = ({
  dhobiBatches,
  milkConfig,
  activeMember,
  currentDay,
  onAddDhobiBatch,
  onUpdateDhobiBatchReturn,
  onUpdateMilkDay,
  onUpdateMilkSettings,
}) => {
  // Dhobi New Batch State (starts clean at 0)
  const [counts, setCounts] = useState<DhobiItemCounts>({
    shirts: 0,
    trousers: 0,
    sarees_bedsheets: 0,
    heavy_suits: 0,
  });
  const [batchNote, setBatchNote] = useState('');

  // Milk Selected Day State
  const [selectedMilkDay, setSelectedMilkDay] = useState<number>(currentDay);
  const [dailyLitersInput, setDailyLitersInput] = useState<string>(
    String(milkConfig.defaultDailyLiters)
  );
  const [pricePerLiterInput, setPricePerLiterInput] = useState<string>(
    String(milkConfig.pricePerLiter)
  );

  const { totalPieces: draftPieces, batchCost: draftCost } =
    calculateDhobiBatchCost(counts);
  const dhobiSummary = calculateDhobiSummary(dhobiBatches);
  const milkSummary = calculateMilkSummary(milkConfig, 30);

  const selectedMilkRecord: MilkDayRecord = milkConfig.days[selectedMilkDay] || {
    day: selectedMilkDay,
    status: 'default',
    liters: milkConfig.defaultDailyLiters,
    sideItems: [],
    loggedBy: activeMember,
    loggedAt: '07:30 AM',
  };

  const handleAdjustCount = (key: keyof DhobiItemCounts, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftPieces <= 0) return;
    onAddDhobiBatch(counts, batchNote.trim() || 'Laundry handover');
    setCounts({
      shirts: 0,
      trousers: 0,
      sarees_bedsheets: 0,
      heavy_suits: 0,
    });
    setBatchNote('');
  };

  const handleSaveMilkDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    const nextLiters = Math.max(0, parseFloat(dailyLitersInput) || 0);
    const nextPrice = Math.max(1, parseFloat(pricePerLiterInput) || 70);
    onUpdateMilkSettings(nextLiters, nextPrice);
  };

  const handleSetMilkLiters = (liters: number, status: 'default' | 'paused' | 'extra') => {
    onUpdateMilkDay(selectedMilkDay, {
      ...selectedMilkRecord,
      day: selectedMilkDay,
      status,
      liters,
      loggedBy: activeMember,
      loggedAt: '08:10 AM',
    });
  };

  const handleToggleSideItem = (name: string, price: number) => {
    const existing = selectedMilkRecord.sideItems || [];
    const hasItem = existing.some((i) => i.name === name);
    const nextSideItems = hasItem
      ? existing.filter((i) => i.name !== name)
      : [...existing, { id: `si-${Date.now()}-${price}`, name, price }];

    onUpdateMilkDay(selectedMilkDay, {
      ...selectedMilkRecord,
      day: selectedMilkDay,
      sideItems: nextSideItems,
      loggedBy: activeMember,
      loggedAt: '08:15 AM',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 6 Cols: Model 3 — Dhobi Piece-Count Return Tracker */}
      <section
        aria-label="Dhobi Piece-Count Return Tracker"
        className="lg:col-span-6 space-y-6"
      >
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-emerald-700 shrink-0" />
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Dhobi — Ironing & Return Khata
              </h2>
              <InfoPopupButton
                title="Model 3: Piece-Count Return Tracker"
                subtitle="Dhobi Rate Card & Missing Clothes Guard"
                formula="Batch Cost = (Shirts × ₹7) + (Trousers × ₹10) + (Sarees/Bedsheets × ₹25) + (Heavy Suits × ₹120)"
                description="Tracks every batch handed over to the dhobi and highlights unreturned pieces in red until checked back in."
                breakdownItems={[
                  { label: 'Total Clothes Given (Nov)', value: `${dhobiSummary.totalGiven} pcs` },
                  { label: 'Total Returned', value: `${dhobiSummary.totalReturned} pcs`, highlight: 'emerald' },
                  { label: 'Pending With Dhobi', value: `${dhobiSummary.pendingPiecesCount} pcs`, highlight: dhobiSummary.pendingPiecesCount > 0 ? 'rose' : 'emerald' },
                  { label: 'November Ironing Bill', value: `₹${dhobiSummary.totalCost.toLocaleString('en-IN')}` },
                ]}
              />
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-stone-500 block">Nov Ironing Bill</span>
              <span className="text-xl font-mono-num font-bold text-stone-900">
                ₹{dhobiSummary.totalCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Pending Unreturned Clothes Warning Banner */}
          {dhobiSummary.pendingPiecesCount > 0 ? (
            <div
              data-testid="dhobi-pending-alert"
              className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>
                    {dhobiSummary.pendingPiecesCount} Clothes Pending Return ({dhobiSummary.totalReturned} of{' '}
                    {dhobiSummary.totalGiven} Returned)
                  </span>
                </p>
                <p className="text-xs text-rose-800 font-medium">
                  {dhobiSummary.pendingBreakdownText}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>
                {dhobiSummary.totalGiven === 0
                  ? 'No laundry batches logged yet. Use the counters below to log clothes given to the dhobi.'
                  : `All ${dhobiSummary.totalGiven} clothes given this month have been returned!`}
              </span>
            </div>
          )}

          {/* Give Clothes Batch Builder */}
          <form onSubmit={handleCreateBatch} className="space-y-4">
            <h3 className="text-sm font-bold text-stone-900">
              Give New Clothes Batch
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  {
                    key: 'shirts',
                    label: 'Shirts / Kurtas',
                    rate: DHOBI_RATES.shirts,
                  },
                  {
                    key: 'trousers',
                    label: 'Trousers / Jeans',
                    rate: DHOBI_RATES.trousers,
                  },
                  {
                    key: 'sarees_bedsheets',
                    label: 'Sarees / Bedsheets',
                    rate: DHOBI_RATES.sarees_bedsheets,
                  },
                  {
                    key: 'heavy_suits',
                    label: 'Heavy Suits (Dry Clean)',
                    rate: DHOBI_RATES.heavy_suits,
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-semibold text-stone-900">{item.label}</p>
                    <p className="text-[11px] font-mono-num text-stone-500">
                      @ ₹{item.rate} / pc
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Decrease ${item.label}`}
                      onClick={() => handleAdjustCount(item.key, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono-num text-sm font-bold text-stone-900">
                      {counts[item.key]}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.label}`}
                      onClick={() => handleAdjustCount(item.key, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={batchNote}
                onChange={(e) => setBatchNote(e.target.value)}
                placeholder="Note (e.g. Check blue silk saree border)"
                className="flex-1 px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
              <button
                type="submit"
                disabled={draftPieces <= 0}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                Log {draftPieces} Pcs Batch (₹{draftCost})
              </button>
            </div>
          </form>

          {/* Active & Past Dhobi Batches with Partial Check-In */}
          <div className="space-y-3 pt-3 border-t border-stone-100">
            <h3 className="text-sm font-bold text-stone-900">
              Laundry Batches & Return Check-In ({dhobiBatches.length})
            </h3>

            {dhobiBatches.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-500">
                No laundry batches logged yet. Increment the piece counters above and tap "Log Batch" to start tracking.
              </div>
            ) : (
              dhobiBatches.map((batch) => {
                const pendingCount = Math.max(0, batch.totalGiven - batch.totalReturned);
                const pendingShirts = Math.max(
                  0,
                  batch.givenCounts.shirts - batch.returnedCounts.shirts
                );
                const pendingBedsheets = Math.max(
                  0,
                  batch.givenCounts.sarees_bedsheets - batch.returnedCounts.sarees_bedsheets
                );

                return (
                  <div
                    key={batch.id}
                    className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-stone-900">
                          Given on {batch.givenDate} · {batch.totalGiven} Pieces ·{' '}
                          <span className="font-mono-num text-emerald-800">₹{batch.batchCost}</span>
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Added by {batch.loggedBy} · {batch.loggedAt}
                        </p>
                      </div>

                      {pendingCount > 0 ? (
                        <span className="text-xs font-semibold text-rose-600">
                          {batch.totalReturned} Returned · {pendingCount} Pending
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">
                          All {batch.totalGiven} Returned
                        </span>
                      )}
                    </div>

                    {batch.note && (
                      <p className="text-xs text-stone-700">{batch.note}</p>
                    )}

                    {pendingCount > 0 && (
                      <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-rose-700 font-medium">
                          Unreturned: {pendingBedsheets > 0 ? `${pendingBedsheets} Bedsheet ` : ''}
                          {pendingShirts > 0 ? `${pendingShirts} Shirts` : ''}
                        </span>

                        <div className="flex items-center gap-2">
                          {pendingShirts > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateDhobiBatchReturn(batch.id, {
                                  ...batch.returnedCounts,
                                  shirts: batch.returnedCounts.shirts + 1,
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-300 text-stone-800 hover:bg-stone-100"
                            >
                              +1 Shirt Returned
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateDhobiBatchReturn(batch.id, { ...batch.givenCounts })
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
                          >
                            Check-In All Remaining ({pendingCount})
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Right 6 Cols: Model 4 — Daily Quantity Exception Calendar (Milkman & Water Cans) */}
      <section
        aria-label="Milkman and Water Can Exception Calendar"
        className="lg:col-span-6 space-y-6"
      >
        <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Milk className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900">
                    {milkConfig.vendorName}
                  </h2>
                  <InfoPopupButton
                    title="Model 4: Daily Quantity Exception Calendar"
                    subtitle={`${milkConfig.defaultDailyLiters}L ${milkConfig.milkType} @ ₹${milkConfig.pricePerLiter}/L`}
                    formula={`Monthly Bill = (Total Liters × ₹${milkConfig.pricePerLiter}/L) + Side Items (Paneer / Desi Ghee / Water Cans)`}
                    description="Configure your daily milk liters below. GharKhata calculates your monthly bill automatically and lets you tap any date when you paused delivery (0L), took extra, or bought side items."
                    breakdownItems={[
                      { label: 'Total Milk Delivered (Nov)', value: `${milkSummary.totalLiters}L (₹${milkSummary.milkCost.toLocaleString('en-IN')})` },
                      { label: 'Paused Out-of-Station Days', value: `${milkSummary.pausedDays} Days (0L)`, highlight: 'amber' },
                      { label: 'Paneer, Ghee & Water Cans', value: `+₹${milkSummary.sideItemsTotal.toLocaleString('en-IN')}`, highlight: 'emerald' },
                      { label: 'November Grand Total', value: `₹${milkSummary.grandTotal.toLocaleString('en-IN')}`, highlight: 'emerald' },
                    ]}
                  />
                </div>
                <p className="text-xs text-stone-500">
                  Default: {milkConfig.defaultDailyLiters}L/day @ ₹{milkConfig.pricePerLiter}/L
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-stone-500 block">Nov Total Bill</span>
              <span
                data-testid="milk-grand-total"
                className="text-xl font-mono-num font-bold text-emerald-700"
              >
                ₹{milkSummary.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Configure Daily Milk Default Liters & Rate */}
          <form
            onSubmit={handleSaveMilkDefaults}
            className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 flex flex-wrap items-end gap-3 text-xs"
          >
            <div className="flex-1 min-w-[110px]">
              <label
                htmlFor="milk-default-liters-input"
                className="font-semibold text-stone-700 block mb-1"
              >
                Daily Default Milk (L/day)
              </label>
              <input
                id="milk-default-liters-input"
                type="number"
                step="0.5"
                min="0"
                value={dailyLitersInput}
                onChange={(e) => setDailyLitersInput(e.target.value)}
                className="w-full px-3 py-1.5 font-mono-num bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-[110px]">
              <label
                htmlFor="milk-rate-input"
                className="font-semibold text-stone-700 block mb-1"
              >
                Price per Liter (₹/L)
              </label>
              <input
                id="milk-rate-input"
                type="number"
                min="1"
                value={pricePerLiterInput}
                onChange={(e) => setPricePerLiterInput(e.target.value)}
                className="w-full px-3 py-1.5 font-mono-num bg-white border border-stone-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg font-semibold bg-stone-900 text-white hover:bg-stone-800 whitespace-nowrap shrink-0"
            >
              Save Daily Default
            </button>
          </form>

          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
              <span className="text-stone-500 block">Total Milk</span>
              <span className="text-sm font-mono-num font-bold text-stone-900">
                {milkSummary.totalLiters}L (₹{milkSummary.milkCost.toLocaleString('en-IN')})
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
              <span className="text-stone-500 block">Paused (0L)</span>
              <span className="text-sm font-mono-num font-bold text-amber-700">
                {milkSummary.pausedDays} Days
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200">
              <span className="text-stone-500 block">Side Items</span>
              <span className="text-sm font-mono-num font-bold text-emerald-700">
                +₹{milkSummary.sideItemsTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 30-Day Milk Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((dayNum) => {
                const rec = milkConfig.days[dayNum];
                const liters = rec ? rec.liters : milkConfig.defaultDailyLiters;
                const hasSide = rec && rec.sideItems && rec.sideItems.length > 0;
                const isSel = selectedMilkDay === dayNum;

                let cellStyle = 'bg-[#FAF8F5] text-stone-800 border-stone-200';
                if (liters === 0) {
                  cellStyle = 'bg-rose-50 text-rose-800 border-rose-300 font-semibold';
                } else if (liters > milkConfig.defaultDailyLiters || hasSide) {
                  cellStyle = 'bg-emerald-50 text-emerald-900 border-emerald-400 font-semibold';
                }

                return (
                  <button
                    key={dayNum}
                    type="button"
                    aria-label={`Milk Day ${dayNum}`}
                    onClick={() => setSelectedMilkDay(dayNum)}
                    className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center min-h-[48px] ${cellStyle} ${
                      isSel ? 'ring-2 ring-stone-900 border-stone-900' : ''
                    }`}
                  >
                    <span className="text-[10px] font-mono-num text-stone-500">{dayNum}</span>
                    <span className="text-xs font-mono-num">{liters}L</span>
                    {hasSide && <span className="text-[9px] text-emerald-700">+Item</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Milk Day Controls */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">
                Date: {selectedMilkDay} Nov 2026
              </span>
              <span className="text-xs font-mono-num text-stone-500">
                By {selectedMilkRecord.loggedBy}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSetMilkLiters(0, 'paused')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedMilkRecord.liters === 0
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-rose-50'
                }`}
              >
                0L (Paused)
              </button>

              <button
                type="button"
                onClick={() => handleSetMilkLiters(2.0, 'default')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedMilkRecord.liters === 2.0
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                }`}
              >
                2.0L (Default)
              </button>

              <button
                type="button"
                onClick={() => handleSetMilkLiters(3.0, 'extra')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedMilkRecord.liters === 3.0
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-white text-stone-700 border-stone-300 hover:bg-emerald-50'
                }`}
              >
                +1L Extra (3.0L)
              </button>
            </div>

            <div className="pt-2 border-t border-stone-200 space-y-2">
              <span className="text-xs font-semibold text-stone-600 block">
                Add Dairy / Utility Side Items ({selectedMilkDay} Nov):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { name: '200g Fresh Paneer', price: 140 },
                    { name: '1L A2 Bilona Desi Ghee Jar', price: 650 },
                    { name: '20L Bisleri Water Can', price: 70 },
                  ] as const
                ).map((side) => {
                  const isAdded = (selectedMilkRecord.sideItems || []).some(
                    (i) => i.name === side.name
                  );
                  return (
                    <button
                      key={side.name}
                      type="button"
                      onClick={() => handleToggleSideItem(side.name, side.price)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isAdded
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-stone-800 border-stone-300 hover:bg-emerald-50'
                      }`}
                    >
                      {isAdded ? '✓ ' : '+'}₹{side.price} {side.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
