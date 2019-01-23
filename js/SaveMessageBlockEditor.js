(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    var defSaveMessageLink = __('Save retrieved message', 'catenis-blocks');

    registerBlockType('catenis-blocks/save-message', {
        title: __('Save Message', 'catenis-blocks'),
        description: __('Save message retrieved from the Bitcoin blockchain as a file', 'catenis-blocks'),
        category: 'catenis',
        keywords: [
            'Catenis',
            'Blockchain',
            'Message'
        ],
        supports: {
            anchor: true,
            html: false     // Removes support for an HTML mode
        },
        attributes: {
            messageId: {
                type: 'string',
                source: 'attribute',
                selector: 'input[name="messageId"]',
                attribute: 'value'
            },
            saveMessageLink: {
                type: 'string',
                source: 'text',
                selector: 'a'
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
            var messageId = props.attributes.messageId;
            var saveMessageLink = props.attributes.saveMessageLink !== undefined ? props.attributes.saveMessageLink : defSaveMessageLink;

            function onChangeMessageId(newValue) {
                props.setAttributes({
                    messageId: newValue
                });
            }

            function onChangeSaveMessageLink(newValue) {
                props.setAttributes({
                    saveMessageLink: newValue
                });
            }

            function onClickReset() {
                props.setAttributes({
                    saveMessageLink: defSaveMessageLink
                });
            }

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(wp.editor.InspectorControls, {},
                        el(cmp.PanelBody, {
                                title: __('Message', 'catenis-blocks')
                            },
                            el(cmp.TextControl, {
                                label: __('Message ID', 'catenis-blocks'),
                                help: __('ID of message to be retrieved', 'catenis-blocks'),
                                value: messageId,
                                onChange: onChangeMessageId
                            })
                        ),
                        el(cmp.PanelBody, {
                                title: __('Advanced UI Settings', 'catenis-blocks'),
                                initialOpen: false
                            },
                            el(cmp.TextControl, {
                                label: __('Save Message Link', 'catenis-blocks'),
                                value: saveMessageLink,
                                onChange: onChangeSaveMessageLink
                            }),
                            el(cmp.Button, {
                                isSmall: true,
                                isDefault: true,
                                onClick: onClickReset
                            }, __('Reset Settings'))
                        )
                    ),
                    // Block controls
                    el('div', {
                            className: props.className
                        },
                        el('input', {
                            type: 'hidden',
                            name: 'messageId',
                            value: messageId
                        }),
                        el('a', {
                            href: '#',
                            onClick: function () {return false}
                        }, saveMessageLink)
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
            var messageId = props.attributes.messageId;
            var saveMessageLink = props.attributes.saveMessageLink !== undefined ? props.attributes.saveMessageLink : defSaveMessageLink;

            return (
                el('div', {},
                    el('div', {
                            className: 'uicontainer'
                        },
                        el('input', {
                            type: 'hidden',
                            name: 'messageId',
                            value: messageId,
                            onChange: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkSaveMessage && typeof CtnBlkSaveMessage===\'function\'){parent.ctnBlkSaveMessage=new CtnBlkSaveMessage(parent)}parent.ctnBlkSaveMessage.checkRetrieveMessage()}finally{return false}}).call(this)'
                        }),
                        el('a', {
                            href: '#'
                        }, saveMessageLink),
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkSaveMessage && typeof CtnBlkSaveMessage===\'function\'){uiContainer.ctnBlkSaveMessage=new CtnBlkSaveMessage(uiContainer);}uiContainer.ctnBlkSaveMessage.checkRetrieveMessage()}})()</script>')
                )
            );
        }
    });

})(this);