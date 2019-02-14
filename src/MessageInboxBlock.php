<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-02-06
 * Time: 09:54
 */

namespace Catenis\WP\Blocks;


class MessageInboxBlock {
    private $pluginPath;

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    function initialize() {
        $pluginDir = dirname($this->pluginPath);

        $blockEditorScriptFile = '/js/MessageInboxBlockEditor.js';
        wp_register_script('message-inbox-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components',
            'moment'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/MessageInboxBlock.js';
        wp_register_script('message-inbox-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery',
            'moment'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/MessageInboxBlockEditor.css';
        wp_register_style('message-inbox-block-editor', plugins_url($blockEditorStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/MessageInboxBlock.css';
        wp_register_style('message-inbox-block', plugins_url($blockStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type( 'catenis-blocks/ctnblk-message-inbox', [
            'editor_script' => 'message-inbox-block-editor',
            'editor_style'  => 'message-inbox-block-editor',
            'script'        => 'message-inbox-block',
            'style'         => 'message-inbox-block'
        ]);
    }
}