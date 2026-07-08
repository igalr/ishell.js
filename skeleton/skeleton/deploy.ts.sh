#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: $0 <env-name>  (e.g. $0 appname-dev)"
    exit 1
fi

if [ ! -f ".env.$1" ]; then
    echo "Error: .env.$1 not found"
    exit 1
fi

# Read LAMBDA from the env file, fallback to the env-name
LAMBDA=$(grep -v '^#' ".env.$1" | grep '^LAMBDA=' | cut -d= -f2)
PROFILE=$(grep -v '^#' ".env.$1" | grep '^AWS_PROFILE=' | cut -d= -f2)
REGION=$(grep -v '^#' ".env.$1" | grep '^AWS_REGION=' | cut -d= -f2)
MODULE=$LAMBDA

VERSION=`git describe --tags`

npm run build

rm $MODULE.zip
zip $MODULE.zip -r package.json dist/* node_modules/* -x "dist/local.js"

ENV_JSON=$(grep -v '^#' ".env.$1" | grep '=' | grep -v '^AWS_REGION=' | grep -v '^AWS_PROFILE=' | grep -v '^LAMBDA=' | jq -Rn '{Variables: ([inputs | capture("(?<k>[^=]+)=(?<v>.*)") | {(.k): .v}] | add)}')
ENV_JSON=$(echo "$ENV_JSON" | jq --arg v "$VERSION" '.Variables.VERSION = $v')

./setupLambda.sh "$1"

echo "Uploading $MODULE.zip to $LAMBDA Lambda function"
aws lambda update-function-configuration \
    --function-name $LAMBDA \
    --handler dist/lambda.handler \
    --environment "$ENV_JSON" \
    --timeout 180 --memory-size 256 \
    --region $REGION \
    --profile $PROFILE > .out
cat .out

sleep 1

# Upload the Lambda function
aws lambda update-function-code \
    --function-name $LAMBDA \
    --zip-file fileb://$MODULE.zip \
    --region $REGION \
    --profile $PROFILE > .out
cat .out

rm .out $MODULE.zip
