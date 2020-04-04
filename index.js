const fs = require('fs');
const path = require('path');

function getLogic(opts) {
    class Dc {
        constructor(dpath, direntEntryList) {
            this.path = path.normalize(dpath);
            this.list = direntEntryList;
        }

        /**
         * @param {boolean} filterDirs
         * @returns {Dc} this
         */
        filterContent(filterDirs) {
            if (filterDirs)
                this.list = this.list.filter(de => (!de.isSymbolicLink() || !opts.ignoreLinks) && lg.pass(de.name));
            else
                this.list = this.list.filter(de => de.isDirectory() || ((!de.isSymbolicLink() ||
                    !opts.ignoreLinks) && lg.pass(de.name)));
            return this
        }

        /**
         * @returns {Dc} this
         */
        sortByDir() {
            if (opts.sortByName)
                return this;
            const dirs = [],
                files = [];
            for (let de of this.list)
                de.isDirectory() ? dirs.push(de) : files.push(de);
            this.list = dirs.concat(files);
            return this
        }

        /**
         * @returns {Object[]|string[]}
         */
        finalizeContent() {
            const fmapper = e => {
                if (e instanceof Dc) {
                    return e.finalizeContent();
                } else if (opts.detailed) {
                    const o = {
                        name: path.basename(e.name),
                        path: e.path,
                        dir: e.isDirectory()
                    };
                    o.ext = path.extname(o.name);
                    o.full = path.resolve(o.path);
                    if (opts.stats) {
                        try {
                            o.stats = fs.statSync(o.full)
                            if(opts.sizeFormatter)
                                o.stats.size = opts.sizeFormatter(opts.stats.size)
                        } catch (err) {
                            o.stats = {err: 'NO PERMISSION'}
                        }
                    }
                    return o
                } else return e.path
            };
            return this.list.map(fmapper);
        }
    }

    const lg = {
        /**
         * @param {string} dirPath
         * @returns {Dc}
         */
        getDirContent(dirPath) {
            try {
                const dc = fs.readdirSync(dirPath, {withFileTypes: true});
                dc.forEach(c => c.path = path.join(dirPath, c.name));
                return new Dc(dirPath, dc)
            } catch (err) {
                return new Dc(dirPath, [])
            }
        },

        /**
         * @param {string} fileName
         * @returns {boolean}
         */
        pass(fileName) {
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
        /**
         *
         * @param {string} dirPath
         * @returns {Dc}
         */
        listOneDir(dirPath) {
            return lg.getDirContent(dirPath).filterContent(opts.filterDirs).sortByDir()
        },
        /**
         * @param dirPath
         * @param recursive
         * @param maxDepth
         * @param depth
         * @returns {Dc}
         */
        listFiles(dirPath, recursive, maxDepth, depth) {
            const dc = lg.getDirContent(dirPath).filterContent(opts.filterDirs); // will be sorted anyway .sortByDir();
            const fDes = [];
            const dDes = [];
            for (let c of dc.list) {
                if (c.isDirectory())
                    dDes.push(c);
                else fDes.push(c);
            }
            if (recursive && (maxDepth === -1 || maxDepth > depth))
                dDes.forEach(dDe => {
                    fDes.push(...lg.listFiles(dDe.path, recursive, maxDepth, (depth + 1)).list)
                });
            dc.list = fDes;
            return dc
        },
        /**
         * @param {string} dirPath
         * @param {number} maxDepth
         * @param {number} depth
         * @returns {Dc}
         */
        listTree(dirPath, maxDepth, depth) {
            const dc = lg.getDirContent(dirPath).filterContent(opts.filterDirs).sortByDir();
            for (let i in dc.list) {
                if (dc.list[i].isDirectory()) {
                    if (maxDepth === -1 || maxDepth > depth) {
                        dc.list[i] = lg.listTree(dc.list[i].path, maxDepth, (depth + 1));
                    }
                }
            }
            return dc
        }
    };
    return lg
}

module.exports = class FileLister {
    /**
     * Create a synchronous file lister.
     * @param {Object} opts options for file listing
     * @param {boolean} [opts.detailed=false] true for detailed output. Detailed output will generate array of objects, not strings
     * @param {boolean} [opts.stats=false] set true for details + file stats
     * @param {string[]|RegExp[]} [opts.blackList=[]] files with names ending with strings in blackList will not be listed
     * @param {string[]|RegExp[]} [opts.whiteList=[]] only files with names in whiteList will be listed. BlackList will be ignored if present.
     * @param {boolean} [opts.filterDirs] whether black/white list should also filter directories
     * @param {Function} [opts.sizeFormatter=null] returned sizes will be passed through this function
     * @param {boolean} [opts.sortByName=false] sorts lists so that directories are always first if set to true
     * @param {boolean} [opts.ignoreLinks=true] filters out symbolic links
     *
     */
    constructor(opts = {}) {
        this.opts = opts;
        this.opts.blackList = opts.blackList || [];
        this.opts.stats = !!opts.stats;
        this.opts.detailed = !!opts.detailed || this.opts.stats;
        this.opts.filterDirs = !!opts.filterDirs;
        this.opts.whiteList = opts.whiteList || [];
        this.opts.useList = this.opts.whiteList.length ? 'w' : 'b';
        this.opts.sizeFormatter = opts.sizeFormatter;
        this.opts.sortByName = Boolean(opts.sortByName);
        this.opts.ignoreLinks = opts.ignoreLinks !== false;
        this._lg = getLogic(this.opts)
    }

    /**
     * Lists all files in the directory and possibly subdirectories.
     * @param {string} dirPath path to the directory
     * @param {boolean} [recursive=true] whether also the subdirectories should be listed
     * @param {number} [maxDepth] do not dive into subdirectories deeper than maxDepth
     * @returns {null|string[]|Object[]} flat array of file names
     */
    listFiles(dirPath, recursive = true, maxDepth = -1) {
        dirPath = path.normalize(dirPath);
        return this._lg.listFiles(dirPath, recursive, maxDepth, 0).finalizeContent();
    }

    /**
     * Lists files AND DIRECTORIES in a directory.
     * @param {string} dirPath target directory path
     * @returns {string[]|Object[]} array of files and dirs
     */
    listOneDir(dirPath) {
        dirPath = path.normalize(dirPath);
        return this._lg.listOneDir(dirPath).finalizeContent();
    }

    /**
     * Lists files into a deep array, copying fs's tree structure.
     * @param {string} dirPath target directory path
     * @param {number} [maxDepth] do not dive into subdirectories deeper than maxDepth
     * @returns {string[]|Object[]}
     */
    listFilesTree(dirPath, maxDepth = -1) {
        return this._lg.listTree(dirPath, maxDepth, 0).finalizeContent()
    }

    isDirectory(filePath){
        try{
            return fs.statSync(filePath).isDirectory()
        }catch(err){
            return false;
        }
    }
};