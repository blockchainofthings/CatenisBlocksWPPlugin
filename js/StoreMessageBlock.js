(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;

    function CtnBlkStoreMessage(form, options, props) {
        this.form = form;
        this.options = options;
        this.successMsgTemplate = props.successMsgTemplate;
        this.successPanelId = props.successPanelId;
        this.errorPanelId = props.errorPanelId;
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
    
    CtnBlkStoreMessage.prototype.setResultPanels = function () {
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

    CtnBlkStoreMessage.prototype.setDefaultResultPanels = function () {
        if (!this.txtSuccess) {
            var elems = $('div.success', this.form.parentElement);
            if (elems.length > 0) {
                this.divMsgSuccess = elems[0];

                elems = $('p.success', this.divMsgSuccess);
                if (elems.length > 0) {
                    this.txtSuccess = elems[0];
                }
            }
        }

        if (!this.txtError) {
            elems = $('div.error', this.form.parentElement);
            if (elems.length > 0) {
                this.divMsgError = elems[0];

                elems = $('p.error', this.divMsgError);
                if (elems.length > 0) {
                    this.txtError = elems[0];
                }
            }
        }
    };

    CtnBlkStoreMessage.prototype.storeMessage = function () {
        if (typeof context.ctnApiProxy !== 'object') {
            // Catenis API client not loaded on page. Abort processing
            throw new Error('Catenis API client not loaded on page');
        }

        this.clearResultPanels();

        var msg = this.form.message.value;

        if (msg.length === 0) {
            // No message to log. Report error
            this.displayError(__('No message to be stored', 'catenis-blocks'));
            return;
        }

        var _self = this;

        context.ctnApiProxy.logMessage(msg, this.options, function(error, result) {
            if (error) {
                _self.displayError(error.toString());
            }
            else {
                if (_self.successMsgTemplate) {
                    _self.displaySuccess(_self.successMsgTemplate.replace(/{!messageId}/g, result.messageId));
                }
                _self.messageStored();
            }
        });
    };

    CtnBlkStoreMessage.prototype.startMonitoringMessageChange = function () {
        this.form.message.addEventListener('keydown', this.messageKeyDownHandler);
        this.form.message.addEventListener('keyup', this.messageKeyUpHandler);
        this.form.message.addEventListener('change', this.messageChangeHandler);
    };

    CtnBlkStoreMessage.prototype.stopMonitoringMessageChange = function () {
        this.form.message.removeEventListener('keydown', this.messageKeyDownHandler);
        this.form.message.removeEventListener('keyup', this.messageKeyUpHandler);
        this.form.message.removeEventListener('change', this.messageChangeHandler);
    };

    CtnBlkStoreMessage.prototype.messageChanged = function () {
        // Re-enable submit button
        this.form.submitButton.disabled = false;
    };

    CtnBlkStoreMessage.prototype.messageStored = function () {
        // Disable submit button
        this.form.submitButton.disabled = true;
        this.startMonitoringMessageChange();
    };
    
    CtnBlkStoreMessage.prototype.displaySuccess = function (text) {
        if (this.txtSuccess) {
            $(this.txtSuccess).html(convertLineBreak(text));
            
            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'block';
            }
        }
    };
    
    CtnBlkStoreMessage.prototype.hideSuccess = function () {
        if (this.txtSuccess) {
            $(this.txtSuccess).html('');

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'none';
            }
        }
    };

    CtnBlkStoreMessage.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            if (this.divMsgError) {
                this.divMsgError.style.display = 'block';
            }
        }
    };

    CtnBlkStoreMessage.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            if (this.divMsgError) {
                this.divMsgError.style.display = 'none';
            }
        }
    };

    CtnBlkStoreMessage.prototype.clearResultPanels = function () {
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
        this.messageStored();
    }

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    context.CtnBlkStoreMessage = CtnBlkStoreMessage;
})(this);