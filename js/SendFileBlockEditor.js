(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    registerBlockType('catenis-blocks/send-file', {
        title: __('Send File', 'catenis-blocks'),
        description: __('Store a file onto the Bitcoin blockchain addessing it to another Catenis virtual device', 'catenis-blocks'),
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
            dynamicTargetDevice: {
                type: 'boolean'
            },
            useProdUniqueId: {
                type: 'boolean'
            },
            targetDeviceId: {
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
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
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
                                title: __('Store Options', 'catenis-blocks'),
                                initialOpen: false
                            },
                            el(cmp.ToggleControl, {
                                label: __('Encrypt', 'catenis-blocks'),
                                help: encrypt ? __('Encrypt file contents before storing it', 'catenis-blocks') : __('Store file as it is', 'catenis-blocks'),
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
                        (function () {
                            if (dynamicTargetDevice) {
                                return (
                                    el('input', {
                                        type: 'text',
                                        name: 'deviceId',
                                        placeholder: useProdUniqueId ? __('Target device prod unique ID', 'catenis-blocks') : __('Target device ID', 'catenis-blocks')
                                    })
                                );
                            }
                        })(),
                        el('div', {
                                className: 'dropzone'
                            },
                            el('div', {
                                    className: 'dropcontainer'
                                },
                                el('p', {
                                    className: 'instruction'
                                }, __('Drop a file or click to select', 'catenis-blocks')),
                                el('p', {
                                    className: 'selected'
                                })
                            )
                        ),
                        el('input', {
                            type: 'submit',
                            value: __('Send File', 'catenis-blocks')
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
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var successPanelId = props.attributes.successPanelId || '';
            var errorPanelId = props.attributes.errorPanelId || '';

            function func () {
                try {
                    var parent = this.parentElement;
                    if (!parent.ctnBlkSendFile && typeof CtnBlkSendFile === 'function') {
                        parent.ctnBlkSendFile = new CtnBlkSendFile(this,{encrypt: boolToString(encrypt)},successPanelId,errorPanelId);
                    }
                    parent.ctnBlkSendFile.selectFile();
                }
                finally {
                    return false
                }
            }

            return (
                el('div', {},
                    el('form', {
                            action: '',
                            onSubmit: 'try{if(!this.ctnBlkSendFile && typeof CtnBlkSendFile === \'function\'){this.ctnBlkSendFile = new CtnBlkSendFile(this,{id:\'' + targetDeviceId + '\',isProdUniqueId:' + boolToString(useProdUniqueId) + '},{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}this.ctnBlkSendFile.sendFile()}finally{return false}'
                        },
                        (function () {
                            if (dynamicTargetDevice) {
                                var attr = {
                                    type: 'text',
                                    name: 'deviceId',
                                    maxlength: useProdUniqueId ? '40' : '20',
                                    placeholder: useProdUniqueId ? __('Target device prod unique ID', 'catenis-blocks') : __('Target device ID', 'catenis-blocks')
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
                                className: 'dropzone',
                                onClick: 'try{var parent=this.parentElement;if(!parent.ctnBlkSendFile && typeof CtnBlkSendFile===\'function\'){parent.ctnBlkSendFile=new CtnBlkSendFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkSendFile.selectFile()}finally{return false}',
                                onDrop: 'try{var parent=this.parentElement;if(!parent.ctnBlkSendFile && typeof CtnBlkSendFile===\'function\'){parent.ctnBlkSendFile=new CtnBlkSendFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkSendFile.dropEventHandler(event)}finally{return false}',
                                onDragOver: 'try{var parent=this.parentElement;if(!parent.ctnBlkSendFile && typeof CtnBlkSendFile===\'function\'){parent.ctnBlkSendFile=new CtnBlkSendFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkSendFile.dragOverHandler(event)}finally{return false}',
                                onDragEnter: 'try{var parent=this.parentElement;if(!parent.ctnBlkSendFile && typeof CtnBlkSendFile===\'function\'){parent.ctnBlkSendFile=new CtnBlkSendFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkSendFile.dragEnterHandler(event)}finally{return false}',
                                onDragLeave: 'try{var parent=this.parentElement;if(!parent.ctnBlkSendFile && typeof CtnBlkSendFile===\'function\'){parent.ctnBlkSendFile=new CtnBlkSendFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkSendFile.dragLeaveHandler(event)}finally{return false}'
                            },
                            el('div', {
                                    className: 'dropcontainer'
                                },
                                el('p', {
                                    className: 'instruction'
                                }, __('Drop a file or click to select', 'catenis-blocks')),
                                el('p', {
                                    className: 'selected'
                                })
                            )
                        ),
                        el('input', {
                            type: 'file'
                        }),
                        el('input', {
                            type: 'submit',
                            name: 'submitButton',
                            value: __('Send File', 'catenis-blocks')
                        })
                    ),
                    el('div', {
                            className: 'ctnBlkDivMsgSuccess'
                        },
                        el('p', {
                            className: 'ctnBlkTxtSuccess'
                        })
                    ),
                    el('div', {
                            className: 'ctnBlkDivMsgError'
                        },
                        el('p', {
                            className: 'ctnBlkTxtError'
                        })
                    )
                )
            );
        }
    });

    function boolToString(value) {
        return value ? 'true' : 'false';
    }
})(this);