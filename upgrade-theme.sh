#!/bin/bash
hugo mod get github.com/razonyang/hugo-theme-bootstrap@master &&
    hugo mod npm pack &&
    npm update &&
    git add go.mod go.sum package.json package-lock.json &&
    git commit -m 'Update the theme'
