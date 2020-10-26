(
/**
 * @typedef Buffer
 * @type {object}
 */

/**
 * @param {object} context
 * @param {object} context.buffer
 * @param {Buffer} context.buffer.Buffer
 * @param {MessageChunker} context.MessageChunker
 */
function (context) {
    var Buffer = context.buffer.Buffer;

    /**
     * Message chunker class.
     * @param {Buffer} [message] The whole message to be broken down in chunks.
     * @param {string} [encoding=base64] The text encoding to be used for encoding/decoding the message data chunks.
     *                                    Valid values: 'hex', 'base64'. If not set, 'base64' is assumed.
     * @param {number} [maxChunkSize] Maximum size, in bytes, that a message data chunk can be (after encoding).
     */
    function MessageChunker(message, encoding, maxChunkSize) {
        if (typeof message === 'string') {
            // Message parameter has encoding
            if (typeof encoding === 'number') {
                // Encoding parameter has max chunk size
                maxChunkSize = encoding;
            }

            encoding = message;
            message = undefined;
        } 
        else if (typeof message === 'number') {
            // Message parameter has max chunk size
            maxChunkSize = message;
            message = encoding = undefined;
        }
        else if (typeof encoding === 'number') {
            // Encoding parameter has max chunk size
            maxChunkSize = encoding;
            encoding = undefined;
        }

        // Validate arguments
        if (message != undefined && !Buffer.isBuffer(message)) {
            throw new TypeError('Invalid MessageChunker constructor\'s \'message\' argument');
        }

        if (encoding != undefined && encoding !== 'hex' && encoding !== 'base64') {
            throw new TypeError('Invalid MessageChunker constructor\'s \'encoding\' argument');
        }

        if (maxChunkSize !== undefined && !Number.isInteger(maxChunkSize)
            && maxChunkSize < (encoding === 'hex' ? 2 : 4))
        {
            throw new TypeError('Invalid MessageChunker constructor\'s \'maxChunkSize\' argument');
        }

        /**
         * @type {Buffer}
         */
        this.message = message || Buffer.from('');
        this.encoding = encoding || 'base64';
        this.maxChunkSize = maxChunkSize;

        this.bytesCount = 0;
    }

    /**
     * Get next data chunk from message.
     * @returns {string} Encoded message data chunk.
     */
    MessageChunker.prototype.nextMessageChunk = function () {
        if (!this.maxChunkSize) {
            throw new Error('Unable to break message in chunks; maximum chunk size not specified');
        }

        if (!this.maxRawChunkSize) {
            // Calculate maximum size of raw (unencoded) message chunk
            this.maxRawChunkSize = this.encoding === 'base64'
                ? Math.floor(this.maxChunkSize / 4) * 3
                : Math.floor(this.maxChunkSize / 2);
        }

        var chunkSize = Math.min(this.message.length, this.maxRawChunkSize);

        if (chunkSize > 0) {
            var msgChunk = this.message.slice(0, chunkSize);
            this.message = this.message.slice(chunkSize);
    
            this.bytesCount += chunkSize;
    
            return msgChunk.toString(this.encoding);
        }
    };

    /**
     * Add a new data chunk to message.
     * @param {string} msgDataChunk Encoded message data chunk.
     */
    MessageChunker.prototype.newMessageChunk = function (msgDataChunk) {
        var bufMsgDataChunk = Buffer.from(msgDataChunk, this.encoding);
        this.message = Buffer.concat([this.message, bufMsgDataChunk]);

        this.bytesCount += bufMsgDataChunk.length;
    };

    /**
     * Retrieve the whole message.
     * @param {string} [encoding] Text encoding to be used when retrieving message. If not specified, the same encoding
     *                             used for the message data chunks is used.
     *                             
     * @returns {string} The encoded message.
     */
    MessageChunker.prototype.getMessage = function (encoding) {
        return this.message.toString(encoding || this.encoding);
    };

    /**
     * Get the current number of bytes in message.
     * @return {number} Total number of bytes.
     */
    MessageChunker.prototype.getBytesCount = function () {
        return this.bytesCount;
    };

    context.MessageChunker = MessageChunker;
})(this);