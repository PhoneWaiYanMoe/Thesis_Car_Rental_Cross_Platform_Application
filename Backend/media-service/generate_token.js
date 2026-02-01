require("dotenv").config();

const jwt = require('jsonwebtoken');

// creates a fake support token for testing
const supportUser = {
  iuserId: '123e4567-e89b-12d3-a456-426614174001',
  email: 'maungmyatthiri@gmail.com',
  role: 'support'
};

const supportToken = jwt.sign(supportUser, process.env.JWT_SECRET, {
  expiresIn: '24h'
});

console.log('The support token:\n');
console.log(supportToken);


// creates a fake admin token for testing
const adminUser = {
  userId: '456e4567-e89b-12d3-a456-426614174001',
  email: 'maungmyatthiri@gmail.com',
  role: 'admin'
};

const adminToken = jwt.sign(adminUser, process.env.JWT_SECRET, {
  expiresIn: '24h'
});

console.log('\nThe admin token:\n');
console.log(adminToken);


// creates a fake customer token for testing
const customerUser = {
  userId: '789e4567-e89b-12d3-a456-426614174001',
  email: 'maungmyatthiri@gmail.com',
  role: 'customer'
};

const customerToken = jwt.sign(customerUser, process.env.JWT_SECRET, {
  expiresIn: '24h'
});

console.log('\nThe customer token:\n');
console.log(customerToken);

// creates a fake owner token for testing
const ownerUser = {
  userId: '101e4567-e89b-12d3-a456-426614174002',
  email: 'maungmyatthiri@gmail.com',
  role: 'owner'
};

const ownerToken = jwt.sign(ownerUser, process.env.JWT_SECRET, {
  expiresIn: '24h'
});

console.log('\nThe owner token:\n');
console.log(ownerToken);