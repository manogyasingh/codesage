import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { PlayIcon, DownloadIcon, UploadIcon, MaximizeIcon, MinimizeIcon } from './Icons';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'python' | 'javascript' | 'java' | 'cpp' | 'typescript';
  readOnly?: boolean;
  height?: string;
  theme?: 'vs-dark' | 'light' | 'vs';
  showLineNumbers?: boolean;
  fontSize?: number;
  wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  minimap?: boolean;
  onRun?: () => void;
  onSave?: () => void;
  className?: string;
}

const LANGUAGE_MAP = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  typescript: 'typescript'
};

const DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  selectOnLineNumbers: true,
  roundedSelection: false,
  readOnly: false,
  cursorStyle: 'line',
  automaticLayout: true,
  scrollBeyondLastLine: false,
  wordWrap: 'on',
  wrappingIndent: 'indent',
  lineNumbersMinChars: 3,
  scrollbar: {
    vertical: 'visible',
    horizontal: 'visible',
    arrowSize: 30,
    useShadows: false,
    verticalHasArrows: false,
    horizontalHasArrows: false,
  },
  minimap: {
    enabled: true,
    maxColumn: 120,
  },
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  wordBasedSuggestions: 'currentDocument',
  parameterHints: {
    enabled: true,
  },
  quickSuggestions: {
    other: true,
    comments: true,
    strings: true,
  },
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  readOnly = false,
  height = '400px',
  theme = 'vs-dark',
  showLineNumbers = true,
  fontSize = 14,
  wordWrap = 'on',
  minimap = true,
  onRun,
  onSave,
  className = '',
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorSettings = {
    fontSize,
    wordWrap,
    minimap,
    theme,
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: any) => {
    editorRef.current = editor;
    
    // Add keyboard shortcuts using monaco instance
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.();
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.();
    });

    // Focus the editor
    editor.focus();
  };

  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([value], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    
    const extensions = {
      python: '.py',
      javascript: '.js',
      java: '.java',
      cpp: '.cpp',
      typescript: '.ts'
    };
    
    element.download = `code${extensions[language]}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const uploadCode = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.js,.java,.cpp,.ts,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onChange(content);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    ...DEFAULT_OPTIONS,
    readOnly,
    lineNumbers: showLineNumbers ? 'on' : 'off',
    fontSize: editorSettings.fontSize,
    wordWrap: editorSettings.wordWrap,
    minimap: {
      ...DEFAULT_OPTIONS.minimap,
      enabled: editorSettings.minimap,
    },
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);

  const containerClasses = `
    ${isFullscreen 
      ? 'fixed inset-0 z-50 bg-gray-900' 
      : 'relative border border-gray-300 rounded-lg overflow-hidden'
    }
    ${className}
  `;

  return (
    <div className={containerClasses}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-300 capitalize">
            {language}
          </span>
          <div className="h-4 w-px bg-gray-600"></div>
          <button
            onClick={formatCode}
            className="text-gray-400 hover:text-white px-2 py-1 rounded text-sm transition-colors"
            title="Format code (Alt+Shift+F)"
          >
            Format
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {onRun && (
            <button
              onClick={onRun}
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
              title="Run code (Ctrl/Cmd+Enter)"
            >
              <PlayIcon className="w-3 h-3" />
              <span>Run</span>
            </button>
          )}

          <button
            onClick={downloadCode}
            className="text-gray-400 hover:text-white p-1.5 rounded transition-colors"
            title="Download code"
          >
            <DownloadIcon className="w-4 h-4" />
          </button>

          <button
            onClick={uploadCode}
            className="text-gray-400 hover:text-white p-1.5 rounded transition-colors"
            title="Upload file"
          >
            <UploadIcon className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-gray-600"></div>

          <button
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-white p-1.5 rounded transition-colors"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
          >
            {isFullscreen ? <MinimizeIcon className="w-4 h-4" /> : <MaximizeIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div 
        className={isFullscreen ? 'h-[calc(100vh-78px)]' : 'h-[calc(100%-78px)] min-h-[300px]'} 
        style={!isFullscreen ? { height: `120px`, minHeight: '300px' } : undefined}
      >
        <Editor
          height="100%"
          defaultLanguage={LANGUAGE_MAP[language]}
          language={LANGUAGE_MAP[language]}
          value={value}
          theme={editorSettings.theme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={editorOptions}
          loading={
            <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <div>Loading editor...</div>
              </div>
            </div>
          }
        />
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-1 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Lines: {value ? value.split('\n').length : 0}</span>
          <span>Characters: {value ? value.length : 0}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="capitalize">{language}</span>
          <span>•</span>
          <span className="capitalize">{editorSettings.theme}</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
