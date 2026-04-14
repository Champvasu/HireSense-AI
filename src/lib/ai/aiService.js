import NodeCache from 'node-cache';
import { logInfo, logError, logWarn, logAICall, logApiResponse } from '../logging/logger.js';
import { verifyCompany, getVerificationSummary } from '@/lib/verification/externalVerification';
import {
  generateEmbedding,
  generateResumeEmbeddings,
  generateJobEmbeddings,
  cosineSimilarity,
  similarityScore,
  getEmbeddingMetrics,
  clearEmbeddingCache,
} from './embeddingService';
import {
  findTransferableSkills,
  analyzeSkillGaps,
  findRelatedSkills,
  computeSkillSimilarity,
  getSkillIntelligenceMetrics,
  clearSkillIntelligenceCache,
  prewarmSkillEmbeddings,
  TECHNOLOGY_FAMILIES,
  SKILL_SYNONYMS,
} from './skillIntelligence';

// Feature flags for embedding integration
const USE_EMBEDDINGS = process.env.USE_EMBEDDINGS !== 'false'; // Default to true

// Hybrid scoring weights - configurable via environment
// Default: 65% rule-based ATS (LLM), 35% semantic similarity (embeddings)
const rawEmbeddingWeight = parseFloat(process.env.EMBEDDING_WEIGHT);
const EMBEDDING_WEIGHT = !isNaN(rawEmbeddingWeight) && rawEmbeddingWeight >= 0 && rawEmbeddingWeight <= 1
  ? rawEmbeddingWeight
  : 0.35;

const LLM_WEIGHT = 1 - EMBEDDING_WEIGHT;

// Category-specific weights within each scoring method
const ATS_CATEGORY_WEIGHTS = {
  skills: 0.40,      // 40% of ATS score from skills
  experience: 0.30,  // 30% from experience
  quality: 0.15,     // 15% from resume quality
  education: 0.15,    // 15% from education
};

const SEMANTIC_CATEGORY_WEIGHTS = {
  skills: 0.40,      // 40% of semantic score from skills
  experience: 0.30,  // 30% from experience
  overall: 0.20,     // 20% from overall similarity
  education: 0.10,   // 10% from education
};

logInfo(`AI Service: Hybrid scoring configured - ${(LLM_WEIGHT * 100).toFixed(0)}% ATS / ${(EMBEDDING_WEIGHT * 100).toFixed(0)}% Semantic`);

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3-8b-instruct';
const TIMEOUT = 30000;
const MAX_RETRIES = 2;

// Validate API key on startup
if (!API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY is not set in environment variables');
  console.error('Please add OPENROUTER_API_KEY to your .env.local file');
}

const cache = new NodeCache({ stdTTL: 3600 });

let metrics = { calls: 0, tokens: 0, errors: 0 };

function validateResponse(result) {
  if (typeof result.score !== 'number' || result.score < 0 || result.score > 100) {
    throw new Error('Invalid score: must be 0-100');
  }
  if (!['verified', 'suspicious', 'scam'].includes(result.status)) {
    throw new Error('Invalid status');
  }
  if (!Array.isArray(result.reasons)) {
    throw new Error('Invalid reasons: must be array');
  }
  return result;
}

function extractJson(content) {
  if (typeof content !== 'string') return null;
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function callAPI(messages, temp = 0.7, retry = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    metrics.calls++;
    logAICall('callAPI', { model: MODEL, hasApiKey: !!API_KEY });
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'HireSense AI',
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: temp, max_tokens: 1000 }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      metrics.errors++;
      const text = await res.text();
      logError('AI API error', { status: res.status, response: text });
      if ((res.status >= 500 || res.status === 429) && retry < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, Math.pow(2, retry) * 1000));
        return callAPI(messages, temp, retry + 1);
      }
      throw new Error(`API error (${res.status}): ${text}`);
    }

    const data = await res.json();
    logApiResponse('/api/ai/match', { choices: data.choices?.length, tokens: data.usage?.total_tokens });
    metrics.tokens += data.usage?.total_tokens || 0;
    return data.choices[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeout);
    metrics.errors++;
    logError('AI API call failed', { error: err.message, retry });
    if (err.name === 'AbortError') throw new Error('API timeout');
    if (retry < MAX_RETRIES && err.name === 'TypeError') {
      await new Promise(r => setTimeout(r, Math.pow(2, retry) * 1000));
      return callAPI(messages, temp, retry + 1);
    }
    throw err;
  }
}

