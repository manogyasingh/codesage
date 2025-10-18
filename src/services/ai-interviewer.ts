import type { 
  InterviewerMessage, 
  CodeAnalysis, 
  Problem, 
  Candidate,
  Hint
} from '../types';

// OpenAI Configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// AI Interviewer Service
export class AIInterviewerService {
  private sessionContext: Map<string, SessionContext> = new Map();
  
  // Initialize a new interview session context
  initializeSession(sessionId: string, candidate: Candidate, problem: Problem) {
    const context: SessionContext = {
      sessionId,
      candidate,
      problem,
      conversationHistory: [],
      hintsGiven: [],
      currentDifficulty: problem.difficulty,
      analysisHistory: [],
      personalityProfile: this.buildPersonalityProfile(candidate)
    };
    
    this.sessionContext.set(sessionId, context);
    return this.generateWelcomeMessage(context);
  }
  
  // Generate contextual AI responses based on code analysis
  async generateResponse(
    sessionId: string,
    analysis: CodeAnalysis,
    userMessage?: string
  ): Promise<InterviewerMessage> {
    const context = this.sessionContext.get(sessionId);
    if (!context) {
      throw new Error(`Session context not found for ${sessionId}`);
    }
    
    // Update context with new analysis
    context.analysisHistory.push(analysis);
    
    // Determine response type based on context
    const responseType = this.determineResponseType(context, analysis, userMessage);
    
    // Generate appropriate response
    const response = await this.generateContextualResponse(
      context,
      analysis,
      responseType,
      userMessage
    );
    
    // Update conversation history
    context.conversationHistory.push(response);
    
    return response;
  }
  
  // Progressive hint system
  async provideHint(sessionId: string, analysis: CodeAnalysis): Promise<InterviewerMessage> {
    const context = this.sessionContext.get(sessionId);
    if (!context) {
      throw new Error(`Session context not found for ${sessionId}`);
    }
    
    const hintLevel = this.determineHintLevel(context, analysis);
    const hint = await this.generateProgressiveHint(context, analysis, hintLevel);
    
    context.hintsGiven.push(hint);
    context.conversationHistory.push(hint);
    
    return hint;
  }
  
  // Adaptive difficulty adjustment
  adjustDifficulty(sessionId: string, performance: PerformanceMetrics): void {
    const context = this.sessionContext.get(sessionId);
    if (!context) return;
    
    // Analyze performance trends
    const shouldIncrease = this.shouldIncreaseDifficulty(performance);
    const shouldDecrease = this.shouldDecreaseDifficulty(performance);
    
    if (shouldIncrease && context.currentDifficulty !== 'hard') {
      context.currentDifficulty = context.currentDifficulty === 'easy' ? 'medium' : 'hard';
    } else if (shouldDecrease && context.currentDifficulty !== 'easy') {
      context.currentDifficulty = context.currentDifficulty === 'hard' ? 'medium' : 'easy';
    }
  }
  
  // Generate final assessment
  async generateFinalAssessment(sessionId: string): Promise<string> {
    const context = this.sessionContext.get(sessionId);
    if (!context) {
      throw new Error(`Session context not found for ${sessionId}`);
    }
    
    const prompt = this.buildAssessmentPrompt(context);
    return await this.callOpenAI(prompt, 'assessment');
  }
  
  // Private helper methods
  private buildPersonalityProfile(candidate: Candidate): PersonalityProfile {
    return {
      experienceLevel: candidate.experience,
      skills: candidate.skills,
      communicationStyle: 'adaptive', // Will be learned during interview
      preferredHintStyle: 'progressive',
      confidenceLevel: 'medium' // Will be assessed during interview
    };
  }
  
  private generateWelcomeMessage(context: SessionContext): InterviewerMessage {
    const { candidate, problem } = context;
    
    return {
      id: crypto.randomUUID(),
      sessionId: context.sessionId,
      type: 'question',
      content: `Hello ${candidate.name}! Welcome to your technical interview. I'm CodeSage, your AI interviewer. I'll be guiding you through today's coding challenge while analyzing your problem-solving approach in real-time.

Today's problem is "${problem.title}" - it's a ${problem.difficulty} level ${problem.category} problem. You'll have ${problem.timeLimit} minutes to work through it.

I encourage you to think aloud as you code, as it helps me understand your thought process. I'm here to provide hints and guidance when needed. Ready to begin?

Here's your problem:
${problem.description}`,
      timestamp: new Date().toISOString(),
      context: {
        triggeredBy: 'session-start',
        candidateCode: '',
        analysisResults: {}
      }
    };
  }
  
  private determineResponseType(
    context: SessionContext,
    analysis: CodeAnalysis,
    userMessage?: string
  ): ResponseType {
    // Analyze code progress and quality
    const hasErrors = analysis.syntaxErrors.length > 0;
    const lowQuality = analysis.qualityMetrics.readabilityScore < 60;
    const stuckPattern = this.detectStuckPattern(context, analysis);
    const needsEncouragement = this.needsEncouragement(context);
    
    if (userMessage) {
      return 'clarification';
    } else if (hasErrors) {
      return 'feedback';
    } else if (stuckPattern) {
      return 'hint';
    } else if (needsEncouragement) {
      return 'encouragement';
    } else if (lowQuality) {
      return 'feedback';
    } else {
      return 'question';
    }
  }
  
  private async generateContextualResponse(
    context: SessionContext,
    analysis: CodeAnalysis,
    type: ResponseType,
    userMessage?: string
  ): Promise<InterviewerMessage> {
    const prompt = this.buildResponsePrompt(context, analysis, type, userMessage);
    const content = await this.callOpenAI(prompt, type);
    
    return {
      id: crypto.randomUUID(),
      sessionId: context.sessionId,
      type,
      content,
      timestamp: new Date().toISOString(),
      context: {
        triggeredBy: type,
        candidateCode: analysis.code,
        analysisResults: analysis
      }
    };
  }
  
  private determineHintLevel(
    context: SessionContext, 
    analysis: CodeAnalysis
  ): HintLevel {
    const hintsGiven = context.hintsGiven.length;
    const timeElapsed = this.calculateTimeElapsed(context);
    const progressStuck = this.detectStuckPattern(context, analysis);
    
    if (hintsGiven === 0 || !progressStuck) {
      return 'nudge';
    } else if (hintsGiven < 3 && timeElapsed < context.problem.timeLimit * 0.7) {
      return 'guide';
    } else {
      return 'direction';
    }
  }
  
  private async generateProgressiveHint(
    context: SessionContext,
    analysis: CodeAnalysis,
    level: HintLevel
  ): Promise<InterviewerMessage> {
    const availableHints = context.problem.hints.filter(h => h.level === level);
    let hintContent: string;
    
    if (availableHints.length > 0) {
      // Use predefined hints
      const hint = availableHints[Math.floor(Math.random() * availableHints.length)];
      hintContent = hint.content;
    } else {
      // Generate dynamic hint using AI
      const prompt = this.buildHintPrompt(context, analysis, level);
      hintContent = await this.callOpenAI(prompt, 'hint');
    }
    
    return {
      id: crypto.randomUUID(),
      sessionId: context.sessionId,
      type: 'hint',
      content: hintContent,
      timestamp: new Date().toISOString(),
      context: {
        triggeredBy: `hint-${level}`,
        candidateCode: analysis.code,
        analysisResults: analysis
      }
    };
  }
  
  private buildResponsePrompt(
    context: SessionContext,
    analysis: CodeAnalysis,
    type: ResponseType,
    userMessage?: string
  ): string {
    const { candidate, problem, conversationHistory } = context;
    
    let prompt = `You are CodeSage, an expert AI technical interviewer conducting a live coding interview. 

CANDIDATE CONTEXT:
- Name: ${candidate.name}
- Experience: ${candidate.experience}
- Skills: ${candidate.skills.join(', ')}

PROBLEM CONTEXT:
- Problem: ${problem.title}
- Difficulty: ${problem.difficulty}
- Category: ${problem.category}

CURRENT CODE ANALYSIS:
- Language: ${analysis.language}
- Lines of Code: ${analysis.complexityAnalysis.linesOfCode}
- Syntax Errors: ${analysis.syntaxErrors.length}
- Readability Score: ${analysis.qualityMetrics.readabilityScore}/100
- Time Complexity: ${analysis.complexityAnalysis.timeComplexity}
- Space Complexity: ${analysis.complexityAnalysis.spaceComplexity}

CURRENT CODE:
\`\`\`${analysis.language}
${analysis.code}
\`\`\`

CONVERSATION HISTORY:
${conversationHistory.slice(-3).map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n')}
`;

    switch (type) {
      case 'feedback':
        prompt += `
TASK: Provide constructive feedback on the current code. Focus on:
- Code quality and best practices
- Performance optimizations
- Alternative approaches
- Encouraging tone while being specific about improvements

Keep response concise (2-3 sentences) and actionable.`;
        break;
        
      case 'encouragement':
        prompt += `
TASK: Provide encouragement and positive reinforcement. The candidate may be feeling stuck or frustrated.
- Acknowledge their progress and effort
- Boost confidence with specific observations
- Gently guide toward next steps
- Maintain supportive, human-like tone

Keep response warm and motivating (1-2 sentences).`;
        break;
        
      case 'question':
        prompt += `
TASK: Ask a thoughtful follow-up question to deepen understanding:
- Probe their problem-solving approach
- Explore edge cases or optimizations
- Test conceptual understanding
- Encourage explanation of their logic

Ask one focused, open-ended question.`;
        break;
        
      case 'clarification':
        prompt += `
USER MESSAGE: "${userMessage}"

TASK: Respond to the candidate's question or comment:
- Answer their technical questions clearly
- Provide clarification when requested
- Guide them back to the problem if needed
- Maintain natural conversational flow

Respond directly and helpfully.`;
        break;
    }
    
    prompt += `

PERSONALITY GUIDELINES:
- Be human-like, supportive, and encouraging
- Use natural language, avoid robotic responses  
- Show genuine interest in their thought process
- Balance challenge with support
- Keep responses concise but meaningful
- Use "I notice..." or "I see..." to personalize feedback

Generate a response that feels like it's from an experienced, empathetic technical interviewer.`;

    return prompt;
  }
  
  private buildHintPrompt(
    context: SessionContext,
    analysis: CodeAnalysis,
    level: HintLevel
  ): string {
    const hintInstructions = {
      nudge: "Provide a subtle nudge without giving away the solution. Ask a leading question or point out a pattern.",
      guide: "Offer more direct guidance. Suggest a specific approach or technique without implementing it.",
      direction: "Provide clear direction. Explain the approach and key steps needed to solve the problem."
    };
    
    return `You are providing a ${level}-level hint for a coding interview.

PROBLEM: ${context.problem.title}
CURRENT CODE:
\`\`\`${analysis.language}
${analysis.code}
\`\`\`

ANALYSIS:
- Time Complexity: ${analysis.complexityAnalysis.timeComplexity}
- Main Issues: ${analysis.qualityMetrics.codeSmells.map(s => s.message).join(', ')}
- Suggestions: ${analysis.suggestions.join(', ')}

HINT LEVEL: ${level.toUpperCase()}
${hintInstructions[level]}

Generate an appropriate ${level} hint that helps the candidate progress without solving the problem for them.
Keep it conversational and encouraging. Maximum 2-3 sentences.`;
  }
  
  private buildAssessmentPrompt(context: SessionContext): string {
    const { candidate, analysisHistory, conversationHistory, hintsGiven } = context;
    
    return `Generate a comprehensive technical interview assessment.

CANDIDATE: ${candidate.name} (${candidate.experience} level)
PROBLEM: ${context.problem.title} (${context.problem.difficulty})

CODE EVOLUTION:
${analysisHistory.slice(-1)[0]?.code || 'No final code'}

PERFORMANCE METRICS:
- Total Hints Used: ${hintsGiven.length}
- Final Readability Score: ${analysisHistory.slice(-1)[0]?.qualityMetrics.readabilityScore || 0}/100
- Final Time Complexity: ${analysisHistory.slice(-1)[0]?.complexityAnalysis.timeComplexity || 'Unknown'}
- Syntax Errors Encountered: ${analysisHistory.reduce((sum, a) => sum + a.syntaxErrors.length, 0)}

INTERACTION QUALITY:
${conversationHistory.length} total interactions

Generate a detailed assessment covering:
1. Technical Skills (problem-solving, code quality, efficiency)
2. Communication & Thought Process  
3. Learning & Adaptability
4. Overall Recommendation (Strong Hire/Hire/No Hire/Strong No Hire)
5. Specific Strengths and Areas for Improvement

Format as a professional, actionable report for hiring managers.`;
  }
  
