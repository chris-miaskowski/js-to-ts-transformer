import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { TypeDefinition, TypeDefinitionsMap } from './types.js';
import * as ts from 'typescript';

/**
 * Find all JavaScript files in a directory
 * @param directory Directory to search
 * @param ignore Patterns to ignore
 * @returns Array of file paths
 */
export async function findJavaScriptFiles(directory: string, ignore: string[] = []): Promise<string[]> {
  const defaultIgnore = ['node_modules/**', '**/*.d.ts', '**/*.min.js', '**/dist/**'];
  const ignorePatterns = [...defaultIgnore, ...ignore];
  
  try {
    const files = await glob('**/*.js', {
      cwd: directory,
      ignore: ignorePatterns,
      absolute: true
    });
    return files;
  } catch (err) {
    throw err;
  }
}

/**
 * Find all TypeScript definition files (.d.ts) in a directory
 * @param directory Directory to search
 * @returns Array of file paths
 */
export async function findTypeDefinitionFiles(directory: string): Promise<string[]> {
  try {
    const files = await glob('**/*.d.ts', {
      cwd: directory,
      ignore: ['node_modules/**', '**/dist/**'],
      absolute: true
    });
    return files;
  } catch (err) {
    throw err;
  }
}

/**
 * Extract type definitions from .d.ts files
 * @param filePaths Array of .d.ts file paths
 * @returns Map of type names to their definitions
 */
export function extractTypeDefinitions(filePaths: string[]): TypeDefinitionsMap {
  const typeDefinitions: TypeDefinitionsMap = new Map();
  
  for (const filePath of filePaths) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      fileContent,
      ts.ScriptTarget.Latest,
      true
    );
    
    // Process the AST to extract type definitions
    processNode(sourceFile, typeDefinitions, filePath);
  }
  
  return typeDefinitions;
}

/**
 * Process a TypeScript AST node to extract type definitions
 * @param node TypeScript AST node
 * @param typeDefinitions Map to store extracted type definitions
 * @param filePath Source file path
 */
function processNode(node: ts.Node, typeDefinitions: TypeDefinitionsMap, filePath: string): void {
  // Extract interfaces
  if (ts.isInterfaceDeclaration(node) && node.name) {
    const name = node.name.text;
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const type = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    
    typeDefinitions.set(name, {
      name,
      type,
      source: filePath,
      isInterface: true
    });
  }
  
  // Extract type aliases
  if (ts.isTypeAliasDeclaration(node) && node.name) {
    const name = node.name.text;
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const type = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    
    typeDefinitions.set(name, {
      name,
      type,
      source: filePath,
      isTypeAlias: true
    });
  }
  
  // Extract enums
  if (ts.isEnumDeclaration(node) && node.name) {
    const name = node.name.text;
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const type = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    
    typeDefinitions.set(name, {
      name,
      type,
      source: filePath,
      isEnum: true
    });
  }
  
  // Extract function types
  if (ts.isFunctionDeclaration(node) && node.name) {
    const name = node.name.text;
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const type = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    
    typeDefinitions.set(name, {
      name,
      type,
      source: filePath,
      isFunction: true
    });
  }
  
  // Extract class declarations
  if (ts.isClassDeclaration(node) && node.name) {
    const name = node.name.text;
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    const type = printer.printNode(ts.EmitHint.Unspecified, node, node.getSourceFile());
    
    typeDefinitions.set(name, {
      name,
      type,
      source: filePath,
      isClass: true
    });
  }
  
  // Recursively process child nodes
  ts.forEachChild(node, child => processNode(child, typeDefinitions, filePath));
}

/**
 * Ensure output directory exists
 * @param outputPath Output directory path
 */
export async function ensureOutputDirectory(outputPath: string): Promise<void> {
  await fs.ensureDir(outputPath);
}

/**
 * Get the output file path for a transformed file
 * @param inputPath Original JavaScript file path
 * @param inputRoot Root input directory
 * @param outputRoot Root output directory
 * @returns Output TypeScript file path
 */
export function getOutputFilePath(inputPath: string, inputRoot: string, outputRoot: string): string {
  const relativePath = path.relative(inputRoot, inputPath);
  const outputPath = path.join(outputRoot, relativePath.replace(/\.js$/, '.ts'));
  return outputPath;
}

/**
 * Log a message if verbose mode is enabled
 * @param message Message to log
 * @param verbose Whether verbose mode is enabled
 */
export function verboseLog(message: string, verbose: boolean): void {
  if (verbose) {
    console.log(`[js-to-ts] ${message}`);
  }
}
