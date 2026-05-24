const { execSync } = require('child_process');
try {
  const output = execSync('node test-scale.js', { encoding: 'utf-8' });
  require('fs').writeFileSync('test-runner-output.txt', output);
  console.log('Test completed.');
} catch (e) {
  require('fs').writeFileSync('test-runner-output.txt', e.stdout + '\n' + e.stderr);
  console.log('Test failed.');
}
