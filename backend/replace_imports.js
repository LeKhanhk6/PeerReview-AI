import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, 'src');
const testDirectoryPath = path.join(__dirname, 'tests');

function replaceInFile(filePath) {
    if (!filePath.endsWith('.js')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace utils/constants.js with constants/index.js
    content = content.replace(/(\.\.\/)*utils\/constants\.js/g, (match) => {
        return match.replace('utils/constants.js', 'constants/index.js');
    });

    // Replace utils/submission.constants.js with constants/index.js
    content = content.replace(/(\.\.\/)*utils\/submission\.constants\.js/g, (match) => {
        return match.replace('utils/submission.constants.js', 'constants/index.js');
    });

    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else {
            replaceInFile(fullPath);
        }
    }
}

processDirectory(directoryPath);
processDirectory(testDirectoryPath);
console.log('Replaced constants imports successfully.');
