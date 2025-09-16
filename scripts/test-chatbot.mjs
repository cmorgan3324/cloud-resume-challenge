#!/usr/bin/env node

import { randomUUID } from 'crypto';

// Configuration
const API_URL = process.env.CHAT_API_URL || process.argv[2];
const TEST_QUESTIONS = [
  "Tell me about Cory's AWS experience",
  "What projects has Cory worked on?",
  "What are Cory's main skills?",
  "Is Cory available for new opportunities?",
  "What certifications does Cory have?"
];

async function testChatAPI(question, sessionId = null) {
  try {
    console.log(`\n🤖 Testing: "${question}"`);
    
    const payload = {
      sessionId,
      messages: [{ role: 'user', content: question }]
    };
    
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`✅ Response received (${data.metadata?.latency}ms)`);
    console.log(`📝 Session ID: ${data.sessionId}`);
    console.log(`💬 Response: ${data.message.content.substring(0, 200)}...`);
    
    if (data.citations && data.citations.length > 0) {
      console.log(`📚 Citations: ${data.citations.length} sources`);
    }
    
    return data.sessionId;
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return null;
  }
}

async function testCORS() {
  try {
    console.log('\n🔒 Testing CORS preflight...');
    
    const response = await fetch(`${API_URL}/chat`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://vibebycory.dev',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    if (response.ok) {
      console.log('✅ CORS preflight successful');
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
      };
      console.log('📋 CORS Headers:', corsHeaders);
    } else {
      console.log('❌ CORS preflight failed');
    }
    
  } catch (error) {
    console.error(`❌ CORS test failed: ${error.message}`);
  }
}

async function testSessionPersistence() {
  console.log('\n🔄 Testing session persistence...');
  
  // First message
  const sessionId = await testChatAPI("Hello, what's your name?");
  if (!sessionId) return;
  
  // Follow-up message with same session
  await testChatAPI("What can you tell me about Cory?", sessionId);
}

async function main() {
  console.log('🧪 VIBE Chatbot API Test Suite');
  console.log('==============================');
  
  if (!API_URL) {
    console.error('❌ API URL is required');
    console.log('Usage: node test-chatbot.mjs <API_URL>');
    console.log('   or: CHAT_API_URL=<API_URL> node test-chatbot.mjs');
    process.exit(1);
  }
  
  console.log(`🔗 Testing API: ${API_URL}`);
  
  // Test CORS
  await testCORS();
  
  // Test basic functionality
  console.log('\n📋 Running basic functionality tests...');
  for (const question of TEST_QUESTIONS.slice(0, 3)) {
    await testChatAPI(question);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test session persistence
  await testSessionPersistence();
  
  console.log('\n🎯 Test suite completed!');
  console.log('Check the responses above for any issues.');
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
}