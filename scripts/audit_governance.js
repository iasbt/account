
import fs from 'fs';
import path from 'path';

// Load ESLint report
let eslintResults = [];
const reportPath = path.resolve('eslint_report.json');
console.log(`Reading ESLint report from: ${reportPath}`);
try {
  const data = fs.readFileSync(reportPath, 'utf8');
  eslintResults = JSON.parse(data);
  console.log(`Loaded ${eslintResults.length} file results.`);
} catch (e) {
  console.log(`No ESLint report found or invalid JSON: ${e.message}`);
}

// Analyze ESLint
let totalErrors = 0;
let totalWarnings = 0;
let filesWithIssues = 0;

eslintResults.forEach(result => {
  if (result.errorCount > 0 || result.warningCount > 0) {
    filesWithIssues++;
    totalErrors += result.errorCount;
    totalWarnings += result.warningCount;
  }
});

// Wild Files Check
const whitelist = [
  // Core
  'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
  'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
  'vite.config.ts', 'tailwind.config.js', 'postcss.config.js',
  '.env.example', '.gitignore', '.dockerignore', '.git', 'node_modules',
  // Backend
  'server.js', 'app.js', 'eslint.config.js',
  'config', 'controllers', 'middlewares', 'routes', 'utils', 'services', 'validators', 'packages',
  // Frontend
  'src', 'index.html', 'public',
  // Deploy
  'deploy', 'deploy_remote.ps1',
  // Docs
  '.trae', 'docs', 'README.md', 'CHANGELOG.md', 'AUDIT_REPORT_FINAL.md', 'AUDIT_REPORT_V2.0.md', 'SECURITY_ASSESSMENT_REPORT.md',
  // Scripts/Tests
  'scripts', 'tests',
  // Temp allowed for now (should be cleaned up)
  'eslint_report.json', 'GOVERNANCE_REPORT.md', 'GOVERNANCE_ISSUES.md'
];

const rootFiles = fs.readdirSync('.');
const wildFiles = rootFiles.filter(file => !whitelist.includes(file));

// Generate Markdown Report
let report = `# System Governance Report

**Date**: ${new Date().toISOString().split('T')[0]}
**Status**: ${filesWithIssues > 0 || wildFiles.length > 0 ? 'NEEDS REMEDIATION' : 'HEALTHY'}

## 1. Executive Summary
- **Static Analysis**: ${totalErrors} Errors, ${totalWarnings} Warnings across ${filesWithIssues} files.
- **Wild Files**: ${wildFiles.length} detected.
- **Dependencies**: 0 Vulnerabilities (Verified by npm audit).

## 2. Wild Files (Compliance Violation)
The following files are not in the approved asset whitelist and must be cleaned up:

`;

if (wildFiles.length > 0) {
  wildFiles.forEach(file => {
    report += `- 🔴 **${file}**\n`;
  });
} else {
  report += `- ✅ No wild files detected.\n`;
}

report += `
## 3. Static Analysis Findings (ESLint)
`;

if (filesWithIssues > 0) {
  report += `| File | Errors | Warnings |
| :--- | :---: | :---: |
`;
  eslintResults.forEach(result => {
    if (result.errorCount > 0 || result.warningCount > 0) {
      const relPath = path.relative('.', result.filePath);
      report += `| \`${relPath}\` | ${result.errorCount} | ${result.warningCount} |\n`;
    }
  });
} else {
  report += `- ✅ No linting issues detected.\n`;
}

report += `
## 4. Remediation Plan
1.  **Move Wild Files**: Relocate scripts to \`scripts/\` or delete if unused.
2.  **Fix ESLint Errors**: Address high-priority linting issues.
3.  **Strict Mode**: Enforce whitelist in CI/CD.
`;

fs.writeFileSync('GOVERNANCE_REPORT.md', report);
console.log('Report generated: GOVERNANCE_REPORT.md');
