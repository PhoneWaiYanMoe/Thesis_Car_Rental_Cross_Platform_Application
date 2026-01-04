// Backend/tests/generate-keys.js
// Run this to generate encryption keys for your .env file

const crypto = require('crypto');

console.log('🔐 Generating Encryption Keys for Payment Service\n');
console.log('=' .repeat(60));

// Generate 32-byte (256-bit) encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex').slice(0, 32);
console.log('\nENCRYPTION_KEY (32 characters):');
console.log(encryptionKey);

// Generate 16-byte (128-bit) IV
const encryptionIV = crypto.randomBytes(16).toString('hex').slice(0, 16);
console.log('\nENCRYPTION_IV (16 characters):');
console.log(encryptionIV);

// Generate JWT Secret (64 characters for extra security)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\nJWT_SECRET (64+ characters):');
console.log(jwtSecret);

console.log('\n' + '=' .repeat(60));
console.log('\n📋 Copy these to your Backend/payment-service/.env file:\n');

console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('ENCRYPTION_IV=' + encryptionIV);
console.log('JWT_SECRET=' + jwtSecret);

console.log('\n✅ Keys generated successfully!');
console.log('⚠️  IMPORTANT: Keep these keys SECRET and NEVER commit to git!\n');