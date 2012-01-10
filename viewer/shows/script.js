function(doc, req) {
  return {
    headers: {'Content-Type': 'application/javascript'},
    body: doc.scripts.common
  };
}
