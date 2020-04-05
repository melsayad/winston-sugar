const winston = require('winston');
const fs = require('fs');
const path = require('path');

/*

 */
const _loggerName = Symbol();
const _environment = Symbol();
const _configFile = Symbol();
const _loadTransports = Symbol();
const _combineFormat = Symbol();

/**
 * Class Winston Loader
 */
class WinstonLoader {

  /**
   * WinstonLoader constructor function
   * @param name (optional) - The name of the winston logger, default is winston
   */
  constructor(name) {
    this[_environment] = (process.env.NODE_ENV && process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'testing') ?
        process.env.NODE_ENV :
        'development';
    this[_loggerName] = (name) ? name : 'winston';
    this[_configFile] = {};
  }

  /**
   * Use this function if you need to load the .json configurations files without initiating the winston logger.
   * This should be called only once time in the begging of your application.
   * @param filename - The file name including path ex: ./config/winston.json - you can change the file name
   */
  loadConfigFile(filename) {
    try {
      const load = JSON.parse(fs.readFileSync(path.join(__dirname, filename), 'utf8'));
      for (let key in load) this[_configFile][key] = load[key];
    } catch (e) {
      throw new Error(`Problem reading config from file ${filename}. Error was ${e.message}`);
    }
  }

  /**
   * Use this function if you need to load the .json configurations and initiate the winston logger.
   * This should be called only once time in the begging of your application.
   * @param filename - The file name including path ex: ./config/winston.json - you can change the file name
   */
  config(filename) {
    this.loadConfigFile(filename);
    // Set the default configuration options
    const options = {
      level: this[_configFile].level,
      levels: this[_configFile].levels.values,
      silent: this[_configFile].silent,
      exitOnError: this[_configFile].exitOnError,
      transports: [],
    };
    // Check is format parameter is defined, then we need to combine it's formats
    if (this[_configFile].format) this[_combineFormat](this[_configFile].format, options);
    // Check is transports parameter is defined, then we need to load all transports
    if (this[_configFile].transports && this[_configFile].transports.length >
        0) this[_loadTransports](this[_configFile].transports, options);
    // Load Colors
    // noinspection JSCheckFunctionSignatures
    winston.addColors(this[_configFile].levels.colors);
    // Load winston options
    winston.loggers.add(this[_loggerName], options);
  }

  [_loadTransports](transports, destination) {
    if (!destination) return;
    for (let transport of transports) {
      // Check is format parameter is defined, then we need to combine it's formats
      if (transport.options.format ||
          transport.options.filters) this[_combineFormat](transport.options.format, transport.options, transport.options.filters);
      // Check transport environment
      // noinspection JSValidateTypes
      if (transport.env.toLowerCase() === this[_environment].toLowerCase())
          // Create new transport
        destination.transports.push(new winston.transports[transport.type](transport.options));
    }
  }

  [_combineFormat](formats, destination, filters) {
    if (!destination) return;
    if (formats || filters) {
      const formatsAndFilters = [];
      // Check filters
      if (filters && filters.length > 0) {
        const conditions = filters.map((e) => ' info.level === "' + e + '" ').join('||');
        const callbackStr = `((info, opts) => { return (${conditions}) ? info : false; })`;
        // Create s custom format according to the filters, and adding it to be combined
        const callback = eval(callbackStr);
        formatsAndFilters.push(winston.format(callback)());
      }
      // Check formats
      if (formats && formats.length > 0) {
        for (let format of formats) {
          // Check if type equals printf in order to pass the predefined template function
          if (format.type && format.type === 'printf') {
            // Map & update printf options with passing a template cb function from winston json configurations printf.templates
            if (format.options.template) format.options = eval(this[_configFile].printf.templates[format.options.template]);
          }
          // Adding format to be combined
          formatsAndFilters.push(winston.format[format.type](format.options));
        }
      }
      // Combine all formats or add a single format
      destination.format = (formatsAndFilters.length > 1) ? winston.format.combine(...formatsAndFilters) : formatsAndFilters[0];
    }
  }

  /**
   * This function return an instance of winston logger
   * @param category (optional) - If you need to have child logger for a specific module.
   * @returns {winston.Logger} - return winston logger instance
   */
  getLogger(category) {
    if (category) {
      return winston.loggers.get(this[_loggerName]).child({'category': category});
    } else {
      return winston.loggers.get(this[_loggerName]);
    }
  }
}

module.exports = new WinstonLoader();



