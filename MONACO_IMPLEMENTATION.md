# Monaco Code Editor Implementation Guide

## Overview

This document details the Monaco Code Editor implementation that provides a VS Code-like editing experience in the browser.

## Problem Solved: Ad Blocker Icon Issues

### The Issue
When using `lucide-react` icons, some users experienced the error:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
```

This occurred because ad blockers (like uBlock Origin) were blocking files with names like `fingerprint.js` from the lucide-react library.

### The Solution
We implemented custom SVG icon components that bypass ad blocker restrictions:

```typescript
// Custom icon implementation in Icons.tsx
export const PlayIcon: React.FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polygon points="5,3 19,12 5,21 5,3" />
  </svg>
);
```

## Components Architecture

### 1. CodeEditor Component
**File**: `src/components/CodeEditor.tsx`

**Features**:
- Monaco Editor integration with `@monaco-editor/react`
- Multiple language support (Python, JavaScript, Java, C++, TypeScript)
- Full-screen mode toggle
- File upload/download functionality
- Code formatting (Alt+Shift+F)
- Keyboard shortcuts (Ctrl+S, Ctrl+Enter)
- Customizable themes and settings

**Key Props**:
```typescript
interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'typescript';
  readOnly?: boolean;
  height?: string;
  theme?: 'vs-dark' | 'light' | 'vs';
  onRun?: () => void;
  onSave?: () => void;
}
```

### 2. CodeRunner Component
**File**: `src/components/CodeRunner.tsx`

**Features**:
- Code execution simulation with realistic delays
- Test case validation with pass/fail indicators
- Execution metrics (time, memory usage)
- Tabbed interface for output and test results
- Error handling and display

**Key Props**:
```typescript
interface CodeRunnerProps {
  code: string;
  language: string;
  testCases?: TestCase[];
  onExecute?: (code: string, language: string) => Promise<ExecutionResult>;
}
```

### 3. InterviewInterface Component
**File**: `src/components/InterviewInterface.tsx`

**Features**:
- Complete interview platform combining editor and runner
- Problem description panel
- AI assistant chat interface
- Code analysis panel
- Session management (start, pause, end)
- Voice interaction support
- Real-time metrics display

## Implementation Details

### Monaco Editor Configuration
```typescript
const DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  selectOnLineNumbers: true,
  roundedSelection: false,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  minimap: { enabled: true },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
};
```

### Keyboard Shortcuts Implementation
```typescript
const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
  // Save shortcut
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    onSave?.();
  });
  
  // Run shortcut
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
    onRun?.();
  });
};
```

### Language Support
The editor supports multiple programming languages with proper syntax highlighting:

```typescript
const LANGUAGE_MAP = {
  python: 'python',
  javascript: 'javascript', 
  java: 'java',
  cpp: 'cpp',
  typescript: 'typescript'
};
```

## Usage Examples

### Basic Code Editor
```tsx
import { CodeEditor } from './components';

function App() {
  const [code, setCode] = useState('print("Hello, World!")');
  
  return (
    <CodeEditor
      value={code}
      onChange={setCode}
      language="python"
      height="400px"
      onRun={() => console.log('Running code...')}
      onSave={() => console.log('Saving code...')}
    />
  );
}
```

### Code Runner with Test Cases
```tsx
import { CodeRunner } from './components';

const testCases = [
  { id: '1', input: [1, 2, 3], expectedOutput: 6, isHidden: false },
  { id: '2', input: [4, 5, 6], expectedOutput: 15, isHidden: false }
];

function App() {
  return (
    <CodeRunner
      code={code}
      language="python"
      testCases={testCases}
      onExecute={handleCodeExecution}
    />
  );
}
```

### Full Interview Interface
```tsx
import { InterviewInterface } from './components';

function App() {
  return (
    <InterviewInterface
      candidateId="candidate-123"
      problemId="problem-456"
      onSessionEnd={() => console.log('Session ended')}
    />
  );
}
```

## Styling and Themes

### Editor Themes
- **vs-dark**: Dark theme (default)
- **light**: Light theme
- **vs**: High contrast theme

### Custom Styling
The components use Tailwind CSS for styling:

```css
/* Toolbar styling */
.flex items-center justify-between bg-gray-800 px-4 py-2

/* Editor container */
.relative border border-gray-300 rounded-lg overflow-hidden

/* Status bar */
.flex items-center justify-between bg-gray-800 px-4 py-1 text-xs
```

## Performance Considerations

### Code Splitting
Components are exported from an index file for easy tree-shaking:

```typescript
// src/components/index.ts
export { CodeEditor } from './CodeEditor';
export { CodeRunner } from './CodeRunner';
export { InterviewInterface } from './InterviewInterface';
export * from './Icons';
```

### Memory Management
- Editor instances are properly cleaned up on component unmount
- Event listeners are removed to prevent memory leaks
- Monaco assets are cached by the browser

### Bundle Optimization
- Custom SVG icons reduce dependency size
- Monaco Editor is loaded from CDN for optimal caching
- Components use React.memo where appropriate

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|---------|
| Chrome  | 90+     | ✅ Full Support |
| Firefox | 88+     | ✅ Full Support |
| Safari  | 14+     | ✅ Full Support |
| Edge    | 90+     | ✅ Full Support |

## Common Issues and Solutions

### 1. Icons Not Loading
**Problem**: `ERR_BLOCKED_BY_CLIENT` error
**Solution**: Use custom SVG icons instead of external icon libraries

### 2. Monaco Not Loading
**Problem**: Editor fails to initialize
**Solution**: Ensure stable internet connection and check browser console

### 3. TypeScript Errors
**Problem**: Type mismatches
**Solution**: Install proper type definitions and check import paths

### 4. Full-screen Mode Issues
**Problem**: Full-screen toggle not working
**Solution**: Check CSS z-index values and viewport settings

## Development Tips

### Adding New Languages
1. Add to `LANGUAGE_MAP` in CodeEditor.tsx
2. Update the `language` type definitions
3. Ensure Monaco supports the language

### Custom Themes
```typescript
// Define custom theme
editor.defineTheme('myTheme', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#1e1e1e'
  }
});
```

### Extending Functionality
- Add new toolbar buttons to CodeEditor
- Implement additional test case types in CodeRunner
- Create new panels in InterviewInterface

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual Testing Checklist
- [ ] Editor loads correctly
- [ ] Syntax highlighting works
- [ ] Code execution functions
- [ ] Test cases validate properly
- [ ] Full-screen mode works
- [ ] File upload/download works
- [ ] Keyboard shortcuts respond
- [ ] Themes switch correctly

## Resources

- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Monaco Editor React Wrapper](https://github.com/suren-atoyan/monaco-react)
- [TypeScript Configuration](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)