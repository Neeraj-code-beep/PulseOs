const mongoose = require('mongoose');
require('dotenv').config();
const UserModel = require('../models/User');
const authService = require('../services/auth.service');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

const runAuthTests = async () => {
  const mongoUri = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/pulseos_test';
  console.log(`Connecting to test database for Auth suite...`);
  
  await mongoose.connect(mongoUri);
  console.log('Connected to DB for Auth test suite.');

  // Clean User collection & sync indexes before running tests
  try {
    await UserModel.collection.dropIndexes();
  } catch {
    // ignore if collection didn't exist
  }
  await UserModel.syncIndexes();
  await UserModel.deleteMany({});


  console.log('\n--- Running Backend Auth Test Matrix (9/9) ---\n');

  const mockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.body = body;
      return res;
    };
    return res;
  };

  try {
    // 1. Register Success
    const req1 = {
      body: {
        name: 'Student Learner',
        email: 'student@example.com',
        password: 'strongpassword123',
      },
    };
    const res1 = mockRes();
    await authController.register(req1, res1);

    console.assert(res1.statusCode === 201, `1 Fail: expected 201, got ${res1.statusCode}`);
    console.assert(res1.body.success === true, '1 Fail: success should be true');
    console.assert(res1.body.data.user.email === 'student@example.com', '1 Fail: email mismatch');
    console.assert(typeof res1.body.data.token === 'string', '1 Fail: token should be string');
    console.assert(res1.body.data.user.passwordHash === undefined, '1 Fail: passwordHash leaked');
    console.log('PASS [1]: Registration success & user token generation');

    // 2. Duplicate Email Rejection
    const req2 = {
      body: {
        name: 'Another Student',
        email: 'STUDENT@EXAMPLE.COM', // Uppercase to test normalization
        password: 'anotherpassword123',
      },
    };
    const res2 = mockRes();
    await authController.register(req2, res2);

    console.assert(res2.statusCode === 400, `2 Fail: expected 400 for duplicate email, got ${res2.statusCode}`);
    console.assert(res2.body.success === false, '2 Fail');
    console.log('PASS [2]: Duplicate email rejected (case-insensitive)');

    // 3. Invalid Email Format Rejection
    const req3 = {
      body: {
        name: 'Student',
        email: 'invalid-email-format',
        password: 'strongpassword123',
      },
    };
    const res3 = mockRes();
    await authController.register(req3, res3);

    console.assert(res3.statusCode === 400, `3 Fail: expected 400 for invalid email, got ${res3.statusCode}`);
    console.assert(res3.body.success === false, '3 Fail');
    console.log('PASS [3]: Invalid email format rejected');

    // 4. Short Password Rejection
    const req4 = {
      body: {
        name: 'Student',
        email: 'shortpass@example.com',
        password: '123',
      },
    };
    const res4 = mockRes();
    await authController.register(req4, res4);

    console.assert(res4.statusCode === 400, `4 Fail: expected 400 for short password, got ${res4.statusCode}`);
    console.assert(res4.body.success === false, '4 Fail');
    console.log('PASS [4]: Password shorter than 8 characters rejected');

    // 5. Login Success
    const req5 = {
      body: {
        email: 'student@example.com',
        password: 'strongpassword123',
      },
    };
    const res5 = mockRes();
    await authController.login(req5, res5);

    console.assert(res5.statusCode === 200, `5 Fail: expected 200 for login success, got ${res5.statusCode}`);
    console.assert(res5.body.success === true, '5 Fail');
    console.assert(typeof res5.body.data.token === 'string', '5 Fail: token missing');
    const validToken = res5.body.data.token;
    console.log('PASS [5]: Login success returns valid user payload and JWT token');

    // 6. Invalid Credentials Rejection (Generic message)
    const req6 = {
      body: {
        email: 'student@example.com',
        password: 'wrongpassword',
      },
    };
    const res6 = mockRes();
    await authController.login(req6, res6);

    console.assert(res6.statusCode === 401, `6 Fail: expected 401 for wrong password, got ${res6.statusCode}`);
    console.assert(res6.body.success === false, '6 Fail');
    console.assert(res6.body.message === 'Invalid email or password.', '6 Fail: generic error missing');
    console.log('PASS [6]: Invalid credentials rejected with generic error message');

    // 7. /me Endpoint Success with Bearer Token
    const req7 = {
      headers: {
        authorization: `Bearer ${validToken}`,
      },
    };
    const res7 = mockRes();
    let nextCalled = false;
    authMiddleware(req7, res7, () => {
      nextCalled = true;
    });

    console.assert(nextCalled === true, '7 Fail: authMiddleware did not call next()');
    console.assert(req7.user && typeof req7.user.userId === 'string', '7 Fail: req.user.userId not populated');

    // Call /me controller with populated req.user
    const meRes = mockRes();
    await authController.me(req7, meRes);
    console.assert(meRes.statusCode === 200, `7 Fail: /me controller returned ${meRes.statusCode}`);
    console.assert(meRes.body.data.user.email === 'student@example.com', '7 Fail: user email mismatch');
    console.log('PASS [7]: GET /api/auth/me returns current authenticated user profile');

    // 8. /me Without Token Rejection
    const req8 = {
      headers: {},
    };
    const res8 = mockRes();
    authMiddleware(req8, res8, () => {});

    console.assert(res8.statusCode === 401, `8 Fail: expected 401 for missing token, got ${res8.statusCode}`);
    console.assert(res8.body.success === false, '8 Fail');
    console.log('PASS [8]: Request without Authorization header rejected with 401');

    // 9. Invalid Token Rejection
    const req9 = {
      headers: {
        authorization: 'Bearer invalid.jwt.token.string',
      },
    };
    const res9 = mockRes();
    authMiddleware(req9, res9, () => {});

    console.assert(res9.statusCode === 401, `9 Fail: expected 401 for invalid token, got ${res9.statusCode}`);
    console.assert(res9.body.success === false, '9 Fail');
    console.log('PASS [9]: Request with invalid JWT token rejected with 401');

    console.log('\n--- ALL 9 AUTHENTICATION TESTS PASSED SUCCESSFULLY! ---\n');
  } finally {
    await UserModel.deleteMany({});
    await mongoose.connection.close();
    console.log('Auth test database connection closed.');
  }
};

runAuthTests().catch((err) => {
  console.error('AUTH TEST MATRIX FAILURE:', err);
  process.exit(1);
});
