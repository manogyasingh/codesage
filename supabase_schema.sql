-- Supabase Database Schema for CodeSage Problem Management
-- This schema supports storing coding problems with proper input/output handling,
-- difficulty levels, categories, and comprehensive metadata

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Problem Categories Enum
CREATE TYPE problem_category AS ENUM (
  'arrays',
  'strings',
  'trees',
  'graphs',
  'dynamic_programming',
  'backtracking',
  'greedy',
  'sorting',
  'searching',
  'linked_lists',
  'stacks_queues',
  'hash_tables',
  'two_pointers',
  'sliding_window',
  'system_design',
  'database',
  'math',
  'bit_manipulation',
  'recursion',
  'other'
);

-- Difficulty Levels Enum
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Programming Languages Enum
CREATE TYPE programming_language AS ENUM (
  'python',
  'javascript',
  'typescript',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'scala'
);

-- Test Case Types Enum
CREATE TYPE test_case_type AS ENUM ('sample', 'hidden', 'edge_case', 'performance');

-- Main Problems Table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly version of title
    description TEXT NOT NULL,
    problem_statement TEXT NOT NULL, -- Detailed problem description with formatting
    input_format TEXT NOT NULL, -- Description of input format with \n for newlines
    output_format TEXT NOT NULL, -- Description of output format with \n for newlines
    constraints TEXT, -- Problem constraints (e.g., "1 <= n <= 10^5\n1 <= arr[i] <= 1000")

    -- Classification
    difficulty difficulty_level NOT NULL DEFAULT 'medium',
    category problem_category NOT NULL DEFAULT 'other',
    tags TEXT[] DEFAULT '{}', -- Array of tags for flexible categorization

    -- Timing and Limits
    time_limit_minutes INTEGER NOT NULL DEFAULT 60,
    memory_limit_mb INTEGER DEFAULT 256,

    -- Scoring and Analytics
    acceptance_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of successful submissions
    avg_completion_time INTEGER, -- Average time taken in minutes
    total_submissions INTEGER DEFAULT 0,
    successful_submissions INTEGER DEFAULT 0,

    -- Metadata
    created_by UUID, -- Reference to user who created the problem
    company_id UUID, -- Optional: if problem is company-specific
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexing
    CONSTRAINT problems_acceptance_rate_check CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
    CONSTRAINT problems_time_limit_check CHECK (time_limit_minutes > 0)
);

-- Test Cases Table
CREATE TABLE problem_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

    -- Test Case Data (stored with \n for newlines)
    input_data TEXT NOT NULL, -- Input data with proper newline formatting using \n
    expected_output TEXT NOT NULL, -- Expected output with proper newline formatting using \n
    explanation TEXT, -- Optional explanation for the test case

    -- Classification
    test_case_type test_case_type NOT NULL DEFAULT 'sample',
    is_sample BOOLEAN DEFAULT false, -- Whether to show this to candidates
    weight DECIMAL(3,2) DEFAULT 1.00, -- Weight for scoring (0.1 to 1.0)

    -- Performance Limits
    timeout_ms INTEGER DEFAULT 5000,
    memory_limit_mb INTEGER DEFAULT 256,

    -- Ordering
    display_order INTEGER NOT NULL DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT test_cases_weight_check CHECK (weight > 0 AND weight <= 1.0)
);

-- Template Code for Different Languages
CREATE TABLE problem_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language programming_language NOT NULL,
    template_code TEXT NOT NULL, -- Starter code template
    solution_code TEXT, -- Complete solution (for validation)

    -- Template metadata
    function_signature TEXT, -- Main function signature
    imports_allowed TEXT[], -- Allowed imports/libraries

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(problem_id, language)
);

-- Hints System
CREATE TABLE problem_hints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

    -- Hint Content
    hint_text TEXT NOT NULL,
    hint_level INTEGER NOT NULL DEFAULT 1, -- Progressive hint levels (1=subtle, 2=direct, 3=solution approach)

    -- Trigger Conditions
    trigger_after_minutes INTEGER DEFAULT 10, -- Show after X minutes
    trigger_after_failures INTEGER DEFAULT 3, -- Show after X failed attempts

    -- Ordering
    display_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem Examples (separate from test cases for clarity)
