# Backend Structure Documentation

## Overview
This document defines the data models and API structure for the CodeSage interview platform, which connects companies with candidates for technical interviews.

## Core Entities

### 1. Company
Represents organizations that conduct interviews and manage coding problems.

```typescript
interface Company {
  id: string;                    // Unique identifier
  name: string;                  // Company name
  email: string;                 // Company contact email
  industry: string;              // Tech sector (e.g., "Fintech", "E-commerce")
  size: "startup" | "small" | "medium" | "large" | "enterprise";
  logo?: string;                 // Company logo URL
  website?: string;              // Company website
  description?: string;          // Company description
  subscription_plan: "free" | "basic" | "pro" | "enterprise";
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  settings: CompanySettings;
}

interface CompanySettings {
  max_concurrent_interviews: number;
  max_problems: number;
  max_candidates_per_month: number;
  allowed_programming_languages: string[];
  custom_branding: boolean;
  api_access: boolean;
}
```

### 2. User (Company Representatives)
People who work for companies and manage interviews.

```typescript
interface CompanyUser {
  id: string;
  company_id: string;           // Foreign key to Company
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "interviewer" | "hr" | "manager";
  permissions: UserPermissions;
  avatar?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

interface UserPermissions {
  can_create_problems: boolean;
  can_edit_problems: boolean;
  can_delete_problems: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_conduct_interviews: boolean;
  can_export_data: boolean;
}
```

### 3. Candidate
Individuals who take coding interviews.

```typescript
interface Candidate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  resume_url?: string;
  github_profile?: string;
  linkedin_profile?: string;
  portfolio_url?: string;
  experience_level: "entry" | "junior" | "mid" | "senior" | "lead" | "principal";
  preferred_languages: string[];
  current_company?: string;
  current_position?: string;
  location: string;
  availability_status: "available" | "interviewing" | "hired" | "not_available";
  created_at: Date;
  updated_at: Date;
  skills: CandidateSkill[];
}

interface CandidateSkill {
  skill_name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  years_of_experience: number;
}
```

### 4. Problem
Coding challenges created by companies.

```typescript
interface Problem {
  id: string;
  company_id: string;           // Foreign key to Company
  created_by: string;           // Foreign key to CompanyUser
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  category: string;             // e.g., "algorithms", "data-structures", "system-design"
  tags: string[];              // e.g., ["arrays", "sorting", "binary-search"]
  programming_languages: string[];
  time_limit_minutes: number;
  memory_limit_mb?: number;
  starter_code: StarterCode[];
  test_cases: TestCase[];
  solution?: Solution;
  hints?: string[];
  is_active: boolean;
  usage_count: number;          // How many times this problem was used
  average_completion_time?: number;
  success_rate?: number;        // Percentage of candidates who solved it
  created_at: Date;
  updated_at: Date;
}

interface StarterCode {
  language: string;
  code: string;
}

interface TestCase {
  id: string;
  input: any;                   // JSON serializable input
  expected_output: any;         // Expected result
  is_hidden: boolean;           // Whether candidate can see this test case
  explanation?: string;
}

interface Solution {
  language: string;
  code: string;
  explanation?: string;
  time_complexity?: string;
  space_complexity?: string;
}
```

### 5. Interview Session
A live coding session between company and candidate.

```typescript
interface InterviewSession {
  id: string;
  company_id: string;
  candidate_id: string;
  interviewer_id: string;       // CompanyUser conducting the interview
  problem_id: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  scheduled_at: Date;
  started_at?: Date;
  ended_at?: Date;
  duration_minutes?: number;
  candidate_code: CandidateCode[];
  interviewer_notes?: string;
  candidate_feedback?: string;
  interviewer_rating?: number;  // 1-5 scale
  technical_score?: number;     // 0-100 scale
  communication_score?: number; // 0-100 scale
  overall_recommendation: "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
  recording_url?: string;
  chat_transcript?: ChatMessage[];
  test_results?: TestResult[];
  created_at: Date;
  updated_at: Date;
}

interface CandidateCode {
  language: string;
  code: string;
  timestamp: Date;
  execution_result?: ExecutionResult;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  execution_time_ms: number;
  memory_used_mb: number;
  test_cases_passed: number;
  test_cases_total: number;
}

interface ChatMessage {
  id: string;
  sender_type: "interviewer" | "candidate";
  sender_id: string;
  message: string;
  timestamp: Date;
}

interface TestResult {
  test_case_id: string;
  passed: boolean;
  actual_output?: any;
  execution_time_ms: number;
  error_message?: string;
}
```

## API Endpoints Structure

### Authentication Endpoints
```
POST   /auth/login                    # Login for company users
POST   /auth/register/company         # Company registration
POST   /auth/register/candidate       # Candidate registration
POST   /auth/logout                   # Logout
POST   /auth/refresh                  # Refresh token
POST   /auth/forgot-password          # Forgot password
POST   /auth/reset-password           # Reset password
```

