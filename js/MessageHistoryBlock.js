/* eslint-disable no-console */
(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var moment = context.moment;

    function CtnBlkMessageHistory(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.msgAction = props.msgAction;
            this.unreadOnly = props.unreadOnly;
            this.period = props.period;
            this.customStartDate = props.customStartDate;
            this.customEndDate = props.customEndDate;
            this.msgsPerPage = props.msgsPerPage;
            this.columns = JSON.parse(props.columns);
            this.actionLinks = props.actionLinks;
            this.targetDeviceId = props.targetDeviceId;
            this.displayTargetHtmlAnchor = props.displayTargetHtmlAnchor;
            this.saveTargetHtmlAnchor = props.saveTargetHtmlAnchor;
            this.headerPanel = undefined;
            this.pageNumberField = undefined;
            this.totalPagesField = undefined;
            this.headerButton = {
                reload: {
                    className: 'reload',
                    $elem: undefined,
                    onClickHandler: this.reload.bind(this)
                },
                firstPage: {
                    className: 'first-page',
                    $elem: undefined,
                    onClickHandler: this.firstPage.bind(this)
                },
                prevPage: {
                    className: 'prev-page',
                    $elem: undefined,
                    onClickHandler: this.previousPage.bind(this)
                },
                nextPage: {
                    className: 'next-page',
                    $elem: undefined,
                    onClickHandler: this.nextPage.bind(this)
                },
                lastPage: {
                    className: 'last-page',
                    $elem: undefined,
                    onClickHandler: this.lastPage.bind(this)
                }
            };
            this.tableBody = undefined;
            this.msgContainer = undefined;
            this.divError = undefined;
            this.txtError = undefined;
            this.messages = undefined;
            this.mapIdMsgIdx = undefined;
            this.totalPages = 0;
            this.currentPageNumber = undefined;
            this.viewMessages = undefined;
            this.sortColumnOrderField = undefined;
            this.sortColumn = undefined;
            this.sortOrder = undefined;
            this.$tableHeaders = undefined;

            this.notifyChannelOpen = false;
            this.lastOpenNtfyChnlRetryTime = undefined;
            this.minOpenNtfyChnlRetryInterval = 1000;   // 1 sec. (in milliseconds)

            this.messageBatchSize = undefined;  // Use the largest possible batch size (500)

            this.setHeaderElements();
            this.setTableElements();
            this.setErrorPanel();
            this.setUpNotification();
        }
    }

    CtnBlkMessageHistory.prototype.setUpNotification = function () {
        $(this.uiContainer).on('ctn-msg-read', this.processCtnMsgReadNotify.bind(this));

        var _self = this;

        context.ctnApiProxy.on('comm-error', function (error) {
            // Error communicating with Catenis notification process
            console.error('Catenis notification process error:', error);

            if (_self.notifyChannelOpen) {
                var shouldRetryOpen = !_self.lastOpenNtfyChnlRetryTime || (Date.now() - _self.lastOpenNtfyChnlRetryTime >= _self.minOpenNtfyChnlRetryInterval);

                if (shouldRetryOpen) {
                    // Make sure that notification channel is open
                    _self.lastOpenNtfyChnlRetryTime = Date.now();
                    context.setImmediate(openNotifyChannel);
                }
            }
        });

        // Prepare to open notification channel to monitor sent message read events
        var wsNotifyChannel = context.ctnApiProxy.createWsNotifyChannel('sent-msg-read');

        wsNotifyChannel.on('open', function (error) {
            if (error) {
                // Error establishing underlying WebSocket connection
                console.error('[' + wsNotifyChannel.eventName + '] - Error establishing underlying WebSocket connection:', error);
            }
            else {
                // Catenis notification channel successfully open
                console.log('[' + wsNotifyChannel.eventName + '] - Catenis notification channel successfully open');
                _self.notifyChannelOpen = true;
            }
        });

        wsNotifyChannel.on('error', function (error) {
            // Error in the underlying WebSocket connection
            console.error('[' + wsNotifyChannel.eventName + '] - Error in the underlying WebSocket connection:', error);
        });

        wsNotifyChannel.on('close', function (code, reason) {
            // Underlying WebSocket connection has been closed
            console.error('[' + wsNotifyChannel.eventName + '] - Underlying WebSocket connection has been closed; code: ' + code + ', reason: ' + reason);
            _self.notifyChannelOpen = false;

            var shouldRetry = !_self.lastOpenNtfyChnlRetryTime || (Date.now() - _self.lastOpenNtfyChnlRetryTime >= _self.minOpenNtfyChnlRetryInterval);

            if (shouldRetry) {
                // Reopen notification channel
                _self.lastOpenNtfyChnlRetryTime = Date.now();
                context.setImmediate(openNotifyChannel);
            }
        });

        wsNotifyChannel.on('notify', function (eventData) {
            _self.processSentMessageRead(eventData);
        });

        function openNotifyChannel() {
            wsNotifyChannel.open(function (error) {
                if (error) {
                    // Error sending command to open notification channel
                    console.error('Error opening Catenis notification channel:', error);
                }
            });
        }

        openNotifyChannel();
    };

    CtnBlkMessageHistory.prototype.processSentMessageRead = function (eventData) {
        // Update message's read state
        this.updateMessageEntry(eventData.messageId, {read: true}, true, true);
    };

    CtnBlkMessageHistory.prototype.processCtnMsgReadNotify = function (event, messageId) {
        if (this.unreadOnly) {
            // Remove already read message
            this.removeMessage(messageId);
        }
        else {
            // Update message's read state
            this.updateMessageEntry(messageId, {read: true}, true, true);
        }
    };

    CtnBlkMessageHistory.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
        var result = true;

        if (typeof context.ctnApiProxy !== 'object') {
            var elems = $('div.noctnapiproxy', uiContainer.parentElement);
            if (elems.length > 0) {
                var noCtnApiProxy = elems[0];

                noCtnApiProxy.style.display = 'block';
            }

            uiContainer.style.display = 'none';
            result = false;
        }

        return result;
    };

    CtnBlkMessageHistory.prototype.setHeaderElements = function () {
        var $headerPanel = $('div.header', this.uiContainer);

        if ($headerPanel.length > 0) {
            this.headerPanel = $headerPanel[0];

            var $pageNumberField = $('span.page-number input[type="text"]', this.headerPanel);

            if ($pageNumberField.length > 0) {
                $pageNumberField.change(this.pageNumberChanged.bind(this));
                $pageNumberField.on('input', this.pageNumberEntered.bind(this));

                this.pageNumberField = $pageNumberField[0];
            }

            var $totalPagesField = $('span.max-page', this.headerPanel);

            if ($totalPagesField.length > 0) {
                this.totalPagesField = $totalPagesField[0];
            }

            var _self = this;

            // Set reference to all buttons in header
            Object.keys(this.headerButton).forEach(function (buttonId) {
                var buttonInfo = _self.headerButton[buttonId];

                buttonInfo.$elem = $('span.' + buttonInfo.className, _self.headerPanel);

                if (!buttonInfo.$elem.hasClass('disabled')) {
                    buttonInfo.$elem.on('click', buttonInfo.onClickHandler);
                }
            });
        }
    };

    CtnBlkMessageHistory.prototype.setTableElements = function () {
        var $sortColumnOrder = $('input[type="hidden"][name="sortColumnOrder"]', this.uiContainer);
        if ($sortColumnOrder.length > 0) {
            this.sortColumnOrderField = $sortColumnOrder[0];

            var sortParts = this.sortColumnOrderField.value.split('-');
            this.sortColumn = sortParts[0];
            this.sortOrder = sortParts[1];
        }

        this.$tableHeaders = $('table thead tr th', this.uiContainer);

        var elems = $('tbody', this.uiContainer);
        if (elems.length > 0) {
            this.tableBody = elems[0];
        }

        // Hook up handler to process request to sort message list by a different column/order
        var $headerName = $('table thead tr span.headerName', this.uiContainer);
        var _self = this;

        $headerName.click(function (event) {
            var column = $(event.target).parent()[0].className;

            if (_self.sortColumn === column) {
                _self.sortOrder = _self.sortOrder === 'up' ? 'down' : 'up';
            }
            else {
                _self.clearSortIcons();
                _self.sortColumn = column;
                _self.sortOrder = 'up';
            }

            _self.setSortIcon();

            _self.sortColumnOrderField.value = _self.sortColumn + '-' + _self.sortOrder;

            // Sort messages and rewind list
            _self.processRetrievedMessages(_self.messages);
        });
    };

    CtnBlkMessageHistory.prototype.clearSortIcons = function () {
        var thElem = this.$tableHeaders.filter('.' + this.sortColumn)[0];

        $('span.order-icon.up', thElem).addClass('hidden');
        $('span.order-icon.down', thElem).addClass('hidden');
    };

    CtnBlkMessageHistory.prototype.setSortIcon = function () {
        var thElem = this.$tableHeaders.filter('.' + this.sortColumn)[0];

        if (this.sortOrder === 'up') {
            $('span.order-icon.up', thElem).removeClass('hidden');
            $('span.order-icon.down', thElem).addClass('hidden');
        }
        else {
            $('span.order-icon.up', thElem).addClass('hidden');
            $('span.order-icon.down', thElem).removeClass('hidden');
        }
    };

    CtnBlkMessageHistory.prototype.setErrorPanel = function () {
        var elems = $('div.error', this.uiContainer);
        if (elems.length > 0) {
            this.divError = elems[0];

            elems = $('p.error', this.divError);
            if (elems.length > 0) {
                this.txtError = elems[0];
            }
        }
    };

    CtnBlkMessageHistory.prototype.listMessages = function () {
        this.clearMessages();

        var options = {
            action: this.msgAction,
            direction: 'outbound'
        };

        if (this.unreadOnly) {
            options.readState = 'unread';
        }

        if (this.period !== 'custom') {
            options.startDate = getPeriodStartDate(this.period);
        }
        else {
            options.startDate = moment(this.customStartDate).utc().toDate();

            if (this.customEndDate) {
                options.endDate = moment(this.customEndDate).endOf('d').utc().toDate();
            }
        }

        var _self = this;
        var messages = [];

        function retrieveNextMessageBatch(skip) {
            context.ctnApiProxy.listMessages(options, _self.messageBatchSize, skip, function (error, result) {
                if (error) {
                    _self.displayError(error.toString());
                }
                else {
                    messages = messages.concat(result.messages);

                    if (result.hasMore) {
                        context.setImmediate(retrieveNextMessageBatch, skip + result.msgCount);
                    }
                    else {
                        _self.processRetrievedMessages(messages);
                    }
                }
            });
        }

        retrieveNextMessageBatch(0);
    };

    CtnBlkMessageHistory.prototype.processRetrievedMessages = function (messages) {
        // Sort and index messages
        this.messages = this.indexSortMessages(messages);

        if (messages.length > 0) {
            // Calculate total number of pages
            this.totalPages = Math.ceil(messages.length / this.msgsPerPage);
            $(this.totalPagesField).text(this.totalPages);

            this.resetPageNumber(1);
        }
        else {
            this.viewMessages = [];
            this.totalPages = 0;
            this.addNoMessageEntry();
        }
    };

    CtnBlkMessageHistory.prototype.indexSortMessages = function (messages) {
        // Sort messages according to current sort column/order
        var _self = this;

        messages.sort(function (msgInfo1, msgInfo2) {
            var retVal;

            switch (_self.sortColumn) {
                case 'messageId':
                    retVal = msgInfo1.messageId.localeCompare(msgInfo2.messageId);

                    break;

                case 'type':
                    retVal = mapMsgAction(msgInfo1.action).localeCompare(mapMsgAction(msgInfo2.action));

                    break;

                case 'date':
                    retVal = moment(msgInfo1.date).diff(msgInfo2.date);

                    break;

                case 'targetDevice':
                    if (!msgInfo1.to) {
                        return 1;
                    }
                    else if (!msgInfo2.to) {
                        return -1;
                    }
                    else {
                        retVal = _self.deviceName(msgInfo1.to).localeCompare(_self.deviceName(msgInfo2.to));
                    }

                    break;

                case 'msgRead':
                    if (msgInfo1.read === undefined) {
                        return 1;
                    }
                    else if (msgInfo2.read === undefined) {
                        return -1;
                    }
                    else {
                        retVal = booleanValue(msgInfo1.read).localeCompare(booleanValue(msgInfo2.read));
                    }

                    break;
            }

            return _self.sortOrder === 'up' ? retVal : -retVal;
        });

        // And now index the messages
        this.mapIdMsgIdx = {};

        messages.forEach(function (msgInfo, idx) {
            _self.mapIdMsgIdx[msgInfo.messageId] = idx;
        });

        return messages;
    };

    CtnBlkMessageHistory.prototype.removeMessage = function (messageId) {
        var msgIdx = this.mapIdMsgIdx[messageId];

        if (msgIdx !== undefined) {
            this.messages.splice(msgIdx, 1);
            delete this.mapIdMsgIdx[messageId];

            for (var idx = msgIdx, limit = this.messages.length; idx < limit; idx++) {
                this.mapIdMsgIdx[this.messages[idx].messageId] = idx;
            }

            this.totalPages = Math.ceil(this.messages.length / this.msgsPerPage);

            var currentPageNumber = this.currentPageNumber;
            this.currentPageNumber = undefined;

            this.resetPageNumber(currentPageNumber);
        }
    };

    CtnBlkMessageHistory.prototype.resetPageNumber = function (newPageNumber) {
        if (typeof newPageNumber === 'number') {
            if (this.totalPages > 0) {
                // Make sure that number is integer
                newPageNumber = Math.floor(newPageNumber);

                if (newPageNumber < 1) {
                    newPageNumber = 1;
                } else if (newPageNumber > this.totalPages) {
                    newPageNumber = this.totalPages;
                }

                if (!this.currentPageNumber) {
                    $(this.totalPagesField).text(this.totalPages);
                }

                this.currentPageNumber = newPageNumber;
                this.pageNumberField.value = newPageNumber;

                if (newPageNumber === 1) {
                    this.disableHeaderButtons(['firstPage', 'prevPage']);

                    this.pageNumberField.disabled = this.totalPages === 1;
                } else {
                    this.enableHeaderButtons(['firstPage', 'prevPage']);
                }

                if (newPageNumber === this.totalPages) {
                    this.disableHeaderButtons(['nextPage', 'lastPage']);
                } else {
                    this.enableHeaderButtons(['nextPage', 'lastPage']);
                }

                // Separate messages to be displayed
                var startIdx = this.msgsPerPage * (newPageNumber - 1);
                this.viewMessages = this.messages.slice(startIdx, startIdx + this.msgsPerPage);

                // Display messages
                this.addMessagesToList();
            }
            else {
                this.clearHeader();
                this.currentPageNumber = undefined;
                this.addNoMessageEntry();
            }
        }
    };

    CtnBlkMessageHistory.prototype.addMessagesToList = function () {
        if (this.tableBody) {
            this.emptyMessageList();

            var $tableBody = $(this.tableBody);

            var _self = this;

            this.viewMessages.forEach(function (messageInfo) {
                $tableBody.append(_self.newMessageEntry(messageInfo));
            });
        }
    };

    CtnBlkMessageHistory.prototype.addNoMessageEntry = function () {
        if (this.tableBody) {
            this.emptyMessageList();

            $(this.tableBody).append(
                $(context.document.createElement('tr')).append(
                    $(context.document.createElement('td'))
                        .addClass('nomessage')
                        .attr('colspan', Object.keys(this.columns).length)
                        .text(__('No messages', 'catenis-blocks'))
                )
            );
        }
    };

    CtnBlkMessageHistory.prototype.newMessageEntry = function (messageInfo) {
        var $trElem = $(context.document.createElement('tr'));

        var _self = this;
        var $tdElem;

        var getOnClickHandler = function (targetHtmlAnchor, messageId) {
            return function (event) {
                event.stopPropagation();
                event.preventDefault();

                var $targetMessageId = $('#' + targetHtmlAnchor + ' input[name="messageId"]');

                if ($targetMessageId.length > 0) {
                    // Set up for receiving notification after message is read
                    $targetMessageId[0].ctnMsgReadNotify = _self.uiContainer;
                    // Send message ID and trigger event to display/save message
                    $targetMessageId.val(messageId).trigger('change');
                }
            };
        };

        Object.keys(this.columns).forEach(function (column) {
            if (_self.columns[column]) {
                switch (column) {
                    case 'action':
                        $tdElem = $(context.document.createElement('td'))
                            .addClass('action');

                        if (messageInfo.action === 'log') {
                            var hasLink = false;

                            if ((_self.actionLinks === 'both' || _self.actionLinks === 'display') && _self.displayTargetHtmlAnchor) {
                                $tdElem.append($(context.document.createElement('a'))
                                    .attr('href', '#')
                                    .text('display')
                                    .click(getOnClickHandler(_self.displayTargetHtmlAnchor, messageInfo.messageId))
                                );
                                hasLink = true;
                            }

                            if ((_self.actionLinks === 'both' || _self.actionLinks === 'save') && _self.saveTargetHtmlAnchor) {
                                if (hasLink) {
                                    $tdElem.append($(context.document.createElement('br')));
                                }

                                $tdElem.append($(context.document.createElement('a'))
                                    .attr('href', '#')
                                    .text('save')
                                    .click(getOnClickHandler(_self.saveTargetHtmlAnchor, messageInfo.messageId))
                                );
                            }
                        }

                        $trElem.append($tdElem);

                        break;

                    case 'messageId':
                        $trElem.append($(context.document.createElement('td'))
                            .addClass('messageId')
                            .attr('id', messageInfo.messageId)
                            .text(messageInfo.messageId)
                        );
                        break;

                    case 'type':
                        $trElem.append($(context.document.createElement('td'))
                            .addClass('type')
                            .text(mapMsgAction(messageInfo.action))
                        );
                        break;

                    case 'date':
                        $trElem.append($(context.document.createElement('td'))
                            .addClass('date')
                            .text(formatDate(messageInfo.date))
                        );
                        break;

                    case 'targetDevice':
                        $tdElem = $(context.document.createElement('td'))
                            .addClass('targetDevice');

                        if (messageInfo.to) {
                            $tdElem.text(_self.deviceName(messageInfo.to));
                        }

                        $trElem.append($tdElem);

                        break;

                    case 'msgRead':
                        $tdElem = $(context.document.createElement('td'))
                            .addClass('msgRead');

                        if (messageInfo.read !== undefined) {
                            $tdElem.text(booleanValue(messageInfo.read));
                        }

                        $trElem.append($tdElem);

                        break;
                }
            }
        });

        return $trElem[0];
    };

    CtnBlkMessageHistory.prototype.updateMessageEntry = function (messageId, newProps, updateDisplay, highlightEntry) {
        var msgIdx = this.mapIdMsgIdx[messageId];

        if (msgIdx !== undefined) {
            var message = this.messages[msgIdx];
            var propsUpdated = false;

            Object.keys(newProps).forEach(function (prop) {
                if ((prop in message) && message[prop] !== newProps[prop]) {
                    message[prop] = newProps[prop];
                    propsUpdated = true;
                }
            });

            if (propsUpdated && updateDisplay) {
                this.updateDisplayedMsgEntry(messageId, newProps, highlightEntry);
            }
        }
    };

    CtnBlkMessageHistory.prototype.updateDisplayedMsgEntry = function (messageId, newProps, highlightEntry) {
        var $trElem = $('td#' + messageId, this.tableBody).parent();

        if ($trElem.length > 0) {
            var columnsToHighlight = [];

            var _self = this;

            Object.keys(newProps).forEach(function (prop) {
                switch (prop) {
                    case 'messageId':
                        $('.messageId', $trElem[0]).text(newProps[prop]);
                        columnsToHighlight.push('messageId');

                        break;

                    case 'action':
                        $('.type', $trElem[0]).text(mapMsgAction(newProps[prop]));
                        columnsToHighlight.push('type');

                        break;

                    case 'date':
                        $('.date', $trElem[0]).text(formatDate(newProps[prop]));
                        columnsToHighlight.push('date');

                        break;

                    case 'to':
                        $('.targetDevice', $trElem[0]).text(_self.deviceName(newProps[prop]));
                        columnsToHighlight.push('targetDevice');

                        break;

                    case 'read':
                        $('.msgRead', $trElem[0]).text(booleanValue(newProps[prop]));
                        columnsToHighlight.push('msgRead');

                        break;
                }
            });

            if (highlightEntry) {
                this.highlightMessageEntry($trElem, messageId, columnsToHighlight);
            }
        }
    };

    CtnBlkMessageHistory.prototype.highlightMessageEntry = function ($trElem, messageId, columns) {
        if ($trElem instanceof context.jQuery || typeof $trElem === 'string') {
            if (typeof $trElem === 'string') {
                columns = messageId;
                messageId = $trElem;
                $trElem = $('td#' + messageId, this.tableBody).parent();
            }

            if ($trElem.length > 0) {
                $trElem.addClass('highlight');

                if (columns) {
                    columns = Array.isArray(columns) ? columns : [columns];

                    var selectorItems = columns.map(function (column) {
                        return 'td.' + column;
                    });

                    $(selectorItems.join(','), $trElem[0]).addClass('highlight');
                }
            }
        }
    };

    CtnBlkMessageHistory.prototype.clearMessages = function () {
        this.hideError();
        this.clearHeader();
        this.emptyMessageList();
    };

    CtnBlkMessageHistory.prototype.emptyMessageList = function () {
        if (this.tableBody) {
            $(this.tableBody).children().remove();
        }
    };

    CtnBlkMessageHistory.prototype.clearHeader = function () {
        this.disableHeaderButtons(['firstPage', 'prevPage', 'nextPage', 'lastPage']);
        this.pageNumberField.value = '';
        $(this.totalPagesField).text('');
    };

    CtnBlkMessageHistory.prototype.disableHeaderButtons = function (buttonIds) {
        if (!Array.isArray(buttonIds)) {
            buttonIds = [buttonIds];
        }
        
        var _self = this;
        
        buttonIds.forEach(function (buttonId) {
            var buttonInfo = _self.headerButton[buttonId];

            if (buttonInfo) {
                if (!buttonInfo.$elem.hasClass('disabled')) {
                    buttonInfo.$elem.addClass('disabled');
                    buttonInfo.$elem.off('click', buttonInfo.onClickHandler);
                }
            }
        });
    };

    CtnBlkMessageHistory.prototype.enableHeaderButtons = function (buttonIds) {
        if (!Array.isArray(buttonIds)) {
            buttonIds = [buttonIds];
        }

        var _self = this;

        buttonIds.forEach(function (buttonId) {
            var buttonInfo = _self.headerButton[buttonId];

            if (buttonInfo) {
                if (buttonInfo.$elem.hasClass('disabled')) {
                    buttonInfo.$elem.removeClass('disabled');
                    buttonInfo.$elem.on('click', buttonInfo.onClickHandler);
                }
            }
        });
    };

    CtnBlkMessageHistory.prototype.reload = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.listMessages();
    };

    CtnBlkMessageHistory.prototype.firstPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(1);
    };

    CtnBlkMessageHistory.prototype.previousPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(this.currentPageNumber - 1);
    };

    CtnBlkMessageHistory.prototype.nextPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(this.currentPageNumber + 1);
    };

    CtnBlkMessageHistory.prototype.lastPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(this.totalPages);
    };

    CtnBlkMessageHistory.prototype.pageNumberEntered = function (event) {
        event.stopPropagation();
        event.preventDefault();

        event.target.value = event.target.value.replace(/[^0-9]/, '');
    };

    CtnBlkMessageHistory.prototype.pageNumberChanged = function (event) {
        event.stopPropagation();
        event.preventDefault();

        var newValue = parseInt(event.target.value);

        if (isNaN(newValue)) {
            // Reset field value to current page number
            this.pageNumberField.value = this.currentPageNumber;
        }
        else {
            this.resetPageNumber(newValue);
        }
    };

    CtnBlkMessageHistory.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            this.divError.style.display = 'block';
        }
    };

    CtnBlkMessageHistory.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            this.divError.style.display = 'none';
        }
    };

    CtnBlkMessageHistory.prototype.deviceName = function (device) {
        var id = this.targetDeviceId === 'prodUniqueId' && device.prodUniqueId ? device.prodUniqueId : device.deviceId;

        return device.name ? device.name + ' (' + id + ')' : id;
    };

    function getPeriodStartDate(period) {
        var date;

        switch (period) {
            case 'today':
                date = moment().startOf('d').utc().toDate();
                break;

            case 'last_7_days':
                date = moment().add(-6,'d').startOf('d').utc().toDate();
                break;

            case 'last_30_days':
                date = moment().add(-29,'d').startOf('d').utc().toDate();
                break;

            case 'current_month':
                date = moment().startOf('M').utc().toDate();
                break;

            case 'last_3_months':
                date = moment().add(-2,'M').startOf('M').utc().toDate();
                break;

            case 'last_6_months':
                date = moment().add(-5,'M').startOf('M').utc().toDate();
                break;
        }

        return date;
    }

    function mapMsgAction(action) {
        return action === 'log' ? 'stored' : 'sent';
    }

    function formatDate(isoDate) {
        var mt = moment(isoDate);

        if (mt.locale() === 'en_US') {
            // Reset locale to default (US) english, since the locale specific formats
            //  for the (custom) en_US locale is broken
            mt.locale('en');
        }

        return mt.format('lll');
    }

    function convertLineBreak(text) {
        return text.replace(/\n/g, '<br>');
    }

    function booleanValue(value) {
        return value ? __('true', 'catenis-blocks') : __('false', 'catenis-blocks');
    }

    context.CtnBlkMessageHistory = CtnBlkMessageHistory;
})(this);