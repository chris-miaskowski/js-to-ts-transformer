import path from 'path';
import fs from 'fs-extra';
import { 
  getOutputFilePath, 
  verboseLog,
  ensureOutputDirectory
} from '../utils.js';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock console.log
const originalConsoleLog = console.log;
console.log = jest.fn();

describe('Utility Functions', () => {
  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOutputFilePath', () => {
    it('should convert .js file path to .ts file path', () => {
      const inputPath = '/path/to/file.js';
      const inputRoot = '/path/to';
      const outputRoot = '/output/path';
      
      const result = getOutputFilePath(inputPath, inputRoot, outputRoot);
      
      expect(result).toBe(path.join(outputRoot, 'file.ts'));
    });
    
    it('should handle nested directories', () => {
      const inputPath = '/path/to/nested/dir/file.js';
      const inputRoot = '/path/to';
      const outputRoot = '/output/path';
      
      const result = getOutputFilePath(inputPath, inputRoot, outputRoot);
      
      expect(result).toBe(path.join(outputRoot, 'nested/dir/file.ts'));
    });
  });
  
  describe('verboseLog', () => {
    it('should log message when verbose is true', () => {
      verboseLog('Test message', true);
      
      expect(console.log).toHaveBeenCalledWith('[js-to-ts] Test message');
    });
    
    it('should not log message when verbose is false', () => {
      verboseLog('Test message', false);
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });
  
  describe('ensureOutputDirectory', () => {
    it('should call fs.ensureDir with the output path', async () => {
      const outputPath = '/output/path';
      
      await ensureOutputDirectory(outputPath);
      
      expect(fs.ensureDir).toHaveBeenCalledWith(outputPath);
    });
  });
});
