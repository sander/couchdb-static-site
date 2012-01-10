$(function() {
  $('a[href="' + (/[^\/]+$/.exec(location) || '.') + '"]').addClass('current');
  $('a').each(function() {
    if (this.href.indexOf(location.protocol + '//' + location.host + '/') != 0 && this.href.indexOf('mailto:') != 0) {
      $(this).addClass('external');
      $(this).click(function() {
        open(this.href);
        return false;
      });
    }
  });
});
