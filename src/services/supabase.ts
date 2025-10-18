import { createClient } from '@supabase/supabase-js';
import { MockDataGenerator } from './mockData';
import type { 
  InterviewSession, 
  Candidate, 
  Problem, 
  CodeAnalysis,
  InterviewerMessage,
  VoiceInteraction,
  InterviewReport 
} from '../types';


// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// For demo purposes, use mock client if no credentials are provided
const isDemoMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl === '' || supabaseAnonKey === '';

let supabase: any;

if (isDemoMode) {
  // Mock Supabase client for demo mode
  console.log('Running in demo mode - Supabase operations will be mocked');
  
  // Create mock subscription object
  const createMockSubscription = () => ({
    on: (event: string, config: any, callback: Function) => ({
      subscribe: () => ({
        unsubscribe: () => Promise.resolve({ error: null })
      })
    }),
    subscribe: () => ({
      unsubscribe: () => Promise.resolve({ error: null })
    }),
    unsubscribe: () => Promise.resolve({ error: null })
  });

  supabase = {
    auth: {
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      insert: () => ({ 
        select: () => ({ 
          single: () => Promise.resolve({ data: null, error: null }) 
        }) 
      }),
      select: () => ({ 
        eq: () => ({ 
          single: () => Promise.resolve({ data: null, error: null }) 
        }) 
      }),
      update: () => ({ 
        eq: () => Promise.resolve({ data: null, error: null }) 
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ error: null }) 
      }),
    }),
    // Mock real-time functionality
    channel: (channelName: string) => {
      console.log(`Demo mode: Creating mock channel "${channelName}"`);
      return createMockSubscription();
    },
    removeChannel: () => Promise.resolve({ error: null }),
    removeAllChannels: () => Promise.resolve({ error: null })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// Export isDemoMode for other services to use
export { isDemoMode };

// Auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signUp: async (email: string, password: string, metadata?: any) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: metadata }
    });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getCurrentUser: () => {
    return supabase.auth.getUser();
  }
};

// Database operations
export class SupabaseService {
  // Interview Sessions
  static async createSession(session: Partial<InterviewSession>): Promise<InterviewSession | null> {
    if (isDemoMode) {
      // Return mock session in demo mode
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      return MockDataGenerator.generateMockSession(session);
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    
    return data;
  }
  
  static async getSession(sessionId: string): Promise<InterviewSession | null> {
    if (isDemoMode) {
      // Return mock session in demo mode
      await new Promise(resolve => setTimeout(resolve, 200));
      return MockDataGenerator.generateMockSession({ id: sessionId });
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    return data;
  }
  
  static async updateSession(sessionId: string, updates: Partial<InterviewSession>) {
    if (isDemoMode) {
      // Simulate update success in demo mode
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Demo mode: Session updated', sessionId, updates);
      return true;
    }

    const { error } = await supabase
      .from('interview_sessions')
      .update(updates)
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error updating session:', error);
      return false;
    }
    
    return true;
  }
  
  static async getActiveSessions(): Promise<InterviewSession[]> {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('status', 'active')
      .order('startTime', { ascending: false });
    
    if (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }
    
    return data || [];
  }
  
  // Candidates
  static async createCandidate(candidate: Partial<Candidate>): Promise<Candidate | null> {
    const { data, error } = await supabase
      .from('candidates')
      .insert(candidate)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating candidate:', error);
      return null;
    }
    
    return data;
  }
  
