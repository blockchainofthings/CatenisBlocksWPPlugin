(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;
    var moment = context.moment;

    function CtnBlkMessageHistory(uiContainer, props) {
        this.uiContainer = uiContainer;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.msgAction = props.msgAction;
            this.period = props.period;
            this.columns = JSON.parse(props.columns);
            this.actionLinks = props.actionLinks;
            this.displayTargetHtmlAnchor = props.displayTargetHtmlAnchor;
            this.saveTargetHtmlAnchor = props.saveTargetHtmlAnchor;
            this.tableBody = undefined;
            this.msgContainer = undefined;
            this.divError = undefined;
            this.txtError = undefined;

            this.setTableElements();
            this.setErrorPanel();
        }
    }

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
                _self.addMessagesToList(result.messages);
            }
        })
    };

    CtnBlkMessageHistory.prototype.addMessagesToList = function (messages) {
        if (this.tableBody) {
            var $tableBody = $(this.tableBody);

            var _self = this;

            messages.forEach(function (messageInfo) {
                $tableBody.prepend(_self.newMessageEntry(messageInfo));
            });
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

                var elems = $('#' + targetHtmlAnchor + ' input[name="messageId"]');

                if (elems.length > 0) {
                    elems.val(messageId).trigger('change');
                }
            };
        };

        Object.keys(this.columns).forEach(function (column) {
            if (_self.columns[column]) {
                switch (column) {
                    case 'action':
                        $tdElem = $(context.document.createElement('td'));

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
                            .text(messageInfo.messageId)
                        );
                        break;

                    case 'type':
                        $trElem.append($(context.document.createElement('td'))
                            .text(mapMsgAction(messageInfo.action))
                        );
                        break;

                    case 'date':
                        $trElem.append($(context.document.createElement('td'))
                            .text(formatDate(messageInfo.date))
                        );
                        break;

                    case 'targetDevice':
                        $tdElem = $(context.document.createElement('td'));

                        if (messageInfo.to) {
                            $tdElem.text(deviceName(messageInfo.to));
                        }

                        $trElem.append($tdElem);

                        break;

                    case 'msgRead':
                        $tdElem = $(context.document.createElement('td'));

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

    function deviceName(device) {
        var id = device.prodUniqueId ? device.prodUniqueId : device.deviceId;

        return device.name ? device.name + '(' + id + ')' : id;
    }

    function booleanValue(value) {
        return value ? __('true', 'catenis-blocks') : __('false', 'catenis-blocks');
    }

    context.CtnBlkMessageHistory = CtnBlkMessageHistory;
})(this);