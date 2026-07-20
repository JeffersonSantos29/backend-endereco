const path = require('node:path');

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

require('dotenv').config({ path: path.resolve(__dirname, '../../', envFile) });
