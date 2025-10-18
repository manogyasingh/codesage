// Core interview session types
export interface InterviewSession {
  id: string;
  candidateId: string;
  interviewerId?: string;
  problemId: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  startTime: string;
  endTime?: string;
  duration?: number;
  currentCode: string;
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'typescript';
  createdAt: string;
  updatedAt: string;
}

// Candidate information
export interface Candidate {
  id: string;
  name: string;
  email: string;
  experience: 'junior' | 'mid' | 'senior' | 'lead';
  skills: string[];
  resumeUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  createdAt: string;
}

// Interview problems
export interface StarterCode {
  language: string;
  code: string;
}

export interface TestCase {
  id: string;
  input: any;
  expected_output: any;
  is_hidden: boolean;
  explanation?: string;
}

export interface Solution {
  language: string;
  code: string;
  explanation?: string;
  time_complexity?: string;
  space_complexity?: string;
}

export interface Problem {
  id: string;
  company_id: string;
  creator_id?: string;
  created_by: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'arrays' | 'strings' | 'trees' | 'graphs' | 'dp' | 'system-design' | 'algorithms' | 'data-structures';
  tags: string[];
  programming_languages: string[];
  time_limit_minutes: number;
  memory_limit_mb?: number;
  starter_code: StarterCode[];
  test_cases?: string;  // Now only varchar format
  solution?: Solution | Solution[] | any;  // Support single solution, array, or flexible format
  hints?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
  average_completion_time?: number;
  success_rate?: number;
}

export interface ProblemCreate {
  company_id: string;
  created_by: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'arrays' | 'strings' | 'trees' | 'graphs' | 'dp' | 'system-design' | 'algorithms' | 'data-structures';
  tags?: string[];
  programming_languages?: string[];
  time_limit_minutes?: number;
  memory_limit_mb?: number;
  starter_code?: StarterCode[];
  test_cases?: string;  // Now only varchar format
  solution?: Solution | Solution[];
  hints?: string[];
  is_active?: boolean;
}

export interface ProblemUpdate {
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: 'arrays' | 'strings' | 'trees' | 'graphs' | 'dp' | 'system-design' | 'algorithms' | 'data-structures';
  tags?: string[];
  programming_languages?: string[];
  time_limit_minutes?: number;
  memory_limit_mb?: number;
  starter_code?: StarterCode[];
  test_cases?: string;  // Now only varchar format
  solution?: Solution;
  hints?: string[];
  is_active?: boolean;
}

// User information
export interface User {
  id: string;
  email: string;
  company_id: string;
  role: string;
  name?: string;
}

// Authentication responses
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Login and registration requests
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCompanyRequest {
  email: string;
  password: string;
  company_name: string;
  name?: string;
}

export interface RegisterCandidateRequest {
  email: string;
  password: string;
  name?: string;
}

// Real-time code analysis results
export interface CodeAnalysis {
  id: string;
  sessionId: string;
  timestamp: string;
  code: string;
  language: string;
  syntaxErrors: SyntaxError[];
  executionResult?: ExecutionResult;
  qualityMetrics: QualityMetrics;
  complexityAnalysis: ComplexityAnalysis;
  suggestions: string[];
}

// Code execution results
export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number; // milliseconds
  memoryUsage: number; // bytes
  testResults: TestResult[];
  logs?: string[]; // Execution logs for debugging and monitoring
}

// Individual test case results
export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput?: any;
  executionTime: number;
  error?: string;
}

// Code quality assessment
export interface QualityMetrics {
  readabilityScore: number; // 0-100
  maintainabilityScore: number; // 0-100
  styleScore: number; // 0-100
  codeSmells: CodeSmell[];
  bestPractices: BestPractice[];
  duplications: number;
  complexity: number;
}

// Code complexity analysis
export interface ComplexityAnalysis {
  timeComplexity: string; // e.g., "O(n log n)"
  spaceComplexity: string; // e.g., "O(n)"
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  linesOfCode: number;
  functions: number;
}

// Code quality issues
export interface CodeSmell {
  type: string;
  severity: 'low' | 'medium' | 'high';
  line: number;
  column: number;
  message: string;
  suggestion?: string;
}

export interface BestPractice {
  category: string;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
  examples?: string[];
}

// AI interviewer responses
export interface InterviewerMessage {
  id: string;
  sessionId: string;
  type: 'question' | 'hint' | 'feedback' | 'encouragement' | 'clarification';
  content: string;
  timestamp: string;
  audioUrl?: string;
  context: {
    triggeredBy: string;
    candidateCode: string;
    analysisResults: Partial<CodeAnalysis>;
  };
}

// Voice interaction
export interface VoiceInteraction {
  id: string;
  sessionId: string;
  speaker: 'candidate' | 'interviewer';
  transcript: string;
  confidence: number;
  timestamp: string;
  audioUrl: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}

// Session performance metrics
export interface SessionMetrics {
  sessionId: string;
  totalTime: number;
  codingTime: number;
  thinkingTime: number;
  hintsUsed: number;
  errorsEncountered: number;
  testsPassed: number;
  totalTests: number;
  finalScore: number;
  codeQualityScore: number;
  communicationScore: number;
  problemSolvingScore: number;
}

// Comprehensive interview report
export interface InterviewReport {
  sessionId: string;
  candidate: Candidate;
  problem: Problem;
  session: InterviewSession;
  metrics: SessionMetrics;
  codeEvolution: CodeAnalysis[];
  aiInteractions: InterviewerMessage[];
  voiceInteractions: VoiceInteraction[];
  finalAssessment: {
    overallRating: 'strong-hire' | 'hire' | 'no-hire' | 'strong-no-hire';
    technicalSkills: SkillAssessment[];
    softSkills: SkillAssessment[];
    strengths: string[];
    improvements: string[];
    recommendation: string;
    confidence: number;
  };
  generatedAt: string;
}

// Skill assessment
export interface SkillAssessment {
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  evidence: string[];
  score: number; // 0-100
}

// Dashboard analytics
export interface DashboardMetrics {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  averageSessionTime: number;
  averageScore: number;
  topPerformers: Candidate[];
  recentSessions: InterviewSession[];
  languageDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  successRate: number;
}

// WebSocket event types
export type WebSocketEventType = 
  | 'session-start'
  | 'session-end'
  | 'code-update'
  | 'code-execute'
  | 'hint-request'
  | 'voice-message'
  | 'interviewer-message'
  | 'analysis-complete'
  | 'session-metrics-update';

export interface WebSocketEvent {
  type: WebSocketEventType;
  sessionId: string;
  timestamp: string;
  data: any;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

// UI component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Theme and styling
export type ThemeColor = 
  | 'primary' 
  | 'secondary' 
  | 'accent' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'neutral';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'solid' | 'outline' | 'ghost' | 'link';