CREATE TABLE problem_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

    -- Example Data (with \n for proper formatting)
    example_input TEXT NOT NULL,
    example_output TEXT NOT NULL,
    explanation TEXT, -- Step-by-step explanation

    -- Ordering
    display_order INTEGER NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem Collections/Sets (for organizing related problems)
CREATE TABLE problem_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for problems in collections
CREATE TABLE problem_collection_items (
    collection_id UUID REFERENCES problem_collections(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 1,
    PRIMARY KEY (collection_id, problem_id)
);

-- Performance and Analytics Tracking
CREATE TABLE problem_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,

    -- Time-based metrics
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_attempts INTEGER DEFAULT 0,
    successful_attempts INTEGER DEFAULT 0,
    avg_completion_time_minutes DECIMAL(8,2),
    avg_score DECIMAL(5,2),

    -- Language breakdown
    language_stats JSONB DEFAULT '{}', -- {"python": {"attempts": 10, "success": 8}, ...}

    PRIMARY KEY (problem_id, date)
);

-- Indexes for Performance
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_tags ON problems USING gin(tags);
CREATE INDEX idx_problems_active ON problems(is_active) WHERE is_active = true;
CREATE INDEX idx_problems_public ON problems(is_public) WHERE is_public = true;
CREATE INDEX idx_problems_created_at ON problems(created_at);
CREATE INDEX idx_problems_acceptance_rate ON problems(acceptance_rate);

CREATE INDEX idx_test_cases_problem_id ON problem_test_cases(problem_id);
CREATE INDEX idx_test_cases_type ON problem_test_cases(test_case_type);
CREATE INDEX idx_test_cases_sample ON problem_test_cases(is_sample) WHERE is_sample = true;

CREATE INDEX idx_templates_problem_language ON problem_templates(problem_id, language);
CREATE INDEX idx_hints_problem_id ON problem_hints(problem_id);
CREATE INDEX idx_examples_problem_id ON problem_examples(problem_id);

-- Full-text search index
CREATE INDEX idx_problems_search ON problems USING gin(
    to_tsvector('english', title || ' ' || description || ' ' || array_to_string(tags, ' '))
);

-- Functions for maintaining data integrity and analytics

-- Function to update problem statistics
CREATE OR REPLACE FUNCTION update_problem_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be called when submissions are recorded
    -- Update acceptance rate, avg completion time, etc.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
        NEW.slug := trim(both '-' from NEW.slug);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
CREATE TRIGGER problems_generate_slug
    BEFORE INSERT OR UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION generate_slug();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER problems_updated_at
    BEFORE UPDATE ON problems
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_hints ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_examples ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth requirements)
CREATE POLICY "Public problems are viewable by everyone" ON problems
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view all test cases for public problems" ON problem_test_cases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM problems
            WHERE problems.id = problem_test_cases.problem_id
            AND problems.is_public = true
        )
    );

-- Insert some sample data
INSERT INTO problems (
    title,
    slug,
    description,
    problem_statement,
    input_format,
    output_format,
    constraints,
    difficulty,
    category,
    tags,
    time_limit_minutes
) VALUES (
    'Two Sum',
    'two-sum',
    'Find two numbers in an array that add up to a target sum.',
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    'The first line contains an integer n (1 ≤ n ≤ 10^4), the length of the array.\nThe second line contains n space-separated integers nums[i] (-10^9 ≤ nums[i] ≤ 10^9).\nThe third line contains an integer target (-10^9 ≤ target ≤ 10^9).',
    'Return two space-separated integers representing the indices of the two numbers that add up to target.',
    '1 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9\nExactly one solution exists.',
    'easy',
    'arrays',
    ARRAY['hash-table', 'arrays', 'two-pointers'],
    30
);

