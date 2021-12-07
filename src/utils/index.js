function toBase64(value) {
  const valueInString = typeof value !== "string" ? value.toString() : value;

  return Buffer.from(valueInString, "utf8").toString("base64");
}

function toUTF8(value) {
  return Buffer.from(value, "base64").toString("utf8");
}

exports.toBase64 = toBase64;
exports.toUTF8 = toUTF8;
