import NodeCache from 'node-cache';

const API_KEY = process.env.OPENROUTER_API_KEY;
const EMBEDDING_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'; // 384-dim, fast, good for semantic similarity
const TIMEOUT = 30000;
const MAX_RETRIES = 2;

// Cache for embeddings (longer TTL as embeddings don't change)
const embeddingCache = new NodeCache({ stdTTL: 86400, maxKeys: 10000 }); // 24 hours

// Embedding metrics
let embeddingMetrics = { calls: 0, tokens: 0, errors: 0, cacheHits: 0 };

/**
 * Text preprocessing for better embedding quality
 */
function preprocessText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters but keep essential punctuation
    .replace(/[^\w\s.,;:!?@#$%&*()\-\/]/g, ' ')
    // Normalize case
    .toLowerCase()
    // Trim
    .trim();
}

/**
 * Chunk text if it exceeds max tokens (approximate by characters)
 * OpenRouter typically supports 512 tokens for most embedding models
 */
function chunkText(text, maxChars = 2000) {
  if (text.length <= maxChars) return [text];
  
  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Generate cache key for text
 */
function getCacheKey(text, type = 'default') {
  // Simple hash function for text
  let hash = 0;
  const str = text.slice(0, 500); // Use first 500 chars for hash
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${type}:${hash}`;
}

/**
 * Call OpenRouter API for embeddings with retry logic
 */
async function callEmbeddingAPI(texts, retry = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    embeddingMetrics.calls++;
    
    const response = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'HireSense AI',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: Array.isArray(texts) ? texts : [texts],
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Embedding API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract embeddings from response
    const embeddings = data.data?.map(item => item.embedding) || [];
    
    // Estimate tokens (rough approximation)
    const textLength = Array.isArray(texts) 
      ? texts.reduce((sum, t) => sum + t.length, 0) 
      : texts.length;
    embeddingMetrics.tokens += Math.ceil(textLength / 4);
    
    return embeddings;
    
  } catch (error) {
    if (retry < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
      return callEmbeddingAPI(texts, retry + 1);
    }
    
    embeddingMetrics.errors++;
    console.error('Embedding API error:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text, type = 'default') {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text provided for embedding');
  }
  
  if (!API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }
  
  // Preprocess text
  const processedText = preprocessText(text);
  
  if (processedText.length < 10) {
    throw new Error('Text too short for meaningful embedding');
  }
  
  // Check cache
  const cacheKey = getCacheKey(processedText, type);
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    embeddingMetrics.cacheHits++;
    return cached;
  }
  
  // Chunk if necessary
  const chunks = chunkText(processedText);
  
  // Get embeddings for all chunks
  const chunkEmbeddings = await callEmbeddingAPI(chunks);
  
  // Average embeddings if multiple chunks
  const finalEmbedding = chunkEmbeddings.length === 1 
    ? chunkEmbeddings[0]
    : averageEmbeddings(chunkEmbeddings);
  
  // Cache result
  embeddingCache.set(cacheKey, finalEmbedding);
  
  return finalEmbedding;
}

/**
 * Generate embeddings for multiple texts (batch processing)
 */
export async function generateEmbeddings(texts, type = 'default') {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Invalid texts array provided');
  }
  
  // Process each text
  const results = [];
  const textsToFetch = [];
  const indices = [];
  
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    const processedText = preprocessText(text);
    
    if (processedText.length < 10) {
      results[i] = null;
      continue;
    }
    
    const cacheKey = getCacheKey(processedText, type);
    const cached = embeddingCache.get(cacheKey);
    
    if (cached) {
      embeddingMetrics.cacheHits++;
      results[i] = cached;
    } else {
      textsToFetch.push(processedText);
      indices.push(i);
    }
  }
  
  // Fetch missing embeddings in batches (max 100 per request)
  const BATCH_SIZE = 100;
  for (let i = 0; i < textsToFetch.length; i += BATCH_SIZE) {
    const batch = textsToFetch.slice(i, i + BATCH_SIZE);
    const batchIndices = indices.slice(i, i + BATCH_SIZE);
    
    try {
      const embeddings = await callEmbeddingAPI(batch);
      
      // Store results and cache
      for (let j = 0; j < embeddings.length; j++) {
        const embedding = embeddings[j];
        const originalIndex = batchIndices[j];
        const cacheKey = getCacheKey(batch[j], type);
        
        embeddingCache.set(cacheKey, embedding);
        results[originalIndex] = embedding;
      }
    } catch (error) {
      console.error('Batch embedding error:', error);
      // Mark failed embeddings as null
      for (const idx of batchIndices) {
        results[idx] = null;
      }
    }
  }
  
  return results;
}

/**
 * Average multiple embeddings (for long text chunks)
 */
function averageEmbeddings(embeddings) {
  if (embeddings.length === 0) return [];
  if (embeddings.length === 1) return embeddings[0];
  
  const dimension = embeddings[0].length;
  const avg = new Array(dimension).fill(0);
  
  for (const emb of embeddings) {
    for (let i = 0; i < dimension; i++) {
      avg[i] += emb[i];
    }
  }
  
  for (let i = 0; i < dimension; i++) {
    avg[i] /= embeddings.length;
  }
  
  return avg;
}

/**
 * Compute cosine similarity between two embeddings
 * Returns value between -1 and 1 (typically 0 to 1 for semantic similarity)
 */
export function cosineSimilarity(embedding1, embedding2) {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  if (norm1 === 0 || norm2 === 0) return 0;
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Compute similarity score between 0-100 from cosine similarity
 */
export function similarityScore(cosineSim) {
  // Convert -1 to 1 range to 0 to 100
  // Typically semantic similarity is 0 to 1, so we scale accordingly
  return Math.round(((cosineSim + 1) / 2) * 100);
}

/**
 * Generate structured embeddings for a resume
 * Returns object with embeddings for different resume sections
 */
export async function generateResumeEmbeddings(resumeText) {
  if (!resumeText || resumeText.length < 50) {
    throw new Error('Resume text too short');
  }
  
  // Extract sections (simple heuristic-based extraction)
  const sections = extractResumeSections(resumeText);
  
  // Generate embeddings for each section
  const embeddings = {
    full: await generateEmbedding(resumeText, 'resume_full'),
    skills: sections.skills ? await generateEmbedding(sections.skills, 'resume_skills') : null,
    experience: sections.experience ? await generateEmbedding(sections.experience, 'resume_experience') : null,
    education: sections.education ? await generateEmbedding(sections.education, 'resume_education') : null,
    projects: sections.projects ? await generateEmbedding(sections.projects, 'resume_projects') : null,
  };
  
  return embeddings;
}

/**
 * Generate structured embeddings for a job description
 */
export async function generateJobEmbeddings(jobDescription, skills = []) {
  const skillsText = skills.join(', ');
  
  const embeddings = {
    full: await generateEmbedding(jobDescription, 'job_full'),
    skills: skillsText ? await generateEmbedding(skillsText, 'job_skills') : null,
    description: await generateEmbedding(jobDescription, 'job_description'),
  };
  
  return embeddings;
}

/**
 * Extract resume sections using simple heuristics
 */
function extractResumeSections(text) {
  const sections = {
    skills: '',
    experience: '',
    education: '',
    projects: '',
  };
  
  // Common section headers
  const patterns = {
    skills: /(?:skills?|technologies?|tech stack)[\s:]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n(?:experience|work|education|projects?|$))/i,
    experience: /(?:experience|work|employment)[\s:]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n(?:education|projects?|skills?|$))/i,
    education: /(?:education|academic|qualifications?)[\s:]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n(?:experience|projects?|skills?|$))/i,
    projects: /(?:projects?|portfolio)[\s:]*\n?([^\n]+(?:\n[^\n]+)*?)(?=\n(?:experience|education|skills?|$))/i,
  };
  
  for (const [section, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      sections[section] = match[1].trim();
    }
  }
  
  return sections;
}

/**
 * Get embedding metrics
 */
export function getEmbeddingMetrics() {
  return {
    ...embeddingMetrics,
    cacheSize: embeddingCache.keys().length,
    cacheStats: embeddingCache.getStats(),
  };
}

/**
 * Clear embedding cache
 */
export function clearEmbeddingCache() {
  embeddingCache.flushAll();
  embeddingMetrics = { calls: 0, tokens: 0, errors: 0, cacheHits: 0 };
}

/**
 * Pre-warm cache with common skill embeddings
 */
export async function prewarmSkillCache(commonSkills) {
  try {
    await generateEmbeddings(commonSkills, 'skill');
  } catch (error) {
    console.error('Failed to prewarm skill cache:', error);
  }
}
