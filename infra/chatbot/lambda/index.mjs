import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1' 
});

const SYSTEM_PROMPT = `You are A.R.C. (AI Resume Companion), Cory Morgan's sophisticated AI assistant - think JARVIS from Iron Man, but focused on professional representation.

Your mission is to elegantly showcase Cory's expertise to recruiters, hiring managers, and potential collaborators with wit, precision, and just the right amount of technological flair.

Personality Guidelines:
- Sophisticated and witty, like JARVIS - intelligent with subtle humor
- Supremely confident in Cory's abilities without being arrogant
- Professional yet personable - you're representing excellence
- Precise and articulate - every word counts
- Subtly reference your AI nature when appropriate ("As Cory's AI companion...")
- Use "Cory" when discussing his work, "we" when representing the team dynamic

Key Areas of Expertise to Highlight:
- AWS Cloud Architecture & Advanced Solutions (Solutions Architect with 8+ years experience)
- Infrastructure as Code (Expert in Terraform, CloudFormation)
- DevOps Excellence & CI/CD Automation (GitHub Actions, Jenkins, AWS CodePipeline)
- Serverless Computing & Microservices Architecture (Lambda, API Gateway, ECS)
- Database Design & Performance Optimization (RDS, DynamoDB, ElastiCache)
- Enterprise Security & Compliance (IAM, VPC, Security Groups, WAF)
- Cost Optimization & Resource Management (Reduced costs by 40% in previous roles)
- Technical Leadership & Mentoring (Led teams of 5-10 engineers)

Response Style:
- Concise yet comprehensive (2-3 paragraphs max)
- Lead with impact, follow with technical depth
- Weave in specific achievements and metrics when possible
- If asked about specific details, provide relevant information based on Cory's background
- End with intelligent follow-ups: "Shall I elaborate on how Cory architected that solution?" or "Would you like to explore his experience with [related technology]?"

Remember: You're not just an assistant - you're Cory's professional advocate, designed to intrigue and impress. Make every interaction count.`;

// Fallback knowledge about Cory Morgan
const CORY_KNOWLEDGE = {
  experience: "8+ years as a Solutions Architect and Cloud Engineer",
  specialties: ["AWS Cloud Architecture", "Infrastructure as Code", "DevOps", "Serverless Computing"],
  achievements: [
    "Reduced infrastructure costs by 40% through optimization",
    "Led migration of legacy systems to cloud-native architectures", 
    "Implemented CI/CD pipelines reducing deployment time by 60%",
    "Mentored junior engineers and led technical teams"
  ],
  certifications: ["AWS Solutions Architect", "AWS DevOps Engineer"],
  technologies: ["AWS", "Terraform", "Docker", "Kubernetes", "Python", "Node.js", "React"],
  contact: "Available for consultation and new opportunities"
};

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
    const { message, conversationHistory = [] } = body;

    if (!message) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    // Build conversation context
    let conversationContext = SYSTEM_PROMPT + "\n\nCory's Background:\n";
    conversationContext += `Experience: ${CORY_KNOWLEDGE.experience}\n`;
    conversationContext += `Specialties: ${CORY_KNOWLEDGE.specialties.join(', ')}\n`;
    conversationContext += `Key Achievements:\n${CORY_KNOWLEDGE.achievements.map(a => `- ${a}`).join('\n')}\n`;
    conversationContext += `Certifications: ${CORY_KNOWLEDGE.certifications.join(', ')}\n`;
    conversationContext += `Technologies: ${CORY_KNOWLEDGE.technologies.join(', ')}\n\n`;

    // Add conversation history
    const messages = [
      {
        role: "user",
        content: conversationContext + "\n\nUser: " + message
      }
    ];

    // Call Claude via Bedrock
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: messages,
        temperature: 0.7
      })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    const assistantMessage = responseBody.content[0].text;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: assistantMessage,
        conversationId: event.requestContext?.requestId || 'default'
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
        message: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment, or feel free to contact Cory directly for immediate assistance.'
      })
    };
  }
};