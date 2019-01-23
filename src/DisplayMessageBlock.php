<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-21
 * Time: 19:46
 */

namespace Catenis\WP\Blocks;


class DisplayMessageBlock {
    private $pluginPath;

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    function initialize() {
        $pluginDir = dirname($this->pluginPath);

        $blockEditorScriptFile = '/js/DisplayMessageBlockEditor.js';
        wp_register_script('display-message-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/DisplayMessageBlock.js';
        wp_register_script('display-message-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/DisplayMessageBlockEditor.css';
        wp_register_style('display-message-block-editor', plugins_url($blockEditorStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/DisplayMessageBlock.css';
        wp_register_style('display-message-block', plugins_url($blockStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type( 'catenis-blocks/ctnblk-display-message', [
            'editor_script' => 'display-message-block-editor',
            'editor_style'  => 'display-message-block-editor',
            'script'        => 'display-message-block',
            'style'         => 'display-message-block'
        ]);
    }
}