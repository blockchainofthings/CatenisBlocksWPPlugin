# Catenis Blocks

A set of Gutenberg blocks that make use of Catenis services.

This release (1.1.2) uses version 2.1 of the Catenis API Client for WordPress plugin, which targets version 0.9 of the Catenis API.

## Description

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

### Using Catenis Blocks

Make sure that the Catenis API Client for Wordpress plugin is installed, properly configured and enabled on the WordPress page where Catenis Blocks shall be used.

Select the appropriate block from under the Catenis category, place it on the page, and use the settings sidebar to
 configure it.

## Installation

# System requirements

Catenis Blocks require that the Catenis API Client for WordPress plugin, version 2.1, be installed.

### Installation procedure

1. Upload the plugin files to the "/wp-content/plugins/" directory.
1. Activate the plugin through the "Plugins" menu in WordPress.
