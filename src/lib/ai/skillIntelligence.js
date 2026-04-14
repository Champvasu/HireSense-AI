import NodeCache from 'node-cache';
import {
  generateEmbedding,
  cosineSimilarity,
  similarityScore,
  generateEmbeddings,
} from './embeddingService';

// Cache for skill embeddings and relationships
const skillCache = new NodeCache({ stdTTL: 86400, maxKeys: 5000 }); // 24 hours

// Technology family taxonomies
const TECHNOLOGY_FAMILIES = {
  // Frontend ecosystems
  react: {
    name: 'React Ecosystem',
    skills: ['react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'redux', 'react-router', 'react-query', 'tanstack-query', 'zustand', 'recoil', 'mobx', 'styled-components', 'emotion', 'material-ui', 'mui', 'chakra-ui', 'ant-design', 'gatsby', 'remix'],
    related: ['jsx', 'tsx', 'frontend', 'spa', 'ssr', 'csr'],
  },
  vue: {
    name: 'Vue Ecosystem',
    skills: ['vue', 'vue.js', 'vuejs', 'vuex', 'pinia', 'nuxt', 'nuxt.js', 'quasar', 'vuetify', 'vue-router'],
    related: ['frontend', 'spa', 'composition-api', 'options-api'],
  },
  angular: {
    name: 'Angular Ecosystem',
    skills: ['angular', 'angularjs', 'rxjs', 'ngrx', 'angular-material', 'ionic'],
    related: ['typescript', 'frontend', 'spa', 'dependency-injection'],
  },
  svelte: {
    name: 'Svelte Ecosystem',
    skills: ['svelte', 'sveltekit', 'svelte-kit', 'sapper'],
    related: ['frontend', 'compiler', 'reactivity'],
  },

  // CSS/UI frameworks
  css: {
    name: 'CSS & Styling',
    skills: ['css', 'css3', 'scss', 'sass', 'less', 'stylus', 'postcss', 'tailwind', 'tailwindcss', 'bootstrap', 'bulma', 'foundation'],
    related: ['responsive-design', 'flexbox', 'grid', 'animations'],
  },

  // JavaScript/TypeScript
  javascript: {
    name: 'JavaScript Ecosystem',
    skills: ['javascript', 'js', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020', 'es2021', 'es2022', 'es2023'],
    related: ['node.js', 'frontend', 'backend', 'fullstack'],
  },
  typescript: {
    name: 'TypeScript Ecosystem',
    skills: ['typescript', 'ts', '.ts', 'type-checking'],
    related: ['javascript', 'angular', 'react', 'vue'],
  },

  // Backend runtimes
  nodejs: {
    name: 'Node.js Ecosystem',
    skills: ['node.js', 'nodejs', 'node', 'express', 'express.js', 'koa', 'fastify', 'nest.js', 'nestjs', 'hapi', 'sails.js', 'meteor'],
    related: ['javascript', 'typescript', 'npm', 'yarn', 'pnpm'],
  },
  python: {
    name: 'Python Ecosystem',
    skills: ['python', 'python3', 'django', 'flask', 'fastapi', 'tornado', 'bottle', 'pyramid', 'celery', 'sqlalchemy'],
    related: ['data-science', 'machine-learning', 'ai', 'backend'],
  },
  golang: {
    name: 'Go Ecosystem',
    skills: ['go', 'golang', 'gin', 'echo', 'fiber', 'beego', 'buffalo'],
    related: ['backend', 'microservices', 'concurrency'],
  },
  java: {
    name: 'Java Ecosystem',
    skills: ['java', 'spring', 'spring-boot', 'springboot', 'spring-mvc', 'jakarta-ee', 'jakartaee', 'hibernate', 'struts', 'play-framework'],
    related: ['jvm', 'backend', 'enterprise'],
  },
  dotnet: {
    name: '.NET Ecosystem',
    skills: ['.net', 'dotnet', 'c#', 'csharp', 'asp.net', 'aspnet', '.net-core', 'dotnet-core', 'blazor', 'entity-framework', 'ef-core'],
    related: ['microsoft', 'backend', 'enterprise'],
  },
  rust: {
    name: 'Rust Ecosystem',
    skills: ['rust', 'actix', 'tokio', 'axum', 'rocket'],
    related: ['systems-programming', 'performance', 'memory-safety'],
  },

  // Databases
  sql: {
    name: 'SQL Databases',
    skills: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'sql-server', 'mssql', 'mariadb', 'cockroachdb', 'cockroach'],
    related: ['relational-databases', 'rdbms', 'acid', 'transactions'],
  },
  nosql: {
    name: 'NoSQL Databases',
    skills: ['mongodb', 'mongo', 'cassandra', 'couchdb', 'redis', 'dynamodb', 'neo4j', 'elasticsearch', 'couchbase', 'firebase'],
    related: ['document-store', 'key-value', 'graph-database', 'column-family'],
  },

  // Cloud platforms
  aws: {
    name: 'AWS Ecosystem',
    skills: ['aws', 'amazon-web-services', 'ec2', 's3', 'lambda', 'aws-lambda', 'rds', 'dynamodb', 'cloudfront', 'route53', 'api-gateway', 'sqs', 'sns', 'ecs', 'eks', 'fargate', 'elastic-beanstalk', 'cloudformation', 'terraform-aws'],
    related: ['cloud', 'serverless', 'iaas', 'paas'],
  },
  azure: {
    name: 'Azure Ecosystem',
    skills: ['azure', 'microsoft-azure', 'azure-functions', 'azure-app-service', 'azure-sql', 'azure-storage', 'azure-devops', 'azure-pipelines'],
    related: ['cloud', 'microsoft', 'enterprise'],
  },
  gcp: {
    name: 'Google Cloud Platform',
    skills: ['gcp', 'google-cloud', 'google-cloud-platform', 'app-engine', 'cloud-functions', 'cloud-run', 'bigquery', 'firebase', 'gke', 'cloud-storage'],
    related: ['cloud', 'google', 'data-analytics'],
  },

  // DevOps/Containerization
  docker: {
    name: 'Containerization',
    skills: ['docker', 'docker-compose', 'dockerfile', 'containerization', 'containers'],
    related: ['microservices', 'deployment', 'isolation'],
  },
  kubernetes: {
    name: 'Kubernetes Ecosystem',
    skills: ['kubernetes', 'k8s', 'kubectl', 'helm', 'istio', 'linkerd', 'argo-cd', 'argocd', 'rancher', 'openshift'],
    related: ['orchestration', 'microservices', 'cloud-native'],
  },
  cicd: {
    name: 'CI/CD',
    skills: ['ci/cd', 'cicd', 'jenkins', 'gitlab-ci', 'github-actions', 'travis-ci', 'circleci', 'azure-pipelines', 'bamboo', 'teamcity', 'argo-cd'],
    related: ['devops', 'automation', 'deployment'],
  },

  // AI/ML
  machinelearning: {
    name: 'Machine Learning',
    skills: ['machine-learning', 'ml', 'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'xgboost', 'lightgbm', 'catboost', 'pandas', 'numpy', 'scipy'],
    related: ['ai', 'data-science', 'statistics', 'python'],
  },
  datascience: {
    name: 'Data Science',
    skills: ['data-science', 'data-analysis', 'jupyter', 'matplotlib', 'seaborn', 'plotly', 'tableau', 'powerbi', 'power-bi', 'spark', 'apache-spark', 'hadoop'],
    related: ['statistics', 'visualization', 'big-data'],
  },

  // Testing
  testing: {
    name: 'Testing',
    skills: ['testing', 'jest', 'mocha', 'chai', 'cypress', 'playwright', 'selenium', 'junit', 'pytest', 'unittest', 'integration-testing', 'e2e-testing'],
    related: ['qa', 'quality-assurance', 'automation'],
  },

  // Version Control
  git: {
    name: 'Version Control',
    skills: ['git', 'github', 'gitlab', 'bitbucket', 'svn', 'mercurial'],
    related: ['collaboration', 'versioning', 'branching'],
  },
};

// Common skill synonyms and variations
const SKILL_SYNONYMS = {
  // JavaScript ecosystem
  'javascript': ['js', 'ecmascript', 'es6', 'es2015'],
  'js': ['javascript', 'ecmascript'],
  'typescript': ['ts'],
  'ts': ['typescript'],

  // React
  'react': ['react.js', 'reactjs'],
  'react.js': ['react', 'reactjs'],
  'reactjs': ['react', 'react.js'],
  'next.js': ['nextjs', 'next'],
  'nextjs': ['next.js', 'next'],

  // Node.js
  'node.js': ['nodejs', 'node'],
  'nodejs': ['node.js', 'node'],

  // Python
  'python': ['py', 'python3'],
  'py': ['python'],

  // Databases
  'postgresql': ['postgres', 'psql', 'pg'],
  'postgres': ['postgresql', 'psql', 'pg'],
  'mysql': ['sql', 'mariadb'],
  'mongodb': ['mongo', 'mongodb'],
  'mongo': ['mongodb'],

  // Cloud
  'aws': ['amazon-web-services', 'amazon'],
  'azure': ['microsoft-azure'],
  'gcp': ['google-cloud', 'google-cloud-platform'],

  // Containerization
  'kubernetes': ['k8s'],
  'k8s': ['kubernetes'],

  // Version control
  'github': ['git', 'gh'],
  'gitlab': ['git'],

  // CSS
  'tailwind': ['tailwindcss'],
  'tailwindcss': ['tailwind'],

  // Testing
  'jest': ['testing-library'],
  'cypress': ['e2e-testing'],
  'playwright': ['e2e-testing'],

  // Build tools
  'webpack': ['bundler'],
  'vite': ['build-tool'],

  // State management
  'redux': ['state-management'],
  'vuex': ['state-management', 'pinia'],
  'pinia': ['state-management', 'vuex'],
};

// Pre-computed embeddings for common skills (loaded on demand)
let commonSkillEmbeddings = new Map();

/**
 * Normalize skill name for comparison
 */
function normalizeSkill(skill) {
  return skill
    .toLowerCase()
    .replace(/[._\-\s]/g, '')  // Remove punctuation and spaces
    .trim();
}

/**
 * Check if two skills are exact matches or synonyms
 */
function areSkillsEquivalent(skill1, skill2) {
  const norm1 = normalizeSkill(skill1);
  const norm2 = normalizeSkill(skill2);

  if (norm1 === norm2) return true;

  // Check synonym mappings
  const synonyms1 = SKILL_SYNONYMS[norm1] || [];
  const synonyms2 = SKILL_SYNONYMS[norm2] || [];

  if (synonyms1.includes(norm2) || synonyms2.includes(norm1)) return true;

  return false;
}

/**
 * Get technology family for a skill
 */
function getTechnologyFamily(skill) {
  const normalized = normalizeSkill(skill);

  for (const [familyKey, family] of Object.entries(TECHNOLOGY_FAMILIES)) {
    const familySkills = family.skills.map(normalizeSkill);
    if (familySkills.includes(normalized)) {
      return {
        key: familyKey,
        name: family.name,
        familySkills: family.skills,
        relatedConcepts: family.related,
      };
    }
  }

  return null;
}

/**
 * Check if two skills are in the same technology family
 */
function areSkillsInSameFamily(skill1, skill2) {
  const family1 = getTechnologyFamily(skill1);
  const family2 = getTechnologyFamily(skill2);

  if (!family1 || !family2) return false;

  return family1.key === family2.key;
}

/**
 * Find all skills in the same family as the given skill
 */
function getFamilySkills(skill) {
  const family = getTechnologyFamily(skill);
  if (!family) return [];

  return family.familySkills.filter(s => !areSkillsEquivalent(s, skill));
}

/**
 * Generate or retrieve cached embedding for a skill
 */
async function getSkillEmbedding(skill) {
  const cacheKey = `skill:${normalizeSkill(skill)}`;

  const cached = skillCache.get(cacheKey);
  if (cached) return cached;

  try {
    const embedding = await generateEmbedding(skill, 'skill');
    skillCache.set(cacheKey, embedding);
    return embedding;
  } catch (error) {
    console.error(`Failed to generate embedding for skill "${skill}":`, error);
    return null;
  }
}

/**
 * Compute semantic similarity between two skills
 */
export async function computeSkillSimilarity(skill1, skill2) {
  // Check for exact match or synonym first
  if (areSkillsEquivalent(skill1, skill2)) {
    return {
      similarity: 1.0,
      score: 100,
      matchType: 'exact_or_synonym',
      transferable: false, // Already a match, no transfer needed
    };
  }

  // Check technology family
  if (areSkillsInSameFamily(skill1, skill2)) {
    return {
      similarity: 0.85,
      score: 85,
      matchType: 'same_family',
      family: getTechnologyFamily(skill1)?.name,
      transferable: true,
      transferConfidence: 'high',
    };
  }

  // Compute semantic similarity via embeddings
  const [emb1, emb2] = await Promise.all([
    getSkillEmbedding(skill1),
    getSkillEmbedding(skill2),
  ]);

  if (!emb1 || !emb2) {
    return {
      similarity: 0,
      score: 0,
      matchType: 'error',
      transferable: false,
      error: 'Failed to generate embeddings',
    };
  }

  const similarity = cosineSimilarity(emb1, emb2);
  const score = similarityScore(similarity);

  // Determine transferability based on similarity
  let transferable = false;
  let transferConfidence = 'none';

  if (score >= 80) {
    transferable = true;
    transferConfidence = 'high';
  } else if (score >= 65) {
    transferable = true;
    transferConfidence = 'medium';
  } else if (score >= 50) {
    transferable = true;
    transferConfidence = 'low';
  }

  return {
    similarity,
    score,
    matchType: 'semantic_similarity',
    transferable,
    transferConfidence,
  };
}

/**
 * Find transferable skills from resume skills to required skills
 */
export async function findTransferableSkills(resumeSkills, requiredSkills) {
  const results = {
    directMatches: [],
    transferableMatches: [],
    gapSkills: [],
    suggestions: [],
  };

  const processedRequired = new Set();

  for (const required of requiredSkills) {
    let bestMatch = null;
    let bestScore = 0;

    for (const resumeSkill of resumeSkills) {
      const match = await computeSkillSimilarity(resumeSkill, required);

      if (match.score > bestScore) {
        bestScore = match.score;
        bestMatch = {
          requiredSkill: required,
          resumeSkill: resumeSkill,
          ...match,
        };
      }
    }

    if (bestMatch) {
      if (bestMatch.matchType === 'exact_or_synonym') {
        results.directMatches.push(bestMatch);
      } else if (bestMatch.transferable) {
        results.transferableMatches.push(bestMatch);

        // Generate transferable skill suggestion
        results.suggestions.push({
          from: bestMatch.resumeSkill,
          to: bestMatch.requiredSkill,
          confidence: bestMatch.transferConfidence,
          reason: generateTransferReason(bestMatch),
        });
      } else {
        results.gapSkills.push({
          skill: required,
          bestPartialMatch: bestMatch,
        });
      }
    } else {
      results.gapSkills.push({
        skill: required,
        bestPartialMatch: null,
      });
    }

    processedRequired.add(required);
  }

  return results;
}

/**
 * Generate human-readable reason for skill transferability
 */
function generateTransferReason(match) {
  if (match.matchType === 'same_family') {
    return `${match.resumeSkill} and ${match.requiredSkill} are both part of the ${match.family} ecosystem`;
  }

  if (match.matchType === 'semantic_similarity') {
    if (match.score >= 80) {
      return `${match.resumeSkill} is semantically very similar to ${match.requiredSkill} (${match.score}% match)`;
    } else if (match.score >= 65) {
      return `${match.resumeSkill} shares significant conceptual overlap with ${match.requiredSkill} (${match.score}% match)`;
    } else {
      return `${match.resumeSkill} has some transferable concepts to ${match.requiredSkill} (${match.score}% match)`;
    }
  }

  return `${match.resumeSkill} can be transferred to ${match.requiredSkill}`;
}

/**
 * Find related skills using semantic similarity
 */
export async function findRelatedSkills(skill, topK = 5) {
  const candidates = [];

  // Collect all skills from technology families
  for (const family of Object.values(TECHNOLOGY_FAMILIES)) {
    candidates.push(...family.skills);
  }

  // Add common standalone skills
  const commonSkills = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'c++', 'c#',
    'react', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind',
    'node.js', 'django', 'flask', 'spring', 'express',
    'postgresql', 'mysql', 'mongodb', 'redis',
    'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'terraform',
    'git', 'github', 'gitlab',
    'jest', 'cypress', 'playwright',
    'figma', 'sketch', 'adobe-xd',
  ];

  candidates.push(...commonSkills);

  // Remove duplicates and the input skill
  const uniqueCandidates = [...new Set(candidates.filter(s => !areSkillsEquivalent(s, skill)))];

  // Compute similarity for each candidate
  const similarities = [];
  for (const candidate of uniqueCandidates.slice(0, 50)) { // Limit for performance
    const match = await computeSkillSimilarity(skill, candidate);
    if (match.score > 50) { // Only include reasonably similar skills
      similarities.push({
        skill: candidate,
        ...match,
      });
    }
  }

  // Sort by score and return top K
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Analyze skill gaps with intelligent suggestions
 */
export async function analyzeSkillGaps(resumeSkills, requiredSkills) {
  const analysis = await findTransferableSkills(resumeSkills, requiredSkills);

  // Enhance gap skills with learning suggestions
  const enhancedGaps = await Promise.all(
    analysis.gapSkills.map(async (gap) => {
      const related = gap.bestPartialMatch
        ? await findRelatedSkills(gap.bestPartialMatch.resumeSkill, 3)
        : [];

      return {
        ...gap,
        relatedSkills: related,
        learningPath: generateLearningPath(gap.skill, related),
      };
    })
  );

  return {
    ...analysis,
    gapSkills: enhancedGaps,
    summary: {
      totalRequired: requiredSkills.length,
      directMatches: analysis.directMatches.length,
      transferableMatches: analysis.transferableMatches.length,
      trueGaps: analysis.gapSkills.length,
      coverage: Math.round(
        ((analysis.directMatches.length + analysis.transferableMatches.length) / requiredSkills.length) * 100
      ),
    },
  };
}

/**
 * Generate learning path suggestion for a skill gap
 */
function generateLearningPath(targetSkill, relatedSkills) {
  const family = getTechnologyFamily(targetSkill);

  if (family) {
    const familySkills = family.familySkills
      .filter(s => !areSkillsEquivalent(s, targetSkill))
      .slice(0, 3);

    return {
      approach: 'family_first',
      message: `Start with related ${family.name} skills`,
      prerequisites: familySkills,
      estimatedTime: '2-4 weeks',
    };
  }

  if (relatedSkills.length > 0) {
    return {
      approach: 'related_skills',
      message: `Leverage your experience with ${relatedSkills[0].skill}`,
      prerequisites: relatedSkills.slice(0, 2).map(r => r.skill),
      estimatedTime: '3-6 weeks',
    };
  }

  return {
    approach: 'from_scratch',
    message: 'Begin with fundamentals',
    prerequisites: [],
    estimatedTime: '6-8 weeks',
  };
}

/**
 * Pre-warm cache with common skill embeddings
 */
export async function prewarmSkillEmbeddings() {
  const allSkills = new Set();

  // Collect all skills from families
  for (const family of Object.values(TECHNOLOGY_FAMILIES)) {
    family.skills.forEach(s => allSkills.add(s));
  }

  // Generate embeddings in batches
  const skills = Array.from(allSkills);
  const batchSize = 50;

  for (let i = 0; i < skills.length; i += batchSize) {
    const batch = skills.slice(i, i + batchSize);
    await generateEmbeddings(batch, 'skill');
  }

  logInfo(`Skill Intelligence: Pre-warmed ${skills.length} skill embeddings`);
}

/**
 * Get skill intelligence metrics
 */
export function getSkillIntelligenceMetrics() {
  return {
    cacheSize: skillCache.keys().length,
    cacheStats: skillCache.getStats(),
    technologyFamilies: Object.keys(TECHNOLOGY_FAMILIES).length,
    synonymMappings: Object.keys(SKILL_SYNONYMS).length,
  };
}

/**
 * Clear skill intelligence cache
 */
export function clearSkillIntelligenceCache() {
  skillCache.flushAll();
  commonSkillEmbeddings.clear();
}

// Export technology families for external use
export { TECHNOLOGY_FAMILIES, SKILL_SYNONYMS, getTechnologyFamily };
