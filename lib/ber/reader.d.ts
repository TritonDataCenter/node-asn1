import { ASN1 } from '../common/types';
export declare class Reader {
    private _buf;
    private _size;
    private _len;
    private _offset;
    constructor(data: Buffer);
    readonly length: number;
    readonly offset: number;
    readonly remain: number;
    readonly buffer: Buffer;
    /**
     * Reads a single byte and advances offset; you can pass in `true` to make this
     * a "peek" operation (i.e., get the byte, but don't advance the offset).
     *
     * @param {Boolean} peek true means don't move offset.
     * @return {Number} the next byte, null if not enough data.
     */
    readByte(peek: boolean): number;
    peek(): number;
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
    readLength(offset: any): any;
    /**
     * Parses the next sequence in this BER buffer.
     *
     * To get the length of the sequence, call `Reader.length`.
     *
     * @return {Number} the sequence's tag.
     */
    readSequence(tag: number): number;
    readInt(): number;
    readBoolean(): boolean;
    readEnumeration(): number;
    readString(tag?: ASN1, retbuf?: Boolean): Buffer | string;
    readOID: (tag?: ASN1) => string;
    private _readTag(tag);
}
