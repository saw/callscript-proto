const showdown = require('showdown');
const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const converter = new showdown.Converter({metadata: true});
const electeds = JSON.parse(fs.readFileSync('data/electeds.json', {encoding:'utf8'}));
// console.log(electeds);
const issues = fs.readdirSync('./issues');
const scripts = fs.readdirSync('./scripts');
let issueData = {};
const issueList = [];
const scriptList = [];
const uriChars = /[\w\-.~]/i;
const ucsChars = /[\xA0-\u{D7FF}\u{F900}-\u{FDCF}\u{FDF0}-\u{FFEF}\u{10000}-\u{1FFFD}\u{20000}-\u{2FFFD}\u{30000}-\u{3FFFD}\u{40000}-\u{4FFFD}\u{50000}-\u{5FFFD}\u{60000}-\u{6FFFD}\u{70000}-\u{7FFFD}\u{80000}-\u{8FFFD}\u{90000}-\u{9FFFD}\u{A0000}-\u{AFFFD}\u{B0000}-\u{BFFFD}\u{C0000}-\u{CFFFD}\u{D0000}-\u{DFFFD}\u{E1000}-\u{EFFFD}]/u;
const validURIChar = char => uriChars.test(char);
const validIRIChar = char => uriChars.test(char) || ucsChars.test(char);

function sanitizeURI(str, { replacement = "-", encoding = "unicode" } = {}) {


    let validChar;
    if (encoding === "unicode") {
        validChar = validIRIChar;
    } else if (encoding === "ascii") {
        validChar = validURIChar;
    } else {
        throw new Error('`options.encoding` must be "unicode" or "ascii".');
    }

    // Check and make sure the replacement character is actually a safe char itself.
    if (!Array.from(replacement).every(validChar)) {
        throw new Error("The replacement character(s) (options.replacement) is itself unsafe.");
    }

    // `Array.from` must be used instead of `String.split` because
    //   `split` converts things like emojis into UTF-16 surrogate pairs.
    return Array.from(str).map(char => (validChar(char) ? char : replacement)).join('').toLowerCase();
}

// async, but has no callback
function render(tmpl, data, path) {
    ejs.renderFile(tmpl, data, (err, str) => {
        if(err) {
            console.error(err);
        } else {
            fs.outputFile(path, str).catch(err => {
                console.error(err);
            });
        }
        
    });
}

issues.forEach(issue => {
    const html = converter.makeHtml(fs.readFileSync(path.join(__dirname,'issues',issue),{encoding:'utf8'}));
    const out = converter.getMetadata();
    out.html = html;
    // console.log(issue.replace(/\d{4}-\d{2}-\d{2}-/,''));
    issueData[issue.replace(/\d{4}-\d{2}-\d{2}-/,'')] = out;
    out.id = issue;
    issueList.push(out);
});

scripts.forEach(script => {
    const html = converter.makeHtml(fs.readFileSync(path.join(__dirname,'scripts', script),{encoding:'utf8'}));
    const scriptdata = converter.getMetadata();
    scriptdata.html = html;
    scriptdata.name = script.replace(/\.md/,'');
    console.log('od', issueData);
    
    scriptdata.issueHtml = issueData[sanitizeURI(scriptdata.issue) + '.md'].html;
    scriptList.push(scriptdata);
});
scriptList.forEach(scriptdata => {
    render('src/scripthome.ejs', {scriptdata, electeds, title: scriptdata.title, scriptList}, `./dist/${scriptdata.name}/index.html`);   
    electeds.forEach(elected => {
        let name = elected.lastName.toLowerCase();
        let script = JSON.parse(JSON.stringify(scriptdata));
        script.html = scriptdata.html.replace('{{full_name}}', `${elected.salutation} ${elected.lastName}`);
        render('src/script.ejs', {title: script.title, scriptdata:script, elected, scriptList}, `./dist/${scriptdata.name}/${name}/index.html`);
    });
});
ejs.renderFile('src/index.ejs',{title: 'Call script prototype', issueList, scriptList, electeds}, (err, str) => {
    if(err) {
        console.error(err);
    } else {
        fs.outputFile('./dist/index.html', str);
    }
});

fs.copy('admin', 'dist/admin');
fs.copy('src/style.css', 'dist/style.css');