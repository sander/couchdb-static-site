function(newDoc, oldDoc, userCtx) {
  if (userCtx.roles.indexOf('_admin') == -1)
    throw 'Only admins can edit!';
}
