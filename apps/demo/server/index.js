import express from 'express';
import { registerMicroApp } from '@ai-app/sdk/server.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Hello from demo!' });
});

export default registerMicroApp({
  name: 'demo',
  version: '1.0.0',
  router
});