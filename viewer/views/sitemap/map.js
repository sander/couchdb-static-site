function(doc) {
  if (doc.type == 'page') {
    var path = doc._id == 'index' ? '' : doc._id;
    emit(path, {
      loc: 'http://localhost/' + path,
      priority: doc._id == 'index' ? '1.0' : '0.5'
    });
  }
}
