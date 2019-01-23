(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    registerBlockType('catenis-blocks/display-message', {
        title: __('Display Message', 'catenis-blocks'),
        description: __('Display a text message retrieved from the Bitcoin blockchain', 'catenis-blocks'),
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

            function onChangeMessageId(newValue) {
                props.setAttributes({
                    messageId: newValue
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
                        el('pre', {}, __('Sample retrieved message', 'catenis-blocks'))
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

            return (
                el('div', {},
                    el('div', {
                        className: 'uicontainer'
                    },
                        el('input', {
                            type: 'hidden',
                            name: 'messageId',
                            value: messageId,
                            onChange: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkDisplayMessage && typeof CtnBlkDisplayMessage===\'function\'){parent.ctnBlkDisplayMessage=new CtnBlkDisplayMessage(parent)}parent.ctnBlkDisplayMessage.checkRetrieveMessage()}finally{return false}}).call(this)'
                        }),
                        el('pre', {}),
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkDisplayMessage && typeof CtnBlkDisplayMessage===\'function\'){uiContainer.ctnBlkDisplayMessage=new CtnBlkDisplayMessage(uiContainer);}uiContainer.ctnBlkDisplayMessage.checkRetrieveMessage()}})()</script>')
                )
            );
        }
    });

})(this);