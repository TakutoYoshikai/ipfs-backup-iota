const expect = require("expect");
const {
  saveHashOfBackup,
  getNewestHashOfBackup,
  sendMessage,
  getKeyPair,
} = require("./index");

test("post and get hash of backup", async () => {
  const r = Math.floor(Math.random() * 1000000).toString();
  const seed = "user" + r;
  const keyPair = getKeyPair(seed);
  await sendMessage({ backup: "hash1", sig: "wrongsig" }, keyPair.address);
  let hash = await getNewestHashOfBackup(seed);
  expect(hash).toEqual(null);
  await saveHashOfBackup("hash2", seed);
  hash = await getNewestHashOfBackup(seed);
  expect(hash).toEqual("hash2");
});
