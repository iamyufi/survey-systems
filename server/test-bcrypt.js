const bcrypt = require('bcrypt');

// The hash from your .env file
const storedHash = '$2b$10$3qrQN6TTVKcH7eXHsZxDwuNNLf1CzlExXxVFsrXX3F3Jj9R8ybVbq';
const password = 'admin123';

async function testHash() {
  try {
    // Test if the current hash works
    const isMatch = await bcrypt.compare(password, storedHash);
    console.log('Using stored hash:');
    console.log('Password:', password);
    console.log('Hash:', storedHash);
    console.log('Is match:', isMatch);
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(password, 10);
    console.log('\nGenerated new hash:');
    console.log('New hash:', newHash);
    
    // Test the new hash
    const newIsMatch = await bcrypt.compare(password, newHash);
    console.log('Is match with new hash:', newIsMatch);
  } catch (error) {
    console.error('Error:', error);
  }
}

testHash();