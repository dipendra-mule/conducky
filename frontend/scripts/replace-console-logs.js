#!/usr/bin/env node

/**
 * Script to automatically replace console statements with proper structured logging
 * For the frontend React/Next.js application using our custom logger
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, '..');
const EXCLUDED_DIRS = ['node_modules', '.next', 'coverage', '__tests__', '__mocks__', 'ctrf'];
const EXCLUDED_FILES = ['jest.setup.js', 'jest.config.js'];

// Files that have already been processed
const PROCESSED_FILES = [
  '_app.tsx',
  'app-sidebar.tsx', 
  'IncidentDetailView.tsx',
  'login.tsx',
  'index.tsx', // multiple index.tsx files were processed
  'profile.tsx',
  'forgot-password.tsx',
  'NavigationContext.tsx',
  'EventMetaCard.tsx'
];

/**
 * Check if a path should be excluded
 */
function shouldExclude(filePath) {
  const relativePath = path.relative(FRONTEND_DIR, filePath);
  
  // Exclude certain directories
  for (const excludedDir of EXCLUDED_DIRS) {
    if (relativePath.includes(excludedDir)) {
      return true;
    }
  }
  
  // Exclude test files
  if (relativePath.includes('.test.') || 
      relativePath.includes('.spec.') ||
      relativePath.includes('jest.') ||
      EXCLUDED_FILES.includes(path.basename(filePath))) {
    return true;
  }
  
  // Exclude our logger files
  if (relativePath.includes('lib/logger.ts') || 
      relativePath.includes('hooks/useLogger.ts')) {
    return true;
  }
  
  return false;
}

/**
 * Check if file needs logger import
 */
function needsLoggerImport(filePath, content) {
  return !content.includes("import { logger }") && 
         !content.includes("import { useLogger }") &&
         !content.includes("from '@/lib/logger'") &&
         !content.includes("from '@/hooks/useLogger'");
}

/**
 * Detect if file is a React component (has JSX/TSX)
 */
function isReactComponent(content) {
  return content.includes('export default function') || 
         content.includes('export const') ||
         content.includes('React.FC') ||
         content.includes('JSX.Element') ||
         content.includes('<') && content.includes('>');
}

/**
 * Add appropriate logger import to a file
 */
function addLoggerImport(filePath, content) {
  const lines = content.split('\n');
  
  // Find the last import statement
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ') && !lines[i].includes('//')) {
      lastImportIndex = i;
    }
  }
  
  let importToAdd;
  if (isReactComponent(content)) {
    // For React components, use the useLogger hook
    importToAdd = "import { useLogger } from '@/hooks/useLogger';";
  } else {
    // For non-React files (utilities, contexts, etc.), use direct logger
    importToAdd = "import { logger } from '@/lib/logger';";
  }
  
  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    lines.unshift(importToAdd);
  } else {
    // Add after the last import
    lines.splice(lastImportIndex + 1, 0, importToAdd);
  }
  
  return lines.join('\n');
}

/**
 * Replace console statements in non-React files
 */
