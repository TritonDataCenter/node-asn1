// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.



function InvalidAsn1Error(msg) {
  this.name = 'InvalidAsn1Error';
  this.message = msg || '';
}
InvalidAsn1Error.prototype = new Error();


function InsufficientDataError(msg) {
  this.name = 'InsufficientDataError';
  this.message = msg || '';
}
InsufficientDataError.prototype = new Error();



module.exports = {

  InvalidAsn1Error: InvalidAsn1Error,
  InsufficientDataError: InsufficientDataError

};
