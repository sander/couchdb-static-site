function(head, req) {
  var Mustache = require('lib/mustache');
  var menus;
  var doc;
  var template;

  var host = req.headers.Host || '';

  if (req.query.startkey[0] == 'robots.txt') {
    start({ headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return 'Sitemap: http://' + host + '/sitemap.xml\n';
  }

  start({ headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  while (row = getRow()) {
    if (row.key[1] == 'site_data') template = row.doc.templates.default;
    else if (row.key[1] == 'menus') menus = row.value;
    else if (row.key[1] == 'page') doc = row.doc;
  }

  if (!menus) menus = [];

  if (!doc)
    return Mustache.to_html(this.templates.error404, {});

  var stash = {
    doc: doc,
  };

  if (doc._id == 'contact') {
    if (req.query.errors) stash.contact_errors = req.query.errors;
    if (req.query.sent) stash.contact_sent = true;
  }

  stash.url = 'http://' + host + '/' + ((doc._id != '*index') ? doc._id : '');

  stash.capitalize = function() {
    return function(text, render) {
      var string = render(text);
      return string.charAt(0).toUpperCase() + string.slice(1);
    };
  };

  var name = 'menu';
  for (var i in menus) {
    stash['has_' + name] = true;
    stash[name] = menus[i];
    name = 'sub' + name;
  }

  var childmenu;
  if (menus.length) {
    var childmenu = menus[menus.length - 1];
    for (var i in childmenu) {
      if (childmenu[i].active) {
        childmenu = null;
        break;
      }
    }
  }
  if (childmenu && doc._id != 'index') {
    stash.has_childmenu = true;
    stash.childmenu = childmenu;
  }

  return Mustache.to_html(template, stash);
}
