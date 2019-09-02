<?php
/**
 * Created by claudio on 2019-01-11
 */

namespace Catenis\WP\Blocks;

class CatenisBlocks
{
    private $pluginPath;
    private $blockInstances = [];

    private static function isGutenbergActive()
    {
        return function_exists('register_block_type');
    }

    public function __construct($pluginPath)
    {
        $this->pluginPath = $pluginPath;

        // Make sure that Gutenberg editor is in use
        if (! self::isGutenbergActive()) {
            return;
        }

        add_action('init', [$this, 'initialize']);

        // Add custom block category
        add_filter('block_categories', function ($categories, $post) {
            return array_merge($categories, [[
                'slug' => 'catenis',
                'title' => __('Catenis', 'catenis-blocks')
            ]]);
        }, 10, 2);

        // Instantiate blocks
        $this->blockInstances['store-message'] = new StoreMessageBlock($pluginPath);
        $this->blockInstances['store-file'] = new StoreFileBlock($pluginPath);
        $this->blockInstances['send-message'] = new SendMessageBlock($pluginPath);
        $this->blockInstances['send-file'] = new SendFileBlock($pluginPath);
        $this->blockInstances['display-message'] = new DisplayMessageBlock($pluginPath);
        $this->blockInstances['message-input'] = new MessageInputBlock($pluginPath);
        $this->blockInstances['save-message'] = new SaveMessageBlock($pluginPath);
        $this->blockInstances['message-history'] = new MessageHistoryBlock($pluginPath);
        $this->blockInstances['message-inbox'] = new MessageInboxBlock($pluginPath);
        $this->blockInstances['permissions'] = new PermissionsBlock($pluginPath);
    }

    public function initialize()
    {
        load_plugin_textdomain('catenis-blocks', false, __DIR__ . '/languages');
    }
}
