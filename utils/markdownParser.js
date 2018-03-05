const refs = {
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
    'É': {
        bold: '\u{1D5D8}\u0301',
        italic: '\u{1D60C}\u0301'
    },
    'È': {
        bold: '\u{1D5D8}\u0300',
        italic: '\u{1D60C}\u0300'
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
    'à': {
        bold: '\u{1D5EE}\u0300',
        italic: '\u{1D622}\u0300'
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
    'é': {
        bold: '\u{1D5F2}\u0301',
        italic: '\u{1D626}\u0301'
    },
    'è': {
        bold: '\u{1D5F2}\u0300',
        italic: '\u{1D626}\u0300'
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

const mathRefs = {
    '\u{1D5D4}': '\u{1D63C}',
    '\u{1D5D5}': '\u{1D63D}',
    '\u{1D5D6}': '\u{1D63E}',
    '\u{1D5D7}': '\u{1D63F}',
    '\u{1D5D8}': '\u{1D640}',
    '\u{1D5D9}': '\u{1D641}',
    '\u{1D5DA}': '\u{1D642}',
    '\u{1D5DB}': '\u{1D643}',
    '\u{1D5DC}': '\u{1D644}',
    '\u{1D5DD}': '\u{1D645}',
    '\u{1D5DE}': '\u{1D646}',
    '\u{1D5DF}': '\u{1D647}',
    '\u{1D5E0}': '\u{1D648}',
    '\u{1D5E1}': '\u{1D649}',
    '\u{1D5E2}': '\u{1D64A}',
    '\u{1D5E3}': '\u{1D64B}',
    '\u{1D5E4}': '\u{1D64C}',
    '\u{1D5E5}': '\u{1D64D}',
    '\u{1D5E6}': '\u{1D64E}',
    '\u{1D5E7}': '\u{1D64F}',
    '\u{1D5E8}': '\u{1D650}',
    '\u{1D5E9}': '\u{1D651}',
    '\u{1D5EA}': '\u{1D652}',
    '\u{1D5EB}': '\u{1D653}',
    '\u{1D5EC}': '\u{1D654}',
    '\u{1D5ED}': '\u{1D655}',
    '\u{1D5EE}': '\u{1D656}',
    '\u{1D5EF}': '\u{1D657}',
    '\u{1D5F0}': '\u{1D658}',
    '\u{1D5F1}': '\u{1D659}',
    '\u{1D5F2}': '\u{1D65A}',
    '\u{1D5F3}': '\u{1D65B}',
    '\u{1D5F4}': '\u{1D65C}',
    '\u{1D5F5}': '\u{1D65D}',
    '\u{1D5F6}': '\u{1D65E}',
    '\u{1D5F7}': '\u{1D65F}',
    '\u{1D5F8}': '\u{1D660}',
    '\u{1D5F9}': '\u{1D661}',
    '\u{1D5FA}': '\u{1D662}',
    '\u{1D5FB}': '\u{1D663}',
    '\u{1D5FC}': '\u{1D664}',
    '\u{1D5FD}': '\u{1D665}',
    '\u{1D5FE}': '\u{1D666}',
    '\u{1D5FF}': '\u{1D667}',
    '\u{1D600}': '\u{1D668}',
    '\u{1D601}': '\u{1D669}',
    '\u{1D602}': '\u{1D66A}',
    '\u{1D603}': '\u{1D66B}',
    '\u{1D604}': '\u{1D66C}',
    '\u{1D605}': '\u{1D66D}',
    '\u{1D606}': '\u{1D66E}',
    '\u{1D607}': '\u{1D66F}'
}

module.exports = function() {

    this.parseTo = (text, to, allowed) => {
        if(allowed) {
            // Checks the chars individually and applies the required styling to them if supported
            if(to === 'strikethrough') return text.split('').map(char => char.concat('\u0335')).join('');
            if(to === 'italic') text = text.replace(/[\u{1D5D4}-\u{1D607}]/gu, match => mathRefs[match]);
            return text.split('').map(char => refs[char] ? refs[char][to] : char).join('');
        } 
        return text;
    }

    this.parse = (text, stylingAllowed) => {

        const images = [];

        text = text
            // Removing <center>, <div>, <table>, <ul>, <ol>, <p>, <sup>, <sub> and '<tr></tr>'
            .replace(/<\/?(?:p|center|table|[ou]l|su[pb]|div(?: +class=" *(?:text-justify|pull-(?:right|left))")?)>|<tr>\s*<\/tr>/g, '')
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
            // -- List items : <li>
            .replace(/\s?<li> *((?:(?!<li>).)*)<\/li>/g, '\n* $1')
            // -- Titles : <h1> to <h6>
            .replace(/<h([1-6])> *(.*)<\/h\1>/g, (match, quantity, content) => {
                return '#'.repeat(quantity).concat(' ', content);
            })
            // -- Table rows (and their content) : <tr> and <td>
            .replace(/\n?<tr>((?:(?!<tr>)[\s\S])*)<\/tr>/g, (match, content) => {
                return '\n|' + content.replace(/<td>((?:(?!<td>)[\s\S])*)<\/td>/g, ' $1 |');
            })
            // -- Images : <img src="..." alt="...">
            .replace(/<img +[^<>]*src="([^"]+)"[^<>]*\/?>/g, (match, source) => {
                const alt = match.match(/alt="([^"]+)"/);
                return '![' + (!alt ? '' : alt[1]) + '](' + source + ')';
            })
            // -- Links : <a href="...">
            .replace(/<a +[^<>]*href="([^"]+)"[^<>]*>([^<>]+)<\/a>/g, '$2 ($1)')
            // Putting images aside
            .replace(/!\[([^\]]*)]\(([^)]+)\)/g, (match, alt, url) => {
                return '@@@' + (images.push({alt: alt, url: url}) - 1) + '@@@';
            })
            // Bold
            .replace(/__(?=\S)([\s\S]*?\S)__(?!_)|\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/g, (match, content1, content2) => {
                return parseTo(content1 ? content1 : content2, 'bold', stylingAllowed);
            })
            // Italic
            .replace(/_(?=\S)([\s\S]*?\S)_(?!_)|\*(?=\S)([\s\S]*?\S)\*(?!\*)/g, (match, content1, content2) => {
                return parseTo(content1 ? content1 : content2, 'italic', stylingAllowed);
            })
            // Strikethrough
            .replace(/~~(?=\S)([\s\S]*?\S)~~/g, (match, content) => {
                return parseTo(content, 'strikethrough', stylingAllowed);
            })
            // Lists (\u2022 = bullet point)
            .replace(/(^|\n)[*-] +/g, '$1\u2022 ')
            // Links (the excl argument is for checking that it's actually a link and not an image)
            .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1 ($2)')
            // DO LAST !!! Replacing placeholders by corresponding images
            .replace(/@@@(\d+)@@@/g, (match, index) => {
                return '![' + images[index].alt + '](' + images[index].url + ')';
            });

        return text;

    }

}