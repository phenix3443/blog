
# Define the shell to use when executing commands
SHELL := /usr/bin/env bash -o pipefail -o errexit

help:
	@@grep -h '^[a-zA-Z]' $(MAKEFILE_LIST) | awk -F ':.*?## ' 'NF==2 {printf "   %-22s%s\n", $$1, $$2}' | sort

