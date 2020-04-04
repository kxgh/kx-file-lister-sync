# kx-file-lister-sync

Content listing in directories using Node.js. Supporting recursion, stats, detailed output, blacklists, whitelists, size formatters.
Fully synchronous.

## Example

Basic usage:

```javascript
const fl = new (require('kx-file-lister-sync'))();
const list = fl.listFiles('../some/folder');
console.log(list)
```
Output:
```
[ '..\\some\\backgorund.js',
  '..\\some\\manifest.js',
  '..\\some\\docs\\cv.ods',
  '..\\some\\docs\\photos\\pic.jpg',
  '..\\some\\docs\\photos\\pic2.jpg' ]
```

More examples at the bottom.

## API

```javascript
const FileLister = require('kx-file-lister-sync');
let fl = new FileLister(opts);
```

### Constructor

File lister exports a class, therefore it must be instantiated with ``new`` keyword. Object params ``opts`` is optional.

#### opts

Object opts is passed to contructor. It accepts these properties:

#### detailed

If set to `true` it will list objects with properties
`name` for file name,
`path` for file path
`full` for full file path,
`ext` for extension and
`dir` for whether it is a directory.
Otherwise it returns plain string filepaths. Defaults to `false`

#### stats

Enables detailed mode and each item will also include fs stats. Contains single err property, if could not stat.
Defaults to `false`.

#### blackList

Array of strings or `RegExp`s, or both. Each (non-dir) file will be checked by each blackList entry if it matches it will not be listed.
Matching is done by `String.prototype.endsWith` function on file's name, while regexps are checked by `RegExp.prototype.test`.
Only works if whiteList is empty or missing. Defaults to `[]`

#### whiteList

Does the opposite of what blackList does. If whiteList is specified and has at least one element, all listings ignore blackList
and use whiteList instead. Empty by default.

#### filterDirs

White and black lists also affect diving into directories if set to `true`. Defaults to `false`.

#### sizeFormatter

Value of this property must be a function and should take one `Number` param (file size in bytes) and output anything.
Decorator for file size.

#### sortByName

Whether to sort output entries by name. If set to `false` (default) it will sort output entries by 'directories first'.
Defaults to `false`.

#### ignoreLinks

Output will not contain files that are symbolic links. Defaults to `true`.

### listFiles(dirPath[, recursive, maxDepth])

Lists all files in directories and possibly subdirectories into a single flat array.
  * `dirPath` target directory path
  * `recursive` also lists subdirectories if `true`. Defaults to `true`
  * `maxDepth` do not dive into subdirectories deeper than this number. 0 for just target directory, 1 for target directory
  and their direct subdirectories, `n`

### listOneDir(dirPath)

Lists files **and directories** in target directory.

  * `dirPath` target directory path

### listFilesTree(dirPath[, maxDepth])

Lists files into a deep array, mapping fs's tree structure. 

  * `dirPath` target directory path
  * `maxDepth` do not dive into subdirectories deeper than this number
  
## Which methods are recursive?

| Method        | Recursive?    | Lists dirs?   |
| ------------- |:-------------:|:-------------:|
| listFiles     | yes, settable | no            |
| listOneDir    | no            | yes           |
| listFilesTree | yes           | as a structure|

  
## Examples

Code:

```javascript
const FileLister = require('kx-file-lister-sync');
const fl = new FileLister({
    detailed: true,
    sortByName: true,
    whiteList: [/m[ao]/,'.js']
});
const result = fl.listFiles('xx/some');
console.log(result);
```

Outputs to:
```
[ { name: 'backgorund.js',
    path: 'xx\\some\\backgorund.js',
    dir: false,
    ext: '.js',
    full:
     'C:\\Users\\kxgh\\projs\\kx-file-lister-sync\\xx\\some\\backgorund.js' },
  { name: 'manifest.js',
    path: 'xx\\some\\manifest.js',
    dir: false,
    ext: '.js',
    full:
     'C:\\Users\\kxgh\\projs\\kx-file-lister-sync\\xx\\some\\manifest.js' } ]
```
---

Code:

```javascript
const FileLister = require('kx-file-lister-sync');
const fl = new FileLister({blackList: ['some'], filterDirs: true});
const result = fl.listFilesTree('xx');
console.log(result);
```

Outputs to:
```
[ [ [ 'xx\\xy\\xz\\ac.js' ], 'xx\\xy\\ab.js' ], 'xx\\aa.js' ]
```
---

Code:

```javascript
const FileLister = require('kx-file-lister-sync');
const fl = new FileLister({
    whiteList: [/manifest/i],
    detailed: true
});
const result = fl.listOneDir('xx/some');
console.log(result);
```

Outputs to:

```
[ { name: 'docs',
    path: 'xx\\some\\docs',
    dir: true,
    ext: '',
    full:
     'C:\\Users\\kxgh\\projs\\kx-file-lister-sync\\xx\\some\\docs' },
  { name: 'manifest.js',
    path: 'xx\\some\\manifest.js',
    dir: false,
    ext: '.js',
    full:
     'C:\\Users\\kxgh\\projs\\kx-file-lister-sync\\xx\\some\\manifest.js' } ]
```
