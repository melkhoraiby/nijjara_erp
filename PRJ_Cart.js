// Project cart and checkout
// Key functions: createCart, addToCart, updateCartLine, removeCartLine, getCart, checkoutCart

function createCart(sessionId, user) {
  cacheSet('CART_' + sessionId, { lines: [], user: user, created: new Date() });
  return { success: true };
}

function addToCart(sessionId, lineItem) {
  var cart = cacheGet('CART_' + sessionId) || { lines: [] };
  cart.lines.push(lineItem);
  cacheSet('CART_' + sessionId, cart);
  return { success: true };
}

function updateCartLine(sessionId, lineId, qty) {
  var cart = cacheGet('CART_' + sessionId);
  if (!cart) return { error: { code: 'NOT_FOUND' } };
  var line = cart.lines.find((l) => l.Line_ID === lineId);
  if (line) line.Qty = qty;
  cacheSet('CART_' + sessionId, cart);
  return { success: true };
}

function removeCartLine(sessionId, lineId) {
  var cart = cacheGet('CART_' + sessionId);
  if (!cart) return { error: { code: 'NOT_FOUND' } };
  cart.lines = cart.lines.filter((l) => l.Line_ID !== lineId);
  cacheSet('CART_' + sessionId, cart);
  return { success: true };
}

function getCart(sessionId) {
  return cacheGet('CART_' + sessionId) || { lines: [] };
}

function checkoutCart(sessionId, projectId, user) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cart = cacheGet('CART_' + sessionId);
    if (!cart || !cart.lines.length) return { error: { code: 'EMPTY_CART' } };
    var costIds = [],
      financeIds = [];
    cart.lines.forEach((line) => {
      var costData = {
        Project_ID: projectId,
        Date: formatISODate(new Date()),
        Category: 'Material - Direct',
        Description: line.Description || '',
        Amount: (Number(line.Qty) * Number(line.Unit_Price)).toFixed(2),
        Material_ID: line.Material_ID,
        Unit: line.Unit,
        Qty: line.Qty,
        Unit_Price: line.Unit_Price,
      };
      var costResult = createCost(costData, user);
      if (costResult.success) costIds.push(costResult.Cost_ID);
      // Optionally: call PRJ_FinanceBridge.createDirectExpenseFromCart(costData)
      // financeIds.push(...)
    });
    reconcileProjectTotals(projectId);
    cacheSet('CART_' + sessionId, { lines: [] });
    logAction(user.User_ID, 'CHECKOUT', 'Cart checkout for project: ' + projectId, {
      costIds,
      financeIds,
    });
    return { success: true, createdCosts: costIds, financeIds: financeIds };
  } finally {
    lock.releaseLock();
  }
}
