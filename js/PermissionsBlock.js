/* eslint-disable no-console */
(function (context) {
    var $ = context.jQuery;
    var __ = context.wp.i18n.__;

    function CtnBlkPermissions(uiContainer) {
        this.uiContainer = uiContainer;

        this.selEvent = undefined;
        this.selLevel = undefined;
        this.divInEntityId = undefined;
        this.inTxtEntityId = undefined;
        this.divInProdUniqueId = undefined;
        this.cbxProdUniqueId = undefined;
        this.divResult = undefined;
        this.spanPermRight = undefined;
        this.selPermRight = undefined;
        this.lnkUpdtLnk = undefined;
        this.lnkCancLnk = undefined;
        this.divShowEffectRight = undefined;
        this.cbxShowEffectRight = undefined;
        this.divError = undefined;
        this.spanError = undefined;

        this.updatePermRight = false;

        this.deviceIdInfo = undefined;

        this.entityIdDebounceInterval = 500;    // In milliseconds
        this.entityIdDebounceTimeout;

        if (this.checkCtnApiProxyAvailable(this.uiContainer)) {
            this.setHtmlElems();
            this.setProperties();
            this.getDeviceIdInfo();
            this.setEventHandlers();

            this.getPermissionRight();
        }
    }

    CtnBlkPermissions.prototype.checkCtnApiProxyAvailable = function (uiContainer) {
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

    CtnBlkPermissions.prototype.setHtmlElems = function () {
        var $elems = $('div.ctnInPermEvent select', this.uiContainer);
        if ($elems.length > 0) {
            this.selEvent = $elems[0];
        }

        $elems = $('div.ctnInLevel select', this.uiContainer);
        if ($elems.length > 0) {
            this.selLevel = $elems[0];
        }

        $elems = $('div.ctnInEntityId', this.uiContainer);
        if ($elems.length > 0) {
            this.divInEntityId = $elems[0];

            $elems = $('input[type="text"]', this.divInEntityId);
            if ($elems.length > 0) {
                this.inTxtEntityId = $elems[0];
            }

            $elems = $('div.ctnInProdUniqueId', this.divInEntityId);
            if ($elems.length > 0) {
                this.divInProdUniqueId = $elems[0];

                $elems = $('input[type="checkbox"]', this.divInProdUniqueId);
                if ($elems.length > 0) {
                    this.cbxProdUniqueId = $elems[0];
                }
            }
        }

        $elems = $('div.ctnResult', this.uiContainer);
        if ($elems.length > 0) {
            this.divResult = $elems[0];

            $elems = $('span.ctnPermRight', this.divResult);
            if ($elems.length > 0) {
                this.spanPermRight = $elems[0];
            }

            $elems = $('select.ctnPermRight', this.divResult);
            if ($elems.length > 0) {
                this.selPermRight = $elems[0];
            }

            $elems = $('a.ctnUpdtLnk', this.divResult);
            if ($elems.length > 0) {
                this.lnkUpdtLnk = $elems[0];
            }

            $elems = $('a.ctnCancLnk', this.divResult);
            if ($elems.length > 0) {
                this.lnkCancLnk = $elems[0];
            }

            $elems = $('div.ctnShowEffectRight', this.divResult);
            if ($elems.length > 0) {
                this.divShowEffectRight = $elems[0];

                $elems = $('input[type="checkbox"]', this.divShowEffectRight);
                if ($elems.length > 0 ) {
                    this.cbxShowEffectRight = $elems[0];
                }
            }
        }

        $elems = $('div.ctnError', this.uiContainer);
        if ($elems.length > 0) {
            this.divError = $elems[0];

            $elems = $('span.ctnError', this.divError);
            if ($elems.length > 0) {
                this.spanError = $elems[0];
            }
        }
    };

    CtnBlkPermissions.prototype.setProperties = function () {
        Object.defineProperties(this, {
            selectedEvent: {
                get: function () {
                    return this.selEvent.value;
                },
                enumerable: true
            },
            selectedLevel: {
                get: function () {
                    return this.selLevel.value;
                },
                enumerable: true
            },
            entityId: {
                get: function () {
                    var result;
                    var val;

                    if (this.shouldEnterEntityId() && (val = this.inTxtEntityId.value.trim()).length > 0) {
                        result = val;
                    }

                    return result;
                },
                enumerable: true
            },
            isProdUniqueId: {
                get: function () {
                    return this.cbxProdUniqueId.checked;
                },
                enumerable: true
            },
            permissionRight: {
                get: function () {
                    return getPermRightByTextValue(this.spanPermRight.innerText);
                },
                set: function (val) {
                    this.spanPermRight.innerText = CtnBlkPermissions.permRights[val];
                },
                enumerable: true
            },
            permissionRightToUpdate: {
                get: function () {
                    var result;
                    var permRight;

                    if (this.updatePermRight && (permRight = this.selPermRight.value)) {
                        result = permRight;
                    }

                    return result;
                },
                enumerable: true
            },
            showEffectiveRight: {
                get: function () {
                    return this.cbxShowEffectRight.checked;
                },
                enumerable: true
            },
        });
    };

    CtnBlkPermissions.prototype.getDeviceIdInfo = function () {
        var _self = this;

        function retrieveDeviceIdInfo(firstTry) {
            context.ctnApiProxy.retrieveDeviceIdentificationInfo('self', function (error, data) {
                if (!error) {
                    _self.deviceIdInfo = {
                        ctnNodeIndex: data.catenisNode.ctnNodeIndex.toString(),
                        clientId: data.client.clientId,
                        deviceId: data.device.deviceId
                    };

                    if (!firstTry) {
                        setRetrieveDeviceIdInfo(false);
                    }
                }
                else {
                    if ((error instanceof Error) && error.message.endsWith('[403] No permission to retrieve info')) {
                        setRetrieveDeviceIdInfo(true);
                    }
                }
            });
        }

        function setRetrieveDeviceIdInfo(enable) {
            var right = enable ? {allow:{id:'self'}} : {deny:{id:'self'}};

            context.ctnApiProxy.setPermissionRights('disclose-identity-info', {device: right},
                function (error) {
                    if (!error && enable) {
                        retrieveDeviceIdInfo(false);
                    }
                }
            )
        }

        retrieveDeviceIdInfo(true);
    };

    CtnBlkPermissions.prototype.setEventHandlers = function () {
        $(this.selEvent).on('change', this.permissionEventChanged.bind(this));
        $(this.selLevel).on('change', this.levelChanged.bind(this));
        $(this.inTxtEntityId).on('input', this.entityIdInput.bind(this));
        $(this.cbxProdUniqueId).on('change', this.prodUniqueIDChanged.bind(this));
        $(this.lnkUpdtLnk).on('click', this.updateClicked.bind(this));
        $(this.selPermRight).on('change', this.permRightChanged.bind(this));
        $(this.lnkCancLnk).on('click', this.cancelClicked.bind(this));
        $(this.cbxShowEffectRight).on('change', this.showEffectiveRightChanged.bind(this));
    };

    CtnBlkPermissions.prototype.shouldEnterEntityId = function () {
        return this.selectedLevel !== 'system';
    };

    CtnBlkPermissions.prototype.isDeviceEntity = function () {
        return this.selectedLevel === 'device';
    };

    CtnBlkPermissions.prototype.showEntityIdInput = function () {
        this.divInProdUniqueId.style.display = this.isDeviceEntity() ? 'block' : 'none';
        this.inTxtEntityId.value = '';
        this.divInEntityId.style.display = 'block';
    };

    CtnBlkPermissions.prototype.hideEntityIdInput = function () {
        this.divInEntityId.style.display = 'none';
        this.inTxtEntityId.value = '';
        this.divInProdUniqueId.style.display = 'none';
    };

    CtnBlkPermissions.prototype.showResult = function () {
        if (this.isDeviceEntity()) {
            this.divShowEffectRight.style.display = 'block';
        }

        if (this.isDeviceEntity() && this.showEffectiveRight) {
            this.updatePermRight = false;

            this.spanPermRight.style.display = 'inline';
            this.selPermRight.style.display = 'none';
            this.lnkUpdtLnk.style.display = 'none';
            this.lnkCancLnk.style.display = 'none';
        }
        else if (this.updatePermRight) {
            if (this.selectedLevel === 'system') {
                this.removeNonePermRightOption();
            }
            else {
                this.addNonePermRightOption();
            }

            this.selPermRight.value = this.permissionRight;

            this.spanPermRight.style.display = 'none';
            this.selPermRight.style.display = 'inline';
            this.lnkUpdtLnk.style.display = 'none';
            this.lnkCancLnk.style.display = 'inline';
        }
        else {
            this.spanPermRight.style.display = 'inline';
            this.selPermRight.style.display = 'none';
            this.lnkUpdtLnk.style.display = 'inline';
            this.lnkCancLnk.style.display = 'none';
        }

        this.divResult.style.display = 'block';
    };

    CtnBlkPermissions.prototype.removeNonePermRightOption = function () {
        if (this.selPermRight.options.length > 2) {
            this.selPermRight.remove(2);
        }
    };

    CtnBlkPermissions.prototype.addNonePermRightOption = function () {
        if (this.selPermRight.options.length < 3) {
            var optElem = document.createElement('option');
            optElem.value = 'none';
            optElem.text = CtnBlkPermissions.permRights.none;

            this.selPermRight.add(optElem);
        }
    };

    CtnBlkPermissions.prototype.hideResult = function () {
        this.divResult.style.display = 'none';
        this.divShowEffectRight.style.display = 'none';
    };

    CtnBlkPermissions.prototype.setError = function (errMsg) {
        this.spanError.innerText = errMsg;
        this.divError.style.display = 'block';
    };

    CtnBlkPermissions.prototype.clearError = function () {
        this.divError.style.display = 'none';
        this.spanError.innerText = '';
    };

    CtnBlkPermissions.prototype.getPermissionRight = function () {
        var _self = this;

        if (!this.shouldEnterEntityId() || this.entityId) {
            this.hideResult();
            this.clearError();
            this.updatePermRight = false;

            // Retrieve permission rights
            if (this.isDeviceEntity() && (this.showEffectiveRight || this.isProdUniqueId)) {
                context.ctnApiProxy.checkEffectivePermissionRight(
                    this.selectedEvent, this.entityId, this.isProdUniqueId,
                    function (error, data) {
                        if (error) {
                            _self.setError(error.toString());
                        }
                        else {
                            if (!_self.showEffectiveRight) {
                                // Check effective permission right has only been called to get
                                //  device ID (from supplied product unique ID)
                                retrievePermissionRights(Object.keys(data)[0]);
                            }
                            else {
                                processResult(Object.values(data)[0]);
                            }
                        }
                    }
                );
            }
            else {
                var entityId;

                if (this.shouldEnterEntityId && this.entityId === 'self'
                        && (!this.isDeviceEntity() || !this.isProdUniqueId) && this.deviceIdInfo) {
                    // Convert 'self' to respective entity ID
                    switch (this.selectedLevel) {
                        case 'ctnNode':
                            entityId = this.deviceIdInfo.catenisNodeIndex;
                            break;

                        case 'client':
                            entityId = this.deviceIdInfo.clientId;
                            break;

                        case 'device':
                            entityId = this.deviceIdInfo.deviceId;
                            break;
                    }
                }
                else {
                    entityId = this.entityId;
                }

                retrievePermissionRights(entityId);
            }
        }

        function retrievePermissionRights(entityId) {
            context.ctnApiProxy.retrievePermissionRights(_self.selectedEvent, function (error, data) {
                if (error) {
                    _self.setError(error.toString());
                }
                else {
                    // Parse returned data to compute permission right for entity
                    var permRight;

                    switch (_self.selectedLevel) {
                        case 'system':
                            permRight = data.system;
                            break;

                        case 'ctnNode':
                            if (data.catenisNode) {
                                if (data.catenisNode.allow) {
                                    if (data.catenisNode.allow.some(function (index) {
                                        return index === entityId;
                                    })) {
                                        permRight = 'allow';
                                        break;
                                    }
                                }

                                if (data.catenisNode.deny) {
                                    if (data.catenisNode.deny.some(function (index) {
                                        return index === entityId;
                                    })) {
                                        permRight = 'deny';
                                    }
                                }
                            }

                            break;

                        case 'client':
                            if (data.client) {
                                if (data.client.allow) {
                                    if (data.client.allow.some(function (id) {
                                        return id === entityId;
                                    })) {
                                        permRight = 'allow';
                                        break;
                                    }
                                }

                                if (data.client.deny) {
                                    if (data.client.deny.some(function (id) {
                                        return id === entityId;
                                    })) {
                                        permRight = 'deny';
                                    }
                                }
                            }

                            break;


                        case 'device':
                            if (data.device) {
                                if (data.device.allow) {
                                    if (data.device.allow.some(function (obj) {
                                        return obj.deviceId === entityId;
                                    })) {
                                        permRight = 'allow';
                                        break;
                                    }
                                }

                                if (data.device.deny) {
                                    if (data.device.deny.some(function (obj) {
                                        return obj.deviceId === entityId;
                                    })) {
                                        permRight = 'deny';
                                    }
                                }
                            }

                            break;
                    }

                    processResult(permRight || 'none');
                }
            });
        }

        function processResult(permRight) {
            _self.permissionRight = permRight;
            _self.showResult();
        }
    };

    CtnBlkPermissions.prototype.setPermissionRight = function () {
        var _self = this;

        if (this.permissionRightToUpdate && (!this.shouldEnterEntityId() || this.entityId)) {
            var rights;
            var right;

            switch (this.selectedLevel) {
                case 'system':
                    rights = {system: this.permissionRightToUpdate};
                    break;

                case 'ctnNode':
                    right = {};
                    right[this.permissionRightToUpdate] = this.entityId;

                    rights = {catenisNode: right};
                    break;

                case 'client':
                    right = {};
                    right[this.permissionRightToUpdate] = this.entityId;

                    rights = {client: right};
                    break;

                case 'device':
                    right = {};
                    right[this.permissionRightToUpdate] = {
                        id: this.entityId,
                        isProdUniqueId: this.isProdUniqueId
                    };

                    rights = {device: right};
                    break;
            }

            this.clearError();

            context.ctnApiProxy.setPermissionRights(this.selectedEvent, rights, function (error) {
                if (error) {
                    _self.setError(error.toString());
                }
                else {
                    _self.getPermissionRight();
                }
            });
        }
    };

    CtnBlkPermissions.prototype.permissionEventChanged = function (event) {
        this.getPermissionRight();
    };

    CtnBlkPermissions.prototype.levelChanged = function (event) {
        if (this.shouldEnterEntityId()) {
            this.showEntityIdInput();

            this.hideResult();
        }
        else {
            this.hideEntityIdInput();

            this.getPermissionRight();
        }
    };

    CtnBlkPermissions.prototype.entityIdInput = function (event) {
        var _self = this;

        doDeviceIdInputDebounce(function () {
            if (_self.entityId) {
                _self.getPermissionRight();
            }
            else {
                _self.hideResult();
            }
        });

        function doDeviceIdInputDebounce(procFunc) {
            if (_self.entityIdDebounceTimeout) {
                clearTimeout(_self.entityIdDebounceTimeout);
            }
    
            _self.entityIdDebounceTimeout = setTimeout(function () {
                clearTimeout(_self.entityIdDebounceTimeout);
    
                procFunc();
            }, _self.entityIdDebounceInterval);
        }        
    };

    CtnBlkPermissions.prototype.prodUniqueIDChanged = function (event) {
        this.getPermissionRight();
    };

    CtnBlkPermissions.prototype.updateClicked = function (event) {
        event.stopPropagation();
        event.preventDefault();

        if (this.permissionRight) {
            this.updatePermRight = true;

            this.showResult();
        }
    };

    CtnBlkPermissions.prototype.permRightChanged = function (event) {
        if (this.permissionRightToUpdate !== this.permRight) {
            this.setPermissionRight();
        }
    };

    CtnBlkPermissions.prototype.cancelClicked = function (event) {
        event.stopPropagation();
        event.preventDefault();

        this.updatePermRight = false;
        this.showResult();
};

    CtnBlkPermissions.prototype.showEffectiveRightChanged = function (event) {
        this.getPermissionRight();
    };

    CtnBlkPermissions.permRights = Object.seal({
        allow: __('allow', 'catenis-blocks'),
        deny: __('deny', 'catenis-blocks'),
        none: __('none', 'catenis-blocks')
    });

    function getPermRightByTextValue(textValue) {
        return Object.keys(CtnBlkPermissions.permRights).find(function (permRight) {
            return CtnBlkPermissions.permRights[permRight] === textValue;
        });
    }

    context.CtnBlkPermissions = CtnBlkPermissions;
})(this);