'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  FileText, 
  Plus,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Shield,
  UserCheck
} from 'lucide-react';
import VerificationModal from '@/components/VerificationModal';

export default function PostInternshipPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [verificationModal, setVerificationModal] = useState({
    isOpen: false,
    data: null
  });
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    companyEmail: '',
    companyWebsite: '',
    companyLinkedIn: '',
    companyRegistrationId: '',
    foundedYear: '',
    companySize: '',
    headquarters: '',
    recruiterTitle: '',
    recruiterLinkedIn: '',
    hiringProcess: '',
    interviewRounds: '',
    reportingManager: '',
    conversionOpportunity: false,
    numberOfOpenings: '',
    testimonials: [''],
    location: '',
    type: 'remote',
    description: '',
    requirements: [''],
    skills: [''],
    duration: '',
    stipend: '',
    applicationDeadline: ''
  });

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  if (status === 'authenticated' && session?.user?.role !== 'company' && session?.user?.role !== 'admin') {
    router.push('/internships');
    return null;
  }

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({ ...formData, [field]: newArray });
  };

  const addArrayField = (field) => {
    setFormData({ ...formData, [field]: [...formData[field], ''] });
  };

  const removeArrayField = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData({ ...formData, [field]: newArray });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim()),
        skills: formData.skills.filter(s => s.trim())
      };
      
      const res = await fetch('/api/internships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        // Show verification modal based on status
        const status = data.data?.adminApproval?.status;
        const verificationData = {
          status: status === 'pending_admin_review' ? 'pending_review' : 'verified',
          combinedScore: data.data?.trustScore || 0,
          aiScore: data.data?.aiScore || 0,
          verificationScore: data.data?.externalScore || 0,
          minimumScore: 40,
          weighting: { ai: 0.6, external: 0.4 },
          thresholds: { verified: 70, suspicious: 40 },
          issues: status === 'pending_admin_review' 
            ? ['Trust score in borderline range (40-69%)', 'Requires manual admin review']
            : [],
          recommendations: []
        };
        
        setVerificationModal({
          isOpen: true,
          data: verificationData
        });

        // Auto-redirect after delay for successful posts
        setTimeout(() => {
          if (status !== 'pending_admin_review') {
            router.push('/dashboard');
          }
        }, 3000);
      } else {
        // Handle validation errors (400 Bad Request)
        if (data.error === 'Validation failed' && data.details) {
          const newFieldErrors = {};
          data.details.forEach(err => {
            if (err.field) {
              newFieldErrors[err.field] = err.message;
            }
          });
          setFieldErrors(newFieldErrors);
          console.log('Validation errors:', data.details);
        }
        // Handle blocked/rejected postings with detailed scoring breakdown
        else if (data.details?.scoringBreakdown) {
          const breakdown = data.details.scoringBreakdown;
          const score = breakdown.combinedScore;
          
          // Determine status based on score
          let status = 'suspicious';
          if (data.details.blockedStatus === 'scam' || score < (breakdown.thresholds?.suspicious || 40)) {
            status = 'scam';
          }
          
          const verificationData = {
            status,
            combinedScore: score,
            aiScore: breakdown.aiScore,
            verificationScore: breakdown.verificationScore,
            minimumScore: data.details.minimumScore,
            weighting: breakdown.weighting,
            thresholds: breakdown.thresholds,
            issues: data.details.issues || [
              `Combined score ${score}% below minimum ${data.details.minimumScore}%`,
              'Low AI trust score',
              'Weak company verification signals'
            ],
            recommendations: [
              'Add more detailed company information',
              'Include verifiable company website',
              'Provide LinkedIn company page',
              'Add recruiter professional profiles'
            ]
          };
          
          setVerificationModal({
            isOpen: true,
            data: verificationData
          });
        } else if (data.details?.blockedStatus || data.details?.aiScore !== undefined) {
          const score = data.details?.aiScore || 0;
          const isScam = data.details?.blockedStatus === 'scam' || score < 40;
          
          const verificationData = {
            status: isScam ? 'scam' : 'suspicious',
            combinedScore: score,
            aiScore: score,
            verificationScore: data.details?.externalScore || 0,
            minimumScore: data.details.minimumScore,
            weighting: { ai: 0.6, external: 0.4 },
            thresholds: { verified: 70, suspicious: 40 },
            issues: [
              `Trust score ${score}% below minimum ${data.details.minimumScore}%`,
              isScam ? 'Scam indicators detected' : 'Suspicious patterns detected'
            ],
            recommendations: [
              'Review and improve company credibility signals',
              'Add more professional details'
            ]
          };
          
          setVerificationModal({
            isOpen: true,
            data: verificationData
          });
        } else {
          const errorMsg = data.details ? `${data.error}: ${JSON.stringify(data.details)}` : data.error;
          // For simple errors without verification data, show inline error
          setFieldErrors({ submit: errorMsg || 'Failed to post internship' });
        }
      }
    } catch (error) {
      console.error('Error posting internship:', error);
      setFieldErrors({ submit: `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 bg-[#F5F6FA]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold mb-4 text-[#1A1A2E]">
            Hire <span className="text-[#3DD68C]">Talent</span>
          </h1>
          <p className="text-[#6B7280] max-w-2xl mx-auto">
            Create internship opportunities and find the perfect candidates. 
            Our AI will verify your listing before publishing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-[#E8EAF0]"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                    fieldErrors.title ? 'border-red-500' : 'border-transparent'
                  }`}
                  placeholder="e.g., Software Engineering Intern"
                />
                {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.company ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="Company name"
                  />
                </div>
                {fieldErrors.company && <p className="text-xs text-red-500 mt-1">{fieldErrors.company}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Company Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.companyEmail}
                  onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                    fieldErrors.companyEmail ? 'border-red-500' : 'border-transparent'
                  }`}
                  placeholder="hr@company.com"
                />
                {fieldErrors.companyEmail && <p className="text-xs text-red-500 mt-1">{fieldErrors.companyEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.location ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="City or Remote"
                  />
                </div>
                {fieldErrors.location && <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p>}
              </div>
            </div>

            {/* Company Verification */}
            <div className="border-t border-[#E8EAF0] pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#1A1A2E]">
                <Shield className="w-5 h-5 text-[#3DD68C]" />
                Company Verification
                <span className="text-sm font-normal text-[#6B7280]">(Optional - Improves Trust Score)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.companyWebsite ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="https://company.com"
                  />
                  {fieldErrors.companyWebsite && <p className="text-xs text-red-500 mt-1">{fieldErrors.companyWebsite}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    LinkedIn Company Page
                  </label>
                  <input
                    type="url"
                    value={formData.companyLinkedIn}
                    onChange={(e) => setFormData({ ...formData, companyLinkedIn: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.companyLinkedIn ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="https://linkedin.com/company/company-name"
                  />
                  {fieldErrors.companyLinkedIn && <p className="text-xs text-red-500 mt-1">{fieldErrors.companyLinkedIn}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Company Registration ID (GST/CIN)
                  </label>
                  <input
                    type="text"
                    value={formData.companyRegistrationId}
                    onChange={(e) => setFormData({ ...formData, companyRegistrationId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors"
                    placeholder="e.g., 29ABCDE1234F1Z5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    min="1800"
                    max={new Date().getFullYear() + 1}
                    value={formData.foundedYear}
                    onChange={(e) => setFormData({ ...formData, foundedYear: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.foundedYear ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="e.g., 2015"
                  />
                  {fieldErrors.foundedYear && <p className="text-xs text-red-500 mt-1">{fieldErrors.foundedYear}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Company Size
                  </label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.companySize ? 'border-red-500' : 'border-transparent'
                    }`}
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                  {fieldErrors.companySize && <p className="text-xs text-red-500 mt-1">{fieldErrors.companySize}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Headquarters / Office Address
                  </label>
                  <input
                    type="text"
                    value={formData.headquarters}
                    onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.headquarters ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="e.g., San Francisco, CA"
                  />
                  {fieldErrors.headquarters && <p className="text-xs text-red-500 mt-1">{fieldErrors.headquarters}</p>}
                </div>
              </div>
            </div>

            {/* Recruiter Credibility */}
            <div className="border-t border-[#E8EAF0] pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#1A1A2E]">
                <UserCheck className="w-5 h-5 text-[#3DD68C]" />
                Recruiter Credibility
                <span className="text-sm font-normal text-[#6B7280]">(Optional - Improves Trust Score)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Recruiter Title
                  </label>
                  <input
                    type="text"
                    value={formData.recruiterTitle}
                    onChange={(e) => setFormData({ ...formData, recruiterTitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors"
                    placeholder="e.g., HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Recruiter LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={formData.recruiterLinkedIn}
                    onChange={(e) => setFormData({ ...formData, recruiterLinkedIn: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.recruiterLinkedIn ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="https://linkedin.com/in/recruiter"
                  />
                  {fieldErrors.recruiterLinkedIn && <p className="text-xs text-red-500 mt-1">{fieldErrors.recruiterLinkedIn}</p>}
                </div>
              </div>
            </div>

            {/* Internship Authenticity */}
            <div className="border-t border-[#E8EAF0] pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#1A1A2E]">
                <CheckCircle className="w-5 h-5 text-[#3DD68C]" />
                Internship Authenticity
                <span className="text-sm font-normal text-[#6B7280]">(Optional - Improves Trust Score)</span>
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Hiring Process Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.hiringProcess}
                    onChange={(e) => setFormData({ ...formData, hiringProcess: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors resize-none"
                    placeholder="Describe the interview process, timeline, and what candidates can expect..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Number of Interview Rounds
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.interviewRounds}
                      onChange={(e) => setFormData({ ...formData, interviewRounds: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                        fieldErrors.interviewRounds ? 'border-red-500' : 'border-transparent'
                      }`}
                      placeholder="e.g., 2"
                    />
                    {fieldErrors.interviewRounds && <p className="text-xs text-red-500 mt-1">{fieldErrors.interviewRounds}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Reporting Manager / Team Name
                    </label>
                    <input
                      type="text"
                      value={formData.reportingManager}
                      onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors"
                      placeholder="e.g., Engineering Team"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                      Number of Openings
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.numberOfOpenings}
                      onChange={(e) => setFormData({ ...formData, numberOfOpenings: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                        fieldErrors.numberOfOpenings ? 'border-red-500' : 'border-transparent'
                      }`}
                      placeholder="e.g., 2"
                    />
                    {fieldErrors.numberOfOpenings && <p className="text-xs text-red-500 mt-1">{fieldErrors.numberOfOpenings}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="conversionOpportunity"
                      checked={formData.conversionOpportunity}
                      onChange={(e) => setFormData({ ...formData, conversionOpportunity: e.target.checked })}
                      className="w-5 h-5 rounded bg-[#F0F2F5] border border-[#E8EAF0] text-[#3DD68C] focus:border-[#3DD68C] outline-none"
                    />
                    <label htmlFor="conversionOpportunity" className="text-sm font-medium text-[#1A1A2E]">
                      Full-time conversion opportunity available
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                    Prior Intern Testimonials (Optional)
                  </label>
                  {formData.testimonials.map((testimonial, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={testimonial}
                        onChange={(e) => handleArrayChange('testimonials', index, e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none"
                        placeholder={`Testimonial ${index + 1} (optional)`}
                      />
                      {formData.testimonials.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayField('testimonials', index)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayField('testimonials')}
                    className="flex items-center gap-2 text-sm text-[#3DD68C] hover:text-[#2BC47A] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Testimonial
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] focus:border-[#3DD68C] outline-none transition-colors"
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Duration *
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors"
                    placeholder="e.g., 3 months"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                  Stipend
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
                  <input
                    type="text"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors ${
                      fieldErrors.stipend ? 'border-red-500' : 'border-transparent'
                    }`}
                    placeholder="e.g., ₹30,000/month or Unpaid"
                  />
                </div>
                {fieldErrors.stipend && <p className="text-xs text-red-500 mt-1">{fieldErrors.stipend}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                Application Deadline *
              </label>
              <input
                type="date"
                required
                value={formData.applicationDeadline}
                onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] focus:border-[#3DD68C] outline-none transition-colors ${
                  fieldErrors.applicationDeadline ? 'border-red-500' : 'border-transparent'
                }`}
              />
              {fieldErrors.applicationDeadline && <p className="text-xs text-red-500 mt-1">{fieldErrors.applicationDeadline}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                Description *
              </label>
              <textarea
                required
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl bg-[#F0F2F5] border text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none transition-colors resize-none ${
                  fieldErrors.description ? 'border-red-500' : 'border-transparent'
                }`}
                placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
              />
              {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                Requirements
              </label>
              {formData.requirements.map((req, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  {formData.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('requirements', index)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('requirements')}
                className="flex items-center gap-2 text-sm text-[#3DD68C] hover:text-[#2BC47A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Requirement
              </button>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A2E] mb-2">
                Required Skills
              </label>
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('skills', index, e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#F0F2F5] border border-transparent text-[#1A1A2E] placeholder-[#9CA3AF] focus:border-[#3DD68C] outline-none"
                    placeholder={`Skill ${index + 1}`}
                  />
                  {formData.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField('skills', index)}
                      className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('skills')}
                className="flex items-center gap-2 text-sm text-[#3DD68C] hover:text-[#2BC47A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>

            {/* Validation Feedback */}
            {fieldErrors.submit && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{fieldErrors.submit}</p>
              </div>
            )}
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#1A1A2E] hover:bg-[#2D2D44] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing & Posting...
                  </>
                ) : (
                  'Post Internship'
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Verification Modal */}
        <VerificationModal
          isOpen={verificationModal.isOpen}
          onClose={() => setVerificationModal({ isOpen: false, data: null })}
          onEdit={() => setVerificationModal({ isOpen: false, data: null })}
          verificationData={verificationModal.data}
          internshipTitle={formData.title}
        />
      </div>
    </div>
  );
}
