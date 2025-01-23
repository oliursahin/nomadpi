const express = require('express');
const AWS = require('aws-sdk');
const Device = require('../models/Device');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const ssm = new AWS.SSM();

// Get all devices for user
router.get('/', auth, async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user._id });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new device
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    // Create device in database
    const device = new Device({
      name,
      user: req.user._id
    });
    await device.save();

    // Generate WireGuard configuration on AWS instance
    const command = {
      InstanceIds: [process.env.AWS_INSTANCE_ID],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [`sudo wg genkey | sudo tee /etc/wireguard/clients/${name}.key | sudo wg pubkey | sudo tee /etc/wireguard/clients/${name}.key.pub && sudo wg-quick generate-client-config ${name}`]
      }
    };

    const response = await ssm.sendCommand(command).promise();
    
    // Update device with config status
    device.configGenerated = true;
    device.configPath = `/etc/wireguard/clients/${name}.conf`;
    await device.save();

    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get device configuration
router.get('/:id/config', auth, async (req, res) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (!device.configGenerated) {
      return res.status(400).json({ error: 'Configuration not yet generated' });
    }

    // Get configuration file from AWS instance
    const command = {
      InstanceIds: [process.env.AWS_INSTANCE_ID],
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
            CommandId: response.Command.CommandId,
            InstanceId: process.env.AWS_INSTANCE_ID
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