const VERIFY_PROMPT = `You are a fraud detection system for internships. Analyze postings and detect scams using multiple trust signals.

Rules:
- Respond in JSON only
- Score 0-100 (100 = legitimate, 0 = scam)
- Status: "verified" (70-100), "suspicious" (40-69), "scam" (0-39)
- Provide 3-5 reasons

IMPORTANT SCORING GUIDELINES:
- Be lenient with startups and new companies (founded < 3 years ago)
- Missing optional fields (LinkedIn, testimonials) should NOT heavily penalize
- Free email domains (Gmail, Outlook) are acceptable for startups - only penalize if combined with other red flags
- Focus on actual scam indicators: payment requests, personal info requests, unrealistic pay, urgency tactics
- A legitimate-looking posting with some missing fields should score 60-75, not below 40

Red flags (MAJOR): payment requests before interview, personal info requests (SSN, bank details), unrealistic pay (too high or too low), vague job description, poor grammar, urgency tactics ("apply now", "limited spots"), no company information at all, requests for money/fees.

Red flags (MINOR): free email domain, missing LinkedIn, no testimonials, recently founded company, missing optional fields - these should only slightly reduce score, not cause rejection.

Positive indicators: professional website, specific detailed description, clear contact info, realistic pay range, valid company registration (if provided), LinkedIn presence (if provided), detailed hiring process, consistent information.

Trust Signal Analysis:
- Website legitimacy: Professional website is good, but absence is not automatically suspicious
- Email domain: Free email is OK for startups, corporate domain is better
- Company maturity: New companies are legitimate - don't penalize for being young
- Registration ID: If provided and valid, it's a strong positive signal
- LinkedIn presence: Nice to have but not required
- Hiring process: Detailed process is positive
- Location consistency: Check if headquarters matches location

JSON format: {"score": number, "status": "verified"|"suspicious"|"scam", "reasons": ["reason1", "reason2"]}`;

const MATCH_PROMPT = `You are an advanced ATS (Applicant Tracking System) with semantic understanding capabilities. Analyze how well a candidate's resume matches an internship posting.

Rules:
- Respond in JSON only
- Calculate weighted scores (0-100 for each category)
- Provide detailed, actionable feedback
- Use semantic understanding to identify transferable skills
- Evaluate resume quality and clarity

Scoring Weights:
- Technical Skill Match: 40% (semantic skill alignment, not just keyword overlap)
- Project/Experience Relevance: 30% (relevant work/projects, complexity, impact)
- Resume Quality/Clarity: 15% (structure, clarity, professionalism)
- Educational/Certification Alignment: 15% (degree relevance, certifications)

Analysis Sections:
1. Skills: Semantic comparison of resume skills vs required skills (identify transferable technologies)
2. Experience: Evaluate work experience relevance, project complexity, and impact
3. Projects: Analyze project relevance, technical depth, and achievements
4. Education: Check if education meets requirements
5. Certifications: Identify relevant certifications
6. Resume Quality: Evaluate structure, clarity, and presentation

Semantic Analysis Guidelines:
- Identify transferable skills (e.g., "TypeScript" matches "JavaScript", "AWS Lambda" matches "serverless")
- Recognize technology families (e.g., React ecosystem includes Redux, Next.js, etc.)
- Consider project experience equivalent to work experience for internships
- Give credit for relevant coursework and personal projects
- Evaluate resume structure, formatting, and clarity

Output Format (JSON):
{
  "overallScore": number (0-100),
  "skillScore": number (0-100),
  "experienceScore": number (0-100),
  "qualityScore": number (0-100),
  "educationScore": number (0-100),
  "matchingSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"],
  "transferableSkills": ["skillA (from resume) → skillB (required)"],
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "improvements": ["suggestion1", "suggestion2"],
  "feedback": string (detailed analysis),
  "atsRecommendation": "Strong Fit" | "Moderate Fit" | "Weak Fit"
}

ATS Recommendation Criteria:
- Strong Fit: 80-100 (excellent alignment, most skills present, strong experience)
- Moderate Fit: 60-79 (good alignment, some gaps, potential with improvements)
- Weak Fit: 0-59 (significant gaps, major skills missing, poor alignment)

Guidelines:
- Be generous with partial matches and transferable skills
- Consider technology ecosystems and related technologies
- Evaluate resume presentation and structure
- Suggest specific, actionable improvements
- Highlight unique strengths that set candidate apart
- Provide constructive feedback for improvement`;

