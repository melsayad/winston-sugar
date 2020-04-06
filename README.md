# **winston-sugar**

<img alt="npm" src="https://img.shields.io/npm/v/winston-sugar">
<img alt="NPM" src="https://img.shields.io/npm/l/winston-sugar">

Syntactical sugar on top of `winston`, configuring winston will be easy using .json configuration file.

Special thanks for all of `winston` team for the great logger.

**Installation**

Use **npm** command  - `npm i winston-sugar`

`winston-sugar` will create a folder name `config` if not exist and add `winston.json` file template.

**How to use it?**

- Build you .json configurations file (rich example here-under).
- Require `winston-sugar` to get a class `WinstonLoader` instance.
- Load your winston logger configurations by passing the .json path to the `config` function.
- Get your winston logger by calling `getLogger` function, you can add `category` as string parameter if you need to have a child logger for a specific module.

**note:** you need to call `config` only one time from the entry point of your application. 

- After that your can only do like this:

`const logger = require('winston-sugar').getLogger('app');`

example:


```
// Import winson-sugar when you need to have a winston instance
const winstonLoader = require('winston-sugar');

// This should be called in the application entry point only.
winstonLoader.config('../config/winston.json');

// Get winston logger
const log = winstonLoader.getLogger('app');

// Enjoy and log using winston
log.info("It's me winson-sugar :) "); 
```
**Dependances**

winston@3.2.1

**Build your .json winston configurations file**

The .json configuration schema has 7 main parameters:

- **level**  - (optional) Including the main logging level value (info,debug,warn ...etc.).

  `ex. "level": "info"`  - Also it's the default value in winston-sugar

- **levels** - (optional) Including 2 child parameters (values & colors) if you need to customize your levels along with colors.

```
ex. Customize logger levels and it's clolors

"levels":{
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
   }
```

- **silent** - (optional) Use `silent` if you need to stop the winston logger by change it's value to `true`

  `ex. "silent": false`  - Also it's the default value in winston-sugar

- **exitOnError** - (optional) Use `exitOnError` if you need to stop the winston when error occurred by change it's value to `true`

  `"exitOnError": false` - Also it's the default value in winston-sugar

- **format** - (mandatory) Array of `winston.format` functions, just put the exact function name without (), also you can add it's options as the following example. (please check `winston.format` from winston format section).

**Extra Feature:** Specially for `winston.printf` format function, I created a special syntax using templates, template is a callback function defined as string parameter, this function will be passed to `winston.printf` function in the runtime.

```
ex. Adding two winston.format functions, winston-sugar will combine all format functions on behalf of you :)

"format": [
    {
      "type": "timestamp",  
      "options": {
        "format": "YYYY-MM-DDThh:mm:ss.SSS"
      }
    },
    {
      "type": "printf", 
      "options": {
        "template": "custom" // the name of the custom template.
      }
    }
  ]
``` 

- **transports** - (mandatory) Array of `winston.transports` functions, just put the exact transport name, also you can add it's options as the following example. (please check `winston.transports` from winston transports section).
                
**Extra Feature:** 
Now you can restrict your transport for a specific levels using `filters`, I created a special syntax using templates, let's say you have 2 `winston.transports.File` you can configure the first to log `info` messages only, and the last for `error` and `fatal`.

Also using the new introduced `env` parameter, you can easily configure each transport to be run only for a specific environment. for this option `winston-sugar` will read define the application running environment from `NODE_ENV` global parameter.  
```
ex. Adding 3 types of transports, one is type of Console for development, and the rest of type File for production.

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
        "format": [ // Override the deafult logging format.
          {
            "type": "printf",
            "options": {
              "template": "custom-colored" // the name of the custom template.
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
        "filters": [ // Override the logging level.
          "info",    // log level info and mark only.
          "mark"     
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
        "filters": [  // Override the logging level.
          "error",    // log level error and fatal only.
          "fatal"
        ]
      }
    }
  ]
```

- **printf** - (mandatory) Only if you are using `printf` as a type of `winston.format` function, you can easy defined you logging template as callback function.

**Warning:** Check the syntax of your callback function before converting it to a string format. wrong syntax will throw an `error` in the runtime.

```
ex. Three callback funcation templates

"printf": {
    "templates": {
      "custom": "(({level, message, category, timestamp})=> { return `[${timestamp}] [${level}] ${(category)?category:'winston'} - ${message}`;})",
      "custom-colored": "(({level, message, category, timestamp})=> { return winston.format.colorize({all:true}).colorize(level,`[${timestamp}] [${level.toUpperCase()}] ${(category)?category:'winston'}`) + ` - ${message}`;})",
      "custom-all": "((info) => {let message = `${new Date(Date.now()).toUTCString()} | ${info.level.toUpperCase()} | ${info.message} | `; message = info.obj ? message + `data:${JSON.stringify(info.obj)} | ` : message; message = this.log_data ? message + `log_data:${JSON.stringify(this.log_data)} | ` : message; return message;})"
    }
  }
```

**Configurations .json file template**

- Please check the `winston.json` under `config` directory.


**Licenses**

MIT License

Copyright (c) 2020 Mohamed El Sayad (Anubis)