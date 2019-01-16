(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

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
            var numLines = parseInt(props.attributes.numLines) || 5;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var storage = props.attributes.storage || 'auto';
            var successPanelId = props.attributes.successPanelId;
            var errorPanelId = props.attributes.errorPanelId;

            function onChangeNumLines(newNumLines) {
                props.setAttributes({
                    numLines: newNumLines
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
                    successPanelId: newId
                });
            }

            function onChangeErrorPanelId(newId) {
                props.setAttributes({
                    errorPanelId: newId
                });
            }

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(wp.editor.InspectorControls, {},
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
                        el('textarea', {
                            name: 'message',
                            rows: numLines,
                            placeholder: __('Write your message', 'catenis-blocks')
                        }),
                        el('input', {
                            type: 'submit',
                            value: __('Store Message', 'catenis-blocks')
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
            var numLines = parseInt(props.attributes.numLines) || 5;
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var storage = props.attributes.storage || 'auto';
            var successPanelId = props.attributes.successPanelId || '';
            var errorPanelId = props.attributes.errorPanelId || '';

            return (
                el('div', {},
                    el('form', {
                        action: '',
                        onSubmit: 'try{if(!this.ctnBlkStoreMessage && typeof CtnBlkStoreMessage === \'function\'){this.ctnBlkStoreMessage = new CtnBlkStoreMessage(this,{encrypt:' + boolToString(encrypt) + ',storage:\'' + storage + '\'},\'' + successPanelId + '\',\'' + errorPanelId + '\')}this.ctnBlkStoreMessage.storeMessage()}finally{return false}'
                    },
                        el('textarea', {
                            name: 'message',
                            rows: numLines,
                            placeholder: __('Write your message', 'catenis-blocks')
                        }),
                        el('input', {
                            type: 'submit',
                            name: 'submitButton',
                            value: __('Store Message', 'catenis-blocks')
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