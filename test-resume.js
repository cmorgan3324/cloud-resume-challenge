#!/usr/bin/env node

/**
 * Simple test script to verify resume page accessibility
 */

const https = require('https');

const RESUME_URL = 'https://vibebycory.dev/resume/index.html';

function testResumeAccess() {
  console.log('Testing resume page accessibility...');
  console.log(`URL: ${RESUME_URL}`);
  
  const request = https.get(RESUME_URL, (response) => {
    console.log(`Status Code: ${response.statusCode}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Resume page is accessible!');
      
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        // Check for key content
        const hasTitle = data.includes('Cory Morgan | AWS Certified Solutions Architect');
        const hasContent = data.includes('Technical Skills');
        const hasCSS = data.includes('vibebycory-theme.css');
        
        console.log(`✅ Title present: ${hasTitle}`);
        console.log(`✅ Content present: ${hasContent}`);
        console.log(`✅ CSS reference present: ${hasCSS}`);
        
        if (hasTitle && hasContent && hasCSS) {
          console.log('🎉 Resume page test PASSED!');
        } else {
          console.log('❌ Resume page test FAILED - missing content');
        }
      });
    } else {
      console.log(`❌ Resume page test FAILED - HTTP ${response.statusCode}`);
    }
  });
  
  request.on('error', (error) => {
    console.log(`❌ Resume page test FAILED - Network error: ${error.message}`);
  });
  
  request.setTimeout(10000, () => {
    console.log('❌ Resume page test FAILED - Request timeout');
    request.destroy();
  });
}

// Run the test
testResumeAccess();