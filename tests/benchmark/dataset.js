/**
 * Benchmark Dataset for Hybrid ATS + Semantic Resume Matcher
 * 
 * Test cases cover various scenarios:
 * - Strong match: Resume aligns well with job requirements
 * - Moderate match: Partial alignment with gaps
 * - Weak match: Significant misalignment
 * - Edge cases: Unusual formats, missing sections, etc.
 */

export const benchmarkDataset = [
  // ========== STRONG MATCH CASES (Expected: 80-100) ==========
  {
    id: 'STRONG-001',
    name: 'Full Stack Dev - Exact Match',
    category: 'strong',
    resume: `
      John Doe - Software Engineer
      
      EXPERIENCE:
      - Senior Full Stack Developer at TechCorp (2020-Present)
        * Built React/Node.js applications serving 1M+ users
        * Implemented MongoDB databases with 99.9% uptime
        * Led team of 5 developers using Agile methodologies
      
      SKILLS:
      JavaScript, React, Node.js, MongoDB, Express, TypeScript, 
      Git, Docker, AWS, REST APIs, GraphQL, Jest, CI/CD
      
      EDUCATION:
      BS Computer Science, MIT (2019)
      
      PROJECTS:
      - E-commerce platform: React, Node.js, MongoDB, Stripe integration
      - Real-time chat app: Socket.io, Redis, React frontend
    `,
    jobDescription: `
      Full Stack Developer Position
      
      REQUIRED SKILLS:
      - 3+ years JavaScript/TypeScript experience
      - React.js and Node.js proficiency
      - MongoDB database design
      - REST API and GraphQL development
      - Git version control
      - Docker and AWS experience
      
      RESPONSIBILITIES:
      - Build scalable web applications
      - Collaborate with cross-functional teams
      - Implement CI/CD pipelines
      - Write comprehensive tests
    `,
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Git', 'Docker', 'AWS'],
    expectedRange: { min: 75, max: 95 },
    description: 'Resume perfectly matches job requirements'
  },
  {
    id: 'STRONG-002',
    name: 'Data Scientist - ML Focus',
    category: 'strong',
    resume: `
      Jane Smith - Data Scientist
      
      EXPERIENCE:
      - Senior Data Scientist at AI Labs (2019-Present)
        * Built machine learning models with 95% accuracy
        * Processed 10TB+ datasets using Spark and Hadoop
        * Deployed models to production using Python and AWS SageMaker
      
      SKILLS:
      Python, Machine Learning, TensorFlow, PyTorch, Pandas, 
      NumPy, Scikit-learn, SQL, AWS, Docker, Kubernetes, 
      Statistical Analysis, Data Visualization, Jupyter
      
      EDUCATION:
      MS Data Science, Stanford (2018)
      
      PUBLICATIONS:
      - "Deep Learning for Image Recognition" - NeurIPS 2022
      - "Scalable ML Pipelines" - KDD 2021
    `,
    jobDescription: `
      Senior Data Scientist - Machine Learning
      
      REQUIREMENTS:
      - 4+ years Python and ML experience
      - TensorFlow or PyTorch expertise
      - SQL and data pipeline experience
      - Cloud deployment (AWS/GCP/Azure)
      - Statistical modeling background
      - M.S. or Ph.D. in relevant field
      
      NICE TO HAVE:
      - Docker/Kubernetes experience
      - Publications in top-tier conferences
    `,
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'SQL', 'AWS', 'Docker'],
    expectedRange: { min: 80, max: 98 },
    description: 'Strong alignment with ML-focused role'
  },

  // ========== MODERATE MATCH CASES (Expected: 60-79) ==========
  {
    id: 'MODERATE-001',
    name: 'Junior Dev - Partial Skills',
    category: 'moderate',
    resume: `
      Alex Johnson - Junior Developer
      
      EXPERIENCE:
      - Frontend Developer at StartupX (1 year)
        * Built React components for dashboard
        * Integrated REST APIs
        * Used Git for version control
      
      SKILLS:
      JavaScript, React, HTML, CSS, Git, basic Node.js, 
      some Python, SQL basics
      
      EDUCATION:
      Coding Bootcamp Graduate (2023)
      
      PROJECTS:
      - Personal portfolio website (React)
      - Weather app using OpenWeather API
    `,
    jobDescription: `
      Full Stack Developer (Mid-Level)
      
      REQUIREMENTS:
      - 3+ years full stack development
      - React and Node.js expertise
      - Database design (PostgreSQL/MongoDB)
      - Testing frameworks (Jest/Mocha)
      - Docker and CI/CD experience
      - AWS deployment knowledge
      
      Must have strong backend skills and database optimization experience.
    `,
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS', 'Jest'],
    expectedRange: { min: 55, max: 75 },
    description: 'Good frontend skills, lacking backend depth'
  },
  {
    id: 'MODERATE-002',
    name: 'DevOps - Platform Mismatch',
    category: 'moderate',
    resume: `
      Sam Chen - DevOps Engineer
      
      EXPERIENCE:
      - DevOps Engineer at CloudFirst (3 years)
        * Managed GCP infrastructure
        * Built CI/CD pipelines with Jenkins
        * Docker containerization
        * Kubernetes orchestration
      
      SKILLS:
      GCP, Docker, Kubernetes, Jenkins, Terraform, 
      Python scripting, Linux administration, monitoring
      
      EDUCATION:
      BS Computer Engineering
    `,
    jobDescription: `
      Senior DevOps Engineer - AWS Focus
      
      REQUIREMENTS:
      - 5+ years AWS experience (EC2, S3, Lambda, RDS)
      - Terraform and CloudFormation
      - Docker and Kubernetes
      - CI/CD with GitHub Actions or GitLab CI
      - Monitoring with CloudWatch/Datadog
      - Infrastructure as Code expertise
      
      Must be AWS-certified (Solutions Architect preferred).
    `,
    requiredSkills: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'GitHub Actions', 'CloudWatch'],
    expectedRange: { min: 50, max: 70 },
    description: 'Strong DevOps skills but wrong cloud platform'
  },

  // ========== WEAK MATCH CASES (Expected: 0-59) ==========
  {
    id: 'WEAK-001',
    name: 'Graphic Designer - Wrong Field',
    category: 'weak',
    resume: `
      Maria Garcia - Graphic Designer
      
      EXPERIENCE:
      - Senior Designer at CreativeStudio (5 years)
        * Brand identity design
        * UI/UX design for mobile apps
        * Adobe Creative Suite expert
        * Print and digital media
      
      SKILLS:
      Photoshop, Illustrator, InDesign, Figma, Sketch,
      Branding, Typography, Color Theory
      
      EDUCATION:
      BFA Graphic Design
      
      PORTFOLIO:
      behance.net/mariagarcia
    `,
    jobDescription: `
      Backend Software Engineer
      
      REQUIREMENTS:
      - 4+ years backend development
      - Java/Spring or Node.js expertise
      - Database design and optimization
      - Microservices architecture
      - Kafka or RabbitMQ messaging
      - Redis caching experience
      
      Computer Science degree required.
    `,
    requiredSkills: ['Java', 'Spring', 'Node.js', 'PostgreSQL', 'Kafka', 'Redis', 'Microservices'],
    expectedRange: { min: 0, max: 25 },
    description: 'Completely different field, no technical overlap'
  },
  {
    id: 'WEAK-002',
    name: 'Fresh Graduate - No Experience',
    category: 'weak',
    resume: `
      Tom Wilson - Computer Science Graduate
      
      EDUCATION:
      BS Computer Science, State University (2024)
      GPA: 3.6/4.0
      
      COURSEWORK:
      - Data Structures and Algorithms
      - Database Systems
      - Software Engineering
      
      SKILLS:
      Java, Python basics, HTML/CSS, some SQL
      
      PROJECTS:
      - Course management system (Java, MySQL)
      - Personal blog (HTML/CSS)
      
      INTERNSHIP:
      None
    `,
    jobDescription: `
      Senior Software Engineer - Backend
      
      REQUIREMENTS:
      - 5+ years Java development
      - Spring Boot microservices
      - High-performance systems design
      - Kubernetes and Docker
      - Distributed systems experience
      - Mentoring junior developers
      
      Must have production experience with high-scale systems.
    `,
    requiredSkills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Docker', 'Distributed Systems'],
    expectedRange: { min: 5, max: 30 },
    description: 'Fresh grad applying for senior role'
  },

  // ========== EDGE CASES ==========
  {
    id: 'EDGE-001',
    name: 'Transferable Skills - Career Change',
    category: 'edge',
    resume: `
      Lisa Park - Technical Product Manager
      
      EXPERIENCE:
      - Product Manager at TechCorp (4 years)
        * Led development of 3 major product launches
        * Worked closely with engineering teams
        * Technical requirements gathering
        * Data-driven decision making
      
      - Software Developer at Startup (2 years)
        * Python backend development
        * SQL database queries
        * API design
      
      SKILLS:
      Python, SQL, Product Management, Agile, Data Analysis,
      Jira, Confluence, Tableau, basic JavaScript
      
      EDUCATION:
      BS Computer Science
    `,
    jobDescription: `
      Software Engineer - Backend Python
      
      REQUIREMENTS:
      - 3+ years Python development
      - Django or Flask framework
      - PostgreSQL and query optimization
      - API design and development
      - AWS deployment experience
      - Unit testing with pytest
    `,
    requiredSkills: ['Python', 'Django', 'Flask', 'PostgreSQL', 'AWS', 'pytest'],
    expectedRange: { min: 45, max: 70 },
    description: 'Career change with some relevant background'
  },
  {
    id: 'EDGE-002',
    name: 'Overqualified - Senior to Junior',
    category: 'edge',
    resume: `
      Dr. Robert Chen - Principal Engineer
      
      EXPERIENCE:
      - Principal Engineer at Google (8 years)
        * Led 50+ person engineering organization
        * Designed distributed systems serving billions
        * 20+ patents in cloud computing
      
      - Staff Engineer at Microsoft (5 years)
        * Architected Azure services
        * Mentored hundreds of engineers
      
      SKILLS:
      Java, C++, Python, Go, Rust, Kubernetes, 
      Microservices, Distributed Systems, Machine Learning,
      50+ technologies listed
      
      EDUCATION:
      Ph.D. Computer Science, Carnegie Mellon
    `,
    jobDescription: `
      Junior Software Developer
      
      REQUIREMENTS:
      - 0-2 years experience
      - Basic Java or Python knowledge
      - Willingness to learn
      - Good communication skills
      - Bachelor\'s degree
      
      Entry-level position for recent graduates.
    `,
    requiredSkills: ['Java', 'Python', 'Basic Programming'],
    expectedRange: { min: 40, max: 70 },
    description: 'Highly overqualified candidate'
  },
  {
    id: 'EDGE-003',
    name: 'Sparse Resume - Limited Info',
    category: 'edge',
    resume: `
      Unknown Candidate
      
      SKILLS:
      JavaScript, React
      
      EXPERIENCE:
      Frontend developer
      
      No other information provided.
    `,
    jobDescription: `
      Full Stack Developer
      
      REQUIREMENTS:
      - React and Node.js
      - Database experience
      - Testing knowledge
      - DevOps familiarity
      - 3+ years experience
      - Strong portfolio
    `,
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'Jest', 'Docker'],
    expectedRange: { min: 10, max: 40 },
    description: 'Minimal information provided'
  },
  {
    id: 'EDGE-004',
    name: 'Keyword Stuffed - Gaming ATS',
    category: 'edge',
    resume: `
      Keywords McGee - Developer
      
      SKILLS:
      JavaScript JavaScript JavaScript React React React Node.js
      Node.js Node.js MongoDB MongoDB MongoDB Docker Docker Docker
      AWS AWS AWS Git Git Git TypeScript TypeScript TypeScript
      Python Python Python SQL SQL SQL React React React Node.js
      
      EXPERIENCE:
      I know JavaScript React Node.js MongoDB Docker AWS
      Git TypeScript Python SQL very well experienced expert
      
      I am a JavaScript React Node.js developer with MongoDB
      Docker AWS Git TypeScript Python SQL experience.
    `,
    jobDescription: `
      Full Stack Developer
      
      REQUIREMENTS:
      - JavaScript and React
      - Node.js and Express
      - MongoDB databases
      - Docker containers
      - AWS cloud services
      - Git version control
      - TypeScript proficiency
      
      Looking for well-rounded developers with real experience.
    `,
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Docker', 'AWS', 'TypeScript'],
    expectedRange: { min: 20, max: 50 },
    description: 'Gaming the system with keyword stuffing'
  }
];

// Validation ranges by category
export const validationConfig = {
  strong: { min: 75, max: 100, expectedAvg: 85 },
  moderate: { min: 50, max: 80, expectedAvg: 65 },
  weak: { min: 0, max: 40, expectedAvg: 15 },
  edge: { min: 0, max: 80, expectedAvg: 45 } // Wide variance expected
};

// Drift detection thresholds
export const driftThresholds = {
  maxScoreVariance: 15,        // Alert if score differs >15 from expected
  minPassRate: 0.70,          // At least 70% of tests should pass
  maxCategoryDeviation: 20     // Category average shouldn't drift >20
};
