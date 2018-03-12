const axios = require('axios');
const cheerio = require('cheerio');
const prepareForDisplay = require('./prepareForDisplay');
const insertVerse = require('./insertVerse');
const updateVerse = require('./updateVerse');

let lastPrevId;

module.exports = function(url, db) {

  //determine which page type
  let uc = url.split("/");

  return axios.get(url).then((response) => {

    //loads dom to parse elements
    const $ = cheerio.load(response.data);

    //indexes 4, 5, and 6 are work, book and chapter respectively
    if (uc[6]) {
      console.log('Getting New Chapter', uc[6].split("?")[0]);
      return getChapterContents($, uc[4], uc[5], uc[6], db);
    } else if (uc[5]) {
      console.log('Getting New Book', uc[5].split("?")[0]);
      return getUrlFromBookPage($);
    } else {
      console.log('Getting New Work', uc[4].split("?")[0]);
      return getUrlFromWorkPage($);
    }

  });
}

function getChapterContents($, work, book, chapter, db) {

  //initiate the verse count
  let verseNo = 1;

  //gets the number of verses for the chapter in question
  let numVerses = $('p.verse').length;

  //store promises
  let insertedIds = [];
  let updatedIds = [];

  chapter = Number(chapter.split("?")[0]);

  //convert to displayable text
  let workDisplay = prepareForDisplay(work);
  let workAbr = workDisplay.abr;
  let workFul = workDisplay.ful;

  //convert to displayable text
  let bookDisplay = prepareForDisplay(book);
  let bookAbr = bookDisplay.abr;
  let bookFul = bookDisplay.ful;

  while(verseNo <= numVerses) {
    let content = getVerse($, verseNo);
    insertedIds.push(
      insertVerse({
        prevId: null,
        nextId: null,
        workAbr: workAbr,
        workFul: workFul,
        bookAbr: bookAbr,
        bookFul: bookFul,
        chapter: chapter,
        verse: verseNo,
        content: content
      }, db)
    );
    verseNo++;
  }

  return Promise.all(insertedIds).then((ids) => {

    updatedIds.push(
      updateVerse(lastPrevId, null, ids[0].ops[0]._id, db)
    );

    ids.forEach((id, i) => {
      let prevId = i - 1 < 0 ? lastPrevId : ids[i-1].ops[0]._id;
      let nextId = i + 1 > ids.length-1 ? null : ids[i+1].ops[0]._id;
      updatedIds.push(
        updateVerse(id.ops[0]._id, prevId, nextId, db)
      );
    });

    return Promise.all(updatedIds).then(() => {
      let newUrl = $('ul.prev-next.large')[0].children[1].children[0].attribs.href;
      lastPrevId = ids[ids.length-1].ops[0]._id;
      if (newUrl === 'https://www.lds.org/scriptures/study-helps?lang=eng') {
        return false;
      } else {
        return newUrl;
      }
    });

  });

}

function getVerse($, verseNo) {
  //determine verse number and trim it
  let verse = $(`p#p${verseNo}.verse`);
  verse[0].children.forEach((child) => {
    if (child.name === "a") {
      $(child.children[0]).remove();
    }
  });

  //remove verse number at beginning of verse text
  verse = verse.text().split(" ");
  verse.shift();
  return verse.join(" ");
}

function getUrlFromBookPage($) {
  return url = $('ul.jump-to-chapter')[0].children[1].children[0].attribs.href;
}

function getUrlFromWorkPage($) {
  return url = $('ul.books')[0].children[0].children[0].attribs.href;
}
