/* eslint-disable no-console */
(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;
    var CtnFileHeader = context.CtnFileHeader;
    var MessageChunker = context.MessageChunker;
    var dataChunkSize = 10485760;   // (10 MB) Size of binary data before any encoding. The actual number of bytes
                                    //  received depends on the encoding used. For base64, it will be 13,981,014
    var initPollMsgProgressTime = 5000;    // 5 sec.
    var defPollMsgProgressTime = 30000;    // 30 sec.
    var backPollMsgProgressTime = 90000;   // 1.5 min.
                                     

    function CtnBlkSaveMessage(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.showSpinner = props.showSpinner;
            this.spinnerColor = props.spinnerColor;
            this.messageId = undefined;
            this.autoSave = props.autoSave;
            this.saveMsgAnchor = undefined;
            this.divError = undefined;
            this.txtError = undefined;
            this.spinner = undefined;
            this.readMessageChunk = readMessageChunk.bind(this);

            this.cachedMessageId = undefined;
            this.pollMsgProgressTimeout = undefined;
            this.pollMsgProgressInterval = undefined;
            this.pollMsgProgressTime = defPollMsgProgressTime;
            this.pollMsgProgressHandler = processMessageProgress.bind(this);

            this.notifyChannelOpen = false;
            this.lastOpenNtfyChnlRetryTime = undefined;
            this.minOpenNtfyChnlRetryInterval = 1000;   // 1 sec. (in milliseconds)

            this.setMessageElements();
            this.setErrorPanel();
            this.setUpNotification();
        }
    }

    CtnBlkSaveMessage.prototype.setUpNotification = function () {
        var _self = this;

        context.ctnApiProxy.on('comm-error', function (error) {
            // Error communicating with Catenis notification process
            console.error('Catenis notification process error:', error);

            if (_self.notifyChannelOpen) {
                var shouldRetryOpen = !_self.lastOpenNtfyChnlRetryTime || (Date.now() - _self.lastOpenNtfyChnlRetryTime >= _self.minOpenNtfyChnlRetryInterval);

                if (shouldRetryOpen) {
                    // Make sure that notification channel is open
                    _self.lastOpenNtfyChnlRetryTime = Date.now();
                    context.setImmediate(openNotifyChannel);
                }
            }
        });

        // Prepare to open notification channel to monitor final message progress event.
        var wsNotifyChannel = context.ctnApiProxy.createWsNotifyChannel('final-msg-progress');

        wsNotifyChannel.on('open', function (error) {
            if (error) {
                // Error establishing underlying WebSocket connection
                console.error('[' + wsNotifyChannel.eventName + '] - Error establishing underlying WebSocket connection:', error);
            }
            else {
                // Catenis notification channel successfully open
                console.log('[' + wsNotifyChannel.eventName + '] - Catenis notification channel successfully open');
                _self.notifyChannelOpen = true;
            }
        });

        wsNotifyChannel.on('error', function (error) {
            // Error in the underlying WebSocket connection
            console.error('[' + wsNotifyChannel.eventName + '] - Error in the underlying WebSocket connection:', error);
        });

        wsNotifyChannel.on('close', function (code, reason) {
            // Underlying WebSocket connection has been closed
            console.error('[' + wsNotifyChannel.eventName + '] - Underlying WebSocket connection has been closed; code: ' + code + ', reason: ' + reason);
            _self.notifyChannelOpen = false;

            var shouldRetry = !_self.lastOpenNtfyChnlRetryTime || (Date.now() - _self.lastOpenNtfyChnlRetryTime >= _self.minOpenNtfyChnlRetryInterval);

            if (shouldRetry) {
                // Reopen notification channel
                _self.lastOpenNtfyChnlRetryTime = Date.now();
                context.setImmediate(openNotifyChannel);
            }
        });

        wsNotifyChannel.on('notify', function (eventData) {
            _self.processFinalMessageProgress(eventData);
        });

        function openNotifyChannel() {
            wsNotifyChannel.open(function (error) {
                if (error) {
                    // Error sending command to open notification channel
                    console.error('Error opening Catenis notification channel:', error);
                }
            });
        }

        openNotifyChannel();
    };

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

            if (this.showSpinner) {
                this.displaySpinner();
            }

            // Start reading message
            this.readMessageChunk(messageId);
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
        if (this.showSpinner) {
            this.hideSpinner();
        }

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

    CtnBlkSaveMessage.prototype.displaySpinner = function () {
        if (!this.spinner) {
            this.spinner = new context.Spin.Spinner({
                className: 'msg-spinner',
                color: this.spinnerColor
            });
        }

        $(this.uiContainer).addClass('ctn-spinner');
        this.spinner.spin(this.uiContainer);
    };

    CtnBlkSaveMessage.prototype.hideSpinner = function () {
        if (this.spinner) {
            this.spinner.stop();
            $(this.uiContainer).removeClass('ctn-spinner');
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
        if (this.showSpinner) {
            this.hideSpinner();
        }

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

    CtnBlkSaveMessage.prototype.processFinalMessageProgress = function (eventData) {
        if (this.cachedMessageId && eventData.ephemeralMessageId === this.cachedMessageId) {
            // Message processing has been finalized. Clear pending message and stop polling
            this.cachedMessageId = undefined;
            this.stopPollingMessageProgress();

            if (eventData.progress.success) {
                // Message ready to be read. Start reading it
                this.readMessageChunk(eventData.result.messageId, eventData.result.continuationToken);
            }
            else {
                // Report error reading message
                this.displayError('Error reading message: [' + eventData.progress.error.code + '] - ' + eventData.progress.error.message);
            }
        }
    };

    CtnBlkSaveMessage.prototype.startPollingMessageProgress = function () {
        if (!this.pollMsgProgressTimeout) {
            // Set up initial timeout
            this.pollMsgProgressTimeout = context.setTimeout(this.pollMsgProgressHandler, initPollMsgProgressTime);
        }

        if (!this.pollMsgProgressInterval) {
            this.pollMsgProgressInterval = context.setInterval(this.pollMsgProgressHandler, this.pollMsgProgressTime);
        }
    }

    CtnBlkSaveMessage.prototype.stopPollingMessageProgress = function () {
        if (this.pollMsgProgressInterval) {
            context.clearInterval(this.pollMsgProgressInterval);
            this.pollMsgProgressInterval = undefined;
        }

        if (this.pollMsgProgressTimeout) {
            context.clearTimeout(this.pollMsgProgressTimeout);
            this.pollMsgProgressTimeout = undefined;
        }
    }

    function readMessageChunk(messageId, continuationToken, msgChunker) {
        var options = continuationToken ? {
            encoding: 'base64',
            continuationToken: continuationToken
        } : {
            dataChunkSize: dataChunkSize,
            async: true
        };

        var _self = this;

        context.ctnApiProxy.readMessage(messageId, options, function (error, result) {
            if (error) {
                _self.displayError(error.toString());
            }
            else {
                if (result.cachedMessageId) {
                    // Message processed asynchrnously. Save message reference
                    _self.cachedMessageId = result.cachedMessageId;

                    // Start polling for message progress
                    _self.pollMsgProgressTime = _self.notifyChannelOpen ? backPollMsgProgressTime : defPollMsgProgressTime;
                    _self.startPollingMessageProgress();
                }
                else {
                    // Accummulate message chunk
                    if (!msgChunker) {
                        msgChunker = new MessageChunker(options.encoding);
                    }

                    msgChunker.newMessageChunk(result.msgData);

                    if (result.continuationToken) {
                        // The whole message has not been received yet. Go get next chunk
                        context.setImmediate(_self.readMessageChunk, messageId, result.continuationToken, msgChunker);
                    }
                    else {
                        // Save complete message
                        _self.checkNotifyMsgRead(messageId);
                        _self.prepareMsgToSave(msgChunker.getMessage('base64'));
                    }
                }
            }
        })
    }

    function processMessageProgress() {
        if (this.cachedMessageId) {
            var _self = this;

            context.ctnApiProxy.retrieveMessageProgress(this.cachedMessageId, function (error, result) {
                if (error) {
                    // Error retrieving message progress. Clear pending message and stop polling
                    console.error('Error retrieving message progress:', error.toString());
                    _self.cachedMessageId = undefined;
                    _self.stopPollingMessageProgress();
                }
                else {
                    if (result.progress.done) {
                        // Message processing has been finalized. Clear pending message and stop polling
                        _self.cachedMessageId = undefined;
                        _self.stopPollingMessageProgress();

                        if (result.progress.success) {
                            // Message ready to be read. Start reading it
                            _self.readMessageChunk(result.result.messageId, result.result.continuationToken);
                        }
                        else {
                            // Report error reading message
                            _self.displayError('Error reading message: [' + result.progress.error.code + '] - ' + result.progress.error.message);
                        }
                    }
                }
            });
        }
        else {
            // No cached message awaiting process. Stop polling
            this.stopPollingMessageProgress();
        }
    }

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    context.CtnBlkSaveMessage = CtnBlkSaveMessage;
})(this);