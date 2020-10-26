/* eslint-disable no-console */
(function (context) {
    var $ = context.jQuery;
    // eslint-disable-next-line no-unused-vars
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;
    var CtnFileHeader = context.CtnFileHeader;
    var MessageChunker = context.MessageChunker;
    var dataChunkSize = 10485760;   // (10 MB) Size of binary data before any encoding. The actual number of bytes
                                    //  received depends on the encoding used. For base64, it will be 13,981,014
    var initPollMsgProgressTime = 5000;    // 5 sec.
    var defPollMsgProgressTime = 30000;    // 30 sec.
    var backPollMsgProgressTime = 90000;    // 1.5 min.
                                     
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

    CtnBlkDisplayMessage.prototype.setUpNotification = function () {
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

            // Start reading message
            this.readMessageChunk(messageId);
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
        if (this.showSpinner) {
            this.hideSpinner();
        }

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
        if (this.showSpinner) {
            this.hideSpinner();
        }

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

    CtnBlkDisplayMessage.prototype.processFinalMessageProgress = function (eventData) {
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

    CtnBlkDisplayMessage.prototype.startPollingMessageProgress = function () {
        if (!this.pollMsgProgressTimeout) {
            // Set up initial timeout
            this.pollMsgProgressTimeout = context.setTimeout(this.pollMsgProgressHandler, initPollMsgProgressTime);
        }

        if (!this.pollMsgProgressInterval) {
            this.pollMsgProgressInterval = context.setInterval(this.pollMsgProgressHandler, this.pollMsgProgressTime);
        }
    }

    CtnBlkDisplayMessage.prototype.stopPollingMessageProgress = function () {
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
                        // Display complete message
                        _self.checkNotifyMsgRead(messageId);
                        _self.displayMessage(msgChunker.getMessage('utf8'));
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