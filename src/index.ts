import { JsToTsTransformer } from './transformer.js';
import { TransformerOptions, TransformationResult } from './types.js';

/**
 * Convert JavaScript files to TypeScript
 * @param options Configuration options
 * @returns Array of transformation results
 */
export async function convertJsToTs(options: TransformerOptions): Promise<TransformationResult[]> {
  const transformer = new JsToTsTransformer(options);
  return transformer.transform();
}

// Export types and classes
export { JsToTsTransformer } from './transformer.js';
export * from './types.js';
