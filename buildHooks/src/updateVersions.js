import path from 'path';
import { Doctor, FileUtils } from 'rnv';
import fs from 'fs';

const { fsExistsSync, readObjectSync } = FileUtils;

const merge = require('deepmerge');

const VERSIONED_PACKAGES = [
    'rnv',
    'renative-template-hello-world',
    'renative-template-blank',
    'rnv-engine-rn',
    'rnv-engine-rn-tvos',
    'rnv-engine-rn-macos',
    'rnv-engine-rn-next',
    'rnv-engine-rn-web',
    'rnv-engine-lightning',
    'rnv-engine-rn-electron',
    'rnv-engine-rn-windows',
    'rnv-sdk-apple',
    'rnv-sdk-android',
    'rnv-sdk-webpack',
    'renative',
];

const updateDeps = (pkgConfig, depKey, packageNamesAll, packageConfigs, semVer = '') => {
    const { pkgFile, rnvFile } = pkgConfig;


    packageNamesAll.forEach((v) => {
        if (pkgFile) {
            let hasChanges = false;
            const currVer = pkgFile?.[depKey]?.[v];
            if (currVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;

                if (currVer !== newVer) {
                    console.log('Found linked dependency to update:', v, currVer, newVer);
                    hasChanges = true;
                    pkgFile[depKey][v] = newVer;
                }
            }
            if (hasChanges) {
                const output = Doctor.fixPackageObject(pkgFile);
                FileUtils.writeFileSync(pkgConfig.pkgPath, output, 4, true);
            }
        }
        if (rnvFile) {
            let hasRnvChanges = false;
            const templateVer = rnvFile?.templates?.[v]?.version;
            if (templateVer) {
                const newVer = `${semVer}${packageConfigs[v].pkgFile?.version}`;
                if (templateVer !== newVer) {
                    console.log('Found linked plugin dependency to update:', v, templateVer, newVer);
                    hasRnvChanges = true;
                    rnvFile.templates[v].version = newVer;
                }
            }
            if (hasRnvChanges) {
                const output = Doctor.fixPackageObject(rnvFile);
                FileUtils.writeFileSync(pkgConfig.rnvPath, output, 4, true);
            }
        }
    });
};

export const updateVersions = async (c) => {
    const rootPackage = FileUtils.readObjectSync(
        path.join(c.paths.project.dir, 'package.json')
    );
    const v = {
        version: rootPackage.version
    };
    const pkgFolder = path.join(c.paths.project.dir, 'packages');
    _updateJson(c, c.paths.project.package, v);

    VERSIONED_PACKAGES.forEach((pkgName) => {
        _updateJson(c, path.join(pkgFolder, pkgName, 'package.json'), v);
    });

    _updateJson(
        c,
        path.join(
            pkgFolder,
            'rnv/pluginTemplates/renative.plugins.json'
        ),
        {
            pluginTemplates: {
                renative: v
            }
        }
    );

    _updateJson(
        c,
        path.join(
            pkgFolder,
            'rnv/coreTemplateFiles/renative.templates.json'
        ),
        {
            engineTemplates: {
                '@rnv/engine-rn': v,
                '@rnv/engine-rn-tvos': v,
                '@rnv/engine-rn-web': v,
                '@rnv/engine-rn-next': v,
                '@rnv/engine-rn-electron': v,
                '@rnv/engine-lightning': v,
                '@rnv/engine-rn-macos': v,
                '@rnv/engine-rn-windows': v
            },
        }
    );


    const pkgDirPath = path.join(c.paths.project.dir, 'packages');
    const dirs = fs.readdirSync(pkgDirPath);

    const packageNamesAll = [];
    const packageConfigs = {};

    const parsePackages = (dirPath) => {
        let pkgName;
        let rnvPath;
        let _pkgPath;
        let rnvFile;
        let pkgFile;

        if (fs.statSync(dirPath).isDirectory()) {
            _pkgPath = path.join(dirPath, 'package.json');
            if (fsExistsSync(_pkgPath)) {
                pkgFile = readObjectSync(_pkgPath);
                pkgName = pkgFile.name;
            }
            const _rnvPath = path.join(dirPath, 'renative.json');
            if (fsExistsSync(_rnvPath)) {
                rnvPath = _rnvPath;
                rnvFile = readObjectSync(rnvPath);
            }
        }
        packageConfigs[pkgName] = {
            pkgName,
            rnvPath,
            pkgPath: _pkgPath,
            pkgFile,
            rnvFile
        };
        packageNamesAll.push(pkgName);
    };

    parsePackages(c.paths.project.dir);

    dirs.forEach((dir) => {
        parsePackages(path.join(pkgDirPath, dir));
    });

    packageNamesAll.forEach((pkgName) => {
        const pkgConfig = packageConfigs[pkgName];
        updateDeps(pkgConfig, 'dependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'devDependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'optionalDependencies', packageNamesAll, packageConfigs);
        updateDeps(pkgConfig, 'peerDependencies', packageNamesAll, packageConfigs, '^');
    });


    FileUtils.copyFileSync(
        path.join(c.paths.project.dir, 'README.md'),
        path.join(pkgFolder, 'renative/README.md')
    );

    FileUtils.copyFileSync(
        path.join(c.paths.project.dir, 'README.md'),
        path.join(pkgFolder, 'rnv/README.md')
    );


    // const packagesDir = path.join(c.paths.project.dir, '..');
    //
    // const engines = [
    //     'rnv-engine-rn',
    //     'rnv-engine-rn-web',
    //     'rnv-engine-rn-next',
    //     'rnv-engine-rn-electron',
    //     'rnv-engine-lightning'
    // ];
    // engines.forEach((engineDir) => {
    //     const ePath = path.join(packagesDir, engineDir, 'renative.engine.json');
    //     const engine = FileUtils.readObjectSync(ePath);
    //     const { id } = engine;
    //     const npm = engine?.npm?.devDependencies?.[`@rnv/${id}`];
    //     if (npm) {
    //         engine.npm.devDependencies[`@rnv/${id}`] = rootPackage.version;
    //     }
    //     const output = Doctor.fixPackageObject(engine);
    //     FileUtils.writeFileSync(ePath, output, 4, true);
    // });

    return true;
};


const _updateJson = (c, pPath, updateObj) => {
    const pObj = FileUtils.readObjectSync(pPath);

    if (!pObj) {
        throw new Error(
            `_updateJson called with unresolveable package.json path '${pPath}'`
        );
    }

    let obj;
    if (pObj) {
        obj = merge(pObj, updateObj);
    }
    const output = Doctor.fixPackageObject(obj);
    FileUtils.writeFileSync(pPath, output, 4, true);
};
