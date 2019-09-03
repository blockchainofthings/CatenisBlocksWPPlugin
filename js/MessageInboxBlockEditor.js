(function (context) {
    var $ = context.jQuery;
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;
    var moment = context.moment;

    var dateFormat = 'YYYY-MM-DD';
    var defUnreadOnly = false;
    var defPeriod = 'last_7_days';
    var defMsgsPerPage = 10;
    var defColumns = {
        action: true,
        messageId: true,
        date: true,
        originDevice: true,
        msgRead: true
    };
    var defActionLinks = 'both';
    var defOriginDeviceId = 'deviceId';
    var defSortColumnOrder = 'date-down';

    registerBlockType('catenis-blocks/message-inbox', {
        title: __('Message Inbox', 'catenis-blocks'),
        description: __('Display list with latest received messages', 'catenis-blocks'),
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
            unreadOnly: {
                type: 'boolean'
            },
            period: {
                type: 'string'
            },
            customStartDate: {
                type: 'string'
            },
            selectCustomStartDate: {
                type: 'boolean'
            },
            customEndDate: {
                type: 'string'
            },
            selectCustomEndDate: {
                type: 'boolean'
            },
            msgsPerPage: {
                type: 'number'
            },
            columns: {
                type: 'string'
            },
            actionLinks: {
                type: 'string'
            },
            originDeviceId: {
                type: 'string'
            },
            displayTargetHtmlAnchor: {
                type: 'string'
            },
            saveTargetHtmlAnchor: {
                type: 'string'
            },
            sortColumnOrder: {
                type: 'string',
                source: 'attribute',
                selector: 'input[type="hidden"][name="sortColumnOrder"]',
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
            var unreadOnly = props.attributes.unreadOnly !== undefined ? props.attributes.unreadOnly : defUnreadOnly;
            var period = props.attributes.period !== undefined ? props.attributes.period : defPeriod;

            if (props.attributes.customStartDate === undefined) {
                props.setAttributes({
                    customStartDate: moment().format(dateFormat)
                });
            }
            var customStartDate = props.attributes.customStartDate;

            var customEndDate = props.attributes.customEndDate;
            var selectCustomStartDate = props.attributes.selectCustomStartDate ? props.attributes.selectCustomStartDate : false;
            var selectCustomEndDate = props.attributes.selectCustomEndDate ? props.attributes.selectCustomEndDate : false;
            var msgsPerPage = props.attributes.msgsPerPage !== undefined ? JSON.parse(props.attributes.msgsPerPage) : defMsgsPerPage;
            var columns = props.attributes.columns !== undefined ? JSON.parse(props.attributes.columns) : defColumns;
            var actionLinks = props.attributes.actionLinks !== undefined ? props.attributes.actionLinks : defActionLinks;
            var originDeviceId = props.attributes.originDeviceId !== undefined ? props.attributes.originDeviceId : defOriginDeviceId;
            var displayTargetHtmlAnchor = props.attributes.displayTargetHtmlAnchor;
            var saveTargetHtmlAnchor = props.attributes.saveTargetHtmlAnchor;
            var sortColumnOrder = props.attributes.sortColumnOrder !== undefined ? props.attributes.sortColumnOrder : defSortColumnOrder;

            var sortParts = sortColumnOrder.split('-');
            var sortColumn = sortParts[0];
            var sortOrder = sortParts[1];

            function onChangeUnreadOnly(newState) {
                props.setAttributes({
                    unreadOnly: newState
                });
            }

            function onChangePeriod(newValue) {
                props.setAttributes({
                    period: newValue
                });
            }

            function onChangeCustomStartDate(newValue) {
                // Filter out spurious characters
                newValue = newValue.replace(/[^0-9-]/, '');

                if (newValue.length > dateFormat.length) {
                    newValue = newValue.substring(0, dateFormat.length);
                }

                props.setAttributes({
                    customStartDate: newValue
                });
            }

            function onBlurCustomStartDate(event) {
                var mt = moment(event.target.value, dateFormat);
                var mtCustomEndDate = moment(customEndDate, dateFormat);
                var mtToday = moment().format(dateFormat);

                props.setAttributes({
                    customStartDate: !mt.isValid() ? (!mtCustomEndDate.isValid() ? mtToday : (mtCustomEndDate.isBefore(mtToday) ? mtCustomEndDate.format(dateFormat) : mtToday.format(dateFormat)))
                            : (!mtCustomEndDate.isValid() || mt.isSameOrBefore(mtCustomEndDate) ? mt.format(dateFormat) : mtCustomEndDate.format(dateFormat)),
                    selectCustomStartDate: false
                });
            }

            // eslint-disable-next-line no-unused-vars
            function onClickCustomStartDateButton(event) {
                props.setAttributes({
                    selectCustomStartDate: !selectCustomStartDate
                });
            }

            // eslint-disable-next-line no-unused-vars
            function onCloseCustomStartDatePopover(event) {
                props.setAttributes({
                    selectCustomStartDate: false
                });
            }

            function onChangeCustomStartDatePicker(newDate) {
                var mt = moment(newDate);
                var mtCustomEndDate = moment(customEndDate, dateFormat);
                var mtToday = moment().format(dateFormat);

                props.setAttributes({
                    customStartDate: !mt.isValid() ? (!mtCustomEndDate.isValid() ? mtToday : (mtCustomEndDate.isBefore(mtToday) ? mtCustomEndDate.format(dateFormat) : mtToday.format(dateFormat)))
                        : (!mtCustomEndDate.isValid() || mt.isSameOrBefore(mtCustomEndDate) ? mt.format(dateFormat) : mtCustomEndDate.format(dateFormat)),
                    selectCustomStartDate: false
                });

                $('.ctn-date-picker.custom-start-date .components-text-control__input').focus();
            }

            // eslint-disable-next-line no-unused-vars
            function onChangeCustomEndDate(newValue) {
                // Filter out spurious characters
                newValue = newValue.replace(/[^0-9-]/, '');

                if (newValue.length > dateFormat.length) {
                    newValue = newValue.substring(0, dateFormat.length);
                }

                props.setAttributes({
                    customEndDate: newValue
                });
            }

            // eslint-disable-next-line no-unused-vars
            function onBlurCustomEndDate(event) {
                var mt = moment(event.target.value, dateFormat);
                var mtCustomStartDate = moment(customStartDate, dateFormat);

                props.setAttributes({
                    customEndDate: !mt.isValid() ? '' : (mt.isBefore(mtCustomStartDate) ? mtCustomStartDate.format(dateFormat) : mt.format(dateFormat)),
                    selectCustomEndDate: false
                });
            }

            // eslint-disable-next-line no-unused-vars
            function onClickCustomEndDateButton(event) {
                props.setAttributes({
                    selectCustomEndDate: !selectCustomEndDate
                });
            }

            // eslint-disable-next-line no-unused-vars
            function onCloseCustomEndDatePopover(event) {
                props.setAttributes({
                    selectCustomEndDate: false
                });
            }

            // eslint-disable-next-line no-unused-vars
            function onChangeCustomEndDatePicker(newDate) {
                var mt = moment(newDate);
                var mtCustomStartDate = moment(customStartDate, dateFormat);

                props.setAttributes({
                    customEndDate: !mt.isValid() ? '' : (mt.isBefore(mtCustomStartDate) ? mtCustomStartDate.format(dateFormat) : mt.format(dateFormat)),
                    selectCustomEndDate: false
                });

                $('.ctn-date-picker.custom-end-date .components-text-control__input').focus();
            }

            function onChangeMsgsPerPage(newValue) {
                newValue = parseInt(newValue);

                props.setAttributes({
                    msgsPerPage: isNaN(newValue) || newValue === 0 ? undefined : Math.abs(newValue)
                });
            }

            function onChangeActionColumn(newState) {
                columns.action = newState;

                props.setAttributes({
                    columns: JSON.stringify(columns)
                });
            }

            function onChangeDateColumn(newState) {
                columns.date = newState;

                var attrToSet = {
                    columns: JSON.stringify(columns)
                };

                if (!columns.date && sortColumn === 'date') {
                    // Reset sorting column/order
                    sortColumn = 'messageId';
                    sortOrder = 'up';

                    attrToSet.sortColumnOrder = sortColumn + '-' + sortOrder;
                }

                props.setAttributes(attrToSet);
            }

            function onChangeOriginDeviceColumn(newState) {
                columns.originDevice = newState;

                var attrToSet = {
                    columns: JSON.stringify(columns)
                };

                if (!columns.originDevice && sortColumn === 'originDevice') {
                    // Reset sorting column/order
                    sortColumn = 'messageId';
                    sortOrder = 'up';

                    attrToSet.sortColumnOrder = sortColumn + '-' + sortOrder;
                }

                props.setAttributes(attrToSet);
            }

            function onChangeMsgReadColumn(newState) {
                columns.msgRead = newState;

                var attrToSet = {
                    columns: JSON.stringify(columns)
                };

                if (!columns.msgRead && sortColumn === 'msgRead') {
                    // Reset sorting column/order
                    sortColumn = 'messageId';
                    sortOrder = 'up';

                    attrToSet.sortColumnOrder = sortColumn + '-' + sortOrder;
                }

                props.setAttributes(attrToSet);
            }

            function onChangeActionLinks(newValue) {
                props.setAttributes({
                    actionLinks: newValue
                });
            }

            function onChangeOriginDeviceId(newValue) {
                props.setAttributes({
                    originDeviceId: newValue
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

            function onClickSortColumnOrder(event) {
                var column = $(event.target).parent()[0].className;

                if (sortColumn === column) {
                    sortOrder = sortOrder === 'up' ? 'down' : 'up';
                }
                else {
                    sortColumn = column;
                    sortOrder = 'up';
                }

                props.setAttributes({
                    sortColumnOrder: sortColumn + '-' + sortOrder
                });
            }

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(wp.editor.InspectorControls, {},
                        el(cmp.PanelBody, {
                            title: __('Message Filtering', 'catenis-blocks')
                        },
                            el(cmp.ToggleControl, {
                                label: __('Unread Only', 'catenis-blocks'),
                                help: unreadOnly ? __('List only unread messages', 'catenis-blocks') : __('List all messages', 'catenis-blocks'),
                                checked: unreadOnly,
                                onChange: onChangeUnreadOnly
                            }),
                            el(cmp.SelectControl, {
                                label: __('Period', 'catenis-blocks'),
                                options: [{
                                    value: 'today',
                                    label: __('Today', 'catenis-blocks')
                                }, {
                                    value: 'last_7_days',
                                    label: __('Last 7 days', 'catenis-blocks')
                                }, {
                                    value: 'last_30_days',
                                    label: __('Last 30 days', 'catenis-blocks')
                                }, {
                                    value: 'current_month',
                                    label: __('Current month', 'catenis-blocks')
                                }, {
                                    value: 'last_3_months',
                                    label: __('Last 3 months', 'catenis-blocks')
                                }, {
                                    value: 'last_6_months',
                                    label: __('Last 6 months', 'catenis-blocks')
                                }, {
                                    value: 'custom',
                                    label: __('Custom', 'catenis-blocks')
                                }],
                                value: period,
                                onChange: onChangePeriod
                            }),
                            (function () {
                                if (period === 'custom') {
                                    var startDateComps = [
                                        el(cmp.TextControl, {
                                            key: 'label',
                                            label: __('Start Date', 'catenis-blocks'),
                                            value: customStartDate,
                                            className: 'ctn-date-picker custom-start-date',
                                            instanceId: 'custom-start-date',
                                            onChange: onChangeCustomStartDate,
                                            onBlur: onBlurCustomStartDate
                                        }),
                                        el('span', {
                                            key: 'button',
                                            onClick: onClickCustomStartDateButton
                                        },
                                            el(cmp.Dashicon, {
                                                icon:'calendar-alt',
                                                className: 'ctn-date-picker'
                                            })
                                        )
                                    ];

                                    if (selectCustomStartDate) {
                                        startDateComps.push(el(cmp.Popover, {
                                            key: 'popover',
                                            position: 'bottom center',
                                            focusOnMount: 'container',
                                            expandOnMobile: true,
                                            headerTitle: __('Start Date', 'catenis-blocks'),
                                            onClose: onCloseCustomStartDatePopover
                                        },
                                            el(cmp.DatePicker, {
                                                currentDate: customStartDate,
                                                onChange: onChangeCustomStartDatePicker
                                            })
                                        ));
                                    }

                                    return [
                                        el('div', {
                                            className: 'ctn-date-picker'
                                        }, startDateComps)
                                    ];
                                }
                            })()
                        ),
                        el(cmp.PanelBody, {
                            title: __('Message List', 'catenis-blocks'),
                            initialOpen: false
                        },
                            el(cmp.TextControl, {
                                label: __('Messages Per Page', 'catenis-blocks'),
                                value: msgsPerPage,
                                onChange: onChangeMsgsPerPage
                            }),
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
                                className: 'msgListColumnEntry',
                                disabled: true
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Date', 'catenis-blocks'),
                                checked: columns.date,
                                onChange: onChangeDateColumn,
                                className: 'msgListColumnEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('From', 'catenis-blocks'),
                                checked: columns.originDevice,
                                onChange: onChangeOriginDeviceColumn,
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
                            })(),
                            (function () {
                                if (columns.originDevice) {
                                    return el(cmp.SelectControl, {
                                        label: __('Origin Device ID (\'From\' Column)', 'catenis-blocks'),
                                        help: originDeviceId === 'deviceId' ? __('Always show device ID', 'catenis-blocks') : __('Show product unique ID instead if present', 'catenis-blocks'),
                                        options: [{
                                            value: 'deviceId',
                                            label: 'Device ID'
                                        }, {
                                            value: 'prodUniqueId',
                                            label: 'Product Unique ID'
                                        }],
                                        value: originDeviceId,
                                        onChange: onChangeOriginDeviceId
                                    });
                                }
                            })()
                        ),
                        (function () {
                            if (columns.action && actionLinks !== 'none') {
                                var htmlAnchorsToShow = [];

                                if (actionLinks === 'both' || actionLinks === 'display') {
                                    htmlAnchorsToShow.push(el(cmp.TextControl, {
                                        key: 'display',
                                        label: __('Display HTML Anchor', 'catenis-blocks'),
                                        help: __('Reference to block used to display the message contents', 'catenis-blocks'),
                                        value: displayTargetHtmlAnchor,
                                        onChange: onChangeDisplayTargetHtmlAnchor
                                    }));
                                }

                                if (actionLinks === 'both' || actionLinks === 'save') {
                                    htmlAnchorsToShow.push(el(cmp.TextControl, {
                                        key: 'save',
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
                                            columnsToShow.push(el('th', {
                                                key: 'action'
                                            }, __('Action', 'catenis-blocks')));
                                        }

                                        if (columns.messageId) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'message-id',
                                                    className: 'messageId'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'messageId' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'messageId' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks'),
                                                        onClick: onClickSortColumnOrder
                                                    }, __('Message ID', 'catenis-blocks'))
                                                )
                                            );
                                        }

                                        if (columns.date) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'date',
                                                    className: 'date'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'date' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'date' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks'),
                                                        onClick: onClickSortColumnOrder
                                                    }, __('Date', 'catenis-blocks'))
                                                )
                                            );
                                        }

                                        if (columns.originDevice) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'origin-device',
                                                    className: 'originDevice'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'originDevice' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'originDevice' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks'),
                                                        onClick: onClickSortColumnOrder
                                                    }, __('From', 'catenis-blocks'))
                                                )
                                            );
                                        }

                                        if (columns.msgRead) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'msg-read',
                                                    className: 'msgRead'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'msgRead' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'msgRead' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {
                                                            className: 'rawDiv'
                                                        },
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks'),
                                                        onClick: onClickSortColumnOrder
                                                    }, __('Read', 'catenis-blocks'))
                                                )
                                            );
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
            var unreadOnly = props.attributes.unreadOnly !== undefined ? props.attributes.unreadOnly : defUnreadOnly;
            var period = props.attributes.period !== undefined ? props.attributes.period : defPeriod;
            var customEndDate = props.attributes.customEndDate;
            var customStartDate = props.attributes.customStartDate;
            var msgsPerPage = props.attributes.msgsPerPage !== undefined ? JSON.parse(props.attributes.msgsPerPage) : defMsgsPerPage;
            var columns = props.attributes.columns !== undefined ? JSON.parse(props.attributes.columns) : defColumns;
            var actionLinks = props.attributes.actionLinks !== undefined ? props.attributes.actionLinks : defActionLinks;
            var originDeviceId = props.attributes.originDeviceId !== undefined ? props.attributes.originDeviceId : defActionLinks;
            var displayTargetHtmlAnchor = props.attributes.displayTargetHtmlAnchor;
            var saveTargetHtmlAnchor = props.attributes.saveTargetHtmlAnchor;
            var sortColumnOrder = props.attributes.sortColumnOrder !== undefined ? props.attributes.sortColumnOrder : defSortColumnOrder;

            var sortParts = sortColumnOrder.split('-');
            var sortColumn = sortParts[0];
            var sortOrder = sortParts[1];

            return (
                el('div', {},
                    el('div', {
                        className: 'uicontainer'
                    },
                        el('div', {
                            className: 'header'
                        },
                            el('div', {
                                    className: 'left-overlay'
                                },
                                el('span', {
                                    className: 'button-icon reload',
                                    title: __('Reload', 'catenis-blocks')
                                },
                                    el(wp.element.RawHTML, {},
                                        '<svg height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="translate(12 12) scale(-1 1) translate(-12 -12)"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><path d="M21,12A9.00042,9.00042,0,0,1,3.06543,13.08984a.74954.74954,0,1,1,1.48828-.17968A7.53176,7.53176,0,1,0,5.38165,8.5H7.75a.75.75,0,0,1,0,1.5h-3A1.75213,1.75213,0,0,1,3,8.25v-3a.75.75,0,0,1,1.5,0V7.05823A8.98578,8.98578,0,0,1,21,12Z"></path></svg></g></svg>'
                                    )
                                ),
                                el('span', {
                                    className: 'new-msg-alert off'
                                }, __('New Message', 'catenis-blocks'))
                            ),
                            el('span', {
                                className: 'button-icon first-page disabled',
                                title: __('First page', 'catenis-blocks')
                            },
                                el(wp.element.RawHTML, {},
                                    '<svg height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M17,19a1,1,0,0,0,.707-1.707L12.41406,12l5.293-5.293A.99989.99989,0,0,0,16.293,5.293l-6,6a.99962.99962,0,0,0,0,1.41406l6,6A.99676.99676,0,0,0,17,19Zm-6,0a1,1,0,0,0,.707-1.707L6.41406,12l5.293-5.293A.99989.99989,0,0,0,10.293,5.293l-6,6a.99962.99962,0,0,0,0,1.41406l6,6A.99676.99676,0,0,0,11,19Z"></path></g></svg>'
                                )
                            ),
                            el('span', {
                                className: 'button-icon prev-page disabled',
                                title: __('Previous page', 'catenis-blocks')
                            },
                                el(wp.element.RawHTML, {},
                                    '<svg height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M6,18V6A1,1,0,0,1,8,6V18a1,1,0,0,1-2,0Zm11,1a1,1,0,0,0,.707-1.707L12.41406,12l5.293-5.293A.99989.99989,0,0,0,16.293,5.293l-6,6a.99962.99962,0,0,0,0,1.41406l6,6A.99676.99676,0,0,0,17,19Z"></path></g></svg>'
                                )
                            ),
                            el('span', {
                                className: 'page-number'
                            },
                                'Page\u00A0',
                                el('input', {
                                    type: 'text',
                                    maxlength: '3'
                                }),
                                '\u00A0of\u00A0',
                                el('span', {
                                    className: 'max-page'
                                }, '')
                            ),
                            el('span', {
                                className: 'button-icon next-page disabled',
                                title: __('Next page', 'catenis-blocks')
                            },
                                el(wp.element.RawHTML, {},
                                    '<svg height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M17,19a.99943.99943,0,0,1-1-1V6a1,1,0,0,1,2,0V18A.99943.99943,0,0,1,17,19Zm-9.293-.293,6-6a.99962.99962,0,0,0,0-1.41406l-6-6A.99989.99989,0,0,0,6.293,6.707L11.58594,12,6.293,17.293A.99989.99989,0,1,0,7.707,18.707Z"></path></g></svg>'
                                )
                            ),
                            el('span', {
                                className: 'button-icon last-page disabled',
                                title: __('Last page', 'catenis-blocks')
                            },
                                el(wp.element.RawHTML, {},
                                    '<svg height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M7.707,18.707l6-6a.99962.99962,0,0,0,0-1.41406l-6-6A.99989.99989,0,0,0,6.293,6.707L11.58594,12,6.293,17.293A.99989.99989,0,1,0,7.707,18.707Zm6,0,6-6a.99962.99962,0,0,0,0-1.41406l-6-6A.99989.99989,0,0,0,12.293,6.707L17.58594,12l-5.293,5.293A.99989.99989,0,1,0,13.707,18.707Z"></path></g></svg>'
                                )
                            )
                        ),
                        el('input', {
                            type: 'hidden',
                            name: 'sortColumnOrder',
                            value: sortColumnOrder
                        }),
                        el('table', {},
                            el('thead', {},
                                el('tr', {},
                                    (function () {
                                        var columnsToShow = [];

                                        if (columns.action) {
                                            columnsToShow.push(el('th', {
                                                key: 'action'
                                            }, __('Action', 'catenis-blocks')));
                                        }

                                        if (columns.messageId) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'message-id',
                                                    className: 'messageId'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'messageId' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'messageId' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks')
                                                    }, __('Message ID', 'catenis-blocks'))
                                                )
                                            );
                                        }

                                        if (columns.date) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'date',
                                                    className: 'date'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'date' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'date' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks')
                                                    }, __('Date', 'catenis-blocks'))
                                                )
                                            );
                                        }

                                        if (columns.originDevice) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'origin-device',
                                                    className: 'originDevice'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'originDevice' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'originDevice' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks')
                                                    }, __('From', 'catenis-blocks'))
                                                )
                                            );
                                        }

                                        if (columns.msgRead) {
                                            columnsToShow.push(
                                                el('th', {
                                                    key: 'msg-read',
                                                    className: 'msgRead'
                                                },
                                                    el('span', {
                                                        className: 'order-icon up' + (sortColumn !== 'msgRead' || sortOrder !== 'up' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M12,8a1.99426,1.99426,0,0,0-1.49677.67212L6.9523,12.66693A2.00261,2.00261,0,0,0,8.44907,16h7.10186a2.00261,2.00261,0,0,0,1.49677-3.33307L13.49677,8.67212A1.99426,1.99426,0,0,0,12,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'order-icon down' + (sortColumn !== 'msgRead' || sortOrder !== 'down' ? ' hidden' : '')
                                                    },
                                                        el(wp.element.RawHTML, {},
                                                            '<svg height="1em" width="1em" fill="#000000" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" x="0px" y="0px"><g><path d="M15.55093,8H8.44907A2.00261,2.00261,0,0,0,6.9523,11.33307l3.55093,3.99481a2.00267,2.00267,0,0,0,2.99354,0l3.55093-3.99481A2.00261,2.00261,0,0,0,15.55093,8Z"></path></g></svg>'
                                                        )
                                                    ),
                                                    el('span', {
                                                        className: 'headerName',
                                                        title: __('Sort by', 'catenis-blocks')
                                                    }, __('Read', 'catenis-blocks'))
                                                )
                                            );
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
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkMessageInbox && typeof CtnBlkMessageInbox===\'function\'){uiContainer.ctnBlkMessageInbox=new CtnBlkMessageInbox(uiContainer, {unreadOnly:' + toStringLiteral(unreadOnly) + ',period:' + toStringLiteral(period) + ',customStartDate:' + toStringLiteral(customStartDate) + ',customEndDate:' + toStringLiteral(customEndDate) + ',msgsPerPage:' + toStringLiteral(msgsPerPage) + ',columns:' + toStringLiteral(JSON.stringify(columns)) + ',originDeviceId:' + toStringLiteral(originDeviceId) + ',actionLinks:' + toStringLiteral(actionLinks) + ',displayTargetHtmlAnchor:' + toStringLiteral(displayTargetHtmlAnchor) + ',saveTargetHtmlAnchor:' + toStringLiteral(saveTargetHtmlAnchor) + '});}uiContainer.ctnBlkMessageInbox.listMessages()}})()</script>')
                )
            );
        }
    });

    function toStringLiteral(value) {
        return typeof value !== 'string' ? '' + value :
            '\'' + value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\''
    }
})(this);