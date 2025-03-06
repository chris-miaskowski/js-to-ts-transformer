import fs from 'fs-extra';
import path from 'path';
import * as parser from '@babel/parser';
// Import modules dynamically to avoid TypeScript issues
// @ts-ignore
import traverseModule from '@babel/traverse';
// @ts-ignore
import generateModule from '@babel/generator';

// Get the default exports
// @ts-ignore - Handle both ESM and CommonJS module formats
const traverse = traverseModule.default || traverseModule;
// @ts-ignore - Handle both ESM and CommonJS module formats
const generate = generateModule.default || generateModule;
import * as t from '@babel/types';
import { TransformerOptions, TransformationResult, TypeDefinitionsMap } from './types.js';
import {
  findJavaScriptFiles,
  findTypeDefinitionFiles,
  extractTypeDefinitions,
  ensureOutputDirectory,
  getOutputFilePath,
  verboseLog
} from './utils.js';

/**
 * Main transformer class for converting JavaScript to TypeScript
 */
export class JsToTsTransformer {
  private options: TransformerOptions;
  private typeDefinitions: TypeDefinitionsMap = new Map();
  
  /**
   * Create a new transformer instance
   * @param options Configuration options
   */
  constructor(options: TransformerOptions) {
    this.options = {
      // Default options
      overwrite: false,
      strict: true,
      ignore: [],
      keepOriginal: true,
      verbose: false,
      // Override with provided options
      ...options
    };
  }
  
