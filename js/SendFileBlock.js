/* eslint-disable no-console */
(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;
    var CtnFileHeader = context.CtnFileHeader;
    var MessageChunker = context.MessageChunker;
    var maxChunkSize = 15727616;    // (15 MB - 1 KB) Size after base64 encoding
    var maxRawChunkSize = Math.floor(maxChunkSize / 4) * 3;  // Size before base64 encoding
    var initPollMsgProgressTime = 5000;    // 5 sec.
    var defPollMsgProgressTime = 30000;    // 30 sec.
    var backPollMsgProgressTime = 90000;    // 1.5 min.

    function CtnBlkSendFile(uiContainer, targetDevice, options, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.targetDevice = targetDevice;
            this.showSpinner = props.showSpinner;
            this.spinnerColor = props.spinnerColor;
            this.form = undefined;
            this.divDropZone = undefined;
            this.divDisabledPanel = undefined;
            this.txtSelectedFile = undefined;
            this.inputFile = undefined;
            this.selectedFile = undefined;
            this.options = options;
            this.options.encoding = 'base64';
            this.options.storage = 'external';
            this.addFileHeader = props.addFileHeader;
            this.successMsgTemplate = props.successMsgTemplate;
            this.successPanelId = props.successPanelId;
            this.errorPanelId = props.errorPanelId;
            this.divMsgSuccess = undefined;
            this.divMsgError = undefined;
            this.txtSuccess = undefined;
            this.txtError = undefined;
            this.inputFileChangeHandler = onInputFileChange.bind(this);

            this.provisionalMessageId = undefined;
            this.pollMsgProgressTimeout = undefined;
            this.pollMsgProgressInterval = undefined;
            this.pollMsgProgressTime = defPollMsgProgressTime;
            this.pollMsgProgressHandler = processMessageProgress.bind(this);

            this.notifyChannelOpen = false;
            this.lastOpenNtfyChnlRetryTime = undefined;
            this.minOpenNtfyChnlRetryInterval = 1000;   // 1 sec. (in milliseconds)

            this.setUpDropZone();
            this.setResultPanels();
            this.setUpNotification();
        }
    }

    CtnBlkSendFile.prototype.setUpNotification = function () {
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

    CtnBlkSendFile.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
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

    CtnBlkSendFile.prototype.setUpDropZone = function () {
        this.uiContainer.style.display = 'block';
        
        var elems = $('form', this.uiContainer);
        if (elems.length > 0) {
            this.form = elems[0];

            elems = $('div.dropzone', this.uiContainer);
            if (elems.length > 0) {
                this.divDropZone = elems[0];
    
                elems = $('div.dropzone > p.selected', this.divDropZone.parentElement);
                if (elems.length > 0) {
                    this.txtSelectedFile = elems[0];
                }
    
                elems = $('input[type="file"]', this.divDropZone.parentElement);
                if (elems.length > 0) {
                    this.inputFile = elems[0];
    
                    this.inputFile.addEventListener('change', this.inputFileChangeHandler);
                }
    
                elems = $('div.dropzone > div.disabledPanel', this.divDropZone.parentElement);
                if (elems.length > 0) {
                    this.divDisabledPanel = elems[0];
                }
            }
        }
    };

    CtnBlkSendFile.prototype.disableDropZone = function () {
        $(this.divDropZone).addClass('disabled');
        this.divDisabledPanel.style.display = 'block';
    };

    CtnBlkSendFile.prototype.enableDropZone = function () {
        $(this.divDropZone).removeClass('disabled');
        this.divDisabledPanel.style.display = 'none';
    };

    CtnBlkSendFile.prototype.disableSubmitButton = function () {
        this.form.submitButton.disabled = true;
    }

    CtnBlkSendFile.prototype.enableSubmitButton = function () {
        this.form.submitButton.disabled = false;
    }

    CtnBlkSendFile.prototype.selectFile = function () {
        if (this.inputFile) {
            this.inputFile.click();
        }
    };

    CtnBlkSendFile.prototype.dropEventHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.divDropZone) {
            this.divDropZone.classList.remove('dragover');
        }

        var files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

        if (files && files.length > 0) {
            this.updateSelectedFile(files[0]);
        }
    };

    CtnBlkSendFile.prototype.dragEnterHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.divDropZone) {
            this.divDropZone.classList.add('dragover');
            this.lastDragEnterElem = event.target;
        }
    };

    CtnBlkSendFile.prototype.dragLeaveHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.divDropZone && event.target === this.lastDragEnterElem) {
            this.divDropZone.classList.remove('dragover');
        }
    };

    CtnBlkSendFile.prototype.dragOverHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();
    };

    CtnBlkSendFile.prototype.displaySpinner = function () {
        if (!this.spinner) {
            this.spinner = new context.Spin.Spinner({
                className: 'msg-spinner',
                color: this.spinnerColor
            });
        }

        this.spinner.spin(this.divDropZone);
    };

    CtnBlkSendFile.prototype.hideSpinner = function () {
        if (this.spinner) {
            this.spinner.stop();
        }
    };

    CtnBlkSendFile.prototype.setResultPanels = function () {
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

    CtnBlkSendFile.prototype.setDefaultResultPanels = function () {
        if (!this.txtSuccess) {
            var elems = $('div.success', this.uiContainer);
            if (elems.length > 0) {
                this.divMsgSuccess = elems[0];

                elems = $('p.success', this.divMsgSuccess);
                if (elems.length > 0) {
                    this.txtSuccess = elems[0];
                }
            }
        }

        if (!this.txtError) {
            elems = $('div.error', this.uiContainer);
            if (elems.length > 0) {
                this.divMsgError = elems[0];

                elems = $('p.error', this.divMsgError);
                if (elems.length > 0) {
                    this.txtError = elems[0];
                }
            }
        }
    };

    CtnBlkSendFile.prototype.sendFile = function () {
        this.clearResultPanels();

        this.disableDropZone();
        this.disableSubmitButton();

        if (this.showSpinner) {
            this.displaySpinner();
        }

        if (!this.selectedFile) {
            // No file selected. Report error
            this.displayError(__('No file selected to be sent', 'catenis-blocks'));
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

        this.readFile(this.selectedFile);
    };

    CtnBlkSendFile.prototype.sendReadFile = function (fileInfo) {
        var fileContents = this.addFileHeader ? CtnFileHeader.encode(fileInfo) : fileInfo.fileContents;

        var _self = this;

        function sendMsgChunk(msgChunker, targetDevice, options, continuationToken) {
            // Get next message chunk
            var dataChunk = msgChunker.nextMessageChunk();
            var message = dataChunk ? {
                data: dataChunk,
                isFinal: false
            } : {
                isFinal: true
            };

            if (continuationToken) {
                message.continuationToken = continuationToken;
            }

            // Pass message chunk to be sent
            context.ctnApiProxy.sendMessage(message, targetDevice, options, function (error, result) {
                if (error) {
                    _self.displayError(error.toString());
                }
                else {
                    if (result.continuationToken) {
                        // Not all message chunks have been passed yet. Get continuation token
                        //  and pass next message chunk (in the next tick)
                        context.setImmediate(sendMsgChunk, msgChunker, targetDevice, options, result.continuationToken);
                    }
                    else {
                        // All message has been sent
                        if (result.messageId) {
                            // Display result
                            if (_self.successMsgTemplate) {
                                _self.displaySuccess(_self.successMsgTemplate.replace(/{!messageId}/g, result.messageId));
                            }
                        }
                        else {
                            // Message processed asynchrnously. Save message reference
                            _self.provisionalMessageId = result.provisionalMessageId;

                            // Start polling for message progress
                            _self.pollMsgProgressTime = _self.notifyChannelOpen ? backPollMsgProgressTime : defPollMsgProgressTime;
                            _self.startPollingMessageProgress();
                        }
                    }
                }
            });
        }

        if (fileContents.length > maxRawChunkSize) {
            // Indicate that message should be processed asynchronously
            this.options.async = true;

            // Pass message to be sent in chunks
            sendMsgChunk(new MessageChunker(fileContents, this.options.encoding, maxChunkSize), this.targetDevice, this.options);
        }
        else {
            // Indicate that message should be processed synchronously
            this.options.async = false;

            // Pass message to be sent at once
            context.ctnApiProxy.sendMessage(fileContents.toString(this.options.encoding), this.targetDevice, this.options, function (error, result) {
                if (error) {
                    _self.displayError(error.toString());
                }
                else {
                    if (result.messageId) {
                        // Display result
                        if (_self.successMsgTemplate) {
                            _self.displaySuccess(_self.successMsgTemplate.replace(/{!messageId}/g, result.messageId));
                        }
                    }
                    else {
                        // Message processed asynchrnously. Save message reference 
                        _self.provisionalMessageId = result.provisionalMessageId;

                        // Start polling for message progress
                        _self.pollMsgProgressTime = _self.notifyChannelOpen ? backPollMsgProgressTime : defPollMsgProgressTime;
                        _self.startPollingMessageProgress();
                    }
                }
            });
        }
    };

    CtnBlkSendFile.prototype.readFile = function (file) {
        var fileReader = new FileReader();
        var _self = this;

        fileReader.onload = function (event) {
            var fileData = event.target.result;

            if (!fileData || fileData.byteLength === 0) {
                // Empty file; nothing to do
                _self.displayError(__('Empty file; nothing to send', 'catenis-blocks'));
                return;
            }

            _self.sendReadFile({
                fileName: file.name,
                fileType: file.type ? file.type : 'text/plain',
                fileContents: Buffer.from(fileData)
            });
        };

        fileReader.onerror = function (event) {
            var error = event.target.error;
            var errMsg = typeof FileError === 'function' && (error instanceof context.FileError) ?
                'FileError [code: ' + error.code + ']' :
                error.message;

            _self.displayError(__('Error reading file: ', 'catenis-blocks') + errMsg);
        };

        // eslint-disable-next-line no-unused-vars
        fileReader.onabort = function (event) {
            _self.displayError(__('Reading of file has been aborted', 'catenis-blocks'));
        };

        fileReader.readAsArrayBuffer(file);
    };

    CtnBlkSendFile.prototype.selectedFileChanged = function () {
        this.enableSubmitButton();
    };

    CtnBlkSendFile.prototype.displaySuccess = function (text) {
        this.enableDropZone();

        if (this.showSpinner) {
            this.hideSpinner();
        }

        if (this.txtSuccess) {
            $(this.txtSuccess).html(convertLineBreak(text));

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'block';
            }
        }
    };

    CtnBlkSendFile.prototype.hideSuccess = function () {
        if (this.txtSuccess) {
            $(this.txtSuccess).html('');

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'none';
            }
        }
    };

    CtnBlkSendFile.prototype.displayError = function (text) {
        this.enableDropZone();
        this.enableSubmitButton();

        if (this.showSpinner) {
            this.hideSpinner();
        }

        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            if (this.divMsgError) {
                this.divMsgError.style.display = 'block';
            }
        }
    };

    CtnBlkSendFile.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            if (this.divMsgError) {
                this.divMsgError.style.display = 'none';
            }
        }
    };

    CtnBlkSendFile.prototype.clearResultPanels = function () {
        this.hideSuccess();
        this.hideError();
    };

    CtnBlkSendFile.prototype.updateSelectedFile = function (newFile) {
        if (!this.selectedFile || !areFilesEqual(this.selectedFile, newFile)) {
            this.selectedFile = newFile;
            this.txtSelectedFile.innerText = this.selectedFile.name;

            this.selectedFileChanged();
        }
    };

    CtnBlkSendFile.prototype.processFinalMessageProgress = function (eventData) {
        if (this.provisionalMessageId && eventData.ephemeralMessageId === this.provisionalMessageId) {
            // Message processing has been finalized. Clear pending message and stop polling
            this.provisionalMessageId = undefined;
            this.stopPollingMessageProgress();

            if (eventData.progress.success) {
                // File successfully stored
                if (this.successMsgTemplate) {
                    this.displaySuccess(this.successMsgTemplate.replace(/{!messageId}/g, eventData.result.messageId));
                }
            }
            else {
                // Report error storing file
                this.displayError('Error storing file: [' + eventData.progress.error.code + '] - ' + eventData.progress.error.message);
            }
        }
    };

    CtnBlkSendFile.prototype.startPollingMessageProgress = function () {
        if (!this.pollMsgProgressTimeout) {
            // Set up initial timeout
            this.pollMsgProgressTimeout = context.setTimeout(this.pollMsgProgressHandler, initPollMsgProgressTime);
        }

        if (!this.pollMsgProgressInterval) {
            this.pollMsgProgressInterval = context.setInterval(this.pollMsgProgressHandler, this.pollMsgProgressTime);
        }
    }

    CtnBlkSendFile.prototype.stopPollingMessageProgress = function () {
        if (this.pollMsgProgressInterval) {
            context.clearInterval(this.pollMsgProgressInterval);
            this.pollMsgProgressInterval = undefined;
        }

        if (this.pollMsgProgressTimeout) {
            context.clearTimeout(this.pollMsgProgressTimeout);
            this.pollMsgProgressTimeout = undefined;
        }
    }

    function processMessageProgress() {
        if (this.provisionalMessageId) {
            var _self = this;

            context.ctnApiProxy.retrieveMessageProgress(this.provisionalMessageId, function (error, result) {
                if (error) {
                    // Error retrieving message progress. Clear pending message and stop polling
                    console.error('Error retrieving message progress:', error.toString());
                    _self.provisionalMessageId = undefined;
                    _self.stopPollingMessageProgress();
                }
                else {
                    if (result.progress.done) {
                        // Message processing has been finalized. Clear pending message and stop polling
                        _self.provisionalMessageId = undefined;
                        _self.stopPollingMessageProgress();

                        if (result.progress.success) {
                            // File successfully stored
                            if (_self.successMsgTemplate) {
                                _self.displaySuccess(_self.successMsgTemplate.replace(/{!messageId}/g, result.result.messageId));
                            }
                        }
                        else {
                            // Report error storing file
                            _self.displayError('Error storing file: [' + result.progress.error.code + '] - ' + result.progress.error.message);
                        }
                    }
                }
            });
        }
        else {
            // No provisional message awaiting process. Stop polling
            this.stopPollingMessageProgress();
        }
    }

    function onInputFileChange(event) {
        event.preventDefault();

        this.updateSelectedFile(event.target.files[0]);
    }

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    function areFilesEqual(file1, file2) {
        return file1.name === file2.name && file1.lastModified === file2.lastModified;
    }

    context.CtnBlkSendFile = CtnBlkSendFile;
})(this);