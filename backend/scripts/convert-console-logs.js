#!/usr/bin/env node

/**
 * Script to help convert console.log statements to proper Winston logging
 * This script identifies console.log statements and suggests replacements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_DIR = path.join(__dirname, '../src');
const ROUTES_DIR = path.join(SOURCE_DIR, 'routes');
const SERVICES_DIR = path.join(SOURCE_DIR, 'services');
const MIDDLEWARE_DIR = path.join(SOURCE_DIR, 'middleware');
const UTILS_DIR = path.join(SOURCE_DIR, 'utils');

// Files to process
const DIRS_TO_PROCESS = [ROUTES_DIR, SERVICES_DIR, MIDDLEWARE_DIR, UTILS_DIR];

// Files already processed (to avoid re-processing)
const PROCESSED_FILES = [
  'auth.routes.ts',
  'auth.service.ts'
];

/**
 * Find all console.log statements in TypeScript files
 */
function findConsoleStatements(dir) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results.push(...findConsoleStatements(filePath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      // Skip already processed files
      if (PROCESSED_FILES.includes(file)) {
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('console.')) {
          results.push({
            file: filePath,
            line: index + 1,
            content: line.trim(),
            relativeFile: path.relative(SOURCE_DIR, filePath)
          });
        }
      });
    }
  }
  
  return results;
}

/**
 * Generate replacement suggestions for console statements
 */
function generateReplacements(consoleStatements) {
  const suggestions = [];
  
  consoleStatements.forEach(statement => {
    let replacement = statement.content;
    
    // Convert console.log to logger.info
    if (statement.content.includes('console.log')) {
      replacement = replacement.replace('console.log', 'logger.info');
    }
    
    // Convert console.error to logger.error
    if (statement.content.includes('console.error')) {
      replacement = replacement.replace('console.error', 'logger.error');
    }
    
    // Convert console.warn to logger.warn
    if (statement.content.includes('console.warn')) {
      replacement = replacement.replace('console.warn', 'logger.warn');
    }
    
    // Convert console.debug to logger.debug
    if (statement.content.includes('console.debug')) {
      replacement = replacement.replace('console.debug', 'logger.debug');
    }
    
    suggestions.push({
      ...statement,
      replacement: replacement
    });
  });
  
  return suggestions;
}

/**
 * Check if file needs logger import
 */
function needsLoggerImport(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return !content.includes("import logger from '../config/logger'") && 
         !content.includes("import logger from '../../config/logger'") &&
         !content.includes("from '../config/logger'");
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning for console.log statements...\n');
  
  const consoleStatements = [];
  
  DIRS_TO_PROCESS.forEach(dir => {
    const statements = findConsoleStatements(dir);
    consoleStatements.push(...statements);
  });
  
  if (consoleStatements.length === 0) {
    console.log('✅ No console statements found in remaining files!');
    return;
  }
  
  console.log(`Found ${consoleStatements.length} console statements:\n`);
  
  // Group by file
  const fileGroups = {};
  consoleStatements.forEach(statement => {
    if (!fileGroups[statement.file]) {
      fileGroups[statement.file] = [];
    }
    fileGroups[statement.file].push(statement);
  });
  
  Object.keys(fileGroups).forEach(file => {
    const statements = fileGroups[file];
    const relativeFile = path.relative(process.cwd(), file);
    
    console.log(`📁 ${relativeFile}`);
    console.log(`   Needs logger import: ${needsLoggerImport(file) ? 'YES' : 'NO'}`);
    console.log(`   Console statements: ${statements.length}`);
    
    statements.forEach(statement => {
      console.log(`   Line ${statement.line}: ${statement.content}`);
    });
    
    console.log('');
  });
  
  // Generate summary
  console.log('\n📊 Summary:');
  console.log(`   Total files with console statements: ${Object.keys(fileGroups).length}`);
  console.log(`   Total console statements: ${consoleStatements.length}`);
  console.log(`   Files needing logger import: ${Object.keys(fileGroups).filter(needsLoggerImport).length}`);
  
  // Show most problematic files
  const sortedFiles = Object.keys(fileGroups).sort((a, b) => fileGroups[b].length - fileGroups[a].length);
  console.log('\n🔥 Most problematic files:');
  sortedFiles.slice(0, 5).forEach(file => {
    const relativeFile = path.relative(process.cwd(), file);
    console.log(`   ${relativeFile}: ${fileGroups[file].length} statements`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { findConsoleStatements, generateReplacements, needsLoggerImport };