  /**
   * Run the transformation process
   * @returns Array of transformation results
   */
  async transform(): Promise<TransformationResult[]> {
    const results: TransformationResult[] = [];
    
    try {
      // Ensure input path exists
      if (!fs.existsSync(this.options.input)) {
        throw new Error(`Input path does not exist: ${this.options.input}`);
      }
      
      // Determine if input is a file or directory
      const inputStats = fs.statSync(this.options.input);
      const isDirectory = inputStats.isDirectory();
      
      // Set output directory
      const outputPath = this.options.output || (isDirectory 
        ? path.join(this.options.input, 'ts-output')
        : path.join(path.dirname(this.options.input), 'ts-output')
      );
      
      // Ensure output directory exists
      await ensureOutputDirectory(outputPath);
      
      // Find and load type definitions
      verboseLog(`Finding type definitions...`, this.options.verbose || false);
      const typeDefFiles = await findTypeDefinitionFiles(isDirectory ? this.options.input : path.dirname(this.options.input));
      verboseLog(`Found ${typeDefFiles.length} type definition files`, this.options.verbose || false);
      
      this.typeDefinitions = extractTypeDefinitions(typeDefFiles);
      verboseLog(`Extracted ${this.typeDefinitions.size} type definitions`, this.options.verbose || false);
      
      // Find JavaScript files to transform
      const jsFiles = isDirectory 
        ? await findJavaScriptFiles(this.options.input, this.options.ignore)
        : [this.options.input];
      
      verboseLog(`Found ${jsFiles.length} JavaScript files to transform`, this.options.verbose || false);
      
      // Transform each JavaScript file
      for (const jsFile of jsFiles) {
        try {
          const result = await this.transformFile(
            jsFile, 
            isDirectory ? this.options.input : path.dirname(jsFile),
            outputPath
          );
          results.push(result);
        } catch (error) {
          results.push({
            originalPath: jsFile,
            newPath: '',
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      return results;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Transform a single JavaScript file to TypeScript
   * @param filePath Path to the JavaScript file
   * @param inputRoot Root input directory
   * @param outputRoot Root output directory
   * @returns Transformation result
   */
  private async transformFile(
    filePath: string,
    inputRoot: string,
    outputRoot: string
  ): Promise<TransformationResult> {
    verboseLog(`Transforming file: ${filePath}`, this.options.verbose || false);
    
    try {
      // Read the JavaScript file
      const code = await fs.readFile(filePath, 'utf-8');
      
      // Parse the JavaScript code
      const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript', 'classProperties', 'objectRestSpread']
      });
      
      // Transform the AST
      this.transformAst(ast);
      
      // Generate the TypeScript code
      const output = generate(ast, {
        retainLines: true,
        comments: true
      });
      
      // Determine the output file path
      const outputPath = getOutputFilePath(filePath, inputRoot, outputRoot);
      
      // Ensure the output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      
      // Write the TypeScript file
      await fs.writeFile(outputPath, output.code);
      
      // Delete the original JavaScript file if not keeping it
      if (!this.options.keepOriginal) {
        await fs.remove(filePath);
      }
      
      return {
        originalPath: filePath,
        newPath: outputPath,
        success: true
      };
    } catch (error) {
      return {
        originalPath: filePath,
        newPath: '',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Transform the AST by adding type annotations
   * @param ast The JavaScript AST
   */
  /**
   * Extract function type information from a type definition
   * @param name Function name
   * @returns Object with parameter types and return type, or null if not found
   */
  private extractFunctionTypeInfo(name: string): { params: Record<string, string>, returnType: string } | null {
    // Check if we have a function definition for this name
    const typeDefinition = this.typeDefinitions.get(name);
    if (!typeDefinition || !typeDefinition.isFunction) {
      return null;
    }
    
    // Parse the type definition to extract parameter types and return type
    // This is a simplified implementation that looks for patterns in the type string
    const typeStr = typeDefinition.type;
    
    // Extract parameter types using regex
    const paramTypesRegex = /\(([^)]*)\)/;
    const paramTypesMatch = typeStr.match(paramTypesRegex);
    const params: Record<string, string> = {};
    
    if (paramTypesMatch && paramTypesMatch[1]) {
      const paramsList = paramTypesMatch[1].split(',').map(p => p.trim());
      paramsList.forEach(param => {
        const [name, type] = param.split(':').map(p => p.trim());
        if (name && type) {
          params[name] = type;
        }
      });
    }
    
    // Extract return type using regex
    const returnTypeRegex = /\):\s*([^;{]+)/;
    const returnTypeMatch = typeStr.match(returnTypeRegex);
    const returnType = returnTypeMatch && returnTypeMatch[1] ? returnTypeMatch[1].trim() : 'any';
    
    return { params, returnType };
  }
  
  /**
   * Create a TypeScript type annotation node
   * @param typeName Type name as a string
   * @returns TypeScript type annotation node
   */
  private createTypeAnnotation(typeName: string): t.TSTypeAnnotation {
    // Handle union types (e.g., "string | null")
    if (typeName.includes('|')) {
      const types = typeName.split('|').map(t => this.createTSType(t.trim()));
      return t.tsTypeAnnotation(t.tsUnionType(types));
    }
    
    // Handle simple types
    return t.tsTypeAnnotation(this.createTSType(typeName));
  }
  
  /**
   * Create a TypeScript type node from a type name
   * @param typeName Type name as a string
   * @returns TypeScript type node
   */
  private createTSType(typeName: string): t.TSType {
    switch (typeName.toLowerCase()) {
      case 'string':
        return t.tsStringKeyword();
      case 'number':
        return t.tsNumberKeyword();
      case 'boolean':
        return t.tsBooleanKeyword();
      case 'any':
        return t.tsAnyKeyword();
      case 'void':
        return t.tsVoidKeyword();
      case 'null':
        return t.tsNullKeyword();
      case 'undefined':
        return t.tsUndefinedKeyword();
      case 'date':
        return t.tsTypeReference(t.identifier('Date'));
      default:
        // For custom types, interfaces, etc.
        return t.tsTypeReference(t.identifier(typeName));
    }
  }
  
  private transformAst(ast: parser.ParseResult<t.File>): void {
    // First, add interface definitions at the top of the file
    const interfaceDefinitions: t.Statement[] = [];
    this.typeDefinitions.forEach((def, name) => {
      if (def.isInterface) {
        // This is a simplified approach - in a real implementation,
        // we would parse the interface definition and create a proper AST node
        const comment = t.addComment(
          t.emptyStatement(),
          'leading',
          `\n * ${name} interface (imported from .d.ts)\n * ${def.type}\n `,
          true
        );
        interfaceDefinitions.push(comment);
      }
    });
    
    // If we have interface definitions, add them to the top of the file
    if (interfaceDefinitions.length > 0) {
      ast.program.body = [...interfaceDefinitions, ...ast.program.body];
    }
    
    traverse(ast, {
      // Add type annotations to variable declarations
      VariableDeclaration: (path: any) => {
        path.node.declarations.forEach((declaration: any) => {
          if (t.isIdentifier(declaration.id)) {
            const name = declaration.id.name;
            const typeDefinition = this.typeDefinitions.get(name);
            
            if (typeDefinition) {
              // Add type annotation based on the type definition
              if (typeDefinition.isInterface || typeDefinition.isTypeAlias || typeDefinition.isEnum) {
                declaration.id.typeAnnotation = t.tsTypeAnnotation(
                  t.tsTypeReference(t.identifier(typeDefinition.name))
                );
              }
            }
          }
        });
      },
      
      // Add return type annotations to functions
      FunctionDeclaration: (path: any) => {
        if (path.node.id) {
          const name = path.node.id.name;
          const functionTypeInfo = this.extractFunctionTypeInfo(name);
          
          if (functionTypeInfo) {
            // Add return type annotation
            path.node.returnType = this.createTypeAnnotation(functionTypeInfo.returnType);
            
            // Add parameter type annotations
            path.node.params.forEach((param: any) => {
              if (t.isIdentifier(param) && functionTypeInfo.params[param.name]) {
                param.typeAnnotation = this.createTypeAnnotation(functionTypeInfo.params[param.name]);
              }
            });
          }
        }
      },
      
      // Add type annotations to function parameters for anonymous functions
      Function: (path: any) => {
        // Skip function declarations as we've already handled them
        if (t.isFunctionDeclaration(path.node)) {
          return;
        }
        
        // For other functions, try to infer parameter types from context
        path.node.params.forEach((param: any) => {
          if (t.isIdentifier(param)) {
            const name = param.name;
            
            // Check if this is a known parameter name with a type
            if (name === 'user') {
              // If parameter is named 'user', it's likely a User type
              const userType = this.typeDefinitions.get('User');
              if (userType) {
                param.typeAnnotation = t.tsTypeAnnotation(
                  t.tsTypeReference(t.identifier('User'))
                );
              }
            } else if (name === 'email') {
              // If parameter is named 'email', it's likely a string
              param.typeAnnotation = t.tsTypeAnnotation(t.tsStringKeyword());
            }
          }
        });
      },
      
      // Add type annotations to class properties
      ClassProperty: (path: any) => {
        if (t.isIdentifier(path.node.key)) {
          const name = path.node.key.name;
          const typeDefinition = this.typeDefinitions.get(name);
          
          if (typeDefinition) {
            path.node.typeAnnotation = t.tsTypeAnnotation(
              t.tsTypeReference(t.identifier(typeDefinition.name))
            );
          }
        }
      },
      
      // Transform require/module.exports to import/export
      CallExpression: (path: any) => {
        // Transform require() to import
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === 'require' &&
          path.node.arguments.length === 1 &&
          t.isStringLiteral(path.node.arguments[0])
        ) {
          // Only transform if it's a variable declaration
          if (
            path.parent &&
            (t.isVariableDeclarator(path.parent) || t.isAssignmentExpression(path.parent))
          ) {
            // We'll handle this in a more complex transformation
            // This is just a placeholder
          }
        }
      },
      
      // Transform object property assignments to interfaces
      AssignmentExpression: (path: any) => {
        // Transform module.exports = ... to export default ...
        if (
          t.isMemberExpression(path.node.left) &&
          t.isIdentifier(path.node.left.object) &&
          path.node.left.object.name === 'module' &&
          t.isIdentifier(path.node.left.property) &&
          path.node.left.property.name === 'exports'
        ) {
          // We'll handle this in a more complex transformation
          // This is just a placeholder
        }
      }
    });
  }
}
