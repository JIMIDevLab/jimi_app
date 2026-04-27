const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Scope the watcher to the project root. infra/ and other deployment
// artifacts sit alongside the app source — Metro doesn't need to watch
// them and doing so can hit macOS' open-files limit (EMFILE) on busy
// repos.
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

module.exports = config;
