import express from 'express';
import {
  getUserConnections,
  createConnection,
  updateConnectionStatus,
  getConnectionStats
} from '../controllers/vpnController';

const router = express.Router();

// Get all VPN connections for a user
router.get('/user/:userId', getUserConnections);

// Create a new VPN connection
router.post('/', createConnection);

// Update VPN connection status
router.patch('/:id', updateConnectionStatus);

// Get connection statistics
router.get('/stats/:userId', getConnectionStats);

export default router;
