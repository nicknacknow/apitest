let commands = {};

exports.addFunction = function (name, func) {
  commands[name] = func;
};

exports.handleCommand = async function (req, res) {
  let command = req.params.command;

  if (commands[command]) {
    return res.send(await (commands[command](req.query)));
  }
  
  res.end(command);
};