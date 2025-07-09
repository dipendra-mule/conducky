#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..', 'src');

/**
 * Find and replace authentication error messages in TypeScript files
 */
function fixAuthMessages(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixAuthMessages(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      let changed = false;
      
      // Replace various authentication error messages
      const replacements = [
        { from: "'Not authenticated'", to: "'Authentication required'" },
        { from: '"Not authenticated"', to: '"Authentication required"' },
        { from: "'User not authenticated.'", to: "'Authentication required'" },
        { from: '"User not authenticated."', to: '"Authentication required"' },
        { from: "'User not authenticated'", to: "'Authentication required'" },
        { from: '"User not authenticated"', to: '"Authentication required"' }
      ];
      
      for (const replacement of replacements) {
        if (content.includes(replacement.from)) {
          content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated authentication messages in: ${path.relative(SOURCE_DIR, filePath)}`);
      }
    }
  }
}

console.log('🔧 Fixing authentication error messages...');
fixAuthMessages(SOURCE_DIR);
console.log('✅ Authentication message fix complete!');
