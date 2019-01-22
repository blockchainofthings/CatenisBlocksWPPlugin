(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    var defNumLines = 3;
    var defTargetDevIdPlaceholder = __('Target device ID', 'catenis-blocks');
    var defTargetDevProdUniqueIdPlaceholder = __('Target device prod unique ID', 'catenis-blocks');
    var defMsgPlaceholder = __('Write your message', 'catenis-blocks');
    var defSubmitButtonLabel = __('Store Message', 'catenis-blocks');
    var defSuccessMsgTemplate = __('Message successfully stored.\nMessage Id: {!messageId}', 'catenis-blocks');

    registerBlockType('catenis-blocks/send-message', {
        title: __('Send Message', 'catenis-blocks'),
        description: __('Store a text message onto the Bitcoin blockchain addessing it to another Catenis virtual device', 'catenis-blocks'),
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
            var dynamicTargetDevice = props.attributes.dynamicTargetDevice !== undefined ? props.attributes.dynamicTargetDevice : false;
            var useProdUniqueId = props.attributes.useProdUniqueId !== undefined ? props.attributes.useProdUniqueId : false;
            var targetDeviceId = props.attributes.targetDeviceId || '';
            var numLines = parseInt(props.attributes.numLines) || defNumLines;
            var targetDevIdPlaceholder = props.attributes.targetDevIdPlaceholder ? props.attributes.targetDevIdPlaceholder : defTargetDevIdPlaceholder;
            var targetDevProdUniqueIdPlaceholder = props.attributes.targetDevProdUniqueIdPlaceholder ? props.attributes.targetDevProdUniqueIdPlaceholder : defTargetDevProdUniqueIdPlaceholder;
            var msgPlaceholder = props.attributes.msgPlaceholder !== undefined ? props.attributes.msgPlaceholder : defMsgPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var storage = props.attributes.storage || 'auto';
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

            function onChangeEncrypt(newState) {
                props.setAttributes({
                    encrypt: newState
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

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(wp.editor.InspectorControls, {},
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
                                title: __('Advanced UI Settings', 'catenis-blocks'),
                                initialOpen: false
                            },
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
                                label: __('Encrypt', 'catenis-blocks'),
                                help: encrypt ? __('Encrypt message before storing it', 'catenis-blocks') : __('Store message as it is', 'catenis-blocks'),
                                checked: encrypt,
                                onChange: onChangeEncrypt
                            }),
                            el(cmp.SelectControl, {
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
                        el('textarea', {
                            name: 'message',
                            rows: numLines,
                            placeholder: msgPlaceholder
                        }),
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
            var dynamicTargetDevice = props.attributes.dynamicTargetDevice !== undefined ? props.attributes.dynamicTargetDevice : false;
            var useProdUniqueId = props.attributes.useProdUniqueId !== undefined ? props.attributes.useProdUniqueId : false;
            var targetDeviceId = props.attributes.targetDeviceId || '';
            var numLines = parseInt(props.attributes.numLines) || defNumLines;
            var targetDevIdPlaceholder = props.attributes.targetDevIdPlaceholder ? props.attributes.targetDevIdPlaceholder : defTargetDevIdPlaceholder;
            var targetDevProdUniqueIdPlaceholder = props.attributes.targetDevProdUniqueIdPlaceholder ? props.attributes.targetDevProdUniqueIdPlaceholder : defTargetDevProdUniqueIdPlaceholder;
            var msgPlaceholder = props.attributes.msgPlaceholder !== undefined ? props.attributes.msgPlaceholder : defMsgPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var successMsgTemplate = props.attributes.successMsgTemplate !== undefined ? props.attributes.successMsgTemplate : defSuccessMsgTemplate;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var storage = props.attributes.storage || 'auto';
            var successPanelId = props.attributes.successPanelId || '';
            var errorPanelId = props.attributes.errorPanelId || '';

            return (
                el('div', {},
                    el('form', {
                        action: '',
                        onSubmit: 'try{if(!this.ctnBlkSendMessage && typeof CtnBlkSendMessage === \'function\'){this.ctnBlkSendMessage = new CtnBlkSendMessage(this,{id:' + toStringLiteral(targetDeviceId) + ',isProdUniqueId:' + toStringLiteral(useProdUniqueId) + '},{encrypt:' + toStringLiteral(encrypt) + ',storage:' + toStringLiteral(storage) + '},{successMsgTemplate:' + toStringLiteral(successMsgTemplate) + ',successPanelId:' + toStringLiteral(successPanelId) + ',errorPanelId:' + toStringLiteral(errorPanelId) + '})}this.ctnBlkSendMessage.sendMessage()}finally{return false}'
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
                        el('textarea', {
                            name: 'message',
                            rows: numLines,
                            placeholder: msgPlaceholder
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
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);