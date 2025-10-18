import { useState, useEffect } from 'react';
import { UsersIcon, CodeIcon, SettingsIcon, PlayIcon, ClockIcon, CheckCircleIcon } from './Icons';
import { CreateProblemModal } from './CreateProblemModal';
import { problemsService, ProblemData } from '../services/problems';
import { usersService, CompanyUser } from '../services/users';
import { candidatesService, Candidate } from '../services/candidates';
import { interviewsService, InterviewSession as APIInterviewSession } from '../services/interviews';
import { useAuth } from '../contexts/AuthContext';

interface CompanyPortalProps {
  onBackToLanding: () => void;
  onLogout?: () => void;
}

// Use the ProblemData interface from the service
// interface Problem will be replaced with ProblemData

// Enhanced User interface based on CompanyUser with additional UI fields
interface User extends Omit<CompanyUser, 'first_name' | 'last_name'> {
  name: string; // Computed from first_name + last_name
  status: 'online' | 'offline' | 'in-interview';
  lastSeen: string;
  currentProblem?: string;
}

export function CompanyPortal({ onBackToLanding, onLogout }: CompanyPortalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'problems' | 'users' | 'sessions' | 'summaries'>('dashboard');
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<APIInterviewSession[]>([]);
  const [interviewSummaries, setInterviewSummaries] = useState<APIInterviewSession[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);

  // Transform CompanyUser to UI User format
  const transformCompanyUserToUser = (companyUser: CompanyUser): User => {
    return {
      ...companyUser,
      name: `${companyUser.first_name} ${companyUser.last_name}`.trim(),
      status: companyUser.is_active ? 'online' : 'offline', // This would be enhanced with real-time data
      lastSeen: 'Just now', // This would come from real-time tracking
      currentProblem: undefined, // This would come from active session data
    };
  };

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const companyUsers = await usersService.getCompanyUsers();
      const transformedUsers = companyUsers.map(transformCompanyUserToUser);
      setUsers(transformedUsers);
      console.log('Loaded company users:', transformedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Set empty array on error - no fallback users
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load candidates from API
  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      console.log('🔄 Starting to load candidates...');
      const allCandidates = await candidatesService.getAllCandidates();
      console.log('✅ Candidates API response:', allCandidates);
      console.log('📊 Number of candidates:', allCandidates.length);
      setCandidates(allCandidates);
      
      if (allCandidates.length > 0) {
        console.log('👥 First candidate:', allCandidates[0]);
      } else {
        console.log('⚠️ No candidates returned from API');
      }
    } catch (error) {
      console.error('❌ Failed to load candidates:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      setCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Load interview sessions from API
  const loadInterviewSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessions = await interviewsService.getCompanyInterviewSessions();
      setInterviewSessions(sessions);
      console.log('Loaded interview sessions:', sessions);
      
      // We now use the raw interview sessions directly
    } catch (error) {
      console.error('Failed to load interview sessions:', error);
      setInterviewSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Load interview summaries from API
  const loadInterviewSummaries = async () => {
    try {
      setLoadingSummaries(true);
      const summaries = await interviewsService.getCompanyInterviewSummaries();
      setInterviewSummaries(summaries);
      console.log('Loaded interview summaries:', summaries);
    } catch (error) {
      console.error('Failed to load interview summaries:', error);
      setInterviewSummaries([]);
    } finally {
      setLoadingSummaries(false);
    }
  };

  // Load problems from API
  const loadProblems = async () => {
    try {
      setLoading(true);
      const problemsData = await problemsService.getProblems();
      setProblems(problemsData);
    } catch (error) {
      console.error('Failed to load problems:', error);
      // Fallback to mock data if API fails
      setProblems([
        {
          id: 'prob-001',
          company_id: 'company-001',
          created_by: 'user-admin-001',
          title: 'E-commerce Cart Logic',
          difficulty: 'easy',
          description: 'Implement a shopping cart system with add, remove, and calculate total functionality for our e-commerce platform.',
          category: 'Frontend',
          tags: ['JavaScript', 'Business Logic', 'Frontend'],
          programming_languages: ['JavaScript', 'TypeScript'],
          time_limit_minutes: 60,
          starter_code: [],
          test_cases: [
            { id: 'test1', input: '[1, 2, 3]', expected_output: '6', is_hidden: false },
            { id: 'test2', input: '[4, 5, 6]', expected_output: '15', is_hidden: false },
          ],
          is_active: true,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'prob-002',
          company_id: 'company-001',
          created_by: 'user-admin-001',
          title: 'API Rate Limiter',
          difficulty: 'medium',
          description: 'Design and implement a rate limiting system for our company API endpoints to prevent abuse.',
          category: 'Backend',
          tags: ['System Design', 'Backend', 'Security'],
          programming_languages: ['Python', 'Java', 'Go'],
          time_limit_minutes: 90,
          starter_code: [],
          test_cases: [
            { id: 'test1', input: '100', expected_output: 'true', is_hidden: false },
          ],
          is_active: true,
          usage_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('Current authenticated user:', user);
      console.log('User company ID:', user.companyId);
      console.log('User ID:', user.id);
      loadProblems();
      loadUsers();
      loadCandidates();
      loadInterviewSessions();
      loadInterviewSummaries();
    }
  }, [user]);

  // Sessions are now loaded from API in loadInterviewSessions function

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'in-interview': return 'text-blue-600';
      case 'offline': return 'text-gray-600';
      case 'active': return 'text-green-600';
      case 'completed': return 'text-gray-600';
      case 'scheduled': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-sm">Loading problems...</p>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{interviewSessions.filter(s => s.status === 'active').length}</p>
            </div>
            <PlayIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Company Problems</p>
              <p className="text-2xl font-bold text-gray-900">{problems.length}</p>
            </div>
            <CodeIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.is_active).length}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {loadingSessions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-sm">Loading interview sessions...</p>
        </div>
      )}

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Live Interview Sessions</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {interviewSessions.filter(s => s.status === 'active').length === 0 && !loadingSessions ? (
            <div className="p-6 text-center text-gray-500">
              No active interview sessions at the moment.
            </div>
          ) : (
            interviewSessions.filter(s => s.status === 'active').map((session) => (
              <div key={session.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.candidate ? `${session.candidate.first_name} ${session.candidate.last_name}` : 'Unknown Candidate'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {session.problem?.title || 'Unknown Problem'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Started: {new Date(session.started_at || session.scheduled_at).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: {session.duration_minutes || 0}m
                    </p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Monitor
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderProblems = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Company Problem Library</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Custom Problem
        </button>
      </div>

      <div className="grid gap-4">
        {problems.map((problem) => (
          <div key={problem.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">{problem.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                {problem.is_active && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                <button className="text-gray-600 hover:text-gray-800">Duplicate</button>
                <button className={`${problem.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                  {problem.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{problem.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Tags: {problem.tags.join(', ')}</span>
              </div>
              <span className="text-sm text-gray-600">{problem.test_cases.length} test cases</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Company Users</h2>
        <button
          onClick={() => console.log('Invite user clicked')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Invite New User
        </button>
      </div>

      {loadingUsers && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-sm">Loading users...</p>
        </div>
      )}

      {/* Employees Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Company Team Members</h3>
        </div>
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-600">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Status</div>
            <div>Permissions</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {users.length === 0 && !loadingUsers ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No users found for this company.
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="px-6 py-4">
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      user.status === 'online' ? 'bg-green-500' :
                      user.status === 'in-interview' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}></div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                  
                  <span className="text-gray-600">{user.email}</span>
                  
                  <span className="text-sm text-gray-600 capitalize">
                    {user.role}
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(user.status)}`}>
                      {user.is_active ? (user.status === 'in-interview' ? 'In Interview' : 'Active') : 'Inactive'}
                    </span>
                    {user.currentProblem && (
                      <span className="text-xs text-blue-600">• {user.currentProblem}</span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.can_manage_users && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Admin</span>
                      )}
                      {user.permissions.can_create_problems && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Create</span>
                      )}
                      {user.permissions.can_conduct_interviews && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Interview</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Candidates Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Interview Candidates</h3>
        </div>
        
        {loadingCandidates && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <p className="text-blue-600 text-sm">Loading candidates...</p>
          </div>
        )}
        
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-600">
            <div>Name</div>
            <div>Email</div>
            <div>Experience</div>
            <div>Status</div>
            <div>Location</div>
            <div>Skills</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {candidates.length === 0 && !loadingCandidates ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No candidates found.
            </div>
          ) : (
            candidates.map((candidate) => (
              <div key={candidate.id} className="px-6 py-4">
                <div className="grid grid-cols-6 gap-4 items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      candidate.availability_status === 'available' ? 'bg-green-500' :
                      candidate.availability_status === 'interviewing' ? 'bg-blue-500' :
                      'bg-gray-300'
                    }`}></div>
                    <span className="font-medium text-gray-900">
                      {candidate.first_name} {candidate.last_name}
                    </span>
                  </div>
                  
                  <span className="text-gray-600">{candidate.email}</span>
                  
                  <span className="text-sm text-gray-600 capitalize">
                    {candidate.experience_level}
                  </span>
                  
                  <span className={`text-sm font-medium ${
                    candidate.availability_status === 'available' ? 'text-green-600' :
                    candidate.availability_status === 'interviewing' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {candidate.availability_status}
                  </span>
                  
                  <span className="text-sm text-gray-600">{candidate.location}</span>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{candidate.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Interview Sessions</h2>

      {loadingSessions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-sm">Loading sessions...</p>
        </div>
      )}

      <div className="grid gap-4">
        {interviewSessions.length === 0 && !loadingSessions ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            No interview sessions scheduled.
          </div>
        ) : (
          interviewSessions.map((session) => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${
                    session.status === 'active' ? 'bg-green-500 animate-pulse' :
                    session.status === 'scheduled' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}></div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {session.candidate ? `${session.candidate.first_name} ${session.candidate.last_name}` : 'Unknown Candidate'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.problem?.title || 'Unknown Problem'}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Scheduled: {new Date(session.scheduled_at).toLocaleString()}</p>
                    {session.started_at && (
                      <p>Started: {new Date(session.started_at).toLocaleString()}</p>
                    )}
                    {session.duration_minutes && (
                      <p>Duration: {session.duration_minutes}m</p>
                    )}
                  </div>
                  
                  {session.status === 'active' && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">In Progress</p>
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all animate-pulse"
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {session.status === 'active' ? (
                      <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        Monitor
                      </button>
                    ) : session.status === 'scheduled' ? (
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        Start
                      </button>
                    ) : (
                      <button className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">
                        View Results
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSummaries = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Interview Analysis Reports</h2>

      {loadingSummaries && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-600 text-sm">Loading interview reports...</p>
        </div>
      )}

      <div className="grid gap-6">
        {interviewSummaries.length === 0 && !loadingSummaries ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
            No completed interviews with analysis results yet.
          </div>
        ) : (
          interviewSummaries.map((summary) => (
            <div key={summary.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {summary.candidate?.first_name} {summary.candidate?.last_name}
                    </h3>
                    <p className="text-gray-600">{summary.candidate?.email}</p>
                    <p className="text-sm text-gray-500">
                      {summary.problem?.title} • {summary.ended_at ? new Date(summary.ended_at).toLocaleDateString() : 'No end date'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </div>
                  {summary.duration_minutes && (
                    <p className="text-sm text-gray-500 mt-1">{summary.duration_minutes} minutes</p>
                  )}
                </div>
              </div>

              {/* Analysis Summary */}
              {summary.ai_analysis && (
                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Rating */}
                    {summary.ai_metrics?.rating && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">Overall Rating</div>
                        <div className="text-2xl font-bold text-yellow-600">{summary.ai_metrics.rating}/10</div>
                      </div>
                    )}

                    {/* Technical Score */}
                    {summary.technical_score && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">Technical Score</div>
                        <div className="text-2xl font-bold text-blue-600">{summary.technical_score}/10</div>
                      </div>
                    )}

                    {/* Recommendation */}
                    {summary.overall_recommendation && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-gray-700">Recommendation</div>
                        <div className="text-sm font-semibold text-purple-600 capitalize">
                          {summary.overall_recommendation.replace(/-/g, ' ')}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {summary.ai_analysis.length > 300 
                        ? `${summary.ai_analysis.substring(0, 300)}...`
                        : summary.ai_analysis
                      }
                    </p>
                    <button className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Full Report →
                    </button>
                  </div>

                  {/* Metrics */}
                  {summary.ai_metrics && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.ai_metrics.fumbles || 0}</div>
                        <div className="text-xs text-gray-500">Fumbles</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.ai_metrics.total_interactions || 0}</div>
                        <div className="text-xs text-gray-500">Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.ai_metrics.slow_answers || 0}</div>
                        <div className="text-xs text-gray-500">Slow Answers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{summary.ai_metrics.notes_count || 0}</div>
                        <div className="text-xs text-gray-500">Notes</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToLanding}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Home
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Company Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <SettingsIcon className="w-4 h-4" />
                <span>Company Dashboard</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Debug Info - Remove in production */}
        {user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800 mb-2">Debug Info:</h3>
            <pre className="text-xs text-yellow-700">
              {JSON.stringify({
                userId: user.id,
                userEmail: user.email,
                companyId: user.companyId,
                companyName: user.companyName,
                role: user.role
              }, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: SettingsIcon },
            { id: 'problems', label: 'Problems', icon: CodeIcon },
            { id: 'users', label: 'Users', icon: UsersIcon },
            { id: 'sessions', label: 'Sessions', icon: ClockIcon },
            { id: 'summaries', label: 'Interview Reports', icon: CheckCircleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'problems' && renderProblems()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'sessions' && renderSessions()}
          {activeTab === 'summaries' && renderSummaries()}
        </div>
      </div>

      {/* Create Problem Modal */}
      {user && (
        <CreateProblemModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadProblems}
          companyId={user.companyId || ''}
          userId={user.id}
        />
      )}
    </div>
  );
}