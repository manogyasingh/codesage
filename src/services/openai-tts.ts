// OpenAI Text-to-Speech Service
export interface OpenAITTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  model?: 'tts-1' | 'tts-1-hd';
}

export class OpenAITTSService {
  private apiKey: string;
  private baseUrl: string;
  private currentAudio: HTMLAudioElement | null = null;
  private onSpeakingChange?: (speaking: boolean) => void;

  constructor(apiKey: string, baseUrl: string = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Set callback for speaking state changes
   */
  setOnSpeakingChange(callback: (speaking: boolean) => void): void {
    this.onSpeakingChange = callback;
  }

  /**
   * Convert text to speech using OpenAI TTS API
   */
  async speak(text: string, options: OpenAITTSOptions = {}): Promise<void> {
    try {
      // Stop any currently playing audio
      this.stop();

      const {
        voice = 'nova',
        speed = 1.0,
        model = 'tts-1'
      } = options;

      // Call OpenAI TTS API
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          speed,
          response_format: 'mp3'
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText}`);
      }

      // Get audio blob from response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio element
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      // Set up event listeners
      audio.onloadstart = () => {
        this.onSpeakingChange?.(true);
      };

      audio.onended = () => {
        this.onSpeakingChange?.(false);
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      audio.onerror = () => {
        this.onSpeakingChange?.(false);
        URL.revokeObjectURL(audioUrl);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        console.error('Error playing TTS audio');
      };

      // Play the audio
      await audio.play();

    } catch (error) {
      this.onSpeakingChange?.(false);
      console.error('OpenAI TTS error:', error);
      
      // Fallback to browser TTS if available
      if ('speechSynthesis' in window) {
        console.warn('Falling back to browser speech synthesis');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => this.onSpeakingChange?.(true);
        utterance.onend = () => this.onSpeakingChange?.(false);
        window.speechSynthesis.speak(utterance);
      } else {
        throw error;
      }
    }
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.onSpeakingChange?.(false);
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  /**
   * Check if TTS service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }
}

// Create default instance with environment configuration
const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
export const openaiTTSService = new OpenAITTSService(apiKey);

export default OpenAITTSService;