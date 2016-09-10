// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

import { ASN1, InvalidAsn1Error } from '../common';

export class Reader {
  private _buf: Buffer;
  private _size: number;

  // These hold the "current" state
  private _len: number = 0;
  private _offset: number = 0;

  constructor(data: Buffer) {
    if (!data || !Buffer.isBuffer(data))
      throw new TypeError('data must be a node Buffer');

    this._buf = data;
    this._size = data.length;
  }

  public get length(): number {
    return this._len;
  }

  public get offset(): number {
    return this._offset;
  }

  public get remain(): number {
    return this._size - this._offset;
  }

  public get buffer(): Buffer {
    return this._buf.slice(this._offset);
  }

  /**
   * Reads a single byte and advances offset; you can pass in `true` to make this
   * a "peek" operation (i.e., get the byte, but don't advance the offset).
   *
   * @param {Boolean} peek true means don't move offset.
   * @return {Number} the next byte, null if not enough data.
   */
  public readByte(peek: boolean): number {
    if (this._size - this._offset < 1)
      return null;

    let b: number = this._buf[this._offset] & 0xff;

    if (!peek)
      this._offset += 1;

    return b;
  }

  public peek() {
    return this.readByte(true);
  }

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
  public readLength(offset: any) {
    if (offset === undefined)
      offset = this._offset;

    if (offset >= this._size)
      return null;

    let lenB = this._buf[offset++] & 0xff;
    if (lenB === null)
      return null;

    if ((lenB & 0x80) === 0x80) {
      lenB &= 0x7f;

      if (lenB == 0)
        throw new InvalidAsn1Error('Indefinite length not supported');

      if (lenB > 4)
        throw new InvalidAsn1Error('encoding too long');

      if (this._size - offset < lenB)
        return null;

      this._len = 0;
      for (let i = 0; i < lenB; i++)
        this._len = (this._len << 8) + (this._buf[offset++] & 0xff);

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
  public readSequence(tag: number): number {
    let seq = this.peek();
    if (seq === null)
      return null;
    if (tag !== undefined && tag !== seq)
      throw new InvalidAsn1Error('Expected 0x' + tag.toString(16) + ': got 0x' + seq.toString(16));

    let o = this.readLength(this._offset + 1); // stored in `length`
    if (o === null)
      return null;

    this._offset = o;
    return seq;
  };

  public readInt(): number {
    return this._readTag(ASN1.Integer);
  };

  public readBoolean(): boolean {
    return this._readTag(ASN1.Boolean) === 0 ? false : true;
  };

  public readEnumeration(): number {
    return this._readTag(ASN1.Enumeration);
  };

  public readString(tag?: ASN1, retbuf: Boolean = false): Buffer | string {
    if (!tag)
      tag = ASN1.OctetString;

    let b = this.peek();
    if (b === null)
      return null;

    if (b !== tag)
      throw new InvalidAsn1Error('Expected 0x' + tag.toString(16) + ': got 0x' + b.toString(16));

    let o = this.readLength(this._offset + 1); // stored in `length`

    if (o === null)
      return null;

    if (this.length > this._size - o)
      return null;

    this._offset = o;

    if (this.length === 0)
      return retbuf ? new Buffer(0) : '';

    let str = this._buf.slice(this._offset, this._offset + this.length);
    this._offset += this.length;

    return retbuf ? str : str.toString('utf8');
  };

  public readOID = function (tag?: ASN1) {
    if (!tag)
      tag = ASN1.OID;

    let b = this.readString(tag, true);
    if (b === null)
      return null;

    let values: number[] = [];
    let value = 0;

    for (let i = 0; i < b.length; i++) {
      let byte = b[i] & 0xff;

      value <<= 7;
      value += byte & 0x7f;
      if ((byte & 0x80) == 0) {
        values.push(value);
        value = 0;
      }
    }

    value = values.shift();
    values.unshift(value % 40);
    values.unshift((value / 40) >> 0);

    return values.join('.');
  };

  private _readTag(tag: ASN1): number {
    let b = this.peek();

    if (b === null)
      return null;

    if (b !== tag)
      throw new InvalidAsn1Error('Expected 0x' + tag.toString(16) + ': got 0x' + b.toString(16));

    let o = this.readLength(this._offset + 1); // stored in `length`
    if (o === null)
      return null;

    if (this.length > 4)
      throw new InvalidAsn1Error('Integer too long: ' + this.length);

    if (this.length > this._size - o)
      return null;
    this._offset = o;

    let fb = this._buf[this._offset];
    let value = 0;

    let i: number = 0;
    for (i = 0; i < this.length; i++) {
      value <<= 8;
      value |= (this._buf[this._offset++] & 0xff);
    }

    if ((fb & 0x80) === 0x80 && i !== 4)
      value -= (1 << (i * 8));

    return value >> 0;
  }
}
