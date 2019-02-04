(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var moment = context.moment;

    function CtnBlkMessageHistory(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.msgAction = props.msgAction;
            this.period = props.period;
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
            this.totalPages = undefined;
            this.currentPageNumber = undefined;
            this.viewMessages = undefined;

            this.setHeaderElements();
            this.setTableElements();
            this.setErrorPanel();
            this.setUpNotification();
        }
    }

    CtnBlkMessageHistory.prototype.setUpNotification = function () {
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
                case 'sent-msg-read':
                    _self.processReadConfirmation(eventData);
            }
        });

        context.ctnApiProxy.openNotifyChannel('sent-msg-read', function (error) {
            if (error) {
                // Error from calling method
                console.error('Error opening Catenis notification channel:', error);
            }
        });
    };

    CtnBlkMessageHistory.prototype.processCtnMsgReadNotify = function (event, messageId) {
        // Update message's read confirmation state
        this.updateMessageEntry(messageId, {read: true}, true, true);
    };

    CtnBlkMessageHistory.prototype.processReadConfirmation = function (eventData) {
        // Update message's read confirmation state
        this.updateMessageEntry(eventData.messageId, {read: true}, true, true);
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
        var elems = $('tbody', this.uiContainer);
        if (elems.length > 0) {
            this.tableBody = elems[0];
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
            action: this.action,
            direction: 'outbound',
            startDate: getPeriodStartDate(this.period)
        };

        var _self = this;

        context.ctnApiProxy.listMessages(options, function (error, result) {
            if (error) {
                _self.displayError(error.toString());
            }
            else {
                _self.processRetrievedMessages(result.messages);
            }
        })
    };

    CtnBlkMessageHistory.prototype.processRetrievedMessages = function (messages) {
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
            this.addNoMessageEntry();
        }
    };

    CtnBlkMessageHistory.prototype.indexReverseMessages = function (messages) {
        this.mapIdMsgIdx = {};
        var reversedMessages = [];

        for (var idx = messages.length - 1, mapIdx = 0; idx >= 0; idx--, mapIdx++) {
            var message = messages[idx];

            this.mapIdMsgIdx[message.messageId] = mapIdx;
            reversedMessages.push(message);
        }

        return reversedMessages;
    };

    CtnBlkMessageHistory.prototype.resetPageNumber = function (newPageNumber) {
        if (newPageNumber > 0 && newPageNumber <= this.totalPages) {
            this.currentPageNumber = newPageNumber;
            this.pageNumberField.value = newPageNumber;

            if (newPageNumber === 1) {
                this.disableHeaderButtons(['firstPage', 'prevPage']);

                this.pageNumberField.disabled = this.totalPages === 1;
            }
            else {
                this.enableHeaderButtons(['firstPage', 'prevPage']);
            }

            if (newPageNumber === this.totalPages) {
                this.disableHeaderButtons(['nextPage', 'lastPage']);
            }
            else {
                this.enableHeaderButtons(['nextPage', 'lastPage']);
            }

            // Separate messages to be displayed
            var startIdx = this.msgsPerPage * (newPageNumber - 1);
            this.viewMessages = this.messages.slice(startIdx, startIdx + this.msgsPerPage);

            // Display messages
            this.addMessagesToList();
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
        $(this.tableBody).append(
            $(context.document.createElement('tr')).append(
                $(context.document.createElement('td'))
                    .addClass('nomessage')
                    .attr('colspan', Object.keys(this.columns).length)
                    .text(__('No messages', 'catenis-blocks'))
            )
        );
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

    CtnBlkMessageHistory.prototype.pageNumberChanged = function (event) {
        event.stopPropagation();
        event.preventDefault();

        var newValue = parseInt(event.target.value);

        if (isNaN(newValue) || newValue < 0 || newValue > this.totalPages) {
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