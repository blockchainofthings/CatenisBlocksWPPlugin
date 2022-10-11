(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;
    var $ = context.jQuery;

    var defDynamicTargetDevice = false;
    var defUseProdUniqueId = false;
    var defNumLines = 3;
    var defShowSpinner = true;
    var defSpinnerColor = 'black';
    var defTargetDevIdPlaceholder = __('Target device ID', 'catenis-blocks');
    var defTargetDevProdUniqueIdPlaceholder = __('Target device prod unique ID', 'catenis-blocks');
    var defMsgPlaceholder = __('Write your message', 'catenis-blocks');
    var defSubmitButtonLabel = __('Send Message', 'catenis-blocks');
    var defSuccessMsgTemplate = __('Message successfully sent.\nMessage Id: {!messageId}', 'catenis-blocks');
    var defReadConfirmation = false;
    var defEncrypt = true;
    var defOffChain = true;
    var defStorage = 'auto';

    var spinner;
    var spinnerTimeout;

    registerBlockType('catenis-blocks/send-message', {
        title: __('Send Message', 'catenis-blocks'),
        description: __('Store a text message onto the Bitcoin blockchain addressing it to another Catenis virtual device', 'catenis-blocks'),
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
            dynamicTargetDevice: {
                type: 'boolean'
            },
            useProdUniqueId: {
                type: 'boolean'
            },
            targetDeviceId: {
                type: 'string'
            },
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
            targetDevIdPlaceholder: {
                type: 'string'
            },
            targetDevProdUniqueIdPlaceholder: {
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
            readConfirmation: {
                type: 'boolean'
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
            var dynamicTargetDevice = props.attributes.dynamicTargetDevice !== undefined ? props.attributes.dynamicTargetDevice : defDynamicTargetDevice;
            var useProdUniqueId = props.attributes.useProdUniqueId !== undefined ? props.attributes.useProdUniqueId : defUseProdUniqueId;
            var targetDeviceId = props.attributes.targetDeviceId || '';
            var numLines = parseInt(props.attributes.numLines) || defNumLines;
            var showSpinner = props.attributes.showSpinner !== undefined ? props.attributes.showSpinner : defShowSpinner;
            var spinnerColor = props.attributes.spinnerColor !== undefined ? props.attributes.spinnerColor : defSpinnerColor;
            var targetDevIdPlaceholder = props.attributes.targetDevIdPlaceholder ? props.attributes.targetDevIdPlaceholder : defTargetDevIdPlaceholder;
            var targetDevProdUniqueIdPlaceholder = props.attributes.targetDevProdUniqueIdPlaceholder ? props.attributes.targetDevProdUniqueIdPlaceholder : defTargetDevProdUniqueIdPlaceholder;
            var msgPlaceholder = props.attributes.msgPlaceholder !== undefined ? props.attributes.msgPlaceholder : defMsgPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var readConfirmation = props.attributes.readConfirmation !== undefined ? props.attributes.readConfirmation : defReadConfirmation;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : defEncrypt;
            var offChain = props.attributes.offChain !== undefined ? props.attributes.offChain : defOffChain;
            var storage = props.attributes.storage || defStorage;
            var successPanelId = props.attributes.successPanelId;
            var errorPanelId = props.attributes.errorPanelId;

            function onChangeDynamicTargetDevice(newState) {
                props.setAttributes({
                    dynamicTargetDevice: newState
                });
            }

            function onChangeUseProdUniqueId(newState) {
                props.setAttributes({
                    useProdUniqueId: newState
                });
            }

            function onChangeTargetDeviceId(newValue) {
                props.setAttributes({
                    targetDeviceId: newValue.trim()
                });
            }

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

            function onChangeTargetDevIdPlaceholder(newValue) {
                props.setAttributes({
                    targetDevIdPlaceholder: newValue
                });
            }

            function onChangeTargetDevProdUniqueIdPlaceholder(newValue) {
                props.setAttributes({
                    targetDevProdUniqueIdPlaceholder: newValue
                });
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
                    targetDevIdPlaceholder: defTargetDevIdPlaceholder,
                    targetDevProdUniqueIdPlaceholder: defTargetDevProdUniqueIdPlaceholder,
                    msgPlaceholder: defMsgPlaceholder,
                    submitButtonLabel: defSubmitButtonLabel,
                    successMsgTemplate: defSuccessMsgTemplate
                });
            }

            function onChangeReadConfirmation(newState) {
                props.setAttributes({
                    readConfirmation: newState
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
                            title: __('Target Device', 'catenis-blocks')
                        },
                            el(cmp.ToggleControl, {
                                label: __('Dynamic Target Device', 'catenis-blocks'),
                                help: dynamicTargetDevice ? __('Select a different target device for each message', 'catenis-blocks') : __('Use a single predefined target device', 'catenis-blocks'),
                                checked: dynamicTargetDevice,
                                onChange: onChangeDynamicTargetDevice
                            }),
                            el(cmp.ToggleControl, {
                                label: __('Use Product Unique ID', 'catenis-blocks'),
                                help: useProdUniqueId ? __('Enter product unique ID for target device', 'catenis-blocks') : __('Enter Catenis device ID for target device', 'catenis-blocks'),
                                checked: useProdUniqueId,
                                onChange: onChangeUseProdUniqueId
                            }),
                            (function () {
                                if (!dynamicTargetDevice) {
                                    return (
                                        el(cmp.TextControl, {
                                            label: useProdUniqueId ? __('Target Device Product Unique ID', 'catenis-blocks') : __('Target Device ID', 'catenis-blocks'),
                                            help: __('ID of Catenis virtual device to which the message is sent', 'catenis-blocks'),
                                            value: targetDeviceId,
                                            onChange: onChangeTargetDeviceId
                                        })
                                    );
                                }
                            })()
                        ),
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
                                help: showSpinner ? __('Show animated icon while sending message', 'catenis-blocks') : '',
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
                                            id: 'ctn-send-message-block-spinner-color',
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
                                label: __('Target Device ID Placeholder', 'catenis-blocks'),
                                value: targetDevIdPlaceholder,
                                onChange: onChangeTargetDevIdPlaceholder
                            }),
                            el(cmp.TextControl, {
                                label: __('Target Device Prod Unique ID Placeholder', 'catenis-blocks'),
                                value: targetDevProdUniqueIdPlaceholder,
                                onChange: onChangeTargetDevProdUniqueIdPlaceholder
                            }),
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
                                label: __('Read Confirmation', 'catenis-blocks'),
                                help: readConfirmation ? __('Send message with read confirmation', 'catenis-blocks') : __('No read confirmation requested', 'catenis-blocks'),
                                checked: readConfirmation,
                                onChange: onChangeReadConfirmation
                            }),
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
                        (function () {
                            if (dynamicTargetDevice) {
                                return (
                                    el('input', {
                                        type: 'text',
                                        name: 'deviceId',
                                        placeholder: useProdUniqueId ? targetDevProdUniqueIdPlaceholder : targetDevIdPlaceholder
                                    })
                                );
                            }
                        })(),
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
            var dynamicTargetDevice = props.attributes.dynamicTargetDevice !== undefined ? props.attributes.dynamicTargetDevice : defDynamicTargetDevice;
            var useProdUniqueId = props.attributes.useProdUniqueId !== undefined ? props.attributes.useProdUniqueId : defUseProdUniqueId;
            var targetDeviceId = props.attributes.targetDeviceId || '';
            var numLines = parseInt(props.attributes.numLines) || defNumLines;
            var showSpinner = props.attributes.showSpinner !== undefined ? props.attributes.showSpinner : defShowSpinner;
            var spinnerColor = props.attributes.spinnerColor !== undefined ? props.attributes.spinnerColor : defSpinnerColor;
            var targetDevIdPlaceholder = props.attributes.targetDevIdPlaceholder ? props.attributes.targetDevIdPlaceholder : defTargetDevIdPlaceholder;
            var targetDevProdUniqueIdPlaceholder = props.attributes.targetDevProdUniqueIdPlaceholder ? props.attributes.targetDevProdUniqueIdPlaceholder : defTargetDevProdUniqueIdPlaceholder;
            var msgPlaceholder = props.attributes.msgPlaceholder !== undefined ? props.attributes.msgPlaceholder : defMsgPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var readConfirmation = props.attributes.readConfirmation !== undefined ? props.attributes.readConfirmation : defReadConfirmation;
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
                            onSubmit: 'try{this.parentElement.ctnBlkSendMessage.sendMessage()}finally{return false}'
                        },
                            (function () {
                                if (dynamicTargetDevice) {
                                    var attr = {
                                        type: 'text',
                                        name: 'deviceId',
                                        maxlength: useProdUniqueId ? '40' : '20',
                                        placeholder: useProdUniqueId ? targetDevProdUniqueIdPlaceholder : targetDevIdPlaceholder
                                    };

                                    if (useProdUniqueId) {
                                        attr.className = 'prodUniqueId';
                                    }

                                    return (
                                        el('input', attr)
                                    );
                                }
                            })(),
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkSendMessage && typeof CtnBlkSendMessage === \'function\'){uiContainer.ctnBlkSendMessage = new CtnBlkSendMessage(uiContainer,{id:' + toStringLiteral(targetDeviceId) + ',isProdUniqueId:' + toStringLiteral(useProdUniqueId) + '},{readConfirmation:' + toStringLiteral(readConfirmation) + ',encrypt:' + toStringLiteral(encrypt) + ',offChain:' + toStringLiteral(offChain) + ',storage:' + toStringLiteral(storage) + '},{showSpinner:' + toStringLiteral(showSpinner) + ',spinnerColor:' + toStringLiteral(spinnerColor) + ',successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}}})()</script>')
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);