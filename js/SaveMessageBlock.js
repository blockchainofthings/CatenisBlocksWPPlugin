(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;

    function CtnBlkSaveMessage(uiContainer) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.messageId = undefined;
            this.saveMsgAnchor = undefined;
            this.divError = undefined;
            this.txtError = undefined;

            this.setMessageElements();
            this.setErrorPanel();
        }
    }

    CtnBlkSaveMessage.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
        var result = true;

        if (typeof context.ctnApiProxy !== 'object') {
            var elems = $('div.noctnapiproxy', uiContainer.parentElement);
            if (elems.length > 0) {
                var noCtnApiProxy = elems[0];

                noCtnApiProxy.style.display = 'block';
            }

            uiContainer.style.display = 'none';
            result = false;
        }

        return result;
    };

    CtnBlkSaveMessage.prototype.setMessageElements = function () {
        var elems = $('input[name="messageId"]', this.uiContainer);
        if (elems.length > 0) {
            this.messageId = elems[0];
        }

        elems = $('a', this.uiContainer);
        if (elems.length > 0) {
            this.saveMsgAnchor = elems[0];
        }
    };

    CtnBlkSaveMessage.prototype.setErrorPanel = function () {
        var elems = $('div.error', this.uiContainer);
        if (elems.length > 0) {
            this.divError = elems[0];

            elems = $('p.error', this.divError);
            if (elems.length > 0) {
                this.txtError = elems[0];
            }
        }
    };

    CtnBlkSaveMessage.prototype.checkRetrieveMessage = function () {
        var messageId;

        if (this.messageId && (messageId = this.messageId.value.trim())) {
            this.clearResults();

            var _self = this;

            context.ctnApiProxy.readMessage(messageId, 'base64', function (error, result) {
                if (error) {
                    _self.displayError(error.toString());
                }
                else {
                    _self.prepareMsgToSave(result.message);
                }
            })
        }
    };

    CtnBlkSaveMessage.prototype.prepareMsgToSave = function (message) {
        var msgBuf = Buffer.from(message, 'base64');
        var fileName = __('unnamed', 'catenis-blocks');
        var fileType = 'application/octet-stream';

        // Check if file header is present
        var firstLineEndPos = msgBuf.indexOf('\r\n');

        if (firstLineEndPos > 0) {
            var firstLine = msgBuf.slice(0, firstLineEndPos).toString();
            var matchResult = firstLine.match(/^CTN_FILE_METADATA::(.+)::(.+)::CTN_FILE_METADATA$/);

            if (matchResult) {
                // Valid file header. Extract file name and type
                fileName = matchResult[1];
                fileType = matchResult[2];
            }
        }
        else {
            // Adjust index so the whole message is used as the file contents
            firstLineEndPos = -2;
        }

        // Compose data URL using file attributes
        var dataUrl = 'data:' + fileType + ';base64,' + msgBuf.slice(firstLineEndPos + 2).toString('base64');

        this.setSaveMsgLink(dataUrl, fileName);
    };

    CtnBlkSaveMessage.prototype.setSaveMsgLink = function (url, fileName) {
        if (this.saveMsgAnchor) {
            this.saveMsgAnchor.href = url;
            this.saveMsgAnchor.download = fileName;
            this.saveMsgAnchor.style.display = 'inline'
        }
    };

    CtnBlkSaveMessage.prototype.hideSaveMsgLink = function () {
        if (this.saveMsgAnchor) {
            this.saveMsgAnchor.href = '#';
            this.saveMsgAnchor.download = '';
            this.saveMsgAnchor.style.display = 'none';
        }
    };

    CtnBlkSaveMessage.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            this.divError.style.display = 'block';
        }
    };

    CtnBlkSaveMessage.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            this.divError.style.display = 'none';
        }
    };

    CtnBlkSaveMessage.prototype.clearResults = function () {
        this.hideSaveMsgLink();
        this.hideError();
    };

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    context.CtnBlkSaveMessage = CtnBlkSaveMessage;
})(this);