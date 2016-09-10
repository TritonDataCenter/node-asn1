// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

import { ASN1 } from '../common/types';
import { InvalidAsn1Error } from './errors';
import * as assert from 'assert';

class Options {
  public size: number;
  public growthFactor: number;
}

let DEFAULT_OPTS: Options = {
  size: 1024,
  growthFactor: 8
};

export class Writer {
  private _buf: Buffer;
  private _size: number;
  private _offset: number = 0;
  private _options: any = 0;

  // A list of offsets in the buffer where we need to insert sequence tag/len pairs.
  private _seq: number[] = [];

  constructor(options: any) {
    options = this._merge(DEFAULT_OPTS, options || {});

    this._buf = new Buffer(options.size || 1024);
    this._size = this._buf.length;
    this._offset = 0;
    this._options = options;
  }

  public get buffer(): Buffer {
    if (this._seq.length)
      throw new InvalidAsn1Error(this._seq.length + ' unended sequence(s)');

    return (this._buf.slice(0, this._offset));
  }

  public writeLength(len: number): void {
    if (typeof (len) !== 'number')
      throw new TypeError('argument must be a Number');

    this._ensure(4);

    if (len <= 0x7f) {
      this._buf[this._offset++] = len;
    } else if (len <= 0xff) {
      this._buf[this._offset++] = 0x81;
      this._buf[this._offset++] = len;
    } else if (len <= 0xffff) {
      this._buf[this._offset++] = 0x82;
      this._buf[this._offset++] = len >> 8;
      this._buf[this._offset++] = len;
    } else if (len <= 0xffffff) {
      this._buf[this._offset++] = 0x83;
      this._buf[this._offset++] = len >> 16;
      this._buf[this._offset++] = len >> 8;
      this._buf[this._offset++] = len;
    } else {
      throw new InvalidAsn1Error('Length too long (> 4 bytes)');
    }
  };

  public writeByte(b: number): void {
    if (typeof (b) !== 'number')
      throw new TypeError('argument must be a Number');

    this._ensure(1);
    this._buf[this._offset++] = b;
  }

  public writeInt(i: number, tag?: ASN1): void {
    if (typeof (i) !== 'number')
      throw new TypeError('argument must be a Number');
    if (typeof (tag) !== 'number')
      tag = ASN1.Integer;

    let sz: number = 4;

    while ((((i & 0xff800000) === 0) || ((i & 0xff800000) === 0xff800000 >> 0)) && (sz > 1)) {
      sz--;
      i <<= 8;
    }

    if (sz > 4)
      throw new InvalidAsn1Error('BER ints cannot be > 0xffffffff');

    this._ensure(2 + sz);
    this._buf[this._offset++] = tag;
    this._buf[this._offset++] = sz;

    while (sz-- > 0) {
      this._buf[this._offset++] = ((i & 0xff000000) >>> 24);
      i <<= 8;
    }
  };

  public writeNull(): void {
    this.writeByte(ASN1.Null);
    this.writeByte(0x00);
  };

  public writeEnumeration(i: number, tag?: ASN1): void {
    if (typeof (i) !== 'number')
      throw new TypeError('argument must be a Number');
    if (typeof (tag) !== 'number')
      tag = ASN1.Enumeration;

    return this.writeInt(i, tag);
  };

  public writeBoolean(b: boolean, tag?: ASN1): void {
    if (typeof (b) !== 'boolean')
      throw new TypeError('argument must be a Boolean');
    if (typeof (tag) !== 'number')
      tag = ASN1.Boolean;

    this._ensure(3);
    this._buf[this._offset++] = tag;
    this._buf[this._offset++] = 0x01;
    this._buf[this._offset++] = b ? 0xff : 0x00;
  };

  public writeString(s: string, tag?: ASN1): void {
    if (typeof (s) !== 'string')
      throw new TypeError('argument must be a string (was: ' + typeof (s) + ')');
    if (typeof (tag) !== 'number')
      tag = ASN1.OctetString;

    let len: number = Buffer.byteLength(s);
    this.writeByte(tag);
    this.writeLength(len);

    if (len) {
      this._ensure(len);
      this._buf.write(s, this._offset);
      this._offset += len;
    }
  };

  public writeBuffer(buf: Buffer, tag?: ASN1): void {
    if (typeof (tag) !== 'number')
      throw new TypeError('tag must be a number');
    if (!Buffer.isBuffer(buf))
      throw new TypeError('argument must be a buffer');

    this.writeByte(tag);
    this.writeLength(buf.length);
    this._ensure(buf.length);
    buf.copy(this._buf, this._offset, 0, buf.length);
    this._offset += buf.length;
  };

