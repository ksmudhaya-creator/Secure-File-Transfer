/**
 * Automated End-to-End Verification Test Suite
 * Tests all 16 items specified in Section 16 of the project requirements.
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const { app, dbPromise } = require('./server');
const TransferFSM = require('./stateMachine/transferFSM');
const { STATES } = require('./stateMachine/fsmConfig');
const { calculateSHA256, encryptBuffer, decryptBuffer } = require('./utils/cryptoUtils');

let serverInstance;
let PORT = 5005; // Use test port to avoid conflict
let baseUrl = `http://127.0.0.1:${PORT}`;

const runTests = async () => {
  console.log('====================================================');
  console.log('🧪 RUNNING RIGOROUS END-TO-END VERIFICATION SUITE');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, testName) => {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test assertion failed: ${testName}`);
    }
  };

  try {
    // Await database connection and seed initialization
    console.log('[TEST] Waiting for database connection and seed completion...');
    await dbPromise;
    console.log('[TEST] Database & seeding ready.');

    // Start test server
    serverInstance = app.listen(PORT);
    console.log(`[TEST] Test server listening on ${baseUrl}`);
    await new Promise((r) => setTimeout(r, 500));

    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`).then((r) => r.json());
    assert(healthRes.status === 'ONLINE', '1. Server Health Check & Cryptographic Subsystems Online');

    // 2. Unit Test: AES-256-GCM Encryption & SHA-256 Hashing
    const testPlaintext = Buffer.from('Confidential Academic Cyber Defense Payload - Test String 2026');
    const expectedHash = calculateSHA256(testPlaintext);
    const encResult = encryptBuffer(testPlaintext);
    assert(encResult.fileHash === expectedHash, '2. SHA-256 Checksum Computed Correctly');
    assert(encResult.iv.length === 32, '3. AES-256-GCM IV is 128-bit (32 hex characters)');
    assert(encResult.authTag.length === 32, '4. AES-256-GCM AuthTag is 128-bit (32 hex characters)');

    // 3. Unit Test: AES-256-GCM Decryption & Tamper Detection
    const decResult = decryptBuffer(encResult.encryptedBuffer, encResult.iv, encResult.authTag, expectedHash);
    assert(decResult.hashVerified === true, '5. AES-256-GCM Decryption with Valid AuthTag & SHA-256 Match');
    assert(decResult.decryptedBuffer.toString() === testPlaintext.toString(), '6. Decrypted Plaintext Exact Match');

    // Test tamper resistance
    let tamperDetected = false;
    try {
      const tampered = Buffer.from(encResult.encryptedBuffer);
      tampered[0] ^= 0xff; // flip a bit
      decryptBuffer(tampered, encResult.iv, encResult.authTag, expectedHash);
    } catch (tamperErr) {
      tamperDetected = true;
    }
    assert(tamperDetected, '7. AES-256-GCM Tamper-Proof Rejection (Bit modification fails authTag)');

    // 4. Test: Admin Login with Pre-Seeded Credentials
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cybersec.io',
        password: 'AdminPassword123!',
      }),
    }).then((r) => r.json());

    assert(adminLoginRes.success === true, '8. Pre-Seeded Admin Authentication (admin@cybersec.io)');
    const adminToken = adminLoginRes.token;
    assert(!!adminToken, '9. Admin JWT Token Issuance');

    // 5. Test: User Registration & Login
    const uniqueUser = `student_${Date.now()}`;
    const userRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: uniqueUser,
        email: `${uniqueUser}@cybersec.io`,
        password: 'StudentSecurePass123!',
      }),
    }).then((r) => r.json());

    assert(userRegRes.success === true, '10. New Operative User Registration');
    const userToken = userRegRes.token;

    // 6. Test: FSM Session Creation (INITIATED state)
    const createSessionRes = await fetch(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        fileName: 'academic_capstone_report.pdf',
        fileSize: 1048576,
        transferType: 'UPLOAD',
      }),
    }).then((r) => r.json());

    assert(createSessionRes.success === true, '11. FSM Session Created in INITIATED State');
    const sessionId = createSessionRes.session.sessionId;
    assert(createSessionRes.session.currentState === 'INITIATED', '12. Session State is INITIATED');

    // 7. Test: Valid FSM Transition: INITIATED -> AUTHENTICATING -> READY
    const trans1 = await fetch(`${baseUrl}/api/sessions/${sessionId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        targetState: 'AUTHENTICATING',
        reason: 'Handshake verification step',
      }),
    }).then((r) => r.json());

    assert(trans1.success === true && trans1.session.currentState === 'AUTHENTICATING', '13. Valid FSM Transition: INITIATED ➔ AUTHENTICATING');

    const trans2 = await fetch(`${baseUrl}/api/sessions/${sessionId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        targetState: 'READY',
        reason: 'Socket opened for stream',
      }),
    }).then((r) => r.json());

    assert(trans2.success === true && trans2.session.currentState === 'READY', '14. Valid FSM Transition: AUTHENTICATING ➔ READY');

    // 8. Test: Illegal FSM Transition Rejection (READY -> COMPLETED is illegal without UPLOADING & VERIFYING)
    const illegalTrans = await fetch(`${baseUrl}/api/sessions/${sessionId}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        targetState: 'COMPLETED',
        reason: 'Attempted shortcut bypass',
      }),
    });

    const illegalData = await illegalTrans.json();
    assert(illegalTrans.status === 400 && illegalData.success === false, '15. FSM Strict Rejection of Illegal Transition (READY ➔ COMPLETED blocked with 400)');

    // 9. Test: File Upload with Multipart & Full Encryption Lifecycle
    const sampleFilePath = path.join(__dirname, 'test_sample.txt');
    fs.writeFileSync(sampleFilePath, 'Google Antigravity Secure File Transfer Project Verification File - Secret Content');

    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(sampleFilePath)], { type: 'text/plain' });
    formData.append('file', fileBlob, 'test_sample.txt');
    formData.append('sessionId', sessionId);

    const uploadRes = await fetch(`${baseUrl}/api/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
      body: formData,
    }).then((r) => r.json());

    assert(uploadRes.success === true, '16. File Upload Succeeded & Stored');
    assert(uploadRes.session.currentState === 'COMPLETED', '17. Session Automatically Transitioned to COMPLETED');
    const uploadedFileId = uploadRes.file.id;

    // 10. Test: Integrity Verification Endpoint
    const verifyRes = await fetch(`${baseUrl}/api/files/${uploadedFileId}/verify`, {
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((r) => r.json());

    assert(verifyRes.verified === true, '18. Pre-Download Integrity Check Validated (AES-GCM + SHA-256)');

    // 11. Test: Decrypted Download Endpoint
    const downloadRes = await fetch(`${baseUrl}/api/files/${uploadedFileId}/download`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    const downloadedText = await downloadRes.text();
    assert(
      downloadedText === 'Google Antigravity Secure File Transfer Project Verification File - Secret Content',
      '19. File Decrypted On-the-Fly and Verified Plaintext Returned'
    );
    assert(downloadRes.headers.get('X-Decryption-Status') === 'VERIFIED_AES_256_GCM', '20. Header Confirms VERIFIED_AES_256_GCM');

    // 12. Test: RBAC - Normal User blocked from Admin API
    const forbiddenAdminRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(forbiddenAdminRes.status === 403, '21. RBAC: Normal User Access to /api/admin/users Blocked (403 Forbidden)');

    // 13. Test: Admin successfully accesses Admin API & Security Logs
    const adminUsersRes = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(adminUsersRes.success === true && adminUsersRes.users.length > 0, '22. RBAC: Admin Successfully Retrieves Users Directory');

    const securityLogsRes = await fetch(`${baseUrl}/api/admin/logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(securityLogsRes.success === true && securityLogsRes.logs.length > 0, '23. Security Audit Logs Recorded & Accessible to Admin');

    // 14. Test: Session Cancellation via FSM
    const cancelSessionRes = await fetch(`${baseUrl}/api/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        fileName: 'abort_candidate.bin',
        fileSize: 4096,
        transferType: 'UPLOAD',
      }),
    }).then((r) => r.json());

    const cancelSessionId = cancelSessionRes.session.sessionId;
    const cancelExecRes = await fetch(`${baseUrl}/api/sessions/${cancelSessionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ reason: 'Unit test user abort request' }),
    }).then((r) => r.json());

    assert(cancelExecRes.success === true && cancelExecRes.session.currentState === 'CANCELLED', '24. FSM Session Cancellation Succeeded (Transitioned to CANCELLED)');

    // 15. Test: Session Expiration via FSM
    const TransferSession = require('./models/TransferSession');
    const expiredSessionDoc = await TransferSession.create({
      sessionId: `SES-EXP-TEST-${Date.now()}`,
      userId: userRegRes.user.id,
      fileName: 'stale_session.dat',
      currentState: 'INITIATED',
      expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
      stateHistory: [{ fromState: 'INITIAL', toState: 'INITIATED', timestamp: new Date(Date.now() - 65000) }],
    });

    // Query through API which triggers automatic expiration
    const expiredCheckRes = await fetch(`${baseUrl}/api/sessions/${expiredSessionDoc.sessionId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    }).then((r) => r.json());

    assert(expiredCheckRes.success === true && expiredCheckRes.session.currentState === 'EXPIRED', '25. FSM Inactive Session Expiration Evaluated (Transitioned to EXPIRED)');

    // Clean up sample test file
    if (fs.existsSync(sampleFilePath)) fs.unlinkSync(sampleFilePath);

    console.log('\n====================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
    process.exit(0);
  }
};

runTests();
