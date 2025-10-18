import type { CodeAnalysis, ExecutionResult, QualityMetrics, ComplexityAnalysis } from '../types';
import { judge0Service } from './judge0';

// Code Analysis Service for real-time evaluation
export class CodeAnalysisService {
  private analysisCache = new Map<string, CodeAnalysis>();
  
  // Main analysis orchestrator
  async analyzeCode(
    code: string,
    language: string,
    sessionId: string
  ): Promise<CodeAnalysis> {
    const cacheKey = `${sessionId}-${this.hashCode(code)}`;
    
    // Check cache first for performance
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }
    
    // Perform comprehensive analysis
    const [
      syntaxErrors,
      executionResult,
      qualityMetrics,
      complexityAnalysis
    ] = await Promise.all([
      this.analyzeSyntax(code, language),
      this.executeCode(code, language),
      this.analyzeQuality(code, language),
      this.analyzeComplexity(code, language)
    ]);
    
    const analysis: CodeAnalysis = {
      id: crypto.randomUUID(),
      sessionId,
      timestamp: new Date().toISOString(),
      code,
      language,
      syntaxErrors,
      executionResult,
      qualityMetrics,
      complexityAnalysis,
      suggestions: this.generateSuggestions(qualityMetrics, complexityAnalysis)
    };
    
    // Cache result
    this.analysisCache.set(cacheKey, analysis);
    