-- Insert sample test cases with proper newline formatting
INSERT INTO problem_test_cases (problem_id, input_data, expected_output, test_case_type, is_sample, display_order)
SELECT
    p.id,
    '4\n2 7 11 15\n9',
    '0 1',
    'sample',
    true,
    1
FROM problems p WHERE p.slug = 'two-sum';

INSERT INTO problem_test_cases (problem_id, input_data, expected_output, test_case_type, is_sample, display_order)
SELECT
    p.id,
    '3\n3 2 4\n6',
    '1 2',
    'sample',
    true,
    2
FROM problems p WHERE p.slug = 'two-sum';

-- Insert template code
INSERT INTO problem_templates (problem_id, language, template_code, function_signature)
SELECT
    p.id,
    'python',
    'def two_sum(nums, target):\n    """\n    :type nums: List[int]\n    :type target: int\n    :rtype: List[int]\n    """\n    # Your code here\n    pass\n\n# Read input\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\n\n# Solve and print result\nresult = two_sum(nums, target)\nprint(result[0], result[1])',
    'def two_sum(nums: List[int], target: int) -> List[int]'
FROM problems p WHERE p.slug = 'two-sum';

INSERT INTO problem_templates (problem_id, language, template_code, function_signature)
SELECT
    p.id,
    'javascript',
    '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Your code here\n};\n\n// Read input (Node.js style)\nconst readline = require(''readline'');\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nlet lines = [];\nrl.on(''line'', (line) => {\n    lines.push(line);\n    if (lines.length === 3) {\n        const n = parseInt(lines[0]);\n        const nums = lines[1].split('' '').map(Number);\n        const target = parseInt(lines[2]);\n        \n        const result = twoSum(nums, target);\n        console.log(result[0], result[1]);\n        rl.close();\n    }\n});',
    'function twoSum(nums: number[], target: number): number[]'
FROM problems p WHERE p.slug = 'two-sum';

-- Insert examples
INSERT INTO problem_examples (problem_id, example_input, example_output, explanation, display_order)
SELECT
    p.id,
    'Input: nums = [2,7,11,15], target = 9\n4\n2 7 11 15\n9',
    'Output: [0,1]\n0 1',
    'Because nums[0] + nums[1] = 2 + 7 = 9, we return [0, 1].',
    1
FROM problems p WHERE p.slug = 'two-sum';

-- Insert hints
INSERT INTO problem_hints (problem_id, hint_text, hint_level, trigger_after_minutes, display_order)
SELECT
    p.id,
    'Think about what information you need to store as you iterate through the array.',
    1,
    5,
    1
FROM problems p WHERE p.slug = 'two-sum';

INSERT INTO problem_hints (problem_id, hint_text, hint_level, trigger_after_minutes, display_order)
SELECT
    p.id,
    'Consider using a hash map to store numbers you''ve seen and their indices.',
    2,
    10,
    2
FROM problems p WHERE p.slug = 'two-sum';

INSERT INTO problem_hints (problem_id, hint_text, hint_level, trigger_after_minutes, display_order)
SELECT
    p.id,
    'For each number, check if (target - current_number) exists in your hash map.',
    3,
    15,
    3
FROM problems p WHERE p.slug = 'two-sum';

COMMENT ON TABLE problems IS 'Main table for storing coding problems with comprehensive metadata';
COMMENT ON COLUMN problems.input_format IS 'Description of input format with \n representing actual newlines in the input';
COMMENT ON COLUMN problems.output_format IS 'Description of output format with \n representing actual newlines in the output';
COMMENT ON COLUMN problems.constraints IS 'Problem constraints with \n for proper formatting';
COMMENT ON TABLE problem_test_cases IS 'Test cases for problems with input/output data containing \n for newlines';
COMMENT ON COLUMN problem_test_cases.input_data IS 'Actual input data with \n characters representing newlines';
COMMENT ON COLUMN problem_test_cases.expected_output IS 'Expected output with \n characters representing newlines';
