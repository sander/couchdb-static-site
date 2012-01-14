$(function() {
  var id = location.search.substr(1) || (location = '.');
  var currentDoc = null;
  var changed = false;
  var upload = null;
  var cm;

  var form = $('#edit-form').submit(function() {
    var me = this;

    fields.attr('disabled', true);

    function set(name) {
      var value = $(me).find('[name=' + name + ']').val();
      if (value || (!value && currentDoc[name])) currentDoc[name] = value;
    }
    set('title');
    set('summary');
    set('link');

    currentDoc.content = cm.getValue();

    var extra = JSON.parse($(this).find('[name=extra]').val());
    $(Object.keys(extra)).each(function() {
      currentDoc[this] = extra[this];
    });

    if (upload) {
      if (!currentDoc._attachments) currentDoc._attachments = {};
      $.extend(currentDoc._attachments, upload);
    }

    var button = $('button.primary[form=edit-form]').text('Saving…');

    $.ajax({
      type: 'PUT',
      url: 'api/' + currentDoc._id,
      contentType: 'application/json; charset=utf-8',
      data: JSON.stringify(currentDoc),
      dataType: 'json',
      success: function(data) {
        currentDoc._rev = data.rev;
        fields.attr('disabled', false);
        button.text('Save');
        changed = false;
        if (upload) location.reload();
        upload = null;
      }
    });

    return false;
  });

  $('textarea').keyup(function() {
    if (this.scrollHeight > this.clientHeight) {
      this.style.height = this.scrollHeight +
        (this.offsetHeight - this.clientHeight) + 'px';
    }
  });
  
  var fields = $('#edit-form input, #edit-form textarea, button[form=edit-form]');

  $(window).bind('beforeunload', function() {
    if (changed && !confirm('You have not saved the current page yet. Do you want to throw away your changes?')) return false;

    fields.attr('disabled', true);
    return;
  });

  $.request({
    url: 'api/' + id,
    json: true
  }, function(err, resp, doc) {
    currentDoc = doc;

    fields.attr('disabled', false);

    form.find('[name=title]').val(doc.title);
    form.find('[name=content]').val(doc.content);

    cm = CodeMirror.fromTextArea(form.find('[name=content]').get(0), {
      lineWrapping: true,
      electricChars: false,
      smartIndent: false
    });

    form.find('[name=summary]').val(doc.summary);
    form.find('[name=link]').val(doc.link);

    var extra = $.extend({}, doc);
    delete extra._id;
    delete extra._rev;
    delete extra._attachments;
    delete extra.title;
    delete extra.content;
    delete extra.summary;
    delete extra.link;
    delete extra.type;
    form.find('[name=extra]').val(JSON.stringify(extra, null, '  ')).keyup();

    $('.futon-link').click(function() {
      $.request({
        url: 'api/*site',
        json: true
      }, function(err, resp, doc) {
        if (err) console.log(err);
        var prefix = doc.futon_prefix;
        if (!prefix) return alert('No Futon prefix specified!');
        open(prefix + id);
      });
      return false;
    });

    form.find('#attachments').empty();
    if (doc._attachments) {
      for (var name in doc._attachments) {
        var data = doc._attachments[name];
        addAttachment(name, data);
      }
    }
  });

  function addAttachment(name, data) {
    var url = 'api/' + currentDoc._id + '/' + name;
    var elt = $('<a draggable>').attr({ href: url, target: '_blank' }).appendTo('.attachments');
    if (['image/jpeg', 'image/png'].indexOf(data.content_type) != -1)
      $('<img>').attr('src', url).appendTo(elt);
    $('<span class=name>').text(name).appendTo(elt);

    elt.bind('dragstart', function(evt) {
      var id = currentDoc._id;
      if (id == '*index') id = '_index';
      name = name.split('/')[1];
      evt.originalEvent.dataTransfer.setData('Text', 'media/' + id + '/' + name);
    });
  }

  $('.attachments').bind('dragover', function(evt) {
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
          addToAttachments['media/' + theFile.name] = {
            content_type: theFile.type,
            data: base64
          };

          var n = 0; for (var i in addToAttachments) n++;
          if (n == numberOfFiles) {
            upload = addToAttachments;
            changed = true;
            $('#edit-form').submit();
          }
        };
      })(f);

      reader.readAsDataURL(f);

      numberOfFiles++;
    }
  });
});
