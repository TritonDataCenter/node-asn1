// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

// If you have no idea what ASN.1 or BER is, see this:
// ftp://ftp.rsa.com/pub/pkcs/ascii/layman.asc

import * as Ber from './ber/index';

///--- Exported API
export { ASN1, InvalidAsn1Error } from './common';
export { Reader as BerReader, Writer as BerWriter } from './ber/index';
export { Ber as Ber };
