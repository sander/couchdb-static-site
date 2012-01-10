function(head, req) {
  var Mustache = require('lib/mustache');

  start({ headers: { 'Content-Type': 'application/xml; charset=utf-8' } });

  var stash = {
    test: 'hoi',
    url: []
  };

  while (row = getRow()) stash.url.push(row.value);

  return Mustache.to_html(this.templates.sitemap, stash);
}
