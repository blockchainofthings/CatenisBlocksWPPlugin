(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;
    var $ = context.jQuery;

    var defShowSpinner = true;
    var defStripFileHeader = true;
    var defLimitMsg = true;
    var defMaxMsgLength = 1024;
    var defSpinnerColor = 'black';

    var spinner;
    var spinnerTimeout;

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
            },
            showSpinner: {
                type: 'boolean'
            },
            stripFileHeader: {
                type: 'boolean'
            },
            limitMsg: {
                type: 'boolean'
            },
            maxMsgLength: {
                type: 'number'
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
            var stripFileHeader = props.attributes.stripFileHeader !== undefined ? props.attributes.stripFileHeader : defStripFileHeader;
            var limitMsg = props.attributes.limitMsg !== undefined ? props.attributes.limitMsg : defLimitMsg;
            var maxMsgLength = props.attributes.maxMsgLength !== undefined ? props.attributes.maxMsgLength : defMaxMsgLength;
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

            function onChangeStripFileHeader(newState) {
                props.setAttributes({
                    stripFileHeader: newState
                });
            }

            function onChangeLimitMsg(newState) {
                props.setAttributes({
                    limitMsg: newState
                });
            }

            function onChangeMaxMsgLength(newValue) {
                newValue = parseInt(newValue);

                props.setAttributes({
                    maxMsgLength: isNaN(newValue) || newValue === 0 ? undefined : Math.abs(newValue)
                });
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

                $('pre', uiContainer).addClass('ctn-spinner');
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

                    $('pre', $('div.' + props.className + ' div.uicontainer')[0]).removeClass('ctn-spinner');
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
                            }),
                            el(cmp.ToggleControl, {
                                label: __('Strip File Header', 'catenis-blocks'),
                                help: stripFileHeader ? __('Do not display file header if present', 'catenis-blocks') : __('Display message as it is', 'catenis-blocks'),
                                checked: stripFileHeader,
                                onChange: onChangeStripFileHeader
                            }),
                            el(cmp.ToggleControl, {
                                label: __('Limit Message', 'catenis-blocks'),
                                help: limitMsg ? __('Truncate message if it is too large', 'catenis-blocks') : __('Always display the whole message', 'catenis-blocks'),
                                checked: limitMsg,
                                onChange: onChangeLimitMsg
                            }),
                            (function () {
                                if (limitMsg) {
                                    return el(cmp.TextControl, {
                                        label: __('Max Message Length', 'catenis-blocks'),
                                        help: __('Maximum number of characters that can be displayed', 'catenis-blocks'),
                                        value: maxMsgLength,
                                        onChange: onChangeMaxMsgLength
                                    });
                                }
                            })()
                        ),
                        (function (){
                            if (showSpinner) {
                                return  el(cmp.PanelBody, {
                                    title: __('Advanced UI Settings', 'catenis-blocks'),
                                    initialOpen: false
                                },
                                    el(cmp.BaseControl, {
                                            id: 'ctn-display-msg-block-spinner-color',
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
                            el('pre', {}, __('Sample retrieved message', 'catenis-blocks'))
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
            var stripFileHeader = props.attributes.stripFileHeader !== undefined ? props.attributes.stripFileHeader : defStripFileHeader;
            var limitMsg = props.attributes.limitMsg !== undefined ? props.attributes.limitMsg : defLimitMsg;
            var maxMsgLength = props.attributes.maxMsgLength !== undefined ? props.attributes.maxMsgLength : defMaxMsgLength;
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
                            onChange: '(function(){try{var parent=this.parentElement;if(!parent.ctnBlkDisplayMessage && typeof CtnBlkDisplayMessage===\'function\'){parent.ctnBlkDisplayMessage=new CtnBlkDisplayMessage(parent, {showSpinner:' + toStringLiteral(showSpinner) + ',spinnerColor:' + toStringLiteral(spinnerColor) + ',stripFileHeader:' + toStringLiteral(stripFileHeader) + ',limitMsg:' + toStringLiteral(limitMsg) + ',maxMsgLength:' + toStringLiteral(maxMsgLength) + '})}parent.ctnBlkDisplayMessage.checkRetrieveMessage()}finally{return false}}).call(this)'
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkDisplayMessage && typeof CtnBlkDisplayMessage===\'function\'){uiContainer.ctnBlkDisplayMessage=new CtnBlkDisplayMessage(uiContainer, {showSpinner:' + toStringLiteral(showSpinner) + ',spinnerColor:' + toStringLiteral(spinnerColor) + ',stripFileHeader:' + toStringLiteral(stripFileHeader) + ',limitMsg:' + toStringLiteral(limitMsg) + ',maxMsgLength:' + toStringLiteral(maxMsgLength) + '});}uiContainer.ctnBlkDisplayMessage.checkRetrieveMessage()}})()</script>')
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\'';
    }
})(this);