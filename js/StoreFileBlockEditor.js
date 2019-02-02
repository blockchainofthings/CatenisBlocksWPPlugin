(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    var defFileDropBoxMessage = __('Drop a file or click to select', 'catenis-blocks');
    var defSubmitButtonLabel = __('Store File', 'catenis-blocks');
    var defSuccessMsgTemplate = __('File successfully stored.\nMessage Id: {!messageId}', 'catenis-blocks');
    var defAddFileHeader = true;
    var defEncrypt = true;

    registerBlockType('catenis-blocks/store-file', {
        title: __('Store File', 'catenis-blocks'),
        description: __('Store a file onto the Bitcoin blockchain', 'catenis-blocks'),
        category: 'catenis',
        keywords: [
            'Catenis',
            'Blockchain',
            'File'
        ],
        supports: {
            html: false     // Removes support for an HTML mode
        },
        attributes: {
            fileDropBoxMessage: {
                type: 'string',
                source: 'text',
                selector: 'p.instruction'
            },
            submitButtonLabel: {
                type: 'string',
                source: 'attribute',
                selector: 'input[type="submit"]',
                attribute: 'value'
            },
            successMsgTemplate: {
                type: 'string'
            },
            addFileHeader: {
                type: 'boolean'
            },
            encrypt: {
                type: 'boolean'
            },
            storage: {
                type: 'string'
            },
            successPanelId: {
                type: 'string'
            },
            errorPanelId: {
                type: 'string'
            }
        },
        /**
         * The edit function describes the structure of your block in the context of the editor.
         * This represents what the editor will render when the block is used.
         * @see https://wordpress.org/gutenberg/handbook/block-edit-save/#edit
         *
         * @param {Object} [props] Properties passed from the editor.
         * @return {Element}       Element to render.
         */
        edit: function(props) {
            var fileDropBoxMessage = props.attributes.fileDropBoxMessage !== undefined ? props.attributes.fileDropBoxMessage : defFileDropBoxMessage;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var addFileHeader = props.attributes.addFileHeader !== undefined ? props.attributes.addFileHeader : defAddFileHeader;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : defEncrypt;
            var successPanelId = props.attributes.successPanelId;
            var errorPanelId = props.attributes.errorPanelId;

            function onChangeFileDropBoxMessage(newValue) {
                props.setAttributes({
                    fileDropBoxMessage: newValue
                });
            }

            function onChangeSubmitButtonLabel(newValue) {
                props.setAttributes({
                    submitButtonLabel: newValue
                });
            }

            function onChangeSuccessMsgTemplate(newValue){
                props.setAttributes({
                    successMsgTemplate: newValue
                });
            }

            function onClickReset() {
                props.setAttributes({
                    fileDropBoxMessage: defFileDropBoxMessage,
                    submitButtonLabel: defSubmitButtonLabel,
                    successMsgTemplate: defSuccessMsgTemplate
                });
            }

            function onChangeAddFileHeader(newState) {
                props.setAttributes({
                    addFileHeader: newState
                });
            }

            function onChangeEncrypt(newState) {
                props.setAttributes({
                    encrypt: newState
                });
            }

            function onChangeSuccessPanelId(newId) {
                props.setAttributes({
                    successPanelId: newId.trim()
                });
            }

            function onChangeErrorPanelId(newId) {
                props.setAttributes({
                    errorPanelId: newId.trim()
                });
            }

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(wp.editor.InspectorControls, {},
                        el(cmp.PanelBody, {
                                title: __('Advanced UI Settings', 'catenis-blocks'),
                                initialOpen: false
                            },
                            el(cmp.TextControl, {
                                label: __('File Drop Box Message', 'catenis-blocks'),
                                value: fileDropBoxMessage,
                                onChange: onChangeFileDropBoxMessage
                            }),
                            el(cmp.TextControl, {
                                label: __('Button Label', 'catenis-blocks'),
                                value: submitButtonLabel,
                                onChange: onChangeSubmitButtonLabel
                            }),
                            el(cmp.TextareaControl, {
                                label: __('Success Message Template', 'catenis-blocks'),
                                help: __('Use the term {!messageId} as a placeholder for the returned message ID', 'catenis-blocks'),
                                value: successMsgTemplate,
                                onChange: onChangeSuccessMsgTemplate
                            }),
                            el(cmp.Button, {
                                isSmall: true,
                                isDefault: true,
                                onClick: onClickReset
                            }, __('Reset Settings'))
                        ),
                        el(cmp.PanelBody, {
                            title: __('Store Options', 'catenis-blocks'),
                            initialOpen: false
                        },
                            el(cmp.ToggleControl, {
                                label: __('File Header', 'catenis-blocks'),
                                help: addFileHeader ? __('Add header describing file properties', 'catenis-blocks') : __('Only the original file contents are stored', 'catenis-blocks'),
                                checked: addFileHeader,
                                onChange: onChangeAddFileHeader
                            }),
                            el(cmp.ToggleControl, {
                                label: __('Encrypt', 'catenis-blocks'),
                                help: encrypt ? __('Encrypt file contents before storing them', 'catenis-blocks') : __('Store file contents as they are', 'catenis-blocks'),
                                checked: encrypt,
                                onChange: onChangeEncrypt
                            })
                        ),
                        el(cmp.PanelBody, {
                            title: __('Result', 'catenis-blocks'),
                            initialOpen: false
                        },
                            el(cmp.TextControl, {
                                label: __('Success Panel ID', 'catenis-blocks'),
                                help: __('Enter ID of an HTML element on the page', 'catenis-blocks'),
                                value: successPanelId,
                                onChange: onChangeSuccessPanelId
                            }),
                            el(cmp.TextControl, {
                                label: __('Error Panel ID', 'catenis-blocks'),
                                help: __('Enter ID of an HTML element on the page', 'catenis-blocks'),
                                value: errorPanelId,
                                onChange: onChangeErrorPanelId
                            })
                        )
                    ),
                    // Block controls
                    el('div', {
                        className: props.className
                    },
                        el('div', {
                            className: 'dropzone'
                        },
                            el('p', {
                                className: 'instruction'
                            }, fileDropBoxMessage),
                            el('p', {
                                className: 'selected'
                            })
                        ),
                        el('input', {
                            type: 'submit',
                            value: submitButtonLabel
                        })
                    )
                )
            );
        },
        /**
         * The save function defines the way in which the different attributes should be combined
         * into the final markup, which is then serialized by Gutenberg into `post_content`.
         * @see https://wordpress.org/gutenberg/handbook/block-edit-save/#save
         *
         * @param {Object} [props] Properties passed from the editor.
         * @return {Element}       Element to render.
         */
        save: function(props) {
            var fileDropBoxMessage = props.attributes.fileDropBoxMessage !== undefined ? props.attributes.fileDropBoxMessage : defFileDropBoxMessage;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var addFileHeader = props.attributes.addFileHeader !== undefined ? props.attributes.addFileHeader : defAddFileHeader;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : defEncrypt;
            var successPanelId = props.attributes.successPanelId || '';
            var errorPanelId = props.attributes.errorPanelId || '';

            return (
                el('div', {},
                    el('div', {
                        className: 'uicontainer'
                    },
                        el('form', {
                            action: '',
                            onSubmit: 'try{if(!this.ctnBlkStoreFile && typeof CtnBlkStoreFile === \'function\'){this.ctnBlkStoreFile = new CtnBlkStoreFile(this,{encrypt:' + toStringLiteral(encrypt) + '},{addFileHeader:' + toStringLiteral(addFileHeader) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}this.ctnBlkStoreFile.storeFile()}finally{return false}'
                        },
                            el('div', {
                                className: 'dropzone',
                                onClick: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + toStringLiteral(encrypt) + '},{addFileHeader:' + toStringLiteral(addFileHeader) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}parent.ctnBlkStoreFile.selectFile()}finally{return false}}).call(this)',
                                onDrop: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + toStringLiteral(encrypt) + '},{addFileHeader:' + toStringLiteral(addFileHeader) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}parent.ctnBlkStoreFile.dropEventHandler(event)}finally{return false}}).call(this)',
                                onDragOver: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + toStringLiteral(encrypt) + '},{addFileHeader:' + toStringLiteral(addFileHeader) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}parent.ctnBlkStoreFile.dragOverHandler(event)}finally{return false}}).call(this)',
                                onDragEnter: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + toStringLiteral(encrypt) + '},{addFileHeader:' + toStringLiteral(addFileHeader) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}parent.ctnBlkStoreFile.dragEnterHandler(event)}finally{return false}}).call(this)',
                                onDragLeave: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + toStringLiteral(encrypt) + '},{addFileHeader:' + toStringLiteral(addFileHeader) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}parent.ctnBlkStoreFile.dragLeaveHandler(event)}finally{return false}}).call(this)'
                            },
                                el('p', {
                                    className: 'instruction'
                                }, fileDropBoxMessage),
                                el('p', {
                                    className: 'selected'
                                })
                            ),
                            el('input', {
                                type: 'file'
                            }),
                            el('input', {
                                type: 'submit',
                                name: 'submitButton',
                                value: submitButtonLabel
                            })
                        ),
                        el('div', {
                            className: 'success'
                        },
                            el('p', {
                                className: 'success'
                            })
                        ),
                        el('div', {
                            className: 'error'
                        },
                            el('p', {
                                className: 'error'
                            })
                        )
                    ),
                    el('div', {
                        className: 'noctnapiproxy'
                    }, __('Catenis API client not loaded on page', 'catenis-blocks'))
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);