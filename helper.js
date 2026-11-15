function dataToBind (data, databindings) {
  for (const prop in databindings) {
    if (databindings.hasOwnProperty(prop)) {
      data = data.split(`\${${prop}}`).join(databindings[prop]);
    }
  }
  return data;
};

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
    dataToBind,
    escapeHtml
};
