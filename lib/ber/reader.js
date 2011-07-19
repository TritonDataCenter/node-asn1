// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

var assert = require('assert');

var ASN1 = require('./types');
var errors = require('./errors');


///--- Globals

var InvalidAsn1Error = errors.InvalidAsn1Error;
var InsufficientDataError = errors.InsufficientDataError;



///--- API

function Reader(data) {
  if (!data || !(data instanceof Buffer))
    throw new TypeError('data must be a node Buffer');

  this._buf = data;
  this._size = data.length;

  // These hold the "current" state
  this._len = 0;
  this._offset = 0;

  var self = this;
  this.__defineGetter__('length', function() { return self._len; });
}


/**
 * Reads a single byte and advances offset; you can pass in `true` to make this
 * a "peek" operation (i.e., get the byte, but don't advance the offset).
 *
 * @param {Boolean} peek true means don't move offset.
 * @return {Number} the next byte.
 */
Reader.prototype.readByte = function(peek) {
  if (this._size - this._offset < 1)
    throw new InsufficientDataError(this._size);

  var b = this._buf[this._offset] & 0xff;

  if (!peek)
    this._offset += 1;

  return b;
};


Reader.prototype.peek = function() {
  return this.readByte(true);
};


/**
 * Reads a (potentially) variable length off the BER buffer.
 *
 * Also, as a result of this call, you can call `Reader.length`, until the
 * next thing called that does a readLength.
 *
 * @return {Number} the length in bytes of the next thing.
 * @throws {InvalidAsn1Error} on bad ASN.1
 * @throws {InsufficientDataError} on the buffer not containing the full length.
 */
Reader.prototype.readLength = function() {
  var lenB = this.readByte();

  if ((lenB & 0x80) == 0x80) {

    lenB &= 0x7f;

    if (lenB == 0)
      throw new InvalidAsn1Error('Indefinite length not supported');

    if (lenB > 4)
      throw new InvalidAsn1Error('encoding too long');

    if (this._size - this._offset < lenB)
      throw new InsufficientDataError(lenB);

    var retval = 0;

    for (var i = 0; i < lenB; i++)
      retval = (retval << 8) + (this._buf[this._offset++] & 0xff);

    this._len = retval;
    return retval;
  }

  // Wasn't a variable length
  this._len = lenB;
  return lenB;
};


/**
 * Parses the next sequence in this BER buffer.
 *
 * To get the length of the sequence, call `Reader.length`.
 *
 * @return {Number} the sequence's tag.
 */
Reader.prototype.readSequence = function() {
  var seq = this.readByte();
  this.readLength(); // stored in `length`
  return seq;
};


Reader.prototype.readInt = function() {
  return this._readTag(ASN1.Integer);
};


Reader.prototype.readBoolean = function() {
  return (this._readTag(ASN1.Boolean) === 0 ? false : true);
};


Reader.prototype.readEnumeration = function() {
  return this._readTag(ASN1.Enumeration);
};


Reader.prototype.readString = function() {
  var b = this.readByte();

  if (b !== ASN1.OctetString)
    throw new InvalidAsn1Error('Expected ' + ASN1.OctetString + ': got ' + b);

  var len = this.readLength();
  if (len > this._size - this._offset)
    throw new InsufficientDataError(len);

  if (!len)
    return '';

  var str = this._buf.slice(this._offset, this._offset + len).toString('utf8');
  this._offset += len;

  return str;
};


Reader.prototype._readTag = function(tag) {
  assert.ok(tag !== undefined);

  var b = this.readByte();
  if (b !== tag)
    throw new InvalidAsn1Error('Expected ASN.1 tag: ' + tag + ': found ' + b);

  var len = this.readLength();
  if (len > 4)
    throw new InvalidAsn1Error('Integer too long: ' + len);
  if (len > this._size - this._offset)
    throw new InsufficientDataError(len);


  var fb = this._buf[this._offset++];
  var value = 0;

  value = fb & 0x7F;
  for (var i = 1; i < len; i++) {
    value <<= 8;
    value |= (this._buf[this._offset++] & 0xff);
  }

  if ((fb & 0x80) == 0x80)
    value = -value;

  return value;
};



///--- Exported API

module.exports = Reader;
