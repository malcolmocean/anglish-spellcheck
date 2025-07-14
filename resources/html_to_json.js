const fs = require('fs')

const html = fs.readFileSync('english_wordbook.html', 'utf8')

const lines = html.split('\n')

const entries = []

const wordsToDelete = {
  "us": true,
  "aardvark": true, // it's an afrikaans term for a south african animal
  // maybe ultimately would make sense to have a few modes
  // basically "are non-conquesty contextual loanwords okay?"
  // it doesn't quite map onto norman conquest per se
  // since may terms were coined in britain from latin & greek in like 15c
  // although maybe latin & greek wouldn't have been as popular
  // with english scholars without that
}

function splitParagraphs (str) {
  return str.split('</p><p>').map(s => s.replace(/<[^>]+>/g, '').trim())
}

function cleanUp (str) {
  // str = str.replace(/<\/p>/g, ',')
  str = str.replace(/<[^>]+>/g, '').trim()
  str = str.replace(/&amp;/g, '&')
  str = str.replace(/&lt;/g, '<')
  str = str.replace(/&#160;/g, '\xa0')
  return str
}

function commaToLineBreak (str) {
  return str.replace(/, */g, ',\n')
}

for (const line of lines) {
  if (line.trim().startsWith('<tr>')) {
    const cells = line.split('</td><td>')
    if (cells.length === 4) {
      const outword = cleanUp(cells[0])
      const kind = cleanUp(cells[1])
      const attested = splitParagraphs(cells[2]).map(p => commaToLineBreak(cleanUp(p)))
      const unattested = splitParagraphs(cells[3]).map(p => commaToLineBreak(cleanUp(p)))
      const entry = {outword, kind, attested, unattested}
      if (/\(.*(<|\d|foreign|french|german|latin|lat.|suffix|prefix|origin).*\)$/i.test(entry.outword)) {
        entry.why = entry.outword.replace(/.*\((.*(<|\d|foreign|french|german|latin|lat.|suffix|prefix|origin|swayed by).*)\)$/i, '$1')
        entry.outword = entry.outword.replace(/\s*\(.*(<|\d|foreign|french|german|latin|lat.|suffix|prefix|origin|swayed by).*$/i, '')
      }
      entries.push(entry)
    }
  }
}


// fs.writeFileSync('english_wordbook.min.json', JSON.stringify(entries))
// fs.writeFileSync('english_wordbook.json', JSON.stringify(entries, null, 2))
// fs.writeFileSync('english_wordbook2.json', JSON.stringify(entries, null, 2))
fs.writeFileSync('english_wordbook4.json', JSON.stringify(entries, null, 2))
