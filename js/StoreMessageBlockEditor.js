(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;
    var $ = context.jQuery;

    var defNumLines = 3;
    var defShowSpinner = true;
    var defSpinnerColor = 'black';
    var defMsgPlaceholder = __('Write your message', 'catenis-blocks');
    var defSubmitButtonLabel = __('Store Message', 'catenis-blocks');
    var defSuccessMsgTemplate = __('Message successfully stored.\nMessage Id: {!messageId}', 'catenis-blocks');
    var defEncrypt = true;
    var defOffChain = true;
    var defStorage = 'auto';

    var spinner;
    var spinnerTimeout;

    registerBlockType('catenis-blocks/store-message', {
        title: __('Store Message', 'catenis-blocks'),
        description: __('Store a text message onto the Bitcoin blockchain', 'catenis-blocks'),
        category: 'catenis',
        keywords: [
            'Catenis',
            'Blockchain',
            'Message'
        ],
        supports: {
            html: false     // Removes support for an HTML mode
        },
        attributes: {
            numLines: {
                type: 'string',
                source: 'attribute',
                selector: 'textarea',
                attribute: 'rows'
            },
            showSpinner: {
                type: 'boolean'
            },
            spinnerColor: {
                type: 'string'
            },
            msgPlaceholder: {
                type: 'string',
                source: 'attribute',
                selector: 'textarea',
                attribute: 'placeholder'
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
            encrypt: {
                type: 'boolean'
            },
            offChain: {
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
            var numLines = parseInt(props.attributes.numLines) || defNumLines;
            var showSpinner = props.attributes.showSpinner !== undefined ? props.attributes.showSpinner : defShowSpinner;
            var spinnerColor = props.attributes.spinnerColor !== undefined ? props.attributes.spinnerColor : defSpinnerColor;
            var msgPlaceholder = props.attributes.msgPlaceholder !== undefined ? props.attributes.msgPlaceholder : defMsgPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : defEncrypt;
            var offChain = props.attributes.offChain !== undefined ? props.attributes.offChain : defOffChain;
            var storage = props.attributes.storage || defStorage;
            var successPanelId = props.attributes.successPanelId;
            var errorPanelId = props.attributes.errorPanelId;

            function onChangeNumLines(newValue) {
                props.setAttributes({
                    numLines: newValue
                });
            }

            function onChangeShowSpinner(newState) {
                if (newState) {
                    displaySpinner();
                }

                props.setAttributes({
                    showSpinner: newState
                });
            }

            function onChangeSpinnerColor(newValue) {
                spinnerColor = newValue || defSpinnerColor;

                props.setAttributes({
                    spinnerColor: spinnerColor
                });

                displaySpinner();
            }

            function onChangeMsgPlaceholder(newValue) {
                props.setAttributes({
                    msgPlaceholder: newValue
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
                    msgPlaceholder: defMsgPlaceholder,
                    submitButtonLabel: defSubmitButtonLabel,
                    successMsgTemplate: defSuccessMsgTemplate
                });
            }

            function onChangeEncrypt(newState) {
                props.setAttributes({
                    encrypt: newState
                });
            }

            function onChangeOffChain(newState) {
                props.setAttributes({
                    offChain: newState
                });
            }

            function onChangeStorage(newValue) {
                props.setAttributes({
                    storage: newValue
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

            function displaySpinner() {
                hideSpinner();

                if (!spinner || spinner.opts.color !== spinnerColor) {
                    spinner = new context.Spin.Spinner({
                        className: 'msg-spinner',
                        color: spinnerColor
                    });
                }

                var divMessagePanel = $('div.' + props.className + ' div.messagePanel')[0];
                var divDisabledPanel = $('div.disabledPanel', divMessagePanel)[0];

                divDisabledPanel.style.display = 'block';
                spinner.spin(divMessagePanel);

                spinnerTimeout = setTimeout(function () {
                    hideSpinner();
                }, 2000);
            }

            function hideSpinner() {
                if (spinnerTimeout) {
                    clearTimeout(spinnerTimeout);
                    spinnerTimeout = undefined;
                }

                if (spinner) {
                    spinner.stop();

                    var divDisabledPanel = $('div.' + props.className + ' div.messagePanel div.disabledPanel')[0];
    
                    divDisabledPanel.style.display = 'none';
                }
            }

            var blockEditor = wp.blockEditor || wp.editor;

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(blockEditor.InspectorControls, {},
                        el(cmp.PanelBody, {
                            title: __('Message Box', 'catenis-blocks')
                        },
                            el(cmp.RangeControl, {
                                label: __('Number of Lines', 'catenis-blocks'),
                                value: numLines,
                                onChange: onChangeNumLines,
                                min: 1,
                                max: 10
                            })
                        ),
                        el(cmp.PanelBody, {
                            title: __('Display', 'catenis-blocks'),
                            initialOpen: false
                        },
                            el(cmp.ToggleControl, {
                                label: __('Show Spinner', 'catenis-blocks'),
                                help: showSpinner ? __('Show animated icon while storing message', 'catenis-blocks') : '',
                                checked: showSpinner,
                                onChange: onChangeShowSpinner
                            })
                        ),
                        el(cmp.PanelBody, {
                            title: __('Advanced UI Settings', 'catenis-blocks'),
                            initialOpen: false
                        },
                            (function (){
                                if (showSpinner) {
                                    return  el(cmp.BaseControl, {
                                            id: 'ctn-store-message-block-spinner-color',
                                            label: __('Spinner Color', 'catenis-blocks')
                                        },
                                        el(cmp.ColorPalette, {
                                            colors: [{
                                                name: 'black',
                                                color: 'black'
                                            }, {
                                                name: 'gray',
                                                color: 'gray'
                                            }, {
                                                name: 'light-gray',
                                                color: 'lightgray'
                                            }],
                                            value: spinnerColor,
                                            onChange: onChangeSpinnerColor
                                        })
                                    );
                                }
                            })(),
                            el(cmp.TextControl, {
                                label: __('Message Placeholder', 'catenis-blocks'),
                                value: msgPlaceholder,
                                onChange: onChangeMsgPlaceholder
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
                                label: __('Encrypt', 'catenis-blocks'),
                                help: encrypt ? __('Encrypt message before storing it', 'catenis-blocks') : __('Store message as it is', 'catenis-blocks'),
                                checked: encrypt,
                                onChange: onChangeEncrypt
                            }),
                            el(cmp.ToggleControl, {
                                label: __('Off-Chain', 'catenis-blocks'),
                                help: offChain ? __('Store it as a Catenis off-chain message', 'catenis-blocks') : __('Store it as a regular Catenis message', 'catenis-blocks'),
                                checked: offChain,
                                onChange: onChangeOffChain
                            }),
                            (function () {
                                if (!offChain) {
                                    return el(cmp.SelectControl, {
                                        label: __('Storage', 'catenis-blocks'),
                                        options: [{
                                            value: 'auto',
                                            label: 'Auto'
                                        }, {
                                            value: 'embedded',
                                            label: 'Embedded'
                                        }, {
                                            value: 'external',
                                            label: 'External'
                                        }],
                                        value: storage,
                                        onChange: onChangeStorage
                                    });
                                }
                            })()
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
                            className: 'messagePanel'
                        },
                            el('textarea', {
                                name: 'message',
                                rows: numLines,
                                placeholder: msgPlaceholder
                            }),
                            el('div', {
                                className: 'disabledPanel'
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
            var numLines = parseInt(props.attributes.numLines) || defNumLines;
            var showSpinner = props.attributes.showSpinner !== undefined ? props.attributes.showSpinner : defShowSpinner;
            var spinnerColor = props.attributes.spinnerColor !== undefined ? props.attributes.spinnerColor : defSpinnerColor;
            var msgPlaceholder = props.attributes.msgPlaceholder !== undefined ? props.attributes.msgPlaceholder : defMsgPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : defEncrypt;
            var offChain = props.attributes.offChain !== undefined ? props.attributes.offChain : defOffChain;
            var storage = props.attributes.storage || defStorage;
            var successPanelId = props.attributes.successPanelId || '';
            var errorPanelId = props.attributes.errorPanelId || '';

            return (
                el('div', {},
                    el('div', {
                        className: 'uicontainer'
                    },
                        el('form', {
                            action: '',
                            onSubmit: 'try{this.parentElement.ctnBlkStoreMessage.storeMessage()}finally{return false}'
                        },
                            el('div', {
                                className: 'messagePanel'
                            },
                                el('textarea', {
                                    name: 'message',
                                    rows: numLines,
                                    placeholder: msgPlaceholder
                                }),
                                el('div', {
                                    className: 'disabledPanel'
                                })
                            ),
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
                    }, __('Catenis API client not loaded on page', 'catenis-blocks')),
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkStoreMessage && typeof CtnBlkStoreMessage === \'function\'){uiContainer.ctnBlkStoreMessage = new CtnBlkStoreMessage(uiContainer,{encrypt:' + toStringLiteral(encrypt) + ',offChain:' + toStringLiteral(offChain) + ',storage:' + toStringLiteral(storage) + '},{showSpinner:' + toStringLiteral(showSpinner) + ',spinnerColor:' + toStringLiteral(spinnerColor) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}}})()</script>')
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
                '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);