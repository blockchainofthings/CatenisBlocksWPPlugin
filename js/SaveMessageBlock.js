(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;
    var CtnFileHeader = context.CtnFileHeader;

    function CtnBlkSaveMessage(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.messageId = undefined;
            this.autoSave = props.autoSave;
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
                    _self.checkNotifyMsgRead(messageId);
                    _self.prepareMsgToSave(result.message);
                }
            })
        }
    };

    CtnBlkSaveMessage.prototype.checkNotifyMsgRead = function (messageId) {
        if (this.messageId.ctnMsgReadNotify) {
            // Dispatch event notifying that Catenis message had been read
            $(this.messageId.ctnMsgReadNotify).trigger('ctn-msg-read', messageId);
            delete this.messageId.ctnMsgReadNotify;
        }
    };

    CtnBlkSaveMessage.prototype.prepareMsgToSave = function (message) {
        var fileName;
        var fileType;
        var fileContents = Buffer.from(message, 'base64');

        var fileInfo = CtnFileHeader.decode(fileContents);

        if (fileInfo) {
            fileName = fileInfo.fileName;
            fileType = fileInfo.fileType;
            fileContents = fileInfo.fileContents;
        }
        else {
            fileName = __('unnamed', 'catenis-blocks');
            fileType = 'application/octet-stream';
        }

        var fileBlob = new Blob([fileContents], {type: fileType});

        this.setSaveMsgLink(fileBlob, fileName);
    };

    CtnBlkSaveMessage.prototype.setSaveMsgLink = function (fileBlob, fileName) {
        if (this.saveMsgAnchor) {
            if (context.navigator && context.navigator.msSaveBlob && context.navigator.userAgent.indexOf('Edge/') < 0) {
                // Internet Explorer
                this.saveMsgAnchor.file = {
                    blob: fileBlob,
                    name: fileName
                };

                if (!this.saveMsgAnchor.clickEventSet) {
                    this.saveMsgAnchor.addEventListener('click', function (event) {
                        event.stopPropagation();
                        event.preventDefault();

                        window.navigator.msSaveBlob(event.target.file.blob, event.target.file.name);
                    });

                    this.saveMsgAnchor.clickEventSet = true;
                }
            }
            else {
                this.saveMsgAnchor.href = context.URL.createObjectURL(fileBlob);
            }

            this.saveMsgAnchor.download = fileName;

            if (this.autoSave) {
                this.saveMsgAnchor.click();
            }
            else {
                this.saveMsgAnchor.style.display = 'inline'
            }
        }
    };

    CtnBlkSaveMessage.prototype.hideSaveMsgLink = function () {
        if (this.saveMsgAnchor) {
            if (context.navigator && context.navigator.msSaveBlob && context.navigator.userAgent.indexOf('Edge/') < 0) {
                // Internet Explorer
                delete this.saveMsgAnchor.file;
            }
            else if (!(this.saveMsgAnchor.href.length >= 1 && this.saveMsgAnchor.href.substring(this.saveMsgAnchor.href.length - 1) === '#')) {
                context.URL.revokeObjectURL(this.saveMsgAnchor.href);
                this.saveMsgAnchor.href = '#';
            }

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