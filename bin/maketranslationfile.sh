#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"

(cd "$SCRIPT_DIR"/.. && wp i18n make-pot . ./languages/catenis-blocks.pot --exclude=thirdparty,readme.txt,js/lib,build,bin,.vscode)