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
  experience: "1+ years as a Solutions Architect and Cloud Engineer",
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
    const { messages = [], sessionId } = body;

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

    // For now, provide a fallback response until Bedrock model access is enabled
    let assistantMessage;
    
    // Simple keyword-based responses
    const lowerMessage = lastMessage.content.toLowerCase();
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('hire') || lowerMessage.includes('available') || lowerMessage.includes('opportunity') || lowerMessage.includes('job')) {
      assistantMessage = `Excellent timing! Cory is actively seeking new opportunities.

**${CORY_KNOWLEDGE.contact}**

He's particularly interested in:
• AWS cloud architecture & migration projects
• DevOps & infrastructure automation  
• Technical leadership roles
• Cost optimization initiatives

Contact him through his portfolio website to discuss opportunities. What type of role interests you?`;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      assistantMessage = `Greetings! I'm A.R.C., Cory Morgan's AI Resume Companion.

**Quick Overview:**
• ${CORY_KNOWLEDGE.experience} as Solutions Architect
• Reduced infrastructure costs by 40%
• Cut deployment time by 60% with CI/CD
• Expert in ${CORY_KNOWLEDGE.specialties.slice(0, 3).join(', ')}

What would you like to know? His AWS expertise, projects, or availability?`;
    } else if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      assistantMessage = `**Cory's Experience (${CORY_KNOWLEDGE.experience}):**

${CORY_KNOWLEDGE.achievements.map(a => `• ${a}`).join('\n')}

**Certifications:** ${CORY_KNOWLEDGE.certifications.join(' & ')}
**Technologies:** ${CORY_KNOWLEDGE.technologies.slice(0, 6).join(', ')}

Want details on specific projects or technical skills?`;
    } else if (lowerMessage.includes('aws') || lowerMessage.includes('cloud')) {
      assistantMessage = `**Cory's AWS Expertise (8+ years):**

• **Infrastructure as Code:** Terraform & CloudFormation
• **Serverless:** Lambda, API Gateway, Step Functions
• **Databases:** RDS, DynamoDB optimization
• **Security:** IAM, VPC, WAF implementation
• **Cost Optimization:** 40% expense reduction achieved

**Certifications:** AWS Solutions Architect & DevOps Engineer

What specific AWS challenge can he help solve?`;
    } else if (lowerMessage.includes('projects') || lowerMessage.includes('work')) {
      assistantMessage = `**Key Project Highlights:**

• **Cloud Migration:** Led legacy-to-cloud transformations with improved scalability
• **CI/CD Automation:** Built pipelines reducing deployment time by 60%
• **Cost Optimization:** Achieved 40% infrastructure cost reduction
• **Team Leadership:** Mentored teams of 5-10 engineers
• **AI/ML Solutions:** Architected intelligent automation systems

Which project type interests you most?`;

    } else if (lowerMessage.includes('skill') || lowerMessage.includes('technology') || lowerMessage.includes('tech')) {
      assistantMessage = `**Cory's Technical Stack:**

**Core Technologies:** ${CORY_KNOWLEDGE.technologies.join(', ')}

**Specializations:** ${CORY_KNOWLEDGE.specialties.join(', ')}

**Certifications:** ${CORY_KNOWLEDGE.certifications.join(' & ')}

**Strengths:** Infrastructure design, cost optimization, performance enhancement

Need details on any specific technology?`;
    } else {
      assistantMessage = `I'm A.R.C., Cory's AI Resume Companion. Here's what I can help with:

**Quick Facts:**
• ${CORY_KNOWLEDGE.experience} Solutions Architect
• ${CORY_KNOWLEDGE.achievements[0]}
• ${CORY_KNOWLEDGE.achievements[2]}
• ${CORY_KNOWLEDGE.certifications.join(' & ')} certified

**Ask me about:** AWS expertise, projects, skills, or availability.`;
    }

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
        sessionId: sessionId || event.requestContext?.requestId || 'default'
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