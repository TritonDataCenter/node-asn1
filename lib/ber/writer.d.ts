import { ASN1 } from '../common';
export declare class Writer {
    private _buf;
    private _size;
    private _offset;
    private _options;
    private _seq;
    constructor(options: any);
    readonly buffer: Buffer;
    writeLength(len: number): void;
    writeByte(b: number): void;
    writeInt(i: number, tag?: ASN1): void;
    writeNull(): void;
    writeEnumeration(i: number, tag?: ASN1): void;
    writeBoolean(b: boolean, tag?: ASN1): void;
    writeString(s: string, tag?: ASN1): void;
    writeBuffer(buf: Buffer, tag?: ASN1): void;
    writeStringArray(strings: string[]): void;
    writeOID(s: string, tag?: ASN1): void;
    startSequence(tag?: ASN1): void;
    endSequence(): void;
    private _merge(fromObject, toObject);
    private _shift(start, len, shift);
    private _ensure(len);
    private _encodeOctet(bytes, octet);
}
