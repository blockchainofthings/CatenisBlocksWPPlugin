<?php

namespace Catenis\WP\Blocks;

class PermissionsBlock
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

        $blockEditorScriptFile = '/js/PermissionsBlockEditor.js';
        wp_register_script('permissions-block-editor', plugins_url($blockEditorScriptFile, $this->pluginPath), [
            'wp-blocks',
            'wp-editor',
            'wp-i18n',
            'wp-element',
            'wp-components'
        ], filemtime("$pluginDir/$blockEditorScriptFile"));

        $blockScriptFile = '/js/PermissionsBlock.js';
        wp_register_script('permissions-block', plugins_url($blockScriptFile, $this->pluginPath), [
            'wp-i18n',
            'jquery',
            'moment'
        ], filemtime("$pluginDir/$blockScriptFile"));

        $blockEditorStyleFile = '/style/PermissionsBlockEditor.css';
        wp_register_style(
            'permissions-block-editor',
            plugins_url($blockEditorStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockEditorStyleFile")
        );

        $blockStyleFile = '/style/PermissionsBlock.css';
        wp_register_style(
            'permissions-block',
            plugins_url($blockStyleFile, $this->pluginPath),
            [],
            filemtime("$pluginDir/$blockStyleFile")
        );

        register_block_type('catenis-blocks/permissions', [
            'editor_script' => 'permissions-block-editor',
            'editor_style'  => 'permissions-block-editor',
            'script'        => 'permissions-block',
            'style'         => 'permissions-block'
        ]);
    }
}
