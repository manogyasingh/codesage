import React, { useState, useEffect } from 'react';
import { useProblems } from '../hooks/useProblems';
import { useAuth } from '../contexts/AuthContext';
import { problemsService } from '../services/problems';
import { Problem, TestCase } from '../types';

const ProblemsManagement: React.FC = () => {
  const { user, getCompanyId } = useAuth();
  const { 
    problems, 
    loading, 
    error, 
    fetchProblems, 
    createProblem, 
    deleteProblem,
    searchProblems 
  } = useProblems();

  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Problem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loadingTestCases, setLoadingTestCases] = useState(false);

  // Fetch statistics when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await problemsService.getProblemsStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, problems]);

  // Fetch test cases when a problem is selected
  const handleProblemSelect = async (problem: Problem) => {
    setSelectedProblem(problem);
    setLoadingTestCases(true);
    
    try {
      // Fetch both visible and hidden test cases (for demonstration)
      const visibleTestCases = await problemsService.getTestCases(problem.id, false);
      const allTestCases = await problemsService.getTestCases(problem.id, true);
      
      console.log(`Problem "${problem.title}" - Company: ${problem.company_id}`);
      console.log(`Visible test cases: ${visibleTestCases.length}`);
      console.log(`Total test cases: ${allTestCases.length}`);
      
      setTestCases(allTestCases);
    } catch (error) {
      console.error('Failed to fetch test cases:', error);
    } finally {
      setLoadingTestCases(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchProblems(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // Handle problem creation (simplified for demo)
  const handleCreateSampleProblem = async () => {
    try {
      await createProblem({
        title: 'Sample Problem',
        description: 'A sample problem for testing company-specific filtering',
        difficulty: 'easy',
        category: 'algorithms',
        tags: ['sample', 'test'],
        programming_languages: ['python', 'javascript'],
        time_limit_minutes: 30,
        starter_code: [
          {
            language: 'python',
            code: 'def solution():\n    pass'
          }
        ],
        test_cases: [
          {
            id: '1',
            input: { value: 1 },
            expected_output: 2,
            is_hidden: false
          }
        ]
      });
      
      console.log('Sample problem created for company:', getCompanyId());
    } catch (error) {
      console.error('Failed to create sample problem:', error);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Problems Management</h2>
        <p className="text-gray-600">Please log in to view company-specific problems.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Problems Management</h2>
        <p className="text-gray-600">
          Company: <span className="font-semibold">{getCompanyId()}</span> | 
          User: <span className="font-semibold">{user.email}</span>
        </p>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800">Total Problems</h3>
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800">Active</h3>
            <p className="text-2xl font-bold text-green-900">{stats.active}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800">Easy</h3>
            <p className="text-2xl font-bold text-yellow-900">{stats.byDifficulty.easy || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="font-semibold text-red-800">Hard</h3>
            <p className="text-2xl font-bold text-red-900">{stats.byDifficulty.hard || 0}</p>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Search problems..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Search
          </button>
          <button
            onClick={handleCreateSampleProblem}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Create Sample
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Search Results ({searchResults.length})</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map(problem => (
                <div
                  key={problem.id}
                  className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => handleProblemSelect(problem)}
                >
                  <span className="font-medium">{problem.title}</span>
                  <span className="ml-2 text-sm text-gray-500">({problem.difficulty})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problems List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Company Problems</h3>
            <button
              onClick={fetchProblems}
              disabled={loading}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Error: {error}
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {problems.length === 0 ? (
              <p className="text-gray-500 italic">
                No problems found for this company. Create some problems to get started.
              </p>
            ) : (
              problems.map(problem => (
                <div
                  key={problem.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedProblem?.id === problem.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleProblemSelect(problem)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{problem.title}</h4>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProblem(problem.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{problem.category}</p>
                  <p className="text-sm text-gray-500 truncate">{problem.description}</p>
                  <div className="text-xs text-gray-400 mt-2">
                    Languages: {problem.programming_languages.join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Problem Details */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Problem Details</h3>
          
          {selectedProblem ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{selectedProblem.title}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  Company ID: {selectedProblem.company_id}
                </p>
                <p className="text-sm mb-3">{selectedProblem.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Difficulty:</span> {selectedProblem.difficulty}
                  </div>
                  <div>
                    <span className="font-medium">Category:</span> {selectedProblem.category}
                  </div>
                  <div>
                    <span className="font-medium">Time Limit:</span> {selectedProblem.time_limit_minutes}m
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {selectedProblem.usage_count}
                  </div>
                </div>

                {selectedProblem.tags.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProblem.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Test Cases */}
              <div className="p-4 border rounded-lg">
                <h5 className="font-semibold mb-3">
                  Test Cases {loadingTestCases && <span className="text-sm font-normal">(Loading...)</span>}
                </h5>
                
                {testCases.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {testCases.map(testCase => (
                      <div
                        key={testCase.id}
                        className={`p-3 rounded text-sm ${
                          testCase.is_hidden ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Test Case {testCase.id}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            testCase.is_hidden ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {testCase.is_hidden ? 'Hidden' : 'Visible'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div><span className="font-medium">Input:</span> {JSON.stringify(testCase.input)}</div>
                          <div><span className="font-medium">Expected:</span> {JSON.stringify(testCase.expected_output)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No test cases available</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">Select a problem to view details and test cases</p>
          )}
        </div>
      </div>

      {/* Company Info Footer */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Company-Specific Data</h4>
        <p className="text-sm text-gray-600">
          This component demonstrates how problems and test cases are automatically filtered by company_id.
          Only problems belonging to company "{getCompanyId()}" are displayed.
          The backend API ensures data isolation between different companies.
        </p>
      </div>
    </div>
  );
};

export default ProblemsManagement;
