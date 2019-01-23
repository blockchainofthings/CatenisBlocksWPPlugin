(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var Buffer = context.buffer.Buffer;

    function CtnBlkStoreFile(form, options, props) {
        this.form = form;

        if (this.checkCtnApiProxyAvailable(form.parentElement)) {
            this.divDropZone = undefined;
            this.divDropContainer = undefined;
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

            this.setUpDropZone();
            this.setResultPanels();
        }
    }

    CtnBlkStoreFile.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
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

    CtnBlkStoreFile.prototype.setUpDropZone = function () {
        var elems = $('div.dropzone', this.form.parentElement);
        if (elems.length > 0) {
            this.divDropZone = elems[0];

            elems = $('div.dropzone > div.dropcontainer', this.divDropZone.parentElement);
            if (elems.length > 0) {
                this.divDropContainer = elems[0];

                elems = $('div.dropcontainer > p.selected', this.divDropContainer.parentElement);
                if (elems.length > 0) {
                    this.txtSelectedFile = elems[0];
                }
            }

            elems = $('input[type="file"]', this.divDropZone.parentElement);
            if (elems.length > 0) {
                this.inputFile = elems[0];

                this.inputFile.addEventListener('change', this.inputFileChangeHandler);
            }
        }
    };

    CtnBlkStoreFile.prototype.selectFile = function () {
        if (this.inputFile) {
            this.inputFile.click();
        }
    };

    CtnBlkStoreFile.prototype.dropEventHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.divDropContainer) {
            this.divDropContainer.classList.remove('dragover');
        }

        var files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

        if (files && files.length > 0) {
            this.updateSelectedFile(files[0]);
        }
    };

    CtnBlkStoreFile.prototype.dragEnterHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.divDropContainer) {
            this.divDropContainer.classList.add('dragover');
        }
    };

    CtnBlkStoreFile.prototype.dragLeaveHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.divDropContainer) {
            this.divDropContainer.classList.remove('dragover');
        }
    };

    CtnBlkStoreFile.prototype.dragOverHandler = function (event) {
        event.stopPropagation();
        event.preventDefault();
    };

    CtnBlkStoreFile.prototype.setResultPanels = function () {
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

    CtnBlkStoreFile.prototype.setDefaultResultPanels = function () {
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

    CtnBlkStoreFile.prototype.storeFile = function () {
        this.clearResultPanels();

        if (!this.selectedFile) {
            // No file selected. Report error
            this.displayError(__('No file selected to be stored', 'catenis-blocks'));
            return;
        }

        this.readFile(this.selectedFile);
    };

    CtnBlkStoreFile.prototype.storeReadFile = function (fileInfo) {
        var message = this.addFileHeader ?
                Buffer.concat([
                    Buffer.from('CTN_FILE_METADATA::' + fileInfo.fileName + '::' + fileInfo.fileType + '::CTN_FILE_METADATA\r\n'),
                    Buffer.from(fileInfo.fileContents, 'base64')
                ]).toString('base64')
                : fileInfo.fileContents;

        var _self = this;

        context.ctnApiProxy.logMessage(message, this.options, function(error, result) {
            if (error) {
                _self.displayError(error.toString());
            }
            else {
                if (_self.successMsgTemplate) {
                    _self.displaySuccess(_self.successMsgTemplate.replace(/{!messageId}/g, result.messageId));
                }
                _self.fileStored();
            }
        });
    };

    CtnBlkStoreFile.prototype.readFile = function (file) {
        var fileInfo = {
            fileName: file.name
        };

        var fileReader = new FileReader();
        var _self = this;

        fileReader.onload = function (event) {
            var matchResult = event.target.result.match(/^data:(.*\/.*)?;base64,(.*)$/);

            if (!matchResult) {
                _self.displayError(__('Error reading file: inconsistent data', 'catenis-blocks'));
                return;
            }

            var mimeType = matchResult[1];
            var data = matchResult[2];

            if (!data || data.length === 0) {
                _self.displayError(__('Empty file; nothing to store', 'catenis-blocks'));
                return;
            }

            fileInfo.fileType = mimeType ? mimeType : 'text/plain';
            fileInfo.fileContents = data;

            _self.storeReadFile(fileInfo);
        };

        fileReader.onerror = function (event) {
            var error = event.target.error;
            var errMsg = typeof FileError === 'function' && (error instanceof FileError) ?
                    'FileError [code: ' + error.code + ']' :
                    error.message;

            _self.displayError(__('Error reading file: ', 'catenis-blocks') + errMsg);
        };

        fileReader.onabort = function (event) {
            _self.displayError(__('Reading of file has been aborted', 'catenis-blocks'));
        };

        fileReader.readAsDataURL(file);
    };

    CtnBlkStoreFile.prototype.selectedFileChanged = function () {
        // Re-enable submit button
        this.form.submitButton.disabled = false;
    };

    CtnBlkStoreFile.prototype.fileStored = function () {
        // Disable submit button
        this.form.submitButton.disabled = true;
    };

    CtnBlkStoreFile.prototype.displaySuccess = function (text) {
        if (this.txtSuccess) {
            $(this.txtSuccess).html(convertLineBreak(text));

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'block';
            }
        }
    };

    CtnBlkStoreFile.prototype.hideSuccess = function () {
        if (this.txtSuccess) {
            $(this.txtSuccess).html('');

            if (this.divMsgSuccess) {
                this.divMsgSuccess.style.display = 'none';
            }
        }
    };

    CtnBlkStoreFile.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            if (this.divMsgError) {
                this.divMsgError.style.display = 'block';
            }
        }
    };

    CtnBlkStoreFile.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            if (this.divMsgError) {
                this.divMsgError.style.display = 'none';
            }
        }
    };

    CtnBlkStoreFile.prototype.clearResultPanels = function () {
        this.hideSuccess();
        this.hideError();
    };

    CtnBlkStoreFile.prototype.updateSelectedFile = function (newFile) {
        if (!this.selectedFile || !areFilesEqual(this.selectedFile, newFile)) {
            this.selectedFile = newFile;
            this.txtSelectedFile.innerText = this.selectedFile.name;

            this.selectedFileChanged();
        }
    };

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

    context.CtnBlkStoreFile = CtnBlkStoreFile;
})(this);