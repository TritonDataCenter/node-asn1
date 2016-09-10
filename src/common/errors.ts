// Copyright 2011 Mark Cavage <mcavage@gmail.com> All rights reserved.

export class InvalidAsn1Error extends Error {

  constructor(message: string) {
    super(message || '');
    this.name = 'InvalidAsn1Error';
  }
};
