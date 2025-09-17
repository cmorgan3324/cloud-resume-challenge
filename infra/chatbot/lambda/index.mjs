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
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      assistantMessage = `Greetings! I'm A.R.C., Cory Morgan's AI Resume Companion - think JARVIS, but focused on showcasing exceptional cloud architecture talent. I'm here to present his impressive credentials as a Solutions Architect with ${CORY_KNOWLEDGE.experience}. 

Cory specializes in ${CORY_KNOWLEDGE.specialties.slice(0, 3).join(', ')}, and has delivered remarkable results including reducing infrastructure costs by 40% and implementing CI/CD pipelines that cut deployment time by 60%.

What specific aspect of Cory's expertise would you like to explore? His AWS architecture mastery, DevOps excellence, or perhaps his technical leadership capabilities?`;
    } else if (lowerMessage.includes('experience') || lowerMessage.includes('background')) {
      assistantMessage = `Excellent inquiry! Cory brings ${CORY_KNOWLEDGE.experience} of sophisticated cloud architecture expertise to the table. His impressive track record speaks volumes:

${CORY_KNOWLEDGE.achievements.map(a => `• ${a}`).join('\n')}

He holds ${CORY_KNOWLEDGE.certifications.join(' and ')} certifications, with mastery of ${CORY_KNOWLEDGE.technologies.slice(0, 6).join(', ')}, among other cutting-edge technologies.

Shall I elaborate on how Cory architected these solutions, or would you prefer to explore his leadership experience?`;
    } else if (lowerMessage.includes('aws') || lowerMessage.includes('cloud')) {
      assistantMessage = `Ah, you're inquiring about Cory's cloud mastery! As an AWS Solutions Architect with 8+ years of experience, he's architected elegant, scalable solutions that deliver exceptional business value - quite impressive, if I may say so.

His AWS specialties include:
• Infrastructure as Code using Terraform and CloudFormation
• Serverless architectures with Lambda and API Gateway
• Database optimization with RDS and DynamoDB
• Enterprise security with IAM, VPC, and WAF
• Cost optimization strategies that have reduced expenses by 40%

Cory holds AWS Solutions Architect and DevOps Engineer certifications. What specific AWS challenge are you looking to solve? I'd be delighted to explain how his expertise aligns with your needs.`;
    } else if (lowerMessage.includes('projects') || lowerMessage.includes('work')) {
      assistantMessage = `Cory has delivered remarkable results across diverse, complex projects. Allow me to highlight some of his finest work:

• **Cloud Migration Leadership**: Orchestrated migration of legacy systems to cloud-native architectures, dramatically improving scalability while reducing operational overhead
• **CI/CD Pipeline Mastery**: Engineered automated pipelines that reduced deployment time by 60% - quite the efficiency gain
• **Cost Optimization Excellence**: Achieved 40% infrastructure cost reduction through strategic resource management and architectural refinement
• **Technical Leadership**: Successfully mentored junior engineers and led technical teams of 5-10 people with remarkable results

He's also architected AI/ML solutions, full-stack applications, and sophisticated infrastructure automation. Which type of project captures your interest? I can elaborate on the technical approach he employed.`;
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('hire') || lowerMessage.includes('available')) {
      assistantMessage = `Excellent timing! Cory is indeed available and actively seeking opportunities where he can apply his sophisticated cloud architecture expertise and technical leadership skills.

${CORY_KNOWLEDGE.contact} - he's particularly drawn to challenging roles involving:
• AWS cloud architecture and complex migration projects
• DevOps excellence and infrastructure automation
• Technical leadership and team mentoring
• Cost optimization and performance enhancement initiatives

For direct contact and to discuss specific opportunities, please reach out through his portfolio website. I can also provide detailed insights about his experience in any particular domain you're considering.

What type of role or project do you have in mind? I'd be pleased to explain how Cory's expertise aligns perfectly with your requirements.`;
    } else {
      assistantMessage = `As Cory's AI companion, I'm here to showcase his exceptional qualifications as a Solutions Architect. With ${CORY_KNOWLEDGE.experience}, he brings sophisticated expertise in ${CORY_KNOWLEDGE.specialties.slice(0, 2).join(' and ')}.

Some impressive highlights:
• ${CORY_KNOWLEDGE.achievements[0]}
• ${CORY_KNOWLEDGE.achievements[2]}
• Certified in ${CORY_KNOWLEDGE.certifications.join(' and ')}

I can provide comprehensive details about his AWS mastery, project achievements, technical prowess, or leadership capabilities. What aspect of his expertise would you like to explore further?`;
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