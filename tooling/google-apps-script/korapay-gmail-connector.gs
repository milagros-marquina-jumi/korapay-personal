const CONFIG = {
  apiUrl: 'https://API_KORAPAY/api/v1/email-ingestion/messages',
  testUrl: 'https://API_KORAPAY/api/v1/email-ingestion/test',
  sourceEmail: 'TU_CORREO@gmail.com',
  bankLabel: 'KoraPay/Bancos',
  processedLabel: 'KoraPay/Procesado',
  maxThreadsPerRun: 100,
  lookbackDays: 30,
  messageDelayMs: 600,
};

function getToken_() {
  const token = PropertiesService.getScriptProperties().getProperty('KORAPAY_INGESTION_TOKEN');
  if (!token) {
    throw new Error('Falta KORAPAY_INGESTION_TOKEN en las propiedades del script.');
  }
  return token;
}

function getOrCreateLabel_(name) {
  return GmailApp.getUserLabelByName(name) || GmailApp.createLabel(name);
}

function setupKoraPay() {
  getOrCreateLabel_(CONFIG.bankLabel);
  getOrCreateLabel_(CONFIG.processedLabel);
  try {
    getToken_();
    Logger.log('Configuracion correcta. Etiquetas listas y token presente.');
  } catch (e) {
    Logger.log('Etiquetas creadas, pero falta el token: ' + e.message);
  }
}

function testKoraPayConnection() {
  const res = UrlFetchApp.fetch(CONFIG.testUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getToken_(), 'ngrok-skip-browser-warning': 'true' },
    muteHttpExceptions: true,
    payload: JSON.stringify({}),
  });
  Logger.log('HTTP ' + res.getResponseCode() + ': ' + res.getContentText());
}

function sendMessageToKoraPay_(message) {
  const payload = {
    provider: 'GMAIL_APPS_SCRIPT',
    providerMessageId: message.getId(),
    providerThreadId: message.getThread().getId(),
    sourceEmail: CONFIG.sourceEmail,
    sender: message.getFrom(),
    subject: message.getSubject(),
    receivedAt: message.getDate().toISOString(),
    textBody: message.getPlainBody().slice(0, 50000),
  };
  const res = UrlFetchApp.fetch(CONFIG.apiUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getToken_(), 'ngrok-skip-browser-warning': 'true' },
    muteHttpExceptions: true,
    payload: JSON.stringify(payload),
  });
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    Logger.log(
      'Fallo envio mensaje ' + message.getId() + ' (' + message.getSubject() + '): HTTP ' + code + ' ' + res.getContentText().slice(0, 300)
    );
  }
  return code >= 200 && code < 300;
}

function buildBankLabelQuery_() {
  const prefix = CONFIG.bankLabel + '/';
  const nested = GmailApp.getUserLabels()
    .map(function (l) {
      return l.getName();
    })
    .filter(function (name) {
      return name === CONFIG.bankLabel || name.indexOf(prefix) === 0;
    });
  const clauses = nested.map(function (name) {
    return 'label:"' + name + '"';
  });
  if (clauses.length === 0) clauses.push('label:"' + CONFIG.bankLabel + '"');
  return '{' + clauses.join(' ') + '}';
}

function syncKoraPayBankEmails() {
  const processed = getOrCreateLabel_(CONFIG.processedLabel);
  const query =
    buildBankLabelQuery_() + ' -label:"' + CONFIG.processedLabel + '" newer_than:' + CONFIG.lookbackDays + 'd';
  const threads = GmailApp.search(query, 0, CONFIG.maxThreadsPerRun);
  var ok = 0;
  var failed = 0;
  var totalMessages = 0;
  var okMessages = 0;
  threads.forEach(function (thread) {
    try {
      var messages = thread.getMessages();
      totalMessages += messages.length;
      var threadOk = 0;
      messages.forEach(function (message) {
        if (sendMessageToKoraPay_(message)) {
          okMessages++;
          threadOk++;
        }
        Utilities.sleep(CONFIG.messageDelayMs);
      });
      if (threadOk > 0) {
        thread.addLabel(processed);
        ok++;
        if (threadOk < messages.length) {
          Logger.log(
            'Hilo parcial (' + threadOk + '/' + messages.length + '): ' + thread.getFirstMessageSubject()
          );
        }
      } else {
        failed++;
        Logger.log('Hilo fallido (0/' + messages.length + '): ' + thread.getFirstMessageSubject());
      }
    } catch (e) {
      failed++;
      Logger.log('Error en hilo: ' + e.message);
    }
  });
  Logger.log(
    'Sincronizacion terminada. Hilos OK: ' + ok +
    ', con error: ' + failed +
    ', mensajes OK: ' + okMessages + '/' + totalMessages
  );
}

function createKoraPayTrigger() {
  removeKoraPayTriggers();
  ScriptApp.newTrigger('syncKoraPayBankEmails').timeBased().everyMinutes(15).create();
  Logger.log('Trigger creado: cada 15 minutos.');
}

function removeKoraPayTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncKoraPayBankEmails') {
      ScriptApp.deleteTrigger(t);
    }
  });
}
