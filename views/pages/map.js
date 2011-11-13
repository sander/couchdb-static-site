function(doc) {
  if (doc.content != undefined)
    emit(doc._id, doc.title || null);
}