    return analysis;
  }
  
  // Syntax analysis using language-specific parsers
  private async analyzeSyntax(code: string, language: string): Promise<any[]> {
    const errors: any[] = [];
    
    try {
      switch (language) {
        case 'python':
          await this.validatePythonSyntax(code);
          break;
        case 'javascript':
        case 'typescript':
          await this.validateJavaScriptSyntax(code);
          break;
        case 'java':
          await this.validateJavaSyntax(code);
          break;
        default:
          // Basic syntax validation for other languages
          await this.basicSyntaxValidation(code, language);
      }
    } catch (error: any) {
      errors.push({
        line: this.extractLineNumber(error.message),
        column: this.extractColumnNumber(error.message),
        message: error.message,
        severity: 'error',
        type: 'syntax'
      });
    }
    
    return errors;
  }
  
  // Safe code execution in sandboxed environment using Judge0
  private async executeCode(code: string, language: string): Promise<ExecutionResult | undefined> {
    try {
      // Use Judge0 service for secure code execution
      const result = await judge0Service.executeCode(code, language);
      return result;
    } catch (error) {
      return {
        success: false,
        error: `Execution failed: ${error}`,
        executionTime: 0,
        memoryUsage: 0,
        testResults: []
      };
    }
  }
  
  // Code quality analysis
  private async analyzeQuality(code: string, language: string): Promise<QualityMetrics> {
    const metrics = {
      readabilityScore: this.calculateReadabilityScore(code),
      maintainabilityScore: this.calculateMaintainabilityScore(code),
      styleScore: this.calculateStyleScore(code, language),
      codeSmells: this.detectCodeSmells(code, language),
      bestPractices: this.checkBestPractices(code, language),
      duplications: this.detectDuplication(code),
      complexity: this.calculateCyclomaticComplexity(code)
    };
    
    return metrics;
  }
  
  // Complexity analysis using AST parsing
  private async analyzeComplexity(code: string, language: string): Promise<ComplexityAnalysis> {
    try {
      const ast = await this.parseAST(code, language);
      
      return {
        timeComplexity: this.estimateTimeComplexity(ast, code),
        spaceComplexity: this.estimateSpaceComplexity(ast, code),
        cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
        cognitiveComplexity: this.calculateCognitiveComplexity(ast),
        linesOfCode: code.split('\n').length,
        functions: this.countFunctions(ast)
      };
    } catch (error) {
      // Fallback analysis if AST parsing fails
      return {
        timeComplexity: this.estimateTimeComplexityBasic(code),
        spaceComplexity: this.estimateSpaceComplexityBasic(code),
        cyclomaticComplexity: this.calculateCyclomaticComplexity(code),
        cognitiveComplexity: 1,
        linesOfCode: code.split('\n').length,
        functions: this.countFunctionsBasic(code)
      };
    }
  }
  
  // Language-specific syntax validators
  private async validatePythonSyntax(code: string): Promise<void> {
    // Use Pyodide or similar for Python syntax validation
    // For now, basic pattern matching
    const pythonPatterns = [
      /def\s+\w+\s*\([^)]*\)\s*:/,  // Function definitions
      /class\s+\w+.*:/,              // Class definitions
      /if\s+.*:/,                    // If statements
      /for\s+.*:/,                   // For loops
      /while\s+.*:/                  // While loops
    ];
    
    // Check for common Python syntax errors
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;
      
      // Check indentation consistency
      if (i > 0 && this.checkIndentationError(lines[i], lines[i-1])) {
        throw new Error(`Indentation error at line ${i + 1}`);
      }
    }
  }
  
  private async validateJavaScriptSyntax(code: string): Promise<void> {
    try {
      // Use Function constructor for syntax validation
      new Function(code);
    } catch (error) {
      throw new Error(`JavaScript syntax error: ${error}`);
    }
  }
  
  private async validateJavaSyntax(code: string): Promise<void> {
    // Basic Java syntax patterns
    const javaPatterns = [
      /public\s+class\s+\w+/,       // Class declarations
      /public\s+static\s+void\s+main/, // Main method
      /\{\s*$/,                      // Opening braces
      /^\s*\}/                       // Closing braces
    ];
    
    // Check for balanced braces
    let braceCount = 0;
    for (const char of code) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    if (braceCount !== 0) {
      throw new Error('Unbalanced braces in Java code');
    }
  }
  
  private async basicSyntaxValidation(code: string, language: string): Promise<void> {
    // Generic syntax validation
    const balanceCheck = this.checkBalancedBrackets(code);
    if (!balanceCheck.balanced) {
      throw new Error(`Unbalanced ${balanceCheck.bracket} at position ${balanceCheck.position}`);
    }
  }
  
  // Quality metrics calculations
  private calculateReadabilityScore(code: string): number {
    let score = 100;
    const lines = code.split('\n');
    
    // Deduct for long lines
    lines.forEach(line => {
      if (line.length > 80) score -= 2;
      if (line.length > 120) score -= 5;
    });
    
    // Deduct for lack of comments
    const commentRatio = lines.filter(line => 
      line.trim().startsWith('//') || 
      line.trim().startsWith('#') ||
      line.includes('/*')
    ).length / lines.length;
    
    if (commentRatio < 0.1) score -= 10;
    
    // Deduct for inconsistent naming
    const variableNames = this.extractVariableNames(code);
    if (!this.hasConsistentNaming(variableNames)) score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateMaintainabilityScore(code: string): number {
    let score = 100;
    
    // Function length analysis
    const functions = this.extractFunctions(code);
    functions.forEach(func => {
      if (func.length > 50) score -= 10;
      if (func.length > 100) score -= 20;
    });
    
    // Nesting depth analysis
    const maxNestingDepth = this.calculateMaxNestingDepth(code);
    if (maxNestingDepth > 4) score -= (maxNestingDepth - 4) * 10;
    
    // Code duplication
    const duplicationLevel = this.detectDuplication(code);
    score -= duplicationLevel * 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateStyleScore(code: string, language: string): number {
    let score = 100;
    
    switch (language) {
      case 'python':
        score = this.calculatePythonStyleScore(code);
        break;
      case 'javascript':
      case 'typescript':
        score = this.calculateJavaScriptStyleScore(code);
        break;
      case 'java':
        score = this.calculateJavaStyleScore(code);
        break;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Complexity estimation algorithms
  private estimateTimeComplexity(ast: any, code: string): string {
    // Analyze AST for nested loops and recursive calls
    const nestedLoops = this.countNestedLoops(ast);
    const recursiveCalls = this.countRecursiveCalls(ast);
    const logarithmicPatterns = this.detectLogarithmicPatterns(code);
    
    if (nestedLoops >= 3) return 'O(n³)';
    if (nestedLoops >= 2) return 'O(n²)';
    if (nestedLoops >= 1 && recursiveCalls > 0) return 'O(n log n)';
    if (nestedLoops >= 1) return 'O(n)';
    if (logarithmicPatterns) return 'O(log n)';
    if (recursiveCalls > 0) return 'O(2ⁿ)';
    
    return 'O(1)';
  }
  
  private estimateSpaceComplexity(ast: any, code: string): string {
    const recursionDepth = this.calculateRecursionDepth(ast);
    const dataStructures = this.countDataStructures(ast);
    
    if (recursionDepth > 0) return 'O(n)';
    if (dataStructures > 1) return 'O(n)';
    if (dataStructures === 1) return 'O(n)';
    
    return 'O(1)';
  }
  
  private estimateTimeComplexityBasic(code: string): string {
    const forLoops = (code.match(/for\s*\(/g) || []).length;
    const whileLoops = (code.match(/while\s*\(/g) || []).length;
    const totalLoops = forLoops + whileLoops;
    
    // Basic heuristic based on loop count
    if (totalLoops >= 3) return 'O(n³)';
    if (totalLoops >= 2) return 'O(n²)';
    if (totalLoops >= 1) return 'O(n)';
    
    return 'O(1)';
  }
  
  private estimateSpaceComplexityBasic(code: string): string {
    const arrays = (code.match(/\[\s*\]/g) || []).length;
    const objects = (code.match(/\{\s*\}/g) || []).length;
    const variables = (code.match(/\b(let|const|var)\b/g) || []).length;
    
    if (arrays > 0 || objects > 0) return 'O(n)';
    if (variables > 10) return 'O(n)';
    
    return 'O(1)';
  }
  
  // Helper utility methods
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
  
  private extractLineNumber(errorMessage: string): number {
    const match = errorMessage.match(/line (\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  }
  
  private extractColumnNumber(errorMessage: string): number {
    const match = errorMessage.match(/column (\d+)/i);
    return match ? parseInt(match[1], 10) : 1;
  }
  
  private generateSuggestions(quality: QualityMetrics, complexity: ComplexityAnalysis): string[] {
    const suggestions: string[] = [];
    
    if (quality.readabilityScore < 70) {
      suggestions.push('Consider improving code readability with better variable names and comments');
    }
    
    if (complexity.timeComplexity.includes('n²') || complexity.timeComplexity.includes('n³')) {
      suggestions.push('Look for opportunities to optimize time complexity using efficient data structures');
    }
    
    if (complexity.cyclomaticComplexity > 10) {
      suggestions.push('Consider breaking down complex functions into smaller, more focused functions');
    }
    
    if (quality.duplications > 2) {
      suggestions.push('Eliminate code duplication by extracting common functionality');
    }
    
    return suggestions;
  }
  
  // Placeholder implementations for complex analysis methods
  private checkIndentationError(currentLine: string, previousLine: string): boolean {
    // Simplified indentation check
    return false;
  }
  
  private checkBalancedBrackets(code: string): { balanced: boolean; bracket?: string; position?: number } {
    const stack: string[] = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char in pairs) {
        stack.push(char);
      } else if (Object.values(pairs).includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last] !== char) {
          return { balanced: false, bracket: char, position: i };
        }
      }
    }
    
    return { balanced: stack.length === 0 };
  }
  
  private async parseAST(code: string, language: string): Promise<any> {
    // Placeholder for AST parsing
    // In production, would use language-specific parsers
    return {};
  }
  
  private extractVariableNames(code: string): string[] {
    const pattern = /(?:let|const|var)\s+(\w+)/g;
    const matches: string[] = [];
    let match;
    
    while ((match = pattern.exec(code)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }
  
  private hasConsistentNaming(names: string[]): boolean {
    if (names.length < 2) return true;
    
    const camelCase = names.filter(name => /^[a-z][a-zA-Z0-9]*$/.test(name));
    const snakeCase = names.filter(name => /^[a-z][a-z0-9_]*$/.test(name));
    
    return camelCase.length === names.length || snakeCase.length === names.length;
  }
  
  private extractFunctions(code: string): string[] {
    // Simplified function extraction
    const functionPattern = /function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g;
    return code.match(functionPattern) || [];
  }
  
  private calculateMaxNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }
    
    return maxDepth;
  }
  
  private detectDuplication(code: string): number {
    // Simplified duplication detection
    const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const uniqueLines = new Set(lines);
    
    return lines.length - uniqueLines.size;
  }
  
  private calculateCyclomaticComplexity(code: string): number {
    // Count decision points
    const patterns = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /\?\s*.*\s*:/g, // Ternary operator
      /&&/g,
      /\|\|/g
    ];
    
    let complexity = 1; // Base complexity
    
    patterns.forEach(pattern => {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }
  
  // Additional placeholder methods for comprehensive analysis
  private detectCodeSmells(code: string, language: string): any[] { return []; }
  private checkBestPractices(code: string, language: string): any[] { return []; }
  private calculateCognitiveComplexity(ast: any): number { return 1; }
  private countFunctions(ast: any): number { return 1; }
  private countFunctionsBasic(code: string): number { 
    return (code.match(/function\s+/g) || []).length;
  }
  private countNestedLoops(ast: any): number { return 0; }
  private countRecursiveCalls(ast: any): number { return 0; }
  private detectLogarithmicPatterns(code: string): boolean { return false; }
  private calculateRecursionDepth(ast: any): number { return 0; }
  private countDataStructures(ast: any): number { return 0; }
  private calculatePythonStyleScore(code: string): number { return 85; }
  private calculateJavaScriptStyleScore(code: string): number { return 85; }
  private calculateJavaStyleScore(code: string): number { return 85; }
}

// Export singleton instance
export const codeAnalyzer = new CodeAnalysisService();
export default CodeAnalysisService;