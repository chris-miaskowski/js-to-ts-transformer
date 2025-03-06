import fs from 'fs-extra';
import path from 'path';
import { convertJsToTs } from '../index.js';

// Define paths to test files
const EXAMPLES_DIR = path.resolve(__dirname, '../../examples');
const JS_PROJECT_DIR = path.join(EXAMPLES_DIR, 'js-project');
const JS_FILE = path.join(JS_PROJECT_DIR, 'user.js');
const DTS_FILE = path.join(JS_PROJECT_DIR, 'user.d.ts');
const OUTPUT_DIR = path.join(JS_PROJECT_DIR, 'test-output');
const OUTPUT_TS_FILE = path.join(OUTPUT_DIR, 'user.ts');

describe('Integration Tests', () => {
  // Clean up the output directory before and after tests
  beforeAll(async () => {
    if (await fs.pathExists(OUTPUT_DIR)) {
      await fs.remove(OUTPUT_DIR);
    }
  });
  
  afterAll(async () => {
    if (await fs.pathExists(OUTPUT_DIR)) {
      await fs.remove(OUTPUT_DIR);
    }
  });
  
  it('should convert a JavaScript file to TypeScript with type definitions', async () => {
    // Verify test files exist
    expect(await fs.pathExists(JS_FILE)).toBe(true);
    expect(await fs.pathExists(DTS_FILE)).toBe(true);
    
    // Read the original JavaScript file
    const jsContent = await fs.readFile(JS_FILE, 'utf-8');
    expect(jsContent).toContain('function createUser(name, email, age)');
    
    // Read the type definitions file
    const dtsContent = await fs.readFile(DTS_FILE, 'utf-8');
    expect(dtsContent).toContain('interface User');
    expect(dtsContent).toContain('declare function createUser(name: string, email: string, age: number): User');
    
    // Run the conversion
    const results = await convertJsToTs({
      input: JS_FILE,
      output: OUTPUT_DIR,
      verbose: false
    });
    
    // Check the results
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(true);
    expect(results[0].originalPath).toBe(JS_FILE);
    expect(results[0].newPath).toBe(OUTPUT_TS_FILE);
    
    // Verify the output file exists
    expect(await fs.pathExists(OUTPUT_TS_FILE)).toBe(true);
    
    // Read the generated TypeScript file
    const tsContent = await fs.readFile(OUTPUT_TS_FILE, 'utf-8');
    
    // Verify the TypeScript file contains the expected content
    expect(tsContent).toContain('function createUser'); // Function exists
    
    // The following assertions verify that the conversion has applied some TypeScript features
    // Note: The exact format may vary depending on the transformer implementation
    expect(tsContent).not.toBe(jsContent); // Content has changed
    
    // Check for type annotations or other TypeScript-specific syntax
    // These checks are flexible since the exact output format may vary
    const hasTypeAnnotations = 
      tsContent.includes(': ') || // Type annotations like ': string'
      tsContent.includes('as ') || // Type assertions like 'as User'
      tsContent.includes('<') && tsContent.includes('>'); // Generic types like '<string>'
    
    expect(hasTypeAnnotations).toBe(true);
    
    // Verify the module.exports was transformed or preserved
    expect(tsContent.includes('module.exports') || tsContent.includes('export ')).toBe(true);
  });
  
  it('should convert a directory of JavaScript files', async () => {
    // Run the conversion on the directory
    const results = await convertJsToTs({
      input: JS_PROJECT_DIR,
      output: OUTPUT_DIR,
      verbose: false
    });
    
    // Check the results
    expect(results.length).toBeGreaterThan(0);
    expect(results.filter(r => r.success).length).toBeGreaterThan(0);
    
    // Verify the output directory exists
    expect(await fs.pathExists(OUTPUT_DIR)).toBe(true);
  });
});
