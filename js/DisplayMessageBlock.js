(function (context) {
    var $ = context.jQuery;
    // eslint-disable-next-line no-unused-vars
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;
    var CtnFileHeader = context.CtnFileHeader;

    function CtnBlkDisplayMessage(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.showSpinner = props.showSpinner;
            this.spinnerColor = props.spinnerColor;
            this.stripFileHeader = props.stripFileHeader;
            this.limitMsg = props.limitMsg;
            this.maxMsgLength = props.maxMsgLength;
            this.messageId = undefined;
            this.msgContainer = undefined;
            this.divError = undefined;
            this.txtError = undefined;
            this.spinner = undefined;

            this.setMessageElements();
            this.setErrorPanel();
        }
    }

    CtnBlkDisplayMessage.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
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

    CtnBlkDisplayMessage.prototype.setMessageElements = function () {
        var elems = $('input[name="messageId"]', this.uiContainer);
        if (elems.length > 0) {
            this.messageId = elems[0];
        }

        elems = $('pre', this.uiContainer);
        if (elems.length > 0) {
            this.msgContainer = elems[0];
        }
    };

    CtnBlkDisplayMessage.prototype.setErrorPanel = function () {
        var elems = $('div.error', this.uiContainer);
        if (elems.length > 0) {
            this.divError = elems[0];

            elems = $('p.error', this.divError);
            if (elems.length > 0) {
                this.txtError = elems[0];
            }
        }
    };

    CtnBlkDisplayMessage.prototype.checkRetrieveMessage = function () {
        var messageId;

        if (this.messageId && (messageId = this.messageId.value.trim())) {
            this.clearResults();

            if (this.showSpinner) {
                this.displaySpinner();
            }

            var _self = this;

            context.ctnApiProxy.readMessage(messageId, function (error, result) {
                _self.hideSpinner();

                if (error) {
                    _self.displayError(error.toString());
                }
                else {
                    _self.checkNotifyMsgRead(messageId);
                    _self.displayMessage(result.message);
                }
            })
        }
    };

    CtnBlkDisplayMessage.prototype.checkNotifyMsgRead = function (messageId) {
        if (this.messageId.ctnMsgReadNotify) {
            // Dispatch event notifying that Catenis message had been read
            $(this.messageId.ctnMsgReadNotify).trigger('ctn-msg-read', messageId);
            delete this.messageId.ctnMsgReadNotify;
        }
    };

    CtnBlkDisplayMessage.prototype.displayMessage = function (message) {
        if (this.msgContainer) {
            if (this.stripFileHeader) {
                message = checkStripFileHeader(message);
            }

            var $msgContainer = $(this.msgContainer);

            var onClickHandler = function (event) {
                event.stopPropagation();
                event.preventDefault();

                // Delete message continuation info
                $(event.target).parent().remove();

                // Display the whole message
                $msgContainer.text(message);
            };

            var truncatedMsg;

            if (this.limitMsg && (truncatedMsg = truncateMessage(message, this.maxMsgLength))) {
                // Prepare msg continuation
                var $span = $(context.document.createElement('span'))
                        .html('... (<a href="#">show remaining ' + (message.length - truncatedMsg.length).toLocaleString() + ' characters</a>)');

                $('a', $span[0]).click(onClickHandler);

                $msgContainer
                    .after($span)
                    .text(truncatedMsg);
            }
            else {
                // Display the whole message
                $msgContainer.text(message);
            }
        }
    };

    CtnBlkDisplayMessage.prototype.displaySpinner = function () {
        if (!this.spinner) {
            this.spinner = new context.Spin.Spinner({
                className: 'msg-spinner',
                color: this.spinnerColor
            });
        }

        $(this.uiContainer).addClass('ctn-spinner');
        this.spinner.spin(this.uiContainer);
    };

    CtnBlkDisplayMessage.prototype.hideSpinner = function () {
        if (this.spinner) {
            this.spinner.stop();
            $(this.uiContainer).removeClass('ctn-spinner');
        }
    };

    CtnBlkDisplayMessage.prototype.hideMessage = function () {
        if (this.msgContainer) {
            var $msgContainer = $(this.msgContainer);

            $('span', $msgContainer.parent()[0]).remove();
            $msgContainer.text('');
        }
    };

    CtnBlkDisplayMessage.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            this.divError.style.display = 'block';
        }
    };

    CtnBlkDisplayMessage.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            this.divError.style.display = 'none';
        }
    };

    CtnBlkDisplayMessage.prototype.clearResults = function () {
        this.hideSpinner();
        this.hideMessage();
        this.hideError();
    };

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    function checkStripFileHeader(message) {
        var fileContents = Buffer.from(message);

        var fileInfo = CtnFileHeader.decode(fileContents);

        if (fileInfo) {
            message = fileInfo.fileContents.toString();
        }

        return message;
    }

    function truncateMessage(message, maxLength) {
        if (message.length > maxLength) {
            var truncateLength = maxLength;
            var lastCharCode = message.charCodeAt(maxLength - 1);

            if (lastCharCode >= 0xd800 && lastCharCode <= 0xdbff) {
                // Last character is first code unit of a UTF-16 surrogate pair.
                //  So add one more character, to include the whole pair
                truncateLength++;

                if (message.length === truncateLength) {
                    // No need to truncate message. Just return
                    return;
                }
            }

            return message.substring(0, truncateLength);
        }
    }

    context.CtnBlkDisplayMessage = CtnBlkDisplayMessage;
})(this);