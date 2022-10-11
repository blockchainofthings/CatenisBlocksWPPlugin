<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-12
 * Time: 11:02
 */

namespace Catenis\WP\Blocks;

class StoreMessageBlock
{
    private $pluginPath;

    public function __construct($pluginPath)
    {
        $this->pluginPath = $pluginPath;

        add_action('init', [$this, 'initialize']);
    }

    public function initialize()
    {
        $pluginDir = dirname($this->pluginPath);

        // Register local lib dependent scripts
        wp_register_script('spin', plugins_url('/js/lib/spin.umd.js', $this->pluginPath), [], '4.0.0');

        $blockEditorScriptFile = '/js/StoreMessageBlockEditor.js';
        wp_register_script('store-message-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components',
            'jquery',
            'spin'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/StoreMessageBlock.js';
        wp_register_script('store-message-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery',
            'spin'
        ], filemtime("$pluginDir/$blockScriptFile"));

        // Register local lib dependent styles
        wp_register_style(
            'spin',
            plugins_url('/style/lib/spin.css', $this->pluginPath),
            [],
            filemtime("$pluginDir/style/lib/spin.css")
        );

        $blockEditorStyleFile = '/style/StoreMessageBlockEditor.css';
        wp_register_style(
            'store-message-block-editor',
            plugins_url($blockEditorStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/StoreMessageBlock.css';
        wp_register_style(
            'store-message-block',
            plugins_url($blockStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type('catenis-blocks/store-message', [
            'editor_script' => 'store-message-block-editor',
            'editor_style'  => 'store-message-block-editor',
            'script'        => 'store-message-block',
            'style'         => 'store-message-block'
        ]);
    }
}
