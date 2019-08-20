# asn1

## About

node-asn1 is a library for encoding and decoding ASN.1 datatypes in pure JS.
Currently BER encoding is supported; at some point I'll likely have to do DER.

## Installation

Install [node.js](http://nodejs.org/), then:

    npm install asn1

## Usage

Mostly, if you're *actually* needing to read and write ASN.1, you probably don't
need this readme to explain what and why.  If you have no idea what ASN.1 is,
see this: ftp://ftp.rsa.com/pub/pkcs/ascii/layman.asc

The source is pretty much self-explanatory, and has read/write methods for the
common types out there.

### Decoding

The following reads an ASN.1 sequence with a boolean.

```javascript
var Ber = require('asn1').Ber;

var reader = new Ber.Reader(Buffer.from([0x30, 0x03, 0x01, 0x01, 0xff]));

reader.readSequence();
console.log('Sequence len: ' + reader.length);
if (reader.peek() === Ber.Boolean) {
	console.log(reader.readBoolean());
}
```

### Encoding

The following generates the same payload as above.

```javascript
var Ber = require('asn1').Ber;

var writer = new Ber.Writer();

writer.startSequence();
writer.writeBoolean(true);
writer.endSequence();

console.log(writer.buffer);
```

## License

MIT.

## Bugs

See <https://github.com/joyent/node-asn1/issues>.
