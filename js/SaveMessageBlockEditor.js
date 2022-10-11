(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;
    var $ = context.jQuery;

    var defShowSpinner = true;
    var defAutoSave = false;
    var defSaveMessageLink = __('Save retrieved message', 'catenis-blocks');
    var defSpinnerColor = 'black';

    var spinner;
    var spinnerTimeout;

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
            showSpinner: {
                type: 'boolean'
            },
            autoSave: {
                type: 'boolean'
            },
            saveMessageLink: {
                type: 'string',
                source: 'text',
                selector: 'a'
            },
            spinnerColor: {
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
            var messageId = props.attributes.messageId;
            var showSpinner = props.attributes.showSpinner !== undefined ? props.attributes.showSpinner : defShowSpinner;
            var autoSave = props.attributes.autoSave !== undefined ? props.attributes.autoSave : defAutoSave;
            var saveMessageLink = props.attributes.saveMessageLink !== undefined ? props.attributes.saveMessageLink : defSaveMessageLink;
            var spinnerColor = props.attributes.spinnerColor !== undefined ? props.attributes.spinnerColor : defSpinnerColor;

            function onChangeMessageId(newValue) {
                props.setAttributes({
                    messageId: newValue
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

            function onChangeAutoSave(newState) {
                props.setAttributes({
                    autoSave: newState
                });
            }

            function onChangeSaveMessageLink(newValue) {
                props.setAttributes({
                    saveMessageLink: newValue
                });
            }

            function onClickReset() {
                var attrToSet = {
                    saveMessageLink: defSaveMessageLink
                };

                if (showSpinner) {
                    attrToSet.spinnerColor = defSpinnerColor;
                }

                props.setAttributes(attrToSet);
            }

            function onChangeSpinnerColor(newValue) {
                spinnerColor = newValue || defSpinnerColor;

                props.setAttributes({
                    spinnerColor: spinnerColor
                });

                displaySpinner();
            }

            function displaySpinner() {
                hideSpinner();

                if (!spinner || spinner.opts.color !== spinnerColor) {
                    spinner = new context.Spin.Spinner({
                        className: 'msg-spinner',
                        color: spinnerColor
                    });
                }

                var uiContainer = $('div.' + props.className + ' div.uicontainer')[0];

                $('.ctn-save-msg-text', uiContainer).addClass('ctn-spinner');
                spinner.spin(uiContainer);

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

                    $('.ctn-save-msg-text', $('div.' + props.className + ' div.uicontainer')[0]).removeClass('ctn-spinner');
                }
            }

            var blockEditor = wp.blockEditor || wp.editor;

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(blockEditor.InspectorControls, {},
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
                            title: __('Display', 'catenis-blocks'),
                            initialOpen: false
                        },
                            el(cmp.ToggleControl, {
                                label: __('Show Spinner', 'catenis-blocks'),
                                help: showSpinner ? __('Show animated icon while loading message', 'catenis-blocks') : '',
                                checked: showSpinner,
                                onChange: onChangeShowSpinner
                            })
                        ),
                        el(cmp.PanelBody, {
                            title: __('Action', 'catenis-blocks'),
                            initialOpen: false
                        },
                            el(cmp.ToggleControl, {
                                label: __('Auto Save', 'catenis-blocks'),
                                help: autoSave ? __('Automatically save message after it is retrieved', 'catenis-blocks') : __('Show link to save retrieved message', 'catenis-blocks'),
                                checked: autoSave,
                                onChange: onChangeAutoSave
                            })
                        ),
                        (function () {
                            if (!autoSave || showSpinner) {
                                var compsToShow = [];

                                if (!autoSave) {
                                    compsToShow.push(
                                        el(cmp.TextControl, {
                                            key: 'save-msg-link',
                                            label: __('Save Message Link', 'catenis-blocks'),
                                            value: saveMessageLink,
                                            onChange: onChangeSaveMessageLink
                                        })
                                    );
                                }

                                if (showSpinner) {
                                    compsToShow.push(
                                        el(cmp.BaseControl, {
                                            key: 'spinner-color',
                                            id: 'ctn-save-msg-block-spinner-color',
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
                                        )
                                    );
                                }

                                if (!autoSave) {
                                    compsToShow.push(
                                        el(cmp.Button, {
                                            key: 'reset-button',
                                            isSmall: true,
                                            isDefault: true,
                                            onClick: onClickReset
                                        }, __('Reset Settings'))
                                    );
                                }

                                return el(cmp.PanelBody, {
                                    title: __('Advanced UI Settings', 'catenis-blocks'),
                                    initialOpen: false
                                }, compsToShow);
                            }
                        })()
                    ),
                    // Block controls
                    el('div', {
                        className: props.className
                    },
                        el('div', {
                            className: 'uicontainer ctn-spinner'
                        },
                            el('input', {
                                type: 'hidden',
                                name: 'messageId',
                                value: messageId
                            }),
                            (function () {
                                if (autoSave) {
                                    return el('span', {
                                        className: 'ctn-save-msg-text'
                                    }, 'Auto save message');
                                }
                                else {
                                    return el('a', {
                                        className: 'ctn-save-msg-text',
                                        href: '#',
                                        onClick: function () {return false}
                                    }, saveMessageLink);
                                }
                            })()
                        )
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
            var showSpinner = props.attributes.showSpinner !== undefined ? props.attributes.showSpinner : defShowSpinner;
            var autoSave = props.attributes.autoSave !== undefined ? props.attributes.autoSave : defAutoSave;
            var saveMessageLink = props.attributes.saveMessageLink !== undefined ? props.attributes.saveMessageLink : defSaveMessageLink;
            var spinnerColor = props.attributes.spinnerColor !== undefined ? props.attributes.spinnerColor : defSpinnerColor;

            return (
                el('div', {},
                    el('div', {
                        className: 'uicontainer'
                    },
                        el('input', {
                            type: 'hidden',
                            name: 'messageId',
                            value: messageId,
                            onChange: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkSaveMessage && typeof CtnBlkSaveMessage===\'function\'){parent.ctnBlkSaveMessage=new CtnBlkSaveMessage(parent,{showSpinner:' + toStringLiteral(showSpinner) + ',spinnerColor:' + toStringLiteral(spinnerColor) + ',autoSave:' + toStringLiteral(autoSave) + '})}parent.ctnBlkSaveMessage.checkRetrieveMessage()}finally{return false}}).call(this)'
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkSaveMessage && typeof CtnBlkSaveMessage===\'function\'){uiContainer.ctnBlkSaveMessage=new CtnBlkSaveMessage(uiContainer,{showSpinner:' + toStringLiteral(showSpinner) + ',spinnerColor:' + toStringLiteral(spinnerColor) + ',autoSave:' + toStringLiteral(autoSave) + '});}uiContainer.ctnBlkSaveMessage.checkRetrieveMessage()}})()</script>')
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);