  public writeStringArray(strings: string[]): void {
    if (!(strings instanceof Array))
      throw new TypeError('argument must be an Array[String]');

    let self: Writer = this;
    strings.forEach(function (s: string) {
      self.writeString(s);
    });
  };

  // This is really to solve DER cases, but whatever for now
  public writeOID(s: string, tag?: ASN1): void {
    if (typeof (s) !== 'string')
      throw new TypeError('argument must be a string');
    if (typeof (tag) !== 'number')
      tag = ASN1.OID;

    if (!/^([0-9]+\.){3,}[0-9]+$/.test(s))
      throw new Error('argument is not a valid OID string');

    let tmp: string[] = s.split('.');
    let bytes: number[] = [];

    bytes.push(parseInt(tmp[0], 10) * 40 + parseInt(tmp[1], 10));

    let self: Writer = this;
    tmp.slice(2).forEach(function (b: string) {
      self._encodeOctet(bytes, parseInt(b, 10));
    });

    this._ensure(2 + bytes.length);
    this.writeByte(tag);
    this.writeLength(bytes.length);

    bytes.forEach(function (b) {
      self.writeByte(b);
    });
  };

  public startSequence(tag?: ASN1): void {
    if (typeof (tag) !== 'number')
      tag = ASN1.Sequence | ASN1.Constructor;

    this.writeByte(tag);
    this._seq.push(this._offset);
    this._ensure(3);
    this._offset += 3;
  };

  public endSequence() {
    let seq: number = this._seq.pop();
    let start: number = seq + 3;
    let len: number = this._offset - start;

    if (len <= 0x7f) {
      this._shift(start, len, -2);
      this._buf[seq] = len;
    } else if (len <= 0xff) {
      this._shift(start, len, -1);
      this._buf[seq] = 0x81;
      this._buf[seq + 1] = len;
    } else if (len <= 0xffff) {
      this._buf[seq] = 0x82;
      this._buf[seq + 1] = len >> 8;
      this._buf[seq + 2] = len;
    } else if (len <= 0xffffff) {
      this._shift(start, len, 1);
      this._buf[seq] = 0x83;
      this._buf[seq + 1] = len >> 16;
      this._buf[seq + 2] = len >> 8;
      this._buf[seq + 3] = len;
    } else {
      throw new InvalidAsn1Error('Sequence too long');
    }
  };

  private _merge(fromObject: any, toObject: any): any {
    assert.ok(fromObject);
    assert.equal(typeof (fromObject), 'object');
    assert.ok(toObject);
    assert.equal(typeof (toObject), 'object');

    let keys = Object.getOwnPropertyNames(fromObject);
    keys.forEach(function (key) {
      if (toObject[key])
        return;

      let value = Object.getOwnPropertyDescriptor(fromObject, key);
      Object.defineProperty(toObject, key, value);
    });

    return toObject;
  }

  private _shift(start: number, len: number, shift: number): void {
    assert.ok(start !== undefined);
    assert.ok(len !== undefined);
    assert.ok(shift);

    this._buf.copy(this._buf, start + shift, start, start + len);
    this._offset += shift;
  };

  private _ensure(len: number) {
    assert.ok(len);

    if (this._size - this._offset < len) {
      let sz = this._size * this._options.growthFactor;
      if (sz - this._offset < len)
        sz += len;

      let buf = new Buffer(sz);

      this._buf.copy(buf, 0, 0, this._offset);
      this._buf = buf;
      this._size = sz;
    }
  };

  private _encodeOctet(bytes: number[], octet: number): void {
    if (octet < 128) {
      bytes.push(octet);
    } else if (octet < 16384) {
      bytes.push((octet >>> 7) | 0x80);
      bytes.push(octet & 0x7F);
    } else if (octet < 2097152) {
      bytes.push((octet >>> 14) | 0x80);
      bytes.push(((octet >>> 7) | 0x80) & 0xFF);
      bytes.push(octet & 0x7F);
    } else if (octet < 268435456) {
      bytes.push((octet >>> 21) | 0x80);
      bytes.push(((octet >>> 14) | 0x80) & 0xFF);
      bytes.push(((octet >>> 7) | 0x80) & 0xFF);
      bytes.push(octet & 0x7F);
    } else {
      bytes.push(((octet >>> 28) | 0x80) & 0xFF);
      bytes.push(((octet >>> 21) | 0x80) & 0xFF);
      bytes.push(((octet >>> 14) | 0x80) & 0xFF);
      bytes.push(((octet >>> 7) | 0x80) & 0xFF);
      bytes.push(octet & 0x7F);
    }
  }
}
