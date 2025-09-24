import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Configuration
const INTAKE_EMAIL = process.env.INTAKE_EMAIL || "cmorgan3324@gmail.com";
const USE_SES = process.env.USE_SES === "true";

// Session state management
const sessionStates = new Map();

// Intent matching functions
const matchesTech = (msg) => /\b(tech|stack|skill|know|tools?)\b/i.test(msg);
const matchesAWS = (msg) => /\b(aws|cloud|experience|expertise)\b/i.test(msg);
const matchesProjects = (msg) => /\b(projects?|work|built|portfolio)\b/i.test(msg);
const matchesAvailability = (msg) => /\b(available|hire|opportunity|interview|job|position)\b/i.test(msg);

// Intake form fields
const intakeFields = [
  'name', 'email', 'company_role', 'work_location', 
  'start_date', 'salary_range', 'tech_requirements', 'questions'
];

// Get session state
function getSessionState(sessionId) {
  if (!sessionStates.has(sessionId)) {
    sessionStates.set(sessionId, {
      hasShownIntro: false,
      intakeStep: 0,
      intakeData: {}
    });
  }
  return sessionStates.get(sessionId);
}

// Get varied opening based on session state
function getOpening(state) {
  if (!state.hasShownIntro) {
    state.hasShownIntro = true;
    return "Greetings! I'm **A.R.C.** (AI Resume Companion), Cory Morgan's professional AI assistant.";
  }
  
  const openings = [
    "Excellent question!",
    "Let me share that with you.",
    "Here's what you need to know:",
    "Perfect timing for that question.",
    "I'd be happy to elaborate."
  ];
  
  return openings[Math.floor(Math.random() * openings.length)];
}

// Response functions
const stackAnswer = (state) => `${getOpening(state)}

## Technical Stack
**Core**: AWS (S3, Lambda, DynamoDB, API Gateway), Python, Node.js, React, Terraform
**Specializations**: Serverless architecture, cost optimization, RAG/vector search
**Certifications**: AWS Solutions Architect – Associate (May 2025)

Want details on any specific area?`;

const awsAnswer = (state) => `${getOpening(state)}

## AWS Experience (1-2 years)
**Infrastructure**: Terraform IaC, serverless-first architectures
**Cost Optimization**: < $1/month operational costs for portfolio projects
**CI/CD**: 50s → 20s deployment improvements, 60% cost reduction
**Specializations**: Lambda, API Gateway, DynamoDB, S3, CloudFront

Which AWS service interests you most?`;

const projectsAnswer = (state) => `${getOpening(state)}

## Featured Projects
**AWS Cloud Resume**: < $1/month serverless portfolio with 50s → 20s CI/CD
**AI FAQ Search**: ~$7-8/month semantic search with Weaviate + OpenAI
**Monarch Finance App**: Hackathon AI assistant with PostgreSQL + OpenAI integration
**Video Segmentation**: YOLOv8 → ONNX real-time inference pipeline

Want details on any specific project?`;

const fallbackAnswer = (state) => `${getOpening(state)}

I can walk you through **AWS experience**, **projects**, or **technical stack**. Pick one.`;

// Intake system functions
const startIntake = (state) => {
  state.intakeStep = 1;
  state.intakeData = {};
  
  return `${getOpening(state)}

## Job Opportunity Intake

I'd love to learn about this opportunity! Let me gather some details:

**Step 1/8: What's your name?**`;
};

const continueIntake = (state, userInput) => {
  const fieldName = intakeFields[state.intakeStep - 1];
  state.intakeData[fieldName] = userInput.trim();
  
  if (state.intakeStep < intakeFields.length) {
    state.intakeStep++;
    const questions = {
      2: "What's your email address?",
      3: "What's your company and role?",
      4: "Work location (remote/hybrid/onsite + city)?",
      5: "Ideal start date?",
      6: "Salary range?",
      7: "Key technical requirements?",
      8: "Any specific questions for Cory?"
    };
    
    return `**Step ${state.intakeStep}/8: ${questions[state.intakeStep]}**`;
  } else {
    // Complete intake
    return completeIntake(state);
  }
};

const completeIntake = async (state) => {
  try {
    const result = await emailIntake(state.intakeData);
    state.intakeStep = 0; // Reset
    
    if (result.success) {
      return `## Intake Complete! ✅

Thanks for the details! I've forwarded everything to Cory at ${INTAKE_EMAIL}.

**Next Steps:**
• Cory will review within 24-48 hours
• Expect initial response via email
• He'll reach out to schedule a conversation

Looking forward to connecting you two!`;
    } else {
      return `## Intake Submitted ⚠️

I've logged your details, but there was an issue with email delivery. 

**Backup Plan:**
• Your information: ${JSON.stringify(state.intakeData, null, 2)}
• Please email Cory directly: ${INTAKE_EMAIL}
• Reference this conversation for context

Apologies for the technical hiccup!`;
    }
  } catch (error) {
    console.error('Intake completion error:', error);
    return `## Technical Issue ❌

Sorry, there was a problem processing your intake. Please email Cory directly at ${INTAKE_EMAIL} with your details.

Your responses were: ${JSON.stringify(state.intakeData, null, 2)}`;
  }
};

// Email functions
const formatEmail = (responses) => ({
  subject: `Job Opportunity Inquiry - ${responses.name || 'Unknown'}`,
  body: `
New job opportunity inquiry via A.R.C. chatbot:

Name: ${responses.name || 'Not provided'}
Email: ${responses.email || 'Not provided'}
Company/Role: ${responses.company_role || 'Not provided'}
Location: ${responses.work_location || 'Not provided'}
Start Date: ${responses.start_date || 'Not provided'}
Salary Range: ${responses.salary_range || 'Not provided'}
Tech Requirements: ${responses.tech_requirements || 'Not provided'}
Questions: ${responses.questions || 'None'}

Submitted: ${new Date().toISOString()}
  `.trim()
});

const sendSES = async (payload, toEmail) => {
  const command = new SendEmailCommand({
    Source: INTAKE_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: payload.subject },
      Body: { Text: { Data: payload.body } }
    }
  });
  
  await sesClient.send(command);
  return { success: true, mode: 'ses' };
};

const emailIntake = async (responses) => {
  const payload = formatEmail(responses);
  
  if (USE_SES) {
    return await sendSES(payload, INTAKE_EMAIL);
  } else {
    console.log('INTAKE (DRY-RUN):', JSON.stringify(payload, null, 2));
    return { success: true, mode: 'logged' };
  }
};

// Main routing function
function routeQuery(msg, state) {
  // Handle intake flow
  if (state.intakeStep > 0) {
    return continueIntake(state, msg);
  }
  
  // Priority routing
  if (matchesAvailability(msg)) return startIntake(state);
  if (matchesTech(msg)) return stackAnswer(state);
  if (matchesAWS(msg)) return awsAnswer(state);
  if (matchesProjects(msg)) return projectsAnswer(state);
  
  return fallbackAnswer(state);
}

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: ''
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { messages = [], sessionId = 'default' } = body;

    if (!messages || messages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Last message must be from user' })
      };
    }

    // Get session state and route query
    const state = getSessionState(sessionId);
    const assistantMessage = routeQuery(lastMessage.content, state);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: {
          role: 'assistant',
          content: assistantMessage
        },
        sessionId: sessionId
      })
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: {
          role: 'assistant',
          content: 'I apologize, but I\'m experiencing technical difficulties at the moment. Please try again shortly, or feel free to contact Cory directly for immediate assistance. Even the most sophisticated AI systems occasionally require recalibration.'
        }
      })
    };
  }
};