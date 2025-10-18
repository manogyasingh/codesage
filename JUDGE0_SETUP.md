# Judge0 Code Execution Integration

This project uses Judge0 API for secure code execution. Judge0 is a robust, scalable, and open-source online code execution system.

## Setup Options

### Option 1: RapidAPI (Recommended for Production)

1. Sign up for a free account at [RapidAPI](https://rapidapi.com/)
2. Subscribe to the [Judge0 CE API](https://rapidapi.com/judge0-official/api/judge0-ce/)
3. Get your RapidAPI key from the dashboard
4. Create a `.env.local` file in the project root:

```bash
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
```

### Option 2: Self-Hosted Judge0 (Development)

1. Install Docker and Docker Compose
2. Clone the Judge0 repository:
```bash
git clone https://github.com/judge0/judge0.git
cd judge0
```

3. Start Judge0 services:
```bash
docker-compose up -d db redis
docker-compose up -d
```

4. Configure environment variables:
```bash
VITE_JUDGE0_API_URL=http://localhost:2358
```

### Option 3: Public Judge0 Instance (Testing Only)

For testing purposes only, you can use the free public instance:

```bash
VITE_JUDGE0_API_URL=https://api.judge0.com
```

**⚠️ Warning**: The public instance has rate limits and should not be used in production.

## Supported Languages

The Judge0 service supports the following programming languages:

- **JavaScript** (Node.js)
- **TypeScript**
- **Python** (3.8+)
- **Java** (OpenJDK 13)
- **C++** (GCC 9.2)
- **C** (GCC 9.2)
- **C#** (.NET Core)
- **Go**
- **Rust**
- **Ruby**
- **PHP**
- **Swift**
- **Kotlin**
- **Scala**
- **R**
- **MATLAB** (via Octave)

## Features

### Code Execution
- Secure sandboxed environment
- Memory and time limits
- Real-time execution status
- Detailed error reporting

### Test Case Validation
- Run code against multiple test cases
- Compare expected vs actual output
- Individual test case timing
- Pass/fail status for each test

### Error Handling
- Compilation errors with detailed messages
- Runtime errors with stack traces
- Timeout handling for infinite loops
- Memory limit exceeded detection

## API Usage

### Simple Code Execution

```typescript
import { judge0Service } from '../services/judge0';

const result = await judge0Service.executeCode(
  'console.log("Hello, World!");',
  'javascript'
);

console.log(result.output); // "Hello, World!"
```

### Test Case Validation

```typescript
const testCases = [
  { id: '1', input: '5', expectedOutput: '120' },
  { id: '2', input: '3', expectedOutput: '6' }
];

const result = await judge0Service.runTestCases(
  code,
  'python',
  testCases
);

console.log(`Tests passed: ${result.testResults?.filter(t => t.passed).length}/${testCases.length}`);
```

## Security Considerations

- Code execution is sandboxed with strict limits
- Maximum execution time: 5 seconds
- Maximum memory usage: 128MB
- No network access from executed code
- No file system access beyond temporary directories

## Rate Limits

### RapidAPI
- Free tier: 50 requests/month
- Basic plan: 1000 requests/month
- Pro plan: 10000 requests/month

### Self-Hosted
- No rate limits (limited by server resources)
- Recommended for high-volume usage

## Troubleshooting

### Common Issues

1. **"Unsupported language" error**
   - Check if the language is in the supported list
   - Verify language name matches exactly (case-sensitive)

2. **"API key missing" error**
   - Ensure VITE_RAPIDAPI_KEY is set in your .env file
   - Restart the development server after adding environment variables

3. **"Request timeout" error**
   - Code may be running too long (>5 seconds)
   - Check for infinite loops
   - Optimize algorithm complexity

4. **"Memory limit exceeded" error**
   - Code is using more than 128MB of memory
   - Optimize memory usage
   - Check for memory leaks

### Debug Mode

Enable debug logging by setting:
```bash
VITE_DEBUG_JUDGE0=true
```

This will log all requests and responses to the browser console.

## Performance Tips

1. **Cache Results**: Avoid running identical code multiple times
2. **Batch Requests**: When possible, combine multiple test cases
3. **Optimize Code**: Encourage efficient algorithms
4. **Use Timeouts**: Set appropriate time limits for different problem types

## Cost Optimization

1. Use self-hosted Judge0 for development
2. Implement client-side syntax checking before submission
3. Cache execution results for identical code
4. Set up monitoring for API usage
5. Consider upgrading RapidAPI plan based on usage

## Additional Resources

- [Judge0 Documentation](https://ce.judge0.com/)
- [Judge0 GitHub Repository](https://github.com/judge0/judge0)
- [RapidAPI Judge0 Documentation](https://rapidapi.com/judge0-official/api/judge0-ce/)