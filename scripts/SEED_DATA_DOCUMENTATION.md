# HireSense AI - Database Seeding Documentation

## Overview

The HireSense AI application has been populated with realistic production-style demo data for comprehensive testing and portfolio/demo purposes. All data is generated programmatically with realistic patterns, relationships, and AI analysis results.

## Seeded Dataset Structure

### Users (40 total)

#### Students (25 accounts)
- Realistic names from diverse backgrounds
- Professional email addresses (gmail, yahoo, outlook, icloud, protonmail)
- Avatar images generated using DiceBear API
- Role: `student`

#### Companies (12 accounts)
- Recruiter accounts with company-specific email domains
- Professional email format: `firstname.lastname@companydomain.com`
- Avatar images generated using DiceBear API
- Role: `company`

#### Admins (3 accounts)
- Administrator accounts for platform management
- Professional email addresses
- Avatar images generated using DiceBear API
- Role: `admin`

### Internships (45 total)

#### Legitimate Internships (32)
- Professional job descriptions with realistic details
- Appropriate salary ranges ($3,000 - $8,000/month)
- Verified AI analysis scores (75-95)
- Company email addresses using corporate domains
- Detailed technical requirements
- Duration: 3 months, 6 months, 12 months, Summer, Fall, Spring
- Locations: San Francisco, New York, Seattle, Austin, Boston, Los Angeles, Chicago, Denver, Miami, Atlanta, Remote, Hybrid
- Types: remote, onsite, hybrid
- Status: approved

#### Suspicious/Scam Internships (13)
- Realistic scam patterns for AI testing
- Inflated salary ranges ($8,000 - $15,000/month)
- Low AI analysis scores (10-40)
- Suspicious descriptions with red flags
- Status: pending (flagged for review)

### Applications (126 total)

#### Application Distribution
- Each student applied to 3-8 internships
- Varied statuses: applied, under_review, shortlisted, rejected, accepted
- AI match scores: 40-98
- Matching skills analysis
- Missing skills identification
- Professional cover letters
- Resume text with skill highlights

## Demo Account Credentials

### Admin Accounts

Sign in with Google OAuth - no password required. These accounts can be used to:
- Review and approve/reject internships
- View platform analytics
- Manage flagged listings

**Admin 1**
- Name: Gabriel Thomas
- Email: gabriel.thomas@gmail.com

**Admin 2**
- Name: Evelyn Brown
- Email: evelyn.brown@protonmail.com

**Admin 3**
- Name: Harper Rivera
- Email: harper.rivera@icloud.com

### Student Accounts (Sample)

Any of the 25 student accounts can be used for testing:
- Sign in with Google OAuth
- Browse internships
- Apply to positions
- View application status
- Check AI match scores

### Company Accounts (Sample)

Any of the 12 company accounts can be used for testing:
- Sign in with Google OAuth
- Post new internships
- Review applications
- View candidate matches

## How to Rerun/Reset Seed Data

### Reset Database and Re-seed

```bash
npm run seed
```

This will:
1. Clear all existing data from Users, Internships, and Applications collections
2. Generate fresh realistic data
3. Display statistics and admin credentials

### Modify Data Volume

To change the amount of data generated, edit `scripts/seedDatabase.js`:

```javascript
// Line 237: Change student count
for (let i = 0; i < 25; i++) { // Change 25 to desired count

// Line 255: Change company count
for (let i = 0; i < 12; i++) { // Change 12 to desired count

// Line 275: Change admin count
for (let i = 0; i < 3; i++) { // Change 3 to desired count

// Line 301: Change internship count
for (let i = 0; i < 45; i++) { // Change 45 to desired count

// Line 357: Change application count per student
const applicationCount = randomInt(3, 8); // Change 3-8 to desired range
```

## Dashboard Analytics Data

The seeded data provides meaningful analytics:

### Platform Statistics
- **Total Users**: 40
- **Total Internships**: 45
- **Total Applications**: 126
- **Verification Rate**: 71% (32/45 verified)
- **Scam Detection Rate**: 29% (13/45 flagged)

### Application Funnel
- Applied → Under Review → Shortlisted → Accepted/Rejected
- Realistic distribution across all stages
- AI match scores distributed from 40-98

### Fraud Detection Metrics
- 13 suspicious internships flagged for review
- AI confidence scores for legitimate listings: 75-95
- AI confidence scores for scam listings: 10-40
- Multiple scam patterns represented (payment requests, unrealistic salaries, etc.)

## Data Quality Features

### Realistic Patterns
- No placeholder/lorem ipsum text
- Professional email formats
- Realistic company names
- Industry-standard job titles
- Appropriate salary ranges
- Genuine-sounding descriptions

### Valid Relationships
- Applications linked to existing internships
- Internships posted by company users
- Admin reviews linked to admin users
- Proper foreign key relationships maintained

### AI Analysis Simulation
- Pre-generated fraud detection reports
- Confidence scores with explanations
- Risk reasons for flagged listings
- Resume matching with skill analysis

## Testing Scenarios

### For Recruiters/Interview Showcase
1. Sign in as a company account
2. Browse existing internships
3. Post a new internship with AI verification
4. Review applications with AI match scores
5. See how AI analyzes job descriptions

### For Students
1. Sign in as a student account
2. Browse verified internships
3. Apply to positions
4. View AI match scores on applications
5. Check application status updates

### For Admins
1. Sign in as an admin account
2. Review flagged internships (13 pending)
3. Approve legitimate listings
4. Reject scam listings
5. View platform analytics

### For AI Testing
1. View verified internships with high AI scores (75-95)
2. View suspicious internships with low AI scores (10-40)
3. Compare descriptions and patterns
4. Test prompt injection prevention
5. Verify fraud detection accuracy

## Technical Details

### Seed Script Location
`scripts/seedDatabase.js`

### Dependencies
- mongoose (for MongoDB operations)
- dotenv (for environment variables)
- ES6 modules (import/export)

### Model Compatibility
- User model: name, email, image, role
- Internship model: title, company, companyEmail, location, type, description, requirements, skills, duration, stipend, applicationDeadline, aiVerification, adminApproval, postedBy
- Application model: internship, student, resumeUrl, resumeText, coverLetter, aiMatch, status

### Data Generation
- Random selection from curated arrays (names, companies, skills, locations)
- Context-aware generation (scam vs legitimate descriptions)
- Realistic email generation
- AI analysis simulation based on legitimacy
- Skill matching with overlap detection

## Notes

- All data is generated deterministically using random selection from curated arrays
- Running the seed script multiple times will produce different data each time
- The script clears existing data before seeding
- Admin credentials are displayed after each seed run
- Use Google OAuth for sign-in (no passwords required)
