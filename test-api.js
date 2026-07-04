const { spawn } = require('child_process');
const path = require('path');

const backend = spawn('npx', ['tsx', 'src/server.ts'], {
  cwd: path.join(__dirname, 'backend/api'),
  env: { ...process.env, PORT: '3000', NODE_ENV: 'development' },
  shell: true
});

backend.stdout.on('data', (data) => console.log(`[Backend Out] ${data}`));
backend.stderr.on('data', (data) => console.error(`[Backend Err] ${data}`));

setTimeout(async () => {
  console.log('Fetching racket from local API...');
  try {
    const res = await fetch('http://localhost:3000/api/v1/rackets');
    const json = await res.json();
    console.log('Success status:', json.success);
    console.log('Message:', json.message);
    if (json.data && json.data.length > 0) {
      console.log('First racket keys:', Object.keys(json.data[0]));
      console.log('First racket name:', json.data[0].nombre);
      console.log('First racket brand:', json.data[0].marca);
    } else {
      console.log('No rackets returned in data field.');
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  } finally {
    backend.kill('SIGTERM');
    process.exit(0);
  }
}, 8000);
