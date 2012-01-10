function(doc, req) {
  return {
    headers: {'Content-Type': 'text/plain'},
    body: doc.stylesheets.default.content
  };
}
