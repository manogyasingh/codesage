import { CodeIcon, UsersIcon, SettingsIcon, ChevronRightIcon } from './Icons';

interface LandingPageProps {
  onSelectPortal: (portal: 'client' | 'company') => void;
}

export function LandingPage({ onSelectPortal }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CodeSage Interview Platform
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Choose your portal below</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CodeSage</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            A comprehensive interview platform that connects interviewers and candidates through 
            seamless code collaboration, real-time problem solving, and intelligent assessment tools.
          </p>
        </div>

        {/* Portal Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Client Portal */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                  <CodeIcon className="w-8 h-8 text-blue-600" />
                </div>
                <ChevronRightIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Candidate Portal</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Access your interview environment with live coding challenges, 
                real-time collaboration tools, and instant feedback systems.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Live problem solving environment
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Real-time code execution & testing
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  AI-powered coding assistance
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Collaborative whiteboard & notes
                </li>
              </ul>
              
              <button
                onClick={() => onSelectPortal('client')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform group-hover:scale-105"
              >
                Enter as Candidate
              </button>
            </div>
          </div>

          {/* Company Portal */}
          <div className="group relative overflow-hidden bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                  <UsersIcon className="w-8 h-8 text-purple-600" />
                </div>
                <ChevronRightIcon className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Company Portal</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage your company's interview process with comprehensive tools for 
                problem definition, user management, and interview analytics.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Custom problem library creation
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Employee & candidate management
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Interview session oversight
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  Company-wide analytics dashboard
                </li>
              </ul>
              
              <button
                onClick={() => onSelectPortal('company')}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 transform group-hover:scale-105"
              >
                Enter Company Portal
              </button>
            </div>
          </div>
        </div>



        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Built with modern technologies to provide the best interview experience for both candidates and interviewers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow">
              <CodeIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Monaco Editor</h4>
              <p className="text-sm text-gray-600">VS Code-powered editor with IntelliSense and syntax highlighting</p>
            </div>
            
            <div className="text-center p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow">
              <CodeIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Live Execution</h4>
              <p className="text-sm text-gray-600">Real-time code execution with multiple language support</p>
            </div>
            
            <div className="text-center p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow">
              <UsersIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Collaboration</h4>
              <p className="text-sm text-gray-600">Real-time collaboration between interviewers and candidates</p>
            </div>
            
            <div className="text-center p-6 border border-gray-100 rounded-xl hover:shadow-lg transition-shadow">
              <SettingsIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-900 mb-2">Analytics</h4>
              <p className="text-sm text-gray-600">Comprehensive analytics and performance tracking</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 CodeSage Interview Platform. Built with React, TypeScript, and Monaco Editor.</p>
        </div>
      </main>
    </div>
  );
}
