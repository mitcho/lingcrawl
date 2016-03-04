# lingcrawl

A tool for crawling and creating a local mirror of the LingBuzz archive.

Dedicated to the public domain, Michael Yoshitaka Erlewine <mitcho@mitcho.com> 2015

## Prerequisites

lingcrawl is written in JavaScript. Install node.js and the npm packages `cheerio`, `async`, and `yargs`. The command-line tool `wget` is also required.

## Basic usage

lingcrawl takes minimally one argument which is a LingBuzz ID. It does not have to be padded with extra zeros.

	node lingcrawl.js 2210

This will download the HTML index file for LingBuzz #002210, then download all revisions including the current revision. The results will be in `archive/002210`.

To run it over a range of numbers, enter the first and last ID:

	node lingcrawl.js 1 2746

If any downloads fail along the way, the script will try to requeue the download for a little later and try again. If the server never comes back online, the script may not terminate.

## Syncing

For each file in an archive folder (index file and revisions), if a file with the appropriate filename exists, it will not be redownloaded. Because the existence of new revisions is only known through the index file, syncing to pick up "freshly changed" entries requires clearing the index fils. Here's a basic, stupid way of doing this:

	rm archive/*/index.html

Then rerun lingcrawl over everything. A better way would be to only clear the index files for entries listed as "freshly changed" on the LingBuzz top page.