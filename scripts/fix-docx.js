// Patches ARCHITECTURE.docx: forces white background + black text on all runs and paragraphs
const fs = require('fs');
const path = require('path');

const AdmZip = require('adm-zip');

const filePath = path.join(__dirname, '..', 'ARCHITECTURE.docx');
const zip = new AdmZip(filePath);

// Helper: strip shading/highlight from XML, force black color
function patchXml(xml) {
  // Remove background shading on paragraphs and runs (w:shd elements with non-white fills)
  xml = xml.replace(/<w:shd[^/]*(\/?>|>.*?<\/w:shd>)/g, '');

  // Remove highlight (colored text backgrounds)
  xml = xml.replace(/<w:highlight[^/]*(\/?>|>.*?<\/w:highlight>)/g, '');

  // Remove any pageColor / background settings
  xml = xml.replace(/<w:background[^>]*\/>/g, '');
  xml = xml.replace(/<w:background[^>]*>.*?<\/w:background>/gs, '');

  // Set document background to white in settings
  return xml;
}

// Patch document.xml
const docEntry = zip.getEntry('word/document.xml');
if (docEntry) {
  let xml = docEntry.getData().toString('utf8');
  xml = patchXml(xml);
  zip.updateFile('word/document.xml', Buffer.from(xml, 'utf8'));
}

// Patch styles.xml — set all w:color to black, remove shading
const stylesEntry = zip.getEntry('word/styles.xml');
if (stylesEntry) {
  let xml = stylesEntry.getData().toString('utf8');
  xml = patchXml(xml);
  // Replace any non-auto, non-black font color with black
  xml = xml.replace(/<w:color w:val="(?!000000|auto)[^"]*"\/>/g, '<w:color w:val="000000"/>');
  zip.updateFile('word/styles.xml', Buffer.from(xml, 'utf8'));
}

// Patch settings.xml — ensure no background color
const settingsEntry = zip.getEntry('word/settings.xml');
if (settingsEntry) {
  let xml = settingsEntry.getData().toString('utf8');
  xml = xml.replace(/<w:background[^>]*\/>/g, '');
  xml = xml.replace(/<w:background[^>]*>.*?<\/w:background>/gs, '');
  zip.updateFile('word/settings.xml', Buffer.from(xml, 'utf8'));
}

zip.writeZip(filePath);
console.log('Patched ARCHITECTURE.docx — white background, black text');
