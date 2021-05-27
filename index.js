const { sendData, SingleNodeClient, Converter, retrieveData } = require("@iota/iota.js");

const client = new SingleNodeClient("https://chrysalis-nodes.iota.org");

async function sendMessage(obj, id) {
  const index = Converter.utf8ToBytes(id);
  const body = Converter.utf8ToBytes(JSON.stringify(obj));
  const message = await sendData(client, index, body);
  return message.messageId;
}

async function getMessages(id) {
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
  return messages;
}

async function saveHashOfBackup(hash, id) {
  return await sendMessage({ backup: hash }, id);
}

async function getNewestHashOfBackup(id) {
  const messages = await getMessages(id);
  const last = messages[messages.length - 1];
  return last.backup;
}

module.exports = {
  saveHashOfBackup,
  getNewestHashOfBackup,
}
