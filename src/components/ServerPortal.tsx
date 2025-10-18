import { useState, useEffect } from 'react';
import { UsersIcon, CodeIcon, SettingsIcon, PlayIcon, ClockIcon } from './Icons';

interface ServerPortalProps {
  onBackToLanding: () => void;
}

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  tags: string[];
  testCases: number;
  isActive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'offline' | 'in-interview';
  lastSeen: string;
  currentProblem?: string;
}

interface InterviewSession {
  id: string;
  candidateName: string;
  problemTitle: string;
  startTime: string;
  duration: number; // in minutes
  status: 'active' | 'completed' | 'scheduled';
  progress: number; // percentage
}

export function ServerPortal({ onBackToLanding }: ServerPortalProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'problems' | 'users' | 'sessions'>('dashboard');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  // const [showCreateProblem] = useState(false);

  useEffect(() => {
    // Mock data
    setProblems([
      {
        id: 'prob-001',
        title: 'E-commerce Cart Logic',
        difficulty: 'Easy',
        description: 'Implement a shopping cart system with add, remove, and calculate total functionality for our e-commerce platform.',
        tags: ['JavaScript', 'Business Logic', 'Frontend'],
        testCases: 6,
        isActive: true
      },
      {
        id: 'prob-002',
        title: 'API Rate Limiter',
        difficulty: 'Medium',
        description: 'Design and implement a rate limiting system for our company API endpoints to prevent abuse.',
        tags: ['System Design', 'Backend', 'Security'],
        testCases: 10,
        isActive: true
      },
      {
        id: 'prob-003',
        title: 'Database Query Optimization',
        difficulty: 'Hard',
        description: 'Optimize complex SQL queries for our user analytics dashboard to improve performance.',
        tags: ['SQL', 'Database', 'Performance'],
        testCases: 8,
        isActive: false
      },
      {
        id: 'prob-004',
        title: 'React Component Architecture',
        difficulty: 'Medium',
        description: 'Design a reusable component system for our company design system and UI library.',
        tags: ['React', 'TypeScript', 'Component Design'],
        testCases: 7,
        isActive: true
      }
    ]);

    setUsers([
      {
        id: 'user-001',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        status: 'in-interview',
        lastSeen: '2 minutes ago',
        currentProblem: 'E-commerce Cart Logic'
      },
      {
        id: 'user-002',
        name: 'Michael Chen',
        email: 'michael.chen@company.com',
        status: 'online',
        lastSeen: 'Just now'
      },
      {
        id: 'user-003',
        name: 'Emma Rodriguez',
        email: 'emma.rodriguez@company.com',
        status: 'offline',
        lastSeen: '1 hour ago'
      },
      {
        id: 'user-004',
        name: 'David Kim',
        email: 'david.kim@company.com',
        status: 'online',
        lastSeen: '5 minutes ago'
      },
      {
        id: 'user-005',
        name: 'Lisa Thompson',
        email: 'lisa.thompson@company.com',
        status: 'in-interview',
        lastSeen: '10 minutes ago',
        currentProblem: 'API Rate Limiter'
      }
    ]);

    setSessions([
      {
        id: 'session-001',
        candidateName: 'Sarah Wilson',
        problemTitle: 'E-commerce Cart Logic',
        startTime: '10:30 AM',
        duration: 35,
        status: 'active',
        progress: 75
      },
      {
        id: 'session-002',
        candidateName: 'Lisa Thompson',
        problemTitle: 'API Rate Limiter',
        startTime: '11:15 AM',
        duration: 28,
        status: 'active',
        progress: 45
      },
      {
        id: 'session-003',
        candidateName: 'Alex Martinez',
        problemTitle: 'React Component Architecture',
        startTime: '2:00 PM',
        duration: 0,
        status: 'scheduled',
        progress: 0
      },
      {
        id: 'session-004',
        candidateName: 'Jennifer Park',
        problemTitle: 'Database Query Optimization',
        startTime: '9:45 AM',
        duration: 60,
        status: 'completed',
        progress: 100
      }
    ]);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.filter(s => s.status === 'active').length}</p>
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
              <p className="text-sm text-gray-600">Active Employees</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status !== 'offline').length}</p>
            </div>
            <UsersIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled Today</p>
              <p className="text-2xl font-bold text-gray-900">{sessions.filter(s => s.status === 'scheduled').length}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Live Interview Sessions</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {sessions.filter(s => s.status === 'active').map((session) => (
            <div key={session.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900">{session.candidateName}</p>
                  <p className="text-sm text-gray-600">{session.problemTitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Duration: {session.duration}m</p>
                  <p className="text-sm text-gray-600">Progress: {session.progress}%</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Monitor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProblems = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Company Problem Library</h2>
        <button
          onClick={() => console.log('Create problem clicked')}
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
                {problem.isActive && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                <button className="text-gray-600 hover:text-gray-800">Duplicate</button>
                <button className={`${problem.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                  {problem.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4">{problem.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Tags: {problem.tags.join(', ')}
                </span>
                <span className="text-sm text-gray-600">
                  {problem.testCases} test cases
                </span>
              </div>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-600">
            <div>Name</div>
            <div>Email</div>
            <div>Status</div>
            <div>Last Seen</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    user.status === 'online' ? 'bg-green-500' :
                    user.status === 'in-interview' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`}></div>
                  <span className="font-medium text-gray-900">{user.name}</span>
                </div>
                
                <span className="text-gray-600">{user.email}</span>
                
                <div className="flex flex-col">
                  <span className={`font-medium ${getStatusColor(user.status)}`}>
                    {user.status === 'in-interview' ? 'In Interview' : 
                     user.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                  {user.currentProblem && (
                    <span className="text-xs text-gray-500">Solving: {user.currentProblem}</span>
                  )}
                </div>
                
                <span className="text-gray-600">{user.lastSeen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Interview Sessions</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Schedule Interview
        </button>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => (
          <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${
                  session.status === 'active' ? 'bg-green-500 animate-pulse' :
                  session.status === 'scheduled' ? 'bg-blue-500' :
                  'bg-gray-300'
                }`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{session.candidateName}</h3>
                  <p className="text-sm text-gray-600">{session.problemTitle}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Start: {session.startTime}</p>
                  <p className="text-sm text-gray-600">Duration: {session.duration}m</p>
                </div>
                
                {session.status === 'active' && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Progress</p>
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${session.progress}%` }}
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
        ))}
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
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-xl p-1 mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: SettingsIcon },
            { id: 'problems', label: 'Problems', icon: CodeIcon },
            { id: 'users', label: 'Users', icon: UsersIcon },
            { id: 'sessions', label: 'Sessions', icon: ClockIcon }
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
        </div>
      </div>
    </div>
  );
}