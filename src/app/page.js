'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMounted } from '@/lib/hooks/useMounted';
import { 
  Shield, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.isNewUser) {
      router.push('/select-role');
    }
  }, [status, session, router]);

  // Role-based content
  const getHeroContent = () => {
    const role = session?.user?.role;
    
    if (role === 'company') {
      return {
        title: 'Find Top Talent with',
        subtitle: 'AI-Powered Verification',
        description: 'Post verified internships and hire confidently. Our AI ensures every candidate matches your requirements.',
        primaryCTA: { href: '/post', text: 'Post Internship', icon: Building2 },
        secondaryCTA: { href: '/dashboard', text: 'View Dashboard', icon: Briefcase },
        stats: [
          { value: 'AI-Powered', label: 'Candidate Screening' },
          { value: 'Verified', label: 'Applicant Pool' },
          { value: 'Smart', label: 'Resume Matching' },
        ]
      };
    }
    
    if (role === 'admin') {
      return {
        title: 'Moderate & Manage',
        subtitle: 'Platform Administration',
        description: 'Oversee internship listings, manage users, and ensure platform integrity with AI-powered tools.',
        primaryCTA: { href: '/admin', text: 'Admin Dashboard', icon: Shield },
        secondaryCTA: { href: '/internships', text: 'View Listings', icon: Briefcase },
        stats: [
          { value: 'Full', label: 'Platform Control' },
          { value: 'AI-Assisted', label: 'Moderation' },
          { value: 'Real-time', label: 'Monitoring' },
        ]
      };
    }
    
    // Default for students and non-logged-in users
    return {
      title: 'Apply Smarter. Avoid Scams.',
      subtitle: 'Land Better Internships.',
      description: 'Verified opportunities, AI-powered resume matching, and smarter applications—built for ambitious students.',
      primaryCTA: { href: '/internships', text: 'Find Internships', icon: Briefcase },
      secondaryCTA: role === 'student' ? { href: '/dashboard', text: 'My Dashboard', icon: Briefcase } : { href: '/post', text: 'Hire Talent', icon: Building2 },
      stats: [
        { value: 'AI-Powered', label: 'Scam Detection' },
        { value: 'Smart', label: 'Resume Matching' },
        { value: 'Verified', label: 'Opportunities' },
      ]
    };
  };

  const heroContent = getHeroContent();

  return (
    <div className="min-h-screen bg-[#F5F6FA]" suppressHydrationWarning>
      <section className="relative pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E8EAF0] mb-8">
              <Sparkles className="w-4 h-4 text-[#3DD68C]" />
              <span className="text-sm text-[#6B7280]">{heroContent.subtitle}</span>
            </motion.div>
            
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-[#1A1A2E]"
            >
              {heroContent.title}
              <span className="text-[#3DD68C]">
                {' '}{session?.user?.role === 'company' ? 'Talent' : session?.user?.role === 'admin' ? 'Platform' : 'Internships'}
              </span>
              {session?.user?.role !== 'company' && session?.user?.role !== 'admin' && <><br />with Confidence</>}
            </motion.h1>
            
            <motion.p
              variants={fadeInUp}
              className="text-lg text-[#6B7280] max-w-2xl mx-auto mb-10"
            >
              {heroContent.description}
            </motion.p>
            
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href={heroContent.primaryCTA.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#1A1A2E] hover:opacity-85 text-white font-semibold transition-opacity group"
              >
                <heroContent.primaryCTA.icon className="w-5 h-5" />
                {heroContent.primaryCTA.text}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href={heroContent.secondaryCTA.href}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white border border-[#E8EAF0] hover:border-[#3DD68C] hover:text-[#3DD68C] text-[#1A1A2E] font-semibold transition-all"
              >
                <heroContent.secondaryCTA.icon className="w-5 h-5" />
                {heroContent.secondaryCTA.text}
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {heroContent.stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 text-center border border-[#E8EAF0] shadow-sm">
                <div className="text-3xl font-bold text-[#3DD68C] mb-2">{stat.value}</div>
                <p className="text-[#6B7280]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1A1A2E]">
              How <span className="text-[#3DD68C]">HireSense AI</span> Works
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              {session?.user?.role === 'company' 
                ? 'Post verified internships, screen candidates with AI, and hire top talent confidently.'
                : session?.user?.role === 'admin'
                ? 'Moderate listings, manage users, and ensure platform integrity with AI-powered tools.'
                : 'Our AI-powered platform ensures every internship is verified and matches you with the best opportunities.'
              }
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {session?.user?.role === 'company' ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <Shield className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">AI Verification</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Every posting is analyzed for authenticity with external checks on websites, domains, and LinkedIn profiles.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <Brain className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">Candidate Screening</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Upload candidate resumes and let our AI match them to your requirements with detailed scoring.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">Trust Badges</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Verified postings display trust scores and badges, helping attract quality candidates.
                  </p>
                </motion.div>
              </>
            ) : session?.user?.role === 'admin' ? (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <Shield className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">AI Moderation</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    AI-powered scam detection automatically flags suspicious listings for review.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <Brain className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">User Management</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Manage users, roles, and permissions with full control over platform access.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">Real-time Monitoring</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Monitor platform activity, track verification metrics, and ensure integrity.
                  </p>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <Shield className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">AI Scam Detection</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Our advanced AI analyzes every internship posting to detect fake listings, 
                    suspicious patterns, and potential scams before they reach you.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <Brain className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">Smart Matching</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Upload your resume and let our AI match you with relevant internships, 
                    providing match scores and personalized recommendations.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-[#F5F6FA] rounded-2xl p-8 group hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center mb-6">
                    <CheckCircle className="w-7 h-7 text-[#3DD68C]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1A1A2E]">Verified Badges</h3>
                  <p className="text-[#6B7280] leading-relaxed">
                    Each listing displays a trust score and verification badge, 
                    helping you identify legitimate opportunities at a glance.
                  </p>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F5F6FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1A1A2E]">
              Trust <span className="text-[#3DD68C]">Indicators</span>
            </h2>
            <p className="text-[#6B7280] max-w-2xl mx-auto">
              Every internship is analyzed and assigned a verification status 
              based on our AI assessment.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-6 border border-[#10b981]/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#10b981]">Verified</h3>
                  <p className="text-sm text-[#6B7280]">Score: 80-100</p>
                </div>
              </div>
              <p className="text-[#6B7280]">
                Internships that pass our AI verification with high confidence. 
                These listings are legitimate and safe to apply.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl p-6 border border-[#f59e0b]/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#f59e0b]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#f59e0b]">Suspicious</h3>
                  <p className="text-sm text-[#6B7280]">Score: 50-79</p>
                </div>
              </div>
              <p className="text-[#6B7280]">
                Listings with some red flags that warrant caution. 
                Review carefully before applying.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-2xl p-6 border border-[#ef4444]/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#ef4444]/20 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-[#ef4444]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#ef4444]">Scam</h3>
                  <p className="text-sm text-[#6B7280]">Score: Below 50</p>
                </div>
              </div>
              <p className="text-[#6B7280]">
                Listings identified as potential scams with multiple red flags. 
                These are flagged for removal.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#F5F6FA] rounded-3xl p-12 text-center"
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1A1A2E]">
                {session?.user?.role === 'company' 
                  ? 'Ready to Find Your Top Talent?'
                  : session?.user?.role === 'admin'
                  ? 'Ready to Moderate the Platform?'
                  : 'Ready to Find Your Dream Internship?'
                }
              </h2>
              <p className="text-[#6B7280] max-w-xl mx-auto mb-8">
                {session?.user?.role === 'company' 
                  ? 'Post verified internships and hire with confidence using AI-powered candidate screening.'
                  : session?.user?.role === 'admin'
                  ? 'Manage listings, moderate content, and ensure platform integrity with AI-powered tools.'
                  : 'Join thousands of students who trust HireSense AI to find legitimate opportunities and advance their careers.'
                }
              </p>
              <Link
                href={session?.user?.role === 'company' ? '/post' : session?.user?.role === 'admin' ? '/admin' : '/internships'}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#1A1A2E] hover:opacity-85 text-white font-medium transition-opacity group"
              >
                {session?.user?.role === 'company' ? 'Post Internship' : session?.user?.role === 'admin' ? 'Go to Admin' : 'Get Started'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
