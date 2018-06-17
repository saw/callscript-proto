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

// async, but has no callback
function render(tmpl, data, path) {
    if(data.scriptdata) {
        console.log('-----');
        console.log(data.scriptdata.html);
    }
    
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
    issueData[issue] = out;
    out.id = issue;
    issueList.push(out);
});

scripts.forEach(script => {
    const html = converter.makeHtml(fs.readFileSync(path.join(__dirname,'scripts', script),{encoding:'utf8'}));
    const scriptdata = converter.getMetadata();
    scriptdata.html = html;
    scriptdata.name = script.replace(/\.md/,'');
    scriptdata.issueHtml = issueData[scriptdata.issue + '.md'].html;
    scriptList.push(scriptdata);
    render('src/scripthome.ejs', {scriptdata, electeds}, `./dist/${scriptdata.name}/index.html`);

    electeds.forEach(elected => {
        let name = elected.lastName.toLowerCase();
        let script = JSON.parse(JSON.stringify(scriptdata));
        script.html = scriptdata.html.replace('{{full_name}}', `${elected.salutation} ${elected.lastName}`);
        console.log(elected.lastName);
        render('src/script.ejs', {scriptdata:script, elected}, `./dist/${scriptdata.name}/${name}/index.html`);
    });
    
});
ejs.renderFile('src/index.ejs',{issueList, scriptList, electeds}, (err, str) => {
    if(err) {
        console.error(err);
    } else {
        fs.outputFile('./dist/index.html', str);
    }
});