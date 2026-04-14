'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Filter, Briefcase, Sparkles, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import InternshipCard from '@/components/InternshipCard';

const VerificationBadge = ({ status, score }) => {
  const configs = {
    verified: {
      icon: CheckCircle,
      color: 'text-[#10b981]',
      bg: 'bg-[#10b981]/15',
      border: 'border-[#10b981]/30',
      label: 'Verified'
    },
    suspicious: {
      icon: AlertTriangle,
      color: 'text-[#f59e0b]',
      bg: 'bg-[#f59e0b]/15',
      border: 'border-[#f59e0b]/30',
      label: 'Suspicious'
    },
    scam: {
      icon: XCircle,
      color: 'text-[#ef4444]',
      bg: 'bg-[#ef4444]/15',
      border: 'border-[#ef4444]/30',
      label: 'Scam'
    },
    pending: {
      icon: Clock,
      color: 'text-[#6B7280]',
      bg: 'bg-[#F0F2F5]',
      border: 'border-[#E8EAF0]',
      label: 'Pending'
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} ${config.border} border`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label} ({score}%)
      </span>
    </div>
  );
};

export default function InternshipsPage() {
  const { data: session } = useSession();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    status: ''
  });

  useEffect(() => {
    const fetchInternships = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.location) queryParams.append('location', filters.location);
        if (filters.status) queryParams.append('status', filters.status);

        const res = await fetch(`/api/internships?${queryParams}`);
        const data = await res.json();
        
        if (data.success) {
          setInternships(data.data);
        }
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInternships();
  }, [filters]);

  if (loading) {
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
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold mb-4 text-[#1A1A2E]">
            Get <span className="text-[#3DD68C]">Hired</span>
          </h1>
          <p className="text-[#6B7280] max-w-2xl mx-auto">
            Browse verified internship opportunities with AI-powered scam detection. 
            Find your perfect match and apply with confidence.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 mb-8 border border-[#E8EAF0] shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-[#3DD68C]" />
            <span className="font-medium text-[#1A1A2E]">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] focus:border-[#3DD68C] outline-none"
            >
              <option value="">All Types</option>
              <option value="remote">Remote</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <input
              type="text"
              placeholder="Location..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="px-4 py-2 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] focus:border-[#3DD68C] outline-none"
            >
              <option value="">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="scam">Scam</option>
            </select>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-[#6B7280]">
            Showing <span className="text-[#1A1A2E] font-medium">{internships.length}</span> internships
          </p>
          {session?.user?.role === 'student' && (
            <div className="flex items-center gap-2 text-[#3DD68C] text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI matching enabled</span>
            </div>
          )}
        </div>

        {/* Internships Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internships.map((internship, index) => (
            <motion.div
              key={internship._id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <InternshipCard 
                internship={internship}
                userMatch={null}
                showApply={session?.user?.role === 'student'}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {internships.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Briefcase className="w-16 h-16 text-[#E8EAF0] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#1A1A2E] mb-2">No internships found</h3>
            <p className="text-[#6B7280]">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
