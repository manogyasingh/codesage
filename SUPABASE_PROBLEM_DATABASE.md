# Supabase Problem Management Database Documentation

## Overview

This document describes the comprehensive database structure for storing coding problem statements with proper input/output formatting, difficulty levels, and all necessary metadata for the CodeSage interview platform.

## Key Features

- **Proper Input/Output Formatting**: Uses `\n` characters to represent newlines in problem descriptions, input formats, output formats, and test cases
- **Comprehensive Problem Metadata**: Includes difficulty levels, categories, tags, time limits, memory limits, and analytics
- **Test Case Management**: Supports sample, hidden, edge case, and performance test cases with proper weight scoring
- **Progressive Hint System**: Multi-level hints with trigger conditions based on time and failure count
- **Template Code Support**: Multiple programming language templates with starter code and solutions
- **Problem Collections**: Organize related problems into collections for structured learning
- **Analytics Tracking**: Track problem performance, acceptance rates, and completion times
- **Full-Text Search**: Optimized search across problem titles, descriptions, and tags

## Database Schema

### Core Tables

#### 1. `problems` - Main Problems Table
Stores the complete problem information with proper formatting.

```sql
-- Key fields for input/output formatting:
problem_statement TEXT NOT NULL, -- Detailed problem with \n for newlines
input_format TEXT NOT NULL,      -- Input description with \n formatting  
output_format TEXT NOT NULL,     -- Output description with \n formatting
constraints TEXT,                -- Constraints with \n for proper display
```

#### 2. `problem_test_cases` - Test Cases
Stores test cases with actual input/output data using `\n` for newlines.

```sql
input_data TEXT NOT NULL,        -- Raw input with \n for newlines
expected_output TEXT NOT NULL,   -- Expected output with \n for newlines
test_case_type test_case_type,   -- 'sample', 'hidden', 'edge_case', 'performance'
```

#### 3. `problem_templates` - Language Templates
Template code for different programming languages.

#### 4. `problem_hints` - Progressive Hints
Multi-level hint system with trigger conditions.

#### 5. `problem_examples` - Problem Examples  
Separate from test cases, these show example inputs/outputs with explanations.

## Data Format Guidelines

### Input/Output Formatting

When storing problem data, use `\n` characters to represent actual newlines:

```typescript
// Example problem input format
inputFormat: "The first line contains an integer n (1 ≤ n ≤ 10^4).\nThe second line contains n space-separated integers."

// Example test case input data  
inputData: "4\n2 7 11 15\n9"

// Example expected output
expectedOutput: "0 1"
```

### Problem Categories

Supported categories:
- `arrays`, `strings`, `trees`, `graphs`
- `dynamic_programming`, `backtracking`, `greedy`
- `sorting`, `searching`, `linked_lists`
- `stacks_queues`, `hash_tables`, `two_pointers`
- `sliding_window`, `system_design`, `database`
- `math`, `bit_manipulation`, `recursion`, `other`

### Difficulty Levels
- `easy` - Basic problems, typically solvable in 15-30 minutes
- `medium` - Intermediate problems, typically 30-60 minutes  
- `hard` - Advanced problems, 60+ minutes

## API Usage Examples

### Creating a Problem

```typescript
import { SupabaseService } from './services/supabase';

const newProblem = await SupabaseService.createProblem({
  title: "Two Sum",
  slug: "two-sum", 
  description: "Find two numbers that add up to target",
  problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution.",
  inputFormat: "The first line contains an integer n.\nThe second line contains n space-separated integers.\nThe third line contains the target integer.",
  outputFormat: "Return two space-separated integers representing the indices.",
  constraints: "1 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9",
  difficulty: "easy",
  category: "arrays",
  tags: ["hash-table", "arrays"],
  timeLimitMinutes: 30,
  memoryLimitMb: 256,
  isPublic: true
});
```

### Adding Test Cases

```typescript
await SupabaseService.createTestCase({
  problemId: newProblem.id,
  inputData: "4\n2 7 11 15\n9",
  expectedOutput: "0 1", 
  explanation: "nums[0] + nums[1] = 2 + 7 = 9",
  testCaseType: "sample",
  isSample: true,
  weight: 1.0,
  timeoutMs: 1000
});
```

### Adding Problem Templates

```typescript
await SupabaseService.createProblemTemplate({
  problemId: newProblem.id,
  language: "python",
  templateCode: `def two_sum(nums, target):
    """
    :type nums: List[int] 
    :type target: int
    :rtype: List[int]
    """
    # Your code here
    pass