export async function verifyInternship(data) {
  const key = `verify:${JSON.stringify(data)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    // Run external verification checks
    const externalVerification = await verifyCompany(data);
    const verificationSummary = getVerificationSummary(externalVerification);
    
    const messages = [
      { role: 'system', content: VERIFY_PROMPT },
      {
        role: 'user',
        content: `Analyze this internship and return JSON:

Title: ${data.title}
Company: ${data.company}
Location: ${data.location}
Type: ${data.type}
Description: ${data.description}
Requirements: ${data.requirements?.join(', ') || 'None'}
Duration: ${data.duration}
Stipend: ${data.stipend || 'Unpaid'}
Company Email: ${data.companyEmail}
Company Website: ${data.companyWebsite || 'Not provided'}
Company LinkedIn: ${data.companyLinkedIn || 'Not provided'}
Company Registration ID: ${data.companyRegistrationId || 'Not provided'}
Founded Year: ${data.foundedYear || 'Not provided'}
Company Size: ${data.companySize || 'Not provided'}
Headquarters: ${data.headquarters || 'Not provided'}
Recruiter Title: ${data.recruiterTitle || 'Not provided'}
Recruiter LinkedIn: ${data.recruiterLinkedIn || 'Not provided'}
Hiring Process: ${data.hiringProcess || 'Not provided'}
Interview Rounds: ${data.interviewRounds || 'Not provided'}
Reporting Manager: ${data.reportingManager || 'Not provided'}
Conversion Opportunity: ${data.conversionOpportunity ? 'Yes' : 'No'}
Number of Openings: ${data.numberOfOpenings || 'Not provided'}
Testimonials: ${data.testimonials?.join(', ') || 'None'}

External Verification Results:
${verificationSummary.length > 0 ? verificationSummary.join('\n') : 'No external verification data available'}`,
      },
    ];

    const content = await callAPI(messages, 0.3);
    const parsed = extractJson(content);
    if (!parsed) throw new Error('Failed to parse AI response');

    const validated = validateResponse(parsed);
    
    // Combine AI score with external verification score
    // Recalibrated: 70% AI (primary fraud detection), 30% external (supplementary signals)
    const aiScore = validated.score;
    const verificationScore = externalVerification.overall.score;
    const combinedScore = Math.round((aiScore * 0.7) + (verificationScore * 0.3));
    
    // Determine final status based on combined score (recalibrated thresholds)
    // 70-100: Verified, 40-69: Suspicious/Needs Review, 0-39: Scam
    let finalStatus = validated.status;
    if (combinedScore >= 70) finalStatus = 'verified';
    else if (combinedScore >= 40) finalStatus = 'suspicious';
    else finalStatus = 'scam';

    const result = { 
      score: combinedScore, 
      status: finalStatus, 
      reasons: validated.reasons, 
      checkedAt: new Date(),
      externalVerification: {
        ...externalVerification,
        summary: verificationSummary
      },
      // Detailed scoring breakdown for debugging
      scoringBreakdown: {
        aiScore,
        verificationScore,
        combinedScore,
        weighting: {
          ai: 0.7,
          external: 0.3
        },
        thresholds: {
          verified: 70,
          suspicious: 40,
          scam: 0
        }
      }
    };
    cache.set(key, result);
    return result;
  } catch (err) {
    console.error('Verification error:', err);
    return { score: null, status: 'unavailable', reasons: [`AI unavailable: ${err.message}`], checkedAt: new Date(), error: true };
  }
}

/**
 * Compute embedding-based semantic similarity scores
 */
async function computeEmbeddingScores(resumeEmbeddings, jobEmbeddings) {
  const scores = {
    overallSimilarity: 0,
    skillsSimilarity: 0,
    descriptionSimilarity: 0,
    experienceSimilarity: 0,
    educationSimilarity: 0,
  };

  try {
    // Overall semantic similarity (full resume vs full job description)
    if (resumeEmbeddings.full && jobEmbeddings.full) {
      const sim = cosineSimilarity(resumeEmbeddings.full, jobEmbeddings.full);
      scores.overallSimilarity = similarityScore(sim);
    }

    // Skills semantic similarity
    if (resumeEmbeddings.skills && jobEmbeddings.skills) {
      const sim = cosineSimilarity(resumeEmbeddings.skills, jobEmbeddings.skills);
      scores.skillsSimilarity = similarityScore(sim);
    }

    // Experience vs Job Description similarity
    if (resumeEmbeddings.experience && jobEmbeddings.full) {
      const sim = cosineSimilarity(resumeEmbeddings.experience, jobEmbeddings.full);
      scores.experienceSimilarity = similarityScore(sim);
    }

    // Education alignment
    if (resumeEmbeddings.education && jobEmbeddings.full) {
      const sim = cosineSimilarity(resumeEmbeddings.education, jobEmbeddings.full);
      scores.educationSimilarity = similarityScore(sim);
    }

    // Description-specific match (resume full vs job description only)
    if (resumeEmbeddings.full && jobEmbeddings.description) {
      const sim = cosineSimilarity(resumeEmbeddings.full, jobEmbeddings.description);
      scores.descriptionSimilarity = similarityScore(sim);
    }

    return scores;
  } catch (error) {
    console.error('Error computing embedding scores:', error);
    return scores;
  }
}

/**
 * Blend LLM (ATS) and Embedding (Semantic) scores into hybrid score
 * 
 * Formula:
 *   finalScore = (atsScore * LLM_WEIGHT) + (semanticScore * EMBEDDING_WEIGHT)
 * 
 * Where each component score is weighted by category:
 *   skills: 40%, experience: 30%, quality: 15%, education: 15%
 */
function computeHybridScore(llmScores, embeddingScores) {
  // Extract component scores
  const llmWeight = LLM_WEIGHT;
  const embWeight = EMBEDDING_WEIGHT;

  // Calculate blended skill score
  // ATS skills (rule/LLM-based) blended with semantic skills similarity
  const blendedSkillScore = Math.round(
    (llmScores.skillScore * llmWeight) + 
    (embeddingScores.skillsSimilarity * embWeight)
  );

  // Calculate blended experience score
  // ATS experience blended with semantic experience matching
  const blendedExperienceScore = Math.round(
    (llmScores.experienceScore * llmWeight) + 
    (embeddingScores.experienceSimilarity * embWeight)
  );

  // Calculate blended education score
  // ATS education blended with semantic education alignment
  const blendedEducationScore = Math.round(
    (llmScores.educationScore * llmWeight) + 
    (embeddingScores.educationSimilarity * embWeight)
  );

  // Quality score remains ATS-only (subjective assessment not suitable for embeddings)
  const blendedQualityScore = llmScores.qualityScore;

  // Compute final hybrid overall score using category weights
  const hybridOverallScore = Math.round(
    (blendedSkillScore * ATS_CATEGORY_WEIGHTS.skills) +
    (blendedExperienceScore * ATS_CATEGORY_WEIGHTS.experience) +
    (blendedQualityScore * ATS_CATEGORY_WEIGHTS.quality) +
    (blendedEducationScore * ATS_CATEGORY_WEIGHTS.education)
  );

  // Calculate component contributions for transparency
  const atsComponent = Math.round(
    (llmScores.skillScore * ATS_CATEGORY_WEIGHTS.skills * llmWeight) +
    (llmScores.experienceScore * ATS_CATEGORY_WEIGHTS.experience * llmWeight) +
    (llmScores.qualityScore * ATS_CATEGORY_WEIGHTS.quality) + // Quality is 100% ATS
    (llmScores.educationScore * ATS_CATEGORY_WEIGHTS.education * llmWeight)
  );

  const semanticComponent = Math.round(
    (embeddingScores.skillsSimilarity * ATS_CATEGORY_WEIGHTS.skills * embWeight) +
    (embeddingScores.experienceSimilarity * ATS_CATEGORY_WEIGHTS.experience * embWeight) +
    (embeddingScores.educationSimilarity * ATS_CATEGORY_WEIGHTS.education * embWeight)
  );

  return {
    overallScore: hybridOverallScore,
    skillScore: blendedSkillScore,
    experienceScore: blendedExperienceScore,
    qualityScore: blendedQualityScore,
    educationScore: blendedEducationScore,
    
    // Component breakdown for transparency
    components: {
      atsContribution: atsComponent,
      semanticContribution: semanticComponent,
      atsPercentage: Math.round((atsComponent / hybridOverallScore) * 100) || 0,
      semanticPercentage: Math.round((semanticComponent / hybridOverallScore) * 100) || 0,
    },
    
    // Raw scores for debugging
    rawScores: {
      ats: {
        overall: llmScores.overallScore,
        skills: llmScores.skillScore,
        experience: llmScores.experienceScore,
        quality: llmScores.qualityScore,
        education: llmScores.educationScore,
      },
      semantic: {
        overall: embeddingScores.overallSimilarity,
        skills: embeddingScores.skillsSimilarity,
        experience: embeddingScores.experienceSimilarity,
        education: embeddingScores.educationSimilarity,
        description: embeddingScores.descriptionSimilarity,
      }
    },
    
    // Weight configuration used
    weights: {
      llm: llmWeight,
      embedding: embWeight,
      categories: ATS_CATEGORY_WEIGHTS,
    }
  };
}

/**
 * Compute pure semantic similarity between resume and job (no LLM)
 * Returns 0-100 semantic similarity score with detailed breakdown
 */
export async function computeSemanticSimilarity(resume, jobDesc, skills = []) {
  const key = `semantic:${resume.substring(0, 100)}:${jobDesc.substring(0, 100)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    // Generate embeddings for resume and job
    const [resumeEmbeddings, jobEmbeddings] = await Promise.all([
      generateResumeEmbeddings(resume).catch(err => {
        console.error('Resume embedding failed:', err);
        return null;
      }),
      generateJobEmbeddings(jobDesc, skills).catch(err => {
        console.error('Job embedding failed:', err);
        return null;
      }),
    ]);

    if (!resumeEmbeddings || !jobEmbeddings) {
      throw new Error('Failed to generate embeddings');
    }

    // Compute all similarity scores
    const similarities = await computeEmbeddingScores(resumeEmbeddings, jobEmbeddings);

    // Calculate weighted semantic similarity score (0-100)
    // Weights optimized for semantic relevance
    const SEMANTIC_WEIGHTS = {
      skills: 0.40,        // Skills match is most important
      experience: 0.30,    // Experience relevance
      overall: 0.20,       // General semantic overlap
      education: 0.10,    // Education alignment
    };

    const semanticSimilarityScore = Math.round(
      (similarities.skillsSimilarity * SEMANTIC_WEIGHTS.skills) +
      (similarities.experienceSimilarity * SEMANTIC_WEIGHTS.experience) +
      (similarities.overallSimilarity * SEMANTIC_WEIGHTS.overall) +
      (similarities.educationSimilarity * SEMANTIC_WEIGHTS.education)
    );

    // Determine match tier based on semantic score
    const matchTier = semanticSimilarityScore >= 80 ? 'Excellent' :
                      semanticSimilarityScore >= 65 ? 'Good' :
                      semanticSimilarityScore >= 50 ? 'Fair' : 'Poor';

    // Generate insights based on similarities
    const insights = [];
    if (similarities.skillsSimilarity >= 75) {
      insights.push('Strong skills alignment detected');
    } else if (similarities.skillsSimilarity >= 50) {
      insights.push('Moderate skills overlap');
    } else {
      insights.push('Skills gap detected - consider upskilling');
    }

    if (similarities.experienceSimilarity >= 70) {
      insights.push('Experience strongly matches role requirements');
    } else if (similarities.experienceSimilarity < 40) {
      insights.push('Limited relevant experience for this role');
    }

    if (similarities.educationSimilarity >= 70) {
      insights.push('Education background aligns well');
    }

    const result = {
      semanticSimilarityScore,
      matchTier,
      insights,
      similarities: {
        resumeToJob: similarities.overallSimilarity,
        skillsMatch: similarities.skillsSimilarity,
        experienceMatch: similarities.experienceSimilarity,
        educationMatch: similarities.educationSimilarity,
        descriptionMatch: similarities.descriptionSimilarity,
      },
      details: {
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        dimensions: 384,
        method: 'cosine_similarity',
        weights: SEMANTIC_WEIGHTS,
      },
      checkedAt: new Date(),
    };

    cache.set(key, result);
    return result;

  } catch (err) {
    console.error('Semantic similarity error:', err);
    return {
      semanticSimilarityScore: 0,
      matchTier: 'Error',
      insights: ['Failed to compute semantic similarity'],
      similarities: {},
      error: err.message,
      checkedAt: new Date(),
    };
  }
}

