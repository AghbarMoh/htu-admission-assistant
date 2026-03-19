import React from 'react';
import { HelpCircle, Mail } from 'lucide-react';

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

  return (
    <div className="bg-white/10 rounded-xl p-4 shadow-sm border border-white/20 backdrop-blur-sm mb-4 mt-2">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <HelpCircle size={18} className="text-white" />
        {labels.title}
      </h3>

      <div className="space-y-4 text-sm">
        <div className="flex items-start gap-3">
          <Mail size={16} className="text-white/80 mt-1 flex-shrink-0" />
          <div>
            <span className="block font-medium text-white/90">{labels.admissions}</span>
            <a
              href="mailto:admissionteam@htu.edu.jo"
              className="text-white hover:underline decoration-white/50 break-all text-xs"
            >
              admissionteam@htu.edu.jo
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail size={16} className="text-white/80 mt-1 flex-shrink-0" />
          <div>
            <span className="block font-medium text-white/90">{labels.finance}</span>
            <a
              href="mailto:FinanceDepartment@htu.edu.jo"
              className="text-white hover:underline decoration-white/50 break-all text-xs"
            >
              FinanceDepartment@htu.edu.jo
            </a>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Mail size={16} className="text-white/80 mt-1 flex-shrink-0" />
          <div>
            <span className="block font-medium text-white/90">{labels.scholarships}</span>
            <a
              href="mailto:htu.scholarships@htu.edu.jo"
              className="text-white hover:underline decoration-white/50 break-all text-xs"
            >
              htu.scholarships@htu.edu.jo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;