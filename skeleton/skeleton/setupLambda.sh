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

aws lambda get-function --function-name $LAMBDA --region $REGION --profile $PROFILE > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Lambda function $LAMBDA does not exist. Creating it..."

    ROLE_PREFIX="${LAMBDA}-role-"
    ROLE_NAME=$(aws iam list-roles --profile "$PROFILE" --query "Roles[?starts_with(RoleName, \`$ROLE_PREFIX\`)].RoleName | [0]" --output text)

    if [ -z "$ROLE_NAME" ] || [ "$ROLE_NAME" == "None" ]; then
        ROLE_NAME="${ROLE_PREFIX}$(openssl rand -hex 4)"
        echo "Creating execution role $ROLE_NAME..."
        aws iam create-role \
            --role-name "$ROLE_NAME" \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }' \
            --profile "$PROFILE" > /dev/null

        aws iam attach-role-policy \
            --role-name "$ROLE_NAME" \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
            --profile "$PROFILE"

        echo "Waiting for role to propagate..."
        sleep 10
    fi

    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text --profile "$PROFILE")

    aws lambda create-function \
        --function-name $LAMBDA \
        --runtime nodejs24.x \
        --role $ROLE_ARN \
        --handler dist/lambda.handler \
        --zip-file fileb://$MODULE.zip \
        --region $REGION \
        --profile $PROFILE > .out
    cat .out

    sleep 3

    echo "Setting up Lambda function URL for $LAMBDA..."
    aws lambda create-function-url-config \
        --function-name $LAMBDA \
        --auth-type NONE \
        --region $REGION \
        --profile $PROFILE > .out
    cat .out
    rm .out

    sleep 3

    # auth-type NONE alone doesn't allow public invocation; a resource policy
    # granting lambda:InvokeFunctionUrl to principal "*" is also required.
    aws lambda add-permission \
        --function-name $LAMBDA \
        --statement-id FunctionURLAllowPublicAccess \
        --action lambda:InvokeFunctionUrl \
        --principal "*" \
        --function-url-auth-type NONE \
        --region $REGION \
        --profile $PROFILE > /dev/null

    echo "Lambda function $LAMBDA setup complete."
fi

