// Test script to verify Replicate API token and version
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

// Print environment variables (without sensitive values)
console.log('Environment variables:');
console.log('REPLICATE_FLUX_VERSION:', process.env.REPLICATE_FLUX_VERSION);
console.log('REPLICATE_API_TOKEN:', process.env.REPLICATE_API_TOKEN ? '[REDACTED]' : 'Not set');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

// The expected full version ID
const version = process.env.REPLICATE_FLUX_VERSION || 'ostris/flux-dev-lora-trainer:4ffd32160efd92e56d9c538a8bffca5be03f791f6d8011f3e20beaf6a';

async function testReplicateAuth() {
  try {
    console.log('\nTesting Replicate authentication...');
    const response = await axios.get('https://api.replicate.com/v1/models', {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    });
    console.log('✅ Authentication successful. API token is valid.');
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

async function testVersionExists() {
  try {
    // Extract owner/name from full version ID
    const [owner, name] = version.split('/');
    const modelName = name.split(':')[0];
    
    console.log(`\nTesting if model ${owner}/${modelName} exists...`);
    
    const response = await axios.get(`https://api.replicate.com/v1/models/${owner}/${modelName}`, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
      },
    });
    
    console.log('✅ Model exists:', response.data.name);
    
    // Check for the specific version
    const versionId = version.split(':')[1];
    if (versionId) {
      console.log(`\nChecking if specific version exists: ${versionId}...`);
      
      // Get versions of the model
      const versionsResponse = await axios.get(`https://api.replicate.com/v1/models/${owner}/${modelName}/versions`, {
        headers: {
          Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });
      
      const foundVersion = versionsResponse.data.results.find(v => v.id === versionId);
      
      if (foundVersion) {
        console.log('✅ Version exists:', foundVersion.id);
        console.log('   Created at:', foundVersion.created_at);
        console.log('   Visibility:', foundVersion.visibility);
        return true;
      } else {
        console.error('❌ Version not found:', versionId);
        console.log('Available versions:');
        versionsResponse.data.results.slice(0, 5).forEach(v => {
          console.log(`- ${v.id} (created: ${v.created_at})`);
        });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Model check failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

async function main() {
  const authOk = await testReplicateAuth();
  
  if (authOk) {
    await testVersionExists();
  }
  
  console.log('\nTest completed.');
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 