const fs = require("node:fs");
const path = require("node:path");

global.window = {};
require(path.resolve(__dirname, "..", "album-data.js"));

const albums = window.MMV_ALBUM_DATA;
const languages = ["zh", "en", "fr", "de"];
const errors = [];
const ids = new Set();
const expectedFiles = new Set();

if (!Array.isArray(albums) || albums.length !== 7) {
  errors.push(`Expected 7 albums, received ${Array.isArray(albums) ? albums.length : "invalid data"}.`);
}

for (const album of albums || []) {
  if (album.items.length < 6) errors.push(`${album.id}: expected at least 6 works, received ${album.items.length}.`);

  for (const key of ["name", "description", "medium"]) {
    for (const language of languages) {
      if (!album[key]?.[language]) errors.push(`${album.id}: missing ${key}.${language}.`);
    }
  }

  for (const item of album.items) {
    if (ids.has(item.id)) errors.push(`Duplicate work id: ${item.id}.`);
    ids.add(item.id);

    for (const key of ["title", "caption", "scene"]) {
      for (const language of languages) {
        if (!item[key]?.[language]) errors.push(`${item.id}: missing ${key}.${language}.`);
      }
    }

    const localPath = path.resolve(__dirname, "..", item.file.replace(/^\.\//, ""));
    expectedFiles.add(localPath);
    if (!fs.existsSync(localPath)) errors.push(`Missing artwork: ${item.file}.`);
  }
}

const report = {
  albums: Array.isArray(albums) ? albums.length : 0,
  works: ids.size,
  localizedFields: languages,
  referencedArtworks: expectedFiles.size,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
