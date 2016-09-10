// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.
"use strict";
/**
 * See http://www.oss.com/asn1/resources/reference/asn1-reference-card.html
 */
(function (ASN1) {
    ASN1[ASN1["EOC"] = 0] = "EOC";
    ASN1[ASN1["Boolean"] = 1] = "Boolean";
    ASN1[ASN1["Integer"] = 2] = "Integer";
    ASN1[ASN1["BitString"] = 3] = "BitString";
    ASN1[ASN1["OctetString"] = 4] = "OctetString";
    ASN1[ASN1["Null"] = 5] = "Null";
    ASN1[ASN1["OID"] = 6] = "OID";
    ASN1[ASN1["ObjectDescriptor"] = 7] = "ObjectDescriptor";
    ASN1[ASN1["External"] = 8] = "External";
    ASN1[ASN1["Real"] = 9] = "Real";
    ASN1[ASN1["Enumeration"] = 10] = "Enumeration";
    ASN1[ASN1["PDV"] = 11] = "PDV";
    ASN1[ASN1["Utf8String"] = 12] = "Utf8String";
    ASN1[ASN1["RelativeOID"] = 13] = "RelativeOID";
    ASN1[ASN1["Sequence"] = 16] = "Sequence";
    ASN1[ASN1["Set"] = 17] = "Set";
    ASN1[ASN1["NumericString"] = 18] = "NumericString";
    ASN1[ASN1["PrintableString"] = 19] = "PrintableString";
    ASN1[ASN1["T61String"] = 20] = "T61String";
    ASN1[ASN1["VideotexString"] = 21] = "VideotexString";
    ASN1[ASN1["IA5String"] = 22] = "IA5String";
    ASN1[ASN1["UTCTime"] = 23] = "UTCTime";
    ASN1[ASN1["GeneralizedTime"] = 24] = "GeneralizedTime";
    ASN1[ASN1["GraphicString"] = 25] = "GraphicString";
    ASN1[ASN1["VisibleString"] = 26] = "VisibleString";
    ASN1[ASN1["GeneralString"] = 28] = "GeneralString";
    ASN1[ASN1["UniversalString"] = 29] = "UniversalString";
    ASN1[ASN1["CharacterString"] = 30] = "CharacterString";
    ASN1[ASN1["BMPString"] = 31] = "BMPString";
    ASN1[ASN1["Constructor"] = 32] = "Constructor";
    ASN1[ASN1["Context"] = 128] = "Context";
})(exports.ASN1 || (exports.ASN1 = {}));
var ASN1 = exports.ASN1;
;
