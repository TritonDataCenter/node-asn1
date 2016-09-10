// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.
"use strict";
// If you have no idea what ASN.1 or BER is, see this:
// ftp://ftp.rsa.com/pub/pkcs/ascii/layman.asc
///--- Exported API
var types_1 = require('./common/types');
exports.ASN1 = types_1.ASN1;
var index_1 = require('./ber/index');
exports.BerReader = index_1.Reader;
exports.BerWriter = index_1.Writer;
exports.InvalidAsn1Error = index_1.InvalidAsn1Error;
