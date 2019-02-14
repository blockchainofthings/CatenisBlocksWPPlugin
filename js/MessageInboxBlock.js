(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var moment = context.moment;

    function CtnBlkMessageInbox(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.unreadOnly = props.unreadOnly;
            this.period = props.period;
            this.customStartDate = props.customStartDate;
            this.customEndDate = props.customEndDate;
            this.msgsPerPage = props.msgsPerPage;
            this.columns = JSON.parse(props.columns);
            this.actionLinks = props.actionLinks;
            this.originDeviceId = props.originDeviceId;
            this.displayTargetHtmlAnchor = props.displayTargetHtmlAnchor;
            this.saveTargetHtmlAnchor = props.saveTargetHtmlAnchor;
            this.headerPanel = undefined;
            this.newMsgAlert = undefined;
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

            this.setHeaderElements();
            this.setTableElements();
            this.setErrorPanel();
            this.setUpNotification();
        }
    }

    CtnBlkMessageInbox.prototype.setUpNotification = function () {
        $(this.uiContainer).on('ctn-msg-read', this.processCtnMsgReadNotify.bind(this));

        var _self = this;

        context.ctnApiProxy.on('comm_error', function (error) {
            // Error communicating with Catenis notification process
            console.error('Catenis notification process error:', error);
        });

        context.ctnApiProxy.on('notify_channel_opened', function (eventName, success, error) {
            if (success) {
                // Underlying WebSocket connection successfully established
                console.log('[' + eventName + '] - Catenis notification channel successfully opened');
            }
            else {
                // Error establishing underlying WebSocket connection
                console.error('[' + eventName + '] - Error establishing Catenis notification channel:', error);
            }
        });

        context.ctnApiProxy.on('notify_channel_error', function (eventName, error) {
            // Error in the underlying WebSocket connection
            console.error('[' + eventName + '] - Catenis notification WebSocket connection error:', error);
        });

        context.ctnApiProxy.on('notify_channel_closed', function (eventName, code, reason) {
            // Underlying WebSocket connection has been closed
            console.error('[' + eventName + '] - Catenis notification channel closed; code: ' + code + ', reason: ' + reason);
        });

        context.ctnApiProxy.on('notification', function (eventName, eventData) {
            switch (eventName) {
                case 'new-msg-received':
                    _self.processNewMessageReceived(eventData);
            }
        });

        context.ctnApiProxy.openNotifyChannel('new-msg-received', function (error) {
            if (error) {
                // Error from calling method
                console.error('Error opening Catenis notification channel:', error);
            }
        });
    };

    CtnBlkMessageInbox.prototype.processNewMessageReceived = function (eventData) {
        this.setNewMessageAlertOn();
    };

    CtnBlkMessageInbox.prototype.processCtnMsgReadNotify = function (event, messageId) {
        if (this.unreadOnly) {
            // Remove already read message
            this.removeMessage(messageId);
        }
        else {
            // Update message's read state
            this.updateMessageEntry(messageId, {read: true}, true, true);
        }
    };

    CtnBlkMessageInbox.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
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

    CtnBlkMessageInbox.prototype.setHeaderElements = function () {
        var $headerPanel = $('div.header', this.uiContainer);

        if ($headerPanel.length > 0) {
            this.headerPanel = $headerPanel[0];

            var $newMsgAlert = $('span.new-msg-alert', this.headerPanel);

            if ($newMsgAlert.length > 0) {
                this.newMsgAlert = $newMsgAlert[0];
            }

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

    CtnBlkMessageInbox.prototype.setTableElements = function () {
        var elems = $('tbody', this.uiContainer);
        if (elems.length > 0) {
            this.tableBody = elems[0];
        }
    };

    CtnBlkMessageInbox.prototype.setErrorPanel = function () {
        var elems = $('div.error', this.uiContainer);
        if (elems.length > 0) {
            this.divError = elems[0];

            elems = $('p.error', this.divError);
            if (elems.length > 0) {
                this.txtError = elems[0];
            }
        }
    };

    CtnBlkMessageInbox.prototype.listMessages = function () {
        this.setNewMessageAlertOff();
        this.clearMessages();

        var options = {
            action: 'send',
            direction: 'inbound'
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

        context.ctnApiProxy.listMessages(options, function (error, result) {
            if (error) {
                _self.displayError(error.toString());
            }
            else {
                if (result.countExceeded) {
                    _self.displayError(__('Maximum number of allowed returned messages has been exceeded; not all messages have been retrieved', 'catenis-block'));
                }

                _self.processRetrievedMessages(result.messages);
            }
        })
    };

    CtnBlkMessageInbox.prototype.processRetrievedMessages = function (messages) {
        // Reverse retrieved list so last stored/sent messages are shown first
        this.messages = this.indexReverseMessages(messages);

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

    CtnBlkMessageInbox.prototype.indexReverseMessages = function (messages) {
        this.mapIdMsgIdx = {};
        var reversedMessages = [];

        for (var idx = messages.length - 1, mapIdx = 0; idx >= 0; idx--, mapIdx++) {
            var message = messages[idx];

            this.mapIdMsgIdx[message.messageId] = mapIdx;
            reversedMessages.push(message);
        }

        return reversedMessages;
    };

    CtnBlkMessageInbox.prototype.removeMessage = function (messageId) {
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

    CtnBlkMessageInbox.prototype.resetPageNumber = function (newPageNumber) {
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

    CtnBlkMessageInbox.prototype.addMessagesToList = function () {
        if (this.tableBody) {
            this.emptyMessageList();

            var $tableBody = $(this.tableBody);

            var _self = this;

            this.viewMessages.forEach(function (messageInfo) {
                $tableBody.append(_self.newMessageEntry(messageInfo));
            });
        }
    };

    CtnBlkMessageInbox.prototype.addNoMessageEntry = function () {
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

    CtnBlkMessageInbox.prototype.newMessageEntry = function (messageInfo) {
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

                        $trElem.append($tdElem);

                        break;

                    case 'messageId':
                        $trElem.append($(context.document.createElement('td'))
                            .addClass('messageId')
                            .attr('id', messageInfo.messageId)
                            .text(messageInfo.messageId)
                        );
                        break;

                    case 'date':
                        $trElem.append($(context.document.createElement('td'))
                            .addClass('date')
                            .text(formatDate(messageInfo.date))
                        );
                        break;

                    case 'originDevice':
                        $tdElem = $(context.document.createElement('td'))
                            .addClass('originDevice');

                        if (messageInfo.from) {
                            $tdElem.text(_self.deviceName(messageInfo.from));
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

    CtnBlkMessageInbox.prototype.updateMessageEntry = function (messageId, newProps, updateDisplay, highlightEntry) {
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

    CtnBlkMessageInbox.prototype.updateDisplayedMsgEntry = function (messageId, newProps, highlightEntry) {
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

                    case 'date':
                        $('.date', $trElem[0]).text(formatDate(newProps[prop]));
                        columnsToHighlight.push('date');

                        break;

                    case 'to':
                        $('.originDevice', $trElem[0]).text(_self.deviceName(newProps[prop]));
                        columnsToHighlight.push('originDevice');

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

    CtnBlkMessageInbox.prototype.highlightMessageEntry = function ($trElem, messageId, columns) {
        if ($trElem instanceof jQuery || typeof $trElem === 'string') {
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

    CtnBlkMessageInbox.prototype.setNewMessageAlertOn = function () {
        $(this.newMsgAlert).removeClass('off');
    };

    CtnBlkMessageInbox.prototype.setNewMessageAlertOff = function () {
        $(this.newMsgAlert).addClass('off');
    };

    CtnBlkMessageInbox.prototype.clearMessages = function () {
        this.hideError();
        this.clearHeader();
        this.emptyMessageList();
    };

    CtnBlkMessageInbox.prototype.emptyMessageList = function () {
        if (this.tableBody) {
            $(this.tableBody).children().remove();
        }
    };

    CtnBlkMessageInbox.prototype.clearHeader = function () {
        this.disableHeaderButtons(['firstPage', 'prevPage', 'nextPage', 'lastPage']);
        this.pageNumberField.value = '';
        $(this.totalPagesField).text('');
    };

    CtnBlkMessageInbox.prototype.disableHeaderButtons = function (buttonIds) {
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

    CtnBlkMessageInbox.prototype.enableHeaderButtons = function (buttonIds) {
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

    CtnBlkMessageInbox.prototype.reload = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.listMessages();
    };

    CtnBlkMessageInbox.prototype.firstPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(1);
    };

    CtnBlkMessageInbox.prototype.previousPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(this.currentPageNumber - 1);
    };

    CtnBlkMessageInbox.prototype.nextPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(this.currentPageNumber + 1);
    };

    CtnBlkMessageInbox.prototype.lastPage = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.resetPageNumber(this.totalPages);
    };

    CtnBlkMessageInbox.prototype.pageNumberEntered = function (event) {
        event.stopPropagation();
        event.preventDefault();

        event.target.value = event.target.value.replace(/[^0-9]/, '');
    };

    CtnBlkMessageInbox.prototype.pageNumberChanged = function (event) {
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

    CtnBlkMessageInbox.prototype.displayError = function (text) {
        if (this.txtError) {
            $(this.txtError).html(convertLineBreak(text));

            this.divError.style.display = 'block';
        }
    };

    CtnBlkMessageInbox.prototype.hideError = function () {
        if (this.txtError) {
            $(this.txtError).html('');

            this.divError.style.display = 'none';
        }
    };

    CtnBlkMessageInbox.prototype.deviceName = function (device) {
        var id = this.originDeviceId === 'prodUniqueId' && device.prodUniqueId ? device.prodUniqueId : device.deviceId;

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

    context.CtnBlkMessageInbox = CtnBlkMessageInbox;
})(this);