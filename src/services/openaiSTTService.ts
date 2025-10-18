// OpenAI Speech-to-Text Service using Whisper API
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export class OpenAISTTService {
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private onTranscript: ((transcript: string, isFinal: boolean) => void) | null = null;
    private isRecording = false;
    private transcriptionInterval: number | null = null;

    constructor() {
        if (!OPENAI_API_KEY) {
            console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment.');
        }
    }

    async startListening(onTranscript: (transcript: string, isFinal: boolean) => void): Promise<boolean> {
        if (!OPENAI_API_KEY) {
            console.error('OpenAI API key not configured');
            return false;
        }

        try {
            // Get user media
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            this.onTranscript = onTranscript;
            this.audioChunks = [];

            // Create MediaRecorder with appropriate format
            const options = { mimeType: 'audio/webm;codecs=opus' };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.warn('Preferred audio format not supported, using default');
                this.mediaRecorder = new MediaRecorder(this.stream);
            } else {
                this.mediaRecorder = new MediaRecorder(this.stream, options);
            }

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                if (this.audioChunks.length > 0) {
                    await this.transcribeAudio();
                }
            };

            this.mediaRecorder.start();
            this.isRecording = true;

            // Set up periodic transcription (every 3 seconds for interim results)
            this.transcriptionInterval = window.setInterval(() => {
                if (this.isRecording && this.mediaRecorder?.state === 'recording') {
                    this.requestInterimTranscription();
                }
            }, 3000);

            return true;
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            return false;
        }
    }

    stopListening(): void {
        this.isRecording = false;

        if (this.transcriptionInterval) {
            clearInterval(this.transcriptionInterval);
            this.transcriptionInterval = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    // Force an immediate interim transcription of the current buffered audio
    // Returns the interim text if available, otherwise null
    async flushInterim(): Promise<string | null> {
        if (!this.isRecording || this.audioChunks.length === 0) return null;
        try {
            const tempChunks = [...this.audioChunks];
            const audioBlob = new Blob(tempChunks, { type: 'audio/webm' });
            if (audioBlob.size < 8000) return null;
            const transcript = await this.transcribeBlob(audioBlob);
            if (transcript && this.onTranscript) {
                this.onTranscript(transcript, false);
            }
            return transcript || null;
        } catch (e) {
            console.error('Error flushing interim transcription:', e);
            return null;
        }
    }

    private async requestInterimTranscription(): Promise<void> {
        if (!this.isRecording || this.audioChunks.length === 0) return;

        try {
            // Create a temporary recording for interim transcription
            const tempChunks = [...this.audioChunks];
            const audioBlob = new Blob(tempChunks, { type: 'audio/webm' });

            // Only transcribe if we have enough audio (at least 1 second)
            if (audioBlob.size < 4000) return; // Lower threshold for faster interim updates

            const transcript = await this.transcribeBlob(audioBlob);
            if (transcript && this.onTranscript) {
                this.onTranscript(transcript, false); // false = interim result
            }
        } catch (error) {
            console.error('Error getting interim transcription:', error);
        }
    }

    private async transcribeAudio(): Promise<void> {
        if (this.audioChunks.length === 0) return;

        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const transcript = await this.transcribeBlob(audioBlob);

            if (transcript && this.onTranscript) {
                this.onTranscript(transcript, true); // true = final result
            }
        } catch (error) {
            console.error('Error transcribing audio:', error);
        } finally {
            this.audioChunks = [];
        }
    }

    private async transcribeBlob(audioBlob: Blob): Promise<string> {
        try {
            // Convert webm to a format that OpenAI accepts (wav or mp3)
            const audioFile = await this.convertToCompatibleFormat(audioBlob);

            const formData = new FormData();
            formData.append('file', audioFile, 'audio.wav');
            formData.append('model', 'whisper-1');
            formData.append('language', 'en');
            formData.append('response_format', 'json');

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            return data.text || '';
        } catch (error) {
            console.error('Error calling OpenAI Whisper API:', error);
            throw error;
        }
    }

    private async convertToCompatibleFormat(webmBlob: Blob): Promise<Blob> {
        return new Promise((resolve) => {
            try {
                // Create audio context for format conversion
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const fileReader = new FileReader();

                fileReader.onload = async (e) => {
                    try {
                        const arrayBuffer = e.target?.result as ArrayBuffer;
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                        // Convert to WAV format
                        const wavBuffer = this.audioBufferToWav(audioBuffer);
                        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

                        resolve(wavBlob);
                    } catch (error) {
                        console.warn('Format conversion failed, using original blob:', error);
                        resolve(webmBlob); // Fallback to original format
                    }
                };

                fileReader.onerror = () => {
                    console.warn('FileReader error, using original blob');
                    resolve(webmBlob); // Fallback to original format
                };

                fileReader.readAsArrayBuffer(webmBlob);
            } catch (error) {
                console.warn('Audio conversion not supported, using original format:', error);
                resolve(webmBlob); // Fallback to original format
            }
        });
    }

    private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        const channels = buffer.numberOfChannels;
        let offset = 0;
        let pos = 0;

        // Write WAV header
        const setUint16 = (data: number) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };

        const setUint32 = (data: number) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // RIFF identifier 'RIFF'
        setUint32(0x46464952);
        // File length minus RIFF identifier length and file description length
        setUint32(36 + length * 2);
        // RIFF type 'WAVE'
        setUint32(0x45564157);
        // Format chunk identifier 'fmt '
        setUint32(0x20746d66);
        // Format chunk length
        setUint32(16);
        // Sample format (raw)
        setUint16(1);
        // Channel count
        setUint16(channels);
        // Sample rate
        setUint32(sampleRate);
        // Byte rate (sample rate * block align)
        setUint32(sampleRate * 2);
        // Block align (channel count * bytes per sample)
        setUint16(2);
        // Bits per sample
        setUint16(16);
        // Data chunk identifier 'data'
        setUint32(0x61746164);
        // Data chunk length
        setUint32(length * 2);

        // Write audio data
        const channelData = buffer.getChannelData(0);
        offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }

        return arrayBuffer;
    }

    isListening(): boolean {
        return this.isRecording;
    }
}

// Create singleton instance
export const openaiSTTService = new OpenAISTTService();