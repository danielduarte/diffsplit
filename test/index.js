const splitter = require('../index');
const util = require('util');

function consolelog(...args) {
  console.log(util.inspect(...args, false, null, true));
}

const fs = require('fs');

const files = fs.readdirSync('./test/cases');

describe('Test cases', function() {
  for (const f of files) {

    it(`Case '${f}'`, function() {
      splitter.split({ files: [`./test/cases/${f}`] });
    });

  }
});
