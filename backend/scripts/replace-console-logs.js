#!/usr/bin/env node

/**
 * Script to automatically replace console.log statements with proper Winston logging
 * This script processes files safely and adds logger imports where needed
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../src');

// Files already processed (to avoid re-processing)
const PROCESSED_FILES = [
  'auth.routes.ts',
  'auth.service.ts',
  'admin.routes.ts' // We started this one manually
];

/**
 * Check if file needs logger import
 */
function needsLoggerImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return !content.includes("import logger from '../config/logger'") && 
         !content.includes("import logger from '../../config/logger'");
}

/**
 * Add logger import to a file
 */
function addLoggerImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find the last import statement
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('//')) {
      lastImportIndex = i;
    }
  }
  
  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    lines.unshift("import logger from '../config/logger';");
  } else {
    // Add after the last import
    const relativePath = path.relative(SOURCE_DIR, filePath);
    const depth = relativePath.split('/').length - 1;
    const importPath = '../'.repeat(depth) + 'config/logger';
    lines.splice(lastImportIndex + 1, 0, `import logger from '${importPath}';`);
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
}

/**
 * Replace console statements in a file
 */
function replaceConsoleStatements(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace different console methods
  let updatedContent = content
    .replace(/console\.error\(/g, 'logger.error(')
    .replace(/console\.warn\(/g, 'logger.warn(')
    .replace(/console\.info\(/g, 'logger.info(')
    .replace(/console\.debug\(/g, 'logger.debug(');
  
  // Handle console.log - most should become logger.info, but some debug statements should be logger.debug
  updatedContent = updatedContent.replace(/console\.log\(/g, (match, offset) => {
    const surroundingText = updatedContent.substring(Math.max(0, offset - 100), offset + 100);
    
    // If it looks like debug output, use logger.debug
    if (surroundingText.includes('DEBUG') || 
        surroundingText.includes('debug') || 
        surroundingText.includes('Test') ||
        surroundingText.includes('TEST')) {
      return 'logger.debug(';
    }
    
    // Otherwise use logger.info
    return 'logger.info(';
  });
  
  fs.writeFileSync(filePath, updatedContent);
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip already processed files
  if (PROCESSED_FILES.includes(fileName)) {
    console.log(`⏭️  Skipping ${fileName} (already processed)`);
    return;
  }
  
  try {
    console.log(`🔧 Processing ${fileName}...`);
    
    // Add logger import if needed
    if (needsLoggerImport(filePath)) {
      addLoggerImport(filePath);
      console.log(`  ✅ Added logger import`);
    }
    
    // Replace console statements
    replaceConsoleStatements(filePath);
    console.log(`  ✅ Replaced console statements`);
    
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error.message);
  }
}

/**
 * Find and process all TypeScript files
 */
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      processFile(filePath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  if (process.argv.includes('--dry-run')) {
    console.log('🧪 DRY RUN MODE - No files will be modified');
    return;
  }
  
  console.log('🚀 Starting automated console.log replacement...\n');
  
  // Process all source files
  processDirectory(SOURCE_DIR);
  
  console.log('\n✅ Console.log replacement completed!');
  console.log('📝 Please review the changes and run tests to ensure everything works correctly.');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, replaceConsoleStatements, addLoggerImport };
