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

    public static function registerCatenisCategory($categories)
    {
        $categories[] = [
            'slug' => 'catenis',
            'title' => __('Catenis', 'catenis-blocks')
        ];

        return $categories;
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
        if (version_compare(get_bloginfo('version'), '5.8', '>=')) {
            // For WordPress ver. 5.8 or greater, use 'block_categories_all' in place
            //  or the deprecated 'block_categories'
            add_filter('block_categories_all', [__CLASS__, 'registerCatenisCategory']);
        } else {
            add_filter('block_categories', [__CLASS__, 'registerCatenisCategory']);
        }

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
