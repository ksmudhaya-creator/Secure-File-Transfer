/**
 * Finite State Machine (FSM) Configuration
 * Defines all allowable states, transition mappings, and metadata for transfer sessions.
 */

const STATES = {
  INITIATED: 'INITIATED',
  AUTHENTICATING: 'AUTHENTICATING',
  READY: 'READY',
  UPLOADING: 'UPLOADING',
  VERIFYING: 'VERIFYING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
};

/**
 * Valid state transition map:
 * Defines strict next states reachable from any given current state.
 */
const VALID_TRANSITIONS = {
  [STATES.INITIATED]: [STATES.AUTHENTICATING, STATES.CANCELLED, STATES.FAILED, STATES.EXPIRED],
  [STATES.AUTHENTICATING]: [STATES.READY, STATES.CANCELLED, STATES.FAILED, STATES.EXPIRED],
  [STATES.READY]: [STATES.UPLOADING, STATES.CANCELLED, STATES.FAILED, STATES.EXPIRED],
  [STATES.UPLOADING]: [STATES.VERIFYING, STATES.CANCELLED, STATES.FAILED, STATES.EXPIRED],
  [STATES.VERIFYING]: [STATES.COMPLETED, STATES.FAILED, STATES.EXPIRED],
  [STATES.COMPLETED]: [], // Terminal state
  [STATES.FAILED]: [],    // Terminal state
  [STATES.CANCELLED]: [], // Terminal state
  [STATES.EXPIRED]: [],   // Terminal state
};

/**
 * Metadata and display attributes for each FSM state
 */
const STATE_METADATA = {
  [STATES.INITIATED]: {
    name: 'Initiated',
    description: 'Transfer session instantiated and handshake created.',
    color: '#3B82F6', // Blue
    category: 'active',
    isTerminal: false,
    defaultProgress: 10,
  },
  [STATES.AUTHENTICATING]: {
    name: 'Authenticating',
    description: 'Verifying user permissions, cryptographic identity and session integrity.',
    color: '#60A5FA', // Light Blue
    category: 'active',
    isTerminal: false,
    defaultProgress: 25,
  },
  [STATES.READY]: {
    name: 'Ready',
    description: 'Transfer channel opened and ready to receive binary data payload.',
    color: '#06B6D4', // Cyan
    category: 'active',
    isTerminal: false,
    defaultProgress: 40,
  },
  [STATES.UPLOADING]: {
    name: 'Uploading',
    description: 'File chunks streaming securely through transfer pipeline.',
    color: '#0284C7', // Deep Cyan/Blue
    category: 'active',
    isTerminal: false,
    defaultProgress: 65,
  },
  [STATES.VERIFYING]: {
    name: 'Verifying',
    description: 'Applying AES-256-GCM cipher and computing SHA-256 integrity hash verification.',
    color: '#8B5CF6', // Purple/Violet
    category: 'active',
    isTerminal: false,
    defaultProgress: 85,
  },
  [STATES.COMPLETED]: {
    name: 'Completed',
    description: 'Transfer, encryption, and cryptographic verification concluded successfully.',
    color: '#10B981', // Green
    category: 'completed',
    isTerminal: true,
    defaultProgress: 100,
  },
  [STATES.FAILED]: {
    name: 'Failed',
    description: 'Transfer aborted due to cryptographic mismatch, transmission, or permission error.',
    color: '#EF4444', // Red
    category: 'failed',
    isTerminal: true,
    defaultProgress: 0,
  },
  [STATES.CANCELLED]: {
    name: 'Cancelled',
    description: 'Transfer session manually terminated by authorized user.',
    color: '#F59E0B', // Orange
    category: 'cancelled',
    isTerminal: true,
    defaultProgress: 0,
  },
  [STATES.EXPIRED]: {
    name: 'Expired',
    description: 'Session timed out after remaining inactive beyond expiration threshold.',
    color: '#6B7280', // Gray
    category: 'expired',
    isTerminal: true,
    defaultProgress: 0,
  },
};

module.exports = {
  STATES,
  VALID_TRANSITIONS,
  STATE_METADATA,
};
