const fs = require('fs');
const path = require('path');

const DICT_DIR = path.join(__dirname, '한국어기초사전');
const OUTPUT_FILE = path.join(__dirname, 'dictionary.json');

// Regular Expressions for parsing (simple & fast)
// Note: This assumes the standard formatting of NIKL XMLs
const RE_ENTRY_START = /<LexicalEntry/g;
const RE_POS_NOUN = /<feat att="partOfSpeech" val="명사"/;
const RE_WORD_FORM = /<feat att="writtenForm" val="([^"]+)"/;
const RE_ENTRY_END = /<\/LexicalEntry>/;

async function processFiles() {
    const files = fs.readdirSync(DICT_DIR).filter(file => file.endsWith('.xml'));
    console.log(`Found ${files.length} XML files.`);

    const wordSet = new Set();
    let totalEntries = 0;

    for (const file of files) {
        console.log(`Processing ${file}...`);
        const content = fs.readFileSync(path.join(DICT_DIR, file), 'utf-8');

        // Split by LexicalEntry to handle each word block
        // This is memory intensive but for 35MB files it should be okay (simpler than streaming xml parser)
        const entries = content.split('<LexicalEntry');

        // Skip the header part (index 0)
        for (let i = 1; i < entries.length; i++) {
            const entryBlock = entries[i];

            // Check if it's a noun
            if (RE_POS_NOUN.test(entryBlock)) {
                // Extract word
                const match = entryBlock.match(RE_WORD_FORM);
                if (match && match[1]) {
                    let word = match[1];

                    // Cleanup: remove digits, dashes, etc if any
                    word = word.replace(/[^가-힣]/g, '');

                    if (word.length >= 2) {
                        wordSet.add(word);
                    }
                }
            }
        }
    }

    console.log(`Total unique nouns extracted: ${wordSet.size}`);

    const wordArray = Array.from(wordSet).sort();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(wordArray, null, 0), 'utf-8'); // Minified
    console.log(`Saved to ${OUTPUT_FILE}`);
}

processFiles().catch(err => console.error(err));
