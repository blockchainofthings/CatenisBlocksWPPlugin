<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-23
 * Time: 14:35
 */

namespace Catenis\WP\Blocks;


class SaveMessageBlock {
    private $pluginPath;

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    function initialize() {
        $pluginDir = dirname($this->pluginPath);

        $blockEditorScriptFile = '/js/SaveMessageBlockEditor.js';
        wp_register_script('save-message-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/SaveMessageBlock.js';
        wp_register_script('save-message-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/SaveMessageBlockEditor.css';
        wp_register_style('save-message-block-editor', plugins_url($blockEditorStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/SaveMessageBlock.css';
        wp_register_style('save-message-block', plugins_url($blockStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type( 'catenis-blocks/ctnblk-save-message', [
            'editor_script' => 'save-message-block-editor',
            'editor_style'  => 'save-message-block-editor',
            'script'        => 'save-message-block',
            'style'         => 'save-message-block'
        ]);
    }
}