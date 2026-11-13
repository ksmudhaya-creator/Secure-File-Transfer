const { STATES, VALID_TRANSITIONS, STATE_METADATA } = require('./fsmConfig');
const SecurityLog = require('../models/SecurityLog');

class TransferFSM {
  /**
   * Check if transition from currentState to targetState is permitted
   * @param {string} fromState
   * @param {string} toState
   * @returns {boolean}
   */
  static isValidTransition(fromState, toState) {
    if (!fromState || !toState) return false;
    const allowed = VALID_TRANSITIONS[fromState];
    return Array.isArray(allowed) && allowed.includes(toState);
  }

  /**
   * Get all permissible transitions from a current state
   * @param {string} currentState
   * @returns {string[]}
   */
  static getAvailableTransitions(currentState) {
    return VALID_TRANSITIONS[currentState] || [];
  }

  /**
   * Execute and persist a state transition on a transfer session
   * @param {object} session - Mongoose TransferSession document
   * @param {string} nextState - Target FSM state
   * @param {object} options - { reason, progress, userId, ipAddress }
   * @returns {Promise<object>} Updated session
   */
  static async transition(session, nextState, options = {}) {
    const fromState = session.currentState;
    const {
      reason = `Transition from ${fromState} to ${nextState}`,
      progress,
      userId = session.userId,
      ipAddress = '127.0.0.1',
    } = options;

    // Validate transition
    if (!this.isValidTransition(fromState, nextState)) {
      const errorMessage = `Invalid FSM transition: cannot transition session '${session.sessionId}' from state '${fromState}' to '${nextState}'. Allowed targets: [${(VALID_TRANSITIONS[fromState] || []).join(', ')}]`;
      
      // Log security violation
      try {
        await SecurityLog.create({
          userId: userId || session.userId,
          activity: 'FSM_INVALID_TRANSITION',
          ipAddress,
          status: 'ALERT',
          details: {
            sessionId: session.sessionId,
            attemptedFrom: fromState,
            attemptedTo: nextState,
            allowedTransitions: VALID_TRANSITIONS[fromState] || [],
            error: errorMessage,
          },
        });
      } catch (logErr) {
        console.error('[FSM] Failed to log invalid transition security event:', logErr.message);
      }

      const error = new Error(errorMessage);
      error.statusCode = 400;
      error.isFsmError = true;
      throw error;
    }

    // Determine progress
    const newProgress =
      typeof progress === 'number'
        ? Math.min(100, Math.max(0, progress))
        : STATE_METADATA[nextState]?.defaultProgress ?? session.transferProgress;

    // Apply state change
    session.currentState = nextState;
    session.transferProgress = newProgress;
    session.stateHistory.push({
      fromState,
      toState: nextState,
      timestamp: new Date(),
      reason,
      progress: newProgress,
    });

    await session.save();

    // Log successful transition
    try {
      await SecurityLog.create({
        userId: userId || session.userId,
        activity: 'FSM_STATE_TRANSITION',
        ipAddress,
        status: nextState === STATES.FAILED ? 'FAILURE' : 'SUCCESS',
        details: {
          sessionId: session.sessionId,
          fromState,
          toState: nextState,
          progress: newProgress,
          reason,
        },
      });
    } catch (logErr) {
      console.error('[FSM] Failed to log state transition security event:', logErr.message);
    }

    return session;
  }
}

module.exports = TransferFSM;
