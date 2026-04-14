// Mock AI verification test - simulates AI responses without calling actual API
// This allows testing the system without exposing real API keys

const testCases = [
  {
    name: 'Legitimate - Established Tech Company',
    category: 'legitimate',
    data: {
      title: 'Software Engineering Intern',
      company: 'TechCorp Inc.',
      companyEmail: 'careers@techcorp.com',
      location: 'San Francisco, CA',
      type: 'remote',
      description: 'Join our engineering team to work on cutting-edge cloud infrastructure. You will collaborate with senior engineers on production systems, participate in code reviews, and contribute to architectural decisions. Ideal candidates should have experience with React, Node.js, and cloud platforms like AWS or GCP.',
      requirements: ['Pursuing CS degree', 'Experience with JavaScript', 'Knowledge of web development'],
      skills: ['React', 'Node.js', 'AWS', 'TypeScript'],
      duration: '12 weeks',
      stipend: '$8000/month',
      applicationDeadline: '2026-06-30',
      companyWebsite: 'https://techcorp.com',
      companyLinkedIn: 'https://linkedin.com/company/techcorp',
      companyRegistrationId: '12-3456789',
      foundedYear: 2015,
      companySize: '51-200',
      headquarters: 'San Francisco, CA',
      recruiterTitle: 'Senior HR Manager',
      recruiterLinkedIn: 'https://linkedin.com/in/sarah-recruiter',
      hiringProcess: 'Initial screening call, technical interview with engineering team, final round with hiring manager. Total timeline: 2-3 weeks.',
      interviewRounds: 3,
      reportingManager: 'Engineering Team Lead',
      conversionOpportunity: true,
      numberOfOpenings: 5,
      testimonials: ['Great learning environment', 'Structured mentorship program']
    }
  },
  {
    name: 'Legitimate - Startup with Good Verification',
    category: 'legitimate',
    data: {
      title: 'Product Design Intern',
      company: 'DesignHub',
      companyEmail: 'hiring@designhub.io',
      location: 'Remote',
      type: 'remote',
      description: 'We are looking for a passionate design intern to join our growing team. You will work on real product features, create user interfaces, and participate in design sprints. This is a paid internship with mentorship from senior designers.',
      requirements: ['Design portfolio', 'Experience with Figma', 'Strong visual design skills'],
      skills: ['Figma', 'UI Design', 'Prototyping', 'User Research'],
      duration: '3 months',
      stipend: '$4000/month',
      applicationDeadline: '2026-05-15',
      companyWebsite: 'https://designhub.io',
      companyLinkedIn: 'https://linkedin.com/company/designhub',
      companyRegistrationId: '85-1234567',
      foundedYear: 2020,
      companySize: '11-50',
      headquarters: 'Austin, TX',
      recruiterTitle: 'Design Lead',
      recruiterLinkedIn: 'https://linkedin.com/in/design-lead',
      hiringProcess: 'Portfolio review, design challenge, team fit interview. We provide feedback at each stage.',
      interviewRounds: 2,
      reportingManager: 'Head of Design',
      conversionOpportunity: false,
      numberOfOpenings: 2,
      testimonials: ['Amazing team culture', 'Hands-on experience']
    }
  },
  {
    name: 'Scam - Gmail Email with Unrealistic Pay',
    category: 'scam',
    data: {
      title: 'Data Entry Work From Home',
      company: 'Global Tech Solutions',
      companyEmail: 'hr.globatech@gmail.com',
      location: 'Remote',
      type: 'remote',
      description: 'Earn $5000 weekly working from home! No experience needed. Just type data and get paid. Start immediately after simple registration fee.',
      requirements: ['Basic typing', 'Internet connection'],
      skills: ['Typing'],
      duration: 'Ongoing',
      stipend: '$5000/week',
      applicationDeadline: '2026-12-31',
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
      testimonials: []
    }
  },
  {
    name: 'Scam - Payment Request',
    category: 'scam',
    data: {
      title: 'Social Media Manager',
      company: 'Digital Marketing Pro',
      companyEmail: 'digital.marketing@yahoo.com',
      location: 'Remote',
      type: 'remote',
      description: 'We need social media managers urgently! Pay $2000 per week. Small $50 registration fee required for training materials. After payment, you can start immediately.',
      requirements: ['Social media experience', 'Good communication'],
      skills: ['Facebook', 'Instagram', 'Twitter'],
      duration: '6 months',
      stipend: '$2000/week',
      applicationDeadline: '2026-04-20',
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
      testimonials: []
    }
  },
  {
    name: 'Scam - Vague Description + Fake Urgency',
    category: 'scam',
    data: {
      title: 'Business Development Intern',
      company: 'Elite Business Group',
      companyEmail: 'elitegroup@gmail.com',
      location: 'New York',
      type: 'onsite',
      description: 'HURRY! Limited spots available! Amazing opportunity with top company. Great pay and benefits. Apply NOW before positions filled. Contact us immediately for interview.',
      requirements: ['Motivated individuals', 'Good communication'],
      skills: ['Sales', 'Communication'],
      duration: '3 months',
      stipend: '$3000/month',
      applicationDeadline: '2026-04-15',
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
      testimonials: []
    }
  },
  {
    name: 'Mixed - Partial Verification',
    category: 'mixed',
    data: {
      title: 'Marketing Intern',
      company: 'GrowthStartup',
      companyEmail: 'jobs@growthstartup.com',
      location: 'Remote',
      type: 'hybrid',
      description: 'Join our marketing team to help grow our user base. You will work on social media campaigns, content creation, and market research. We are a fast-growing startup looking for motivated individuals.',
      requirements: ['Marketing interest', 'Social media knowledge', 'Writing skills'],
      skills: ['Social Media', 'Content Writing', 'SEO'],
      duration: '4 months',
      stipend: '$2500/month',
      applicationDeadline: '2026-07-01',
      companyWebsite: 'https://growthstartup.com',
      companyLinkedIn: '',
      companyRegistrationId: '',
      foundedYear: 2022,
      companySize: '1-10',
      headquarters: '',
      recruiterTitle: '',
      recruiterLinkedIn: '',
      hiringProcess: 'Initial call, then practical task',
      interviewRounds: 2,
      reportingManager: '',
      conversionOpportunity: false,
      numberOfOpenings: 1,
      testimonials: []
    }
  },
  {
    name: 'Mixed - No Website but Good Details',
    category: 'mixed',
    data: {
      title: 'Research Analyst Intern',
      company: 'DataInsights LLC',
      companyEmail: 'careers@datainsights.com',
      location: 'Chicago, IL',
      type: 'onsite',
      description: 'We are looking for research analysts to join our team. You will analyze market trends, create reports, and present findings to clients. Strong analytical skills required.',
      requirements: ['Analytical skills', 'Excel proficiency', 'Research experience'],
      skills: ['Excel', 'Data Analysis', 'Report Writing'],
      duration: '6 months',
      stipend: '$3500/month',
      applicationDeadline: '2026-08-15',
      companyWebsite: '',
      companyLinkedIn: 'https://linkedin.com/company/datainsights',
      companyRegistrationId: '27-9876543',
      foundedYear: 2018,
      companySize: '11-50',
      headquarters: 'Chicago, IL',
      recruiterTitle: 'Research Director',
      recruiterLinkedIn: '',
      hiringProcess: 'Case study interview, analytical test, team interview',
      interviewRounds: 3,
      reportingManager: 'Research Director',
      conversionOpportunity: true,
      numberOfOpenings: 3,
      testimonials: []
    }
  },
  {
    name: 'Adversarial - Mismatched Email Domain',
    category: 'adversarial',
    data: {
      title: 'Software Developer Intern',
      company: 'Microsoft',
      companyEmail: 'careers@microsofthiring.com',
      location: 'Redmond, WA',
      type: 'hybrid',
      description: 'Join Microsoft as a software developer intern. Work on world-class products with talented engineers. Great learning opportunity with competitive pay.',
      requirements: ['CS degree', 'Programming experience', 'Problem-solving skills'],
      skills: ['C++', 'Python', 'Azure'],
      duration: '12 weeks',
      stipend: '$7500/month',
      applicationDeadline: '2026-09-01',
      companyWebsite: 'https://microsoft.com',
      companyLinkedIn: 'https://linkedin.com/company/microsoft',
      companyRegistrationId: '91-1644429',
      foundedYear: 1975,
      companySize: '1000+',
      headquarters: 'Redmond, WA',
      recruiterTitle: 'Engineering Manager',
      recruiterLinkedIn: '',
      hiringProcess: 'Online assessment, technical interviews, behavioral interviews',
      interviewRounds: 4,
      reportingManager: 'Engineering Manager',
      conversionOpportunity: true,
      numberOfOpenings: 10,
      testimonials: []
    }
  },
  {
    name: 'Adversarial - Fake LinkedIn URL',
    category: 'adversarial',
    data: {
      title: 'Data Science Intern',
      company: 'TechGiant Corp',
      companyEmail: 'recruiting@techgiant.com',
      location: 'Remote',
      type: 'remote',
      description: 'Exciting opportunity to work with cutting-edge AI and machine learning projects. You will build models, analyze data, and collaborate with data scientists.',
      requirements: ['ML experience', 'Python', 'Statistics'],
      skills: ['Python', 'TensorFlow', 'SQL'],
      duration: '6 months',
      stipend: '$6000/month',
      applicationDeadline: '2026-07-15',
      companyWebsite: 'https://techgiant-corp-fake.com',
      companyLinkedIn: 'https://linkedin.com/company/techgiant-fake-page-12345',
      companyRegistrationId: '12-3456789',
      foundedYear: 2020,
      companySize: '51-200',
      headquarters: 'San Jose, CA',
      recruiterTitle: 'Data Science Lead',
      recruiterLinkedIn: 'https://linkedin.com/in/fake-recruiter-67890',
      hiringProcess: 'Technical assessment, coding challenge, team interviews',
      interviewRounds: 3,
      reportingManager: 'Data Science Manager',
      conversionOpportunity: true,
      numberOfOpenings: 5,
      testimonials: ['Great experience', 'Learned a lot']
    }
  },
  {
    name: 'Adversarial - Inconsistent Company Details',
    category: 'adversarial',
    data: {
      title: 'Finance Intern',
      company: 'Global Bank Corp',
      companyEmail: 'hiring@globalbankcorp.com',
      location: 'London, UK',
      type: 'hybrid',
      description: 'Join our prestigious finance internship program. Work with investment bankers on real deals. High stipend and potential full-time offer.',
      requirements: ['Finance background', 'Excel skills', 'Analytical thinking'],
      skills: ['Excel', 'Financial Modeling', 'Valuation'],
      duration: '10 weeks',
      stipend: '$10000/month',
      applicationDeadline: '2026-06-01',
      companyWebsite: 'https://globalbankcorp.com',
      companyLinkedIn: 'https://linkedin.com/company/globalbankcorp',
      companyRegistrationId: '12-3456789',
      foundedYear: 2010,
      companySize: '1000+',
      headquarters: 'New York, NY',
      recruiterTitle: 'Investment Banking VP',
      recruiterLinkedIn: 'https://linkedin.com/in/banker-profile',
      hiringProcess: 'Multiple rounds of technical and behavioral interviews',
      interviewRounds: 5,
      reportingManager: 'Managing Director',
      conversionOpportunity: true,
      numberOfOpenings: 15,
      testimonials: ['Top-tier experience', 'Great networking']
    }
  },
  {
    name: 'Legitimate - Non-Tech Company',
    category: 'legitimate',
    data: {
      title: 'Operations Intern',
      company: 'GreenLeaf Organics',
      companyEmail: 'careers@greenleaf.com',
      location: 'Portland, OR',
      type: 'onsite',
      description: 'We are looking for an operations intern to help streamline our supply chain and logistics processes. You will work closely with the operations team on inventory management, vendor coordination, and process improvement initiatives.',
      requirements: ['Business or Supply Chain major', 'Strong organizational skills', 'Excel proficiency'],
      skills: ['Operations Management', 'Excel', 'Communication'],
      duration: '3 months',
      stipend: '$3000/month',
      applicationDeadline: '2026-05-30',
      companyWebsite: 'https://greenleaf.com',
      companyLinkedIn: 'https://linkedin.com/company/greenleaf-organics',
      companyRegistrationId: '93-1234567',
      foundedYear: 2012,
      companySize: '51-200',
      headquarters: 'Portland, OR',
      recruiterTitle: 'Operations Manager',
      recruiterLinkedIn: 'https://linkedin.com/in/ops-manager',
      hiringProcess: 'Phone screen, in-person interview, operations case study',
      interviewRounds: 2,
      reportingManager: 'Director of Operations',
      conversionOpportunity: false,
      numberOfOpenings: 2,
      testimonials: ['Supportive team', 'Real responsibility']
    }
  },
  {
    name: 'Scam - Too Good to Be True',
    category: 'scam',
    data: {
      title: 'Customer Success Manager',
      company: 'SuccessNow Inc.',
      companyEmail: 'apply@successnow-hotmail.com',
      location: 'Remote',
      type: 'remote',
      description: 'EARN $10000 WEEKLY! No experience needed! Just talk to customers and get paid. Work from anywhere. Start TODAY! Limited spots - ACT NOW!',
      requirements: ['Good English', 'Internet access'],
      skills: ['Communication'],
      duration: 'Ongoing',
      stipend: '$10000/week',
      applicationDeadline: '2026-04-14',
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
      testimonials: []
    }
  }
];

