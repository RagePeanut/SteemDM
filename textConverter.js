var refs = {
    'A': {
        bold: '\u{1D5D4}',
        italic: '\u{1D608}'
    },
    'B': {
        bold: '\u{1D5D5}',
        italic: '\u{1D609}'
    },
    'C': {
        bold: '\u{1D5D6}',
        italic: '\u{1D60A}'
    },
    'D': {
        bold: '\u{1D5D7}',
        italic: '\u{1D60B}'
    },
    'E': {
        bold: '\u{1D5D8}',
        italic: '\u{1D60C}'
    },
    'F': {
        bold: '\u{1D5D9}',
        italic: '\u{1D60D}'
    },
    'G': {
        bold: '\u{1D5DA}',
        italic: '\u{1D60E}'
    },
    'H': {
        bold: '\u{1D5DB}',
        italic: '\u{1D60F}'
    },
    'I': {
        bold: '\u{1D5DC}',
        italic: '\u{1D610}'
    },
    'J': {
        bold: '\u{1D5DD}',
        italic: '\u{1D611}'
    },
    'K': {
        bold: '\u{1D5DE}',
        italic: '\u{1D612}'
    },
    'L': {
        bold: '\u{1D5DF}',
        italic: '\u{1D613}'
    },
    'M': {
        bold: '\u{1D5E0}',
        italic: '\u{1D614}'
    },
    'N': {
        bold: '\u{1D5E1}',
        italic: '\u{1D615}'
    },
    'O': {
        bold: '\u{1D5E2}',
        italic: '\u{1D616}'
    },
    'P': {
        bold: '\u{1D5E3}',
        italic: '\u{1D617}'
    },
    'Q': {
        bold: '\u{1D5E4}',
        italic: '\u{1D618}'
    },
    'R': {
        bold: '\u{1D5E5}',
        italic: '\u{1D619}'
    },
    'S': {
        bold: '\u{1D5E6}',
        italic: '\u{1D61A}'
    },
    'T': {
        bold: '\u{1D5E7}',
        italic: '\u{1D61B}'
    },
    'U': {
        bold: '\u{1D5E8}',
        italic: '\u{1D61C}'
    },
    'V': {
        bold: '\u{1D5E9}',
        italic: '\u{1D61D}'
    },
    'W': {
        bold: '\u{1D5EA}',
        italic: '\u{1D61E}'
    },
    'X': {
        bold: '\u{1D5EB}',
        italic: '\u{1D61F}'
    },
    'Y': {
        bold: '\u{1D5EC}',
        italic: '\u{1D620}'
    },
    'Z': {
        bold: '\u{1D5ED}',
        italic: '\u{1D621}'
    },
    'a': {
        bold: '\u{1D5EE}',
        italic: '\u{1D622}'
    },
    'b': {
        bold: '\u{1D5EF}',
        italic: '\u{1D623}'
    },
    'c': {
        bold: '\u{1D5F0}',
        italic: '\u{1D624}'
    },
    'd': {
        bold: '\u{1D5F1}',
        italic: '\u{1D625}'
    },
    'e': {
        bold: '\u{1D5F2}',
        italic: '\u{1D626}'
    },
    'f': {
        bold: '\u{1D5F3}',
        italic: '\u{1D627}'
    },
    'g': {
        bold: '\u{1D5F4}',
        italic: '\u{1D628}'
    },
    'h': {
        bold: '\u{1D5F5}',
        italic: '\u{1D629}'
    },
    'i': {
        bold: '\u{1D5F6}',
        italic: '\u{1D62A}'
    },
    'j': {
        bold: '\u{1D5F7}',
        italic: '\u{1D62B}'
    },
    'k': {
        bold: '\u{1D5F8}',
        italic: '\u{1D62C}'
    },
    'l': {
        bold: '\u{1D5F9}',
        italic: '\u{1D62D}'
    },
    'm': {
        bold: '\u{1D5FA}',
        italic: '\u{1D62E}'
    },
    'n': {
        bold: '\u{1D5FB}',
        italic: '\u{1D62F}'
    },
    'o': {
        bold: '\u{1D5FC}',
        italic: '\u{1D630}'
    },
    'p': {
        bold: '\u{1D5FD}',
        italic: '\u{1D631}'
    },
    'q': {
        bold: '\u{1D5FE}',
        italic: '\u{1D632}'
    },
    'r': {
        bold: '\u{1D5FF}',
        italic: '\u{1D633}'
    },
    's': {
        bold: '\u{1D600}',
        italic: '\u{1D634}'
    },
    't': {
        bold: '\u{1D601}',
        italic: '\u{1D635}'
    },
    'u': {
        bold: '\u{1D602}',
        italic: '\u{1D636}'
    },
    'v': {
        bold: '\u{1D603}',
        italic: '\u{1D637}'
    },
    'w': {
        bold: '\u{1D604}',
        italic: '\u{1D638}'
    },
    'x': {
        bold: '\u{1D605}',
        italic: '\u{1D639}'
    },
    'y': {
        bold: '\u{1D606}',
        italic: '\u{1D63A}'
    },
    'z': {
        bold: '\u{1D607}',
        italic: '\u{1D63B}'
    }
}

function convertTo(text, to) {
    // Checks the chars individually and applies the required styling to them if supported
    if(to === 'strikethrough')
        return text.split('').map(char => char.concat('\u0335')).join('');
    else 
        return text.split('').map(char => refs[char] ? refs[char][to] : char).join('');
}

module.exports = function() {

    this.convert = text => {

        text = text
            // Removing <center>, <div>, <p>, <sup> and <sub>
            .replace(/<\/?(p|center|su[pb]|div( class="(text-justify|pull-(right|left))")?)>/g, '')
            // HR
            .replace(/(\n+|^) {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(\n+|$)/g, '$1----------$3')
            .replace(/<hr *\/?>/g, '\n----------\n')
            // HTML to Markdown
            // -- Break : <br>
            .replace(/<br *\/?>/g, '\n')
            // -- Bold : <b> and <strong>
            .replace(/<\/?(b|strong)>/g, '**')
            // -- Italic : <i> and <em>
            .replace(/<\/?(i|em)>/g, '*')
            // -- Strikethrough : <del>, <s> and <strike>
            .replace(/<\/?(del|s(trike)?)>/g, '~~')
            // -- Titles : <h1> to <h6>
            .replace(/<h([1-6])> *(.*)<\/h\1>/g, (match, quantity, content) => {
                return '#'.repeat(quantity).concat(' ', content);
            })
            // -- Images
            .replace(/<img (?:alt="([^"]+)")? *src="([^"]+)" *(?:alt="([^"]+)")? *\/?>/g, '![$1$3]($2)')
            // -- Links
            .replace(/<a href="([^"]+)">([^<>]+)<\/a>/g, '[$2]($1)')
            // Bold
            .replace(/__(?=\S)([\s\S]*?\S)__(?!_)|\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/g, match => {
                return convertTo(match.substring(2, match.length - 2), 'bold');
            })
            // Italic
            .replace(/_(?=\S)([\s\S]*?\S)_(?!_)|\*(?=\S)([\s\S]*?\S)\*(?!\*)/g, match => {
                return convertTo(match.substring(1, match.length - 1), 'italic');
            })
            .replace(/~~(?=\S)([\s\S]*?\S)~~/g, (match, content) => {
                return convertTo(content, 'strikethrough');
            })
            // Lists (\u2022 = bullet point)
            .replace(/(^|\n)[*-] +/g, '$1\u2022 ');

        return text;

    }

}