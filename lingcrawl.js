// lingcrawl.js
// Michael Yoshitaka Erlewine <mitcho@mitcho.com>
// Dedicated to the public domain, 2015
// http://github.com/mitcho/lingcrawl

// option parsing using yargs:
var argv = require('yargs')
	.usage('Usage: $0 <start ID> (<end ID>) [options]')
	.demand(1) // require an ID
	.option('c', {
		alias: 'concurrent',
		default: 10
	})
	.option('v', {
		alias: 'verbose',
		default: false,
		boolean: true
	})
	.option('f', {
		alias: 'forceindex',
		default: false,
		boolean: true,
		describe: 'Ignore cached index.html files'
	})
	.option('F', {
		alias: 'forceall',
		default: false,
		boolean: true,
		describe: 'Ignore all cached files'
	})
	.help('help')
	.argv;

var fs = require("fs"),
	exec = require('child_process').exec,
	cheerio = require('cheerio'),
	path = require('path'),
	async = require('async');

const LINGBUZZ = 'http://ling.auf.net/lingbuzz',
	HEADERS = {'User-Agent': 'lingcrawl'},
	ARCHIVEPATH = './archive/',
	CLEANHTML = "sed -i '' -E -e 's/\\?_s=[A-Za-z0-9_-]+(&amp;_k=[A-Za-z0-9_-]+&amp;[0-9])?\\\"/\\\"/g' ";

var start = argv._[0];
var end = (argv._.length > 1) ? argv._[1] : start;

function pad(n, digits) {
	n += '';
	return new Array(digits - n.length + 1).join('0') + n;
}

var q = async.queue(function (task, callback) {
	var id = task.id;
	id = pad(id, 6);
	var targetpath = LINGBUZZ + '/' + id + '/';
	var archivedir = ARCHIVEPATH + id + '/';

	if ( !fs.existsSync(archivedir) )
		fs.mkdirSync(archivedir);	

	var filename = task.filename; // filename = current.pdf | index.html | etc. (optional ?_s=)

	if (argv.v)
		console.log(id, filename);
	
	targetpath += filename;

	var cb;
	if ( filename == 'index.html' ) {
		cb = function () {
			// load cheerio, the faux-jQuery
			var $ = cheerio.load(fs.readFileSync(archivedir + filename));

			var current = $('table tr:nth-child(1) > td:nth-child(2) a').attr('href');
			var currentfile = path.basename(current);
			var currentext = path.extname(current).replace(/\?.*$/,'');
			var previousList = $('table tr:nth-child(5) > td:nth-child(2) a');
			var maxrev = 0;
			previousList.each(function(i, previous){
				var link = $(previous).attr('href');
				var revfile = link.replace(/^\/lingbuzz\/(\d+)\/(v\d+\.\w+)(\?.*)?$/, '$2');
				var revnum = parseInt(revfile.replace(/^v(\d+)\.\w+$/, '$1'));

				q.push({id: id, filename: revfile});
		
				maxrev = Math.max(maxrev, revnum);
			});

			maxrev++;
			var currentfile = 'v' + maxrev + currentext;
		// 	console.log('current = ' + currentfile);

			q.push({id: id, filename: currentfile});

			callback();
		}
	} else {
		cb = callback;
	}

	// don't redownload existing files
	// todo: skip this for updated files? The issue is that lingbuzz doesn't seem to send back Last-Modified, so we can't do this intelligently.
	if ( !argv.F && !(argv.f && filename == 'index.html') && fs.existsSync(archivedir + filename) ) {
		return cb( id, filename, archivedir + filename );
	}
	
	// todo: add flag to add wget flag -N ?

	console.log('🐌  ' + targetpath + ' ...');

	var child = exec('wget -P ' + archivedir + ' -w 1m --random-wait ' + targetpath, function(err, stdout, stderr) {
		if (err) {
			if ( err.code == 8 ) { // wget exit code 8 = server error
				console.log('🚫  ' + id + ' ' + filename + "\trequeuing...");
				q.push({id: id, filename: filename});
			} else
				console.log(err);
			return callback();
		}

		console.log('✅  ' + id + ' ' + filename);

		if ( filename == 'index.html' ) { // index.html files need to be cleaned up
			exec(CLEANHTML + archivedir + filename, function(err, stdout, stderr) {
				if (err)
					console.log('⚠️  ' + id + ' on sed: ', err);
				cb( id, filename );
			});
		} else {
			cb( id, filename );
		}
	});

}, argv.c);

// register final callback
q.drain = function() {
    console.log('all items have been processed');
}

// queue up IDs
for ( var i = start; i <= end; i++ ) {
	q.push({id: i, filename: 'index.html'});
}
