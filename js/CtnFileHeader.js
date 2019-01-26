(function (context) {
    var Buffer = context.buffer.Buffer;
    var sjcl = context.sjcl;

    var salt = 'CTN_FILE_METADATA';
    var checksumLength = 7;

    var CtnFileHeader = {};

    CtnFileHeader.encode = function (fileInfo) {
        var fileMeta = {
            fn: fileInfo.fileName,      // File name
            mt: fileInfo.fileType       // MIME type
        };

        var header = JSON.stringify(fileMeta) + '\n';
        var checksum = computeChecksum(header);

        return Buffer.concat([
            Buffer.from(checksum + header),
            Buffer.from(fileInfo.fileContents, 'base64')
        ]).toString('base64');
    };

    CtnFileHeader.decode = function (fileContents) {
        var bufFileContents = Buffer.from(fileContents, 'base64');
        var firstLineEndPos = bufFileContents.indexOf('\n');

        if (firstLineEndPos > checksumLength + 1) {
            var firstLine = bufFileContents.toString('utf8', 0, firstLineEndPos + 1);
            var checksum = firstLine.substring(0, checksumLength);
            var header = firstLine.substring(checksumLength);
            var fileMeta;

            try {
                // Exclude trailing new line character
                fileMeta = JSON.parse(header.substring(0, header.length - 1));
            }
            catch (err) {}

            if (isValidFileMeta(fileMeta) && checksum === computeChecksum(header)) {
                return {
                    fileName: fileMeta.fn,
                    fileType: fileMeta.mt,
                    fileContents: bufFileContents.toString('base64', firstLineEndPos + 1)
                }
            }
        }

        return null;
    };

    function computeChecksum(header) {
        return sjcl.codec.hex.fromBits(sjcl.hash.sha1.hash(salt + header)).substring(0, checksumLength);
    }

    function isValidFileMeta(fileMeta) {
        var result = false;

        if (typeof fileMeta === 'object' && fileMeta !== null) {
            var validKeys = {
                fn: true,
                mt: true
            };

            result = !Object.keys(fileMeta).some(function (key) {
                return !(key in validKeys);
            });
        }

        return result;
    }

    context.CtnFileHeader = CtnFileHeader;
})(this);