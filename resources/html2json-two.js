const fs = require('fs')

const html = fs.readFileSync('english_wordbook.html', 'utf8')

const lines = html.split('\n')

const entries = []
let currentEntry = null

function cleanUp (str) {
  str = str.replace(/<[^>]+>/g, '').trim()
  str = str.replace(/&amp;/, '&')
  str = str.replace(/&lt;/, '<')
  str = str.replace(/&#160;/, '\xa0')
  return str
}

for (const line of lines) {
  if (line.trim().startsWith('<tr>')) {
    const cells = line.split('</td><td>')
    if (cells.length === 4) {
      if (currentEntry !== null) {
        entries.push(currentEntry)
      }
      const outword = cleanUp(cells[0])
      const kind = cleanUp(cells[1])
      const attested = cleanUp(cells[2]).split(',').map(s => s.trim()).filter(s => s !== '')
      const unattested = cleanUp(cells[3]).split(',').map(s => s.trim()).filter(s => s !== '')
      currentEntry = { outword, kind, attested, unattested }
    }
  } else if (currentEntry !== null) {
    currentEntry.unattested.push(line.trim())
  }
}

if (currentEntry !== null) {
  entries.push(currentEntry)
}

fs.writeFileSync('english_wordbook.min.json', JSON.stringify(entries))
// fs.writeFileSync('english_wordbook.json', JSON.stringify(entries, null, 2))
// fs.writeFileSync('english_wordbook2.json', JSON.stringify(entries, null, 2))
