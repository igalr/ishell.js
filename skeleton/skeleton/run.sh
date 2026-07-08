#!/bin/bash

if [ "$1" != "dev" ] && [ "$1" != "prod" ]; then
    echo "Usage: $0 <dev|prod>"
    exit 1
fi

rm .env
cp .env-local-$1 .env

node --watch ./src/local.ts