function(doc) {
  if (doc.type == 'page')
    emit(doc._id, doc.title || null);
}