### Company Management
```
GET    /companies/profile             # Get company profile
PUT    /companies/profile             # Update company profile
GET    /companies/settings            # Get company settings
PUT    /companies/settings            # Update company settings
GET    /companies/analytics           # Get company analytics
GET    /companies/subscription        # Get subscription details
```

### User Management (Company Users)
```
GET    /users                         # List company users
POST   /users                         # Create new user
GET    /users/:id                     # Get user details
PUT    /users/:id                     # Update user
DELETE /users/:id                     # Delete user
PUT    /users/:id/permissions         # Update user permissions
PUT    /users/:id/status              # Activate/deactivate user
```

### Problem Management
```
GET    /problems                      # List company problems
POST   /problems                      # Create new problem
GET    /problems/:id                  # Get problem details
PUT    /problems/:id                  # Update problem
DELETE /problems/:id                  # Delete problem
POST   /problems/:id/test             # Test problem solution
GET    /problems/:id/analytics        # Get problem analytics
POST   /problems/:id/duplicate        # Duplicate problem
```

### Candidate Management
```
GET    /candidates                    # List candidates (for company)
GET    /candidates/:id                # Get candidate profile
PUT    /candidates/:id/notes          # Add interviewer notes
GET    /candidates/:id/history        # Get interview history
POST   /candidates/invite             # Invite candidate to interview
```

### Interview Session Management
```
GET    /interviews                    # List company's interviews
POST   /interviews                    # Schedule new interview
GET    /interviews/:id                # Get interview details
PUT    /interviews/:id                # Update interview
DELETE /interviews/:id               # Cancel interview
POST   /interviews/:id/start          # Start interview session
POST   /interviews/:id/end            # End interview session
GET    /interviews/:id/live           # Get live session data (WebSocket)
POST   /interviews/:id/code           # Submit code during interview
POST   /interviews/:id/execute        # Execute code during interview
POST   /interviews/:id/feedback       # Submit feedback
```

### Code Execution
```
POST   /execute                       # Execute code snippet
POST   /execute/test                  # Run code against test cases
GET    /execute/languages             # Get supported languages
```

### Analytics & Reporting
```
GET    /analytics/dashboard           # Company dashboard metrics
GET    /analytics/problems            # Problem performance analytics
GET    /analytics/interviews          # Interview analytics
GET    /analytics/candidates          # Candidate analytics
POST   /analytics/export              # Export analytics data
```

## Database Relationships

### Primary Relationships
- **Company** (1) → (many) **CompanyUser**
- **Company** (1) → (many) **Problem**
- **Company** (1) → (many) **InterviewSession**
- **CompanyUser** (1) → (many) **Problem** (created_by)
- **CompanyUser** (1) → (many) **InterviewSession** (interviewer)
- **Candidate** (1) → (many) **InterviewSession**
- **Problem** (1) → (many) **InterviewSession**

### Indexes for Performance
```sql
-- Companies
CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_subscription ON companies(subscription_plan);

-- Users
CREATE INDEX idx_users_company_id ON company_users(company_id);
CREATE INDEX idx_users_email ON company_users(email);
CREATE INDEX idx_users_role ON company_users(role);

-- Candidates
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_experience ON candidates(experience_level);
CREATE INDEX idx_candidates_availability ON candidates(availability_status);

-- Problems
CREATE INDEX idx_problems_company_id ON problems(company_id);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_active ON problems(is_active);

-- Interview Sessions
CREATE INDEX idx_sessions_company_id ON interview_sessions(company_id);
CREATE INDEX idx_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX idx_sessions_interviewer_id ON interview_sessions(interviewer_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);
CREATE INDEX idx_sessions_scheduled_at ON interview_sessions(scheduled_at);
```

## Security Considerations

### Authentication & Authorization
- JWT tokens for session management
- Role-based access control (RBAC)
- Company data isolation (multi-tenancy)
- API rate limiting per company
- Input validation and sanitization

### Data Privacy
- Encrypt sensitive data at rest
- Secure code execution sandbox
- Audit logs for all actions
- GDPR compliance for candidate data
- Data retention policies

### Code Execution Security
- Sandboxed execution environment
- Resource limits (CPU, memory, time)
- Network isolation
- Language-specific security measures
- Code injection prevention

## WebSocket Events (Real-time Features)

### Interview Session Events
```typescript
// Client to Server
interface ClientEvents {
  'join_interview': { session_id: string; user_type: 'interviewer' | 'candidate' };
  'code_change': { session_id: string; code: string; language: string };
  'execute_code': { session_id: string; code: string; language: string };
  'chat_message': { session_id: string; message: string };
  'cursor_position': { session_id: string; position: CursorPosition };
}

// Server to Client
interface ServerEvents {
  'user_joined': { user_id: string; user_type: string };
  'user_left': { user_id: string };
  'code_updated': { code: string; language: string; user_id: string };
  'execution_result': ExecutionResult;
  'chat_message': ChatMessage;
  'cursor_updated': { position: CursorPosition; user_id: string };
  'session_ended': { reason: string };
}
```

This structure provides a comprehensive foundation for building a scalable interview platform backend that supports multiple companies and candidates with secure, isolated data management.
