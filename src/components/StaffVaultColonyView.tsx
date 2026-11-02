import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Plus,
  UserCheck,
} from 'lucide-react';
import { ColonyFreeSlot, StaffMember } from '../types/khata';

interface StaffVaultColonyViewProps {
  staffList: StaffMember[];
  colonySlots: ColonyFreeSlot[];
  onToggleReserveSlot: (slotId: string) => void;
  onAddColonySlot: (slot: Omit<ColonyFreeSlot, 'id'>) => void;
}

export const StaffVaultColonyView: React.FC<StaffVaultColonyViewProps> = ({
  staffList,
  colonySlots,
  onToggleReserveSlot,
  onAddColonySlot,
}) => {
  const [newSlotWorker, setNewSlotWorker] = useState('Sunita Didi');
  const [newSlotRole, setNewSlotRole] = useState('House Maid — Jhadu, Pochha & Bartan');
  const [newSlotTime, setNewSlotTime] = useState('04:00 PM – 05:00 PM');
  const [newSlotRate, setNewSlotRate] = useState('₹1,500/mo for Evening Bartan & Kitchen');
  const [showSlotForm, setShowSlotForm] = useState(false);

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotWorker.trim() || !newSlotTime.trim()) return;
    onAddColonySlot({
      workerName: newSlotWorker.trim(),
      role: newSlotRole.trim(),
      phone: '+91 98112 23344',
      timeSlot: newSlotTime.trim(),
      daysAvailable: 'Daily (Mon–Sun)',
      blockLocation: 'Block B Lane',
      expectedRate: newSlotRate.trim(),
      referredByNeighbor: 'Referred by Priya & Anurag (House B-12)',
      policeVerified: true,
      rating: '5.0 • Verified Household Staff',
    });
    setShowSlotForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Digital KYC & Neighbor Reference Vault */}
      <section aria-label="Staff Digital KYC and Reference Vault" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>Staff Digital KYC, Police Verification & Neighbor Reference Vault</span>
          </h2>
          <p className="text-xs text-stone-500">
            Stores masked Aadhaar ID, emergency village contact, RWA/Police verification ID, and neighbor reference for every household worker.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffList.map((staff) => (
            <div
              key={staff.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {staff.name} ({staff.nameHi})
                  </h3>
                  <p className="text-xs text-stone-500">
                    {staff.role} · Working since {staff.kyc.joinedSince}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Police Verified</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200">
                  <span className="text-stone-500 block">Masked Aadhaar ID</span>
                  <span className="font-mono-num font-bold text-stone-900">
                    {staff.kyc.maskedAadhaar}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200">
                  <span className="text-stone-500 block">Police Verification ID</span>
                  <span className="font-mono-num font-bold text-emerald-800">
                    {staff.kyc.policeVerificationId}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 sm:col-span-2">
                  <span className="text-stone-500 block">Home Village & Emergency Contact</span>
                  <span className="font-semibold text-stone-800">
                    {staff.kyc.homeVillage} · {staff.kyc.emergencyContact}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 sm:col-span-2 flex items-center justify-between">
                  <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{staff.kyc.neighborReference}</span>
                  </span>
                  <span className="font-mono-num text-stone-600">{staff.kyc.upiId}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Hyper-Local Colony Free-Slot Board */}
      <section aria-label="Hyper-Local Colony Free-Slot Board" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Hyper-Local "Colony Free-Slot Board" (Block A, B & C RWA)
            </h2>
            <p className="text-xs text-stone-500">
              Discover verified maids, cooks, and malis already working in your lane who have an open 1-hour slot between houses.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSlotForm(!showSlotForm)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Post Staff's Free 1-Hr Slot for Neighbors</span>
          </button>
        </div>

        {showSlotForm && (
          <form
            onSubmit={handleCreateSlot}
            className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-stone-900">
              Share Your Staff's Open Time Slot with Colony Neighbors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={newSlotWorker}
                onChange={(e) => setNewSlotWorker(e.target.value)}
                placeholder="Staff Name"
                className="px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
              <input
                type="text"
                value={newSlotRole}
                onChange={(e) => setNewSlotRole(e.target.value)}
                placeholder="Role (e.g. Maid / Cook)"
                className="px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
              <input
                type="text"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                placeholder="Open Time Slot (e.g. 4:00–5:00 PM)"
                className="px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
              <input
                type="text"
                value={newSlotRate}
                onChange={(e) => setNewSlotRate(e.target.value)}
                placeholder="Expected Monthly Rate"
                className="px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSlotForm(false)}
                className="px-3 py-2 text-xs font-medium text-stone-600 bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
              >
                Publish Slot to Colony Board
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colonySlots.map((slot) => (
            <div
              key={slot.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-stone-900">{slot.workerName}</h3>
                    <p className="text-xs text-stone-600">{slot.role}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">{slot.rating}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1.5 text-xs">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Free Slot: {slot.timeSlot} ({slot.daysAvailable})
                    </span>
                  </p>
                  <p className="text-stone-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      {slot.blockLocation} · {slot.expectedRate}
                    </span>
                  </p>
                  <p className="text-stone-500">
                    Neighbor Vouch: <strong className="text-stone-800">{slot.referredByNeighbor}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                <span className="text-xs font-mono-num text-stone-600 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {slot.phone}
                </span>

                <button
                  type="button"
                  onClick={() => onToggleReserveSlot(slot.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    slot.reservedByUser
                      ? 'bg-emerald-50 border border-emerald-600 text-emerald-800'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  {slot.reservedByUser
                    ? '✓ Slot Inquiry Sent (B-12)'
                    : 'Request 1-Hr Trial Slot'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
