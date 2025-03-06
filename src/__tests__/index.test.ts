import { convertJsToTs, JsToTsTransformer } from '../index.js';
import { TransformerOptions, TransformationResult } from '../types.js';

// Mock the JsToTsTransformer class
jest.mock('../transformer.js', () => {
  return {
    JsToTsTransformer: jest.fn().mockImplementation(() => {
      return {
        transform: jest.fn().mockResolvedValue([
          {
            originalPath: '/path/to/file.js',
            newPath: '/path/to/file.ts',
            success: true
          }
        ])
      };
    })
  };
});

describe('API Functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('convertJsToTs', () => {
    it('should create a transformer instance and call transform', async () => {
      const options: TransformerOptions = {
        input: '/path/to/input',
        output: '/path/to/output',
        verbose: true
      };
      
      const results = await convertJsToTs(options);
      
      // Check that the transformer was created with the correct options
      expect(JsToTsTransformer).toHaveBeenCalledWith(options);
      
      // Check that transform was called
      const transformerInstance = (JsToTsTransformer as jest.Mock).mock.results[0].value;
      expect(transformerInstance.transform).toHaveBeenCalled();
      
      // Check the results
      expect(results).toEqual([
        {
          originalPath: '/path/to/file.js',
          newPath: '/path/to/file.ts',
          success: true
        }
      ]);
    });
    
    it('should handle errors during transformation', async () => {
      // Mock the transform method to throw an error
      (JsToTsTransformer as jest.Mock).mockImplementationOnce(() => {
        return {
          transform: jest.fn().mockRejectedValue(new Error('Transformation error'))
        };
      });
      
      const options: TransformerOptions = {
        input: '/path/to/input'
      };
      
      // The function should reject with the error
      await expect(convertJsToTs(options)).rejects.toThrow('Transformation error');
    });
  });
});
