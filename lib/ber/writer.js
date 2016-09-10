// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.
"use strict";
const types_1 = require('../common/types');
const errors_1 = require('./errors');
const assert = require('assert');
class Options {
}
let DEFAULT_OPTS = {
    size: 1024,
    growthFactor: 8
};
class Writer {
    constructor(options) {
        this._offset = 0;
        this._options = 0;
        // A list of offsets in the buffer where we need to insert sequence tag/len pairs.
        this._seq = [];
        options = this._merge(DEFAULT_OPTS, options || {});
        this._buf = new Buffer(options.size || 1024);
        this._size = this._buf.length;
        this._offset = 0;
        this._options = options;
    }
    get buffer() {
        if (this._seq.length)
            throw new errors_1.InvalidAsn1Error(this._seq.length + ' unended sequence(s)');
        return (this._buf.slice(0, this._offset));
    }
    writeLength(len) {
        if (typeof (len) !== 'number')
            throw new TypeError('argument must be a Number');
        this._ensure(4);
        if (len <= 0x7f) {
            this._buf[this._offset++] = len;
        }
        else if (len <= 0xff) {
            this._buf[this._offset++] = 0x81;
            this._buf[this._offset++] = len;
        }
        else if (len <= 0xffff) {
            this._buf[this._offset++] = 0x82;
            this._buf[this._offset++] = len >> 8;
            this._buf[this._offset++] = len;
        }
        else if (len <= 0xffffff) {
            this._buf[this._offset++] = 0x83;
            this._buf[this._offset++] = len >> 16;
            this._buf[this._offset++] = len >> 8;
            this._buf[this._offset++] = len;
        }
        else {
            throw new errors_1.InvalidAsn1Error('Length too long (> 4 bytes)');
        }
    }
    ;
    writeByte(b) {
        if (typeof (b) !== 'number')
            throw new TypeError('argument must be a Number');
        this._ensure(1);
        this._buf[this._offset++] = b;
    }
    writeInt(i, tag) {
        if (typeof (i) !== 'number')
            throw new TypeError('argument must be a Number');
        if (typeof (tag) !== 'number')
            tag = types_1.ASN1.Integer;
        let sz = 4;
        while ((((i & 0xff800000) === 0) || ((i & 0xff800000) === 0xff800000 >> 0)) && (sz > 1)) {
            sz--;
            i <<= 8;
        }
        if (sz > 4)
            throw new errors_1.InvalidAsn1Error('BER ints cannot be > 0xffffffff');
        this._ensure(2 + sz);
        this._buf[this._offset++] = tag;
        this._buf[this._offset++] = sz;
        while (sz-- > 0) {
            this._buf[this._offset++] = ((i & 0xff000000) >>> 24);
            i <<= 8;
        }
    }
    ;
    writeNull() {
        this.writeByte(types_1.ASN1.Null);
        this.writeByte(0x00);
    }
    ;
    writeEnumeration(i, tag) {
        if (typeof (i) !== 'number')
            throw new TypeError('argument must be a Number');
        if (typeof (tag) !== 'number')
            tag = types_1.ASN1.Enumeration;
        return this.writeInt(i, tag);
    }
    ;
    writeBoolean(b, tag) {
        if (typeof (b) !== 'boolean')
            throw new TypeError('argument must be a Boolean');
        if (typeof (tag) !== 'number')
            tag = types_1.ASN1.Boolean;
        this._ensure(3);
        this._buf[this._offset++] = tag;
        this._buf[this._offset++] = 0x01;
        this._buf[this._offset++] = b ? 0xff : 0x00;
    }
    ;
    writeString(s, tag) {
        if (typeof (s) !== 'string')
            throw new TypeError('argument must be a string (was: ' + typeof (s) + ')');
        if (typeof (tag) !== 'number')
            tag = types_1.ASN1.OctetString;
        let len = Buffer.byteLength(s);
        this.writeByte(tag);
        this.writeLength(len);
        if (len) {
            this._ensure(len);
            this._buf.write(s, this._offset);
            this._offset += len;
        }
    }
    ;
    writeBuffer(buf, tag) {
        if (typeof (tag) !== 'number')
            throw new TypeError('tag must be a number');
        if (!Buffer.isBuffer(buf))
            throw new TypeError('argument must be a buffer');
        this.writeByte(tag);
        this.writeLength(buf.length);
        this._ensure(buf.length);
        buf.copy(this._buf, this._offset, 0, buf.length);
        this._offset += buf.length;
    }
    ;
    writeStringArray(strings) {
        if (!(strings instanceof Array))
            throw new TypeError('argument must be an Array[String]');
        let self = this;
        strings.forEach(function (s) {
            self.writeString(s);
        });
    }
    ;
    // This is really to solve DER cases, but whatever for now
    writeOID(s, tag) {
        if (typeof (s) !== 'string')
            throw new TypeError('argument must be a string');
        if (typeof (tag) !== 'number')
            tag = types_1.ASN1.OID;
        if (!/^([0-9]+\.){3,}[0-9]+$/.test(s))
            throw new Error('argument is not a valid OID string');
        let tmp = s.split('.');
        let bytes = [];
        bytes.push(parseInt(tmp[0], 10) * 40 + parseInt(tmp[1], 10));
        let self = this;
        tmp.slice(2).forEach(function (b) {
            self._encodeOctet(bytes, parseInt(b, 10));
        });
        this._ensure(2 + bytes.length);
        this.writeByte(tag);
        this.writeLength(bytes.length);
        bytes.forEach(function (b) {
            self.writeByte(b);
        });
    }
    ;
    startSequence(tag) {
        if (typeof (tag) !== 'number')
            tag = types_1.ASN1.Sequence | types_1.ASN1.Constructor;
        this.writeByte(tag);
        this._seq.push(this._offset);
        this._ensure(3);
        this._offset += 3;
    }
    ;
    endSequence() {
        let seq = this._seq.pop();
        let start = seq + 3;
        let len = this._offset - start;
        if (len <= 0x7f) {
            this._shift(start, len, -2);
            this._buf[seq] = len;
        }
        else if (len <= 0xff) {
            this._shift(start, len, -1);
            this._buf[seq] = 0x81;
            this._buf[seq + 1] = len;
        }
        else if (len <= 0xffff) {
            this._buf[seq] = 0x82;
            this._buf[seq + 1] = len >> 8;
            this._buf[seq + 2] = len;
        }
        else if (len <= 0xffffff) {
            this._shift(start, len, 1);
            this._buf[seq] = 0x83;
            this._buf[seq + 1] = len >> 16;
            this._buf[seq + 2] = len >> 8;
            this._buf[seq + 3] = len;
        }
        else {
            throw new errors_1.InvalidAsn1Error('Sequence too long');
        }
    }
    ;
    _merge(fromObject, toObject) {
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
    _shift(start, len, shift) {
        assert.ok(start !== undefined);
        assert.ok(len !== undefined);
        assert.ok(shift);
        this._buf.copy(this._buf, start + shift, start, start + len);
        this._offset += shift;
    }
    ;
    _ensure(len) {
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
    }
    ;
    _encodeOctet(bytes, octet) {
        if (octet < 128) {
            bytes.push(octet);
        }
        else if (octet < 16384) {
            bytes.push((octet >>> 7) | 0x80);
            bytes.push(octet & 0x7F);
        }
        else if (octet < 2097152) {
            bytes.push((octet >>> 14) | 0x80);
            bytes.push(((octet >>> 7) | 0x80) & 0xFF);
            bytes.push(octet & 0x7F);
        }
        else if (octet < 268435456) {
            bytes.push((octet >>> 21) | 0x80);
            bytes.push(((octet >>> 14) | 0x80) & 0xFF);
            bytes.push(((octet >>> 7) | 0x80) & 0xFF);
            bytes.push(octet & 0x7F);
        }
        else {
            bytes.push(((octet >>> 28) | 0x80) & 0xFF);
            bytes.push(((octet >>> 21) | 0x80) & 0xFF);
            bytes.push(((octet >>> 14) | 0x80) & 0xFF);
            bytes.push(((octet >>> 7) | 0x80) & 0xFF);
            bytes.push(octet & 0x7F);
        }
    }
}
exports.Writer = Writer;
