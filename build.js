//Load the library and specify options
const replace = require('replace-in-file');
const { copySync, copyFileSync, existsSync, mkdirSync, removeSync, readFileSync, writeFileSync, createWriteStream, unlinkSync } = require('fs-extra');
const archiver = require("archiver");
const crypto = require('crypto');

const root = process.cwd();
const pkg = require('./package.json');

function generateChecksum(str, algorithm, encoding) {
  return crypto
    .createHash(algorithm || 'md5')
    .update(str, 'utf8')
    .digest(encoding || 'hex');
}

// Cleanup
removeSync(`${root}/dist`);
removeSync(`${root}/packages`);

// Make the dist Dir
mkdirSync(`${root}/dist`);
mkdirSync(`${root}/src`);
mkdirSync(`${root}/packages`);

// Copy the folers
copySync(`${root}/plg_customcontenteditform`, `${root}/dist/plg_customcontenteditform`);

// Get date
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

// Do some replacing
const optionsXml = {
  files: [
    `${root}/dist/plg_customcontenteditform/*.xml`
  ],
  from: [
    /{{copyright}}/g,
    /{{date}}/g,
    /{{version}}/g,
  ],
  to: [
    `(C) ${currentYear} Dimitris Grammatikogiannis, All Rights Reserved.`,
    `${currentMonth}/${currentYear}`,
    `${pkg.version}`
  ],
};
const optionsPhp = {
  files: [
    `${root}/dist/plg_customcontenteditform/*.php`
  ],
  from: [
    /\<\?php/g,
  ],
  to: [
    `<?php
/**
 * @package     Override edit views based on category id
 * @copyright   Copyright (C) ${currentYear} Dimitris Grammatikogiannis. All rights reserved.
 * @license     GNU General Public License version 2 or later
 *
 *  Make sure for each category you choose you DO have an override in the active template (admin-front end)
 */
`,
  ],
};


replace.sync(optionsXml);
replace.sync(optionsPhp);

// Remove the source of the script
removeSync(`${root}/src`);

// remove the update files, they belong to the server
copyFileSync(`${root}/dist/plg_customcontenteditform/update_plg.xml`, `${root}/docs/update_plg.xml`);
unlinkSync(`${root}/dist/plg_customcontenteditform/update_plg.xml`);

// Make the plugin
const archivePlg = archiver('zip', { zlib: { level: 9 } });
const streamPlg = createWriteStream(`${root}/packages/plg_customcontenteditform_v${pkg.version}.zip`);

Promise.all([
  new Promise((resolve, reject) => {
    archivePlg
      .directory(`${root}/dist/plg_customcontenteditform`, false)
      .on('error', err => reject(err))
      .pipe(streamPlg);

    streamPlg.on('close', _ => resolve());
    archivePlg.finalize();
  })
]).then(function () {
  if (!existsSync(`${root}/docs/pkgs`)) {
    mkdirSync(`${root}/docs/pkgs`);
  }

  copySync(`${root}/packages`, `${root}/docs/pkgs`);

  if (existsSync(`${root}/docs/quickstart.md`)) {
    unlinkSync(`${root}/docs/quickstart.md`)
  }

  const quickStartContent = readFileSync(`${root}/docs/quickstart.txt`, { encoding: 'utf8' })
  const qS = `
 - [Plugin](/pkgs/plg_customcontenteditform_v${pkg.version}.zip ':ignore')

`;

  writeFileSync(`${root}/docs/quickstart.md`, quickStartContent.replace('```downloads```', qS).replace('```version```', `${pkg.version}`), { encoding: 'utf8' });

  // Build the upd server
  shaPlg = generateChecksum(readFileSync(`${root}/docs/pkgs/plg_customcontenteditform_v${pkg.version}.zip`), 'sha512');

  const updPlg = {
    files: [
      `${root}/docs/update_plg.xml`,
    ],
    from: [
      '{{name}}',
      '{{version}}',
      '{{name}}',
      '{{filename}}',
      '{{codeName}}',
      '{{type}}',
      '{{folder}}',
      '{{client}}'
    ],
    to: [
      `Custom content edit form Plugin`,
      pkg.version,
      `Custom content edit form Plugin`,
      `plg_customcontenteditform_v${pkg.version}.zip`,
      'customcontenteditform',
      'plugin',
      'system',
      '0'
    ]
  };

  replace.sync(updPlg);
});
