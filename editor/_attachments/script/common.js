$(function() {
  (function() {
    var topbar = $('<nav class=topbar>').prependTo(document.body);
    $('<h1>').text('Site editor').appendTo(topbar);

    var account = $('<p class=account>').appendTo(topbar);

    $.request({
      url: '/_session',
      json: true
    }, function(err, resp, body) {
      if (body.userCtx.name) {
        $('<span class=username>').text(body.userCtx.name).appendTo(account);
        $('<a class=button href=sign-out.html>').text('Sign out').appendTo(account);
      } else {
        $('<a class=button href=sign-in.html>').text('Sign in').appendTo(account);
      }
    });
  })();

  (function() {
    var sidebar = $('<nav class=sidebar>').prependTo(document.body);

    var section = function(name) {
      var section = $('<section>').appendTo(sidebar);
      $('<header>').html($('<h1>').text(name)).appendTo(section);
      return section;
    };

    (function() {
      var settings = section('Site settings');
      var ul = $('<ul class=select>').appendTo(settings);

      var add = function(url, title) {
        var a = $('<a>').attr('href', url).appendTo(ul);
        $('<li>').text(title).appendTo(a);
        var parts = location.pathname.split('/');
        if (parts[parts.length - 1] == url)
          a.addClass('selected');
      };

      add('edit-structure.html', 'Structure');
      add('edit-template.html', 'Template');
      add('edit-stylesheet.html', 'Style sheet');
      add('edit-media.html', 'Media');
    })();

    (function() {
      var pages = section('Pages');
      var p = $('<p>').appendTo(pages);
      $('<a class=button href=new-page.html>').text('New page').appendTo(p);
      var ul = $('<ul class=select>').appendTo(pages);
      $.request({
        url: 'api/_design/editor/_view/pages',
        json: true
      }, function(err, resp, body) {
        $(body.rows).each(function() {
          var a = $('<a>').attr('href', 'edit-page.html?' + this.id).appendTo(ul);
          var li = $('<li>').appendTo(a);
          $('<p class=id>').text(this.id).appendTo(li);
          $('<p class=title>').text(this.value || '').appendTo(li);

          if (this.id == location.search.substr(1))
            a.addClass('selected');
        });
      });
    })();
  })();

  $('ul.select a').live('click', function() {
    $(this).addClass('loading');
  });
});
