<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-18
 * Time: 17:51
 */

namespace Catenis\WP\Blocks;


class SendFileBlock {
    private $pluginPath;

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    function initialize() {
        $pluginDir = dirname($this->pluginPath);

        // Register local lib dependent scripts
        wp_register_script('buffer', plugins_url('/js/lib/buffer.min.js', $this->pluginPath), [], '5.2.1');
        wp_register_script('sjcl', plugins_url('/js/lib/sjcl-sha1.min.js', $this->pluginPath), [], '1.0.8-sha1');

        // Register other dependent scripts
        $ctnFileHeaderScriptFile = '/js/CtnFileHeader.js';
        wp_register_script('CtnFileHeader', plugins_url($ctnFileHeaderScriptFile, $this->pluginPath), [
            'buffer',
            'sjcl'
        ], filemtime("$pluginDir/$ctnFileHeaderScriptFile"));

        $blockEditorScriptFile = '/js/SendFileBlockEditor.js';
        wp_register_script('send-file-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/SendFileBlock.js';
        wp_register_script('send-file-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery',
            'CtnFileHeader'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/SendFileBlockEditor.css';
        wp_register_style('send-file-block-editor', plugins_url($blockEditorStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/SendFileBlock.css';
        wp_register_style('send-file-block', plugins_url($blockStyleFile, $this->pluginPath), [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type( 'catenis-blocks/ctnblk-send-file', [
            'editor_script' => 'send-file-block-editor',
            'editor_style'  => 'send-file-block-editor',
            'script'        => 'send-file-block',
            'style'         => 'send-file-block'
        ]);
    }
}