function replaceConsoleInUtility(content) {
  return content
    .replace(/console\.error\(/g, 'logger.error(')
    .replace(/console\.warn\(/g, 'logger.warn(')
    .replace(/console\.info\(/g, 'logger.info(')
    .replace(/console\.debug\(/g, 'logger.debug(')
    .replace(/console\.log\(/g, 'logger.info(');
}

/**
 * Generate suggestions for React component console replacements
 * (These need manual intervention due to hook usage)
 */
function generateReactSuggestions(filePath, content) {
  const suggestions = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const consoleRegex = /\bconsole\.(log|error|warn|info|debug)\s*\(/;
    if (consoleRegex.test(line)) {
      let suggestion = '';
      
      if (line.includes('console.error')) {
        suggestion = 'Replace with: const { error } = useLogger(); ... error("message", context, errorObject)';
      } else if (line.includes('console.warn')) {
        suggestion = 'Replace with: const { warn } = useLogger(); ... warn("message", context)';
      } else if (line.includes('console.info') || line.includes('console.log')) {
        suggestion = 'Replace with: const { info } = useLogger(); ... info("message", context)';
      } else if (line.includes('console.debug')) {
        suggestion = 'Replace with: const { debug } = useLogger(); ... debug("message", context)';
      }
      
      suggestions.push({
        file: path.relative(FRONTEND_DIR, filePath),
        line: index + 1,
        content: line.trim(),
        suggestion
      });
    }
  });
  
  return suggestions;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  const fileName = path.basename(filePath);
  const relativePath = path.relative(FRONTEND_DIR, filePath);
  
  // Skip already processed files
  if (PROCESSED_FILES.some(processed => fileName.includes(processed))) {
    console.log(`⏭️  Skipping ${relativePath} (already processed)`);
    return { processed: false, suggestions: [] };
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Check if file has console statements
    const hasConsole = /\bconsole\.(log|error|warn|info|debug)\s*\(/.test(content);
    if (!hasConsole) {
      return { processed: false, suggestions: [] };
    }
    
    console.log(`🔧 Processing ${relativePath}...`);
    
    let suggestions = [];
    let wasModified = false;
    
    if (isReactComponent(content)) {
      // For React components, generate suggestions for manual replacement
      suggestions = generateReactSuggestions(filePath, content);
      
      // Add useLogger import if needed
      if (needsLoggerImport(filePath, content)) {
        content = addLoggerImport(filePath, content);
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ Added useLogger import`);
        wasModified = true;
      }
      
      console.log(`  📝 Found ${suggestions.length} console statements (manual replacement needed)`);
      
    } else {
      // For utility files, do automatic replacement
      if (needsLoggerImport(filePath, content)) {
        content = addLoggerImport(filePath, content);
        wasModified = true;
      }
      
      const newContent = replaceConsoleInUtility(content);
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`  ✅ Replaced console statements automatically`);
        wasModified = true;
      }
    }
    
    return { processed: wasModified, suggestions };
    
  } catch (error) {
    console.error(`❌ Error processing ${relativePath}:`, error.message);
    return { processed: false, suggestions: [] };
  }
}

/**
 * Find and process all relevant files
 */
function processDirectory(dir) {
  const results = {
    processedFiles: 0,
    suggestions: []
  };
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    if (shouldExclude(filePath)) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const subResults = processDirectory(filePath);
      results.processedFiles += subResults.processedFiles;
      results.suggestions.push(...subResults.suggestions);
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      const result = processFile(filePath);
      if (result.processed) {
        results.processedFiles++;
      }
      if (result.suggestions.length > 0) {
        results.suggestions.push(...result.suggestions);
      }
    }
  }
  
  return results;
}

/**
 * Main execution
 */
function main() {
  if (process.argv.includes('--dry-run')) {
    console.log('🧪 DRY RUN MODE - No files will be modified');
    return;
  }
  
  console.log('🚀 Starting frontend console.log replacement...\n');
  
  // Process all frontend files
  const results = processDirectory(FRONTEND_DIR);
  
  console.log(`\n✅ Frontend console.log replacement completed!`);
  console.log(`📊 Files processed: ${results.processedFiles}`);
  
  if (results.suggestions.length > 0) {
    console.log(`\n📝 Manual replacements needed for React components:`);
    console.log('=' .repeat(60));
    
    results.suggestions.forEach(suggestion => {
      console.log(`\n📁 ${suggestion.file}:${suggestion.line}`);
      console.log(`   Current: ${suggestion.content}`);
      console.log(`   ${suggestion.suggestion}`);
    });
    
    console.log('\n💡 For React components:');
    console.log('   1. Add useLogger hook: const { error, warn, info, debug } = useLogger();');
    console.log('   2. Replace console statements with appropriate logger methods');
    console.log('   3. Add context objects as second parameter for better debugging');
  }
  
  console.log('\n📝 Please review the changes and run tests to ensure everything works correctly.');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, processDirectory };
