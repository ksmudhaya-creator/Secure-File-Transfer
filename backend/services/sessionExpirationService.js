const TransferSession = require('../models/TransferSession');
const TransferFSM = require('../stateMachine/transferFSM');
const { STATES } = require('../stateMachine/fsmConfig');

let expirationInterval = null;

/**
 * Checks and expires all overdue sessions in the background
 */
const expireOverdueSessions = async () => {
  try {
    const activeStates = [
      STATES.INITIATED,
      STATES.AUTHENTICATING,
      STATES.READY,
      STATES.UPLOADING,
      STATES.VERIFYING,
    ];

    const overdueSessions = await TransferSession.find({
      currentState: { $in: activeStates },
      expiresAt: { $lte: new Date() },
    });

    for (const session of overdueSessions) {
      console.log(`[FSM-EXPIRER] Expiring overdue session: ${session.sessionId}`);
      try {
        await TransferFSM.transition(session, STATES.EXPIRED, {
          reason: 'Session exceeded configured inactivity timeout and was automatically expired.',
          progress: 0,
        });
      } catch (err) {
        console.error(`[FSM-EXPIRER] Error expiring session ${session.sessionId}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[FSM-EXPIRER] Failed to query overdue sessions:', error.message);
  }
};

/**
 * Check if a single session has expired and transition it if necessary
 * @param {object} session
 * @returns {Promise<object>}
 */
const checkAndExpireSingleSession = async (session) => {
  const activeStates = [
    STATES.INITIATED,
    STATES.AUTHENTICATING,
    STATES.READY,
    STATES.UPLOADING,
    STATES.VERIFYING,
  ];

  if (activeStates.includes(session.currentState) && new Date(session.expiresAt) <= new Date()) {
    return await TransferFSM.transition(session, STATES.EXPIRED, {
      reason: 'Session expiration deadline elapsed.',
      progress: 0,
    });
  }

  return session;
};

/**
 * Starts background daemon for periodic session timeout evaluation
 * @param {number} intervalMs - Poll interval in milliseconds (default: 30000ms / 30s)
 */
const startExpirationDaemon = (intervalMs = 30000) => {
  if (expirationInterval) {
    clearInterval(expirationInterval);
  }
  expirationInterval = setInterval(expireOverdueSessions, intervalMs);
  console.log(`[FSM-EXPIRER] Expiration daemon started (polling every ${intervalMs / 1000}s)`);
};

/**
 * Stops background expiration daemon
 */
const stopExpirationDaemon = () => {
  if (expirationInterval) {
    clearInterval(expirationInterval);
    expirationInterval = null;
    console.log('[FSM-EXPIRER] Expiration daemon stopped.');
  }
};

module.exports = {
  expireOverdueSessions,
  checkAndExpireSingleSession,
  startExpirationDaemon,
  stopExpirationDaemon,
};
