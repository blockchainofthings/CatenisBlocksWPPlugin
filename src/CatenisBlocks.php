<?php
/**
 * Created by claudio on 2019-01-11
 */

namespace Catenis\WP\Blocks;

class CatenisBlocks {
    private $pluginPath;
    private $blockInstances = [];

    private static function isGutenbergActive() {
        return function_exists('register_block_type');
    }

    function __construct($pluginPath) {
        $this->pluginPath = $pluginPath;

        // Make sure that Gutenberg editor is in use
        if (! self::isGutenbergActive()) {
            return;
        }

        add_action('init', [$this, 'initialize']);

        // Add custom block category
        add_filter('block_categories', function($categories, $post) {
            return array_merge($categories, [[
                'slug' => 'catenis',
                'title' => __('Catenis', 'catenis-blocks')
            ]]);
        }, 10, 2 );

        // Instantiate blocks
        $this->blockInstances['store-message'] = new StoreMessageBlock($pluginPath);
    }

    function initialize() {
        load_plugin_textdomain('catenis-blocks', false, __DIR__ . '/languages');
    }
}