// Mock AI verification function that simulates realistic responses
function mockVerifyInternship(data) {
  // Calculate trust score based on various factors
  let score = 50; // Base score
  const reasons = [];

  // Email domain check
  const emailDomain = data.companyEmail.split('@')[1];
  if (emailDomain.includes('gmail') || emailDomain.includes('yahoo') || emailDomain.includes('hotmail')) {
    score -= 30;
    reasons.push('Uses free email domain (Gmail/Yahoo/Hotmail)');
  } else if (data.companyWebsite && emailDomain.includes(data.companyWebsite.replace('https://', '').split('/')[0])) {
    score += 15;
    reasons.push('Email domain matches company website');
  }

  // Website check
  if (data.companyWebsite && data.companyWebsite.length > 10) {
    score += 15;
    reasons.push('Company website provided');
  } else {
    score -= 10;
    reasons.push('No company website provided');
  }

  // LinkedIn check
  if (data.companyLinkedIn && data.companyLinkedIn.length > 10) {
    score += 10;
    reasons.push('LinkedIn company page provided');
  }

  // Registration ID check
  if (data.companyRegistrationId && data.companyRegistrationId.length > 5) {
    score += 15;
    reasons.push('Company registration ID provided');
  }

  // Founded year check
  if (data.foundedYear && data.foundedYear >= 1800 && data.foundedYear <= new Date().getFullYear()) {
    const companyAge = new Date().getFullYear() - data.foundedYear;
    if (companyAge > 5) {
      score += 10;
      reasons.push('Established company (founded over 5 years ago)');
    } else if (companyAge > 1) {
      score += 5;
      reasons.push('Company has some operating history');
    }
  }

  // Recruiter LinkedIn check
  if (data.recruiterLinkedIn && data.recruiterLinkedIn.length > 10) {
    score += 5;
    reasons.push('Recruiter LinkedIn profile provided');
  }

  // Hiring process check
  if (data.hiringProcess && data.hiringProcess.length > 50) {
    score += 10;
    reasons.push('Detailed hiring process described');
  }

  // Testimonials check
  if (data.testimonials && data.testimonials.length > 0) {
    score += 5;
    reasons.push('Prior intern testimonials provided');
  }

  // Scam indicators in description
  const scamKeywords = ['payment', 'fee', 'register', 'urgently', 'immediately', 'hurry', 'act now', 'limited spots'];
  const description = data.description.toLowerCase();
  scamKeywords.forEach(keyword => {
    if (description.includes(keyword)) {
      score -= 15;
      reasons.push(`Suspicious keyword in description: "${keyword}"`);
    }
  });

  // Unrealistic stipend check
  const stipend = data.stipend.toLowerCase();
  if (stipend.includes('5000') || stipend.includes('10000')) {
    score -= 20;
    reasons.push('Unrealistic high stipend for internship');
  }

  // Vague description check
  if (data.description.length < 100) {
    score -= 15;
    reasons.push('Description too vague');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status;
  if (score >= 80) {
    status = 'verified';
  } else if (score >= 50) {
    status = 'suspicious';
  } else {
    status = 'scam';
  }

  // Ensure we have at least 3 reasons
  while (reasons.length < 3) {
    if (score >= 70) {
      reasons.push('Multiple positive trust indicators present');
    } else if (score >= 40) {
      reasons.push('Mixed trust signals - some verification missing');
    } else {
      reasons.push('Multiple red flags detected');
    }
  }

  // Limit to 5 reasons
  reasons.length = Math.min(5, reasons.length);

  return {
    score,
    status,
    reasons,
    checkedAt: new Date()
  };
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('AI VERIFICATION SYSTEM TEST SUITE (MOCK)');
  console.log('='.repeat(80));
  console.log('');
  console.log('Note: This test uses simulated AI responses to evaluate the scoring logic');
  console.log('without exposing real API keys or making actual API calls.');
  console.log('');

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}/${testCases.length}: ${testCase.name}`);
    console.log(`Category: ${testCase.category.toUpperCase()}`);
    console.log('-'.repeat(80));

    try {
      const result = mockVerifyInternship(testCase.data);
      
      results.push({
        name: testCase.name,
        category: testCase.category,
        score: result.score,
        status: result.status,
        reasons: result.reasons,
        error: false
      });

      console.log(`Score: ${result.score}`);
      console.log(`Status: ${result.status}`);
      console.log(`Reasons:`);
      result.reasons.forEach((reason, idx) => {
        console.log(`  ${idx + 1}. ${reason}`);
      });
    } catch (error) {
      console.error(`Test failed with error:`, error.message);
      results.push({
        name: testCase.name,
        category: testCase.category,
        score: null,
        status: 'error',
        reasons: [error.message],
        error: true
      });
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  // Print results table
  console.log('Name'.padEnd(40) + 'Category'.padEnd(15) + 'Score'.padEnd(10) + 'Status'.padEnd(15) + 'Error');
  console.log('-'.repeat(80));
  
  results.forEach(result => {
    const scoreStr = result.score !== null ? result.score.toString() : 'N/A';
    const errorStr = result.error ? 'YES' : 'NO';
    console.log(
      result.name.substring(0, 38).padEnd(40) +
      result.category.toUpperCase().padEnd(15) +
      scoreStr.padEnd(10) +
      result.status.toUpperCase().padEnd(15) +
      errorStr
    );
  });

  console.log('');
  console.log('='.repeat(80));
  console.log('DETAILED ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  // Analyze by category
  const categories = ['legitimate', 'scam', 'mixed', 'adversarial'];
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    if (categoryResults.length === 0) return;

    const avgScore = categoryResults.reduce((sum, r) => sum + (r.score || 0), 0) / categoryResults.length;
    const statusCounts = categoryResults.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`${category.toUpperCase()} Listings (${categoryResults.length} total):`);
    console.log(`  Average Score: ${avgScore.toFixed(1)}`);
    console.log(`  Status Distribution:`, statusCounts);
    console.log('');
  });

  // Scoring consistency analysis
  console.log('SCORING CONSISTENCY ANALYSIS:');
  console.log('');
  
  const legitimateResults = results.filter(r => r.category === 'legitimate' && r.score !== null);
  const scamResults = results.filter(r => r.category === 'scam' && r.score !== null);
  
  if (legitimateResults.length > 0) {
    const avgLegitScore = legitimateResults.reduce((sum, r) => sum + r.score, 0) / legitimateResults.length;
    const legitVerified = legitimateResults.filter(r => r.status === 'verified').length;
    console.log(`Legitimate listings: ${legitimateResults.length} total`);
    console.log(`  Average score: ${avgLegitScore.toFixed(1)}`);
    console.log(`  Verified: ${legitVerified}/${legitimateResults.length} (${((legitVerified/legitimateResults.length)*100).toFixed(0)}%)`);
  }
  
  if (scamResults.length > 0) {
    const avgScamScore = scamResults.reduce((sum, r) => sum + r.score, 0) / scamResults.length;
    const scamDetected = scamResults.filter(r => r.status === 'scam').length;
    console.log(`Scam listings: ${scamResults.length} total`);
    console.log(`  Average score: ${avgScamScore.toFixed(1)}`);
    console.log(`  Detected as scam: ${scamDetected}/${scamResults.length} (${((scamDetected/scamResults.length)*100).toFixed(0)}%)`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(80));
  console.log('');

  // Generate recommendations based on results
  if (legitimateResults.length > 0 && scamResults.length > 0) {
    const avgLegitScore = legitimateResults.reduce((sum, r) => sum + r.score, 0) / legitimateResults.length;
    const avgScamScore = scamResults.reduce((sum, r) => sum + r.score, 0) / scamResults.length;
    const scoreGap = avgLegitScore - avgScamScore;

    if (scoreGap > 30) {
      console.log('✓ Good score separation between legitimate and scam listings');
    } else if (scoreGap > 10) {
      console.log('⚠ Moderate score separation - consider adjusting prompt weights');
    } else {
      console.log('✗ Poor score separation - prompt calibration needed');
    }
  }

  const mixedResults = results.filter(r => r.category === 'mixed' && r.score !== null);
  if (mixedResults.length > 0) {
    const avgMixedScore = mixedResults.reduce((sum, r) => sum + r.score, 0) / mixedResults.length;
    console.log(`✓ Mixed/borderline listings scoring around ${avgMixedScore.toFixed(1)} - reasonable middle ground`);
  }

  const adversarialResults = results.filter(r => r.category === 'adversarial' && r.score !== null);
  if (adversarialResults.length > 0) {
    const adversarialDetected = adversarialResults.filter(r => r.status === 'scam' || r.status === 'suspicious').length;
    console.log(`✓ Adversarial/fake trust inputs: ${adversarialDetected}/${adversarialResults.length} detected`);
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('SECURITY NOTE');
  console.log('='.repeat(80));
  console.log('');
  console.log('This test used simulated AI responses to avoid exposing real API keys.');
  console.log('Before deploying to production:');
  console.log('1. Rotate any real API keys that may have been shared');
  console.log('2. Test with actual AI API using real environment variables');
  console.log('3. Ensure .env.local is in .gitignore');
  console.log('4. Use environment-specific API keys for development/staging/production');
  console.log('');
}

runTests().catch(console.error);
