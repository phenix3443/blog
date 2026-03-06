
# Define the shell to use when executing commands
SHELL := /usr/bin/env bash -o pipefail -o errexit

help:
	@@grep -h '^[a-zA-Z]' $(MAKEFILE_LIST) | awk -F ':.*?## ' 'NF==2 {printf "   %-22s%s\n", $$1, $$2}' | sort

bootstrap: ## 启动 Bootstrap 主题服务器 (端口 1313)
	hugo server --config "config/_default,config/bootstrap" --port 1313

fixit: ## 启动 FixIt 主题服务器 (端口 1314)
	hugo server --config "config/_default,config/fixit" --port 1314

next: ## 启动 Next 主题服务器 (端口 1315)
	hugo server --config "config/_default,config/next" --port 1315

build-bootstrap: ## 构建 Bootstrap 主题
	hugo --config "config/_default,config/bootstrap" --gc --minify

build-fixit: ## 构建 FixIt 主题
	hugo --config "config/_default,config/fixit" --gc --minify

build-next: ## 构建 Next 主题
	hugo --config "config/_default,config/next" --gc --minify

clean: ## 清理构建文件
	rm -rf public

.PHONY: help bootstrap fixit next build-bootstrap build-fixit build-next clean
