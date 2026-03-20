import React from 'react';
import { Mail, HelpCircle } from 'lucide-react';

interface ContactInfoCardProps {
  language: 'ar' | 'en';
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ language }) => {
  const isRTL = language === 'ar';

  const labels = isRTL
    ? {
        title: 'معلومات التواصل',
        admissions: 'القبول والتسجيل',
        finance: 'الدائرة المالية',
        scholarships: 'مكتب المنح',
      }
    : {
        title: 'Contact Information',
        admissions: 'Admissions & Registration',
        finance: 'Finance Department',
        scholarships: 'Scholarships Office',
      };

  const contacts = [
    { label: labels.admissions, email: 'admissionteam@htu.edu.jo' },
    { label: labels.finance, email: 'FinanceDepartment@htu.edu.jo' },
    { label: labels.scholarships, email: 'htu.scholarships@htu.edu.jo' },
  ];

  return (
    <div className="rounded-2xl p-4 mb-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 pb-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <HelpCircle size={16} className="text-[#C8102E]" />
        <h3 className="font-bold text-sm text-white">{labels.title}</h3>
      </div>

      {/* Contacts */}
      <div className="flex flex-col gap-3">
        {contacts.map((contact, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(200,16,46,0.15)' }}>
              <Mail size={13} className="text-[#C8102E]" />
            </div>
            <div>
              <span className="block text-xs font-medium text-white/60 mb-0.5">
                {contact.label}
              </span>
              <a
                href={`mailto:${contact.email}`}
                className="text-xs text-white/40 hover:text-[#C8102E] transition-colors break-all"
              >
                {contact.email}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactInfoCard;