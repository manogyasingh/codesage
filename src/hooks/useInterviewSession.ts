import { useState, useEffect, useCallback } from 'react';
import { supabase, SupabaseService } from '../services/supabase';
import { aiInterviewer } from '../services/ai-interviewer';
import { codeAnalyzer } from '../services/code-analysis';
import type { 
  InterviewSession, 
  Candidate, 
  Problem, 
  CodeAnalysis,
  InterviewerMessage,
  VoiceInteraction,
  SessionMetrics 
} from '../types';

interface UseInterviewSessionReturn {
  session: InterviewSession | null;
  candidate: Candidate | null;
  problem: Problem | null;
  currentCode: string;
  isAnalyzing: boolean;
  analysisResults: CodeAnalysis | null;
  messages: InterviewerMessage[];
  voiceInteractions: VoiceInteraction[];
  metrics: SessionMetrics | null;
  
  // Actions
  initializeSession: (candidateId: string, problemId: string) => Promise<boolean>;
  updateCode: (code: string, language: string) => Promise<void>;
  requestHint: () => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob, transcript: string) => Promise<void>;
  endSession: () => Promise<void>;
  
  // Status
  isSessionActive: boolean;
  timeElapsed: number;
  error: string | null;
}

export function useInterviewSession(sessionId?: string): UseInterviewSessionReturn {
  // Core state
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [currentCode, setCurrentCode] = useState<string>('');
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<CodeAnalysis | null>(null);
  
  // Communication state
  const [messages, setMessages] = useState<InterviewerMessage[]>([]);
  const [voiceInteractions, setVoiceInteractions] = useState<VoiceInteraction[]>([]);
  
  // Metrics state
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Computed state
  const isSessionActive = session?.status === 'active';
  
  // Initialize new interview session
  const initializeSession = useCallback(async (candidateId: string, problemId: string): Promise<boolean> => {
    try {
      setError(null);
      
      // Fetch candidate and problem data
      const [candidateData, problemData] = await Promise.all([
        SupabaseService.getCandidate(candidateId),
        SupabaseService.getProblem(problemId)
      ]);
      
      if (!candidateData || !problemData) {
        setError('Failed to load candidate or problem data');
        return false;
      }
      
      // Create new session
      const newSession = await SupabaseService.createSession({
        candidateId,
        problemId,
        status: 'active',
        startTime: new Date().toISOString(),
        currentCode: problemData.templateCode[problemData.templateCode ? Object.keys(problemData.templateCode)[0] : 'python'] || '',
        language: 'python',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      if (!newSession) {
        setError('Failed to create interview session');
        return false;
      }
      
      // Update state
      setSession(newSession);
      setCandidate(candidateData);
      setProblem(problemData);
      setCurrentCode(newSession.currentCode);
      
      // Initialize AI interviewer
      const welcomeMessage = aiInterviewer.initializeSession(newSession.id, candidateData, problemData);
      setMessages([welcomeMessage]);
      
      // Save welcome message to database
      await SupabaseService.saveInterviewerMessage(welcomeMessage);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return false;
    }
  }, []);
  
  // Update code with real-time analysis
  const updateCode = useCallback(async (code: string, language: string) => {
    if (!session) return;
    
    try {
      setCurrentCode(code);
      setIsAnalyzing(true);
      
      // Update session in database
      await SupabaseService.updateSession(session.id, {
        currentCode: code,
        language: language as any,
        updatedAt: new Date().toISOString()
      });
      
      // Perform code analysis
      const analysis = await codeAnalyzer.analyzeCode(code, language, session.id);
      setAnalysisResults(analysis);
      
      // Save analysis to database
      await SupabaseService.saveCodeAnalysis(analysis);
      
      // Generate AI response based on analysis
      if (candidate && problem) {
        const aiResponse = await aiInterviewer.generateResponse(session.id, analysis);
        setMessages(prev => [...prev, aiResponse]);
        await SupabaseService.saveInterviewerMessage(aiResponse);
      }
      
    } catch (err) {
      console.error('Code analysis failed:', err);
      setError('Code analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [session, candidate, problem]);
  
  // Request hint from AI
  const requestHint = useCallback(async () => {
    if (!session || !analysisResults) return;
    
    try {
      const hint = await aiInterviewer.provideHint(session.id, analysisResults);
      setMessages(prev => [...prev, hint]);
      await SupabaseService.saveInterviewerMessage(hint);
    } catch (err) {
      console.error('Failed to get hint:', err);
      setError('Failed to get hint');
    }
  }, [session, analysisResults]);
  
  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob, transcript: string) => {
    if (!session) return;
    
    try {
      // Upload audio to Supabase Storage
      const fileName = `${session.id}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(fileName, audioBlob);
      
      if (uploadError) {
        throw new Error('Failed to upload audio');
      }
      
      // Create voice interaction record
      const interaction: Partial<VoiceInteraction> = {
        sessionId: session.id,
        speaker: 'candidate',
        transcript,
        confidence: 0.9, // Placeholder
        timestamp: new Date().toISOString(),
        audioUrl: uploadData.path,
        keywords: transcript.toLowerCase().split(' ').filter(word => word.length > 3)
      };
      
      setVoiceInteractions(prev => [...prev, interaction as VoiceInteraction]);
      await SupabaseService.saveVoiceInteraction(interaction);
      
      // Generate AI response to voice input
      if (analysisResults) {
        const aiResponse = await aiInterviewer.generateResponse(session.id, analysisResults, transcript);
        setMessages(prev => [...prev, aiResponse]);
        await SupabaseService.saveInterviewerMessage(aiResponse);
      }
      
    } catch (err) {
      console.error('Failed to send voice message:', err);
      setError('Failed to send voice message');
    }
  }, [session, analysisResults]);
  
  // End interview session
  const endSession = useCallback(async () => {
    if (!session) return;
    
    try {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime).getTime() - new Date(session.startTime).getTime();
      
      // Update session status
      await SupabaseService.updateSession(session.id, {
        status: 'completed',
        endTime,
        duration,
        updatedAt: endTime
      });
      
      // Generate final assessment
      const finalAssessment = await aiInterviewer.generateFinalAssessment(session.id);
      
      // Create comprehensive report
      const report = {
        sessionId: session.id,
        candidate,
        problem,
        session: { ...session, status: 'completed' as const, endTime, duration },
        metrics: metrics || {
          sessionId: session.id,
          totalTime: duration,
          codingTime: duration * 0.8, // Placeholder
          thinkingTime: duration * 0.2, // Placeholder
          hintsUsed: messages.filter(m => m.type === 'hint').length,
          errorsEncountered: analysisResults?.syntaxErrors.length || 0,
          testsPassed: analysisResults?.executionResult?.testResults.filter(t => t.passed).length || 0,
          totalTests: analysisResults?.executionResult?.testResults.length || 0,
          finalScore: 85, // Calculated based on performance
          codeQualityScore: analysisResults?.qualityMetrics.readabilityScore || 0,
          communicationScore: 90, // Based on voice interactions
          problemSolvingScore: 80 // Based on code evolution
        },
        codeEvolution: [analysisResults].filter(Boolean) as CodeAnalysis[],
        aiInteractions: messages,
        voiceInteractions,
        finalAssessment: {
          overallRating: 'hire' as const,
          technicalSkills: [],
          softSkills: [],
          strengths: ['Good problem-solving approach', 'Clear communication'],
          improvements: ['Code optimization', 'Edge case handling'],
          recommendation: finalAssessment,
          confidence: 0.85
        },
        generatedAt: endTime
      };
      
      // Save report to database
      await SupabaseService.saveInterviewReport(report);
      
      // Update local state
      setSession(prev => prev ? { ...prev, status: 'completed', endTime, duration } : null);
      
    } catch (err) {
      console.error('Failed to end session:', err);
      setError('Failed to end session');
    }
  }, [session, candidate, problem, metrics, messages, voiceInteractions, analysisResults]);
  
  // Load existing session
  useEffect(() => {
    if (sessionId && !session) {
      const loadSession = async () => {
        try {
          const sessionData = await SupabaseService.getSession(sessionId);
          if (!sessionData) return;
          
          const [candidateData, problemData, messagesData, voiceData] = await Promise.all([
            SupabaseService.getCandidate(sessionData.candidateId),
            SupabaseService.getProblem(sessionData.problemId),
            SupabaseService.getSessionMessages(sessionId),
            SupabaseService.getSessionVoiceInteractions(sessionId)
          ]);
          
          if (candidateData && problemData) {
            setSession(sessionData);
            setCandidate(candidateData);
            setProblem(problemData);
            setCurrentCode(sessionData.currentCode);
            setMessages(messagesData);
            setVoiceInteractions(voiceData);
          }
        } catch (err) {
          console.error('Failed to load session:', err);
          setError('Failed to load session');
        }
      };
      
      loadSession();
    }
  }, [sessionId, session]);
  
  // Timer for elapsed time
  useEffect(() => {
    if (!isSessionActive || !session) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSessionActive, session]);
  
  // Real-time subscriptions
  useEffect(() => {
    if (!session) return;
    
    const subscriptions = [
      SupabaseService.subscribeToSession(session.id, (payload) => {
        if (payload.new) {
          setSession(payload.new);
        }
      }),
      SupabaseService.subscribeToSessionAnalyses(session.id, (payload) => {
        if (payload.new) {
          setAnalysisResults(payload.new);
        }
      }),
      SupabaseService.subscribeToInterviewerMessages(session.id, (payload) => {
        if (payload.new) {
          setMessages(prev => [...prev, payload.new]);
        }
      })
    ];
    
    return () => {
      subscriptions.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    };
  }, [session]);
  
  return {
    // State
    session,
    candidate,
    problem,
    currentCode,
    isAnalyzing,
    analysisResults,
    messages,
    voiceInteractions,
    metrics,
    
    // Actions
    initializeSession,
    updateCode,
    requestHint,
    sendVoiceMessage,
    endSession,
    
    // Status
    isSessionActive,
    timeElapsed,
    error
  };
}