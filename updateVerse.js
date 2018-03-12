module.exports = (id, prevId, nextId, db) => {

  let insertObj = {};
  if (prevId) insertObj.prevId = prevId
  if (nextId) insertObj.nextId = nextId

  return new Promise(function(resolve, reject) {

    db.collection('scriptures').update({_id: id}, {
      $set: insertObj
    },

    (err, result) => {
      err ? reject(err) : resolve(result)
    });

  });
}
