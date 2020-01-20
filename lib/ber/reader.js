// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

var assert = require('assert');
var Buffer = require('safer-buffer').Buffer;

var ASN1 = require('./types');
var errors = require('./errors');


///--- Globals

var newInvalidAsn1Error = errors.newInvalidAsn1Error;

///--- API

function Reader(data) {
  if (!data || !Buffer.isBuffer(data))
    throw new TypeError('data must be a node Buffer');

  this._buf = data;
  this._size = data.length;
  this._blocklevel = 0;
  this._blockInfo = {};
  // These hold the "current" state
  this._len = 0;
  this._offset = 0;
}

Object.defineProperty(Reader.prototype, 'length', {
  enumerable: true,
  get: function () { return (this._len); }
});

Object.defineProperty(Reader.prototype, 'offset', {
  enumerable: true,
  get: function () { return (this._offset); }
});

Object.defineProperty(Reader.prototype, 'remain', {
  get: function () { return (this._size - this._offset); }
});

Object.defineProperty(Reader.prototype, 'buffer', {
  get: function () { return (this._buf.slice(this._offset)); }
});


/**
 * Reads a single byte and advances offset; you can pass in `true` to make this
 * a "peek" operation (i.e., get the byte, but don't advance the offset).
 *
 * @param {Boolean} peek true means don't move offset.
 * @return {Number} the next byte, null if not enough data.
 */
Reader.prototype.readByte = function(peek) {
  if (this._size - this._offset < 1)
      return null;


  var b = this._buf[this._offset] & 0xff;

  if (!peek)
    this._offset += 1;

  return b;
};


Reader.prototype.readBlock = function(offset)
{
    if (offset === undefined) {
        offset = this._offset;
    }
    var currOffset = offset;
    var b, lenB;

    if (this._blockInfo[offset] !== undefined) {
        return this._blockInfo[offset];
    }

    while(this.remain > 0) {
        b = this._buf[currOffset++];
        lenB = this._buf[currOffset++];

        if ((b == 0) && (lenB == 0)) {
            break; // end of block
        }
        var len = 0;
        if ((lenB & 0x80) == 0x80) {
            lenB &= 0x7f;

            if (lenB == 0) {
                this._blocklevel++;
                lenB = this.readBlock(currOffset);
                this._blocklevel--;
            }
            else {
                if (lenB > 4)
                    throw InvalidAsn1Error('encoding too long');

                if (this._size - this.offset < lenB) {
                    return null;
                }

                for (var i = 0; i < lenB; i++) {
                    len = (len << 8) + (this._buf[currOffset++] & 0xff);
                }
                lenB = len;
            }
        }
        currOffset += lenB;
        if (currOffset > this._size) {
            throw new Error(`invalid block at offset ${offset}`);
            return null;
        }
    }
    lenB = currOffset - offset;
    this._blockInfo[offset] = lenB;

    return lenB;
}

Reader.prototype.peek = function() {
  return this.readByte(true);
};


/**
 * Reads a (potentially) variable length off the BER buffer.  This call is
 * not really meant to be called directly, as callers have to manipulate
 * the internal buffer afterwards.
 *
 * As a result of this call, you can call `Reader.length`, until the
 * next thing called that does a readLength.
 *
 * @return {Number} the amount of offset to advance the buffer.
 * @throws {InvalidAsn1Error} on bad ASN.1
 */
Reader.prototype.readLength = function (offset) {
  if (offset === undefined)
    offset = this._offset;

  if (offset >= this._size)
      return null;

  var lenB = this._buf[offset++] & 0xff;
  if (lenB === null)
      return null;
  

  if ((lenB & 0x80) === 0x80) {
    lenB &= 0x7f;

    if (lenB === 0) {
          this._len = this.readBlock(offset);
    }
    else {
      if (lenB > 4)
          throw newInvalidAsn1Error('encoding too long');

      if (this._size - offset < lenB)
          return null;

      this._len = 0;
      for (var i = 0; i < lenB; i++)
          this._len = (this._len << 8) + (this._buf[offset++] & 0xff);      
    }
  } else {
      // Wasn't a variable length
      this._len = lenB;
  }

  return offset;
};


