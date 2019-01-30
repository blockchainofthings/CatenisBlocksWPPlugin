<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-28
 * Time: 11:04
 */

namespace Catenis\WP\Blocks;


class MessageHistoryBlock {
    private $pluginPath;

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    function initialize() {
        $pluginDir = dirname($this->pluginPath);

        $blockEditorScriptFile = '/js/MessageHistoryBlockEditor.js';
        wp_register_script('message-history-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/MessageHistoryBlock.js';
        wp_register_script('message-history-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery',
            'moment'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/MessageHistoryBlockEditor.css';
        wp_register_style('message-history-block-editor', plugins_url($blockEditorStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/MessageHistoryBlock.css';
        wp_register_style('message-history-block', plugins_url($blockStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type( 'catenis-blocks/ctnblk-message-history', [
            'editor_script' => 'message-history-block-editor',
            'editor_style'  => 'message-history-block-editor',
            'script'        => 'message-history-block',
            'style'         => 'message-history-block'
        ]);
    }
}