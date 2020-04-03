const fs = require('fs');
const path = require('path');

function getLogic(opts) {
    const lg = {
        statFile(filePath) {
            const stat = fs.statSync(path.resolve(filePath));
            const o = opts.details == 'all' ? {...stat} : {};
            o.dir = stat.isDirectory();
            o.name = path.basename(filePath);
            o.path = path.normalize(filePath);
            o.full = path.resolve(o.path);

            if (opts.details != 'all')
                for (let d of opts.details)
                    o[d] = stat[d];
            if (o.size && opts.sizeFormatter)
                o.size = opts.sizeFormatter(o.size);
            return o
        },
        sortByDir(content) {
            if (opts.sortByName)
                return content;
            let dirs = [];
            let files = [];
            for (let c of content)
                lg.isDir(c) ? dirs.push(c) : files.push(c);
            return dirs.concat(files)
        },
        simplify(content, recursive) {
            if (!opts.detailed) {
                if (recursive) {
                    for (let i in content) {
                        if (Array.isArray(content[i]))
                            content[i] = lg.simplify(content[i], true);
                        else content[i] = content[i].path;
                    }
                    return content
                } else return content.map(o => o.path)
            }
            return content
        },
        getDirContent(dirPath) {
            return fs.readdirSync(dirPath).map(name => lg.statFile(path.join(dirPath, name)));
        },
        filterContent(content, dirsPass) {
            if (dirsPass)
                return content.filter(o => o.dir || lg.pass(o.name));
            return content.filter(o => lg.pass(o.name));
        },
        pass(fileName) {
            if (!opts.showHidden && fileName[0] === '.')
                return false;
            let ok = opts.useList === 'b';
            if (ok) {
                for (let li of opts.blackList) {
                    if (typeof li === 'string' && fileName.toLowerCase().endsWith(li.toLowerCase()))
                        return false;
                    else if (li instanceof RegExp && li.test(fileName))
                        return false
                }
            } else {
                for (let li of opts.whiteList) {
                    if (typeof li === 'string' && fileName.toLowerCase().endsWith(li.toLowerCase()))
                        return true;
                    else if (li instanceof RegExp && li.test(fileName))
                        return true
                }
            }
            return ok
        },
        listFiles(dirPath, recursive, maxDepth, depth) {
            const content = lg.filterContent(lg.getDirContent(dirPath), true);
            const files = [];
            const dirs = [];
            for (let c of content) {
                if (lg.isDir(c))
                    dirs.push(c);
                else files.push(c);
            }
            if (recursive && (maxDepth === -1 || maxDepth > depth))
                dirs.forEach(dir => {
                    files.push(...lg.listFiles(dir.path, recursive, maxDepth, (depth + 1)))
                });
            return files;
        },
        listDir(dirPath) {
            return lg.simplify(lg.sortByDir(lg.filterContent(lg.getDirContent(dirPath), false)));
        },
        isDir(f) {
            if (typeof f === 'string')
                return fs.statSync(f).isDirectory()
            return !!f.dir
        },
        listTree(dirPath, maxDepth, depth) {
            const content = lg.sortByDir(lg.filterContent(lg.getDirContent(dirPath), true));
            if (maxDepth === -1 || maxDepth > depth)
                for (let i in content) {
                    if (lg.isDir(content[i]))
                        content[i] = lg.listTree(content[i].path, maxDepth, (depth + 1));
                }
            return content
        }
    };
    return lg
}

module.exports = class KFLS {
    /**
     * Create a synchronous file lister.
     * @param {Object} opts options for file listing.
     * @param {boolean} [opts.detailed=false] true for detailed output. Detailed output will generate array of objects, not strings
     * @param {string[]|string} [opts.details=['size']] array of fs.stat details returned. 'all' for everything
     * @param {string[]|RegExp[]} [opts.blackList=[]] files with names ending with strings in blackList will not be listed
     * @param {string[]|RegExp[]} [opts.whiteList=[]] only files with names in whiteList will be listed. BlackList will be ignored if present.
     * @param {Function} [opts.sizeFormatter=null] returned sizes will be passed through this function
     * @param {boolean} [opts.showHidden=false] blacklists .dot files
     * @param {boolean} [opts.sortByName=false] sorts lists so that directories are always first if set to true
     *
     */
    constructor(opts = {}) {
        this.opts = opts;
        this.opts.detailed = Boolean(opts.detailed || (opts.details && opts.details.length));
        this.opts.details = opts.details || ['size'];
        this.opts.blackList = opts.blackList || [];
        this.opts.whiteList = opts.whiteList || [];
        this.opts.useList = this.opts.whiteList.length ? 'w' : 'b';
        this.opts.sizeFormatter = opts.sizeFormatter;
        this.opts.showHidden = Boolean(opts.showHidden);
        this.opts.sortByName = Boolean(opts.sortByName);
        this._lg = getLogic(this.opts)
    }

    /**
     * Lists all files in the directory and possibly subdirectories.
     * @param {string} dirPath path to the directory
     * @param {boolean} [recursive=false] whether also the subdirectories should be listed
     * @param {number} [maxDepth] do not dive into subdirectories deeper than maxDepth
     * @returns {null|string[]|Object[]} flat array of file names
     */
    listFiles(dirPath, recursive, maxDepth = -1) {
        dirPath = path.normalize(dirPath);
        maxDepth = parseInt(maxDepth);
        if (this._lg.isDir(dirPath) && !isNaN(maxDepth))
            return this._lg.simplify(this._lg.listFiles(dirPath, recursive, maxDepth, 0));
        return null
    }

    /**
     * Lists files AND DIRECTORIES in a directory.
     * @param {string} dirPath target directory path
     * @returns {string[]|Object[]} array of files and dirs
     */
    listOneDir(dirPath) {
        dirPath = path.normalize(dirPath);
        if (!this._lg.isDir(dirPath))
            return [];
        return this._lg.listDir(dirPath);
    }

    /**
     * Lists files into a deep array, copying fs's tree structure.
     * @param {string} dirPath target directory path
     * @param {number} [maxDepth] do not dive into subdirectories deeper than maxDepth
     * @returns {Object[]}
     */
    listFilesTree(dirPath, maxDepth = -1) {
        return this._lg.simplify(this._lg.listTree(dirPath, maxDepth, 0), true);
    }

    /**
     * Checks whether the filePath is a directory.
     * @param {string|Object} filePath fs will be asked if filePath is string, otherwise its 'dir' property will be returned
     * @returns {boolean} whether it is a directory
     */
    isDirectory(filePath) {
        return this._lg.isDir(filePath)
    }
};