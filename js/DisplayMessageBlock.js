(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;

    function CtnBlkDisplayMessage(uiContainer) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.messageId = undefined;
            this.msgContainer = undefined;
            this.divError = undefined;
            this.txtError = undefined;

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

            var _self = this;

            context.ctnApiProxy.readMessage(messageId, function (error, result) {
                if (error) {
                    _self.displayError(error.toString());
                }
                else {
                    _self.displayMessage(result.message);
                }
            })
        }
    };

    CtnBlkDisplayMessage.prototype.displayMessage = function (message) {
        if (this.msgContainer) {
            $(this.msgContainer).text(message);
        }
    };

    CtnBlkDisplayMessage.prototype.hideMessage = function () {
        if (this.msgContainer) {
            $(this.msgContainer).text('');
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
        this.hideMessage();
        this.hideError();
    };

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    context.CtnBlkDisplayMessage = CtnBlkDisplayMessage;
})(this);