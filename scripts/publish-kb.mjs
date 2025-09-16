#!/usr/bin/env node

import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { BedrockAgentClient, StartIngestionJobCommand, GetIngestionJobCommand } from '@aws-sdk/client-bedrock-agent';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'vibebycory-resume-content';
const KB_PREFIX = 'kb/';
const LOCAL_KB_DIR = join(__dirname, '..', 'kb');

// Initialize AWS clients
const s3Client = new S3Client({ region: REGION });
const bedrockClient = new BedrockAgentClient({ region: REGION });

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.md', '.txt', '.json', '.pdf'];

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (SUPPORTED_EXTENSIONS.includes(extname(file).toLowerCase())) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function getContentType(filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentTypes = {
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.pdf': 'application/pdf'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function uploadFileToS3(localPath, s3Key) {
  try {
    const fileContent = readFileSync(localPath);
    const contentType = getContentType(localPath);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileContent,
      ContentType: contentType,
      Metadata: {
        'uploaded-by': 'publish-kb-script',
        'upload-timestamp': new Date().toISOString()
      }
    });
    
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to upload ${localPath} to ${s3Key}:`, error.message);
    return false;
  }
}

async function syncKnowledgeBase() {
  console.log('🔄 Starting knowledge base sync...');
  console.log(`📁 Local directory: ${LOCAL_KB_DIR}`);
  console.log(`☁️  S3 destination: s3://${BUCKET_NAME}/${KB_PREFIX}`);
  
  // Get all local files
  const localFiles = getAllFiles(LOCAL_KB_DIR);
  console.log(`📄 Found ${localFiles.length} files to sync`);
  
  let uploadedCount = 0;
  let failedCount = 0;
  
  // Upload each file
  for (const localPath of localFiles) {
    const relativePath = relative(LOCAL_KB_DIR, localPath);
    const s3Key = KB_PREFIX + relativePath.replace(/\\/g, '/'); // Normalize path separators
    
    console.log(`⬆️  Uploading: ${relativePath} -> ${s3Key}`);
    
    const success = await uploadFileToS3(localPath, s3Key);
    if (success) {
      uploadedCount++;
      console.log(`✅ Uploaded: ${relativePath}`);
    } else {
      failedCount++;
      console.log(`❌ Failed: ${relativePath}`);
    }
  }
  
  console.log(`\n📊 Upload Summary:`);
  console.log(`   ✅ Successful: ${uploadedCount}`);
  console.log(`   ❌ Failed: ${failedCount}`);
  console.log(`   📄 Total: ${localFiles.length}`);
  
  return { uploadedCount, failedCount, totalFiles: localFiles.length };
}

async function getKnowledgeBaseId() {
  // Try to get KB ID from environment variable first
  const kbId = process.env.KB_ID;
  if (kbId) {
    console.log(`🔍 Using Knowledge Base ID from environment: ${kbId}`);
    return kbId;
  }
  
  // If not available, we'll need to get it from Terraform output or user input
  console.log('⚠️  KB_ID not found in environment variables.');
  console.log('   Please set KB_ID environment variable or run this after Terraform deployment.');
  return null;
}

async function startIngestion(kbId, dataSourceId) {
  try {
    console.log(`🚀 Starting ingestion job for Knowledge Base: ${kbId}`);
    
    const command = new StartIngestionJobCommand({
      knowledgeBaseId: kbId,
      dataSourceId: dataSourceId,
      description: `Automated ingestion job started by publish-kb script at ${new Date().toISOString()}`
    });
    
    const response = await bedrockClient.send(command);
    console.log(`✅ Ingestion job started: ${response.ingestionJob.ingestionJobId}`);
    
    return response.ingestionJob.ingestionJobId;
  } catch (error) {
    console.error('❌ Failed to start ingestion job:', error.message);
    throw error;
  }
}

async function waitForIngestion(kbId, jobId, maxWaitTime = 600000) { // 10 minutes max
  console.log(`⏳ Waiting for ingestion job to complete: ${jobId}`);
  
  const startTime = Date.now();
  const pollInterval = 10000; // 10 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    try {
      const command = new GetIngestionJobCommand({
        knowledgeBaseId: kbId,
        dataSourceId: process.env.DATA_SOURCE_ID, // This should be set or discovered
        ingestionJobId: jobId
      });
      
      const response = await bedrockClient.send(command);
      const status = response.ingestionJob.status;
      
      console.log(`📊 Ingestion status: ${status}`);
      
      if (status === 'COMPLETE') {
        console.log('✅ Ingestion completed successfully!');
        return true;
      } else if (status === 'FAILED') {
        console.error('❌ Ingestion failed:', response.ingestionJob.failureReasons);
        return false;
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
    } catch (error) {
      console.error('Error checking ingestion status:', error.message);
      // Continue polling unless it's a critical error
      if (error.name === 'ResourceNotFoundException') {
        console.error('❌ Knowledge Base or Data Source not found');
        return false;
      }
    }
  }
  
  console.log('⏰ Ingestion job timed out');
  return false;
}

async function main() {
  try {
    console.log('🤖 VIBE Knowledge Base Publisher');
    console.log('================================\n');
    
    // Step 1: Sync files to S3
    const syncResult = await syncKnowledgeBase();
    
    if (syncResult.failedCount > 0) {
      console.log('\n⚠️  Some files failed to upload. Continuing with ingestion...');
    }
    
    // Step 2: Get Knowledge Base ID
    const kbId = await getKnowledgeBaseId();
    if (!kbId) {
      console.log('\n⚠️  Skipping ingestion - Knowledge Base ID not available');
      console.log('   Files have been uploaded to S3. Run ingestion manually or set KB_ID environment variable.');
      process.exit(0);
    }
    
    // Step 3: Start ingestion (if we have the data source ID)
    const dataSourceId = process.env.DATA_SOURCE_ID;
    if (!dataSourceId) {
      console.log('\n⚠️  DATA_SOURCE_ID not found in environment variables.');
      console.log('   Files uploaded to S3. Please trigger ingestion manually from AWS Console.');
      console.log(`   Knowledge Base ID: ${kbId}`);
      process.exit(0);
    }
    
    const jobId = await startIngestion(kbId, dataSourceId);
    
    // Step 4: Wait for completion
    const success = await waitForIngestion(kbId, jobId);
    
    if (success) {
      console.log('\n🎉 Knowledge Base update completed successfully!');
      console.log('   Your chatbot now has access to the latest content.');
    } else {
      console.log('\n❌ Knowledge Base update failed or timed out.');
      console.log('   Please check the AWS Console for more details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}