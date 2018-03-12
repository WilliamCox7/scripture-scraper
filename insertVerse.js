module.exports = (reference, db) => {
  return new Promise(function(resolve, reject) {

    db.collection('scriptures').insert(reference,

    (err, result) => {
      err ? reject(err) : resolve(result)
    });

  });
}
