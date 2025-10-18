import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from './Icons';
import { Problem } from '../types';

interface ProblemSelectorProps {
  problems: Problem[];
  currentProblem: Problem;
  onProblemChange: (problem: Problem) => void;
  isLoading?: boolean;
}

export const ProblemSelector: React.FC<ProblemSelectorProps> = ({
  problems,
  currentProblem,
  onProblemChange,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleProblemSelect = (problem: Problem) => {
    if (problem.id !== currentProblem.id) {
      onProblemChange(problem);
    }
    setIsOpen(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="relative">
      <div className="mb-2 text-sm font-medium text-gray-700">
        Available Problems ({problems.length})
      </div>
      
      {/* Current Problem Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center space-x-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(currentProblem.difficulty)}`}>
            {currentProblem.difficulty}
          </span>
          <span className="font-medium text-gray-900 truncate">
            {currentProblem.title}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
          {isOpen ? (
            <ChevronUpIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {problems.map((problem) => (
            <button
              key={problem.id}
              onClick={() => handleProblemSelect(problem)}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
                <div className="text-left">
                  <div className="font-medium text-gray-900 truncate">
                    {problem.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {problem.category} • {problem.time_limit_minutes}min
                  </div>
                </div>
              </div>
              {problem.id === currentProblem.id && (
                <CheckIcon className="h-4 w-4 text-green-600" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Problem Stats */}
      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
        <span>{currentProblem.category}</span>
        <span>•</span>
        <span>{currentProblem.time_limit_minutes} minutes</span>
        <span>•</span>
        <span>{currentProblem.test_cases ? 'Multiple' : 'No'} test cases</span>
      </div>
    </div>
  );
};
