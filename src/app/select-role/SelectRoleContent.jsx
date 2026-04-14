'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, Loader2 } from 'lucide-react';

export default function SelectRoleContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Wait for session to load before checking authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleRoleSelect = async (role) => {
    setLoading(true);
    setSelectedRole(role);
    
    try {
      const res = await fetch('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Update the session to reflect the new role
        await update({ role });
        
        if (role === 'company') {
          router.push('/post');
        } else {
          router.push('/internships');
        }
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setLoading(false);
    }
  };

  // Guard against prerender/undefined status
  if (!status || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6FA]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3DD68C] mx-auto" />
          <p className="text-[#6B7280] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while checking auth (will redirect in useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#F5F6FA]">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 text-[#1A1A2E]">
            Choose Your <span className="text-[#3DD68C]">Role</span>
          </h1>
          <p className="text-[#6B7280] text-lg">
            Select how you want to use HireSense AI
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => !loading && handleRoleSelect('student')}
            className={`bg-white rounded-2xl p-8 cursor-pointer transition-all border border-[#E8EAF0] shadow-sm hover:shadow-md ${
              selectedRole === 'student' ? 'ring-2 ring-[#3DD68C]' : 'hover:ring-2 hover:ring-[#3DD68C]/50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                <User className="w-10 h-10 text-[#3DD68C]" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#1A1A2E]">Student</h3>
              <p className="text-[#6B7280] mb-6">
                Browse internships, apply to positions, and track your applications
              </p>
              <div className="flex items-center gap-2 text-[#3DD68C]">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => !loading && handleRoleSelect('company')}
            className={`bg-white rounded-2xl p-8 cursor-pointer transition-all border border-[#E8EAF0] shadow-sm hover:shadow-md ${
              selectedRole === 'company' ? 'ring-2 ring-[#3DD68C]' : 'hover:ring-2 hover:ring-[#3DD68C]/50'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                <Building2 className="w-10 h-10 text-[#3DD68C]" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#1A1A2E]">Company / Recruiter</h3>
              <p className="text-[#6B7280] mb-6">
                Post internship listings, review applications, and hire talent
              </p>
              <div className="flex items-center gap-2 text-[#3DD68C]">
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </div>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-8"
          >
            <div className="animate-spin w-8 h-8 border-2 border-[#3DD68C] border-t-transparent rounded-full mx-auto" />
            <p className="text-[#6B7280] mt-4">Setting up your account...</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
