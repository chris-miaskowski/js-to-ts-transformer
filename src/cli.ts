#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import { convertJsToTs } from './index.js';
import { TransformerOptions } from './types.js';

// Create a new command instance
const program = new Command();

// Set up the CLI
program
  .name('js-to-ts')
  .description('Convert JavaScript files to TypeScript with type definitions')
  .version('1.0.0')
  .argument('<input>', 'Input file or directory path')
  .option('-o, --output <path>', 'Output directory path')
  .option('--overwrite', 'Overwrite existing files', false)
  .option('--no-strict', 'Disable strict mode')
  .option('-i, --ignore <patterns...>', 'File patterns to ignore (e.g., "**/*.min.js")')
  .option('--no-keep-original', 'Delete original JavaScript files')
  .option('-v, --verbose', 'Print verbose output', false)
  .action(async (input: string, options: any) => {
    try {
      // Resolve input path
      const inputPath = path.resolve(process.cwd(), input);
      
      // Prepare transformer options
      const transformerOptions: TransformerOptions = {
        input: inputPath,
        output: options.output ? path.resolve(process.cwd(), options.output) : undefined,
        overwrite: options.overwrite,
        strict: options.strict !== false,
        ignore: options.ignore || [],
        keepOriginal: options.keepOriginal !== false,
        verbose: options.verbose
      };
      
      // Print options if verbose
      if (options.verbose) {
        console.log('Options:', transformerOptions);
      }
      
      // Run the transformation
      console.log(`Converting JavaScript to TypeScript from: ${inputPath}`);
      const results = await convertJsToTs(transformerOptions);
      
      // Print results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      console.log(`\nTransformation complete!`);
      console.log(`Successfully converted: ${successCount} files`);
      
      if (failCount > 0) {
        console.log(`Failed to convert: ${failCount} files`);
        
        if (options.verbose) {
          console.log('\nFailed files:');
          results
            .filter(r => !r.success)
            .forEach(r => {
              console.log(`- ${r.originalPath}: ${r.error}`);
            });
        }
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
