'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Edit3, ArrowLeft, Sparkles, ExternalLink, Lock } from 'lucide-react';

/**
 * VerificationModal - Professional verification feedback modal
 * Replaces browser alert() with polished glass-themed UI
 */

export default function VerificationModal({ 
  isOpen, 
  onClose, 
  onEdit,
  verificationData,
  internshipTitle = 'Internship Listing'
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen || !verificationData) return null;

  const {
    status,
    combinedScore,
    aiScore,
    verificationScore,
    minimumScore,
    weighting,
    thresholds,
    issues = [],
    recommendations = []
  } = verificationData;

  // Status configuration
  const statusConfig = {
    verified: {
      icon: CheckCircle,
      title: 'Verification Passed',
      subtitle: 'Listing Approved',
      color: 'success',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-600',
      progressColor: 'bg-green-500',
      glowColor: 'shadow-green-500/20'
    },
    suspicious: {
      icon: AlertTriangle,
      title: 'Verification Warning',
      subtitle: 'Suspicious Listing Detected',
      color: 'warning',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-600',
      progressColor: 'bg-amber-500',
      glowColor: 'shadow-amber-500/20'
    },
    scam: {
      icon: Shield,
      title: 'Verification Failed',
      subtitle: 'Scam Listing Detected',
      color: 'danger',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-200',
      textColor: 'text-red-600',
      progressColor: 'bg-red-500',
      glowColor: 'shadow-red-500/20'
    },
    pending_review: {
      icon: AlertCircle,
      title: 'Manual Review Required',
      subtitle: 'Borderline Trust Score',
      color: 'warning',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-600',
      progressColor: 'bg-amber-500',
      glowColor: 'shadow-amber-500/20'
    }
  };

  const config = statusConfig[status] || statusConfig.scam;
  const Icon = config.icon;

  // Determine if user can proceed
  const canProceed = status === 'verified' || status === 'pending_review';
  const isBlocked = status === 'scam' || status === 'suspicious';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-[#E8EAF0]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with status indicator */}
          <div className={`relative p-6 ${config.bgColor} border-b ${config.borderColor}`}>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-[#6B7280] hover:text-[#1A1A2E] hover:bg-[#F0F2F5] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${config.bgColor} ${config.glowColor} shadow-lg`}>
                <Icon className={`w-8 h-8 ${config.textColor}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1A1A2E]">{config.title}</h2>
                <p className={`text-sm ${config.textColor} mt-1`}>{config.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-6 space-y-6">
            {/* Combined Score - Large Display */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-[#E8EAF0]"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${(combinedScore / 100) * 351.86} 351.86`}
                    className={config.textColor}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className={`text-4xl font-bold ${config.textColor}`}>{combinedScore}%</div>
                  <div className="text-xs text-[#6B7280] mt-1">Combined Score</div>
                </div>
              </div>

              {/* Minimum requirement indicator */}
              {minimumScore && (
                <p className="text-sm text-[#6B7280] mt-3">
                  Minimum required: <span className="text-[#1A1A2E] font-medium">{minimumScore}%</span>
                  {combinedScore < minimumScore && (
                    <span className="text-red-600 ml-2">(-{minimumScore - combinedScore}% below threshold)</span>
                  )}
                </p>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#3DD68C]" />
                Score Breakdown
              </h3>

              {/* AI Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">AI Analysis</span>
                  <span className="text-[#1A1A2E] font-medium">{aiScore}%</span>
                </div>
                <div className="h-2 bg-[#F0F2F5] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${aiScore}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={`h-full ${config.progressColor} rounded-full`}
                  />
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Weight: {Math.round((weighting?.ai || 0.5) * 100)}%
                </p>
              </div>

              {/* External Verification Score */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">External Verification</span>
                  <span className="text-[#1A1A2E] font-medium">{verificationScore}%</span>
                </div>
                <div className="h-2 bg-[#F0F2F5] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${verificationScore}%` }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className={`h-full ${config.progressColor} rounded-full opacity-80`}
                  />
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Weight: {Math.round((weighting?.external || 0.5) * 100)}%
                </p>
              </div>
            </div>

            {/* Trust Scale Legend */}
            <div className="p-4 bg-[#F5F6FA] rounded-xl border border-[#E8EAF0]">
              <h4 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-3">
                Trust Score Scale
              </h4>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-[#6B7280]">Verified</span>
                  <span className="text-green-600 font-medium">{thresholds?.verified || 70}+</span>
                </div>
                <div className="flex-1 h-px bg-[#E8EAF0]"></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-[#6B7280]">Suspicious</span>
                  <span className="text-amber-600 font-medium">{thresholds?.suspicious || 40}-{thresholds?.verified || 70}</span>
                </div>
                <div className="flex-1 h-px bg-[#E8EAF0]"></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-[#6B7280]">Scam</span>
                  <span className="text-red-600 font-medium">&lt;{thresholds?.suspicious || 40}</span>
                </div>
              </div>
            </div>

            {/* Expandable Details Section */}
            {issues.length > 0 && (
              <div className="border border-[#E8EAF0] rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5F6FA] transition-colors"
                >
                  <span className="text-sm font-medium text-[#1A1A2E] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    View Detailed Issues ({issues.length})
                  </span>
                  {showDetails ? (
                    <ChevronUp className="w-4 h-4 text-[#6B7280]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#6B7280]" />
                  )}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 space-y-3">
                        {issues.map((issue, idx) => (
                          <div key={idx} className="flex items-start gap-3 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0"></div>
                            <span className="text-[#6B7280]">{issue}</span>
                          </div>
                        ))}
                        
                        {recommendations.length > 0 && (
                          <>
                            <div className="h-px bg-[#E8EAF0] my-3"></div>
                            <p className="text-xs text-[#9CA3AF] font-medium uppercase tracking-wide">
                              Recommendations
                            </p>
                            {recommendations.map((rec, idx) => (
                              <div key={idx} className="flex items-start gap-3 text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#3DD68C] mt-2 flex-shrink-0"></div>
                                <span className="text-[#6B7280]">{rec}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {isBlocked && onEdit && (
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Listing
                </button>
              )}
              
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#F0F2F5] hover:bg-[#E8EAF0] text-[#1A1A2E] font-medium transition-colors"
              >
                {isBlocked ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    Go Back
                  </>
                ) : (
                  'Close'
                )}
              </button>
            </div>

            {/* Manual Review Note */}
            {status === 'pending_review' && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-600 flex items-start gap-2">
                  <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  This listing will be submitted for manual admin review before being published.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
