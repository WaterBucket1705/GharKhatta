import { Language } from '../types/khata';

export const UI_TEXT: Record<
  Language,
  {
    appName: string;
    appSubtitle: string;
    navDashboard: string;
    navCalendar: string;
    navUdhaar: string;
    navDhobiMilk: string;
    navVaultColony: string;
    bolKeLikhoTitle: string;
    bolKeLikhoPlaceholder: string;
    loggedInAs: string;
    netPayoutLeftHero: string;
    totalAdvancesHero: string;
    pendingDhobiHero: string;
    milkBillHero: string;
    markAllPresent: string;
    netLeftToGive: string;
    baseSalary: string;
    paidLeavesUsed: string;
    chhotaAdvance: string;
    badaUdhaarEmi: string;
    homeReimbursement: string;
    sendWhatsAppHindiSlip: string;
    playHindiAudio: string;
  }
> = {
  en: {
    appName: 'GharKhata',
    appSubtitle: 'Household Staff, Attendance & Udhaar Autopilot',
    navDashboard: 'Ghar Dashboard',
    navCalendar: 'Attendance & Hours',
    navUdhaar: 'Udhaar & Settlement',
    navDhobiMilk: 'Dhobi & Milk',
    navVaultColony: 'ID Vault & Colony',
    bolKeLikhoTitle: '8:30 AM Kitchen Voice Bar ("Bol Ke Likho")',
    bolKeLikhoPlaceholder: 'Speak or type in Hinglish: e.g. "Sunita didi took ₹500 for gas cylinder today"',
    loggedInAs: 'Active Member:',
    netPayoutLeftHero: 'Net Staff Payout Left (Nov)',
    totalAdvancesHero: 'Advances & EMI Deducted',
    pendingDhobiHero: 'Dhobi Clothes Pending',
    milkBillHero: 'Live Milk & Dairy Bill',
    markAllPresent: 'Mark All Present Today',
    netLeftToGive: 'Net Money Left to Give',
    baseSalary: 'Base Salary',
    paidLeavesUsed: 'Paid Leaves Buffer',
    chhotaAdvance: 'Chhota Advance (This Month)',
    badaUdhaarEmi: 'Bada Udhaar Monthly EMI',
    homeReimbursement: 'Home Purchase Reimbursement',
    sendWhatsAppHindiSlip: 'WhatsApp + Hindi Voice Slip',
    playHindiAudio: 'Play Hindi Voice Note for Staff',
  },
  hinglish: {
    appName: 'GharKhata',
    appSubtitle: 'Ghar Ka Hisab, Staff Haziri & Udhaar Autopilot',
    navDashboard: 'Ghar Dashboard',
    navCalendar: 'Haziri & Hours',
    navUdhaar: 'Udhaar & Pagar',
    navDhobiMilk: 'Dhobi & Doodh',
    navVaultColony: 'ID Vault & Padosi',
    bolKeLikhoTitle: '8:30 AM Kitchen Mode ("Bol Ke Likho")',
    bolKeLikhoPlaceholder: 'Bol ke likho: jaise "Sunita didi aaj nahi aayi aur kal ₹500 cylinder advance liya"',
    loggedInAs: 'Family Member:',
    netPayoutLeftHero: 'Abhi Baki Pagar Dena Hai (Nov)',
    totalAdvancesHero: 'Total Advance & EMI Cut',
    pendingDhobiHero: 'Dhobi Ke Baki Kapde',
    milkBillHero: 'Nov Doodh & Paneer Hisab',
    markAllPresent: 'Sabki Aaj Ki Haziri Lagao',
    netLeftToGive: 'Baki Pagar (Net Left to Pay)',
    baseSalary: 'Tay Pagar (Base)',
    paidLeavesUsed: 'Paid Chhutti Quota',
    chhotaAdvance: 'Chhota Advance (Is Mahine)',
    badaUdhaarEmi: 'Bada Udhaar Mahine Ki EMI',
    homeReimbursement: 'Ghar Saman Kharch (+Add)',
    sendWhatsAppHindiSlip: 'WhatsApp + Hindi Audio Slip',
    playHindiAudio: 'Staff Ke Liye Hindi Audio Sunao',
  },
  hi: {
    appName: 'घरखाता (GharKhata)',
    appSubtitle: 'घरेलू स्टाफ हाज़िरी, उधार और रोज़ाना हिसाब',
    navDashboard: 'घर डैशबोर्ड',
    navCalendar: 'हाज़िरी कैलेंडर',
    navUdhaar: 'उधार और पगार',
    navDhobiMilk: 'धोबी और दूध',
    navVaultColony: 'आईडी और कॉलोनी',
    bolKeLikhoTitle: '8:30 AM किचन मोड ("बोल के लिखो")',
    bolKeLikhoPlaceholder: 'बोलें या लिखें: जैसे "सुनीता दीदी आज नहीं आई और ₹500 सिलेंडर एडवांस लिया"',
    loggedInAs: 'परिवार सदस्य:',
    netPayoutLeftHero: 'नवंबर बाकी पगार (कुल देना है)',
    totalAdvancesHero: 'कुल एडवांस और किस्त कटौती',
    pendingDhobiHero: 'धोबी के पास बाकी कपड़े',
    milkBillHero: 'दूध और डेयरी बिल',
    markAllPresent: 'आज सबकी हाज़िरी लगाएं',
    netLeftToGive: 'बाकी पगार (अब देना है)',
    baseSalary: 'तय मासिक पगार',
    paidLeavesUsed: 'माफ़ छुट्टी कोटा',
    chhotaAdvance: 'छोटा एडवांस (इस महीने)',
    badaUdhaarEmi: 'बड़ा उधार मासिक किस्त (EMI)',
    homeReimbursement: 'घर के सामान का खर्च (+जुड़ेगा)',
    sendWhatsAppHindiSlip: 'व्हाट्सएप + हिंदी आवाज़ पर्ची',
    playHindiAudio: 'स्टाफ को हिंदी में हिसाब सुनाएं',
  },
};
