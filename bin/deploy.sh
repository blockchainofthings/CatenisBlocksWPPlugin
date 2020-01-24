#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null && pwd)"

if [ "$#" -ne 1 ]; then
    echo "Usage: deploy.sh <build_version>"
    exit
fi

PLUGIN_BUILD_ARCHIVE="$SCRIPT_DIR/../build/$1/catenis-blocks.zip"

if [[ ! -f "$PLUGIN_BUILD_ARCHIVE" ]]; then
    echo "Plugin build archive for specified version ($1) does not exist"
    exit
fi

DEPLOY_DIR="$SCRIPT_DIR/../svn/trunk"

if [ ! -z "$(ls -A "$DEPLOY_DIR")" ]; then
   echo "Deploy directory ($DEPLOY_DIR) not empty. Emptying it"
   rm -rf "$DEPLOY_DIR"/*
fi

unzip "$PLUGIN_BUILD_ARCHIVE" -d "$DEPLOY_DIR"