# Read input
n = int(input())
nums = list(map(int, input().split()))
target = int(input())

# Solve and print result  
result = two_sum(nums, target)
print(result[0], result[1])`,
  functionSignature: "def two_sum(nums: List[int], target: int) -> List[int]"
});
```

### Querying Problems

```typescript  
// Get problems with filters
const problems = await SupabaseService.getProblems({
  difficulty: "easy",
  category: "arrays", 
  tags: ["hash-table"],
  limit: 10
});

// Get full problem details including test cases, examples, hints
const problemDetails = await SupabaseService.getProblem(problemId, true);

// Search problems
const searchResults = await SupabaseService.searchProblems("two sum");
```

## Frontend Integration

### Displaying Formatted Content

When displaying problem content in your React components, convert `\n` to actual line breaks:

```typescript
// Utility function to format text
const formatText = (text: string) => {
  return text.split('\n').map((line, index) => (
    <React.Fragment key={index}>
      {line}
      {index < text.split('\n').length - 1 && <br />}
    </React.Fragment>
  ));
};

// Usage in component
<div className="problem-statement">
  {formatText(problem.problemStatement)}
</div>

<div className="input-format">
  <h4>Input Format:</h4>
  {formatText(problem.inputFormat)}
</div>
```

### Test Case Display

```typescript
const TestCaseDisplay = ({ testCase }: { testCase: TestCase }) => (
  <div className="test-case">
    <h5>Input:</h5>
    <pre>{testCase.inputData}</pre>
    
    <h5>Expected Output:</h5>
    <pre>{testCase.expectedOutput}</pre>
    
    {testCase.explanation && (
      <>
        <h5>Explanation:</h5>
        <p>{testCase.explanation}</p>
      </>
    )}
  </div>
);
```

## Database Setup

### 1. Run the Schema
Execute the `supabase_schema.sql` file in your Supabase SQL editor to create all tables, indexes, and functions.

### 2. Enable Row Level Security  
The schema includes RLS policies. Adjust them based on your authentication requirements.

### 3. Set up Storage (Optional)
If you plan to store voice recordings or file uploads:

```sql
-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-recordings', 'voice-recordings', false);
```

## Performance Considerations

### Indexes
The schema includes optimized indexes for:
- Problem filtering by difficulty, category, tags
- Full-text search across titles and descriptions  
- Test case and template lookups by problem ID
- Date-based queries for analytics

### Caching Strategy
Consider implementing caching for:
- Popular problems and their test cases
- Problem collections and metadata
- Template code for different languages
- Search results for common queries

## Migration from Existing Data

If you have existing problem data, here's how to migrate:

```typescript
// Example migration script
const migrateProblem = async (oldProblem: any) => {
  const newProblem = await SupabaseService.createProblem({
    title: oldProblem.title,
    slug: oldProblem.title.toLowerCase().replace(/\s+/g, '-'),
    description: oldProblem.description,
    problemStatement: oldProblem.description.replace(/\\n/g, '\n'),
    inputFormat: oldProblem.inputFormat || "Input format not specified",
    outputFormat: oldProblem.outputFormat || "Output format not specified", 
    difficulty: oldProblem.difficulty,
    category: mapOldCategoryToNew(oldProblem.category),
    tags: oldProblem.tags || [],
    timeLimitMinutes: oldProblem.timeLimit || 60
  });

  // Migrate test cases
  for (const testCase of oldProblem.testCases) {
    await SupabaseService.createTestCase({
      problemId: newProblem.id,
      inputData: JSON.stringify(testCase.input).replace(/"/g, ''),
      expectedOutput: JSON.stringify(testCase.expectedOutput).replace(/"/g, ''),
      testCaseType: testCase.isHidden ? 'hidden' : 'sample',
      isSample: !testCase.isHidden
    });
  }
};
```

## Security Best Practices

1. **Row Level Security**: Enable RLS on all tables
2. **API Validation**: Validate all inputs on the server side
3. **Rate Limiting**: Implement rate limiting for problem creation/updates
4. **Access Control**: Control who can create/modify problems
5. **Data Sanitization**: Sanitize user inputs to prevent XSS

## Monitoring and Analytics

The schema includes analytics tables to track:
- Problem submission rates and success rates
- Average completion times
- Language preference distribution  
- Popular problem categories
- User engagement metrics

Use these for generating insights and improving the problem set quality.
