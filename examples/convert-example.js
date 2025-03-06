#!/usr/bin/env node

import { convertJsToTs } from '../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to the example JS project
const jsProjectPath = path.join(__dirname, 'js-project');

async function runExample() {
  console.log('Converting JavaScript to TypeScript...');
  console.log(`Input directory: ${jsProjectPath}`);
  
  try {
    // Convert JS to TS
    const results = await convertJsToTs({
      input: jsProjectPath,
      output: path.join(jsProjectPath, 'ts-output'),
      verbose: true
    });
    
    // Print results
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    console.log(`\nConversion complete!`);
    console.log(`Successfully converted: ${successCount} files`);
    
    if (failCount > 0) {
      console.log(`Failed to convert: ${failCount} files`);
      
      console.log('\nFailed files:');
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`- ${r.originalPath}: ${r.error}`);
        });
    }
    
    // Print success message
    if (successCount > 0) {
      console.log('\nCheck the output directory:');
      console.log(path.join(jsProjectPath, 'ts-output'));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
runExample().catch(console.error);
