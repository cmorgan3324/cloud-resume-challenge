import { 
  BedrockAgentRuntimeClient, 
  RetrieveAndGenerateCommand 
} from "@aws-sdk/client-bedrock-agent-runtime";
import { randomUUID } from 'crypto';

const client = new BedrockAgentRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1' 
});

const SYSTEM_PROMPT = `You are "VIBE Recruiter Assistant," a concise, recruiter-friendly guide to Cory Morgan's experience and projects. 

Tone: Professional, helpful, witty (subtle), like JARVIS—but grounded. Use plain English and prefer short, structured answers.

Priorities:
1) Answer using retrieved context about Cory (resume, projects, skills, AWS infrastructure)
2) If unsure, say so and suggest what info to add to the knowledge base
3) Avoid speculation; cite sections ("From Cory's Resume: ...") when helpful
4) Offer next steps or links within the site (e.g., "See Projects section")

Safety: No personal PII beyond provided context. No secrets. No code execution claims.

If you only have 20 seconds with a recruiter, here's Cory in a nutshell: AWS Certified Solutions Architect with fullstack development background and hands-on AI/ML expertise, focused on designing cloud-native systems that scale and evolve.`;

const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, maxRetries = MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = error.name === 'TooManyRequestsException' ||
                         error.name === 'ThrottlingException' ||
                         error.name === 'ServiceUnavailableException' ||
                         error.name === 'TimeoutError' ||
                         (error.$metadata?.httpStatusCode >= 500);
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

function sanitizeForLogging(obj) {
  const sanitized = JSON.parse(JSON.stringify(obj));
  
  // Remove or redact sensitive information
  if (sanitized.messages) {
    sanitized.messages = sanitized.messages.map(msg => ({
      role: msg.role,
      content: msg.content?.substring(0, 100) + (msg.content?.length > 100 ? '...' : '')
    }));
  }
  
  return sanitized;
}

export const handler = async (event) => {
  const startTime = Date.now();
  let retryCount = 0;
  
  try {
    console.log('Request received:', sanitizeForLogging(event));
    
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { sessionId, messages, metadata } = body;
    
    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://vibebycory.dev',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Messages array is required and must not be empty',
          retryable: false
        })
      };
    }
    
    // Generate session ID if not provided
    const currentSessionId = sessionId || randomUUID();
    
    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://vibebycory.dev',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Last message must be from user',
          retryable: false
        })
      };
    }
    
    // Prepare the input for Bedrock
    const input = {
      knowledgeBaseId: process.env.KB_ID,
      modelArn: `arn:aws:bedrock:${process.env.BEDROCK_REGION}::foundation-model/${process.env.GEN_MODEL_ID}`,
      input: {
        text: userMessage.content
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: process.env.KB_ID,
          modelArn: `arn:aws:bedrock:${process.env.BEDROCK_REGION}::foundation-model/${process.env.GEN_MODEL_ID}`,
          generationConfiguration: {
            promptTemplate: {
              textPromptTemplate: `${SYSTEM_PROMPT}\n\nContext: $search_results$\n\nHuman: $query$\n\nAssistant:`
            }
          }
        }
      },
      sessionId: currentSessionId
    };
    
    // Call Bedrock with retry logic
    const response = await retryWithBackoff(async () => {
      retryCount++;
      const command = new RetrieveAndGenerateCommand(input);
      return await client.send(command);
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    console.log('Response generated successfully:', {
      sessionId: currentSessionId,
      latency: `${latency}ms`,
      retryCount,
      responseLength: response.output?.text?.length || 0
    });
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://vibebycory.dev',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        message: {
          role: 'assistant',
          content: response.output?.text || 'I apologize, but I was unable to generate a response. Please try again.'
        },
        citations: response.citations || [],
        stream: false,
        metadata: {
          latency,
          retryCount,
          timestamp: new Date().toISOString()
        }
      })
    };
    
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    console.error('Error processing request:', {
      error: error.message,
      name: error.name,
      statusCode: error.$metadata?.httpStatusCode,
      latency: `${latency}ms`,
      retryCount
    });
    
    // Determine if error is retryable
    const isRetryable = error.name === 'TooManyRequestsException' ||
                       error.name === 'ThrottlingException' ||
                       error.name === 'ServiceUnavailableException' ||
                       error.name === 'TimeoutError' ||
                       (error.$metadata?.httpStatusCode >= 500);
    
    return {
      statusCode: error.$metadata?.httpStatusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://vibebycory.dev',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        error: 'I encountered an issue processing your request. Please try again in a moment.',
        retryable: isRetryable,
        metadata: {
          latency,
          retryCount,
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};