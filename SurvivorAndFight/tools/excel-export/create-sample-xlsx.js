/**
 * Create sample.xlsx for regression testing. Format matches CONFIG_SCHEMA:
 * row 0 = id, name, hp, attack, tags
 * row 1 = int, string, int, float, list<int>
 * row 2+ = data
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const rows = [
    ['id', 'name', 'hp', 'attack', 'tags'],
    ['int', 'string', 'int', 'float', 'list<int>'],
    [1, 'warrior', 100, 10.5, '1,2,3'],
    [2, 'mage', 60, 25.0, '2,4'],
    [3, 'archer', 80, 15.0, '1,3'],
];

const ws = XLSX.utils.aoa_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'roles');
const outPath = path.join(__dirname, 'sample.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Created', outPath);
