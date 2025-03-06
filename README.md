# JS to TS Transformer

A tool to convert JavaScript files to TypeScript, integrating existing `.d.ts` type definitions.

## Features

- Converts JavaScript files to TypeScript
- Integrates existing type definitions from `.d.ts` files
- Transforms CommonJS (`require`/`module.exports`) to ES modules (`import`/`export`)
- Adds type annotations to variables, functions, and parameters
- Preserves comments and code formatting
- Command-line interface for easy usage

## Installation

### Global Installation

```bash
npm install -g js-to-ts-transformer
```

### Local Installation

```bash
npm install js-to-ts-transformer
```

## Usage

### Command Line Interface

```bash
# Convert a single file
js-to-ts path/to/file.js

# Convert a directory
js-to-ts path/to/directory

# Specify output directory
js-to-ts path/to/directory -o path/to/output

# Verbose output
js-to-ts path/to/directory -v

# Ignore specific patterns
js-to-ts path/to/directory -i "**/*.min.js" "**/vendor/**"

# Delete original JavaScript files
js-to-ts path/to/directory --no-keep-original

# Disable strict mode
js-to-ts path/to/directory --no-strict
```

### Programmatic Usage

```javascript
import { convertJsToTs } from 'js-to-ts-transformer';

async function convert() {
  const results = await convertJsToTs({
    input: 'path/to/directory',
    output: 'path/to/output',
    overwrite: false,
    strict: true,
    ignore: ['**/*.min.js'],
    keepOriginal: true,
    verbose: false
  });
  
  console.log(`Successfully converted: ${results.filter(r => r.success).length} files`);
}

convert().catch(console.error);
```

## Options

| Option | CLI Flag | Description | Default |
|--------|----------|-------------|---------|
| `input` | (argument) | Input file or directory path | (required) |
| `output` | `-o, --output` | Output directory path | `{input}/ts-output` |
| `overwrite` | `--overwrite` | Overwrite existing files | `false` |
| `strict` | `--no-strict` | Use strict mode in TypeScript | `true` |
| `ignore` | `-i, --ignore` | File patterns to ignore | `[]` |
| `keepOriginal` | `--no-keep-original` | Keep original JavaScript files | `true` |
| `verbose` | `-v, --verbose` | Print verbose output | `false` |

## How It Works

1. Scans the input directory for JavaScript files and TypeScript definition files (`.d.ts`)
2. Extracts type information from the definition files
3. Parses each JavaScript file into an AST (Abstract Syntax Tree)
4. Transforms the AST by adding type annotations and converting syntax
5. Generates TypeScript code from the transformed AST
6. Writes the TypeScript files to the output directory

## License

MIT
