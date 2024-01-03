#!/usr/bin/env node
require('axios-debug-log')({
  request: function (debug, config) {
    const axios = require('axios')
    var url = axios.getUri(config)
    debug(`Request ${url}\n  headers:${config.headers}\n  data:${JSON.stringify(config.data)}`);
  }
})


const minimist = require('minimist'),
      chalk = require('chalk'),
      ElevenLabs = require("elevenlabs-node"),
      fs = require('fs'),
      {
          glob,
          globSync,
          globStream,
          globStreamSync,
          Glob,
      } = require('glob')



var opts = minimist(process.argv, {
                        boolean: ['force', 'help'],
                        string: [
                          'voice-stability',
                          'voice-similarity-boost',
                          'voice-style',
                          'voice-speacker-boost',
                        ],
                        defaults: {
                          force: false
                        },
                        alias: {
                              "api-key": 'k',
                              voice: 'v',
                              model: 'm',
                              force: 'f',
                              help: 'h'
                            }
                    });

function help() {
  console.error("text2voice [opts] input-file1.text input-file2.text");
  console.error("Options:");
  console.error("  --api-key | -k key");
  console.error("  --api-key | -k key");
  console.error("  --force   | -f Force audio generation when is not needed");
  console.error("  --voice   | -v voiceId. Use help to list available voices");
  console.error("  --model   | -m modelId. Use help to list available models");
  console.error("  --voice-stability Number. Override voice default value");
  console.error("  --voice-similarity-boost Number. Override voice default value");
  console.error("  --voice-style Number. Override voice default value");
  console.error("  --voice-speacker-boost true|false. Override voice default value");
}

function error(msg) {
  console.error(chalk.red(`Error: ${msg}`));
  help();
  process.exit(2);
}

async function listVoices(el) {
  let res = await el.getVoices();
  console.log(chalk.yellow("\nVoices"));
  console.log('\n');
  console.log(res.voices.map(e => 
    chalk.green(`${e.voice_id}: `) + chalk.white(`${e.name}`)).join('\n'));
}
async function listModels(el) {
  let res = await el.getModels();
  console.log(chalk.yellow("\nModels"));
  console.log(res.map(e => 
    chalk.green(`${e.model_id}: `)+ chalk.white(`${e.name}`)).join('\n'));
}

async function getVoiceSettings(el, voice) {
  let voiceSettings ={},
      settings = await el.getVoiceSettings({voiceId: voice});
  voiceSettings.stability =
    Number(voiceStability !== undefined ?
      voiceStability : settings.stability);
  voiceSettings.similarityBoost =
    Number(voiceSimilarityBoost !== undefined ?
      voiceSimilarityBoost : settings.similarity_boost);
  voiceSettings.style =
    Number(voiceStyle !== undefined ?
      voiceStyle : settings.style);
  voiceSettings.speackerBoost =
    Boolean(voiceSpeakerBoost !== undefined ?
      voiceSpeakerBoost : settings.use_speaker_boost);
  return voiceSettings;
}

async function textfile2audiofile({el, file, voiceSettings, force}) {
  let audioFile = file.replace(/\.(text|txt)$/i, "").concat(`-${voice}.mp3`);
  let audioIsNewer = fs.existsSync(audioFile) && 
    ( fs.statSync(audioFile).mtimeMs > fs.statSync(file).mtimeMs );
  if (!force && audioIsNewer) return console.error(
    chalk.cyan(`Skipping file: ${file}. User -f to force`));
  // Patch to avoid log errors from elevenlabs module
  let disabledLogger = console.log;
  console.log = function() {};
  let res = await el.textToSpeech(Object.assign({
                fileName: audioFile,
                textInput: fs.readFileSync(file,'utf8')
              },voiceSettings));
  // Restore logger;
  console.log = disabledLogger;
   if (res && res.status && res.status.toLowerCase() == 'ok') console.log(chalk.bgGreen.bold(`OK: `)+chalk.green(file));
   else console.log(chalk.gbRed.bold(`ERROR: `)+chalk.red(file));
}

async function start(opts) {
  let textFiles = opts._.slice(2),
      key   = opts['api-key'] ? opts['api-key']: process.env.ELEVEN_API_KEY;
      voice = opts.voice,
      model = opts.model,
      force = opts.force,
      voiceSpeakerBoost     = opts['voice-speacker-boost'],
      voiceStability        = opts['voice-stability'],
      voiceSimilarityBoost  = opts['voice-similarity-boost'],
      voiceStyle            = opts['voice-sstyle'];

    if (opts.help) {
      help();
      process.exit(0);
    }

    if (!key) error("API key must be set");

    let el = new ElevenLabs({ apiKey: key });

    if (voice && ['?','help'].includes(voice.toLowerCase()) ) await listVoices(el);
    if (model && ['?','help'].includes(model.toLowerCase()) ) await listModels(el);
    /* When listVoices or listModels are called, we shalle exit */
    if (
        (voice && ['?','help'].includes(voice.toLowerCase())) ||
        (model && ['?','help'].includes(model.toLowerCase())) 
        ) process.exit(0);

    /* Check if model and voice are set */
    if (!voice && model) error("voice must be set");
    if (!model) error("model must be set");

    /* Get default VoiceSettings */
    let voiceSettings = await getVoiceSettings(el, voice);
    
        /* Foreach textFile (maybe glob or file, do */
    for (const t of textFiles) {
      let g = globSync(t,{});
      for (const file of g) await textfile2audiofile({
            el: el, 
            file: file, 
            voiceSettings: Object.assign(voiceSettings, {
                voiceId: voice,
                modelId: model
              }),
            force: force });
    }
}

start(opts);
