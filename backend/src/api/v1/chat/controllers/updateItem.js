const { updateChat } = require("../../../../lib/chat");

const updateItem = async (req, res, next) => {
  const id = req.params.id;

  try {
    await updateChat(id, req.body);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

module.exports = updateItem;
