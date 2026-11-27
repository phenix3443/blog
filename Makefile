SHELL := /usr/bin/env bash -o pipefail -o errexit
export PATH := $(CURDIR)/node_modules/.bin:$(PATH)
.DEFAULT_GOAL := help

help: ## 列出常用命令
	@awk -F ':.*?## ' 'NF==2 {printf "   %-16s%s\n", $$1, $$2}' $(MAKEFILE_LIST)

serve: ## 启动 FixIt 主站开发服务器
	npm run dev

build: ## 构建 FixIt 主站
	npm run build

fixit: ## 启动 FixIt 子域名开发服务器
	npm run dev -- --port 1314

build-fixit: ## 构建 FixIt 子域名
	npm run build -- --baseURL https://fixit.blog.panghuli.cn/

check: ## 检查脚本和站点配置
	shellcheck --severity=warning *.sh
	python3 -m unittest discover -s tests -v

test: ## 构建并验证浏览器交互
	npm test

clean: ## 清理构建文件
	rm -rf public

.PHONY: help serve build fixit build-fixit check test clean
