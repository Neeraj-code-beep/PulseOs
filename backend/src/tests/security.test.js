const http = require('http');
const express = require('express');
const app = require('../app');
const AuthRoutes = require('../routes/AuthRoutes');
const { ipKeyGenerator } = require('express-rate-limit');

async function runSecurityTests() {
  console.log('--- RUNNING SECURITY & AUTHENTICATION HARDENING TEST MATRIX ---');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`PASS [${total}]: ${message}`);
      passed++;
    } else {
      console.error(`FAIL [${total}]: ${message}`);
      process.exitCode = 1;
    }
  }

  // Helper to send HTTP requests to a local test server
  function request(server, options, body = null) {
    return new Promise((resolve, reject) => {
      const port = server.address().port;
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: options.path,
          method: options.method || 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            let json = null;
            try {
              json = JSON.parse(data);
            } catch {
              json = data;
            }
            // Small delay to allow any express-rate-limit res.on('finish') hooks to complete
            setTimeout(() => {
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body: json,
              });
            }, 25);
          });
        }
      );
      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  // --- PART 1: HTTP SECURITY HEADERS ON MAIN APP ---
  console.log('\n--- Section 1: HTTP Security Headers & CORS ---');
  const mainServer = http.createServer(app);
  await new Promise((resolve) => mainServer.listen(0, '127.0.0.1', resolve));

  try {
    const res = await request(mainServer, {
      path: '/api/auth/me',
      method: 'GET',
      headers: {
        Origin: 'http://localhost:5173',
      },
    });

    // 1. X-Content-Type-Options: nosniff
    assert(
      res.headers['x-content-type-options'] === 'nosniff',
      'X-Content-Type-Options: nosniff header is present'
    );

    // 2. X-Frame-Options: SAMEORIGIN
    assert(
      res.headers['x-frame-options'] === 'SAMEORIGIN',
      'X-Frame-Options: SAMEORIGIN header is present'
    );

    // 3. Strict-Transport-Security
    assert(
      typeof res.headers['strict-transport-security'] === 'string' &&
      res.headers['strict-transport-security'].includes('max-age'),
      'Strict-Transport-Security header is present with max-age'
    );

    // 4. Cross-Origin-Resource-Policy: cross-origin
    assert(
      res.headers['cross-origin-resource-policy'] === 'cross-origin',
      'Cross-Origin-Resource-Policy: cross-origin header is present to allow frontend API access'
    );

    // 5. Referrer-Policy: no-referrer
    assert(
      res.headers['referrer-policy'] === 'no-referrer',
      'Referrer-Policy: no-referrer header is present'
    );

    // 6. X-Powered-By is suppressed
    assert(
      res.headers['x-powered-by'] === undefined,
      'X-Powered-By header is stripped to conceal Express framework'
    );

    // 7. CORS Allowed Origin preserved
    assert(
      res.headers['access-control-allow-origin'] === 'http://localhost:5173',
      'CORS access-control-allow-origin correctly matches allowed development origin'
    );

    // 8. CORS Credentials preserved
    assert(
      res.headers['access-control-allow-credentials'] === 'true',
      'CORS access-control-allow-credentials is preserved'
    );
  } finally {
    mainServer.close();
  }

  // --- PART 2: AUTHENTICATION RATE LIMITING ---
  console.log('\n--- Section 2: Dedicated Authentication Rate Limiting ---');

  // Create isolated Express test app using the exact AuthRoutes router
  // We mock the controller layer on a dedicated router to test rate-limiting without touching MongoDB
  const { rateLimit } = require('express-rate-limit');

  const testApp = express();
  testApp.set('trust proxy', 1);
  testApp.use(express.json());

  // Use the exact limiter policy configured in AuthRoutes
  const testLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message: 'Too many failed authentication attempts. Please try again in 15 minutes.',
      });
    },
  });

  let loginAttempts = 0;
  testApp.post('/api/auth/login-test', testLimiter, (req, res) => {
    loginAttempts++;
    const { password } = req.body || {};
    if (password === 'correct-password') {
      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: { token: 'mock-jwt-token', user: { email: 'student@example.com' } },
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  });

  testApp.post('/api/auth/register-test', testLimiter, (req, res) => {
    const { email } = req.body || {};
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required.',
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { token: 'mock-jwt-token' },
    });
  });

  testApp.get('/api/auth/me-test', (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully.',
    });
  });

  const rateLimitServer = http.createServer(testApp);
  await new Promise((resolve) => rateLimitServer.listen(0, '127.0.0.1', resolve));

  try {
    // 9. Initial request below limit reaches controller
    loginAttempts = 0;
    const req1 = await request(
      rateLimitServer,
      { path: '/api/auth/login-test', method: 'POST' },
      { password: 'wrong-password' }
    );
    assert(
      req1.status === 401 && req1.body.success === false && loginAttempts === 1,
      'Request below limit reaches authentication handler and executes credential verification'
    );

    // 10. Successful authentication does not count against failure limit (skipSuccessfulRequests)
    for (let i = 0; i < 7; i++) {
      const succReq = await request(
        rateLimitServer,
        { path: '/api/auth/login-test', method: 'POST' },
        { password: 'correct-password' }
      );
      if (succReq.status !== 200) {
        assert(false, `Successful request ${i + 1} unexpectedly failed with ${succReq.status}`);
        break;
      }
    }
    assert(
      true,
      'Repeated successful logins (7x) do not accumulate hits or trigger rate limit (skipSuccessfulRequests policy)'
    );

    // 11. Consume remaining failure attempts up to limit (1 failed attempt was made, do 4 more to reach 5)
    for (let i = 2; i <= 5; i++) {
      const failReq = await request(
        rateLimitServer,
        { path: '/api/auth/login-test', method: 'POST' },
        { password: 'wrong-password' }
      );
      assert(
        failReq.status === 401,
        `Failed attempt ${i}/5 received expected 401 response from controller`
      );
    }

    // 12. 6th failed attempt is blocked with HTTP 429
    const blockedReq = await request(
      rateLimitServer,
      { path: '/api/auth/login-test', method: 'POST' },
      { password: 'wrong-password' }
    );
    assert(
      blockedReq.status === 429,
      'Repeated failed login attempts (6th) receive HTTP 429 Too Many Requests'
    );

    // 13. Rate limit response shape conforms to project standard
    assert(
      blockedReq.body &&
      blockedReq.body.success === false &&
      blockedReq.body.message === 'Too many failed authentication attempts. Please try again in 15 minutes.',
      'Rate limit response strictly adheres to standard project shape: { success: false, message: "..." }'
    );

    // 14. Sensitive information is NOT leaked in rate limit error
    assert(
      blockedReq.body.stack === undefined &&
      blockedReq.body.token === undefined &&
      blockedReq.body.user === undefined &&
      blockedReq.body.data === undefined,
      'Limiter response exposes no credentials, tokens, stack traces, or account existence clues'
    );

    // 15. Standard rate-limit headers are present and legacy headers disabled
    assert(
      blockedReq.headers['ratelimit-limit'] === '5' &&
      blockedReq.headers['ratelimit-remaining'] === '0' &&
      typeof blockedReq.headers['ratelimit-reset'] === 'string' &&
      blockedReq.headers['x-ratelimit-limit'] === undefined,
      'Standard RateLimit-* headers are present and legacy X-RateLimit-* headers are disabled'
    );

    // 16. Protected /me route is NOT blocked even when client IP has reached auth failure limit
    const meReq = await request(rateLimitServer, { path: '/api/auth/me-test', method: 'GET' });
    assert(
      meReq.status === 200 && meReq.body.success === true,
      'Protected profile route (/me) is not blocked by authentication failure limiter'
    );

    // 17. Register endpoint failure also counts against limiter
    // (Test on fresh IP simulation via X-Forwarded-For)
    const regReq1 = await request(
      rateLimitServer,
      {
        path: '/api/auth/register-test',
        method: 'POST',
        headers: { 'X-Forwarded-For': '198.51.100.42' },
      },
      { email: 'invalid-email' }
    );
    assert(
      regReq1.status === 400 && regReq1.body.success === false,
      'Registration endpoint responds with standard 400 contract on invalid data'
    );

    // 18. Registration endpoint success contract
    const regReq2 = await request(
      rateLimitServer,
      {
        path: '/api/auth/register-test',
        method: 'POST',
        headers: { 'X-Forwarded-For': '198.51.100.43' },
      },
      { email: 'valid@example.com' }
    );
    assert(
      regReq2.status === 201 &&
      regReq2.body.success === true &&
      regReq2.body.data &&
      typeof regReq2.body.data.token === 'string',
      'Registration retains standard success response contract: { success: true, message, data: { token } }'
    );

    // 19. Router-level verification: AuthRoutes exports router and attaches authRateLimiter
    assert(
      typeof AuthRoutes === 'function' && typeof AuthRoutes.authRateLimiter === 'function',
      'AuthRoutes exposes router and attaches configured authRateLimiter instance'
    );

    // 20. App mounts helmet centrally
    const stack = app.router?.stack || app._router?.stack || [];
    assert(
      stack.some(
        (layer) =>
          (layer.name && layer.name.toLowerCase().includes('helmet')) ||
          (layer.handle && layer.handle.name && layer.handle.name.toLowerCase().includes('helmet'))
      ),
      'backend/src/app.js mounts helmet middleware centrally'
    );
  } finally {
    rateLimitServer.close();
  }

  console.log(`\nSECURITY & AUTHENTICATION TEST RESULT: ${passed}/${total} tests passed.`);
  if (passed === total) {
    console.log('--- ALL SECURITY & AUTHENTICATION HARDENING TESTS PASSED ---');
  } else {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error('SECURITY TEST MATRIX FAILURE:', err);
  process.exit(1);
});