  static async getCandidate(candidateId: string): Promise<Candidate | null> {
    if (isDemoMode) {
      // Return mock candidate in demo mode
      await new Promise(resolve => setTimeout(resolve, 150));
      return MockDataGenerator.generateMockCandidate({ id: candidateId });
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();
    
    if (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }
    
    return data;
  }
  
  // Problems
  static async getProblems(): Promise<Problem[]> {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('difficulty', { ascending: true });
    
    if (error) {
      console.error('Error fetching problems:', error);
      return [];
    }
    
    return data || [];
  }
  
  static async getProblem(problemId: string): Promise<Problem | null> {
    if (isDemoMode) {
      // Return mock problem in demo mode
      await new Promise(resolve => setTimeout(resolve, 100));
      return MockDataGenerator.generateMockProblem();
    }

    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', problemId)
      .single();
    
    if (error) {
      console.error('Error fetching problem:', error);
      return null;
    }
    
    return data;
  }
  
  // Code Analysis
  static async saveCodeAnalysis(analysis: Partial<CodeAnalysis>): Promise<boolean> {
    const { error } = await supabase
      .from('code_analyses')
      .insert(analysis);
    
    if (error) {
      console.error('Error saving code analysis:', error);
      return false;
    }
    
    return true;
  }
  
  static async getSessionAnalyses(sessionId: string): Promise<CodeAnalysis[]> {
    const { data, error } = await supabase
      .from('code_analyses')
      .select('*')
      .eq('sessionId', sessionId)
      .order('timestamp', { ascending: true });
    
    if (error) {
      console.error('Error fetching session analyses:', error);
      return [];
    }
    
    return data || [];
  }
  
  // AI Interviewer Messages
  static async saveInterviewerMessage(message: Partial<InterviewerMessage>): Promise<boolean> {
    const { error } = await supabase
      .from('interviewer_messages')
      .insert(message);
    
    if (error) {
      console.error('Error saving interviewer message:', error);
      return false;
    }
    
    return true;
  }
  
  static async getSessionMessages(sessionId: string): Promise<InterviewerMessage[]> {
    const { data, error } = await supabase
      .from('interviewer_messages')
      .select('*')
      .eq('sessionId', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching session messages:', error);
      return [];
    }
    
    return data || [];
  }

  // Voice Interactions
  static async saveVoiceInteraction(interaction: Partial<VoiceInteraction>): Promise<boolean> {
    const { error } = await supabase
      .from('voice_interactions')
      .insert(interaction);

    if (error) {
      console.error('Error saving voice interaction:', error);
      return false;
    }
    
    return true;
  }

  static async getSessionVoiceInteractions(sessionId: string): Promise<VoiceInteraction[]> {
    const { data, error } = await supabase
      .from('voice_interactions')
      .select('*')
      .eq('sessionId', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching voice interactions:', error);
      return [];
    }
    
    return data || [];
  }

  // Interview Reports
  static async saveInterviewReport(report: Partial<InterviewReport>): Promise<boolean> {
    const { error } = await supabase
      .from('interview_reports')
      .insert(report);

    if (error) {
      console.error('Error saving interview report:', error);
      return false;
    }
    
    return true;
  }

  static async getInterviewReport(sessionId: string): Promise<InterviewReport | null> {
    const { data, error } = await supabase
      .from('interview_reports')
      .select('*')
      .eq('sessionId', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching interview report:', error);
      return null;
    }
    
    return data;
  }

  // Real-time subscriptions
  static subscribeToSession(sessionId: string, callback: (payload: any) => void) {
    if (isDemoMode) {
      console.log(`Demo mode: Subscribing to session ${sessionId}`);
      // Return mock subscription that matches Supabase's interface
      return {
        unsubscribe: () => {
          console.log(`Demo mode: Unsubscribing from session ${sessionId}`);
          return Promise.resolve({ error: null });
        }
      };
    }

    return supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'interview_sessions',
        filter: `id=eq.${sessionId}`
      }, callback)
      .subscribe();
  }

  static subscribeToSessionAnalyses(sessionId: string, callback: (payload: any) => void) {
    if (isDemoMode) {
      console.log(`Demo mode: Subscribing to session analyses ${sessionId}`);
      return {
        unsubscribe: () => {
          console.log(`Demo mode: Unsubscribing from session analyses ${sessionId}`);
          return Promise.resolve({ error: null });
        }
      };
    }

    return supabase
      .channel(`analyses-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'code_analyses',
        filter: `sessionId=eq.${sessionId}`
      }, callback)
      .subscribe();
  }

  static subscribeToInterviewerMessages(sessionId: string, callback: (payload: any) => void) {
    if (isDemoMode) {
      console.log(`Demo mode: Subscribing to interviewer messages ${sessionId}`);
      return {
        unsubscribe: () => {
          console.log(`Demo mode: Unsubscribing from interviewer messages ${sessionId}`);
          return Promise.resolve({ error: null });
        }
      };
    }

    return supabase
      .channel(`messages-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'interviewer_messages',
        filter: `sessionId=eq.${sessionId}`
      }, callback)
      .subscribe();
  }
}

// WebSocket-style real-time events
export const realtimeEvents = {
  joinSession: (sessionId: string) => {
    return supabase.channel(`session-${sessionId}`);
  },
  
  sendCodeUpdate: async (sessionId: string, code: string, language: string) => {
    const channel = supabase.channel(`session-${sessionId}`);
    return channel.send({
      type: 'broadcast',
      event: 'code-update',
      payload: { code, language, timestamp: new Date().toISOString() }
    });
  },
  
  sendVoiceMessage: async (sessionId: string, audioData: Blob) => {
    // Upload audio to storage first
    const fileName = `${sessionId}-${Date.now()}.webm`;
    const { data: uploadData, error } = await supabase.storage
      .from('voice-recordings')
      .upload(fileName, audioData);
    
    if (error) {
      console.error('Error uploading audio:', error);
      return false;
    }
    
    const channel = supabase.channel(`session-${sessionId}`);
    return channel.send({
      type: 'broadcast',
      event: 'voice-message',
      payload: { audioUrl: uploadData.path, timestamp: new Date().toISOString() }
    });
  }
};

export default SupabaseService;
