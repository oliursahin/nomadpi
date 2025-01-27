import express from 'express';
import AWS from 'aws-sdk';
import { DeviceModel } from '../models/Device';
import { auth } from '../middleware/auth';
import { Device } from '@nomadpi/shared';

export const deviceRouter = express.Router();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ssm = new AWS.SSM();

// Get all devices for user
deviceRouter.get('/', auth, async (req, res) => {
  try {
    const devices = await DeviceModel.find({ user: req.user?.id });
    res.json(devices.map(device => ({
      id: device._id.toString(),
      name: device.name,
      userId: device.user.toString(),
      configGenerated: device.configGenerated,
      configPath: device.configPath,
      createdAt: device.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Add new device
deviceRouter.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Create device in database
    const device = new DeviceModel({
      name,
      user: req.user?.id
    });
    await device.save();

    // Generate WireGuard configuration on AWS instance
    const command = {
      InstanceIds: [process.env.AWS_INSTANCE_ID || ''],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          `sudo wg genkey | sudo tee /etc/wireguard/clients/${name}.key | sudo wg pubkey | sudo tee /etc/wireguard/clients/${name}.key.pub && sudo wg-quick generate-client-config ${name}`
        ]
      }
    };

    await ssm.sendCommand(command).promise();
    
    // Update device with config status
    device.configGenerated = true;
    device.configPath = `/etc/wireguard/clients/${name}.conf`;
    await device.save();

    const deviceResponse: Device = {
      id: device._id.toString(),
      name: device.name,
      userId: device.user.toString(),
      configGenerated: device.configGenerated,
      configPath: device.configPath,
      createdAt: device.createdAt
    };

    res.status(201).json(deviceResponse);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Get device configuration
deviceRouter.get('/:id/config', auth, async (req, res) => {
  try {
    const device = await DeviceModel.findOne({
      _id: req.params.id,
      user: req.user?.id
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (!device.configGenerated) {
      return res.status(400).json({ error: 'Configuration not yet generated' });
    }

    // Get configuration file from AWS instance
    const command = {
      InstanceIds: [process.env.AWS_INSTANCE_ID || ''],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [`sudo cat ${device.configPath}`]
      }
    };

    const response = await ssm.sendCommand(command).promise();
    
    // Wait for command to complete and get output
    const output = await new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const commandResult = await ssm.getCommandInvocation({
            CommandId: response.Command?.CommandId || '',
            InstanceId: process.env.AWS_INSTANCE_ID || ''
          }).promise();
          resolve(commandResult.StandardOutputContent);
        } catch (error) {
          reject(error);
        }
      }, 5000); // Wait 5 seconds for command to complete
    });

    res.setHeader('Content-Type', 'application/x-wireguard-profile');
    res.setHeader('Content-Disposition', `attachment; filename=${device.name}.conf`);
    res.send(output);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
