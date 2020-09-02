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
    this[_environment] = (process.env.NODE_ENV) ? process.env.NODE_ENV : 'development';
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
      const load = JSON.parse(fs.readFileSync(filename, 'utf8'));
      for (let key in load) this[_configFile][key] = load[key];
    } catch (e) {
      console.log(e);
      throw new Error(`Invalid config path or Problem in reading config.json from file`);
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
      level: this[_configFile].level || 'info',
      silent: this[_configFile].silent || false,
      exitOnError: this[_configFile].exitOnError || true,
      transports: [],
    };
    // Check is format parameter is defined, then we need to combine it's formats
    if (this[_configFile].format) this[_combineFormat](this[_configFile].format, options);
    // Check is transports parameter is defined, then we need to load all transports
    if (this[_configFile].transports && this[_configFile].transports.length >
        0) this[_loadTransports](this[_configFile].transports, options);
    // Load Colors
    // noinspection JSCheckFunctionSignatures
    if (this[_configFile].levels && this[_configFile].levels.colors) winston.addColors(this[_configFile].levels.colors);
    // check custom levels
    if (this[_configFile].levels && this[_configFile].levels.values) options.levels = this[_configFile].levels.values;
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
        try {
          // Create new transport
          destination.transports.push(new winston.transports[transport.type](transport.options));
        } catch (e) {
          throw new Error(`Invalid winston.transports.${transport.type} options parameters`);
        }

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
        try {
          formatsAndFilters.push(winston.format(callback)());
        } catch (e) {
          throw new Error('Invalid level information');
        }
      }
      // Check formats
      if (formats && formats.length > 0) {
        for (let format of formats) {
          // Check if type equals printf in order to pass the predefined template function
          if (format.type && format.type === 'printf') {
            try {
              // Map & update printf options with passing a template cb function from winston json configurations printf.templates
              if (format.options.template) format.options = eval(this[_configFile].printf.templates[format.options.template]);
            } catch (e) {
                throw new Error('Invalid winston.format.printf(cb) - callback function string error');
            }

          }
          try {
            // Adding format to be combined
            formatsAndFilters.push(winston.format[format.type](format.options));
          } catch (e) {
            throw new Error(`Invalid winston.format.${format.type}() function signature name or options parameters`);
          }

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
    if (!winston.loggers.get(this[_loggerName]))
      throw new Error(`winston.Logger is not configured, please call config function first`);
    if (category) {
      return winston.loggers.get(this[_loggerName]).child({'category': category});
    } else {
      return winston.loggers.get(this[_loggerName]);
    }
  }

  /** 
   * This function will replace console. log/info/warn/error/debug with winston-sugar equivalent
   * Making it super easy to go from old console.log based programs to winston.
   * Full conversion can look like
   * 
   * const winstonLoader = require('winston-sugar');
   * winstonLoader.config('./config/winston.json');
   * const log = winstonLoader.getLogger(path.basename(process.argv[1], '.js'));
   * winstonLoader.replaceConsole(log);
   */
  replaceConsole() {
    const log = this;
    log.stream = {
      write: function(message, encoding) {
        log.info(message);
      },
    };
    console.log = (...args) => log.info(...args);
    console.info = (...args) => log.info(...args);
    console.warn = (...args) => log.warn(...args);
    console.error = (...args) => log.error(...args);
    console.debug = (...args) => log.debug(...args);
  }
}

module.exports = new WinstonLoader();



