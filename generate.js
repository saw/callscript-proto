const showdown = require('showdown');
const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');


const converter = new showdown.Converter({metadata: true});

const issues = fs.readdirSync('./issues');
// const html = converter.makeHtml(detention);
// converter.getMetadata();
let issueData = {};
const issueList = [];

issues.forEach(issue => {
    const html = converter.makeHtml(fs.readFileSync(path.join(__dirname,'issues', issue),{encoding:'utf8'}));
    const out = converter.getMetadata();
    out.html = html;
    issueData[issue] = out;
    out.id = issue;
    issueList.push(out);
});






ejs.renderFile('src/index.ejs',{issueList}, (err, str) => {
    if(err) {
        console.error(err);
    } else {
        fs.outputFile('./dist/index.html', str);
    }
});