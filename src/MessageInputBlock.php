<?php
/**
 * Created by PhpStorm.
 * User: claudio
 * Date: 2019-01-23
 * Time: 10:45
 */

namespace Catenis\WP\Blocks;

class MessageInputBlock
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

        $blockEditorScriptFile = '/js/MessageInputBlockEditor.js';
        wp_register_script('message-input-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockEditorStyleFile = '/style/MessageInputBlockEditor.css';
        wp_register_style(
            'message-input-block-editor',
            plugins_url($blockEditorStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/MessageInputBlock.css';
        wp_register_style(
            'message-input-block',
            plugins_url($blockStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type('catenis-blocks/message-input', [
            'editor_script' => 'message-input-block-editor',
            'editor_style'  => 'message-input-block-editor',
            'style'         => 'message-input-block'
        ]);
    }
}
