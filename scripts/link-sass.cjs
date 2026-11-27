const fs = require('node:fs');
const path = require('node:path');

const executable = require.resolve(`sass-embedded-${process.platform}-${process.arch}/dart-sass/sass`);
const alias = path.resolve(__dirname, '../node_modules/.bin/dart-sass');
fs.mkdirSync(path.dirname(alias), { recursive: true });
// Hugo rejects executable names containing "embedded"; use its native CLI alias.
fs.rmSync(alias, { force: true });
fs.symlinkSync(path.relative(path.dirname(alias), executable), alias);
