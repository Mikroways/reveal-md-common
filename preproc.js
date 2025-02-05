const { readFileSync } = require('fs')
const path = require('path')

const LINE_SEPARATOR = '\n'
const FILE_REF_REGEX = /^FILE: (.+)$/
const CODE_FILE_REF_REGEX = /^CODE: (\S+)\s+(.+)$/
const SLIDE_FMT_REF_REGEX = /^SLIDE_FMT: +([\w_-]+),?(.*)$/

const codeTemplate = (code, args ) => (
   `\`\`\`${args}\n${code.replace(/^----? *$/gm,"")}\n\`\`\``)

const isFileReference = line => FILE_REF_REGEX.test(line)
const isCodeFileReference = line => CODE_FILE_REF_REGEX.test(line)
const isSlideFormatReference = line => SLIDE_FMT_REF_REGEX.test(line)

const loadFileContent = (line, opts) => {
  const basePath = opts.mikroways.basePath
  const filePath = line.match(FILE_REF_REGEX)[1]
  try {
  return doProcess(readFileSync(path.join(basePath, filePath), 'utf8'), opts)
  }catch(err) {
    console.log(`Error loading new file from ${path.join(basePath, filePath)} at ${line.match(FILE_REF_REGEX)[0]}`)
    if (opts.mikroways.debug) console.log(err)
    return line
  }
}

const loadCodeFileContent = (line, opts) => {
    const basePath = path.join(opts.mikroways.basePath, opts.mikroways.codePath)
    const filePath = line.match(CODE_FILE_REF_REGEX)[1]
    const args = line.match(CODE_FILE_REF_REGEX)[2]
  try{
    const code = readFileSync(path.join(basePath, filePath), 'utf8')

    return codeTemplate(code, args)
  } catch(err) {
    console.log(`Error loading code file from ${path.join(basePath, filePath)} at ${line.match(CODE_FILE_REF_REGEX)[0]}`)
    if (opts.mikroways.debug) console.log(err)
    return line
  }
}

const slideFormatReference = (line, opts) => {
  const style = line.match(SLIDE_FMT_REF_REGEX)[1]
  const extra = (line.match(SLIDE_FMT_REF_REGEX)[2] || '').trim()
  const formats = (opts.mikroways || {}).formats
  if (!formats) {
    console.error('Slide formats not defined! Please set mikroways.formats')
    return extra.length > 0? `<!-- .slide: ${extra} -->` : ''
  }
  if (formats[style]) {
    let fmt =`<!-- .slide: ${formats[style]} ${extra} -->`
    return fmt
  }else {
    console.error(`Slide format not recognized: ${style}`)
    return extra.length > 0? `<!-- .slide: ${extra} -->` : ''
  }
}

const doProcess = (markdown, opts) => {
  opts.mikroways = Object.assign(
    {
      debug: false,
      basePath: 'src',
      codePath: 'code',
      formats: {
        'main': 'class="main-cover" data-transition="zoom"',
        'new-topic': 'class="dark-logo-left" data-transition="zoom"',
        'new-topic-center': 'class="dark-logo-center" data-transition="zoom"'
      }
    },
    opts.mikroways || {})
  if (opts.mikroways.debug) console.log(opts)
  try {
    return markdown
          .split(LINE_SEPARATOR)
          .map(line => {
            if (isFileReference(line)) line = loadFileContent(line, opts);
            if (isSlideFormatReference(line)) line = slideFormatReference(line,opts);
            if (isCodeFileReference(line)) line = loadCodeFileContent(line, opts)
            return line
          })
          .join(LINE_SEPARATOR)
  }catch(err) {
    console.error(err)
    return markdown
  }
}

const preprocess = (markdown, opts) => {
  return new Promise((resolve, reject) => {
    return resolve(doProcess(markdown, opts))
  });
}

module.exports = preprocess
