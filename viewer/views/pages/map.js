function(doc) {
  if (doc.type == 'page') {
    emit([doc._id, 'page'], doc);
    emit([doc._id, 'site_data'], {_id: '*site'});
  } else if (doc._id == '*site') {
    function traverse(node, menus) {
      if (node.children) {
        if (node.children) for (var i in node.children) {
          var menu = [];
          for (var j in node.children) {
            var child = node.children[j];
            menu[j] = { id: child.id, title: child.title };
            if (i == j) menu[j].active = true;
          }
          traverse(node.children[i], menus.concat([menu]));
        }
      }
      var menu = [];
      for (var j in node.children) {
        var child = node.children[j];
        menu[j] = { id: child.id, title: child.title };
      }
      if (menu.length) menus.push(menu);
      emit([node.id, 'menus'], menus);
    }
    traverse(doc.site_structure, []);
  }
}
