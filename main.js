const scrape = require('./scrape');
const mongoClient = require('mongodb').MongoClient;
const mongoURI = "mongodb://localhost:27017/verse-web-app";

mongoClient.connect(mongoURI, (err, db) => {

  let initUrl = `https://www.lds.org/scriptures/pgp/js-m/1`;

  scrapeScripture(initUrl);

  function scrapeScripture(url) {
    scrape(url, db).then((newUrl) => {
      if (newUrl) {
        scrapeScripture(newUrl);
      }
    });
  }

});
