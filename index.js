const { sendData, SingleNodeClient, Converter, retrieveData } = require("@iota/iota.js");
const crypto = require("crypto");
const cryptico = require("cryptico");

const client = new SingleNodeClient("https://chrysalis-nodes.iota.org");


function getKeyPair(seed) {
  const privKey = cryptico.generateRSAKey(seed, 1024);
  const pubKey = cryptico.publicKeyString(privKey);
  const address = crypto.createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 48);
  return {
    privKey,
    pubKey,
    address,
  }
}

async function sendMessage(obj, id) {
  const index = Converter.utf8ToBytes(id);
  const body = Converter.utf8ToBytes(JSON.stringify(obj));
  const message = await sendData(client, index, body);
  return message.messageId;
}

async function getMessages(seed) {
  const keyPair = getKeyPair(seed);
  const id = keyPair.address;
  const index = Converter.utf8ToBytes(id);
  const found = await client.messagesFind(index);
  const messageIds = found.messageIds;
  let messages = [];
  for (const messageId of messageIds) {
    const message = await retrieveData(client, messageId);
    const metadata = await client.messageMetadata(messageId);
    const milestoneIndex = metadata.referencedByMilestoneIndex;
    const data = JSON.parse(Converter.bytesToUtf8(message.data));
    messages.push({data, milestoneIndex});
  }
  messages.sort((a, b) => {
    if (!a.milestoneIndex) {
      return -1;
    }
    if (!b.milestoneIndex) {
      return 1;
    }
    if (a.milestoneIndex > b.milestoneIndex) {
      return 1;
    }
    return -1;
  });
  messages = messages.map(message => {
    return message.data;
  });
  messages.filter(message => {
    const key = cryptico.publicKeyFromString(keyPair.pubKey);
    return key.verifyString(message.backup, message.sig);
  });
  return messages;
}

async function sendPubKey(seed) {
  const keyPair = getKeyPair(seed);
  return await sendMessage({ keyPair.pubKey }, keyPair.address);
}


async function saveHashOfBackup(hash, seed) {
  const keyPair = getKeyPair(seed);
  const sig = keyPair.signString(hash, "sha256");
  return await sendMessage({ backup: hash, sig }, keyPair.address);
}

async function getNewestHashOfBackup(seed) {
  const messages = await getMessages(seed);
  const last = messages[messages.length - 1];
  return last.backup;
}

module.exports = {
  saveHashOfBackup,
  getNewestHashOfBackup,
}
