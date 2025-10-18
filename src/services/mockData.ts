import type { 
  InterviewSession, 
  Candidate, 
  Problem, 
  CodeAnalysis,
  InterviewerMessage,
  VoiceInteraction,
  InterviewReport 
} from '../types';

// Mock data generators for demo mode
export class MockDataGenerator {
  static generateMockSession(overrides: Partial<InterviewSession> = {}): InterviewSession {
    return {
      id: 'demo-session-' + Math.random().toString(36).substr(2, 9),
      candidateId: 'demo-candidate',
      interviewerId: 'demo-interviewer',
      problemId: 'demo-problem',
      status: 'active',
      startTime: new Date().toISOString(),
      currentCode: `# Welcome to the coding interview!
# Let's solve a classic problem: Two Sum

def two_sum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    # Your solution here
    pass

# Test cases
nums = [2, 7, 11, 15]
target = 9
print(two_sum(nums, target))  # Expected: [0, 1]`,
      language: 'python',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMockCandidate(overrides: Partial<Candidate> = {}): Candidate {
    return {
      id: 'demo-candidate',
      name: 'Alex Johnson',
      email: 'alex.johnson@email.com',
      experience: 'mid',
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript'],
      resumeUrl: 'https://example.com/resume.pdf',
      linkedinUrl: 'https://linkedin.com/in/alexjohnson',
      githubUrl: 'https://github.com/alexjohnson',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMockProblem(overrides: Partial<Problem> = {}): Problem {
    return {
      id: 'demo-problem',
      title: 'Two Sum',
      description: `
        <div>
          <h3>Problem Description</h3>
          <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
          
          <p>You may assume that each input would have exactly one solution, and you may not use the same element twice.</p>
          
          <p>You can return the answer in any order.</p>
          
          <h4>Constraints:</h4>
          <ul>
            <li>2 ≤ nums.length ≤ 10^4</li>
            <li>-10^9 ≤ nums[i] ≤ 10^9</li>
            <li>-10^9 ≤ target ≤ 10^9</li>
            <li>Only one valid answer exists.</li>
          </ul>
          
          <h4>Follow-up:</h4>
          <p>Can you come up with an algorithm that is less than O(n²) time complexity?</p>
        </div>
      `,
      difficulty: 'easy',
      category: 'arrays',
      timeLimit: 30,
      templateCode: {
        python: `def two_sum(nums, target):
    """
    Given an array of integers nums and an integer target,
    return indices of the two numbers such that they add up to target.
    """
    # Your solution here
    pass`,
        javascript: `function twoSum(nums, target) {
    /**
     * Given an array of integers nums and an integer target,
     * return indices of the two numbers such that they add up to target.
     */
    // Your solution here
}`,
        java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        /**
         * Given an array of integers nums and an integer target,
         * return indices of the two numbers such that they add up to target.
         */
        // Your solution here
        return new int[]{};
    }
}`,
        cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        /**
         * Given an array of integers nums and an integer target,
         * return indices of the two numbers such that they add up to target.
         */
        // Your solution here
        return {};
    }
};`,
        typescript: `function twoSum(nums: number[], target: number): number[] {
    /**
     * Given an array of integers nums and an integer target,
     * return indices of the two numbers such that they add up to target.
     */
    // Your solution here
    return [];
}`
      },
      testCases: [
        {
          id: 'tc1',
          input: { nums: [2, 7, 11, 15], target: 9 },
          expectedOutput: [0, 1],
          isHidden: false,
          timeoutMs: 1000
        },
        {
          id: 'tc2',
          input: { nums: [3, 2, 4], target: 6 },
          expectedOutput: [1, 2],
          isHidden: false,
          timeoutMs: 1000
        },
        {
          id: 'tc3',
          input: { nums: [3, 3], target: 6 },
          expectedOutput: [0, 1],
          isHidden: false,
          timeoutMs: 1000
        },
        {
          id: 'tc4',
          input: { nums: [1, 5, 3, 7, 2, 8], target: 10 },
          expectedOutput: [3, 5],
          isHidden: true,
          timeoutMs: 1000
        }
      ],
      hints: [
        {
          id: 'hint1',
          level: 'nudge',
          content: 'Think about what you need to find for each number in the array.',
          triggerCondition: 'no_progress_5min',
          order: 1
        },
        {
          id: 'hint2',
          level: 'guide',
          content: 'For each number, you need to check if its complement (target - current number) exists in the array.',
          triggerCondition: 'no_progress_10min',
          order: 2
        },
        {
          id: 'hint3',
          level: 'direction',
          content: 'Use a hash map to store numbers and their indices as you iterate through the array. This allows O(1) lookup time.',
          triggerCondition: 'no_progress_15min',
          order: 3
        }
      ],
      tags: ['hash-table', 'array', 'easy']
    };
  }

  static generateMockCodeAnalysis(code: string): CodeAnalysis {
    return {
      id: 'analysis-' + Math.random().toString(36).substr(2, 9),
      sessionId: 'demo-session',
      timestamp: new Date().toISOString(),
      code,
      language: 'python',
      syntaxErrors: [],
      qualityMetrics: {
        readabilityScore: Math.floor(Math.random() * 30) + 70,
        maintainabilityScore: Math.floor(Math.random() * 25) + 75,
        styleScore: Math.floor(Math.random() * 20) + 80,
        codeSmells: [],
        bestPractices: [
          {
            category: 'Documentation',
            recommendation: 'Add docstrings to your functions',
            impact: 'medium',
            examples: ['def function_name():', '    """Brief description."""']
          }
        ],
        duplications: 0,
        complexity: Math.floor(Math.random() * 5) + 1
      },
      complexityAnalysis: {
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        cyclomaticComplexity: Math.floor(Math.random() * 3) + 1,
        cognitiveComplexity: Math.floor(Math.random() * 5) + 1,
        linesOfCode: code.split('\n').length,
        functions: 1
      },
      suggestions: [
        'Consider adding error handling for edge cases',
        'Use more descriptive variable names',
        'Add type hints for better code clarity'
      ]
    };
  }

  static generateMockInterviewerMessage(type: 'question' | 'hint' | 'feedback' | 'encouragement' | 'clarification'): InterviewerMessage {
    const messages = {
      question: [
        'Can you walk me through your approach to this problem?',
        'What\'s the time complexity of your solution?',
        'How would you handle edge cases in this solution?'
      ],
      hint: [
        'Think about using a hash map to store the numbers you\'ve seen.',
        'Remember, you need to return the indices, not the values.',
        'Consider what information you need to store as you iterate.'
      ],
      feedback: [
        'Great job on the implementation! The logic is sound.',
        'Your solution is correct, but let\'s discuss the time complexity.',
        'Nice approach! Can we optimize this further?'
      ],
      encouragement: [
        'You\'re on the right track! Keep going.',
        'Don\'t worry about getting it perfect first try.',
        'Take your time to think through the problem.'
      ],
      clarification: [
        'Just to clarify, we need to return the indices of the two numbers.',
        'The array is 0-indexed, so the first element is at index 0.',
        'You can assume there\'s always exactly one valid solution.'
      ]
    };

    const messageOptions = messages[type];
    const content = messageOptions[Math.floor(Math.random() * messageOptions.length)];

    return {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      sessionId: 'demo-session',
      type,
      content,
      timestamp: new Date().toISOString(),
      context: {
        triggeredBy: 'user_request',
        candidateCode: '# Current code state',
        analysisResults: {}
      }
    };
  }
}

export default MockDataGenerator;