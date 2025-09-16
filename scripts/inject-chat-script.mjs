#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SCRIPT_TAG = '<script defer src="/chatbot.js"></script>';
const SCRIPT_COMMENT = '<!-- VIBE Chatbot Script -->';
const FULL_INJECTION = `${SCRIPT_COMMENT}\n    ${SCRIPT_TAG}`;

function findHtmlFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip certain directories
      if (!['node_modules', '.git', '.terraform', 'infra'].includes(file)) {
        findHtmlFiles(filePath, fileList);
      }
    } else if (extname(file).toLowerCase() === '.html') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function injectChatbotScript(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    
    // Check if script is already injected
    if (content.includes('chatbot.js') || content.includes('VIBE Chatbot Script')) {
      console.log(`⏭️  Skipping ${filePath} - chatbot script already present`);
      return false;
    }
    
    // Find the closing </body> tag
    const bodyCloseIndex = content.lastIndexOf('</body>');
    if (bodyCloseIndex === -1) {
      console.log(`⚠️  Warning: No </body> tag found in ${filePath}`);
      return false;
    }
    
    // Inject the script before </body>
    const beforeBody = content.substring(0, bodyCloseIndex);
    const afterBody = content.substring(bodyCloseIndex);
    
    // Add proper indentation
    const indentation = '    '; // 4 spaces
    const injectedContent = `${beforeBody}${indentation}${FULL_INJECTION}\n${indentation}${afterBody}`;
    
    // Write the modified content back
    writeFileSync(filePath, injectedContent, 'utf8');
    console.log(`✅ Injected chatbot script into ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to process ${filePath}:`, error.message);
    return false;
  }
}

function createChatbotConfig(apiUrl) {
  const configPath = join(__dirname, '..', 'public', 'chatbot.config.json');
  const config = {
    apiUrl: apiUrl,
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
  
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Created chatbot config: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create chatbot config:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🤖 VIBE Chatbot Script Injector');
  console.log('===============================\n');
  
  // Get API URL from environment or command line
  const apiUrl = process.env.CHAT_API_URL || process.argv[2];
  
  if (!apiUrl) {
    console.error('❌ API URL is required');
    console.log('Usage: node inject-chat-script.mjs <API_URL>');
    console.log('   or: CHAT_API_URL=<API_URL> node inject-chat-script.mjs');
    process.exit(1);
  }
  
  console.log(`🔗 API URL: ${apiUrl}`);
  
  // Create chatbot config file
  const configCreated = createChatbotConfig(apiUrl);
  if (!configCreated) {
    console.log('⚠️  Failed to create config file, but continuing...');
  }
  
  // Find all HTML files in the project
  const projectRoot = join(__dirname, '..');
  const htmlFiles = findHtmlFiles(projectRoot);
  
  console.log(`\n📄 Found ${htmlFiles.length} HTML files:`);
  htmlFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  console.log('\n🔄 Injecting chatbot script...');
  
  let injectedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  
  // Process each HTML file
  for (const filePath of htmlFiles) {
    const result = injectChatbotScript(filePath);
    if (result === true) {
      injectedCount++;
    } else if (result === false && !filePath.includes('chatbot')) {
      // Only count as skipped if it's not a chatbot-related file
      const content = readFileSync(filePath, 'utf8');
      if (content.includes('chatbot.js')) {
        skippedCount++;
      } else {
        failedCount++;
      }
    }
  }
  
  console.log(`\n📊 Injection Summary:`);
  console.log(`   ✅ Injected: ${injectedCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📄 Total: ${htmlFiles.length}`);
  
  if (injectedCount > 0) {
    console.log('\n🎉 Chatbot script injection completed!');
    console.log('   The chatbot widget will now appear on all pages.');
  } else if (skippedCount === htmlFiles.length) {
    console.log('\n✨ All HTML files already have the chatbot script.');
  } else {
    console.log('\n⚠️  Some files could not be processed.');
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}