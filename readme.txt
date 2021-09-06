=== Catenis Blocks ===
Contributors: catenisadmin
Tags: Catenis, Catenis API, Blockchain of Things, blockchain, Gutenberg
Requires at least: 5.0
Tested up to: 5.3.2
Requires PHP: 5.6
Stable tag: 1.1.1
License: MIT

A set of Gutenberg blocks that make use of Catenis services.

== Description ==

Catenis Blocks include a set of Gutenberg blocks that can be used to integrate with the Bitcoin blockchain by means of the Catenis services.

The following blocks are currently available:

* Store Message - used to store a text message onto the Bitcoin blockchain.
* Store File - used to store a file onto the Bitcoin blockchain.
* Send Message - used to store a text message onto the Bitcoin blockchain addressing it to another Catenis virtual device.
* Send File - used to store a file onto the Bitcoin blockchain addressing it to another Catenis virtual device.
* Display Message - used to display a text message retrieved from the Bitcoin blockchain.
* Message Input - used to enter ID of message for display/saving.
* Save Message - used to save message retrieved from the Bitcoin blockchain as a file.
* Message Inbox - used to display a list with the latest received messages.
* Message History - used to display a list with the latest stored/sent messages.
* Permissions - used to manage Catenis permissions.

= Using Catenis Blocks =

Make sure that the Catenis API Client for Wordpress plugin is installed, properly configured and enabled on the WordPress page where Catenis Blocks shall be used.

Select the appropriate block from under the Catenis category, place it on the page, and use the settings sidebar to configure it.

== Installation ==

= System requirements =

Catenis Blocks require that the Catenis API Client for WordPress plugin, version 2.1, be installed.

= Installation procedure =

1. Upload the plugin files to the "/wp-content/plugins/" directory.
1. Activate the plugin through the "Plugins" menu in WordPress.

== Frequently Asked Questions ==

== Screenshots ==

1. Blocks under Catenis category.

2. Sample block settings sidebar.

== Changelog ==

= 1.1.1 =
* Maintenance release that fixes any issue saving large files.

= 1.1.0 =
* Added support for Catenis off-chain messages.

= 1.0.0 =
* Initial release, including functionality to work with messages.

== Upgrade Notice ==

= 1.1.1 =
All users are advised to upgrade to this latest version.
