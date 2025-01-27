import { Request, Response } from 'express';
import VPNConnection from '../models/VPNConnection';

// Get all VPN connections for a user
export const getUserConnections = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const connections = await VPNConnection.find({ userId }).sort({ connectedAt: -1 });
    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching VPN connections', error });
  }
};

// Create a new VPN connection
export const createConnection = async (req: Request, res: Response) => {
  try {
    const connection = new VPNConnection({
      userId: req.body.userId,
      ipAddress: req.body.ipAddress,
      location: req.body.location,
      deviceInfo: req.body.deviceInfo
    });
    await connection.save();
    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ message: 'Error creating VPN connection', error });
  }
};

// Update VPN connection status
export const updateConnectionStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, dataUsed } = req.body;

    const update: any = { status };
    if (status === 'disconnected') {
      update.disconnectedAt = new Date();
    }
    if (dataUsed) {
      update.dataUsed = dataUsed;
    }

    const connection = await VPNConnection.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ message: 'VPN connection not found' });
    }

    res.json(connection);
  } catch (error) {
    res.status(500).json({ message: 'Error updating VPN connection', error });
  }
};

// Get connection statistics
export const getConnectionStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    const stats = await VPNConnection.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalConnections: { $sum: 1 },
          totalDataUsed: { $sum: '$dataUsed' },
          averageConnectionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'disconnected'] },
                { $subtract: ['$disconnectedAt', '$connectedAt'] },
                { $subtract: [new Date(), '$connectedAt'] }
              ]
            }
          }
        }
      }
    ]);

    res.json(stats[0] || { totalConnections: 0, totalDataUsed: 0, averageConnectionTime: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching VPN statistics', error });
  }
};
