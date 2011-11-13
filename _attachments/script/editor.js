$(function() {
  function showError(title, message) {
    var error = $('<div class="alert-message error fade in">').alert();
    $('<a class=close href=#>&times</a>').appendTo(error);
    $('<strong>').text(title).appendTo(error);
    $('<span>').text(' ' + message).appendTo(error);
    $('.messages').html(error);
  }

  function loadSession(done) {
    $.getJSON('/_session', function(json) {
      if (json.userCtx.name) {
        $('.signed-in').css('display', 'block');
        $('.signed-out').css('display', 'none');
        $('.username').text(json.userCtx.name);
      } else {
        $('.signed-in').css('display', 'none');
        $('.signed-out').css('display', 'block');
      }
      if (done) done();
    });
  }

  $('form[name=sign-in]').submit(function() {
    var button = $(this).find('button').button('loading');
    $.ajax({
      type: 'POST',
      url: '/_session',
      data: {
        name: $(this).find('[name=username]').val(),
        password: $(this).find('[name=password]').val()
      },
      success: function() {
        loadSession(function() {
          button.button('reset');
        });
      },
      error: function() {
        $(this).find('button').button('reset');
        showError('Sign in failed!', 'Wrong user name or password.');
      }
    });
    return false;
  });
  $('form[name=sign-out]').submit(function() {
    var button = $(this).find('button').button('loading');
    $.ajax({
      type: 'DELETE',
      url: '/_session',
      success: function() {
        loadSession(function() {
          button.button('reset');
        });
      }
    });
    return false;
  });

  var settings = null;
  var availablePages = [];

  function structure() {
    $('.topbar .nav li').toggleClass('active', false);
    $('.structure-link').addClass('active');
    $('.container > .pages').css('display', 'none');
    $('.container > .structure').each(function() {
      var me = this;
      $(this).css('display', 'block');

      $.ajax({
        type: 'GET',
        url: 'api/settings',
        dataType: 'json',
        success: function(data) {
          settings = data;
          $(me).find('[name=structure]').val(
            JSON.stringify(settings.structure, null, '  '));
        }
      }); 

      $.ajax({
        type: 'GET',
        url: 'api/_design/editor/_view/pages',
        dataType: 'json',
        success: function(data) {
          availablePages = [];
          $(data.rows).each(function() {
            availablePages.push(this.id);
          });
          showNotLinked();
        }
      });
    });
    return false;
  }
  $('.structure-link').click(structure);

  function showNotLinked() {
    var structure = JSON.parse($('.container .structure textarea').val());
    var linked = [];
    var notLinked = [];
    function traverse(node) {
      linked.push(node.id);
      for (var i in node.children)
        traverse(node.children[i]);
    }
    traverse(structure);
    for (var i in availablePages)
      if (linked.indexOf(availablePages[i]) == -1)
        notLinked.push(availablePages[i]);
    $('.pages-not-linked').text(notLinked.join(', '));
  }

  $('.container .structure textarea').keydown(function() {
    $('.container .structure form button').attr('disabled', false);
  });

  $('.container .structure .tidy-json').click(function() {
    var field = $('.container .structure textarea');
    var json = JSON.parse(field.val());
    var tidy = JSON.stringify(json, null, '  ');
    field.val(tidy);
    showNotLinked();
  });

  $('.container .structure form').submit(function() {
    var structure = $(this).find('[name=structure]').val();
    settings.structure = JSON.parse(structure);

    var button = $(this).find('button').button('loading');

    $.ajax({
      type: 'PUT',
      url: 'api/settings',
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(settings),
      dataType: 'json',
      success: function(data) {
        settings._rev = data.rev;
        button.button('reset');
        $('.container .structure form button').attr('disabled', true);
        showNotLinked();
      }
    });

    return false;
  });

  function loadList(select) {
    $('.container > .pages').each(function() {
      var me = this;
      $.ajax({
        type: 'GET',
        url: 'api/_design/editor/_view/pages',
        dataType: 'json',
        success: function(data) {
          var list = $(me).find('.list ul').empty();
          $(data.rows).each(function() {
            var li = $('<li>').data('id', this.id).appendTo(list);
            $('<strong>').text(this.id).appendTo(li);
            $('<small>').text(this.value || this.key).appendTo(li);
            if (select && select == this.id)
              $(li).addClass('active');
          });
          list.find('li').click(function() {
            if (!continueIfChanged()) return;
            list.find('li').toggleClass('active', false);
            $(this).addClass('active');
            edit($(this).data('id'));
          });
        }
      });
    });
  }

  function pages() {
    $('.topbar .nav li').toggleClass('active', false);
    $('.pages-link').addClass('active');
    $('.container > .structure').css('display', 'none');
    $('.container > .pages').css('display', 'block');
    loadList();
    return false;
  }
  $('.pages-link').click(pages);

  function continueIfChanged() {
    if (changed)
      return confirm('You have not saved the current page yet. Do you want to throw away your changes?');
    else return true;
  }

  var currentDoc = null;
  var changed = false;
  var upload = null;

  $('.new-page').click(function() {
    if (!continueIfChanged()) return;
    changed = false;

    var id = prompt('What should be the page ID? (This is used to create the URL.');
    currentDoc = {
      content: ''
    };
    $.ajax({
      type: 'PUT',
      url: 'api/' + id,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(currentDoc),
      dataType: 'json',
      success: function(data) {
        currentDoc._rev = data.rev;
        edit(id, function() {
          loadList(id);
        });
      },
      error: function() {
        showError('Could not create page.', 'Does a page with this ID already exist?');
      }
    });
  });

  $('.pages .edit').find('input, textarea').bind('keydown change', function() {
    changed = true;
    $('.pages .edit button.primary').attr('disabled', false);
  });

  function edit(id, loaded) {
    $('#attachments').toggleClass('draghover', false);
    $('.pages .edit').each(function() {
      var me = this;
      changed = false;
      $(this).find('.loading').css('display', 'block');
      $(this).find('form').css('display', 'none');
      $.ajax({
        type: 'GET',
        url: 'api/' + id,
        dataType: 'json',
        success: function(doc) {
          currentDoc = doc;

          $(me).find('.loading').css('display', 'none');
          $(me).find('form').css('display', 'block');

          $(me).find('[name=title]').val(doc.title || '');
          $(me).find('[name=content]').val(doc.content || '');
          $(me).find('[name=summary]').val(doc.summary || '');
          $(me).find('[name=link]').val(doc.link || '');

          var extra = $.extend({}, doc);
          delete extra._id;
          delete extra._rev;
          delete extra._attachments;
          delete extra.title;
          delete extra.content;
          delete extra.summary;
          delete extra.link;
          $(me).find('[name=extra]').val(JSON.stringify(extra, null, '  '));

          $(me).find('#attachments').empty();
          if (doc._attachments) {
            for (var name in doc._attachments) {
              var data = doc._attachments[name];
              addAttachment(name, data);
            }
          }

          if (loaded) loaded();
        }
      });
      $(this).css('display', 'block');
      $(this).find('.id').text(id);
      $(this).find('.futon-link').attr('href', '/_utils/document.html?dkpstad/' + id);
    });
  }

  function addAttachment(name, data) {
    var url = 'api/' + currentDoc._id + '/' + name;
    var elt = $('<a draggable>').attr({ href: url, target: '_blank' })
      .appendTo('#attachments');
    if (['image/jpeg', 'image/png'].indexOf(data.content_type) != -1) {
      $('<img>').attr('src', url).appendTo(elt);
    }
    $('<span class=name>').text(name).appendTo(elt);

    elt.bind('dragstart', function(evt) {
      evt.originalEvent.dataTransfer.setData('Text', 'media/' + currentDoc._id + '/' + name);
    });
  }

  $('#attachments').bind('dragover', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }).bind('dragenter', function(evt) {
    $(this).toggleClass('draghover', true);
  }).bind('dragleave', function(evt) {
    $(this).toggleClass('draghover', false);
  }).bind('drop', function(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.originalEvent.dataTransfer.files;
    var numberOfFiles = 0;
    var addToAttachments = {};
    for (var i = 0, f; f = files[i]; i++) {
      var reader = new FileReader();

      reader.onload = (function(theFile) {
        return function(e) {
          var result = e.target.result;
          var base64 = result.substring(result.indexOf(',') + 1);
          addToAttachments[theFile.name] = {
            content_type: theFile.type,
            data: base64
          };
          //addAttachment(theFile.name, addToAttachments[theFile.name]);

          var n = 0; for (var i in addToAttachments) n++;
          if (n == numberOfFiles) {
            upload = addToAttachments;
            changed = true;
            $('.edit form').submit();
          }
        };
      })(f);

      reader.readAsDataURL(f);

      numberOfFiles++;
    }
  });

  $('.container .pages .edit form').submit(function() {
    var me = this;

    function set(name) {
      var value = $(me).find('[name=' + name + ']').val();
      if (value || (!value && currentDoc[name])) currentDoc[name] = value;
    }
    set('title');
    set('content');
    set('summary');
    set('link');

    var extra = JSON.parse($(this).find('[name=extra]').val());
    $(Object.keys(extra)).each(function() {
      currentDoc[this] = extra[this];
    });

    if (upload) {
      if (!currentDoc._attachments) currentDoc._attachments = {};
      $.extend(currentDoc._attachments, upload);
    }

    var button = $(this).find('button.primary').button('loading');

    $.ajax({
      type: 'PUT',
      url: 'api/' + currentDoc._id,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(currentDoc),
      dataType: 'json',
      success: function(data) {
        currentDoc._rev = data.rev;
        button.button('reset').attr('disabled', true);
        changed = false;
        if (upload) {
          var scroll = $('body').scrollTop();
          edit(currentDoc._id, function() {
            $('body').scrollTop(scroll);
          });
        }
        upload = null;
      }
    });

    return false;
  });

  loadSession();
  pages();
});
