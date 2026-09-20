import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONFIG = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-college-attendance-key-2026',
  JWT_EXPIRES_IN: '24h',
  UPLOADS_DIR: path.join(__dirname, '../uploads'),
  IS_DEV_MODE: true
};
