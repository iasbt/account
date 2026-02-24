
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

// Exclude list
const ignore = ['node_modules', '.git', 'dist', 'coverage', '.DS_Store', '.trae'];

function walk(dir, prefix = '') {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
        console.error(`Error reading ${dir}: ${err.message}`);
        return;
    }

    // Filter and sort: directories first
    const filtered = entries
        .filter(e => !ignore.includes(e.name))
        .sort((a, b) => {
            if (a.isDirectory() && !b.isDirectory()) return -1;
            if (!a.isDirectory() && b.isDirectory()) return 1;
            return a.name.localeCompare(b.name);
        });

    filtered.forEach((entry, index) => {
        const isLast = index === filtered.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        console.log(`${prefix}${pointer}${entry.name}`);
        
        if (entry.isDirectory()) {
            walk(path.join(dir, entry.name), prefix + (isLast ? '    ' : '│   '));
        }
    });
}

console.log(path.basename(root));
walk(root);
