#!/usr/bin/env bash

rm -rf onetab-backup
git clone https://arn4v:$GITHUB_PAT@github.com/arn4v/onetab-backup
cp onetab-backup/onetab.sqlite3 .
npm run start
rm onetab.sqlite3
rm -rf onetab-backup