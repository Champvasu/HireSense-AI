'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Wallet, Building2, CheckCircle, AlertTriangle, XCircle, Sparkles } from 'lucide-react';
import { formatStipend } from '@/lib/utils/currencyFormatter';
import { formatDate } from '@/lib/utils/dateFormat';
import { useMounted } from '@/lib/hooks/useMounted';
import Link from 'next/link';
import ResumeMatchModal from './ResumeMatchModal';

export default function InternshipCard({ internship, userMatch, showApply }) {
  const [showMatchModal, setShowMatchModal] = useState(false);
  const mounted = useMounted();

  const statusConfig = {
    verified: { icon: CheckCircle, bg: 'bg-[#10b981]/15', text: 'text-[#10b981]', label: 'Verified' },
    suspicious: { icon: AlertTriangle, bg: 'bg-[#f59e0b]/15', text: 'text-[#f59e0b]', label: 'Suspicious' },
    scam: { icon: XCircle, bg: 'bg-[#ef4444]/15', text: 'text-[#ef4444]', label: 'Scam' }
  };

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.suspicious;
    const Icon = config.icon;
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bg} ${config.text}`}>
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    );
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -4 }} 
        className="bg-white rounded-2xl border border-[#E8EAF0] shadow-sm hover:shadow-md transition-all overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#F0F2F5] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#6B7280]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1A1A2E]">{internship.title}</h3>
                <p className="text-sm text-[#6B7280]">{internship.company}</p>
              </div>
            </div>
            <StatusBadge status={internship.aiVerification?.status} />
          </div>

          <div className="flex flex-wrap gap-3 mb-3 text-[#6B7280] text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#9CA3AF]" />
              {internship.location}
            </div>
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-[#9CA3AF]" />
              {formatStipend(internship.stipend)}
            </div>
          </div>

          <p className="text-[#6B7280] text-sm mb-4 line-clamp-2">{internship.description}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {internship.skills?.slice(0, 4).map((skill, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-[#F0F2F5] text-[#6B7280] text-xs">{skill}</span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E8EAF0]">
            {userMatch ? (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3DD68C]" />
                <span className="text-sm text-[#6B7280]">Match: <span className="font-semibold text-[#1A1A2E]">{userMatch}%</span></span>
              </div>
            ) : (
              <span className="text-xs text-[#9CA3AF]">Posted {mounted ? formatDate(internship.createdAt) : ''}</span>
            )}
            
            <div className="flex gap-2">
              {showApply && (
                <button
                  onClick={() => setShowMatchModal(true)}
                  className="px-4 py-2 rounded-lg bg-[#F0F2F5] hover:bg-[#E8EAF0] text-[#1A1A2E] text-sm font-medium flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#6C63FF]" />
                  Check Match
                </button>
              )}
              {showApply && (
                <Link href={`/internships/${internship._id}`} className="px-5 py-2 rounded-lg bg-[#3DD68C] hover:bg-[#2BC47A] text-white text-sm font-medium transition-colors">
                  Apply Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {showMatchModal && (
        <ResumeMatchModal
          internship={internship}
          onClose={() => setShowMatchModal(false)}
        />
      )}
    </>
  );
}
