(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

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
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var successPanelId = props.attributes.successPanelId;
            var errorPanelId = props.attributes.errorPanelId;

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
                            value: __('Store File', 'catenis-blocks')
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
            var encrypt = props.attributes.encrypt !== undefined ? props.attributes.encrypt : true;
            var successPanelId = props.attributes.successPanelId || '';
            var errorPanelId = props.attributes.errorPanelId || '';

            function func () {
                try {
                    var parent = this.parentElement;
                    if (!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile === 'function') {
                        parent.ctnBlkStoreFile = new CtnBlkStoreFile(this,{encrypt: boolToString(encrypt)},successPanelId,errorPanelId);
                    }
                    parent.ctnBlkStoreFile.selectFile();
                }
                finally {
                    return false
                }
            }

            return (
                el('div', {},
                    el('form', {
                        action: '',
                        onSubmit: 'try{if(!this.ctnBlkStoreFile && typeof CtnBlkStoreFile === \'function\'){this.ctnBlkStoreFile = new CtnBlkStoreFile(this,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}this.ctnBlkStoreFile.storeFile()}finally{return false}'
                    },
                        el('div', {
                            className: 'dropzone',
                            onClick: 'try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkStoreFile.selectFile()}finally{return false}',
                            onDrop: 'try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkStoreFile.dropEventHandler(event)}finally{return false}',
                            onDragOver: 'try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkStoreFile.dragOverHandler(event)}finally{return false}',
                            onDragEnter: 'try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkStoreFile.dragEnterHandler(event)}finally{return false}',
                            onDragLeave: 'try{var parent=this.parentElement;if(!parent.ctnBlkStoreFile && typeof CtnBlkStoreFile===\'function\'){parent.ctnBlkStoreFile=new CtnBlkStoreFile(parent,{encrypt:' + boolToString(encrypt) + '},\'' + successPanelId + '\',\'' + errorPanelId + '\')}parent.ctnBlkStoreFile.dragLeaveHandler(event)}finally{return false}'
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
                            value: __('Store File', 'catenis-blocks')
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