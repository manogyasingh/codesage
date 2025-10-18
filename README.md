# CodeSage: AI Technical Interviewer

> **Building Intelligence That Evaluates Intelligence**

CodeSage is an AI-powered technical interviewer that conducts live, adaptive coding interviews with human-like insight. Built for the Eightfold AI × ArIES Hackathon.

## 🚀 Features

### 1. Real-time Code Analysis Engine
- **Live Code Tracking**: Continuously monitors code as it's written
- **Judge0 Integration**: Secure code execution using industry-standard Judge0 API
- **Multi-language Support**: Execute code in 15+ programming languages
- **Instant Error Detection**: Real-time syntax and runtime error identification
- **Performance Metrics**: Execution time, memory usage, and Big O complexity analysis
- **Test Case Validation**: Automatic validation against predefined test cases

### 2. Agentic Interviewer System
- **Dynamic Difficulty**: Adaptive problem complexity based on performance
- **Progressive Hints**: Three-tier hint system (Nudge → Guide → Direction)
- **Context-Aware Questions**: Intelligent follow-up questions based on code patterns
- **Natural Conversation**: Human-like interaction flow with voice integration

### 3. Code Quality Assessment
- **Style Analysis**: Adherence to coding standards (PEP 8, ESLint, etc.)
- **Readability Scoring**: Code clarity and maintainability assessment
- **Methodology Detection**: Problem-solving approach identification
- **Optimization Suggestions**: Performance improvement recommendations

### 4. Comprehensive Reporting
- **Visual Dashboard**: Clean, intuitive metrics presentation for hiring managers
- **Performance Summary**: Human-readable candidate evaluation reports
- **Session Playback**: Complete interview replay with code evolution timeline
- **Comparative Analysis**: Candidate ranking and skill comparison tools

### 5. Interactive User Experience
- **Intuitive Interface**: Seamless coding environment with real-time feedback
- **Voice Integration**: Audio input/output for natural conversation
- **Multi-language Support**: Support for Python, JavaScript, Java, C++, and more
- **Accessibility**: Screen reader compatible and keyboard navigation

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for responsive, utility-first styling
- **Monaco Editor** for advanced code editing with syntax highlighting
- **WebRTC** for real-time audio communication
- **Framer Motion** for smooth animations and transitions

### Backend Services
- **Supabase** for real-time database and authentication
- **Edge Functions** for AI processing and code analysis
- **WebSocket** connections for real-time communication
- **Docker** containers for secure code execution sandboxing

### AI & Analysis
- **OpenAI GPT-4** for intelligent interviewer responses
- **Custom AST Parser** for code structure analysis
- **Static Analysis Tools** (ESLint, Pylint) for quality assessment
- **Performance Profilers** for execution metrics

## 📊 Evaluation Metrics

| Dimension | Weight | Description |
|-----------|--------|-------------|
| **Conversational Intelligence** | 30% | Natural interaction, adaptive responses, context awareness |
| **Analysis & Feedback Quality** | 25% | Code assessment accuracy, hint relevance, insight depth |
| **Performance & Reliability** | 20% | System speed, stability, scalability, uptime |
| **User Experience** | 15% | Interface intuitiveness, accessibility, workflow efficiency |
| **Innovation & Creativity** | 10% | Novel features, creative solutions, technical excellence |

## 🎯 Key Differentiators

1. **Adaptive Intelligence**: Dynamic problem difficulty and personalized interview flow
2. **Multi-modal Interaction**: Seamless text and voice communication
3. **Real-time Analysis**: Instant code quality and performance feedback
4. **Comprehensive Assessment**: Beyond correctness to problem-solving methodology
5. **Scalable Architecture**: Handles hundreds of concurrent interviews
6. **Bias Mitigation**: Consistent, objective evaluation criteria

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account for database services
- OpenAI API key for AI functionality
- RapidAPI account for Judge0 code execution (or self-hosted Judge0)

### Installation
```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Build for production  
npm run build
```

### Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key

# Judge0 Code Execution (Choose one option)
# Option 1: RapidAPI (Recommended)
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_JUDGE0_API_URL=http://localhost:3258

# Option 2: Self-hosted Judge0
# VITE_JUDGE0_API_URL=http://localhost:2358
# VITE_JUDGE0_API_KEY=your_api_key_here
```

> 📖 **Judge0 Setup**: For detailed instructions on setting up Judge0 for code execution, see [JUDGE0_SETUP.md](./JUDGE0_SETUP.md)

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── interview/        # Interview-specific components
│   ├── dashboard/        # Admin dashboard components
│   ├── common/          # Shared components
│   └── ui/              # Base UI components
├── services/            # API and external service integrations
│   ├── supabase.ts      # Database client
│   ├── ai-interviewer.ts # AI service integration
│   └── code-analysis.ts  # Code evaluation engine
├── hooks/               # Custom React hooks
├── utils/               # Utility functions and helpers
├── types/               # TypeScript type definitions
└── pages/               # Route components
    ├── Interview.tsx     # Main interview interface
    ├── Dashboard.tsx     # Admin/HR dashboard
    └── Reports.tsx       # Detailed reporting view
```

## 🎮 Usage Flow

### Quick Demo
1. **Launch Application**: `npm run dev` and visit `http://localhost:5173`
2. **Try Judge0 Demo**: Click "Launch Demo" to test code execution
3. **Test Different Languages**: Switch between JavaScript, Python, Java, etc.
4. **Experience Features**: Real-time execution, error handling, and test validation

### For Candidates
1. **Join Interview**: Enter session code or direct link
2. **Voice Setup**: Audio/microphone permission and testing
3. **Problem Introduction**: AI explains the coding challenge
4. **Live Coding**: Real-time code analysis and feedback with Judge0 execution
5. **Interactive Discussion**: Voice-based Q&A and hints
6. **Session Complete**: Final assessment and next steps

### For Interviewers/HR
1. **Create Session**: Set up interview parameters and problems
2. **Monitor Live**: Real-time candidate performance tracking
3. **View Analysis**: Comprehensive code quality metrics
4. **Generate Report**: Automated assessment summary
5. **Review Playback**: Complete session replay and analysis

## 🔒 Security & Privacy

- **Sandboxed Execution**: Isolated code execution environment
- **Data Encryption**: End-to-end encryption for all communications
- **GDPR Compliance**: Privacy-first data handling and storage
- **Access Controls**: Role-based permissions and authentication
- **Audit Logging**: Complete interview session tracking

## 📈 Performance Optimization

- **Code Splitting**: Lazy loading for optimal bundle sizes
- **WebSocket Pooling**: Efficient real-time connection management  
- **Caching Strategy**: Smart caching for repeated analysis patterns
- **CDN Integration**: Global content delivery for low latency
- **Progressive Enhancement**: Graceful degradation for various devices
