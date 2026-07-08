#!/bin/sh

if [ -z "$1" ]; then
  echo "Usage: ./init.sh <project_name>"
  exit 1
fi

mkdir $1
cd $1

npm init -y
npm pkg set type=module main=src/local.ts
npm pkg set scripts.build="tsc"
npm pkg set scripts.dev="node --watch src/local.ts"

npm install --save-dev typescript @types/node

npm install redleaf-ishell
npm install dotenv

mkdir src
cp -r ../skeleton/. .

./run.sh dev
