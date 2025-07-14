const fs = require('fs')

const json = require('./english_wordbook.json')

throw "this currently does dumb shit with make-use-of and get-used-to"
// probably need to do a smarter regex
// lots of other things to improve too

// also 
for (var i in json) {
  const entry = json[i]
  if (/\(.*(<|\d|foreign|french|german|latin|lat.|suffix|prefix|origin).*\)$/i.test(entry.outword)) {
    entry.why = entry.outword.replace(/.*\((.*(<|\d|foreign|french|german|latin|lat.|suffix|prefix|origin|swayed by).*)\)$/i, '$1')
    entry.outword = entry.outword.replace(/\s*\(.*(<|\d|foreign|french|german|latin|lat.|suffix|prefix|origin|swayed by).*$/i, '')
  }
}

// fs.writeFileSync('english_wordbook.min.json', JSON.stringify(entries))
fs.writeFileSync('english_wordbook.json', JSON.stringify(entries, null, 2))
