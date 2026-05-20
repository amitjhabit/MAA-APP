import zipfile, shutil, os, re

src = os.path.join(os.path.dirname(__file__), '..', 'ARCHITECTURE.docx')
tmp = src + '.tmp'

shutil.copy2(src, tmp)

with zipfile.ZipFile(tmp, 'r') as zin, zipfile.ZipFile(src, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)

        if item.filename in ('word/document.xml', 'word/styles.xml', 'word/settings.xml'):
            xml = data.decode('utf-8')

            # Remove all shading elements (colored code block backgrounds etc.)
            xml = re.sub(r'<w:shd[^>]*/>', '', xml)
            xml = re.sub(r'<w:shd[^>]*>.*?</w:shd>', '', xml, flags=re.DOTALL)

            # Remove highlight elements
            xml = re.sub(r'<w:highlight[^>]*/>', '', xml)

            # Remove document background color
            xml = re.sub(r'<w:background[^>]*/>', '', xml)
            xml = re.sub(r'<w:background[^>]*>.*?</w:background>', '', xml, flags=re.DOTALL)

            # Force all font colors to black (000000), leave "auto" alone
            xml = re.sub(r'<w:color w:val="(?!000000|auto)[A-Fa-f0-9]{6}"', '<w:color w:val="000000"', xml)

            data = xml.encode('utf-8')

        zout.writestr(item, data)

os.remove(tmp)
print('Done — white background, black text applied to ARCHITECTURE.docx')
