'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Users,
  Briefcase,
  FileText,
  CheckSquare,
  XSquare,
  Search
} from 'lucide-react';
import { useMounted } from '@/lib/hooks/useMounted';
import { formatDate } from '@/lib/utils/dateFormat';

const StatusBadge = ({ status, score }) => {
  const configs = {
    verified: { color: 'text-green-600', bg: 'bg-green-100', label: 'Verified' },
    suspicious: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Suspicious' },
    scam: { color: 'text-red-600', bg: 'bg-red-100', label: 'Scam' },
    pending: { color: 'text-[#6B7280]', bg: 'bg-[#F0F2F5]', label: 'Pending' }
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      {config.label} ({score}%)
    </span>
  );
};

const ApprovalBadge = ({ status }) => {
  const configs = {
    approved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' },
    rejected: { color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
    pending: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' }
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mounted = useMounted();
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingApproval: 0,
    totalApplications: 0,
    verifiedListings: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('listings');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      // Fetch all internships (including pending)
      const internRes = await fetch('/api/internships?status=all');
      const internData = await internRes.json();
      
      if (internData.success) {
        setInternships(internData.data);
        setStats({
          totalListings: internData.data.length,
          pendingApproval: internData.data.filter(i => i.adminApproval?.status === 'pending').length,
          verifiedListings: internData.data.filter(i => i.aiVerification?.status === 'verified').length,
          totalApplications: 0
        });
      }

      // Fetch all applications
      const appRes = await fetch('/api/apply');
      const appData = await appRes.json();
      
      if (appData.success) {
        setApplications(appData.data);
        setStats(prev => ({ ...prev, totalApplications: appData.data.length }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (internshipId, approvalStatus) => {
    try {
      const res = await fetch(`/api/internships/${internshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminApproval: {
            status: approvalStatus,
            notes: reviewNotes,
            reviewedAt: new Date()
          }
        })
      });

      const data = await res.json();

      if (data.success) {
        setInternships(internships.map(i => 
          i._id === internshipId ? data.data : i
        ));
        setReviewingId(null);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="animate-spin w-8 h-8 border-2 border-[#3DD68C] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-[#F5F6FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#3DD68C]" />
            </div>
            <h1 className="text-4xl font-bold text-[#1A1A2E]">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-[#6B7280]">
            Manage internship listings, review applications, and oversee platform operations.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
        >
          <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#F0F2F5] flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#6B7280]" />
              </div>
              <span className="text-2xl font-bold text-[#1A1A2E]">{stats.totalListings}</span>
            </div>
            <p className="text-sm text-[#6B7280]">Total Listings</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-[#1A1A2E]">{stats.pendingApproval}</span>
            </div>
            <p className="text-sm text-[#6B7280]">Pending Approval</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-[#1A1A2E]">{stats.verifiedListings}</span>
            </div>
            <p className="text-sm text-[#6B7280]">Verified by AI</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#F0F2F5] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#6B7280]" />
              </div>
              <span className="text-2xl font-bold text-[#1A1A2E]">{stats.totalApplications}</span>
            </div>
            <p className="text-sm text-[#6B7280]">Total Applications</p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'listings' 
                ? 'bg-[#3DD68C] text-white' 
                : 'bg-white border border-[#E8EAF0] text-[#6B7280] hover:border-[#3DD68C]'
            }`}
          >
            Internship Listings
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'applications' 
                ? 'bg-[#3DD68C] text-white' 
                : 'bg-white border border-[#E8EAF0] text-[#6B7280] hover:border-[#3DD68C]'
            }`}
          >
            Applications
          </button>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl overflow-hidden border border-[#E8EAF0] shadow-sm"
        >
          {activeTab === 'listings' ? (
            <div className="divide-y divide-[#E8EAF0]">
              {internships.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-[#E8EAF0] mx-auto mb-4" />
                  <p className="text-[#6B7280]">No internship listings found.</p>
                </div>
              ) : (
                internships.map((internship) => (
                  <div key={internship._id} className="p-6 hover:bg-[#F5F6FA] transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-[#1A1A2E]">{internship.title}</h3>
                          <StatusBadge 
                            status={internship.aiVerification?.status} 
                            score={internship.aiVerification?.score} 
                          />
                          <ApprovalBadge status={internship.adminApproval?.status} />
                        </div>
                        <p className="text-[#6B7280] text-sm mb-2">{internship.company}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#9CA3AF]">
                          <span>{internship.location}</span>
                          <span>{internship.type}</span>
                          <span>Posted by: {internship.postedBy?.name}</span>
                        </div>
                        
                        {/* AI Analysis */}
                        {internship.aiVerification?.reasons?.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-[#F5F6FA]">
                            <p className="text-sm text-[#6B7280] mb-2">AI Analysis:</p>
                            <ul className="text-sm text-[#9CA3AF] space-y-1">
                              {internship.aiVerification.reasons.map((reason, idx) => (
                                <li key={idx}>• {reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Review Interface */}
                        {reviewingId === internship._id && (
                          <div className="mt-4 p-4 rounded-xl bg-[#F5F6FA] border border-[#E8EAF0]">
                            <textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Add review notes (optional)..."
                              className="w-full px-4 py-2 rounded-lg bg-white border border-[#E8EAF0] text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none mb-3"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproval(internship._id, 'approved')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                              >
                                <CheckSquare className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleApproval(internship._id, 'rejected')}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              >
                                <XSquare className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  setReviewingId(null);
                                  setReviewNotes('');
                                }}
                                className="px-4 py-2 rounded-lg bg-[#F0F2F5] text-[#6B7280] hover:bg-[#E8EAF0] transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {internship.adminApproval?.status === 'pending' && reviewingId !== internship._id && (
                        <button
                          onClick={() => setReviewingId(internship._id)}
                          className="px-4 py-2 rounded-lg bg-[#3DD68C]/15 text-[#3DD68C] hover:bg-[#3DD68C]/25 transition-colors whitespace-nowrap"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#E8EAF0]">
              {applications.length === 0 ? (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-[#E8EAF0] mx-auto mb-4" />
                  <p className="text-[#6B7280]">No applications found.</p>
                </div>
              ) : (
                applications.map((app) => (
                  <div key={app._id} className="p-6 hover:bg-[#F5F6FA] transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 text-[#1A1A2E]">{app.internship?.title}</h3>
                        <p className="text-[#6B7280] text-sm mb-2">{app.internship?.company}</p>
                        <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {app.student?.name}
                          </span>
                          <span>Applied: {mounted ? formatDate(app.appliedAt) : ''}</span>
                        </div>
                        {app.aiMatch?.score > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-[#6B7280]">Match:</span>
                            <span className={`font-semibold ${
                              app.aiMatch.score >= 80 ? 'text-green-600' :
                              app.aiMatch.score >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {app.aiMatch.score}%
                            </span>
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        app.status === 'applied' ? 'text-blue-600 bg-blue-100' :
                        app.status === 'shortlisted' ? 'text-[#3DD68C] bg-[#3DD68C]/15' :
                        app.status === 'accepted' ? 'text-green-600 bg-green-100' :
                        'text-red-600 bg-red-100'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
