require("dotenv").config();

const jwt = require('jsonwebtoken');

// creates a fake user token for testing
const testUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'maungmyatthiri@gmail.com',
  type: 'support'
};

const token = jwt.sign(testUser, process.env.JWT_SECRET, {
  expiresIn: '24h'
});

console.log('The test token:\n');
console.log(token);