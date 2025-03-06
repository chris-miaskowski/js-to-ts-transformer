/**
 * Configuration options for the JS to TS transformer
 */
export interface TransformerOptions {
  /**
   * Input directory or file path
   */
  input: string;
  
  /**
   * Output directory path
   */
  output?: string;
  
  /**
   * Whether to overwrite existing files
   */
  overwrite?: boolean;
  
  /**
   * Whether to use strict mode in TypeScript
   */
  strict?: boolean;
  
  /**
   * File patterns to ignore
   */
  ignore?: string[];
  
  /**
   * Whether to keep the original JavaScript files
   */
  keepOriginal?: boolean;
  
  /**
   * Whether to print verbose output
   */
  verbose?: boolean;
}

/**
 * Result of a file transformation
 */
export interface TransformationResult {
  /**
   * Original file path
   */
  originalPath: string;
  
  /**
   * New TypeScript file path
   */
  newPath: string;
  
  /**
   * Whether the transformation was successful
   */
  success: boolean;
  
  /**
   * Error message if transformation failed
   */
  error?: string;
}

/**
 * Type definition information extracted from .d.ts files
 */
export interface TypeDefinition {
  /**
   * Name of the type
   */
  name: string;
  
  /**
   * Type annotation as a string
   */
  type: string;
  
  /**
   * Source .d.ts file
   */
  source: string;
  
  /**
   * Whether it's an interface
   */
  isInterface?: boolean;
  
  /**
   * Whether it's a type alias
   */
  isTypeAlias?: boolean;
  
  /**
   * Whether it's an enum
   */
  isEnum?: boolean;
  
  /**
   * Whether it's a class
   */
  isClass?: boolean;
  
  /**
   * Whether it's a function
   */
  isFunction?: boolean;
}

/**
 * Mapping of identifiers to their type definitions
 */
export type TypeDefinitionsMap = Map<string, TypeDefinition>;
