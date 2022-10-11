<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-28
 * Time: 11:04
 */

namespace Catenis\WP\Blocks;

class MessageHistoryBlock
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
        wp_register_script('setImmediate', plugins_url('/js/lib/setImmediate.min.js', $this->pluginPath), [], '1.0.5');

        $blockEditorScriptFile = '/js/MessageHistoryBlockEditor.js';
        wp_register_script('message-history-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components',
            'moment'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/MessageHistoryBlock.js';
        wp_register_script('message-history-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery',
            'moment',
            'setImmediate'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/MessageHistoryBlockEditor.css';
        wp_register_style(
            'message-history-block-editor',
            plugins_url($blockEditorStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/MessageHistoryBlock.css';
        wp_register_style(
            'message-history-block',
            plugins_url($blockStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type('catenis-blocks/message-history', [
            'editor_script' => 'message-history-block-editor',
            'editor_style'  => 'message-history-block-editor',
            'script'        => 'message-history-block',
            'style'         => 'message-history-block'
        ]);
    }
}
