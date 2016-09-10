// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.
"use strict";
class InvalidAsn1Error extends Error {
    constructor(message) {
        super(message || '');
        this.name = 'InvalidAsn1Error';
    }
}
exports.InvalidAsn1Error = InvalidAsn1Error;
;
