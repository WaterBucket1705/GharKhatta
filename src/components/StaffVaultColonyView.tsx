import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Plus,
  UserCheck,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { ColonyFreeSlot, FamilyMember, Language, StaffMember } from '../types/khata';
import { InfoPopupButton } from './InfoPopupButton';

interface StaffVaultColonyViewProps {
  staffList: StaffMember[];
  colonySlots: ColonyFreeSlot[];
  language: Language;
  activeMember: FamilyMember;
  onAddNewStaff: (newStaff: StaffMember) => void;
  onUpdateStaffMember: (updatedStaff: StaffMember) => void;
  onDeleteStaffMember: (staffId: string) => void;
  onToggleReserveSlot: (slotId: string) => void;
  onAddColonySlot: (slot: Omit<ColonyFreeSlot, 'id'>) => void;
  onUpdateColonySlot: (slot: ColonyFreeSlot) => void;
  onDeleteColonySlot: (slotId: string) => void;
}

export const StaffVaultColonyView: React.FC<StaffVaultColonyViewProps> = ({
  staffList,
  colonySlots,
  language,
  activeMember,
  onAddNewStaff,
  onUpdateStaffMember,
  onDeleteStaffMember,
  onToggleReserveSlot,
  onAddColonySlot,
  onUpdateColonySlot,
  onDeleteColonySlot,
}) => {
  // Staff KYC Add / Edit Modal State
  const [showKycModal, setShowKycModal] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [kycName, setKycName] = useState('');
  const [kycNameHi, setKycNameHi] = useState('');
  const [kycRole, setKycRole] = useState('');
  const [kycSalary, setKycSalary] = useState('');
  const [kycAadhaar, setKycAadhaar] = useState('');
  const [kycPoliceVerified, setKycPoliceVerified] = useState(true);
  const [kycPoliceId, setKycPoliceId] = useState('');
  const [kycVillage, setKycVillage] = useState('');
  const [kycEmergency, setKycEmergency] = useState('');
  const [kycNeighborRef, setKycNeighborRef] = useState('');
  const [kycUpiId, setKycUpiId] = useState('');
  const [kycJoinedSince, setKycJoinedSince] = useState('November 2026');
  const [kycError, setKycError] = useState('');

  // Colony Slot Add / Edit Form State
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [newSlotWorker, setNewSlotWorker] = useState('');
  const [newSlotRole, setNewSlotRole] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [newSlotRate, setNewSlotRate] = useState('');
  const [newSlotBlock, setNewSlotBlock] = useState('');
  const [newSlotPhone, setNewSlotPhone] = useState('');

  const openAddNewKycModal = () => {
    setEditingStaffId(null);
    setKycName('');
    setKycNameHi('');
    setKycRole('');
    setKycSalary('');
    setKycAadhaar('');
    setKycPoliceVerified(true);
    setKycPoliceId('');
    setKycVillage('');
    setKycEmergency('');
    setKycNeighborRef('');
    setKycUpiId('');
    setKycJoinedSince('November 2026');
    setKycError('');
    setShowKycModal(true);
  };

  const openEditKycModal = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setKycName(staff.name);
    setKycNameHi(staff.nameHi);
    setKycRole(staff.role);
    setKycSalary(String(staff.baseSalary));
    setKycAadhaar(staff.kyc.maskedAadhaar);
    setKycPoliceVerified(staff.kyc.policeVerified);
    setKycPoliceId(staff.kyc.policeVerificationId);
    setKycVillage(staff.kyc.homeVillage);
    setKycEmergency(staff.kyc.emergencyContact);
    setKycNeighborRef(staff.kyc.neighborReference);
    setKycUpiId(staff.kyc.upiId);
    setKycJoinedSince(staff.kyc.joinedSince);
    setKycError('');
    setShowKycModal(true);
  };

  const handleSaveKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = kycName.trim();
    if (!trimmedName) {
      setKycError('Please enter the staff member name.');
      return;
    }
    setKycError('');

    if (editingStaffId) {
      const existing = staffList.find((s) => s.id === editingStaffId);
      if (existing) {
        const updated: StaffMember = {
          ...existing,
          name: trimmedName,
          nameHi: kycNameHi.trim() || trimmedName,
          role: kycRole.trim() || existing.role,
          baseSalary: parseInt(kycSalary, 10) || existing.baseSalary,
          kyc: {
            maskedAadhaar: kycAadhaar.trim() || 'XXXX-XXXX-0000',
            policeVerified: kycPoliceVerified,
            policeVerificationId: kycPoliceId.trim() || 'PENDING-VERIFICATION',
            homeVillage: kycVillage.trim() || 'Not specified',
            emergencyContact: kycEmergency.trim() || 'Not specified',
            neighborReference: kycNeighborRef.trim() || `Verified by ${activeMember}`,
            upiId: kycUpiId.trim() || 'staff@upi',
            joinedSince: kycJoinedSince.trim() || 'November 2026',
          },
        };
        onUpdateStaffMember(updated);
      }
    } else {
      const created: StaffMember = {
        id: `staff-${Date.now()}`,
        name: trimmedName,
        nameHi: kycNameHi.trim() || trimmedName,
        role: kycRole.trim() || 'Household Staff',
        roleHi: kycRole.trim() || 'Household Staff',
        phone: kycEmergency.replace(/[^0-9]/g, '').slice(0, 12) || '',
        modelType: 'fixed_monthly',
        baseSalary: parseInt(kycSalary, 10) || 5000,
        paidLeaveQuota: 2,
        zeroLeaveBonusEnabled: true,
        zeroLeaveBonusAmount: 200,
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
          maskedAadhaar: kycAadhaar.trim() || 'XXXX-XXXX-0000',
          policeVerified: kycPoliceVerified,
          policeVerificationId: kycPoliceId.trim() || 'PENDING-VERIFICATION',
          homeVillage: kycVillage.trim() || 'Not specified',
          emergencyContact: kycEmergency.trim() || 'Not specified',
          neighborReference: kycNeighborRef.trim() || `Added by ${activeMember}`,
          upiId:
            kycUpiId.trim() ||
            `${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
          joinedSince: kycJoinedSince.trim() || 'November 2026',
        },
      };
      onAddNewStaff(created);
    }

    setShowKycModal(false);
    setEditingStaffId(null);
  };

  const handleToggleQuickPoliceStatus = (staff: StaffMember) => {
    const nextVerified = !staff.kyc.policeVerified;
    onUpdateStaffMember({
      ...staff,
      kyc: {
        ...staff.kyc,
        policeVerified: nextVerified,
        policeVerificationId: nextVerified
          ? staff.kyc.policeVerificationId === 'PENDING-VERIFICATION'
            ? `VERIFIED-2026-${Math.floor(100 + Math.random() * 899)}`
            : staff.kyc.policeVerificationId
          : 'PENDING-VERIFICATION',
      },
    });
  };

  const openAddSlotForm = () => {
    setEditingSlotId(null);
    setNewSlotWorker('');
    setNewSlotRole('');
    setNewSlotTime('');
    setNewSlotRate('');
    setNewSlotBlock('');
    setNewSlotPhone('');
    setShowSlotForm(true);
  };

  const openEditSlotForm = (slot: ColonyFreeSlot) => {
    setEditingSlotId(slot.id);
    setNewSlotWorker(slot.workerName);
    setNewSlotRole(slot.role);
    setNewSlotTime(slot.timeSlot);
    setNewSlotRate(slot.expectedRate);
    setNewSlotBlock(slot.blockLocation);
    setNewSlotPhone(slot.phone);
    setShowSlotForm(true);
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotWorker.trim() || !newSlotTime.trim()) return;

    if (editingSlotId) {
      const existing = colonySlots.find((s) => s.id === editingSlotId);
      if (existing) {
        onUpdateColonySlot({
          ...existing,
          workerName: newSlotWorker.trim(),
          role: newSlotRole.trim(),
          timeSlot: newSlotTime.trim(),
          expectedRate: newSlotRate.trim(),
          blockLocation: newSlotBlock.trim() || existing.blockLocation,
          phone: newSlotPhone.trim() || existing.phone,
        });
      }
    } else {
      onAddColonySlot({
        workerName: newSlotWorker.trim(),
        role: newSlotRole.trim() || 'Household Helper',
        phone: newSlotPhone.trim() || 'Not specified',
        timeSlot: newSlotTime.trim(),
        daysAvailable: 'Daily (Mon–Sun)',
        blockLocation: newSlotBlock.trim() || 'Local Block',
        expectedRate: newSlotRate.trim() || 'Negotiable',
        referredByNeighbor: `Referred by ${activeMember}`,
        policeVerified: true,
        rating: '5.0 • Verified Household Staff',
      });
    }

    setShowSlotForm(false);
    setEditingSlotId(null);
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Digital KYC & Neighbor Reference Vault */}
      <section aria-label="Staff Digital KYC and Reference Vault" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Staff Digital KYC & Police Verification Vault ({staffList.length})
            </h2>
            <InfoPopupButton
              title="Digital KYC & Emergency Vault"
              subtitle="Add, Edit, or Delete KYC & Police Verification"
              description="Manage masked Aadhaar IDs, police/RWA verification certificates, home village emergency contacts, neighbor references, and UPI IDs for every household worker."
              bullets={[
                'Tap "+ Add New Staff KYC" to onboard a new worker with full KYC.',
                'Tap "Edit KYC" on any card to update Aadhaar, Police Verification ID, Village address, or UPI ID.',
                'Tap the Police Verified status button on any card to toggle between Verified and Pending.',
              ]}
            />
          </div>

          <button
            type="button"
            onClick={openAddNewKycModal}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Staff KYC</span>
          </button>
        </div>

        {staffList.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold text-stone-900">No Staff KYC Records Found</p>
            <button
              type="button"
              onClick={openAddNewKycModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
            >
              + Add First Staff KYC Record
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                data-testid={`kyc-card-${staff.id}`}
                className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-stone-900">
                        {language === 'hi' ? staff.nameHi : staff.name}
                      </h3>
                      <p className="text-xs text-stone-500">
                        {language === 'hi' ? staff.roleHi : staff.role} · Since {staff.kyc.joinedSince}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleQuickPoliceStatus(staff)}
                      title="Click to toggle Police Verification status"
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 shrink-0 ${
                        staff.kyc.policeVerified
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      {staff.kyc.policeVerified ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Police Verified</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Verification Pending</span>
                        </>
                      )}
                    </button>
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
                      <span
                        className={`font-mono-num font-bold ${
                          staff.kyc.policeVerified ? 'text-emerald-800' : 'text-amber-700'
                        }`}
                      >
                        {staff.kyc.policeVerificationId}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 sm:col-span-2">
                      <span className="text-stone-500 block">Home Village & Emergency Contact</span>
                      <span className="font-semibold text-stone-800">
                        {staff.kyc.homeVillage} · {staff.kyc.emergencyContact}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 sm:col-span-2 flex items-center justify-between gap-2">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1.5 truncate">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span className="truncate">{staff.kyc.neighborReference}</span>
                      </span>
                      <span className="font-mono-num text-stone-600 shrink-0">
                        {staff.kyc.upiId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Edit KYC & Delete Staff Actions */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    aria-label={`Edit KYC for ${staff.name}`}
                    onClick={() => openEditKycModal(staff)}
                    className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-stone-200 text-stone-800 border border-stone-300 transition-colors flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Edit KYC & Verification</span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Delete ${staff.name}`}
                    onClick={() => onDeleteStaffMember(staff.id)}
                    className="px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Hyper-Local Colony Free-Slot Board */}
      <section aria-label="Hyper-Local Colony Free-Slot Board" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              Colony Free-Slot Board ({colonySlots.length})
            </h2>
            <InfoPopupButton
              title="Hyper-Local Colony Free-Slot Board"
              subtitle="Neighbor-Vouched Hiring"
              description="Discover verified maids, cooks, and malis already working in your RWA lane who have an open 1-hour slot between houses, or post, edit, and delete slots."
            />
          </div>

          <button
            type="button"
            onClick={openAddSlotForm}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Post Staff's Free 1-Hr Slot</span>
          </button>
        </div>

        {showSlotForm && (
          <form
            onSubmit={handleSaveSlot}
            className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4"
          >
            <h3 className="text-sm font-bold text-stone-900">
              {editingSlotId
                ? 'Edit Colony Free-Slot Listing'
                : "Share Your Staff's Open Time Slot with Colony Neighbors"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              <input
                type="text"
                value={newSlotBlock}
                onChange={(e) => setNewSlotBlock(e.target.value)}
                placeholder="Block / Lane Location"
                className="px-3 py-2 text-xs bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
              <input
                type="text"
                value={newSlotPhone}
                onChange={(e) => setNewSlotPhone(e.target.value)}
                placeholder="Contact Phone"
                className="px-3 py-2 text-xs font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSlotForm(false);
                  setEditingSlotId(null);
                }}
                className="px-3 py-2 text-xs font-medium text-stone-600 bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800"
              >
                {editingSlotId ? 'Save Slot Changes' : 'Publish Slot to Colony Board'}
              </button>
            </div>
          </form>
        )}

        {colonySlots.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold text-stone-900">No Colony Free-Slot Listings Yet</p>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Share your helper's open 1-hour time slot with neighbors in your colony or lane.
            </p>
            <button
              type="button"
              onClick={openAddSlotForm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800"
            >
              + Post First Free Time Slot
            </button>
          </div>
        ) : (
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

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  <span className="text-xs font-mono-num text-stone-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {slot.phone}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Edit slot for ${slot.workerName}`}
                      onClick={() => openEditSlotForm(slot)}
                      className="p-2 rounded-lg bg-[#FAF8F5] hover:bg-stone-200 text-stone-700 border border-stone-300 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete slot for ${slot.workerName}`}
                      onClick={() => onDeleteColonySlot(slot.id)}
                      className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleReserveSlot(slot.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        slot.reservedByUser
                          ? 'bg-emerald-50 border border-emerald-600 text-emerald-800'
                          : 'bg-emerald-700 text-white hover:bg-emerald-800'
                      }`}
                    >
                      {slot.reservedByUser
                        ? '✓ Inquiry Sent'
                        : 'Request Trial Slot'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Staff Digital KYC & Police Verification Modal */}
      {showKycModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-modal-title"
          onClick={() => setShowKycModal(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl my-8"
          >
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Digital KYC & Police Verification Record
                </p>
                <h3 id="kyc-modal-title" className="text-lg font-bold text-stone-900">
                  {editingStaffId
                    ? `Edit KYC & Verification — ${kycName}`
                    : 'Add New Staff KYC & Police Verification'}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close KYC Modal"
                onClick={() => setShowKycModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKycSubmit} className="space-y-3.5 text-xs">
              <div>
                <label
                  htmlFor="kyc-staff-name"
                  className="font-semibold text-stone-700 block mb-1"
                >
                  Staff Full Name
                </label>
                <input
                  id="kyc-staff-name"
                  type="text"
                  value={kycName}
                  onChange={(e) => setKycName(e.target.value)}
                  placeholder="e.g. Sunita Didi / Kamla Devi"
                  className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="kyc-staff-role"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Household Role
                  </label>
                  <input
                    id="kyc-staff-role"
                    type="text"
                    value={kycRole}
                    onChange={(e) => setKycRole(e.target.value)}
                    placeholder="e.g. House Maid / Cook / Driver"
                    className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kyc-staff-salary"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Monthly Salary (₹)
                  </label>
                  <input
                    id="kyc-staff-salary"
                    type="number"
                    value={kycSalary}
                    onChange={(e) => setKycSalary(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="kyc-aadhaar-input"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Masked Aadhaar ID
                  </label>
                  <input
                    id="kyc-aadhaar-input"
                    type="text"
                    value={kycAadhaar}
                    onChange={(e) => setKycAadhaar(e.target.value)}
                    placeholder="XXXX-XXXX-4582"
                    className="w-full px-3 py-2 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kyc-police-id-input"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Police / RWA Verification ID
                  </label>
                  <input
                    id="kyc-police-id-input"
                    type="text"
                    value={kycPoliceId}
                    onChange={(e) => setKycPoliceId(e.target.value)}
                    placeholder="DEL-RWA-2026-884"
                    className="w-full px-3 py-2 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Police Verification Status Toggle */}
              <div>
                <span className="font-semibold text-stone-700 block mb-1">
                  Police Verification Status
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setKycPoliceVerified(true)}
                    className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      kycPoliceVerified
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-[#FAF8F5] text-stone-700 border-stone-300'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Police Verified</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setKycPoliceVerified(false)}
                    className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 ${
                      !kycPoliceVerified
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-[#FAF8F5] text-stone-700 border-stone-300'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Verification Pending</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="kyc-village-input"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Home Village / Native Town
                  </label>
                  <input
                    id="kyc-village-input"
                    type="text"
                    value={kycVillage}
                    onChange={(e) => setKycVillage(e.target.value)}
                    placeholder="e.g. Madhubani, Bihar"
                    className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kyc-emergency-input"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Emergency Contact Phone
                  </label>
                  <input
                    id="kyc-emergency-input"
                    type="text"
                    value={kycEmergency}
                    onChange={(e) => setKycEmergency(e.target.value)}
                    placeholder="+91 98112 90876 (Husband)"
                    className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="kyc-neighbor-input"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Neighbor Reference
                  </label>
                  <input
                    id="kyc-neighbor-input"
                    type="text"
                    value={kycNeighborRef}
                    onChange={(e) => setKycNeighborRef(e.target.value)}
                    placeholder="e.g. Referred by Mrs. Sharma (B-14)"
                    className="w-full px-3 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="kyc-upi-input"
                    className="font-semibold text-stone-700 block mb-1"
                  >
                    Verified UPI ID
                  </label>
                  <input
                    id="kyc-upi-input"
                    type="text"
                    value={kycUpiId}
                    onChange={(e) => setKycUpiId(e.target.value)}
                    placeholder="sunitadevi@okaxis"
                    className="w-full px-3 py-2 text-sm font-mono-num bg-[#FAF8F5] border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {kycError && (
                <p className="text-xs text-rose-600 font-semibold">{kycError}</p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800"
                >
                  {editingStaffId ? 'Save KYC Changes' : 'Add Staff & Save KYC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
