import React, { useState, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import { SettingsIcon as Settings } from './Icons';
import { CodeRunner } from './CodeRunner';

const SAMPLE_CODES = {
  python: `# Python 3.9 Example - Two Sum Problem
def two_sum(nums, target):
    """
    Find two numbers in the array that add up to target.
    Returns indices of the two numbers.
    """
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        if complement in num_map:
            return [num_map[complement], i]
        
        num_map[num] = i
    
    return []

# Test the function
nums = [2, 7, 11, 15]
target = 9
result = two_sum(nums, target)
print(f"Indices: {result}")
print(f"Numbers: [{nums[result[0]]}, {nums[result[1]]}]")
print(f"Sum: {nums[result[0]] + nums[result[1]]}")`,

  c: `// C (GCC 10.2.0) Example - Binary Search
#include <stdio.h>

int binary_search(int arr[], int size, int target) {
    int left = 0;
    int right = size - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1; // Not found
}

int main() {
    int numbers[] = {1, 3, 5, 7, 9, 11, 13, 15};
    int size = sizeof(numbers) / sizeof(numbers[0]);
    int target = 7;
    
    int index = binary_search(numbers, size, target);
    
    if (index != -1) {
        printf("Found %d at index %d\\n", target, index);
    } else {
        printf("%d not found in array\\n", target);
    }
    
    return 0;
}`,

  cpp: `// C++ (GCC 10.2.0) Example - Quick Sort
#include <iostream>
#include <vector>
using namespace std;

int partition(vector<int>& arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(vector<int>& arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int main() {
    vector<int> numbers = {64, 34, 25, 12, 22, 11, 90};
    
    cout << "Original array: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    quickSort(numbers, 0, numbers.size() - 1);
    
    cout << "Sorted array: ";
    for (int num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    return 0;
}`,
};

const SUPPORTED_LANGUAGES = [
  { key: 'python', name: 'Python 3.9', version: '3.9.4' },
  { key: 'c', name: 'C (GCC)', version: '10.2.0' },
  { key: 'cpp', name: 'C++ (GCC)', version: '10.2.0' },
];

export const PistonDemo: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [code, setCode] = useState(SAMPLE_CODES.python);
  const editorRef = useRef<any>(null);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCode(SAMPLE_CODES[language as keyof typeof SAMPLE_CODES] || '// Start coding...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🚀 Piston API Demo - Python & C/C++
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Experience blazing-fast code execution with Piston running on localhost:2000. 
            Supports Python 3.9 and C/C++ with GCC 10.2.0.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code Editor Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <div className="bg-gray-900/80 px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1.5 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.key} value={lang.key}>
                        {lang.name} v{lang.version}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Piston Engine</span>
                </div>
              </div>
            </div>

            <div className="h-96">
              <Editor
                language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
              />
            </div>
          </div>

          {/* Code Runner Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
            <CodeRunner
              code={code}
              language={selectedLanguage}
              className="bg-transparent border-0 shadow-none"
            />
          </div>
        </div>

        {/* Language Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Py</span>
              </div>
              <h3 className="text-lg font-semibold text-white">Python 3.9.4</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Full Python 3.9 support with standard library access for data structures, algorithms, and more.
            </p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• Standard library modules</li>
              <li>• Object-oriented programming</li>
              <li>• List comprehensions</li>
              <li>• Exception handling</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <h3 className="text-lg font-semibold text-white">C (GCC 10.2.0)</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              System-level programming with GCC compiler supporting C99/C11 standards and optimizations.
            </p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• Memory management</li>
              <li>• Pointer arithmetic</li>
              <li>• Standard C library</li>
              <li>• Compile-time optimizations</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">C++</span>
              </div>
              <h3 className="text-lg font-semibold text-white">C++ (GCC 10.2.0)</h3>
            </div>
            <p className="text-gray-300 text-sm mb-3">
              Modern C++ with STL, templates, and object-oriented features for high-performance applications.
            </p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• STL containers & algorithms</li>
              <li>• Template programming</li>
              <li>• RAII & smart pointers</li>
              <li>• C++17 features</li>
            </ul>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-12 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">🔧 Piston Setup Instructions</h3>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">1. Install Docker:</span>
                <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 font-mono">
                  # Install Docker if not already installed<br/>
                  curl -fsSL https://get.docker.com -o get-docker.sh<br/>
                  sudo sh get-docker.sh
                </code>
              </div>
              
              <div>
                <span className="text-gray-400">2. Run Piston Container on localhost:2000:</span>
                <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 font-mono">
                  docker run -d -p 2000:2000 --name piston ghcr.io/engineer-man/piston
                </code>
              </div>
              
              <div>
                <span className="text-gray-400">3. Verify Installation:</span>
                <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 font-mono">
                  curl http://localhost:2000/api/v2/runtimes | grep -E "(python|c\+\+|c)"
                </code>
              </div>

              <div>
                <span className="text-gray-400">4. Test Code Execution:</span>
                <code className="block bg-gray-800 text-green-400 p-2 rounded mt-1 font-mono">
                  curl -X POST http://runner.sumitsaw.tech/api/v2/execute \\<br/>
                  &nbsp;&nbsp;-H "Content-Type: application/json" \\<br/>
                  &nbsp;&nbsp;-d '{"{"}"language":"python","version":"3.9.4","files":[{"{"}"content":"print('Hello Piston!')"{"}"}]{"}"}'
                </code>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
            <p className="text-blue-300 text-sm">
              ℹ️ <strong>Fallback Mode:</strong> If Piston is not running on localhost:2000, the system will automatically
              fallback to mock execution for testing purposes. Check the logs tab for detailed information.
            </p>
          </div>
        </div>

        {/* Performance Info */}
        <div className="mt-8 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm rounded-xl border border-purple-700/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">⚡ Performance Characteristics</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-purple-300 font-medium mb-2">Python 3.9.4</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Execution: ~50-200ms</li>
                <li>• Memory: ~15-30MB</li>
                <li>• Startup time: ~100ms</li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-300 font-medium mb-2">C (GCC 10.2.0)</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Compile: ~200-500ms</li>
                <li>• Execution: ~1-10ms</li>
                <li>• Memory: ~1-5MB</li>
              </ul>
            </div>
            <div>
              <h4 className="text-cyan-300 font-medium mb-2">C++ (GCC 10.2.0)</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• Compile: ~300-800ms</li>
                <li>• Execution: ~1-15ms</li>
                <li>• Memory: ~2-8MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
