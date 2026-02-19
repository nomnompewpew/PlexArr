const fs = require('fs');
const path = require('path');

// Files to process
const files = [
  path.join(__dirname, '../src/services/prerequisiteService.ts'),
  path.join(__dirname, '../src/services/installationService.ts')
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace the invoke pattern with platformAPI.executeCommand
  // Pattern: await invoke<string>('execute_command', {\n        command: 'cmd',\n        args: [...]\n      })
  content = content.replace(
    /await invoke<string>\('execute_command',\s*{\s*command:\s*'([^']+)',\s*args:\s*(\[[^\]]*\])\s*}\);?/gs,
    (match, cmd, args) => `await platformAPI.executeCommand('${cmd}', ${args});`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${path.basename(filePath)}`);
});

console.log('Done!');
