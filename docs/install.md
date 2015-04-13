
## Prerequisites

* [Node.js](http://nodejs.org/download/) (v0.10.24+)
* [npm](https://docs.npmjs.com/getting-started/installing-node) (v1.3.0+)

## Installation from npm

The `swagger-node` module is designed for Node.js and is available through npm.

### Installing on Linux / Mac

Here's how you install with `sudo`. If you do not wish to use `sudo`, see [Using npm without sudo](#nosudo) below. 

1. Open a terminal. 
2. Run the install:

    `sudo npm install -g swagger-node`

**Note**: `sudo` may or may not be required with the `-g` option depending on your configuration. If you do not use `-g`, you may need to add the `swagger-node/bin` directory to your PATH manually. On Unix-based machines 
the bin directory will often be found here: `/usr/local/lib/node_modules/swagger-node/bin`.

### Installing on Windows

1. Open a terminal.
2. Run the install:

    `npm install -g swagger-node`

## <a name="nosudo"></a>Using npm without sudo

By default npm will place 'global' modules installed with the `-g` flag in `/usr/local/lib/node_modules` using the default prefix of `/usr/local`.  Global executables would be placed in `/usr/local/bin` using the same default prefix, thereby putting them on the default PATH in most cases.  In order to write to both of these directories root permissions are required.

Many Node.js developers choose to use a different prefix such that they do not need to use root permissions to install modules using the `-g` flag (rightfully so - you should always be wary about things that 'require root permissions'!).  Using root permissions is effectively a shortcut.  In order to use executables installed using a different prefix you need to add an element to your path.

### Here are the steps:

1. Set the 'prefix' for npm by using the following command (documented here: [npm-config](https://www.npmjs.org/doc/misc/npm-config.html).  This will create a file `~/.npmrc` that contains configuration information for npm.

```bash
    npm set prefix ~/npm
```

2. Edit your `.bash_profile` or the appropriate shell initialization script to add `~/npm` to your `PATH` by adding the following line (or placing the single line in the new file if it does not exist):

    ```bash
    PATH=~/npm/bin:$PATH
    ```

    This will enable you to easily use executable scripts installed using `-g` through npm - both for swagger-node and for other tools as well!

###Configuring the default browser on Linux

On Linux platforms, you need to specify your browser path before using the Swagger editor. 

1. Create or open the following file in a text editor:

    `~/.a127/config.js`

2. Add the following contents to the file:

    ```javascript
        module.exports = {
           browser: ’the/path/to/your/browser'
        };
    ```
