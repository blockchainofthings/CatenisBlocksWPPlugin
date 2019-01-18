(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;

    function CtnBlkSendMessage(form, targetDevice, options, successPanelId, errorPanelId) {
        this.form = form;
        this.targetDevice = targetDevice;
        this.options = options;
        this.successPanelId = successPanelId;
        this.errorPanelId = errorPanelId;
        this.divMsgSuccess = undefined;
        this.divMsgError = undefined;
        this.txtSuccess = undefined;
        this.txtError = undefined;
        this.messageKeyDownHandler = onMessageKeyDown.bind(this);
        this.messageKeyUpHandler = onMessageKeyUp.bind(this);
        this.messageChangeHandler = onMessageChange.bind(this);
        this.lastMessageValue = undefined;

        this.setResultPanels();
    }

    CtnBlkSendMessage.prototype.setResultPanels = function () {
        if (this.successPanelId) {
            // Try to load external success panel control
            var elems = $('#' + this.successPanelId);
            if (elems.length > 0) {
                this.txtSuccess = elems[0];
            }
        }

        if (this.errorPanelId) {
            // Try to load external error panel control
            elems = $('#' + this.errorPanelId);
            if (elems.length > 0) {
                this.txtError = elems[0];
            }
        }

        // Load default panels as necessary
        this.setDefaultResultPanels();
    };

    CtnBlkSendMessage.prototype.setDefaultResultPanels = function () {
        if (!this.txtSuccess) {
            var elems = $('form ~ div.ctnBlkDivMsgSuccess', this.form.parentElement);
            if (elems.length > 0) {
                this.divMsgSuccess = elems[0];

                elems = $('p.ctnBlkTxtSuccess', this.divMsgSuccess);
                if (elems.length > 0) {
                    this.txtSuccess = elems[0];
                }
            }
        }

        if (!this.txtError) {
            elems = $('form ~ div.ctnBlkDivMsgError', this.form.parentElement);
            if (elems.length > 0) {
                this.divMsgError = elems[0];

                elems = $('p.ctnBlkTxtError', this.divMsgError);
                if (elems.length > 0) {
                    this.txtError = elems[0];
                }
            }
        }
    };

    CtnBlkSendMessage.prototype.sendMessage = function () {
        if (typeof context.ctnApiProxy !== 'object') {
            // Catenis API client not loaded on page. Abort processing
            throw new Error('Catenis API client not loaded on page');
        }

        this.clearResultPanels();

        var msg = this.form.message.value;

        if (msg.length === 0) {
            // No message to log. Report error
            this.displayError(__('No message to be sent', 'catenis-blocks'));
            return;
        }

        if (this.form.deviceId) {
            var deviceId = this.form.deviceId.value.trim();

            if (deviceId.length === 0) {
                // No target device ID specified. Report error
                this.displayError(this.targetDevice.isProdUniqueId ? __('No target device product unique ID', 'catenis-blocks') : __('No target device ID', 'catenis-blocks'));
                return;
            }

            this.targetDevice.id = deviceId;
        }

        var _self = this;

        context.ctnApiProxy.sendMessage(this.targetDevice, msg, this.options, function(error, result) {
            if (error) {
                _self.displayError(error.toString());
            }
            else {
                _self.displaySuccess(__('Message successfully sent.<br>Message Id: ', 'catenis-blocks') + result.messageId);
                _self.messageSent();
            }
        });
    };

    CtnBlkSendMessage.prototype.startMonitoringMessageChange = function () {
        this.form.message.addEventListener('keydown', this.messageKeyDownHandler);
        this.form.message.addEventListener('keyup', this.messageKeyUpHandler);
        this.form.message.addEventListener('change', this.messageChangeHandler);
    };

    CtnBlkSendMessage.prototype.stopMonitoringMessageChange = function () {
        this.form.message.removeEventListener('keydown', this.messageKeyDownHandler);
        this.form.message.removeEventListener('keyup', this.messageKeyUpHandler);
        this.form.message.removeEventListener('change', this.messageChangeHandler);
    };

    CtnBlkSendMessage.prototype.messageChanged = function () {
        // Re-enable submit button
        this.form.submitButton.disabled = false;
    };

    CtnBlkSendMessage.prototype.messageSent = function () {
        // Disable submit button
        this.form.submitButton.disabled = true;
        this.startMonitoringMessageChange();
    };

    CtnBlkSendMessage.prototype.displaySuccess = function (text) {
        if (this.txtSuccess) {
            $(this.txtSuccess).html(convertLineBreak(text));

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'block';
            }
        }
    };

    CtnBlkSendMessage.prototype.hideSuccess = function () {
        if (this.txtSuccess) {
            $(this.txtSuccess).html('');

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'none';
            }
        }
    };

    CtnBlkSendMessage.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            if (this.divMsgError) {
                this.divMsgError.style.display = 'block';
            }
        }
    };

    CtnBlkSendMessage.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            if (this.divMsgError) {
                this.divMsgError.style.display = 'none';
            }
        }
    };

    CtnBlkSendMessage.prototype.clearResultPanels = function () {
        this.hideSuccess();
        this.hideError();
    };

    function onMessageKeyDown(event) {
        this.lastMessageValue = this.form.message.value;
    }

    function onMessageKeyUp(event) {
        var currentMessageValue = this.form.message.value;

        if (currentMessageValue !== this.lastMessageValue) {
            this.stopMonitoringMessageChange();
            this.messageChanged();
        }
    }

    function onMessageChange(event) {
        this.messageSent();
    }

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    context.CtnBlkSendMessage = CtnBlkSendMessage;
})(this);