'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase,
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  ArrowLeft,
  Upload,
  Loader2,
  Sparkles,
  FileText
} from 'lucide-react';
import { formatStipend } from '@/lib/utils/currencyFormatter';

const VerificationBadge = ({ status, score }) => {
  const configs = {
    verified: {
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/20',
      border: 'border-success/30',
      label: 'Verified'
    },
    suspicious: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/20',
      border: 'border-warning/30',
      label: 'Suspicious'
    },
    scam: {
      icon: XCircle,
      color: 'text-danger',
      bg: 'bg-danger/20',
      border: 'border-danger/30',
      label: 'Scam'
    },
    pending: {
      icon: Clock,
      color: 'text-gray-400',
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/30',
      label: 'Pending'
    }
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg} ${config.border} border`}>
      <Icon className={`w-5 h-5 ${config.color}`} />
      <span className={`font-medium ${config.color}`}>
        {config.label} ({score}%)
      </span>
    </div>
  );
};

export default function InternshipDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [aiMatch, setAiMatch] = useState(null);
  const [checkingMatch, setCheckingMatch] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await fetch(`/api/internships/${params.id}`);
        const data = await res.json();
        
        if (data.success) {
          setInternship(data.data);
        }
      } catch (error) {
        console.error('Error fetching internship:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInternship();
  }, [params.id]);

  const checkMatch = async () => {
    if (!resumeFile) {
      setError('Please upload a resume first');
      return;
    }
    setError(null);
    setAiMatch(null);

    setCheckingMatch(true);
    try {
      // Create FormData to send the actual file
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', internship.description);
      formData.append('requiredSkills', JSON.stringify(internship.skills || []));
      formData.append('internshipId', params.id);

      const res = await fetch('/api/ai/match', {
        method: 'POST',
        body: formData
        // Note: Don't set Content-Type header, let browser set it with boundary
      });

      const data = await res.json();
      if (data.success) {
        setAiMatch(data.data);
        // Store extracted text for later use
        if (data.data.extractedText) {
          setResumeText(data.data.extractedText);
        }
      } else {
        setError(data.error || 'Failed to analyze resume match');
      }
    } catch (error) {
      console.error('Error checking match:', error);
      setError('Failed to check match. Please try again.');
    } finally {
      setCheckingMatch(false);
    }
  };

  const handleApply = async () => {
    if (!session) {
      setError('Please sign in to apply');
      return;
    }
    setError(null);
    setSuccessMessage(null);

    setApplying(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internshipId: params.id,
          resumeUrl: resumeFile ? URL.createObjectURL(resumeFile) : '',
          resumeText,
          coverLetter
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage('Application submitted successfully! Redirecting...');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying:', error);
      setError('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);
      // In a real app, you'd parse the PDF here
      // For now, we'll just use the file name as placeholder text
      setResumeText(`Resume: ${file.name}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400">Internship not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/internships')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Internships
        </motion.button>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-danger/20 border border-danger/30 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-danger font-medium">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-danger/70 hover:text-danger mt-1"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-success/20 border border-success/30 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-success font-medium">{successMessage}</p>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-8 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{internship.title}</h1>
              <p className="text-xl text-gray-400">{internship.company}</p>
            </div>
            <VerificationBadge 
              status={internship.aiVerification?.status} 
              score={internship.aiVerification?.score} 
            />
          </div>

          {/* AI Analysis */}
          {internship.aiVerification?.reasons?.length > 0 && (
            <div className={`p-4 rounded-xl mb-6 ${
              internship.aiVerification.status === 'verified' ? 'bg-success/10 border border-success/30' :
              internship.aiVerification.status === 'suspicious' ? 'bg-warning/10 border border-warning/30' :
              'bg-danger/10 border border-danger/30'
            }`}>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                AI Verification Analysis
              </h4>
              <ul className="space-y-2">
                {internship.aiVerification.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{internship.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{internship.type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{internship.duration}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Stipend</p>
                <p className="font-medium">{formatStipend(internship.stipend)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-8 mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {internship.description}
          </p>
        </motion.div>

        {/* Requirements */}
        {internship.requirements?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-8 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Requirements</h2>
            <ul className="space-y-3">
              {internship.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{req}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Skills */}
        {internship.skills?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-8 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {internship.skills.map((skill) => (
                <span 
                  key={skill}
                  className="px-4 py-2 rounded-lg bg-accent/20 text-accent font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Application Section */}
        {session?.user?.role === 'student' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-8"
          >
            <h2 className="text-xl font-semibold mb-6">Apply for this Internship</h2>

            {/* Resume Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Upload Resume *
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-dashed border-white/20 hover:border-accent cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">
                    {resumeFile ? resumeFile.name : 'Click to upload resume'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={checkMatch}
                  disabled={checkingMatch || !resumeFile}
                  className="px-6 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-all disabled:opacity-50 disabled:bg-white/5 flex items-center gap-2 glow-accent"
                >
                  {checkingMatch ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Check Match
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Match Result */}
            {aiMatch && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-xl mb-6 ${
                  aiMatch.score >= 80 ? 'bg-success/10 border border-success/30' :
                  aiMatch.score >= 50 ? 'bg-warning/10 border border-warning/30' :
                  'bg-danger/10 border border-danger/30'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-accent" />
                    AI Match Analysis
                  </h4>
                  <span className={`text-2xl font-bold ${
                    aiMatch.score >= 80 ? 'text-success' :
                    aiMatch.score >= 50 ? 'text-warning' : 'text-danger'
                  }`}>
                    {aiMatch.score}%
                  </span>
                </div>
                <p className="text-gray-300 mb-4">{aiMatch.feedback}</p>
                
                {aiMatch.matchingSkills?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-success mb-2">Matching Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiMatch.matchingSkills.map((skill) => (
                        <span key={skill} className="px-2 py-1 rounded bg-success/20 text-success text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {aiMatch.missingSkills?.length > 0 && (
                  <div>
                    <p className="text-sm text-warning mb-2">Skills to Develop:</p>
                    <div className="flex flex-wrap gap-2">
                      {aiMatch.missingSkills.map((skill) => (
                        <span key={skill} className="px-2 py-1 rounded bg-warning/20 text-warning text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Cover Letter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-gray-500 focus:border-accent outline-none resize-none"
                placeholder="Tell us why you're interested in this position..."
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleApply}
              disabled={applying || !resumeFile}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-all glow-accent disabled:opacity-50"
            >
              {applying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Submit Application
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
