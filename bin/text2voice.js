#!/usr/bin/env node
require('axios-debug-log')({
  request: function (debug, config) {
    const axios = require('axios')
    var url = axios.getUri(config)
    debug(`Request ${url}\n  headers:${config.headers}\n  data:${JSON.stringify(config.data)}`);
  }
})

const minimist = require('minimist'),
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
                    }),
    textFiles = opts._.slice(2),
    key   = opts['api-key'] ? opts['api-key']: process.env.ELEVEN_API_KEY;
    voice = opts.voice,
    model = opts.model,
    force = opts.force,
    voiceSpeakerBoost     = opts['voice-speacker-boost'],
    voiceStability        = opts['voice-stability'],
    voiceSimilarityBoost  = opts['voice-similarity-boost'],
    voiceStyle            = opts['voice-sstyle'];

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
  console.error(`Error: ${msg}`);
  help();
  process.exit(2);
}

async function waitFor(seconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(".");
      resolve();
    }, seconds*1000);
  });
}

async function waitForSync(seconds) {
  await waitFor(seconds);
}

async function text2voice(el, opts) {
  return new Promise( (r,e) => {
      el.textToSpeech(opts).then(
        (ok) => {
          r(ok);
        },
        (fail) => e(fail));
  });
}

async function text2voiceSync(textFiles, el, opts) {
  for (const file of textFiles) {
      let audioFile = file.replace(/\.(text|txt)$/i, "").concat(`-${voice}.mp3`);
      let audioIsNewer = fs.existsSync(audioFile) &&
        ( fs.statSync(audioFile).mtimeMs > fs.statSync(file).mtimeMs );
      if (!force && audioIsNewer) console.error(`Skiping file: ${file} because ${audioFile} is newewer. User -f to force`);
      else {
        waitForSync(2);
        let res = await text2voice(el,Object.assign({
          fileName: audioFile,
          textInput: fs.readFileSync(file,'utf8'),
        },opts));
        if (res.status.toLowerCase() == 'ok') console.log('Y');
        else console.log('N');
      }
    }
}

if (opts.help) {
  help();
  process.exit(0);
}

if (!key) error("API key must be set");

var el = new ElevenLabs({ apiKey: key });

if (voice && ['?','help'].includes(voice.toLowerCase()) ) {
  el.getVoices().then((res) => {
      console.log("================================================================");
      console.log("Voices");
      console.log("----------------------------------------------------------------");
      console.log(res.voices.map(e => `${e.voice_id}: ${e.name}`).join('\n'));
      process.exit(0);
  });
}else {
  if (model && ['?','help'].includes(model.toLowerCase()) ) {
    el.getModels().then((res) => {
        console.log("================================================================");
        console.log("Models");
        console.log("----------------------------------------------------------------");
        console.log(res.map(e => `${e.model_id}: ${e.name}`).join('\n'));
        process.exit(0);
    });
  }
  else {
    if (!voice && model) error("voice must be set");
    if (!model) error("model must be set");

    el.getVoiceSettings({voiceId: voice}).then( settings => {
      let voiceSettings = {};
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
    }).then( voiceSettings => {
        waitForSync(1);
        textFiles.forEach( t => {
          let g = globSync(t,{});
          text2voiceSync(g, el, Object.assign({
                voiceId: voice,
                modelId: model
              },voiceSettings));
        })
    });
  }
}
