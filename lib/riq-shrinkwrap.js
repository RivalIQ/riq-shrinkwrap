

module.exports.shrinkwrap = function (cb){
    generate(function(err){
        load(function(err, data){
            write( clean(data), cb);
        });
    });
    
}

function generate(cb){
    var exec = require('child_process').exec;
    
    exec('npm shrinkwrap --dev', {
        stdio: ['pipe', process.stdout, process.stderr]
    }).on('exit', cb);        
}


function load (cb) {
    var file = require('path').resolve('.', 'npm-shrinkwrap.json');
    require('fs').readFile(file, 'utf8', function(err, text){
        cb(err, text && JSON.parse(text));
    });
}

function clean(pkg, name) {
    if (!pkg) { 
        return; 
    }
    
    if (pkg.resolved && /registry\.npmjs\.org/.test(pkg.resolved)){
        delete pkg.resolved;
    }
    
    if ( pkg.from && /registry\.npmjs\.org/.test(pkg.from)){
        pkg.from = name + '@' + pkg.version;
    }

    for (var dependency in pkg.dependencies || {}){
        clean(pkg.dependencies[dependency], dependency)
    }

    return pkg;
}

function write (json, cb) {
    var file = require('path').resolve('.', 'npm-shrinkwrap.json');
    var data = stringify(json, 0) + "\n";
    require('fs').writeFile(file, data, cb);
}

function remove(arr, value){
    var idx = arr.indexOf(value);
    if (idx > -1){
        arr.splice(idx, 1);
    }
    
}

function stringify(node, level) {
    if (typeof node !== 'object' || node === null) {
        return JSON.stringify(node);
    }
    var whiteSpace = '  ';
    var indent = '\n' + new Array(level + 1).join(whiteSpace);
    var colonSeparator = ': ';

    var keys = Object.keys(node).sort();
    var out = [];
    
    // special keys we want first
    ['name', 'version', 'from'].forEach(function(key){
        var idx = keys.indexOf(key);
        if (idx > 0){
            keys.splice(idx, 1);
            var keyValue = stringify(key, 0)
                + colonSeparator
                + stringify(node[key], level + 1 );
            out.push(indent + whiteSpace + keyValue);            
        }
    });    
        
    keys.forEach(function(key){
        var keyValue = stringify(key, 0)
            + colonSeparator
            + stringify(node[key], level + 1 );

        out.push(indent + whiteSpace + keyValue);
    });
    return '{' + out.join(',') + indent + '}';
}


