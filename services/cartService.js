// Servicio de carrito y estado de usuario en memoria
const users = {};

function getUserState(user_id) {
  if (!users[user_id]) {
    users[user_id] = { step: 'start', cart: [], cart_count: 0 };
  }
  return users[user_id];
}

function addToCart(user_id, product) {
  const user = getUserState(user_id);
  user.cart.push(product);
  user.cart_count = user.cart.length;
}

function resetCart(user_id) {
  if (users[user_id]) {
    users[user_id].step = 'start';
    users[user_id].cart = [];
    users[user_id].cart_count = 0;
  }
}

module.exports = {
  getUserState,
  addToCart,
  resetCart,
  users, // para debug o logs
};
