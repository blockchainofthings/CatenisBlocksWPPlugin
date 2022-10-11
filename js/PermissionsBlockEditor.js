(function (context) {
    var $ = context.jQuery;
    var wp = context.wp;
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;
    var cmp = wp.components;

    var defEvents = {
        'receive-notify-new-msg': true,
        'receive-notify-msg-read': true,
        'receive-msg': true,
        'send-read-msg-confirm': true,
        'disclose-main-props': true,
        'disclose-identity-info': true
    };
    var defLevels = {
        'system': true,
        'ctnNode': true,
        'client': true,
        'device': true
    };

    registerBlockType('catenis-blocks/permissions', {
        title: __('Permissions', 'catenis-blocks'),
        description: __('Manage Catenis permissions', 'catenis-blocks'),
        category: 'catenis',
        keywords: [
            'Catenis',
            'Blockchain',
            'Permissions'
        ],
        supports: {
            html: false     // Removes support for an HTML mode
        },
        attributes: {
            events: {
                type: 'string'
            },
            levels: {
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
            var events = props.attributes.events !== undefined ? JSON.parse(props.attributes.events) : defEvents;
            var levels = props.attributes.levels !== undefined ? JSON.parse(props.attributes.levels) : defLevels;

            function numEventEntries() {
                return Object.values(events).reduce(function (count, val) {
                    if (val) {
                        count++;
                    }

                    return count;
                }, 0)
            }

            function onChangeRecvNtfyNewMsgEvent(newState) {
                if (newState || numEventEntries() > 1) {
                    events['receive-notify-new-msg'] = newState;

                    props.setAttributes({
                        events: JSON.stringify(events)
                    });
                }
            }

            function onChangeRecvNtfyMsgReadEvent(newState) {
                if (newState || numEventEntries() > 1) {
                    events['receive-notify-msg-read'] = newState;

                    props.setAttributes({
                        events: JSON.stringify(events)
                    });
                }
            }

            function onChangeRecvMsgEvent(newState) {
                if (newState || numEventEntries() > 1) {
                    events['receive-msg'] = newState;

                    props.setAttributes({
                        events: JSON.stringify(events)
                    });
                }
            }

            function onChangeSndReadMsgConfirmEvent(newState) {
                if (newState || numEventEntries() > 1) {
                    events['send-read-msg-confirm'] = newState;

                    props.setAttributes({
                        events: JSON.stringify(events)
                    });
                }
            }

            function onChangeDisclMainPropsEvent(newState) {
                if (newState || numEventEntries() > 1) {
                    events['disclose-main-props'] = newState;

                    props.setAttributes({
                        events: JSON.stringify(events)
                    });
                }
            }

            function onChangeDisclIdInfoEvent(newState) {
                if (newState || numEventEntries() > 1) {
                    events['disclose-identity-info'] = newState;

                    props.setAttributes({
                        events: JSON.stringify(events)
                    });
                }
            }

            function onChangeSystemLevel(newState) {
                levels.system = newState;

                props.setAttributes({
                    levels: JSON.stringify(levels)
                });
            }

            function onChangeCtnNodeLevel(newState) {
                levels.ctnNode = newState;

                props.setAttributes({
                    levels: JSON.stringify(levels)
                });
            }

            function onChangeClientLevel(newState) {
                levels.client = newState;

                props.setAttributes({
                    levels: JSON.stringify(levels)
                });
            }

            var blockEditor = wp.blockEditor || wp.editor;

            return (
                el(wp.element.Fragment, {},
                    // Inspector sidebar controls
                    el(blockEditor.InspectorControls, {},
                        el(cmp.PanelBody, {
                                title: __('Permission Selection', 'catenis-blocks'),
                                initialOpen: true
                            },
                            el(cmp.CheckboxControl, {
                                heading: __('Permission Events', 'catenis-blocks'),
                                label: __('receive-notify-new-msg', 'catenis-blocks'),
                                checked: events['receive-notify-new-msg'],
                                onChange: onChangeRecvNtfyNewMsgEvent,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('receive-notify-msg-read', 'catenis-blocks'),
                                checked: events['receive-notify-msg-read'],
                                onChange: onChangeRecvNtfyMsgReadEvent,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('receive-msg', 'catenis-blocks'),
                                checked: events['receive-msg'],
                                onChange: onChangeRecvMsgEvent,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('send-read-msg-confirm', 'catenis-blocks'),
                                checked: events['send-read-msg-confirm'],
                                onChange: onChangeSndReadMsgConfirmEvent,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('disclose-main-props', 'catenis-blocks'),
                                checked: events['disclose-main-props'],
                                onChange: onChangeDisclMainPropsEvent,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('disclose-identity-info', 'catenis-blocks'),
                                help: __('Select the permission rights to choose', 'catenis-blocks'),
                                checked: events['disclose-identity-info'],
                                onChange: onChangeDisclIdInfoEvent,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                heading: __('Levels', 'catenis-blocks'),
                                label: __('System', 'catenis-blocks'),
                                checked: levels['system'],
                                onChange: onChangeSystemLevel,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Catenis Node', 'catenis-blocks'),
                                checked: levels['ctnNode'],
                                onChange: onChangeCtnNodeLevel,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Client', 'catenis-blocks'),
                                checked: levels['client'],
                                onChange: onChangeClientLevel,
                                className: 'ctnPermListEntry'
                            }),
                            el(cmp.CheckboxControl, {
                                label: __('Device', 'catenis-blocks'),
                                help: __('Select the levels to choose', 'catenis-blocks'),
                                checked: levels['device'],
                                disabled: true,
                                className: 'ctnPermListEntry'
                            })
                        )
                    ),
                    // Block controls
                    el('div', {
                        className: props.className
                    },
                        el('div', {
                            className: 'ctnInPermEvent'
                        },
                            el('label', {}, 'Permission Event:'),
                            el('br'),
                            el('select', {},
                                (function () {
                                    var eventOpts = [];

                                    if (events['receive-notify-new-msg']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'receive-notify-new-msg',
                                                value: 'receive-notify-new-msg'
                                            }, __('Receive notification of new message from a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['receive-notify-msg-read']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'receive-notify-msg-read',
                                                value: 'receive-notify-msg-read'
                                            }, __('Receive notification of message read by a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['receive-msg']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'receive-msg',
                                                value: 'receive-msg'
                                            }, __('Receive message from a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['send-read-msg-confirm']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'send-read-msg-confirm',
                                                value: 'send-read-msg-confirm'
                                            }, __('Send read message confirmation to a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['disclose-main-props']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'disclose-main-props',
                                                value: 'disclose-main-props'
                                            }, __('Disclose device\'s main properties (name, product unique ID) to a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['disclose-identity-info']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'disclose-identity-info',
                                                value: 'disclose-identity-info'
                                            }, __('Disclose device\'s basic identification information to a device', 'catenis-blocks'))
                                        );
                                    }

                                    return eventOpts;
                                })()
                            )
                        ),
                        el('div', {
                            className: 'ctnInLevel'
                        },
                            el('label', {}, 'Level:'),
                            el('br'),
                            el('select', {},
                                (function () {
                                    var levelOpts = [];

                                    if (levels['system']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'system',
                                                value: 'system'
                                            }, __('System', 'catenis-blocks'))
                                        );
                                    }

                                    if (levels['ctnNode']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'ctn-node',
                                                value: 'ctnNode'
                                            }, __('Catenis Node', 'catenis-blocks'))
                                        );
                                    }

                                    if (levels['client']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'client',
                                                value: 'client'
                                            }, __('Client', 'catenis-blocks'))
                                        );
                                    }

                                    if (levels['device']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'device',
                                                value: 'device'
                                            }, __('Device', 'catenis-blocks'))
                                        );
                                    }

                                    return levelOpts;
                                })()
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
            var events = props.attributes.events !== undefined ? JSON.parse(props.attributes.events) : defEvents;
            var levels = props.attributes.levels !== undefined ? JSON.parse(props.attributes.levels) : defLevels;

            return (
                el('div', {},
                    el('div', {
                        className: 'uicontainer'
                    },
                        el('div', {
                            className: 'ctnInPermEvent'
                        },
                            el('label', {}, 'Permission Event:'),
                            el('br'),
                            el('select', {},
                                (function () {
                                    var eventOpts = [];

                                    if (events['receive-notify-new-msg']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'receive-notify-new-msg',
                                                value: 'receive-notify-new-msg'
                                            }, __('Receive notification of new message from a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['receive-notify-msg-read']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'receive-notify-msg-read',
                                                value: 'receive-notify-msg-read'
                                            }, __('Receive notification of message read by a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['receive-msg']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'receive-msg',
                                                value: 'receive-msg'
                                            }, __('Receive message from a device', 'catenis-blocks'))
                                        );
                                    }

                                    if (events['send-read-msg-confirm']) {
                                        eventOpts.push(
                                            el('option', {
                                                key: 'send-read-msg-confirm',
                                                value: 'send-read-msg-confirm'
                                            }, __('Send read message confirmation to a device', 'catenis-blocks'))
                                        );
                                    }

                                    return eventOpts;
                                })()
                            )
                        ),
                        el('div', {
                            className: 'ctnInLevel'
                        },
                            el('label', {}, 'Level:'),
                            el('br'),
                            el('select', {},
                                (function () {
                                    var levelOpts = [];

                                    if (levels['system']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'system',
                                                value: 'system'
                                            }, __('System', 'catenis-blocks'))
                                        );
                                    }

                                    if (levels['ctnNode']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'ctn-node',
                                                value: 'ctnNode'
                                            }, __('Catenis Node', 'catenis-blocks'))
                                        );
                                    }

                                    if (levels['client']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'client',
                                                value: 'client'
                                            }, __('Client', 'catenis-blocks'))
                                        );
                                    }

                                    if (levels['device']) {
                                        levelOpts.push(
                                            el('option', {
                                                key: 'device',
                                                value: 'device'
                                            }, __('Device', 'catenis-blocks'))
                                        );
                                    }

                                    return levelOpts;
                                })()
                            )
                        ),
                        el('div', {
                            className: 'ctnInEntityId'
                        },
                            el('input', {
                                type: 'text',
                                size: '40',
                                placeholder: 'Entity ID'
                            }),
                            el('div', {
                                className: 'ctnInProdUniqueId'
                            },
                                el('input', {
                                    type: 'checkbox'
                                }),
                                '\u00A0',
                                el('label', {}, 'Product unique ID')
                            )
                        ),
                        el('div', {
                            className: 'ctnResult'
                        },
                            el('label', {
                                className: 'ctnPermRight'
                            }, 'Permission Right:'),
                            '\u00A0',
                            el('span', {
                                className: 'ctnPermRight'
                            }),
                            el('select', {
                                className: 'ctnPermRight'
                            },
                                el('option', {
                                    value: 'allow'
                                }, __('allow', 'catenis-blocks')),
                                el('option', {
                                    value: 'deny'
                                }, __('deny', 'catenis-blocks')),
                                el('option', {
                                    value: 'none'
                                }, __('none', 'catenis-blocks'))
                            ),
                            '\u00A0',
                            el('a', {
                                className: 'ctnUpdtLnk',
                                href: '#'
                            }, 'update'),
                            el('a', {
                                className: 'ctnCancLnk',
                                href: '#'
                            }, 'cancel'),
                            el('div', {
                                className: 'ctnShowEffectRight'
                            },
                                el('input', {
                                    type: 'checkbox'
                                }),
                                '\u00A0',
                                el('label', {}, 'Show effective right')
                            )
                        ),
                        el('div', {
                            className: 'ctnError'
                        },
                            el('span', {
                                className: 'ctnError'
                            })
                        ),
                    ),
                    el('div', {
                        className: 'noctnapiproxy'
                    }, __('Catenis API client not loaded on page', 'catenis-blocks')),
                    el(wp.element.RawHTML, {}, '<script type="text/javascript">(function(){var elems=jQuery(\'script[type="text/javascript"]\');if(elems.length > 0){var uiContainer=jQuery(\'div.uicontainer\', elems[elems.length-1].parentElement)[0];if(!uiContainer.ctnBlkPermissions && typeof CtnBlkPermissions===\'function\'){uiContainer.ctnBlkPermissions=new CtnBlkPermissions(uiContainer);}}})()</script>')
                )
            );
        }
    });
})(this);