/**
 * Parses the next sequence in this BER buffer.
 *
 * To get the length of the sequence, call `Reader.length`.
 *
 * @return {Number} the sequence's tag.
 */
Reader.prototype.readSequence = function  (tag) {
  var seq = this.peek();
  if (seq === null)
    return null;
  if (tag !== undefined && tag !== seq)
    throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) +
                              ': got 0x' + seq.toString(16));

  var o = this.readLength(this._offset + 1); // stored in `length`
  if (o === null)
    return null;

  this._offset = o;
  return seq;
};


Reader.prototype.readInt = function () {
  return this._readTag(ASN1.Integer);
};


Reader.prototype.readBoolean = function () {
  return (this._readTag(ASN1.Boolean) === 0 ? false : true);
};


Reader.prototype.readEnumeration = function () {
  return this._readTag(ASN1.Enumeration);
};



Reader.prototype.readString = function (tag, retbuf) {
  if (!tag)
    tag = ASN1.OctetString;

  var b = this.peek();
  if (b === null) 
      return null;

  if (b !== tag)
    throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) +
                              ': got 0x' + b.toString(16));

  var o = this.readLength(this._offset + 1); // stored in `length`

  if (o === null)
    return null;

  if (this.length > this._size - o)
    return null;

  
  var length = this.length;
  if (this._blockInfo[this._offset + 2] !== undefined) {
      length = length - 2;
  }

  this._offset = o;
  
  if (length === 0)
    return retbuf ? Buffer.alloc(0) : '';

  

  var str = this._buf.slice(this._offset, this._offset + length);
  this._offset += this.length;

  return retbuf ? str : str.toString('utf8');
};

Reader.prototype.readRelativeOID = function(tag) {
  if (!tag)
    tag = ASN1.RelativeOID;

  var b = this.readString(tag, true);
  if (b === null)
    return null;

  var values = [];
  var value = 0;

  for (var i = 0; i < b.length; i++) {
    var byte = b[i] & 0xff;

    value += byte & 0x7F;
    if ((byte & 0x80) == 0x80) {
        value <<= 7;
        continue;
    }
    values.push(value);
    value = 0;
  }

  return values.join('.');
};

Reader.prototype.readOID = function (tag) {
  if (!tag)
    tag = ASN1.OID;

  var b = this.readString(tag, true);
  if (b === null)
    return null;

  var values = [];
  var value = 0;

  for (var i = 0; i < b.length; i++) {
    var byte = b[i] & 0xff;

    value <<= 7;
    value += byte & 0x7f;
    if ((byte & 0x80) === 0) {
      values.push(value);
      value = 0;
    }
  }

  value = values.shift();
  values.unshift(value % 40);
  values.unshift((value / 40) >> 0);

  return values.join('.');
};


Reader.prototype._readTag = function (tag) {
  assert.ok(tag !== undefined);

  var b = this.peek();

  if (b === null)
    return null;

  if (b !== tag)
    throw newInvalidAsn1Error('Expected 0x' + tag.toString(16) +
                              ': got 0x' + b.toString(16));

  var o = this.readLength(this._offset + 1); // stored in `length`
  if (o === null)
    return null;

  if (this.length > 8)
    throw newInvalidAsn1Error('Integer too long: ' + this.length);

  if (this.length > this._size - o)
    return null;
  this._offset = o;

  var fb = this._buf[this._offset];
  var value = 0;

  for (var i = 0; i < this.length; i++) {
    value <<= 8;
    value |= (this._buf[this._offset++] & 0xff);
  }

  if ((fb & 0x80) === 0x80 && i !== 4)
    value -= (1 << (i * 8));

  return value >> 0;
};



///--- Exported API

module.exports = Reader;
