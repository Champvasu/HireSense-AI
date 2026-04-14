'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Sparkles, CheckCircle, AlertTriangle, XCircle, TrendingUp, BookOpen, Briefcase, GraduationCap, Award, ChevronDown, ChevronUp, Brain, Zap, ArrowRight, Target, GitBranch } from 'lucide-react';

export default function ResumeMatchModal({ internship, onClose }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF, DOCX, or TXT file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleCheckMatch = async () => {
    if (!file) {
      setError('Please upload a resume file');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', internship.jobDescription);
      formData.append('requiredSkills', internship.skills?.join(',') || '');

      const res = await fetch('/api/ai/match', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `Server error (${res.status})`;
        console.error('API error:', errorMessage);
        setError(errorMessage);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Failed to analyze resume');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        setError('Unable to connect to server. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getATSTierConfig = (recommendation) => {
    const configs = {
      'Strong Fit': {
        color: 'text-green-600',
        bg: 'bg-green-100',
        border: 'border-green-200',
        icon: Award
      },
      'Moderate Fit': {
        color: 'text-amber-600',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        icon: AlertTriangle
      },
      'Weak Fit': {
        color: 'text-red-600',
        bg: 'bg-red-100',
        border: 'border-red-200',
        icon: XCircle
      }
    };
    return configs[recommendation] || configs['Weak Fit'];
  };

  const getSemanticMatchColor = (score) => {
    if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 65) return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (score >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-[#6B7280]', bg: 'bg-[#F0F2F5]', border: 'border-[#E8EAF0]' };
  };

  const getMatchTypeLabel = (type) => {
    const labels = {
      'exact': 'Exact Match',
      'family': 'Same Family',
      'semantic': 'Semantic Similarity'
    };
    return labels[type] || 'Similar';
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8EAF0]"
        >
          <div className="flex items-center justify-between p-6 border-b border-[#E8EAF0]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3DD68C]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#3DD68C]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1A1A2E]">Hybrid AI Resume Matcher</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-[#6B7280]">ATS + Semantic Analysis</span>
                  {result?.embeddingConfidence?.level === 'high' && (
                    <span className="px-2 py-0.5 rounded-full bg-[#6C63FF]/15 text-[#6C63FF] text-xs flex items-center gap-1">
                      <Brain className="w-3 h-3" />
                      AI Powered
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#F0F2F5] hover:bg-[#E8EAF0] flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>

          <div className="p-6">
            {!result ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#1A1A2E] mb-3">
                    Upload Your Resume
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      file ? 'border-[#3DD68C]/50 bg-[#3DD68C]/5' : 'border-[#E8EAF0] hover:border-[#3DD68C]/50 bg-[#F5F6FA]'
                    }`}
                  >
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="cursor-pointer block"
                    >
                      {file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-[#3DD68C]" />
                          <span className="text-[#1A1A2E] font-medium">{file.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                          <p className="text-[#1A1A2E] font-medium mb-1">Click to upload or drag and drop</p>
                          <p className="text-sm text-[#6B7280]">PDF, DOCX, or TXT (max 10MB)</p>
                        </>
                      )}
                    </label>
                  </div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <p className="text-sm text-red-600">{error}</p>
                    </motion.div>
                  )}
                </div>

                <div className="mb-6 p-4 rounded-xl bg-[#F5F6FA] border border-[#E8EAF0]">
                  <h3 className="text-sm font-medium text-[#1A1A2E] mb-2">{internship.title}</h3>
                  <p className="text-xs text-[#6B7280] mb-3">{internship.company}</p>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills?.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-[#3DD68C]/15 text-[#3DD68C] text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {internship.skills?.length > 5 && (
                      <span className="px-2 py-1 rounded-md bg-[#F0F2F5] text-[#9CA3AF] text-xs">
                        +{internship.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleCheckMatch}
                  disabled={loading || !file}
                  className="w-full py-3 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Check Match
                    </>
                  )}
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Hybrid Score Visualization */}
                <div className="flex flex-col items-center p-8 rounded-xl bg-[#F5F6FA]">
                  <div className="relative mb-4">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke="#E8EAF0"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="88"
                        stroke={result.overallScore >= 80 ? '#10b981' : result.overallScore >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 88}`}
                        strokeDashoffset={`${2 * Math.PI * 88 * (1 - result.overallScore / 100)}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-[#1A1A2E]">{result.overallScore}%</span>
                      <span className="text-sm text-[#6B7280] mt-1">Hybrid Score</span>
                    </div>
                  </div>
                  
                  {/* ATS Tier Badge */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getATSTierConfig(result.atsRecommendation).bg} ${getATSTierConfig(result.atsRecommendation).border} border mb-3`}>
                    {(() => {
                      const Icon = getATSTierConfig(result.atsRecommendation).icon;
                      return <Icon className={`w-5 h-5 ${getATSTierConfig(result.atsRecommendation).color}`} />;
                    })()}
                    <span className={`text-lg font-semibold ${getATSTierConfig(result.atsRecommendation).color}`}>
                      {result.atsRecommendation}
                    </span>
                  </div>

                  {/* Hybrid Breakdown */}
                  {result.scoringBreakdown?.hybridComponents && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-[#6B7280]">ATS: {result.scoringBreakdown.hybridComponents.ats.percentage}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#6C63FF]"></div>
                        <span className="text-[#6B7280]">Semantic: {result.scoringBreakdown.hybridComponents.semantic.percentage}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Semantic Match Score Card */}
                {result.semanticSimilarityScore !== undefined && result.semanticSimilarityScore > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#6C63FF]/10 to-blue-500/10 border border-[#6C63FF]/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-[#6C63FF]" />
                        <h4 className="font-medium text-[#1A1A2E]">Semantic Match Score</h4>
                      </div>
                      <span className={`text-2xl font-bold ${getSemanticMatchColor(result.semanticSimilarityScore).text}`}>
                        {result.semanticSimilarityScore}%
                      </span>
                    </div>
                    <div className="w-full bg-[#E8EAF0] rounded-full h-2 mb-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#6C63FF] to-blue-500 transition-all duration-1000"
                        style={{ width: `${result.semanticSimilarityScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      AI-powered semantic similarity between resume and job description
                    </p>
                  </div>
                )}

                {/* Detailed Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard
                    label="Technical Skills"
                    score={result.skillScore}
                    icon={Briefcase}
                    color="text-accent"
                    bg="bg-accent/20"
                    weight="40%"
                  />
                  <ScoreCard
                    label="Experience"
                    score={result.experienceScore}
                    icon={TrendingUp}
                    color="text-emerald-400"
                    bg="bg-emerald-400/20"
                    weight="30%"
                  />
                  <ScoreCard
                    label="Resume Quality"
                    score={result.qualityScore}
                    icon={Award}
                    color="text-violet-400"
                    bg="bg-violet-400/20"
                    weight="15%"
                  />
                  <ScoreCard
                    label="Education"
                    score={result.educationScore}
                    icon={GraduationCap}
                    color="text-amber-400"
                    bg="bg-amber-400/20"
                    weight="15%"
                  />
                </div>

                {/* AI Similarity Insights */}
                {result.semanticMatches?.length > 0 && (
                  <ExpandableSection
                    title="AI Similarity Insights"
                    icon={Brain}
                    color="text-[#6C63FF]"
                    expanded={expandedSection === 'semantic-matches'}
                    onToggle={() => toggleSection('semantic-matches')}
                  >
                    <div className="space-y-3">
                      {result.semanticMatches.slice(0, 8).map((match, idx) => {
                        const colors = getSemanticMatchColor(match.score);
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#1A1A2E]">{match.resumeSkill}</span>
                                <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
                                <span className="text-sm font-medium text-[#1A1A2E]">{match.jobSkill}</span>
                              </div>
                              <span className={`text-sm font-bold ${colors.text}`}>{match.score}%</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                                {getMatchTypeLabel(match.type)}
                              </span>
                              {match.family && (
                                <span className="text-[#6B7280] flex items-center gap-1">
                                  <GitBranch className="w-3 h-3" />
                                  {match.family}
                                </span>
                              )}
                            </div>
                            {match.reason && (
                              <p className="text-xs text-[#6B7280] mt-2">{match.reason}</p>
                            )}
                          </div>
                        );
                      })}
                      {result.semanticMatches.length > 8 && (
                        <p className="text-xs text-[#9CA3AF] text-center">
                          +{result.semanticMatches.length - 8} more matches
                        </p>
                      )}
                    </div>
                  </ExpandableSection>
                )}

                {/* Transferable Skill Suggestions */}
                {result.inferredTransferableSkills?.length > 0 && (
                  <ExpandableSection
                    title="Transferable Skill Suggestions"
                    icon={Zap}
                    color="text-amber-500"
                    expanded={expandedSection === 'transferable-suggestions'}
                    onToggle={() => toggleSection('transferable-suggestions')}
                  >
                    <div className="space-y-3">
                      {result.inferredTransferableSkills.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-amber-50 border border-amber-200"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[#1A1A2E] bg-[#F0F2F5] px-2 py-1 rounded">{suggestion.from}</span>
                              <ArrowRight className="w-4 h-4 text-amber-500" />
                              <span className="text-sm font-medium text-[#1A1A2E] bg-amber-100 px-2 py-1 rounded">{suggestion.to}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              suggestion.confidence === 'high'
                                ? 'bg-green-100 text-green-600'
                                : suggestion.confidence === 'medium'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-[#F0F2F5] text-[#9CA3AF]'
                            }`}>
                              {suggestion.confidence} confidence
                            </span>
                          </div>
                          <p className="text-xs text-[#6B7280]">{suggestion.reason}</p>
                        </div>
                      ))}
                    </div>
                  </ExpandableSection>
                )}

                {/* Matching Skills */}
                {result.matchingSkills?.length > 0 && (
                  <ExpandableSection
                    title="Matching Skills"
                    icon={CheckCircle}
                    color="text-green-600"
                    expanded={expandedSection === 'matching'}
                    onToggle={() => toggleSection('matching')}
                  >
                    <div className="flex flex-wrap gap-2">
                      {result.matchingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-green-100 text-green-600 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </ExpandableSection>
                )}

                {/* Missing Skills */}
                {result.missingSkills?.length > 0 && (
                  <ExpandableSection
                    title="Missing Skills"
                    icon={XCircle}
                    color="text-red-600"
                    expanded={expandedSection === 'missing'}
                    onToggle={() => toggleSection('missing')}
                  >
                    <div className="flex flex-wrap gap-2">
                      {result.missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </ExpandableSection>
                )}

                {/* Strengths */}
                {result.strengths?.length > 0 && (
                  <ExpandableSection
                    title="Strengths"
                    icon={TrendingUp}
                    color="text-green-600"
                    expanded={expandedSection === 'strengths'}
                    onToggle={() => toggleSection('strengths')}
                  >
                    <ul className="space-y-2">
                      {result.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-[#6B7280] flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </ExpandableSection>
                )}

                {/* Weaknesses */}
                {result.weaknesses?.length > 0 && (
                  <ExpandableSection
                    title="Weaknesses"
                    icon={AlertTriangle}
                    color="text-amber-500"
                    expanded={expandedSection === 'weaknesses'}
                    onToggle={() => toggleSection('weaknesses')}
                  >
                    <ul className="space-y-2">
                      {result.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="text-sm text-[#6B7280] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </ExpandableSection>
                )}

                {/* Improvements */}
                {result.improvements?.length > 0 && (
                  <ExpandableSection
                    title="Improvement Suggestions"
                    icon={BookOpen}
                    color="text-[#3DD68C]"
                    expanded={expandedSection === 'improvements'}
                    onToggle={() => toggleSection('improvements')}
                  >
                    <ul className="space-y-2">
                      {result.improvements.map((improvement, idx) => (
                        <li key={idx} className="text-sm text-[#6B7280] flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-[#3DD68C] mt-0.5 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </ExpandableSection>
                )}

                {/* Feedback */}
                {result.feedback && (
                  <div className="p-4 rounded-xl bg-[#F5F6FA] border border-[#E8EAF0]">
                    <h4 className="font-medium text-[#1A1A2E] mb-2">Detailed Analysis</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">{result.feedback}</p>
                  </div>
                )}

                {/* Enhanced Scoring Breakdown */}
                {result.scoringBreakdown && (
                  <div className="p-4 rounded-xl bg-[#F5F6FA] border border-[#E8EAF0]">
                    <h4 className="font-medium text-[#1A1A2E] mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#3DD68C]" />
                      Hybrid Scoring Breakdown
                    </h4>
                    
                    {/* Method description */}
                    {result.scoringBreakdown.description && (
                      <p className="text-xs text-[#6B7280] mb-3">{result.scoringBreakdown.description}</p>
                    )}
                    
                    {/* Category contributions */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Technical Skills (40%)</span>
                        <span className="text-[#1A1A2E]">{result.scoringBreakdown.contributions.skills?.toFixed(1) || '0.0'} pts</span>
                      </div>
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Experience (30%)</span>
                        <span className="text-[#1A1A2E]">{result.scoringBreakdown.contributions.experience?.toFixed(1) || '0.0'} pts</span>
                      </div>
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Resume Quality (15%)</span>
                        <span className="text-[#1A1A2E]">{result.scoringBreakdown.contributions.quality?.toFixed(1) || '0.0'} pts</span>
                      </div>
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Education (15%)</span>
                        <span className="text-[#1A1A2E]">{result.scoringBreakdown.contributions.education?.toFixed(1) || '0.0'} pts</span>
                      </div>
                    </div>

                    {/* Hybrid components visualization */}
                    {result.scoringBreakdown.hybridComponents && (
                      <div className="pt-3 border-t border-[#E8EAF0]">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#6B7280]">ATS Contribution</span>
                          <span className="text-blue-500">{result.scoringBreakdown.hybridComponents.ats.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#E8EAF0] rounded-full h-2 mb-3">
                          <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${result.scoringBreakdown.hybridComponents.ats.percentage}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-[#6B7280]">Semantic Contribution</span>
                          <span className="text-[#6C63FF]">{result.scoringBreakdown.hybridComponents.semantic.percentage}%</span>
                        </div>
                        <div className="w-full bg-[#E8EAF0] rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#6C63FF] transition-all" style={{ width: `${result.scoringBreakdown.hybridComponents.semantic.percentage}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setResult(null);
                      setFile(null);
                      setExpandedSection(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#F0F2F5] hover:bg-[#E8EAF0] text-[#1A1A2E] font-medium transition-colors"
                  >
                    Check Another Resume
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-[#3DD68C] hover:bg-[#2BC47A] text-white font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ScoreCard({ label, score, icon: Icon, color, bg, weight }) {
  return (
    <div className={`p-4 rounded-xl ${bg} border border-[#E8EAF0]`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-[#6B7280]">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{score}%</div>
      <div className="text-xs text-[#9CA3AF] mt-1">Weight: {weight}</div>
    </div>
  );
}

function ExpandableSection({ title, icon: Icon, color, expanded, onToggle, children }) {
  return (
    <div className="p-4 rounded-xl bg-[#F5F6FA]">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <h4 className="font-medium text-[#1A1A2E]">{title}</h4>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-[#9CA3AF]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />
        )}
      </button>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