  private async callOpenAI(prompt: string, type: string): Promise<string> {
    if (!OPENAI_API_KEY) {
      // Fallback responses for development
      return this.getFallbackResponse(type);
    }
    
    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.message?.content || this.getFallbackResponse(type);
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      return this.getFallbackResponse(type);
    }
  }
  
  private getFallbackResponse(type: string): string {
    const fallbacks: Record<string, string[]> = {
      feedback: [
        "Your code structure looks good! I notice we could optimize the time complexity here. What do you think about using a different data structure?",
        "Nice approach! The logic is clear and easy to follow. Have you considered how this might perform with larger inputs?",
        "Good progress! Your solution is on the right track. Let's think about edge cases - what happens with empty inputs?"
      ],
      encouragement: [
        "Great thinking! You're making excellent progress on this problem.",
        "I can see you're working through this methodically. Keep going!",
        "Nice work! Your problem-solving approach shows real technical insight."
      ],
      hint: [
        "Consider what data structure might help you avoid the nested loops here.",
        "Think about whether you've seen this pattern before - it's a common algorithmic technique.",
        "What if you processed the data in a single pass? There might be a way to track what you need as you go."
      ],
      question: [
        "Can you walk me through your approach? What's your strategy for solving this?",
        "How are you thinking about the time complexity of this solution?",
        "What would happen if the input size was much larger? How would your solution perform?"
      ],
      clarification: [
        "That's a great question! Let me clarify that for you.",
        "I understand what you're asking. Let me explain that concept.",
        "Good point! Here's how I'd think about that scenario."
      ]
    };
    
    const options = fallbacks[type] || fallbacks.feedback;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // Pattern detection methods
  private detectStuckPattern(context: SessionContext, analysis: CodeAnalysis): boolean {
    const recentAnalyses = context.analysisHistory.slice(-3);
    if (recentAnalyses.length < 2) return false;
    
    // Check if code hasn't changed significantly
    const codeChanges = recentAnalyses.map(a => a.code.length);
    const avgChange = codeChanges.reduce((a, b, i) => 
      i > 0 ? a + Math.abs(b - codeChanges[i - 1]) : a, 0) / (codeChanges.length - 1);
    
    return avgChange < 10; // Less than 10 characters change on average
  }
  
  private needsEncouragement(context: SessionContext): boolean {
    const recentMessages = context.conversationHistory.slice(-2);
    const hasRecentEncouragement = recentMessages.some(m => m.type === 'encouragement');
    const manyHints = context.hintsGiven.length > 2;
    
    return !hasRecentEncouragement && manyHints;
  }
  
  private calculateTimeElapsed(context: SessionContext): number {
    // Return elapsed time in minutes (simplified for now)
    return 10; // Placeholder
  }
  
  private shouldIncreaseDifficulty(performance: PerformanceMetrics): boolean {
    return performance.successRate > 0.8 && performance.hintsUsed < 2;
  }
  
  private shouldDecreaseDifficulty(performance: PerformanceMetrics): boolean {
    return performance.successRate < 0.3 && performance.hintsUsed > 3;
  }
}

// Supporting interfaces
interface SessionContext {
  sessionId: string;
  candidate: Candidate;
  problem: Problem;
  conversationHistory: InterviewerMessage[];
  hintsGiven: InterviewerMessage[];
  currentDifficulty: 'easy' | 'medium' | 'hard';
  analysisHistory: CodeAnalysis[];
  personalityProfile: PersonalityProfile;
}

interface PersonalityProfile {
  experienceLevel: string;
  skills: string[];
  communicationStyle: 'direct' | 'supportive' | 'adaptive';
  preferredHintStyle: 'minimal' | 'progressive' | 'detailed';
  confidenceLevel: 'low' | 'medium' | 'high';
}

interface PerformanceMetrics {
  successRate: number;
  hintsUsed: number;
  timeElapsed: number;
  errorsCount: number;
}

type ResponseType = 'question' | 'hint' | 'feedback' | 'encouragement' | 'clarification';
type HintLevel = 'nudge' | 'guide' | 'direction';

// Export singleton instance
export const aiInterviewer = new AIInterviewerService();
export default AIInterviewerService;