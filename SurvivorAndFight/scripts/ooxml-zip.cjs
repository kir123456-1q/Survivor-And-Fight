const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const CT_MAP = {
  '.rels': 'application/vnd.openxmlformats-package.relationships+xml',
  '.xml': 'application/xml',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.emf': 'image/x-emf',
  '.wmf': 'image/x-wmf',
};

const OVERRIDE_MAP = [
  ['/docProps/app.xml', 'application/vnd.openxmlformats-officedocument.extended-properties+xml'],
  ['/docProps/core.xml', 'application/vnd.openxmlformats-package.core-properties+xml'],
  ['/ppt/presentation.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml'],
  ['/ppt/presProps.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presProps+xml'],
  ['/ppt/viewProps.xml', 'application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml'],
  ['/ppt/tableStyles.xml', 'application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml'],
  [/\/slideMasters\/slideMaster\d+\.xml$/, 'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml'],
  [/\/slideLayouts\/slideLayout\d+\.xml$/, 'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml'],
  [/\/slides\/slide\d+\.xml$/, 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml'],
  [/\/notesSlides\/notesSlide\d+\.xml$/, 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml'],
  [/\/theme\/theme\d+\.xml$/, 'application/vnd.openxmlformats-officedocument.theme+xml'],
  [/\/charts\/chart\d+\.xml$/, 'application/vnd.openxmlformats-officedocument.drawingml.chart+xml'],
  [/\/embeddings\/[^/]+\.xlsx$/, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
];

function walkFiles(dir, base = '') {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${ent.name}` : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(full, rel));
    else out.push({ rel: rel.replace(/\\/g, '/'), full });
  }
  return out;
}

function overrideType(partName) {
  for (const [pat, type] of OVERRIDE_MAP) {
    if (typeof pat === 'string') {
      if (partName === pat) return type;
    } else if (pat.test(partName)) return type;
  }
  return null;
}

function rebuildContentTypes(rootDir) {
  const files = walkFiles(rootDir);
  const defaults = new Set();
  const overrides = [];

  for (const { rel } of files) {
    if (rel === '[Content_Types].xml') continue;
    const part = `/${rel}`;
    const ext = path.extname(rel).toLowerCase();
    const ot = overrideType(part);
    if (ot) overrides.push({ part, type: ot });
    else if (CT_MAP[ext]) defaults.add(ext.slice(1));
  }

  let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`;
  for (const ext of [...defaults].sort()) {
    xml += `<Default Extension="${ext}" ContentType="${CT_MAP['.' + ext]}"/>`;
  }
  for (const { part, type } of overrides.sort((a, b) => a.part.localeCompare(b.part))) {
    xml += `<Override PartName="${part}" ContentType="${type}"/>`;
  }
  xml += '</Types>';
  fs.writeFileSync(path.join(rootDir, '[Content_Types].xml'), xml);
}

async function zipOoxml(srcDir, outPptx) {
  rebuildContentTypes(srcDir);
  const zip = new JSZip();
  for (const { rel, full } of walkFiles(srcDir)) {
    zip.file(rel, fs.readFileSync(full));
  }
  const buf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
  fs.writeFileSync(outPptx, buf);
}

module.exports = { zipOoxml, rebuildContentTypes, walkFiles };
