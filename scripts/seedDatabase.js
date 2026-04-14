/**
 * HireSense AI Database Seeder
 * Generates realistic production-style demo data for testing and portfolio/demo purposes
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

// Realistic data generators
const firstNames = [
  'James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Oliver', 'Isabella',
  'Elijah', 'Mia', 'Lucas', 'Charlotte', 'Mason', 'Amelia', 'Logan', 'Harper', 'Ethan', 'Evelyn',
  'Alexander', 'Abigail', 'Michael', 'Emily', 'Benjamin', 'Elizabeth', 'Daniel', 'Sofia', 'Henry', 'Avery',
  'Jackson', 'Ella', 'Sebastian', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe', 'Samuel', 'Victoria',
  'Gabriel', 'Lily', 'Carter', 'Aria', 'Julian', 'Penelope', 'Ryan', 'Layla', 'Leo', 'Nova'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

const companyNames = [
  'TechCorp Solutions', 'InnovateTech Inc', 'DataDriven Systems', 'CloudScale Technologies',
  'AI Nexus Labs', 'CyberSecure Systems', 'Digital Horizon', 'SmartBridge Technologies',
  'Quantum Leap Software', 'FutureTech Innovations', 'CodeCraft Studios', 'PixelPerfect Design',
  'DataWave Analytics', 'TechVenture Partners', 'Silicon Valley Startups', 'DevOps Dynamics',
  'CloudNative Solutions', 'AppWorks Inc', 'TechForward Labs', 'Digital Mindset',
  'StartupHub Technologies', 'CodeBase Systems', 'TechPulse Solutions', 'Innovation Valley'
];

const jobTitles = [
  'Software Engineer Intern', 'Frontend Developer Intern', 'Backend Developer Intern',
  'Full Stack Developer Intern', 'Data Science Intern', 'Machine Learning Engineer Intern',
  'DevOps Engineer Intern', 'Cloud Engineer Intern', 'Cybersecurity Analyst Intern',
  'Product Manager Intern', 'UX/UI Designer Intern', 'Mobile App Developer Intern',
  'QA Engineer Intern', 'Database Administrator Intern', 'Network Engineer Intern',
  'AI Research Intern', 'Blockchain Developer Intern', 'Game Developer Intern',
  'Technical Writer Intern', 'Sales Engineer Intern', 'Solutions Architect Intern'
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
  'Los Angeles, CA', 'Chicago, IL', 'Denver, CO', 'Miami, FL', 'Atlanta, GA',
  'Remote', 'Hybrid - San Francisco', 'Hybrid - New York', 'Hybrid - Seattle', 'Hybrid - Austin',
  'Portland, OR', 'Phoenix, AZ', 'Dallas, TX', 'Houston, TX', 'Nashville, TN'
];

const skills = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker',
  'Kubernetes', 'SQL', 'MongoDB', 'GraphQL', 'REST APIs', 'Git', 'CI/CD',
  'Machine Learning', 'Data Analysis', 'TensorFlow', 'PyTorch', 'Java', 'C++',
  'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter', 'React Native', 'Vue.js',
  'Angular', 'Django', 'Flask', 'Express.js', 'Next.js', 'PostgreSQL'
];

// Utility functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;

const generateEmail = (firstName, lastName) => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'protonmail.com'];
  const firstNameLower = firstName.toLowerCase();
  const lastNameLower = lastName.toLowerCase();
  const patterns = [
    `${firstNameLower}.${lastNameLower}`,
    `${firstNameLower}${randomInt(1, 999)}`,
    `${firstNameLower}.${lastNameLower}${randomInt(1, 99)}`,
    `${firstNameLower[0]}${lastNameLower}`,
    `${lastNameLower}.${firstNameLower}`
  ];
  return `${randomItem(patterns)}@${randomItem(domains)}`;
};

const generateCompanyEmail = (firstName, lastName, companyName) => {
  const companyDomain = companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com';
  const firstNameLower = firstName.toLowerCase();
  const lastNameLower = lastName.toLowerCase();
  return `${firstNameLower}.${lastNameLower}@${companyDomain}`;
};

const generateDescription = (title, company, isScam) => {
  const legitimateDescriptions = [
    `We are ${company}, a leading technology company looking for talented ${title.toLowerCase()}s to join our innovative team. You will work on cutting-edge projects, collaborate with experienced engineers, and contribute to products used by millions.`,
    `${company} is seeking a passionate ${title.toLowerCase()} to help build the next generation of our platform. You'll have the opportunity to work with modern technologies, learn from industry experts, and make a real impact on user experience.`,
    `Join ${company}'s engineering team as a ${title.toLowerCase()}. We offer mentorship, hands-on experience with production systems, and a collaborative environment where your ideas matter.`,
    `${company} is looking for motivated ${title.toLowerCase()}s to join our rapidly growing team. You'll work on real projects, gain industry experience, and receive competitive compensation.`,
    `At ${company}, we're revolutionizing how people interact with technology. We need creative ${title.toLowerCase()}s to help us build innovative solutions that solve real-world problems.`
  ];

  const scamDescriptions = [
    `Urgent! ${company} needs ${title.toLowerCase()}s immediately! Work from home, flexible hours, earn $5000/month. No experience needed. Start today after quick orientation.`,
    `${company} is hiring ${title.toLowerCase()}s! Amazing opportunity with guaranteed placement. Pay $200 for training materials and get your free laptop. Limited spots available!`,
    `${title.toLowerCase()} position at ${company}. Earn $8000/week part-time. Just need computer and internet. Send resume to personal email for quick interview. Wire transfer setup required for salary.`,
    `${company} offers remote ${title.toLowerCase()} position. $10000/month salary, no experience required. Pay $500 deposit for equipment which will be refunded after 3 months. Crypto payment available.`,
    `EMERGENCY HIRING: ${company} needs ${title.toLowerCase()}s NOW! $150/hour, work from anywhere. Send banking info for immediate onboarding. No interview required.`
  ];

  return isScam ? randomItem(scamDescriptions) : randomItem(legitimateDescriptions);
};

const generateRequirements = (title, isScam) => {
  if (isScam) {
    return [
      'Must have computer',
      'Internet connection required',
      'Available to start immediately',
      'Basic computer skills',
      'Willing to learn'
    ];
  }

  const baseRequirements = [
    'Currently pursuing or recently completed a degree in Computer Science or related field',
    'Strong problem-solving skills and attention to detail',
    'Excellent communication and teamwork abilities',
    'Passion for learning new technologies',
    'Ability to work in a fast-paced environment'
  ];

  const technicalRequirements = {
    'Software Engineer Intern': ['Proficiency in at least one programming language', 'Understanding of data structures and algorithms', 'Familiarity with version control systems'],
    'Frontend Developer Intern': ['Strong knowledge of HTML, CSS, and JavaScript', 'Experience with React or similar frameworks', 'Understanding of responsive design principles'],
    'Backend Developer Intern': ['Experience with server-side programming', 'Knowledge of databases and SQL', 'Understanding of API design'],
    'Data Science Intern': ['Strong foundation in statistics and mathematics', 'Experience with Python and data analysis libraries', 'Knowledge of machine learning concepts'],
    'Machine Learning Engineer Intern': ['Experience with TensorFlow or PyTorch', 'Understanding of ML algorithms and techniques', 'Strong programming skills in Python'],
    'DevOps Engineer Intern': ['Familiarity with cloud platforms (AWS, GCP, Azure)', 'Knowledge of containerization (Docker, Kubernetes)', 'Understanding of CI/CD pipelines'],
    'Cybersecurity Analyst Intern': ['Knowledge of security principles and best practices', 'Understanding of network security', 'Familiarity with security tools'],
    'Product Manager Intern': ['Strong analytical and problem-solving skills', 'Excellent communication abilities', 'Interest in product development'],
    'UX/UI Designer Intern': ['Portfolio demonstrating design skills', 'Proficiency in design tools (Figma, Sketch)', 'Understanding of user-centered design'],
    'Mobile App Developer Intern': ['Experience with mobile development frameworks', 'Knowledge of mobile UI/UX patterns', 'Understanding of app store deployment']
  };

  return [...baseRequirements, ...(technicalRequirements[title] || technicalRequirements['Software Engineer Intern'])];
};

const generateAIAnalysis = (isScam, company, description) => {
  if (!isScam) {
    return {
      score: randomInt(75, 95),
      status: 'verified',
      reasons: [
        'Company has verified presence and professional domain',
        'Job description is detailed and specific',
        'Salary ranges are appropriate for the role',
        'Contact information uses corporate domain',
        'No suspicious patterns detected'
      ],
      checkedAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000)
    };
  }

  const scamReasons = [
    'Requests payment for training or equipment',
    'Uses personal email for corporate communication',
    'Salary appears inflated for the role level',
    'Description lacks specific technical details',
    'Multiple grammatical errors',
    'Requests personal banking information',
    'Promises unrealistic compensation',
    'Pressure tactics in job posting',
    'Company information cannot be verified',
    'Contact details are inconsistent'
  ];

  const selectedReasons = randomItems(scamReasons, randomInt(2, 4));
  const score = randomInt(10, 40);

  return {
    score: score,
    status: score < 25 ? 'scam' : 'suspicious',
    reasons: selectedReasons,
    checkedAt: new Date(Date.now() - randomInt(0, 30) * 24 * 60 * 60 * 1000)
  };
};

const generateAIMatch = () => {
  const score = randomInt(40, 98);
  const matchingSkills = randomItems(skills, randomInt(3, 6));
  const missingSkills = randomItems(skills.filter(s => !matchingSkills.includes(s)), randomInt(1, 3));

  return {
    score: score,
    feedback: score >= 80 ? 'Strong match - candidate has most required skills' :
              score >= 60 ? 'Good match - candidate has core skills with room for growth' :
              score >= 40 ? 'Moderate match - some alignment but significant gaps' :
              'Weak match - considerable skill gaps identified',
    matchingSkills: matchingSkills,
    missingSkills: missingSkills,
    checkedAt: new Date()
  };
};

// Seed data generation
async function seedDatabase() {
  try {
    // Connect to MongoDB FIRST before importing models
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hiresense-ai');
    console.log('✅ Connected to MongoDB');

    // Import models dynamically AFTER connection
    const User = (await import('../src/models/User.js')).default;
    const Internship = (await import('../src/models/Internship.js')).default;
    const Application = (await import('../src/models/Application.js')).default;

    console.log('🌱 Starting database seed...');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Internship.deleteMany({});
    await Application.deleteMany({});
    console.log('✅ Existing data cleared');

    // Generate Users
    console.log('👤 Generating users...');
    const users = [];
    const studentUsers = [];
    const companyUsers = [];
    const adminUsers = [];

    // Generate 25 candidate accounts
    for (let i = 0; i < 25; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const email = generateEmail(firstName, lastName);
      
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i}`;
      const user = new User({
        name: `${firstName} ${lastName}`,
        username: username,
        email: email,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}${i}`,
        role: 'student',
        provider: 'google'
      });
      
      await user.save();
      users.push(user);
      studentUsers.push(user);
    }

    // Generate 12 recruiter accounts
    for (let i = 0; i < 12; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const company = randomItem(companyNames);
      const email = generateCompanyEmail(firstName, lastName, company);
      
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i+25}`;
      const user = new User({
        name: `${firstName} ${lastName}`,
        username: username,
        email: email,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}${i+25}`,
        role: 'company',
        provider: 'google'
      });
      
      await user.save();
      users.push(user);
      companyUsers.push(user);
    }

    // Generate 3 admin accounts
    const adminCredentials = [];
    for (let i = 0; i < 3; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const email = generateEmail(firstName, lastName);
      
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${i+37}`;
      const user = new User({
        name: `${firstName} ${lastName}`,
        username: username,
        email: email,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${lastName}${i+37}`,
        role: 'admin',
        provider: 'google'
      });
      
      await user.save();
      users.push(user);
      adminUsers.push(user);
      adminCredentials.push({ email, name: user.name });
    }

    console.log(`✅ Generated ${users.length} users (${studentUsers.length} students, ${companyUsers.length} companies, ${adminUsers.length} admins)`);

    // Generate Internships
    console.log('💼 Generating internships...');
    const internships = [];
    const legitimateInternships = [];
    const scamInternships = [];

    for (let i = 0; i < 45; i++) {
      const company = randomItem(companyNames);
      const title = randomItem(jobTitles);
      const location = randomItem(locations);
      const isScam = Math.random() < 0.25; // 25% scam rate
      const postedBy = randomItem(companyUsers);
      
      const description = generateDescription(title, company, isScam);
      const requirements = generateRequirements(title, isScam);
      const jobSkills = randomItems(skills, randomInt(5, 10));
      
      const stipend = isScam ? 
        randomInt(8000, 15000) : 
        randomInt(3000, 8000);
      
      const durations = ['3 months', '6 months', '12 months', 'Summer', 'Fall', 'Spring'];
      const duration = randomItem(durations);
      
      // Determine type based on location
      let type = 'onsite';
      if (location.includes('Remote')) {
        type = 'remote';
      } else if (location.includes('Hybrid')) {
        type = 'hybrid';
      }

      const companyEmail = `careers@${company.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`;

      const aiVerification = generateAIAnalysis(isScam, company, description);

      const internship = new Internship({
        title: title,
        company: company,
        companyEmail: companyEmail,
        location: location,
        type: type,
        description: description,
        requirements: requirements,
        skills: jobSkills,
        duration: duration,
        stipend: `$${stipend}/month`,
        applicationDeadline: new Date(Date.now() + randomInt(7, 60) * 24 * 60 * 60 * 1000),
        postedBy: postedBy._id,
        aiVerification: aiVerification,
        adminApproval: {
          status: aiVerification.status === 'verified' ? 'approved' : 'pending',
          reviewedBy: randomItem(adminUsers)._id,
          notes: aiVerification.status === 'verified' ? 'Approved based on AI verification' : 'Flagged for review'
        }
      });

      await internship.save();
      internships.push(internship);
      
      if (isScam) {
        scamInternships.push(internship);
      } else {
        legitimateInternships.push(internship);
      }
    }

    console.log(`✅ Generated ${internships.length} internships (${legitimateInternships.length} legitimate, ${scamInternships.length} flagged)`);

    // Generate Applications
    console.log('📝 Generating applications...');
    const applications = [];
    const statuses = ['applied', 'under_review', 'shortlisted', 'rejected', 'accepted'];

    for (const student of studentUsers) {
      // Each student applies to 3-8 internships
      const applicationCount = randomInt(3, 8);
      const appliedInternships = randomItems(legitimateInternships, applicationCount);
      
      for (const internship of appliedInternships) {
        const status = randomItem(statuses);
        const aiMatch = generateAIMatch();
        
        const application = new Application({
          internship: internship._id,
          student: student._id,
          resumeUrl: `https://example.com/resumes/${student.name.replace(/\s+/g, '_')}.pdf`,
          resumeText: `Experienced developer with skills in ${aiMatch.matchingSkills.slice(0, 3).join(', ')}. Looking for challenging opportunities in software development.`,
          coverLetter: `Dear Hiring Manager,\n\nI am writing to express my interest in the ${internship.title} position at ${internship.company}. With my background in ${aiMatch.matchingSkills.slice(0, 2).join(' and ')}, I am confident in my ability to contribute effectively to your team.\n\nThank you for considering my application.\n\nBest regards,\n${student.name}`,
          aiMatch: aiMatch,
          status: status
        });

        await application.save();
        applications.push(application);
      }
    }

    console.log(`✅ Generated ${applications.length} applications`);

    // Statistics
    console.log('\n📊 Seeding Statistics:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users: ${users.length}`);
    console.log(`  - Students: ${studentUsers.length}`);
    console.log(`  - Companies: ${companyUsers.length}`);
    console.log(`  - Admins: ${adminUsers.length}`);
    console.log(`Total Internships: ${internships.length}`);
    console.log(`  - Verified/Legitimate: ${legitimateInternships.length}`);
    console.log(`  - Suspicious/Scam: ${scamInternships.length}`);
    console.log(`Total Applications: ${applications.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Admin credentials
    console.log('\n🔐 Admin Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    adminCredentials.forEach((admin, index) => {
      console.log(`Admin ${index + 1}: ${admin.name}`);
      console.log(`Email: ${admin.email}`);
      console.log('(Sign in with Google OAuth - no password needed)');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n💡 To reset the database, run this script again.');
    console.log('💡 To add more data, modify the counts in this script and rerun.');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seeder
seedDatabase();
