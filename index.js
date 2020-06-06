#!/usr/bin/env node
/*!
 * Copyright (c) 2020 Daniel Duarte <danieldd.ar@gmail.com>
 * Licensed under MIT License. See LICENSE file for details.
 */

const fs = require('fs');
const path = require('path');
const parser = require('@tandil/diffparse');

const toIndexFilename = (filename, index) => {
  const fileParts = path.parse(filename);
  return path.join(fileParts.dir, `${fileParts.name}_${index.toString().padStart(4, '0')}${fileParts.ext}`);
};

const getFreeFilename = filename => {
  if (!fs.existsSync(filename)) {
    return filename;
  }

  const fileParts = path.parse(filename);
  let index = 1;
  let newFilename;
  do {
    newFilename = path.join(fileParts.dir, `${fileParts.name}-${index++}${fileParts.ext}`);
  } while (fs.existsSync(newFilename));

  return newFilename;
};

const generateFiles = (diff, diffFile) => {
  // If there is only one file (or zero), nothing is generated
  if (diff.files.length <= 1) {
    return [`Diff have ${diff.files.length === 1 ? '1 file' : '0 files'}, so no split was done`];
  }

  for (let i = 0; i < diff.files.length; i++) {
    const f = diff.files[i];

    let lines = [];
    const write = line => {
      lines.push(line);
    };
    f.header && write(f.header);
    f.mode && write(f.mode);
    f.index && write(f.index);
    write(f.old);
    write(f.new);
    for (const ch of f.chunks) {
      write(ch.header);
      for (const l of ch.content) {
        write(l);
      }
    }

    const filename = getFreeFilename(toIndexFilename(diffFile, i + 1));

    const content = lines.join('\n');
    fs.writeFileSync(filename, content);
  }

  return [`Split in ${diff.files.length} files`];
};

const files = process.argv.slice(2);

files.forEach(f => {
  console.log(`Processing file: "${f}"`);

  if (!fs.existsSync(f)) {
    console.log(' Errors:');
    console.log('  File does not exist');
    return;
  }

  const diff = parser.parseDiffFileSync(f);

  const errors = parser.getErrors();
  if (errors.length === 0) {
    const result = generateFiles(diff, f);
    console.log(' OK' + (result.length === 0 ? '' : ':'));
    console.log('  ' + result.join('\n  '));
  } else {
    console.log(` Errors:`);
    console.log('  ' + errors.join('\n  '));
  }
  console.log();
});
