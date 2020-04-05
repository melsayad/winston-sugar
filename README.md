# **winston-sugar**

<img alt="npm" src="https://img.shields.io/npm/v/winston-sugar">
<img alt="NPM" src="https://img.shields.io/npm/l/winston-sugar">

Syntactical sugar on to of winston, configure winston will be easy using .json configuration file.

**How to use it?**

```
// Import winson-sugar when you need to have a winston instance
const loggerLoader = require('winston-sugar');

// This should be called in the application entry point only.
loggerLoader.config('./<path>/winston.json');

// Get winston logger
const log = loggerLoader.getLogger('app');

// Enjoy and log using winston
log.info("It's me winson-sugar :) "); 
```
**Dependances**

winston@3.2.1

**.JOSN configurations file template**
```
{
  "level": "trace",
  "silent": false,
  "exitOnError": false,
  "levels": {
    "values": {
      "trace": 6,
      "debug": 5,
      "info": 4,
      "warn": 3,
      "error": 2,
      "fatal": 1,
      "mark": 0
    },
    "colors": {
      "trace": "blue",
      "debug": "cyan",
      "info": "green",
      "warn": "yellow",
      "error": "red",
      "fatal": "magenta",
      "mark": "grey"
    }
  },
  "format": [
    {
      "type": "timestamp", // it can be any winston.format function, just put the exact function name 
      "options": { // you can add you format function options, please check winston fromat section.
        "format": "YYYY-MM-DDThh:mm:ss.SSS"
      }
    },
    {
      "type": "printf", 
      "options": {
        "template": "log4js" // you can define your own cb template function in 'printf' properity in the end of this schema
      }
    }
  ],
  "transports": [
    {
      "type": "Console",
      "name": "dev-logger",
      "env": "development",
      "options": {
        "stderrLevels ": [
          "fatal",
          "error"
        ],
        "consoleWarnLevels": [
          "debug",
          "warn"
        ],
        "handleExceptions": true,
        "format": [
          {
            "type": "printf",
            "options": {
              "template": "log4js-colored"
            }
          }
        ]
      }
    },
    {
      "type": "File",
      "name": "info-logger",
      "env": "production",
      "options": {
        "filename": "log/app.log",
        "maxsize": "100m",
        "maxFiles": 3,
        "tailable": true,
        "maxRetries": 3,
        "zippedArchive": true,
        "handleExceptions": true,
        "filters": [ // you can restrict this transport into specific level
          "info",
          "mark"
        ]
      }
    },
    {
      "type": "File",
      "name": "warn-logger",
      "env": "production",
      "options": {
        "filename": "log/warns.log",
        "maxsize": "100m",
        "maxFiles": 3,
        "tailable": true,
        "maxRetries": 3,
        "zippedArchive": true,
        "handleExceptions": true,
        "filters": [
          "warn"
        ]
      }
    },
    {
      "type": "File",
      "name": "error-logger",
      "env": "production",
      "options": {
        "filename": "log/fatal.log",
        "maxsize": "100m",
        "maxFiles": 3,
        "tailable": true,
        "maxRetries": 3,
        "zippedArchive": true,
        "handleExceptions": true,
        "filters": [
          "error",
          "fatal"
        ]
      }
    }
  ],
  "printf": { // you can customize your own template, just put the callback function as string, and give it a name
    "templates": { 
      "log4js": "(({level, message, category, timestamp})=> { return `[${timestamp}] [${level}] ${(category)?category:'winston'} - ${message}`;})",
      "log4js-colored": "(({level, message, category, timestamp})=> { return winston.format.colorize({all:true}).colorize(level,`[${timestamp}] [${level.toUpperCase()}] ${(category)?category:'winston'}`) + ` - ${message}`;})",
      "custom-all": "((info) => {let message = `${new Date(Date.now()).toUTCString()} | ${info.level.toUpperCase()} | ${info.message} | `; message = info.obj ? message + `data:${JSON.stringify(info.obj)} | ` : message; message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message; return message;})"
    }
  }
}
```

**Licenses**

MIT License

Copyright (c) 2020 Mohamed El Sayad (Anubis)