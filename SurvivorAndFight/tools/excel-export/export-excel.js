/**
 * Excel → JSON config table export.
 * Usage: node export-excel.js [input.xlsx] [outputDir]
 *   Or:  node export-excel.js --sample  (exports built-in sample to out/)
 *
 * Excel format: row 0 = headers, row 1 = types (int|float|string|list<int>|list<float>|list<string>), row 2+ = data.
 * Output: one JSON file per sheet, shape { "list": [ { id, ... }, ... ] }.
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const TYPE_INT = 'int';
const TYPE_FLOAT = 'float';
const TYPE_STRING = 'string';
const TYPE_LIST_INT = 'list<int>';
const TYPE_LIST_FLOAT = 'list<float>';
const TYPE_LIST_STRING = 'list<string>';

function normalizeType(s) {
    if (typeof s !== 'string') return '';
    return s.trim().toLowerCase();
}

function parseCell(value, type) {
    const t = normalizeType(type);
    if (value === undefined || value === null || value === '') {
        if (t === TYPE_INT || t === TYPE_FLOAT) return 0;
        if (t === TYPE_LIST_INT || t === TYPE_LIST_FLOAT) return [];
        if (t === TYPE_LIST_STRING) return [];
        return '';
    }
    const str = String(value).trim();
    switch (t) {
        case TYPE_INT: {
            const n = parseInt(str, 10);
            return Number.isNaN(n) ? 0 : n;
        }
        case TYPE_FLOAT: {
            const n = parseFloat(str);
            return Number.isNaN(n) ? 0 : n;
        }
        case TYPE_STRING:
            return str;
        case TYPE_LIST_INT:
            return str.split(',').map((s) => {
                const n = parseInt(s.trim(), 10);
                return Number.isNaN(n) ? 0 : n;
            });
        case TYPE_LIST_FLOAT:
            return str.split(',').map((s) => {
                const n = parseFloat(s.trim());
                return Number.isNaN(n) ? 0 : n;
            });
        case TYPE_LIST_STRING:
            return str.split(',').map((s) => s.trim());
        default:
            return str;
    }
}

function isRowEmpty(row) {
    if (!row || !Array.isArray(row)) return true;
    return row.every((c) => c === undefined || c === null || c === '');
}

function sheetToTable(worksheet) {
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (rows.length < 2) return { list: [] };
    const headers = rows[0].map((h) => (h != null ? String(h).trim() : ''));
    const types = rows[1].map((t) => (t != null ? String(t).trim() : 'string'));
    const list = [];
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (isRowEmpty(row)) continue;
        const obj = {};
        for (let c = 0; c < headers.length; c++) {
            const key = headers[c] || `col${c}`;
            obj[key] = parseCell(row[c], types[c] || 'string');
        }
        list.push(obj);
    }
    return { list };
}

function exportWorkbook(inputPath, outputDir) {
    const workbook = XLSX.readFile(inputPath, { type: 'file' });
    const baseName = path.basename(inputPath, path.extname(inputPath));
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const table = sheetToTable(sheet);
        const safeName = sheetName.replace(/[/\\?*:[\]]/g, '_');
        const outPath = path.join(outputDir, `${baseName}_${safeName}.json`);
        fs.writeFileSync(outPath, JSON.stringify(table, null, 2), 'utf8');
        console.log('Wrote', outPath);
    }
}

function runSample() {
    const samplePath = path.join(__dirname, 'sample.xlsx');
    const outDir = path.join(__dirname, 'out');
    if (!fs.existsSync(samplePath)) {
        console.error('Sample file not found:', samplePath, '- run "npm run create-sample" first.');
        process.exit(1);
    }
    exportWorkbook(samplePath, outDir);
}

function main() {
    const args = process.argv.slice(2);
    if (args[0] === '--sample') {
        runSample();
        return;
    }
    const inputPath = args[0] || path.join(__dirname, 'sample.xlsx');
    const outputDir = args[1] || path.join(__dirname, 'out');
    if (!fs.existsSync(inputPath)) {
        console.error('Input file not found:', inputPath);
        console.error('Usage: node export-excel.js [input.xlsx] [outputDir]');
        console.error('   Or: node export-excel.js --sample');
        process.exit(1);
    }
    exportWorkbook(inputPath, outputDir);
}

main();
