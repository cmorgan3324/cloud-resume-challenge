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
    return "Hi there! I'm A.R.C., Cory Morgan's resume companion. Ask me anything about his work.";
  }
  
  const openings = [
    "Absolutely—happy to help.",
    "Great question.",
    "Here's the quick version.",
    "Let me walk you through it.",
    "Glad you asked."
  ];
  
  return openings[Math.floor(Math.random() * openings.length)];
}

// Response functions
const stackAnswer = (state) => `${getOpening(state)}

Here's how Cory likes to build software:
• Core tools: AWS (S3, Lambda, DynamoDB, API Gateway), Python, Node.js, React, Terraform
• Focus areas: Serverless architecture, cost optimization, RAG/vector search
• Credential: AWS Solutions Architect – Associate (earned May 2025)

Happy to dive deeper into anything that catches your eye.`;

const awsAnswer = (state) => `${getOpening(state)}

Here's the shape of Cory's AWS experience (about 1–2 years hands-on):
• Infrastructure: Terraform IaC and serverless-first architectures
• Cost wins: Keeps portfolio projects under $1/month to run
• Deployment: Took CI/CD from 50 seconds down to ~20 seconds with a 60% cost drop
• Daily drivers: Lambda, API Gateway, DynamoDB, S3, and CloudFront

Want to explore one of those services in more detail?`;

const projectsAnswer = (state) => `${getOpening(state)}

A few projects recruiters usually ask about:
• AWS Cloud Resume – serverless portfolio that stays under $1/month while deploying in ~20 seconds
• AI FAQ Search – semantic search stack with Weaviate and OpenAI, runs for about $7–8/month
• Monarch Finance App – hackathon AI assistant that connects PostgreSQL with OpenAI
• Video Segmentation – YOLOv8 converted to ONNX for near real-time inference

Let me know which one you'd like to unpack.`;

const fallbackAnswer = (state) => `${getOpening(state)}

I can dig into Cory's AWS experience, showcase his projects, or outline his technical stack. Just tell me where you’d like to start.`;

// Intake system functions
const startIntake = (state) => {
  state.intakeStep = 1;
  state.intakeData = {};
  
  return `${getOpening(state)}

Sounds like there's an opportunity—great news. I'll grab a few details so Cory can follow up quickly.

Step 1 of 8: What's your name?`;
};

const continueIntake = (state, userInput) => {
  const fieldName = intakeFields[state.intakeStep - 1];
  state.intakeData[fieldName] = userInput.trim();
  
  if (state.intakeStep < intakeFields.length) {
    state.intakeStep++;
    const questions = {
      2: "What's your email address?",
      3: "Which company are you with, and what's your role?",
      4: "Where is the work based (remote, hybrid, onsite, and city)?",
      5: "When would you like someone to start?",
      6: "What salary range should Cory keep in mind?",
      7: "Any key technical requirements or must-have skills?",
      8: "Do you have any questions you'd like Cory to cover when he reaches out?"
    };
    
    return `Step ${state.intakeStep} of 8: ${questions[state.intakeStep]}`;
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
      return `All set—thanks for the details. I've shared everything with Cory at ${INTAKE_EMAIL}.

What happens next:
• He’ll review within the next 24–48 hours
• Expect his first response via email
• He’ll suggest a time to connect once he’s had a look

Looking forward to getting you two in touch!`;
    } else {
      return `I captured your answers, but the email didn't go through.

Backup plan:
• Copy of what you shared: ${JSON.stringify(state.intakeData, null, 2)}
• Please email Cory directly at ${INTAKE_EMAIL}
• Mention that A.R.C. collected your details just now

Sorry for the detour—thanks for your patience.`;
    }
  } catch (error) {
    console.error('Intake completion error:', error);
    return `Looks like something went wrong on my side. Please send Cory an email at ${INTAKE_EMAIL} with the details below so nothing gets lost.

Your responses: ${JSON.stringify(state.intakeData, null, 2)}`;
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
    // Handle CORS preflight - API Gateway v2 uses requestContext.http.method
    const httpMethod = event.requestContext?.http?.method || event.httpMethod;
    
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://vibebycory.dev',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Max-Age': '86400'
        },
        body: ''
      };
    }

    if (httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': 'https://vibebycory.dev',
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
          'Access-Control-Allow-Origin': 'https://vibebycory.dev',
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
          'Access-Control-Allow-Origin': 'https://vibebycory.dev',
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
        'Access-Control-Allow-Origin': 'https://vibebycory.dev',
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
        'Access-Control-Allow-Origin': 'https://vibebycory.dev',
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
