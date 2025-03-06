import { Command } from 'commander';
import path from 'path';
import { convertJsToTs } from '../index.js';

// Mock dependencies
jest.mock('commander', () => {
  const mockCommand = {
    name: jest.fn().mockReturnThis(),
    description: jest.fn().mockReturnThis(),
    version: jest.fn().mockReturnThis(),
    argument: jest.fn().mockReturnThis(),
    option: jest.fn().mockReturnThis(),
    action: jest.fn().mockImplementation(function(this: any, callback) {
      this.actionCallback = callback;
      return this;
    }),
    parse: jest.fn(),
  };
  
  return {
    Command: jest.fn().mockImplementation(() => mockCommand)
  };
});

jest.mock('../index.js', () => ({
  convertJsToTs: jest.fn().mockResolvedValue([
    {
      originalPath: '/path/to/file.js',
      newPath: '/path/to/file.ts',
      success: true
    }
  ])
}));

// Mock console.log and console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
console.log = jest.fn();
console.error = jest.fn();

// Mock process.exit
const originalProcessExit = process.exit;
process.exit = jest.fn() as any;

describe('CLI Interface', () => {
  let mockCommand: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new mock command instance
    const MockCommand = Command as unknown as jest.Mock;
    new MockCommand(); // Create an instance
    mockCommand = MockCommand.mock.results[0].value;
  });
  
  afterAll(() => {
    // Restore original functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    process.exit = originalProcessExit;
  });
  
  it('should set up the CLI with correct options', () => {
    // Import the CLI module to trigger the setup
    jest.isolateModules(() => {
      require('../cli.js');
    });
    
    // Check that the command was set up correctly
    expect(mockCommand.name).toHaveBeenCalledWith('js-to-ts');
    expect(mockCommand.description).toHaveBeenCalled();
    expect(mockCommand.version).toHaveBeenCalled();
    expect(mockCommand.argument).toHaveBeenCalledWith('<input>', expect.any(String));
    expect(mockCommand.option).toHaveBeenCalledWith('-o, --output <path>', expect.any(String));
    expect(mockCommand.option).toHaveBeenCalledWith('--overwrite', expect.any(String), false);
    expect(mockCommand.option).toHaveBeenCalledWith('--no-strict', expect.any(String));
    expect(mockCommand.option).toHaveBeenCalledWith('-i, --ignore <patterns...>', expect.any(String));
    expect(mockCommand.option).toHaveBeenCalledWith('--no-keep-original', expect.any(String));
    expect(mockCommand.option).toHaveBeenCalledWith('-v, --verbose', expect.any(String), false);
    expect(mockCommand.action).toHaveBeenCalled();
    expect(mockCommand.parse).toHaveBeenCalled();
  });
  
  it('should call convertJsToTs with correct options', async () => {
    // Import the CLI module to trigger the setup
    jest.isolateModules(() => {
      require('../cli.js');
    });
    
    // Call the action callback with test arguments
    const input = 'test-input';
    const options = {
      output: 'test-output',
      overwrite: true,
      strict: true,
      ignore: ['*.min.js'],
      keepOriginal: true,
      verbose: true
    };
    
    await mockCommand.actionCallback(input, options);
    
    // Check that convertJsToTs was called with the correct options
    expect(convertJsToTs).toHaveBeenCalledWith({
      input: path.resolve(process.cwd(), input),
      output: path.resolve(process.cwd(), options.output),
      overwrite: options.overwrite,
      strict: options.strict,
      ignore: options.ignore,
      keepOriginal: options.keepOriginal,
      verbose: options.verbose
    });
    
    // Check that the results were logged
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Successfully converted: 1 files'));
  });
  
  it('should handle errors during conversion', async () => {
    // Mock convertJsToTs to throw an error
    (convertJsToTs as jest.Mock).mockRejectedValueOnce(new Error('Conversion error'));
    
    // Import the CLI module to trigger the setup
    jest.isolateModules(() => {
      require('../cli.js');
    });
    
    // Call the action callback with test arguments
    await mockCommand.actionCallback('test-input', {});
    
    // Check that the error was logged
    expect(console.error).toHaveBeenCalledWith('Error:', 'Conversion error');
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
