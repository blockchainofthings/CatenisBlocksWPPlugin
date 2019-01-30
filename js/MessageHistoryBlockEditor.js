(function (context) {
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    var defMsgAction = 'any';
    var defPeriod = 'last_7_days';
    var defColumns = {
        action: true,
        messageId: true,
        type: true,
        date: true,
        targetDevice: true,
        msgRead: true
    };
    var defActionLinks = 'both';

    registerBlockType('catenis-blocks/message-history', {
        title: __('Message History', 'catenis-blocks'),
        description: __('Display list with latest stored/sent messages', 'catenis-blocks'),
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
            msgAction: {
                type: 'string'
            },
            period: {
                type: 'string'
            },
            columns: {
                type: 'string'
            },
            actionLinks: {
                type: 'string'
            },
            displayTargetHtmlAnchor: {
                type: 'string'
            },
            saveTargetHtmlAnchor: {
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
            var msgAction = props.attributes.msgAction !== undefined ? props.attributes.msgAction : defMsgAction;
            var period = props.attributes.period !== undefined ? props.attributes.period : defPeriod;
            var columns = props.attributes.columns !== undefined ? JSON.parse(props.attributes.columns) : defColumns;
            var actionLinks = props.attributes.actionLinks !== undefined ? props.attributes.actionLinks : defActionLinks;
            var displayTargetHtmlAnchor = props.attributes.displayTargetHtmlAnchor;
            var saveTargetHtmlAnchor = props.attributes.saveTargetHtmlAnchor;

            function onChangeMsgAction(newValue) {
                props.setAttributes({
                    msgAction: newValue
                });
            }

            function onChangePeriod(newValue) {
                props.setAttributes({
                    period: newValue
                });
            }

            function onChangeActionColumn(newState) {
                columns.action = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeMessageIdColumn(newState) {
                columns.messageId = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeTypeColumn(newState) {
                columns.type = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeDateColumn(newState) {
                columns.date = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeTargetDeviceColumn(newState) {
                columns.targetDevice = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeMsgReadColumn(newState) {
                columns.msgRead = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeActionLinks(newValue) {
                props.setAttributes({
                    actionLinks: newValue
                });
            }

            function onChangeDisplayTargetHtmlAnchor(newValue) {
                props.setAttributes({
                    displayTargetHtmlAnchor: newValue
                });
            }

            function onChangeSaveTargetHtmlAnchor(newValue) {
                props.setAttributes({
                    saveTargetHtmlAnchor: newValue
                });
            }

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(wp.editor.InspectorControls, {},
                        el(cmp.PanelBody, {
                            title: __('Message Filtering', 'catenis-blocks')
                        },
                            el(cmp.SelectControl, {
                                label: __('Message Type', 'catenis-blocks'),
                                options: [{
                                    value: 'log',
                                    label: 'Stored'
                                }, {
                                    value: 'send',
                                    label: 'Sent'
                                }, {
                                    value: 'any',
                                    label: 'Any'
                                }],
                                value: msgAction,
                                onChange: onChangeMsgAction
                            }),
                            el(cmp.SelectControl, {
                                label: __('Period', 'catenis-blocks'),
                                options: [{
                                    value: 'today',
                                    label: 'Today'
                                }, {
                                    value: 'last_7_days',
                                    label: 'Last 7 days'
                                }, {
                                    value: 'last_30_days',
                                    label: 'Last 30 days'
                                }, {
                                    value: 'current_month',
                                    label: 'Current month'
                                }, {
                                    value: 'last_3_months',
                                    label: 'Last 3 months'
                                }, {
                                    value: 'last_6_months',
                                    label: 'Last 6 months'
                                }],
                                value: period,
                                onChange: onChangePeriod
                            })
                        ),
                        el(cmp.PanelBody, {
                                title: __('Message List', 'catenis-blocks'),
                                initialOpen: false
                            },
                            el(cmp.CheckboxControl, {
                                heading: __('Columns', 'catenis-blocks'),
                                label: __('Action', 'catenis-blocks'),
                                checked: columns.action,
                                onChange: onChangeActionColumn,
                                className: 'msgListColumnEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Message ID', 'catenis-blocks'),
                                checked: columns.messageId,
                                onChange: onChangeMessageIdColumn,
                                className: 'msgListColumnEntry',
                                disabled: true
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Type', 'catenis-blocks'),
                                checked: columns.type,
                                onChange: onChangeTypeColumn,
                                className: 'msgListColumnEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Date', 'catenis-blocks'),
                                checked: columns.date,
                                onChange: onChangeDateColumn,
                                className: 'msgListColumnEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('To', 'catenis-blocks'),
                                checked: columns.targetDevice,
                                onChange: onChangeTargetDeviceColumn,
                                className: 'msgListColumnEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Read', 'catenis-blocks'),
                                help: __('Select the columns to be displayed', 'catenis-blocks'),
                                checked: columns.msgRead,
                                onChange: onChangeMsgReadColumn
                            }),
                            (function () {
                                if (columns.action) {
                                    return el(cmp.SelectControl, {
                                        label: __('Action Links', 'catenis-blocks'),
                                        options: [{
                                            value: 'display',
                                            label: 'Display'
                                        }, {
                                            value: 'save',
                                            label: 'Save'
                                        }, {
                                            value: 'both',
                                            label: 'Both'
                                        }, {
                                            value: 'none',
                                            label: 'none'
                                        }],
                                        value: actionLinks,
                                        onChange: onChangeActionLinks
                                    });
                                }
                            })()
                        ),
                        (function () {
                            if (columns.action && actionLinks !== 'none') {
                                var htmlAnchorsToShow = [];

                                if (actionLinks === 'both' || actionLinks === 'display') {
                                    htmlAnchorsToShow.push(el(cmp.TextControl, {
                                        label: __('Display HTML Anchor', 'catenis-blocks'),
                                        help: __('Reference to block used to display the message contents', 'catenis-blocks'),
                                        value: displayTargetHtmlAnchor,
                                        onChange: onChangeDisplayTargetHtmlAnchor
                                    }));
                                }

                                if (actionLinks === 'both' || actionLinks === 'save') {
                                    htmlAnchorsToShow.push(el(cmp.TextControl, {
                                        label: __('Save HTML Anchor', 'catenis-blocks'),
                                        help: __('Reference to block used to save the message contents', 'catenis-blocks'),
                                        value: saveTargetHtmlAnchor,
                                        onChange: onChangeSaveTargetHtmlAnchor
                                    }));
                                }

                                return el(cmp.PanelBody, {
                                    title: __('Action Target', 'catenis-blocks')
                                }, htmlAnchorsToShow);
                            }
                        })()
                    ),
                    // Block controls
                    el('div', {
                        className: props.className
                    },
                        el('table', {},
                            el('thead', {},
                                el('tr', {},
                                    (function () {
                                        var columnsToShow = [];

                                        if (columns.action) {
                                            columnsToShow.push(el('th', {}, __('Action', 'catenis-blocks')));
                                        }

                                        if (columns.messageId) {
                                            columnsToShow.push(el('th', {}, __('Message ID', 'catenis-blocks')));
                                        }

                                        if (columns.type) {
                                            columnsToShow.push(el('th', {}, __('Type', 'catenis-blocks')));
                                        }

                                        if (columns.date) {
                                            columnsToShow.push(el('th', {}, __('Date', 'catenis-blocks')));
                                        }

                                        if (columns.targetDevice) {
                                            columnsToShow.push(el('th', {}, __('To', 'catenis-blocks')));
                                        }

                                        if (columns.msgRead) {
                                            columnsToShow.push(el('th', {}, __('Read', 'catenis-blocks')));
                                        }

                                        return columnsToShow;
                                    })()
                                )
                            )
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
            var msgAction = props.attributes.msgAction !== undefined ? props.attributes.msgAction : defMsgAction;
            var period = props.attributes.period !== undefined ? props.attributes.period : defPeriod;
            var columns = props.attributes.columns !== undefined ? JSON.parse(props.attributes.columns) : defColumns;
            var actionLinks = props.attributes.actionLinks !== undefined ? props.attributes.actionLinks : defActionLinks;
            var displayTargetHtmlAnchor = props.attributes.displayTargetHtmlAnchor;
            var saveTargetHtmlAnchor = props.attributes.saveTargetHtmlAnchor;

            return (
                el('div', {},
                    el('div', {
                            className: 'uicontainer'
                        },
                        el('table', {},
                            el('thead', {},
                                el('tr', {},
                                    (function () {
                                        var columnsToShow = [];

                                        if (columns.action) {
                                            columnsToShow.push(el('th', {}, __('Action', 'catenis-blocks')));
                                        }

                                        if (columns.messageId) {
                                            columnsToShow.push(el('th', {}, __('Message ID', 'catenis-blocks')));
                                        }

                                        if (columns.type) {
                                            columnsToShow.push(el('th', {}, __('Type', 'catenis-blocks')));
                                        }

                                        if (columns.date) {
                                            columnsToShow.push(el('th', {}, __('Date', 'catenis-blocks')));
                                        }

                                        if (columns.targetDevice) {
                                            columnsToShow.push(el('th', {}, __('To', 'catenis-blocks')));
                                        }

                                        if (columns.msgRead) {
                                            columnsToShow.push(el('th', {}, __('Read', 'catenis-blocks')));
                                        }

                                        return columnsToShow;
                                    })()
                                )
                            ),
                            el('tbody')
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkMessageHistory && typeof CtnBlkMessageHistory===\'function\'){uiContainer.ctnBlkMessageHistory=new CtnBlkMessageHistory(uiContainer, {msgAction:' + toStringLiteral(msgAction) + ',period:' + toStringLiteral(period) + ',columns:' + toStringLiteral(JSON.stringify(columns)) + ',actionLinks:' + toStringLiteral(actionLinks) + ',displayTargetHtmlAnchor:' + toStringLiteral(displayTargetHtmlAnchor) + ',saveTargetHtmlAnchor:' + toStringLiteral(saveTargetHtmlAnchor) + '});}uiContainer.ctnBlkMessageHistory.listMessages()}})()</script>')
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);