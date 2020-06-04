#!/usr/bin/env node
/*!
 * Copyright (c) 2020 Daniel Duarte <danieldd.ar@gmail.com>
 * Licensed under MIT License. See LICENSE file for details.
 */

class Token {
  constructor(type, content, ln) {
    this.type = type;
    this.content = content;
    this.ln = ln;
  }
}

class TokenStream {
  constructor(input) {
    this.lines = input.split('\n');
    this.cur = 0;
    this.detectors = Object.entries({
      DIFF: /^diff --git a\/(.*) b\/(.*)$/,
      OLD_FILE: /^--- (.*)$/,
      NEW_FILE: /^\+\+\+ (.*)$/,
      NEW_MODE: /^new file mode \d{6}$/,
      INDEX: /^index [0-9a-f]+\.\.[0-9a-f]+( \d+)?$/,
      CHUNK: /^@@ -\d+,\d+ \+\d+,\d+ @@/,
    });
  }

  get() {
    if (this.finished()) {
      return null;
    }
    if (this.cur === this.lines.length) {
      return new Token('EOF', '\0', this.cur + 1);
    }
    const line = this.lines[this.cur];
    for (const [type, detector] of this.detectors) {
      if (detector.test(line)) {
        return new Token(type, line, this.cur + 1);
      }
    }
    return new Token('ANY', line, this.cur + 1);
  }

  next() {
    const t = this.get();
    t !== null && this.cur++;
    return t;
  }

  finished() {
    return this.cur > this.lines.length;
  }
}

class UdiffParser {
  constructor(stream) {
    this.stream = stream;
    this.errors = [];
  }

  parse() {
    this.errors = [];
    return this.rule_diff();
  }

  error(msg) {
    this.errors.push(msg);
  }

  expect(token, types) {
    if (typeof types === 'string') {
      types = [types];
    }

    if (!types.includes(token.type)) {
      this.error(`[${token.ln}] Expected one of [${types.join(', ')}] but found ${token.type}: '${token.content}'`);
    }
  }

  getErrors() {
    return this.errors;
  }

  rule_diff() {
    let header = [];
    if (this.stream.get().type === 'ANY') {
      header = this.rule_header();
    }

    let files = [];
    if (['DIFF', 'NEW_MODE', 'INDEX', 'OLD_FILE'].includes(this.stream.get().type)) {
      files = this.rule_files();
    }

    const eof = this.stream.next();
    this.expect(eof, 'EOF');

    return {header, files}
  }

  rule_header() {
    let header = [];
    while (this.stream.get().type === 'ANY') {
      const t = this.stream.next();
      header.push(t.content);
    }

    return header;
  }

  rule_files() {
    const files = [];
    while (['DIFF', 'NEW_MODE', 'INDEX', 'OLD_FILE'].includes(this.stream.get().type)) {
      const file = this.rule_file();
      files.push(file);
    }

    return files;
  }

  rule_file() {
    // diff line
    let header = null;
    if (this.stream.get().type === 'DIFF') {
      header = this.stream.next();
    }

    // mode line (optional)
    let mode = null;
    if (this.stream.get().type === 'NEW_MODE') {
      mode = this.stream.next().content;
    }

    // index line
    let index = null;
    if (this.stream.get().type === 'INDEX') {
      index = this.stream.next();
    }

    // old file line
    const oldFile = this.stream.next();
    this.expect(oldFile, 'OLD_FILE');

    // new file line
    const newFile = this.stream.next();
    this.expect(newFile, 'NEW_FILE');

    // chunks
    let chunks = [];
    const t = this.stream.get();
    switch (t.type) {
      case 'CHUNK':
        chunks = this.rule_chunks();
        break;
      case 'DIFF':
      case 'EOF':
        break;
      default:
        this.expect(t, ['CHUNK', 'DIFF', 'EOF']);
    }

    return {
      header: header !==null ? header.content : null,
      mode: mode !==null ? mode.content : null,
      index: index !==null ? index.content : null,
      old: oldFile.content,
      new: newFile.content,
      chunks
    };
  }

  rule_chunks() {
    const chunks = [];
    while (this.stream.get().type === 'CHUNK') {
      const chunk = this.rule_chunk();
      chunks.push(chunk);
    }

    return chunks;
  }

  rule_chunk() {
    const header = this.stream.next();
    this.expect(header, 'CHUNK');

    const content = [];
    while (this.stream.get().type === 'ANY') {
      const line = this.stream.next().content;
      content.push(line);
    }

    return {header: header.content, content};
  }
}

const fs = require('fs');
const path = require('path');

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

  const exists = fs.existsSync(f);
  if (!exists) {
    console.log(' Errors:');
    console.log('  File does not exist');
    return;
  }

  const input = fs.readFileSync(f, 'utf8');
  const tokenStream = new TokenStream(input);
  const parser = new UdiffParser(tokenStream);
  const diff = parser.parse();

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
