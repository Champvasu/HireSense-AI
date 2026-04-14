'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useMounted } from '@/lib/hooks/useMounted';
import { formatDate } from '@/lib/utils/dateFormat';

const StatusBadge = ({ status }) => {
  const configs = {
    applied: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Applied' },
    under_review: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Under Review' },
    shortlisted: { color: 'text-[#3DD68C]', bg: 'bg-[#3DD68C]/15', label: 'Shortlisted' },
    accepted: { color: 'text-green-600', bg: 'bg-green-100', label: 'Accepted' },
    rejected: { color: 'text-red-600', bg: 'bg-red-100', label: 'Rejected' },
    pending: { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending' },
    approved: { color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' }
  };

  const config = configs[status] || configs.applied;

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mounted = useMounted();
  const [applications, setApplications] = useState([]);
  const [postedInternships, setPostedInternships] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/apply');
        const data = await res.json();
        
        if (data.success) {
          setApplications(data.data);
          setStats({
            total: data.data.length,
            shortlisted: data.data.filter(a => a.status === 'shortlisted').length,
            accepted: data.data.filter(a => a.status === 'accepted').length,
            rejected: data.data.filter(a => a.status === 'rejected').length
          });
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchPostedInternships = async () => {
      try {
        const res = await fetch('/api/internships?my=true');
        const data = await res.json();
        
        if (data.success) {
          const myInternships = data.data.filter(i => i.postedBy?._id === session?.user?.id);
          setPostedInternships(myInternships);
          setStats({
            total: myInternships.length,
            pending: myInternships.filter(i => i.adminApproval?.status === 'pending').length,
            approved: myInternships.filter(i => i.adminApproval?.status === 'approved').length,
            totalApplications: myInternships.reduce((sum, i) => sum + (i.applicationCount || 0), 0)
          });
        }
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session?.user?.role !== 'student' && session?.user?.role !== 'company') {
      router.push('/');
    } else if (status === 'authenticated') {
      if (session?.user?.role === 'student') {
        fetchApplications();
      } else if (session?.user?.role === 'company') {
        fetchPostedInternships();
      }
    }
  }, [status, session, router]);

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
          <h1 className="text-4xl font-bold mb-2 text-[#1A1A2E]">
            {session?.user?.role === 'student' ? 'Student' : 'Company'} Dashboard
          </h1>
          <p className="text-[#6B7280]">
            {session?.user?.role === 'student' 
              ? 'Track your applications and manage your internship journey.'
              : 'Manage your internship listings and review applications.'}
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
                <FileText className="w-5 h-5 text-[#6B7280]" />
              </div>
              <span className="text-2xl font-bold text-[#1A1A2E]">{stats.total}</span>
            </div>
            <p className="text-sm text-[#6B7280]">{session?.user?.role === 'student' ? 'Total Applications' : 'Total Listings'}</p>
          </div>
          {session?.user?.role === 'student' ? (
            <>
              <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#3DD68C]/15 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#3DD68C]" />
                  </div>
                  <span className="text-2xl font-bold text-[#1A1A2E]">{stats.shortlisted}</span>
                </div>
                <p className="text-sm text-[#6B7280]">Shortlisted</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#1A1A2E]">{stats.accepted}</span>
                </div>
                <p className="text-sm text-[#6B7280]">Accepted</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#1A1A2E]">{stats.rejected}</span>
                </div>
                <p className="text-sm text-[#6B7280]">Rejected</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#1A1A2E]">{stats.pending}</span>
                </div>
                <p className="text-sm text-[#6B7280]">Pending Approval</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-[#1A1A2E]">{stats.approved}</span>
                </div>
                <p className="text-sm text-[#6B7280]">Approved</p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-[#E8EAF0] shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#F0F2F5] flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#6B7280]" />
                  </div>
                  <span className="text-2xl font-bold text-[#1A1A2E]">{stats.totalApplications}</span>
                </div>
                <p className="text-sm text-[#6B7280]">Total Applications</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl overflow-hidden border border-[#E8EAF0] shadow-sm"
        >
          <div className="p-6 border-b border-[#E8EAF0]">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-[#1A1A2E]">
              <Briefcase className="w-5 h-5 text-[#6B7280]" />
              {session?.user?.role === 'student' ? 'Your Applications' : 'Your Listings'}
            </h2>
          </div>

          {session?.user?.role === 'student' ? (
            applications.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-[#E8EAF0] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">No applications yet</h3>
                <p className="text-[#6B7280] mb-6">Start applying to internships to see them here.</p>
                <button
                  onClick={() => router.push('/internships')}
                  className="px-6 py-3 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-medium transition-colors"
                >
                  Browse Internships
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E8EAF0]">
                {applications.map((app) => (
                  <div key={app._id} className="p-6 hover:bg-[#F5F6FA] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 text-[#1A1A2E]">{app.internship?.title}</h3>
                        <p className="text-[#6B7280] text-sm mb-2">{app.internship?.company}</p>
                        <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Applied {mounted ? formatDate(app.appliedAt) : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <StatusBadge status={app.status} />
                        {app.aiMatch?.score > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-[#6B7280]">Match:</span>
                            <span className={`font-semibold ${
                              app.aiMatch.score >= 80 ? 'text-green-600' :
                              app.aiMatch.score >= 50 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {app.aiMatch.score}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            postedInternships.length === 0 ? (
              <div className="p-12 text-center">
                <Briefcase className="w-16 h-16 text-[#E8EAF0] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#1A1A2E] mb-2">No listings yet</h3>
                <p className="text-[#6B7280] mb-6">Post your first internship to start hiring talent.</p>
                <button
                  onClick={() => router.push('/post')}
                  className="px-6 py-3 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-medium transition-colors"
                >
                  Post Internship
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#E8EAF0]">
                {postedInternships.map((internship) => (
                  <div key={internship._id} className="p-6 hover:bg-[#F5F6FA] transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1 text-[#1A1A2E]">{internship.title}</h3>
                        <p className="text-[#6B7280] text-sm mb-2">{internship.company}</p>
                        <div className="flex items-center gap-4 text-sm text-[#9CA3AF]">
                          <span>{internship.location}</span>
                          <span>{internship.type}</span>
                          <span>Posted: {mounted ? formatDate(internship.createdAt) : ''}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <StatusBadge status={internship.adminApproval?.status} />
                        <button
                          onClick={() => router.push(`/internships/${internship._id}`)}
                          className="text-sm text-[#3DD68C] hover:text-[#2BC47A]"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </motion.div>
      </div>
    </div>
  );
}
