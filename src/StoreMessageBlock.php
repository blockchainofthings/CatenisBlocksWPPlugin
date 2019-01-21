<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-12
 * Time: 11:02
 */

namespace Catenis\WP\Blocks;


class StoreMessageBlock {
    private $pluginPath;

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    function initialize() {
        $pluginDir = dirname($this->pluginPath);

        $blockEditorScriptFile = '/js/StoreMessageBlockEditor.js';
        wp_register_script('store-message-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/StoreMessageBlock.js';
        wp_register_script('store-message-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/StoreMessageBlockEditor.css';
        wp_register_style('store-message-block-editor', plugins_url($blockEditorStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/StoreMessageBlock.css';
        wp_register_style('store-message-block', plugins_url($blockStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type( 'catenis-blocks/ctnblk-store-message', [
            'editor_script' => 'store-message-block-editor',
            'editor_style'  => 'store-message-block-editor',
            'script'        => 'store-message-block',
            'style'         => 'store-message-block'
        ]);
    }
}