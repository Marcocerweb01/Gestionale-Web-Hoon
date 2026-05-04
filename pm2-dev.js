const { spawn } = require('child_process');
const path = require('path');

const next = path.join(__dirname, 'node_modules', '.bin', 'next.cmd');
const child = spawn(next, ['dev'], { 
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => process.exit(code));
