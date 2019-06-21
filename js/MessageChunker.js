(function (context) {
    var Buffer = context.buffer.Buffer;

    //
    // MessageChunker function class constructor
    //
    //  Note: this class can be used for both passing or reading messages in chunks to/from Catenis
    //
    //  Arguments:
    //   message [Object(Buffer)] - The whole message's contents to be chunked
    //   maxChunkSizeOrEncoding [Number|String] - Either of, depending on parameter type:
    //                                             Number - Maximum size, in bytes, that a message chunk can be (after base-64  encoding).
    //                                                       Required for passing messages in chunk to Catenis
    //                                             String - The text encoding to be used for received message chunks. Required for reading
    //                                                       messages in chunk from Catenis
    function MessageChunker(message, maxChunkSizeOrEncoding) {
        if (typeof message === 'number' || typeof message === 'string') {
            maxChunkSizeOrEncoding = message;
            message = undefined;
        }

        this.message = message || Buffer.from('');
        this.bytesCount = 0;

        if (typeof maxChunkSizeOrEncoding === 'number') {
            // Maximum chunk size provided
            this.maxChunkSize = maxChunkSizeOrEncoding;

            // Calculate maximum size of raw (unencoded) message chunk
            this.maxRawChunkSize = Math.floor(this.maxChunkSize / 4) * 3;
        }
        else if (typeof maxChunkSizeOrEncoding === 'string') {
            // Encoding provided
            this.encoding = maxChunkSizeOrEncoding;
        }
    }

    // Used when passing messages in chunk to Catenis
    MessageChunker.prototype.nextMessageChunk = function () {
        if (this.maxChunkSize) {
            var chunkSize = Math.min(this.message.length, this.maxRawChunkSize);

            if (chunkSize > 0) {
                var msgChunk = this.message.slice(0, chunkSize);
                this.message = this.message.slice(chunkSize);

                this.bytesCount += chunkSize;

                return msgChunk.toString('base64');
            }
        }
    };

    // Used when reading messages in chunk from Catenis
    //
    //  Arguments:
    //   msgDataChunk [String] - Base-64 formatted message data chunk
    MessageChunker.prototype.newMessageChunk = function (msgDataChunk) {
        var bufMsgDataChunk = Buffer.from(msgDataChunk, this.encoding);
        this.message = Buffer.concat([this.message, bufMsgDataChunk]);

        this.bytesCount += bufMsgDataChunk.length;
    };

    // Used when reading messages in chunk from Catenis
    MessageChunker.prototype.getMessage = function () {
        return this.message.toString(this.encoding);
    };

    MessageChunker.prototype.getBytesCount = function () {
        return this.bytesCount;
    };

    context.MessageChunker = MessageChunker;
})(this);