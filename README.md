# Mikroways Reveal common configuration

This package only provides a common configuration for all Mikroways courses.
It is a single point of configuration for every course, giving us the power of
change themes, plugin settings and other options upgrading this package.

On the other hand, this package provides helpers to be used within reveal-md.
This feature is achieved with  `preproc.js`.

Another tool is the `text2voice` script. This script uses
[ElevenLabs](https://elevenlabs.io/) to generate mpe audio files using AI
models.

## Common configurations

* **`reveal-md.json`:** this file allows a [reveal-md](https://github.com/webpro/reveal-md)
  dproject to set common configurations.
* **`preproc.js`:** reveal-md preprocessor to be used within reveal-md
  presentations. It allows to easily import code sinppets from external files,
  other Markdown files, set slides styles, audio slides, and more.
* **`src/js/script.js`:** main javascript to load all plugins and custom
  scripts.

## Usage

Simple add this package as dependency and configure
[postinstall](https://www.npmjs.com/package/postinstall):

```
npm i --save @mikroways/reveal-md-common
```

Add the followig scripts and corresponding hooks into `package.json`:

```json
    ...,
    "prestart": "postinstall",
    "prestatic": "postinstall",
    "start": "reveal-md src/start.md --preprocessor preproc.js --watch",
    "static": "reveal-md src/start.md --preprocessor preproc.js --static",
    ...
  },
  "prepare": {
    "@mikroways/reveal-md-common/src/js/script.js": "link src/js/script.js",
    "@mikroways/reveal-md-common/preproc.js": "link preproc.js",
    "@mikroways/reveal-md-common/reveal-md.json": "link reveal-md.json"
  },
  "prestart": {
    "@mikroways/reveal-md-common/src/js/script.js": "link src/js/script.js",
    "@mikroways/reveal-md-common/preproc.js": "link preproc.js",
    "@mikroways/reveal-md-common/reveal-md.json": "link reveal-md.json"
  },
  "prestatic": {
    "@mikroways/reveal-md-common/src/js/script.js": "link src/js/script.js",
    "@mikroways/reveal-md-common/preproc.js": "link preproc.js",
    "@mikroways/reveal-md-common/reveal-md.json": "link reveal-md.json"
  },
  ...
```

> This configuration will run on **preprare**, **prestart** and **prestatic**
> life cycle events.

## Preprocessor helper functions


Reveal-md project now accepts Mikroways configurations that are read from
reveal-md.json file within a new *mikroways* options that accepts the following
configuration:

```yaml
mikroways:
  # Will print debug information
  debug: false
  # Base path to look for files
  basePath: 'src'
  # Base path to look for code blocks to import
  codePath: 'code'
  # Custom named slide formats
  formats:
    main: 'class="main-cover" data-transition="zoom"'
    new-topic: 'class="dark-logo-left" data-transition="zoom"'
    new-topic-center: 'class="dark-logo-center" data-transition="zoom"'
```

> Values are the current default configuration

This configurations are used by **helper functions** provided by our custom
preprocesor, `preproc.js`. This helpers are:

* **`SLIDE_FMT: format-name[, extra string]`:** format-name is one of the
  formats configured by `mikroways.format`. A comma is needed to append any
  string.
* **`FILE: path/to/file.md`:** will load an external file that will be located
  under `mikroways.basePath` named `path/to/file.md`. This allows to organize
  courses in a better way.
* **`CODE: path/to/code.ext highlight [lines] [class=name]`:** loads a
  highlighted code using syntax highlighting from an external file. This file
  will be located under `mikroways.codePath` named `path/to/code.ext`. Note that
  **highlight** is needed. Also accepts numbers to highlight specific lines,
  separated with comma or dash. After, a custom class can be set to change some
  styles.

## Example usage

Change slide format:

```
---
SLIDE_FMT: main

# Any title
---
```
> Will set slide format to `<!-- .slide: class="main-cover"
> data-transition="zoom" -->` with default configuration.

Extra options can be added:

```
---
SLIDE_FMT: main, data-transition-spped="fast"

# Any title
---
```

> Will set slide format to `<!-- .slide: class="main-cover"
> data-transition="zoom" data-transition-spped="fast" -->`.

To load an external file:

```
FILE: sections/some-slide.md
```
> Will load `some-slide.md` from a file located at `mikroways.basePath` and in
> this case, inside `sections/` directory.

A highlighted code example:

```
CODE: example.sh bash
```
> Will look for example.sh file inside `mikroways.basePath`, under directory
> `mikroways.codePath`. By default this is `src/code`. After the filename, it
> requires a language highlight configuration, in this case we specify bash
> script.

Now we will highlight only lines 1, and from 3 to 6: 

```
CODE: example.sh bash 1,3-6
```

Finally, is possible to add a custom class:

```
CODE: example.sh bash 1,3-6 class="my-code"
CODE: example.sh bash class="my-code"
```

## text2voice

text2voice is a command line tool to convert `.text` files into `.mp3`. It
can be configured using arguments:

```
text2voice -h
```
As you can see, an **API KEY** is required. You can set it using `-k` or using
an environment variable called `ELEVEN_API_KEY`.

To list all voices:

```
text2voice -k <API-key> -v help
```

To list all models:

```
text2voice -k <API-key> -m help
```

Text files are sued as input, and for each text file this tool will create a
corresponding audio file with the same filename, but adding a postfix with used
voice id. So, the following example:

```
text2voice -k <API-key> -m eleven_multilingual_v2  -v XrExE9yKIg1WjnnlVkGX \
  src/audio/title.text
```

Will generate src/audio/title-XrExE9yKIg1WjnnlVkGX.mp3. As every API call will
consume credits, this tool checks if text file is newer than a corresponding
audio file. If this is the case it will skip audio generation, unless `-f` is
used.

It also supports for globs:

```
text2voice -k <API-key> -m eleven_multilingual_v2 -v XrExE9yKIg1WjnnlVkGX \
  src/audio/**/*text
```
