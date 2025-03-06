import fs from 'fs-extra';
import path from 'path';
import * as parser from '@babel/parser';
import { JsToTsTransformer } from '../transformer.js';
import * as utils from '../utils.js';

// Mock dependencies
jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => true }),
  readFile: jest.fn().mockResolvedValue('const x = 5;'),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../utils.js', () => ({
  findJavaScriptFiles: jest.fn().mockResolvedValue(['/path/to/file.js']),
  findTypeDefinitionFiles: jest.fn().mockResolvedValue(['/path/to/file.d.ts']),
  extractTypeDefinitions: jest.fn().mockReturnValue(new Map()),
  ensureOutputDirectory: jest.fn().mockResolvedValue(undefined),
  getOutputFilePath: jest.fn().mockReturnValue('/output/path/file.ts'),
  verboseLog: jest.fn()
}));

// Mock @babel/parser
jest.mock('@babel/parser', () => ({
  parse: jest.fn().mockReturnValue({})
}));

// Mock @babel/traverse and @babel/generator
jest.mock('@babel/traverse', () => ({
  default: jest.fn().mockReturnValue(undefined)
}));

jest.mock('@babel/generator', () => ({
  default: jest.fn().mockReturnValue({ code: 'const x: number = 5;' })
}));

describe('JsToTsTransformer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const transformer = new JsToTsTransformer({ input: '/path/to/input' });
      
      // @ts-ignore - accessing private property for testing
      expect(transformer.options).toEqual({
        input: '/path/to/input',
        overwrite: false,
        strict: true,
        ignore: [],
        keepOriginal: true,
        verbose: false
      });
    });
    
    it('should override default options with provided options', () => {
      const transformer = new JsToTsTransformer({
        input: '/path/to/input',
        output: '/path/to/output',
        overwrite: true,
        strict: false,
        ignore: ['*.min.js'],
        keepOriginal: false,
        verbose: true
      });
      
      // @ts-ignore - accessing private property for testing
      expect(transformer.options).toEqual({
        input: '/path/to/input',
        output: '/path/to/output',
        overwrite: true,
        strict: false,
        ignore: ['*.min.js'],
        keepOriginal: false,
        verbose: true
      });
    });
  });
  
  describe('transform', () => {
    it('should transform JavaScript files to TypeScript', async () => {
      const transformer = new JsToTsTransformer({
        input: '/path/to/input',
        output: '/path/to/output'
      });
      
      const results = await transformer.transform();
      
      // Check that utility functions were called
      expect(fs.existsSync).toHaveBeenCalledWith('/path/to/input');
      expect(fs.statSync).toHaveBeenCalledWith('/path/to/input');
      expect(utils.ensureOutputDirectory).toHaveBeenCalled();
      expect(utils.findTypeDefinitionFiles).toHaveBeenCalled();
      expect(utils.extractTypeDefinitions).toHaveBeenCalled();
      expect(utils.findJavaScriptFiles).toHaveBeenCalled();
      
      // Check that the file was transformed
      expect(fs.readFile).toHaveBeenCalledWith('/path/to/file.js', 'utf-8');
      expect(parser.parse).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith('/output/path/file.ts', 'const x: number = 5;');
      
      // Check the results
      expect(results).toEqual([
        {
          originalPath: '/path/to/file.js',
          newPath: '/output/path/file.ts',
          success: true
        }
      ]);
    });
    
    it('should handle errors during transformation', async () => {
      // Mock fs.readFile to throw an error
      (fs.readFile as unknown as jest.Mock).mockRejectedValueOnce(new Error('File read error'));
      
      const transformer = new JsToTsTransformer({
        input: '/path/to/input',
        output: '/path/to/output'
      });
      
      const results = await transformer.transform();
      
      // Check the results
      expect(results).toEqual([
        {
          originalPath: '/path/to/file.js',
          newPath: '',
          success: false,
          error: 'File read error'
        }
      ]);
    });
    
    it('should delete original files when keepOriginal is false', async () => {
      const transformer = new JsToTsTransformer({
        input: '/path/to/input',
        output: '/path/to/output',
        keepOriginal: false
      });
      
      await transformer.transform();
      
      // Check that the original file was deleted
      expect(fs.remove).toHaveBeenCalledWith('/path/to/file.js');
    });
    
    it('should not delete original files when keepOriginal is true', async () => {
      const transformer = new JsToTsTransformer({
        input: '/path/to/input',
        output: '/path/to/output',
        keepOriginal: true
      });
      
      await transformer.transform();
      
      // Check that the original file was not deleted
      expect(fs.remove).not.toHaveBeenCalled();
    });
  });
});
