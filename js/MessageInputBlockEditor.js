(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    var defMsgIdPlaceholder = __('Message ID', 'catenis-blocks');
    var defSubmitButtonLabel = __('Submit', 'catenis-blocks');

    registerBlockType('catenis-blocks/message-input', {
        title: __('Message Input', 'catenis-blocks'),
        description: __('Enter ID of message for display/saving', 'catenis-blocks'),
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
            msgIdPlaceholder: {
                type: 'string',
                source: 'attribute',
                selector: 'input[name="messageId"]',
                attribute: 'placeholder'
            },
            submitButtonLabel: {
                type: 'string',
                source: 'attribute',
                selector: 'input[type="submit"]',
                attribute: 'value'
            },
            targetHtmlAnchor: {
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
            var msgIdPlaceholder = props.attributes.msgIdPlaceholder !== undefined ? props.attributes.msgIdPlaceholder : defMsgIdPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var targetHtmlAnchor = props.attributes.targetHtmlAnchor;

            function onChangeMsgIdPlaceholder(newValue) {
                props.setAttributes({
                    msgIdPlaceholder: newValue
                });
            }

            function onChangeSubmitButtonLabel(newValue) {
                props.setAttributes({
                    submitButtonLabel: newValue
                });
            }

            function onChangeTargetHtmlAnchor(newValue){
                props.setAttributes({
                    targetHtmlAnchor: newValue
                });
            }

            function onClickReset() {
                props.setAttributes({
                    msgIdPlaceholder: defMsgIdPlaceholder,
                    submitButtonLabel: defSubmitButtonLabel
                });
            }

            var blockEditor = wp.blockEditor || wp.editor;

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(blockEditor.InspectorControls, {},
                        el(cmp.PanelBody, {
                                title: __('Target', 'catenis-blocks')
                            },
                            el(cmp.TextControl, {
                                label: __('HTML Anchor', 'catenis-blocks'),
                                help: __('Reference to block used to display/save the message contents', 'catenis-blocks'),
                                value: targetHtmlAnchor,
                                onChange: onChangeTargetHtmlAnchor
                            })
                        ),
                        el(cmp.PanelBody, {
                                title: __('Advanced UI Settings', 'catenis-blocks'),
                                initialOpen: false
                            },
                            el(cmp.TextControl, {
                                label: __('Message ID Placeholder', 'catenis-blocks'),
                                value: msgIdPlaceholder,
                                onChange: onChangeMsgIdPlaceholder
                            }),
                            el(cmp.TextControl, {
                                label: __('Button Label', 'catenis-blocks'),
                                value: submitButtonLabel,
                                onChange: onChangeSubmitButtonLabel
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
                            type: 'text',
                            name: 'messageId',
                            placeholder: msgIdPlaceholder
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
            var msgIdPlaceholder = props.attributes.msgIdPlaceholder !== undefined ? props.attributes.msgIdPlaceholder : defMsgIdPlaceholder;
            var submitButtonLabel = props.attributes.submitButtonLabel !== undefined ? props.attributes.submitButtonLabel : defSubmitButtonLabel;
            var targetHtmlAnchor = props.attributes.targetHtmlAnchor;

            return (
                el('div', {},
                    el('form', {
                        action: '',
                        onSubmit: 'try{jQuery(\'#' + targetHtmlAnchor + ' input[name=&quot;messageId&quot;]\').val(this.messageId.value).trigger(\'change\')}finally{return false}'
                    },
                        el('input', {
                            type: 'text',
                            name: 'messageId',
                            maxlength: '20',
                            placeholder: msgIdPlaceholder
                        }),
                        el('input', {
                            type: 'submit',
                            value: submitButtonLabel
                        })
                    )
                )
            );
        }
    });
})(this);