/**
 * Quick semantic similarity check (resume text vs single text snippet)
 * Useful for matching against individual requirements
 */
export async function quickSemanticMatch(text1, text2) {
  try {
    const [emb1, emb2] = await Promise.all([
      generateEmbedding(text1, 'quick_match'),
      generateEmbedding(text2, 'quick_match'),
    ]);

    const similarity = cosineSimilarity(emb1, emb2);
    const score = similarityScore(similarity);

    return {
      similarity,
      score,
      match: score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Low',
    };
  } catch (err) {
    console.error('Quick match error:', err);
    return { similarity: 0, score: 0, match: 'Error', error: err.message };
  }
}

export async function matchResume(resume, jobDesc, skills = []) {
  const key = `match:${resume.substring(0, 100)}:${jobDesc.substring(0, 100)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    // Run LLM analysis and embedding generation in parallel
    const [llmResult, resumeEmbeddings, jobEmbeddings] = await Promise.all([
      // LLM-based analysis
      (async () => {
        const messages = [
          { role: 'system', content: MATCH_PROMPT },
          {
            role: 'user',
            content: `Match this resume to the job and return JSON:

Job Description:
${jobDesc}

Required Skills: ${skills.join(', ') || 'Not specified'}

Resume:
${resume}`,
          },
        ];

        const content = await callAPI(messages, 0.5);
        const parsed = extractJson(content);
        if (!parsed) throw new Error('Failed to parse AI response');

        return {
          skillScore: Math.min(100, Math.max(0, parsed.skillScore || 0)),
          experienceScore: Math.min(100, Math.max(0, parsed.experienceScore || 0)),
          qualityScore: Math.min(100, Math.max(0, parsed.qualityScore || 0)),
          educationScore: Math.min(100, Math.max(0, parsed.educationScore || 0)),
          matchingSkills: Array.isArray(parsed.matchingSkills) ? parsed.matchingSkills : [],
          missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : skills,
          transferableSkills: Array.isArray(parsed.transferableSkills) ? parsed.transferableSkills : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
          feedback: parsed.feedback || 'No feedback provided',
        };
      })(),

      // Embedding generation (wrapped to not block on failure)
      USE_EMBEDDINGS
        ? generateResumeEmbeddings(resume).catch(err => {
            console.error('Resume embedding failed:', err);
            return null;
          })
        : Promise.resolve(null),

      USE_EMBEDDINGS
        ? generateJobEmbeddings(jobDesc, skills).catch(err => {
            console.error('Job embedding failed:', err);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // Calculate LLM overall score
    const llmOverallScore = Math.round(
      (llmResult.skillScore * 0.4) +
      (llmResult.experienceScore * 0.3) +
      (llmResult.qualityScore * 0.15) +
      (llmResult.educationScore * 0.15)
    );

    let finalScores;
    let embeddingData = null;

    // If embeddings available, compute hybrid score
    if (USE_EMBEDDINGS && resumeEmbeddings && jobEmbeddings) {
      const embeddingScores = await computeEmbeddingScores(resumeEmbeddings, jobEmbeddings);

      finalScores = computeHybridScore(
        {
          skillScore: llmResult.skillScore,
          experienceScore: llmResult.experienceScore,
          qualityScore: llmResult.qualityScore,
          educationScore: llmResult.educationScore,
          overallScore: llmOverallScore,
        },
        embeddingScores
      );

      embeddingData = {
        enabled: true,
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        similarityScores: embeddingScores,
        weight: EMBEDDING_WEIGHT,
        llmWeight: 1 - EMBEDDING_WEIGHT,
      };
    } else {
      // Fallback to LLM-only scoring
      finalScores = {
        overallScore: llmOverallScore,
        skillScore: llmResult.skillScore,
        experienceScore: llmResult.experienceScore,
        qualityScore: llmResult.qualityScore,
        educationScore: llmResult.educationScore,
        rawEmbeddingScore: null,
        rawLLMScore: llmOverallScore,
      };

      embeddingData = {
        enabled: false,
        reason: USE_EMBEDDINGS ? 'Embedding generation failed' : 'Embeddings disabled',
      };
    }

    // Determine ATS recommendation based on hybrid overall score
    const atsRecommendation = finalScores.overallScore >= 80 ? 'Strong Fit' :
                              finalScores.overallScore >= 60 ? 'Moderate Fit' : 'Weak Fit';

    // Enhance skill analysis with transferable skill intelligence
    let skillIntelligenceAnalysis = null;
    if (skills.length > 0 && llmResult.matchingSkills) {
      try {
        // Extract resume skills from the matching skills data
        const resumeSkills = llmResult.matchingSkills;
        const requiredSkills = skills;

        skillIntelligenceAnalysis = await analyzeSkillGaps(resumeSkills, requiredSkills);
      } catch (skillError) {
        console.error('Skill intelligence analysis failed:', skillError);
        // Non-critical, continue without enhanced skill analysis
      }
    }

    // Build semantic matches array from skill intelligence analysis
    const semanticMatches = skillIntelligenceAnalysis
      ? [
          ...skillIntelligenceAnalysis.directMatches.map(m => ({
            resumeSkill: m.resumeSkill,
            jobSkill: m.requiredSkill,
            score: m.score,
            type: 'exact',
            reason: 'Direct match or synonym',
          })),
          ...skillIntelligenceAnalysis.transferableMatches.map(m => ({
            resumeSkill: m.resumeSkill,
            jobSkill: m.requiredSkill,
            score: m.score,
            type: m.matchType === 'same_family' ? 'family' : 'semantic',
            reason: m.reason || `${m.resumeSkill} → ${m.requiredSkill}`,
            family: m.family || null,
            confidence: m.transferConfidence,
          })),
        ]
      : [];

    // Build inferred transferable skills array (only high-confidence transfers)
    const inferredTransferableSkills = skillIntelligenceAnalysis
      ? skillIntelligenceAnalysis.suggestions
          .filter(s => s.confidence === 'high' || s.confidence === 'medium')
          .map(s => ({
            from: s.from,
            to: s.to,
            confidence: s.confidence,
            reason: s.reason,
          }))
      : [];

    // Calculate embedding confidence based on embedding availability and quality
    const embeddingConfidence = USE_EMBEDDINGS && embeddingData.enabled
      ? {
          level: embeddingData.enabled ? 'high' : 'none',
          score: Math.round(EMBEDDING_WEIGHT * 100),
          factors: {
            embeddingsGenerated: !!(resumeEmbeddings && jobEmbeddings),
            model: embeddingData.model || 'sentence-transformers/all-MiniLM-L6-v2',
            semanticCoverage: semanticMatches.length > 0
              ? Math.round((semanticMatches.length / (skills.length || 1)) * 100)
              : 0,
          },
        }
      : {
          level: 'none',
          score: 0,
          factors: {
            embeddingsGenerated: false,
            model: null,
            semanticCoverage: 0,
          },
        };

    // Calculate overall semantic similarity score (0-100)
    const semanticSimilarityScore = USE_EMBEDDINGS && finalScores.rawScores?.semantic?.overall
      ? finalScores.rawScores.semantic.overall
      : (skillIntelligenceAnalysis?.summary?.coverage || 0);

    const result = {
      // Hybrid scores
      overallScore: finalScores.overallScore,
      skillScore: finalScores.skillScore,
      experienceScore: finalScores.experienceScore,
      qualityScore: finalScores.qualityScore,
      educationScore: finalScores.educationScore,

      // Phase 5: Semantic similarity outputs
      semanticSimilarityScore,
      semanticMatches,
      inferredTransferableSkills,
      embeddingConfidence,

      // Detailed analysis from LLM
      matchingSkills: llmResult.matchingSkills,
      missingSkills: llmResult.missingSkills,
      transferableSkills: llmResult.transferableSkills,
      strengths: llmResult.strengths,
      weaknesses: llmResult.weaknesses,
      improvements: llmResult.improvements,
      feedback: llmResult.feedback,

      // ATS recommendation
      atsRecommendation,
      checkedAt: new Date(),

      // Scoring methodology breakdown
      scoringBreakdown: {
        method: USE_EMBEDDINGS && embeddingData.enabled ? 'hybrid_ats_semantic' : 'ats_only',
        description: USE_EMBEDDINGS && embeddingData.enabled
          ? `Hybrid: ${(LLM_WEIGHT * 100).toFixed(0)}% ATS + ${(EMBEDDING_WEIGHT * 100).toFixed(0)}% Semantic`
          : 'ATS-only (LLM-based)',
        weights: finalScores.weights || {
          skills: 0.4,
          experience: 0.3,
          quality: 0.15,
          education: 0.15,
        },
        contributions: {
          skills: finalScores.skillScore * ATS_CATEGORY_WEIGHTS.skills,
          experience: finalScores.experienceScore * ATS_CATEGORY_WEIGHTS.experience,
          quality: finalScores.qualityScore * ATS_CATEGORY_WEIGHTS.quality,
          education: finalScores.educationScore * ATS_CATEGORY_WEIGHTS.education,
        },
        hybridComponents: USE_EMBEDDINGS && embeddingData.enabled && finalScores.components ? {
          ats: {
            contribution: finalScores.components.atsContribution,
            percentage: finalScores.components.atsPercentage,
          },
          semantic: {
            contribution: finalScores.components.semanticContribution,
            percentage: finalScores.components.semanticPercentage,
          },
        } : null,
        rawScores: finalScores.rawScores || null,
      },

      // Embedding metadata
      embeddingAnalysis: embeddingData,

      // Skill intelligence analysis (transferable skills, gaps, suggestions)
      skillIntelligence: skillIntelligenceAnalysis,
    };

    cache.set(key, result);
    return result;
  } catch (err) {
    console.error('Matching error:', err);
    return {
      overallScore: 0,
      skillScore: 0,
      experienceScore: 0,
      qualityScore: 0,
      educationScore: 0,
      semanticSimilarityScore: 0,
      semanticMatches: [],
      inferredTransferableSkills: [],
      embeddingConfidence: {
        level: 'none',
        score: 0,
        factors: { embeddingsGenerated: false, model: null, semanticCoverage: 0 },
      },
      feedback: `AI unavailable: ${err.message}`,
      matchingSkills: [],
      missingSkills: skills,
      transferableSkills: [],
      strengths: [],
      weaknesses: [],
      improvements: [],
      atsRecommendation: 'Weak Fit',
      checkedAt: new Date(),
      error: true,
      embeddingAnalysis: { enabled: false, reason: 'System error' },
    };
  }
}

export function getAIMetrics() {
  return {
    ...metrics,
    cacheSize: cache.keys().length,
    cacheStats: cache.getStats(),
    embeddings: getEmbeddingMetrics(),
    skillIntelligence: getSkillIntelligenceMetrics(),
    hybridScoring: {
      enabled: USE_EMBEDDINGS,
      weights: {
        llm: LLM_WEIGHT,
        embedding: EMBEDDING_WEIGHT,
      },
      categoryWeights: ATS_CATEGORY_WEIGHTS,
      formula: `finalScore = (atsScore * ${LLM_WEIGHT}) + (semanticScore * ${EMBEDDING_WEIGHT})`,
    },
  };
}

export function clearAICache() {
  cache.flushAll();
}

export function clearEmbeddingAICache() {
  clearAICache();
  clearEmbeddingCache();
}

export function clearAllAICache() {
  clearAICache();
  clearEmbeddingCache();
  clearSkillIntelligenceCache();
}

// Re-export embedding functions for external use
export {
  generateEmbedding,
  generateEmbeddings,
  generateResumeEmbeddings,
  generateJobEmbeddings,
  cosineSimilarity,
  similarityScore,
  clearEmbeddingCache,
  prewarmSkillCache,
} from './embeddingService';

// quickSemanticMatch is already exported at definition

// Export skill intelligence functions
export {
  findTransferableSkills,
  analyzeSkillGaps,
  findRelatedSkills,
  computeSkillSimilarity,
  getSkillIntelligenceMetrics,
  clearSkillIntelligenceCache,
  prewarmSkillEmbeddings,
  TECHNOLOGY_FAMILIES,
  SKILL_SYNONYMS,
} from './skillIntelligence';

// Export feature flags and weight configuration for external visibility
export {
  USE_EMBEDDINGS,
  EMBEDDING_WEIGHT,
  LLM_WEIGHT,
  ATS_CATEGORY_WEIGHTS,
  SEMANTIC_CATEGORY_WEIGHTS,
};
