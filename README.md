# lingcrawl

A tool for crawling and creating a local mirror of the LingBuzz archive.

Dedicated to the public domain, Michael Yoshitaka Erlewine <mitcho@mitcho.com> 2015

## Prerequisites

lingcrawl is written in JavaScript. Install node.js and the package cheerio via npm.

## Basic usage

lingcrawl takes one argument which is a LingBuzz ID number. It does not have to be padded with extra zeros.

	node lingcrawl.js 2210

This will download the HTML index file for LingBuzz #002210, then download all revisions including the current revision. The results will be in `archive/002210`.

To run it over a range of numbers, just use a shell for loop, like the following in bash:

	for i in {1..2754}; do node lingcrawl.js $i; done;

Because some downloads may fail (when LingBuzz is down), it may be necessary to make multiple passes through.

## Syncing

For each file in an archive folder (index file and revisions), if a file with the appropriate filename exists, it will not be redownloaded. Because the existence of new revisions is only known through the index file, syncing to pick up "freshly changed" entries requires clearing the index fils. Here's a basic, stupid way of doing this:

	rm archive/*/index.html

Then rerun lingcrawl over everything. A better way would be to only clear the index files for entries listed as "freshly changed" on the LingBuzz top page.