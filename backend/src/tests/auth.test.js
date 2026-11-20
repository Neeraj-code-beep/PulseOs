const assert = require('assert');
const { connectTestDb, disconnectTestDb, createTestTracker } = require('./testDbGuard');
const UserModel = require('../models/User');
const authService = require('../services/auth.service');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Ensure a safe JWT secret exists for isolated testing if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_pulseos_1234567890';
}

const runAuthTests = async () => {
  await connectTestDb();
  const tracker = createTestTracker();

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

  let testError = null;
  try {
    // 1. Register Success
    const req1 = {
      body: {
        name: 'Student Learner',
        email: 'student@example.com',
        password: 'strongpassword123',
      },
    };
    // Pre-track user email so cleanup succeeds even if registration controller subsequently throws
    tracker.trackUser({ email: req1.body.email });

    const res1 = mockRes();
    await authController.register(req1, res1);

    if (res1.body?.data?.user) {
      tracker.trackUser(res1.body.data.user);
    }

    assert(res1.statusCode === 201, `1 Fail: expected 201, got ${res1.statusCode}`);
    assert(res1.body.success === true, '1 Fail: success should be true');
    assert(res1.body.data.user.email === 'student@example.com', '1 Fail: email mismatch');
    assert(typeof res1.body.data.token === 'string', '1 Fail: token should be string');
    assert(res1.body.data.user.passwordHash === undefined, '1 Fail: passwordHash leaked');
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

    assert(res2.statusCode === 400, `2 Fail: expected 400 for duplicate email, got ${res2.statusCode}`);
    assert(res2.body.success === false, '2 Fail');
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

    assert(res3.statusCode === 400, `3 Fail: expected 400 for invalid email, got ${res3.statusCode}`);
    assert(res3.body.success === false, '3 Fail');
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

    assert(res4.statusCode === 400, `4 Fail: expected 400 for short password, got ${res4.statusCode}`);
    assert(res4.body.success === false, '4 Fail');
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

    assert(res5.statusCode === 200, `5 Fail: expected 200 for login success, got ${res5.statusCode}`);
    assert(res5.body.success === true, '5 Fail');
    assert(typeof res5.body.data.token === 'string', '5 Fail: token missing');
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

    assert(res6.statusCode === 401, `6 Fail: expected 401 for wrong password, got ${res6.statusCode}`);
    assert(res6.body.success === false, '6 Fail');
    assert(res6.body.message === 'Invalid email or password.', '6 Fail: generic error missing');
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

    assert(nextCalled === true, '7 Fail: authMiddleware did not call next()');
    assert(req7.user && typeof req7.user.userId === 'string', '7 Fail: req.user.userId not populated');

    // Call /me controller with populated req.user
    const meRes = mockRes();
    await authController.me(req7, meRes);
    assert(meRes.statusCode === 200, `7 Fail: /me controller returned ${meRes.statusCode}`);
    assert(meRes.body.data.user.email === 'student@example.com', '7 Fail: user email mismatch');
    console.log('PASS [7]: GET /api/auth/me returns current authenticated user profile');

    // 8. /me Without Token Rejection
    const req8 = {
      headers: {},
    };
    const res8 = mockRes();
    authMiddleware(req8, res8, () => {});

    assert(res8.statusCode === 401, `8 Fail: expected 401 for missing token, got ${res8.statusCode}`);
    assert(res8.body.success === false, '8 Fail');
    console.log('PASS [8]: Request without Authorization header rejected with 401');

    // 9. Invalid Token Rejection
    const req9 = {
      headers: {
        authorization: 'Bearer invalid.jwt.token.string',
      },
    };
    const res9 = mockRes();
    authMiddleware(req9, res9, () => {});

    assert(res9.statusCode === 401, `9 Fail: expected 401 for invalid token, got ${res9.statusCode}`);
    assert(res9.body.success === false, '9 Fail');
    console.log('PASS [9]: Request with invalid JWT token rejected with 401');

    // 10. Expired Token Rejection
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { userId: '507f1f77bcf86cd799439011' },
      process.env.JWT_SECRET || 'test_secret',
      { expiresIn: '-1s' }
    );
    const req10 = {
      headers: {
        authorization: `Bearer ${expiredToken}`,
      },
    };
    const res10 = mockRes();
    authMiddleware(req10, res10, () => {});

    assert(res10.statusCode === 401, `10 Fail: expected 401 for expired token, got ${res10.statusCode}`);
    assert(res10.body.message === 'Token expired.', `10 Fail: expected "Token expired.", got ${res10.body.message}`);
    console.log('PASS [10]: Request with expired JWT token rejected with 401 "Token expired."');

    // 11. Missing JWT_SECRET Causes Error
    const originalSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    let errorThrown = false;
    try {
      authService.generateToken('507f1f77bcf86cd799439011');
    } catch (err) {
      if (err.message === 'JWT_SECRET is required.') {
        errorThrown = true;
      }
    } finally {
      process.env.JWT_SECRET = originalSecret;
    }
    assert(errorThrown === true, '11 Fail: generateToken did not throw when JWT_SECRET missing');
    console.log('PASS [11]: Missing JWT_SECRET causes secure config failure');

    console.log('\n--- ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! ---\n');
  } catch (err) {
    testError = err;
  } finally {
    const cleanupErrors = [];
    try {
      await tracker.cleanup({ UserModel });
    } catch (err) {
      cleanupErrors.push(err);
      console.error('[auth.test] Error during tracker cleanup:', err.message);
    }
    try {
      await disconnectTestDb();
    } catch (err) {
      cleanupErrors.push(err);
      console.error('[auth.test] Error during disconnect:', err.message);
    }
    if (testError) {
      if (cleanupErrors.length > 0) {
        console.error('[auth.test] Additional errors during cleanup:', cleanupErrors);
      }
      throw testError;
    }
    if (cleanupErrors.length > 0) {
      throw cleanupErrors[0];
    }
    console.log('Auth test database connection closed.');
  }
};

runAuthTests().catch((err) => {
  console.error('AUTH TEST MATRIX FAILURE:', err);
  process.exit(1);
});
